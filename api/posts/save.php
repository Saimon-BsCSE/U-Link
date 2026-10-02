<?php
/**
 * api/posts/save.php
 *
 * POST /api/posts/save.php
 *
 * Body: { postId }
 *
 * Toggles the caller's bookmark on a post. The response always states the
 * resulting state (`saved`) so the caller can paint the menu without a second
 * read. A post that is already bookmarked is un-bookmarked, which makes the
 * endpoint idempotent from the button's point of view.
 *
 * The original app had no way to keep a post, so anything worth revisiting had
 * to be liked (which notified the author) or searched for again.
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
    'SELECT id, community_id FROM posts WHERE id = :id LIMIT 1',
    ['id' => $postId]
);

if ($post === null) {
    ulink_fail('That post no longer exists.', 404);
}

// A private community's posts are not bookmarkable by an outsider. This mirrors
// the read gate in posts/fetch.php rather than trusting that the caller saw the
// post in a feed.
$communityId = isset($post['community_id']) ? (int) $post['community_id'] : 0;
if ($communityId > 0) {
    $isPrivate = Database::fetchValue(
        'SELECT is_private FROM communities WHERE id = :id LIMIT 1',
        ['id' => $communityId]
    );
    if ((int) $isPrivate === 1 && !ulink_is_community_member($communityId, $userId)) {
        ulink_fail('This community is private.', 403);
    }
}

$alreadySaved = Database::fetchValue(
    'SELECT 1 FROM saved_posts WHERE user_id = :u AND post_id = :p LIMIT 1',
    ['u' => $userId, 'p' => $postId]
) !== null;

if ($alreadySaved) {
    Database::run(
        'DELETE FROM saved_posts WHERE user_id = :u AND post_id = :p',
        ['u' => $userId, 'p' => $postId]
    );

    ulink_log_activity('post_saved', ['post_id' => $postId, 'saved' => false], $userId);

    ulink_ok([
        'message' => 'Removed from your saved posts.',
        'saved'   => false,
        'postId'  => $postId,
    ]);
}

try {
    Database::run(
        'INSERT INTO saved_posts (user_id, post_id) VALUES (:u, :p)',
        ['u' => $userId, 'p' => $postId]
    );
} catch (DatabaseConstraintException $e) {
    // Two clicks raced and the composite primary key kept it to a single row;
    // the end state the caller cares about is still "saved".
    ulink_ok([
        'message' => 'Saved to your posts.',
        'saved'   => true,
        'postId'  => $postId,
    ]);
}

ulink_log_activity('post_saved', ['post_id' => $postId, 'saved' => true], $userId);

ulink_ok([
    'message' => 'Saved to your posts.',
    'saved'   => true,
    'postId'  => $postId,
], 201);
