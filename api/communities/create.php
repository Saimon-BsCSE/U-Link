<?php
/**
 * api/communities/create.php
 *
 * POST /api/communities/create.php
 *
 * Body: { name, description?, is_private?, pic?, cover? }
 *
 * `pic` and `cover` accept a base64 data URI (an uploaded file) or a remote
 * URL. The creator is inserted as an admin member so the group has someone who
 * can moderate it from the moment it exists.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$input = ulink_input();

$name = trim(ulink_input_str($input, 'name'));
if (mb_strlen($name) < 3) {
    ulink_fail('Give your community a name of at least 3 characters.', 422);
}
if (mb_strlen($name) > 160) {
    ulink_fail('Community names are limited to 160 characters.', 422);
}
$name = ulink_plain_text($name, 160);

$description = ulink_plain_text(ulink_input_str($input, 'description'), 1000);
$isPrivate = ulink_input_bool($input, 'is_private', false) || ulink_input_bool($input, 'isPrivate', false);

$pic   = ulink_store_entity_image($input['pic'] ?? null, 'communities');
$cover = ulink_store_entity_image($input['cover'] ?? null, 'communities');

// A readable, unique slug. The name is free text, so anything that is not a
// letter or digit collapses to a hyphen.
$slugBase = strtolower((string) preg_replace('/[^a-z0-9]+/i', '-', $name));
$slugBase = trim($slugBase, '-');
if ($slugBase === '') {
    $slugBase = 'community';
}
$slug = $slugBase;
$suffix = 2;
while (Database::fetchValue('SELECT id FROM communities WHERE slug = :s LIMIT 1', ['s' => $slug]) !== null) {
    $slug = $slugBase . '-' . $suffix++;
}

try {
    $communityId = Database::insert('communities', [
        'slug'        => $slug,
        'name'        => $name,
        'description' => $description,
        'icon'        => 'group',
        'pic'         => $pic,
        'cover_pic'   => $cover,
        'is_private'  => $isPrivate ? 1 : 0,
        'created_by'  => $userId,
    ]);

    Database::run(
        'INSERT INTO community_members (community_id, user_id, role) VALUES (:c, :u, :r)',
        ['c' => $communityId, 'u' => $userId, 'r' => 'admin']
    );
} catch (DatabaseConstraintException $e) {
    if ($pic !== null && str_starts_with($pic, 'uploads/')) {
        ulink_delete_upload($pic);
    }
    if ($cover !== null && str_starts_with($cover, 'uploads/')) {
        ulink_delete_upload($cover);
    }
    ulink_fail('A community with that name already exists.', 409);
} catch (DatabaseException $e) {
    ulink_log_error('Community create failed: ' . $e->getMessage(), $e);
    if ($pic !== null && str_starts_with($pic, 'uploads/')) {
        ulink_delete_upload($pic);
    }
    if ($cover !== null && str_starts_with($cover, 'uploads/')) {
        ulink_delete_upload($cover);
    }
    ulink_fail('Could not create the community right now. Please try again.', 503);
}

ulink_log_activity('community_created', ['community_id' => $communityId, 'private' => $isPrivate], $userId);

$row = Database::fetchOne(
    'SELECT c.id, c.name, c.description, c.icon, c.pic, c.cover_pic, c.is_private, c.created_at,
            (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id) AS member_count
       FROM communities c
      WHERE c.id = :id
      LIMIT 1',
    ['id' => $communityId]
);

ulink_ok([
    'message'   => 'Community created.',
    'community' => ulink_community_public($row ?? [], $userId),
], 201);
