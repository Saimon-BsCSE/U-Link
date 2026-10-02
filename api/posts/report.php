<?php
/**
 * api/posts/report.php
 *
 * POST /api/posts/report.php
 *
 * Body: { postId, reason?, details? }
 *
 * Records a moderation report against a post. The reason is restricted to a
 * fixed set and one account may report a post once, so a double-click or a
 * script cannot flood the queue. Reporting is deliberately idempotent: a repeat
 * call succeeds and says the report already exists rather than erroring.
 *
 * The original app had no reporting path, so the only way to flag abuse was to
 * delete the post (if it was yours) or leave the platform.
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
    'SELECT id, user_id FROM posts WHERE id = :id LIMIT 1',
    ['id' => $postId]
);

if ($post === null) {
    ulink_fail('That post no longer exists.', 404);
}

if ((int) $post['user_id'] === $userId) {
    ulink_fail('You cannot report your own post.', 422);
}

$allowed = ['spam', 'harassment', 'misinformation', 'other'];
$reason  = strtolower(ulink_input_str($input, 'reason', 'other'));

if (!in_array($reason, $allowed, true)) {
    ulink_fail('Pick a valid report reason.', 422, ['allowed' => $allowed]);
}

$details = ulink_plain_text(ulink_input_str($input, 'details'), 500);

$existing = Database::fetchValue(
    'SELECT 1 FROM post_reports WHERE post_id = :p AND reporter_id = :u LIMIT 1',
    ['p' => $postId, 'u' => $userId]
) !== null;

if ($existing) {
    ulink_ok([
        'message'  => 'You have already reported this post.',
        'reported' => true,
        'already'  => true,
    ]);
}

try {
    Database::run(
        'INSERT INTO post_reports (post_id, reporter_id, reason, details)
         VALUES (:p, :u, :r, :d)',
        ['p' => $postId, 'u' => $userId, 'r' => $reason, 'd' => $details]
    );
} catch (DatabaseConstraintException $e) {
    ulink_ok([
        'message'  => 'You have already reported this post.',
        'reported' => true,
        'already'  => true,
    ]);
}

ulink_log_activity('post_reported', ['post_id' => $postId, 'reason' => $reason], $userId);

ulink_ok([
    'message'  => 'Thanks. Our moderators will review this post.',
    'reported' => true,
    'already'  => false,
    'reason'   => $reason,
], 201);
