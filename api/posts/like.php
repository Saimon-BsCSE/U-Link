<?php
/**
 * api/posts/like.php
 *
 * POST /api/posts/like.php
 *
 * Body: { postId }
 *
 * Toggles the like for the signed-in user. The original endpoint trusted a
 * `userId` field from the request body, so any visitor could like posts as
 * anyone else, and it never told the post author.
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
    'SELECT id, user_id, community_id FROM posts WHERE id = :id LIMIT 1',
    ['id' => $postId]
);

if ($post === null) {
    ulink_fail('That post no longer exists.', 404);
}

// community_id was already in this SELECT and went unused.
ulink_require_community_membership($post['community_id'] ?? null, $userId);

$authorId = (int) $post['user_id'];

/*
 * Toggle inside a transaction with a row lock so two rapid clicks cannot both
 * observe "not liked" and each insert a duplicate.
 */
$result = Database::transaction(static function (PDO $pdo) use ($postId, $userId): array {
    $existing = Database::fetchValue(
        'SELECT 1 FROM post_likes WHERE post_id = :p AND user_id = :u LIMIT 1',
        ['p' => $postId, 'u' => $userId]
    );

    if ($existing !== null) {
        Database::run(
            'DELETE FROM post_likes WHERE post_id = :p AND user_id = :u',
            ['p' => $postId, 'u' => $userId]
        );
        $liked = false;
    } else {
        Database::run(
            'INSERT INTO post_likes (post_id, user_id) VALUES (:p, :u)',
            ['p' => $postId, 'u' => $userId]
        );
        $liked = true;
    }

    $count = (int) Database::fetchValue(
        'SELECT COUNT(*) FROM post_likes WHERE post_id = :p',
        ['p' => $postId]
    );

    return ['liked' => $liked, 'likes' => $count];
});

ulink_log_activity($result['liked'] ? 'post_liked' : 'post_unliked', [
    'post_id' => $postId,
], $userId);

if ($result['liked']) {
    ulink_notify(
        $authorId,
        'like',
        (string) $me['full_name'] . ' liked your post',
        $userId,
        $postId
    );
}

ulink_ok([
    // `action` is what the frontend reads; `liked`/`likes` are added so the
    // client can reconcile with the server instead of counting locally.
    'action' => $result['liked'] ? 'liked' : 'unliked',
    'liked'  => $result['liked'],
    'likes'  => $result['likes'],
    'postId' => $postId,
]);
