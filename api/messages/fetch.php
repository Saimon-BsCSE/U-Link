<?php
/**
 * api/messages/fetch.php
 *
 * GET /api/messages/fetch.php?userId=5&limit=50&markRead=1
 *
 * Returns one thread, oldest first, and optionally marks the incoming messages
 * as read.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$peerId = ulink_query_int('userId');
if ($peerId === null || $peerId <= 0) {
    ulink_fail('A valid user id is required.', 422);
}
if ($peerId === $userId) {
    ulink_fail('You cannot open a conversation with yourself.', 422);
}
if (!ulink_user_exists($peerId)) {
    ulink_fail('User not found.', 404);
}

$pagination = ulink_pagination(
    ulink_query_int('limit', 50),
    ulink_query_int('offset', 0),
    200
);

/*
 * Read the newest page but return it oldest-first, which is the order the chat
 * transcript renders in.
 */
$rows = Database::fetchAll(
    'SELECT id, sender_id, receiver_id, message, is_read, created_at,
            attachment_type, attachment_name, attachment_path,
            attachment_mime, attachment_size
       FROM messages
      WHERE (sender_id = :me_a AND receiver_id = :peer_a)
         OR (sender_id = :peer_b AND receiver_id = :me_b)
      ORDER BY created_at DESC, id DESC
      LIMIT :limit OFFSET :offset',
    [
        'me_a' => $userId, 'peer_a' => $peerId,
        'peer_b' => $peerId, 'me_b' => $userId,
        'limit'  => $pagination['limit'],
        'offset' => $pagination['offset'],
    ]
);

$messages = array_map(
    static fn(array $row): array => ulink_message_public($row, $userId),
    array_reverse($rows)
);

if (ulink_query_int('markRead', 1) === 1) {
    Database::run(
        'UPDATE messages SET is_read = 1, read_at = NOW()
          WHERE receiver_id = :me AND sender_id = :peer AND is_read = 0',
        ['me' => $userId, 'peer' => $peerId]
    );
}

$peerRow = Database::fetchOne(
    'SELECT id, student_id, full_name, email, profile_pic, cover_pic, department, batch,
            bio, role, last_seen_at
       FROM users WHERE id = :id LIMIT 1',
    ['id' => $peerId]
);

ulink_ok([
    'messages' => $messages,
    'data'     => $messages,
    'count'    => count($messages),
    'user'     => $peerRow ? ulink_user_public($peerRow, false) : null,
]);
