<?php
/**
 * api/auth/session.php
 *
 * GET /api/auth/session.php
 *
 * Returns the signed-in user together with the counters the shell UI needs on
 * first paint, so the frontend does not have to fire a second round of
 * requests before it can render the sidebar.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$user = ulink_current_user();

if ($user === null) {
    ulink_fail('No active session.', 401);
}

$userId = (int) $user['id'];

ulink_touch_session();

try {
    Database::update('users', ['last_seen_at' => gmdate('Y-m-d H:i:s')], $userId);
} catch (Throwable $e) {
    ulink_log_error('session.php last_seen_at update failed: ' . $e->getMessage(), $e);
}

$public = ulink_user_public($user, true);

$public['posts_count'] = (int) Database::fetchValue(
    'SELECT COUNT(*) FROM posts WHERE user_id = :id',
    ['id' => $userId]
);
$public['postsCount'] = $public['posts_count'];
$public['friends_count'] = ulink_friend_count($userId);
$public['friendsCount'] = $public['friends_count'];
$public['unread_notifications'] = ulink_unread_notification_count($userId);
$public['unread_messages'] = ulink_unread_message_count($userId);

ulink_ok(['user' => $public]);
