<?php
/**
 * api/posts/comment.php
 *
 * POST /api/posts/comment.php
 *
 * Body: { postId, text }
 *
 * The original endpoint accepted `userId` from the request body, letting any
 * visitor comment as any account, and it never notified the post author.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$input  = ulink_input();
$postId = ulink_input_int($input, 'postId');
$text   = ulink_plain_text(ulink_input_str($input, 'text'), ULINK_COMMENT_MAX_CHARS);

if ($postId === null || $postId <= 0) {
    ulink_fail('A valid post id is required.', 422);
}

$rawText = is_string($input['text'] ?? null) ? trim($input['text']) : '';
if ($rawText === '') {
    ulink_fail('Write something before commenting.', 422);
}
if (mb_strlen($rawText) > ULINK_COMMENT_MAX_CHARS) {
    ulink_fail('Comments are limited to ' . ULINK_COMMENT_MAX_CHARS . ' characters.', 422);
}

$post = Database::fetchOne(
    'SELECT id, user_id, community_id FROM posts WHERE id = :id LIMIT 1',
    ['id' => $postId]
);

if ($post === null) {
    ulink_fail('That post no longer exists.', 404);
}

// A non-member must not be able to write into a community by commenting on it
// instead of posting to it.
ulink_require_community_membership($post['community_id'] ?? null, $userId);

$commentId = Database::insert('comments', [
    'post_id' => $postId,
    'user_id' => $userId,
    'content' => $text,
]);

$commentCount = (int) Database::fetchValue(
    'SELECT COUNT(*) FROM comments WHERE post_id = :p',
    ['p' => $postId]
);

ulink_log_activity('comment_added', [
    'post_id'    => $postId,
    'comment_id' => $commentId,
    'length'     => mb_strlen($text),
], $userId);

$snippet = mb_strlen($text) > 80 ? mb_substr($text, 0, 77, 'UTF-8') . '...' : $text;
ulink_notify(
    (int) $post['user_id'],
    'comment',
    (string) $me['full_name'] . ' commented: "' . $snippet . '"',
    $userId,
    $commentId
);

$name = (string) $me['full_name'];

ulink_ok([
    'message'  => 'Comment added.',
    'comments' => $commentCount,
    'comment'  => [
        'id'         => $commentId,
        'postId'     => $postId,
        'userId'     => $userId,
        'name'       => $name,
        'pic'        => ulink_avatar_url($me['profile_pic'], $name),
        'text'       => $text,
        'created_at' => gmdate('Y-m-d H:i:s'),
    ],
], 201);
