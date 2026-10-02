<?php
/**
 * api/notifications/read.php
 *
 * POST /api/notifications/read.php
 *
 * Body: { id? }   -- omit `id` (or send all=1) to mark everything read.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$input = ulink_input();
$id    = ulink_input_int($input, 'id');
$all   = ulink_input_bool($input, 'all');

if ($id === null && !$all) {
    // Default to "mark all read" so the panel's "Mark all as read" button works
    // even if the client forgets the flag.
    $all = true;
}

$unreadBefore = ulink_unread_notification_count($userId);

if ($all) {
    Database::run(
        'UPDATE notifications SET is_read = 1 WHERE user_id = :me AND is_read = 0',
        ['me' => $userId]
    );
} else {
    // Scoped to the caller: a crafted id cannot mark somebody else's
    // notification as read.
    $affected = Database::run(
        'UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :me',
        ['id' => $id, 'me' => $userId]
    )->rowCount();

    if ($affected === 0) {
        // Already read, or not the caller's notification. Not an error.
        ulink_ok(['message' => 'Nothing to update.', 'unread' => $unreadBefore]);
    }
}

$unreadAfter = ulink_unread_notification_count($userId);

ulink_ok([
    'message' => $all ? 'All notifications marked as read.' : 'Notification marked as read.',
    'unread'  => $unreadAfter,
    'marked'  => max(0, $unreadBefore - $unreadAfter),
]);
