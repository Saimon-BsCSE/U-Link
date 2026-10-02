<?php
/**
 * api/posts/edit.php
 *
 * POST /api/posts/edit.php
 *
 * Body: { postId, text }
 *
 * Rewrites the text of a post the caller owns (or, like delete.php, an
 * administrator of the community it was posted in). The image is intentionally
 * not editable here: replacing a file needs the upload pipeline and a
 * committed-swap like api/users/update.php uses, which is a separate concern.
 *
 * The original app had no edit path at all, so a typo meant deleting the post
 * and losing every like and comment on it.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$input  = ulink_input();
$postId = ulink_input_int($input, 'postId');

if ($postId === null || $postId <= 0) {
    ulink_fail('A valid post id is required.', 422);
}

$post = Database::fetchOne(
    'SELECT id, user_id, community_id, content FROM posts WHERE id = :id LIMIT 1',
    ['id' => $postId]
);

if ($post === null) {
    ulink_fail('That post no longer exists.', 404);
}

$isOwner = (int) $post['user_id'] === $userId;
$isSiteAdmin = ulink_is_admin($me);
$isCommunityAdmin = $post['community_id'] !== null
    && ulink_is_community_admin((int) $post['community_id'], $userId);

if (!$isOwner && !$isSiteAdmin && !$isCommunityAdmin) {
    ulink_fail('You can only edit your own posts.', 403);
}

$rawText = ulink_input_str($input, 'text');
if (mb_strlen(trim($rawText)) > ULINK_POST_MAX_CHARS) {
    ulink_fail('Posts are limited to ' . ULINK_POST_MAX_CHARS . ' characters.', 422);
}

$content = ulink_plain_text($rawText, ULINK_POST_MAX_CHARS);

if ($content === '') {
    // An image-only post keeps a "(photo)" placeholder as its content, so an
    // empty edit is only legitimate when there is actually an image to fall
    // back on. Otherwise the card would render completely blank.
    $hasImage = Database::fetchOne(
        'SELECT image_url FROM posts WHERE id = :id LIMIT 1',
        ['id' => $postId]
    );
    if ($hasImage === null || trim((string) $hasImage['image_url']) === '') {
        ulink_fail('Write something before saving your changes.', 422);
    }
    $content = '(photo)';
}

if ($content === (string) $post['content']) {
    ulink_ok([
        'message' => 'Nothing to update.',
        'post'    => ['id' => (int) $post['id'], 'text' => $content],
    ]);
}

try {
    Database::update('posts', ['content' => $content], $postId);
} catch (DatabaseException $e) {
    ulink_log_error('Post edit failed: ' . $e->getMessage(), $e);
    ulink_fail('Could not save your changes. Please try again.', 503);
}

ulink_log_activity('post_edited', [
    'post_id' => $postId,
    'length'  => mb_strlen($content),
], $userId);

ulink_ok([
    'message' => 'Post updated.',
    'post'    => [
        'id'   => (int) $post['id'],
        'text' => $content,
    ],
]);
