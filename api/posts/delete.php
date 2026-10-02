<?php
/**
 * api/posts/delete.php
 *
 * POST /api/posts/delete.php
 *
 * Body: { postId }
 *
 * Removes a post the caller owns, an administrator, or an administrator of the
 * community the post was made in. The post's likes and comments go with it via
 * the ON DELETE CASCADE foreign keys; the image file on disk is deleted
 * explicitly because no foreign key can reach the filesystem.
 *
 * The original app had no delete path at all, so a mis-typed or accidental post
 * was permanent.
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
    'SELECT id, user_id, community_id, image_url FROM posts WHERE id = :id LIMIT 1',
    ['id' => $postId]
);

if ($post === null) {
    ulink_fail('That post no longer exists.', 404);
}

$authorId = (int) $post['user_id'];
$isOwner  = $authorId === $userId;
$isAdmin  = ulink_is_admin($me);

// A community admin moderates their own community's posts. This is deliberately
// narrower than the global-admin check: being an admin of one group must not
// hand out delete rights over posts in another.
$isCommunityAdmin = false;
$communityId = isset($post['community_id']) ? (int) $post['community_id'] : 0;
if (!$isOwner && !$isAdmin && $communityId > 0) {
    $role = Database::fetchValue(
        'SELECT role FROM community_members WHERE community_id = :c AND user_id = :u LIMIT 1',
        ['c' => $communityId, 'u' => $userId]
    );
    $isCommunityAdmin = $role === 'admin';
}

if (!$isOwner && !$isAdmin && !$isCommunityAdmin) {
    ulink_fail('You can only delete your own posts.', 403);
}

/*
 * Comment notifications point at the comment id, not the post id, so collect
 * the ids before the cascade removes the comments. Like notifications point at
 * the post directly.
 */
try {
    Database::run(
        "DELETE FROM notifications WHERE type = 'like' AND reference_id = :post",
        ['post' => $postId]
    );

    $commentIds = Database::fetchAll(
        'SELECT id FROM comments WHERE post_id = :post',
        ['post' => $postId]
    );

    if ($commentIds !== []) {
        $ids = array_map(static fn($r) => (int) $r['id'], $commentIds);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        Database::run(
            "DELETE FROM notifications WHERE type = 'comment' AND reference_id IN ({$placeholders})",
            $ids
        );
    }
} catch (Throwable $e) {
    // Notification cleanup is best effort; it must not block the delete.
    ulink_log_error('Post delete notification cleanup failed: ' . $e->getMessage(), $e);
}

try {
    Database::delete('posts', $postId);
} catch (DatabaseException $e) {
    ulink_log_error('Post delete failed: ' . $e->getMessage(), $e);
    ulink_fail('Could not delete that post. Please try again.', 503);
}

// Only now that the row is gone is it safe to drop the file it pointed at.
if (is_string($post['image_url'] ?? null) && str_starts_with($post['image_url'], 'uploads/')) {
    ulink_delete_upload($post['image_url']);
}

ulink_log_activity('post_deleted', [
    'post_id'      => $postId,
    'author_id'    => $authorId,
    'community_id' => $communityId > 0 ? $communityId : null,
    'moderated'    => !$isOwner,
], $userId);

ulink_ok([
    'message' => 'Post deleted.',
    'postId'  => $postId,
]);
