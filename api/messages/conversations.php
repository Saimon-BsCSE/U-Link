<?php
/**
 * api/messages/conversations.php
 *
 * GET /api/messages/conversations.php?limit=&offset=
 *
 * One row per conversation partner, most recently active first, with the last
 * message and the unread count.
 *
 * Three queries, whatever the size of the history.
 *
 * The obvious implementation - read the message table newest first, keep the
 * first row per peer, stop after $limit - is what this used to do, and it has
 * two problems that only show up on a real account. It loaded every message the
 * user has ever received or sent before discarding all but one per thread, so
 * the work grew without bound, and it applied the limit in PHP after the fact,
 * which meant `offset` was parsed, echoed back in nothing, and ignored: page 2
 * was page 1. It also ran one unread COUNT per thread.
 *
 * So the paging and the grouping now happen in SQL: MAX(id) per peer, ordered
 * and sliced, then the full rows and the unread totals are fetched in two more
 * round trips.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$pagination = ulink_pagination(
    ulink_query_int('limit', ULINK_PAGE_DEFAULT),
    ulink_query_int('offset', 0),
    ULINK_PAGE_MAX
);

/*
 * The "other participant" of a row, written as CASE rather than IF() so the
 * same SQL runs on the SQLite driver. Repeated in GROUP BY rather than aliased,
 * so this does not depend on either engine allowing aliases there.
 */
// The expression appears twice - once in the SELECT list, once in GROUP BY - so
// each copy gets its own placeholder. PDO will not reuse one named placeholder
// within a statement and rejects it with "Invalid parameter number".
$peerExpr = 'CASE WHEN m.sender_id = :peer_me_select THEN m.receiver_id ELSE m.sender_id END';
$peerGroupExpr = 'CASE WHEN m.sender_id = :peer_me_group THEN m.receiver_id ELSE m.sender_id END';

/*
 * Page over *threads*, not messages. Ids are monotonic, so the highest id in a
 * thread is its newest message.
 */
$page = Database::fetchAll(
    "SELECT MAX(m.id) AS last_id, $peerExpr AS peer_id
       FROM messages m
      WHERE m.sender_id = :me_b OR m.receiver_id = :me_c
      GROUP BY $peerGroupExpr
      ORDER BY MAX(m.id) DESC
      LIMIT :limit OFFSET :offset",
    [
        'peer_me_select' => $userId,
        'peer_me_group'  => $userId,
        'me_b'           => $userId,
        'me_c'           => $userId,
        // One row over the limit, so `has_more` is exact rather than a guess
        // from "did I fill the page". The spare row is dropped below.
        'limit'          => $pagination['limit'] + 1,
        'offset'         => $pagination['offset'],
    ]
);

$hasMore = count($page) > $pagination['limit'];
if ($hasMore) {
    array_pop($page);
}

if ($page === []) {
    ulink_ok([
        'conversations' => [],
        'contacts'      => [],
        'data'          => [],
        'count'         => 0,
        'unread'        => ulink_unread_message_count($userId),
        'limit'         => $pagination['limit'],
        'offset'        => $pagination['offset'],
        'has_more'      => false,
    ]);
}

$messageIds = array_map(static fn(array $r): int => (int) $r['last_id'], $page);
$placeholders = implode(', ', array_fill(0, count($messageIds), '?'));

/*
 * The peer columns are aliased away from the message columns on purpose. The
 * original version handed the whole joined row to ulink_user_public(), which
 * then read the *message* `created_at` as the account creation date and had no
 * `id` at all - every conversation row came back with `"id": 0`.
 */
$rows = Database::fetchAll(
    "SELECT m.id AS message_id, m.sender_id, m.receiver_id, m.message, m.is_read,
            m.created_at AS message_created_at,
            m.attachment_type, m.attachment_name, m.attachment_size,
            u.id AS peer_id, u.full_name, u.profile_pic, u.cover_pic, u.email,
            u.student_id, u.department, u.batch, u.bio, u.role, u.created_at,
            u.last_seen_at
       FROM messages m
       JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
      WHERE m.id IN ($placeholders)",
    array_merge([$userId], $messageIds)
);

// One query for every unread badge on the page, instead of one per thread.
$unreadRows = Database::fetchAll(
    'SELECT sender_id AS peer_id, COUNT(*) AS unread
       FROM messages
      WHERE receiver_id = :me AND is_read = 0
      GROUP BY sender_id',
    ['me' => $userId]
);

$unreadByPeer = [];
foreach ($unreadRows as $u) {
    $unreadByPeer[(int) $u['peer_id']] = (int) $u['unread'];
}

// Preserve the original ordering: newest activity first, id breaking the tie.
usort($rows, static function (array $a, array $b): int {
    $byTime = strcmp((string) $b['message_created_at'], (string) $a['message_created_at']);

    return $byTime !== 0 ? $byTime : ((int) $b['message_id'] <=> (int) $a['message_id']);
});

// One settings lookup for every peer on the page, so `show_online_status` is
// honoured without a query per conversation.
ulink_preload_user_settings(array_column($rows, 'peer_id'));

$conversations = [];

foreach ($rows as $row) {
    // Cast both sides: PDO hands back native ints for INT columns today, but a
    // string there would make this comparison silently pick the wrong peer.
    $peerId = (int) ((int) $row['sender_id'] === $userId
        ? $row['receiver_id']
        : $row['sender_id']);

    $name = (string) $row['full_name'];

    // ulink_user_public() reads `id`, so hand it a row keyed the way it expects.
    $peerRow = $row;
    $peerRow['id'] = $peerId;

    $attachmentType = isset($row['attachment_type']) ? (string) $row['attachment_type'] : '';
    $text = (string) $row['message'];

    // A picture- or document-only message has an empty body, which would
    // render as a blank conversation row. Say what was sent instead.
    // `lastMessage` is a plain string for the list renderer; `text` stays the
    // real body and the `attachment` block below carries the structured detail.
    $preview = $text;
    if ($preview === '' && $attachmentType === 'image') {
        $preview = 'Sent a photo';
    } elseif ($preview === '' && $attachmentType === 'file') {
        $preview = 'Sent a document';
    }

    $conversation = [
        'userId'     => $peerId,
        // A live chat partner is someone the user has chosen to talk to, so the
        // full row - the same courtesy ulink_friend_list() extends.
        'user'       => ulink_user_public($peerRow, true),
        'name'       => $name,
        'pic'        => ulink_avatar_url($row['profile_pic'], $name),
        'lastMessage'=> $preview,
        'text'       => $text,
        'unread'     => $unreadByPeer[$peerId] ?? 0,
        'online'     => ulink_user_is_online(['last_seen_at' => $row['last_seen_at']])
            && (int) ulink_user_setting($peerId, 'show_online_status', 1) === 1,
        'ts'         => $row['message_created_at'],
        'created_at' => $row['message_created_at'],
    ];

    if ($attachmentType !== '') {
        $conversation['attachment'] = [
            'type' => $attachmentType === 'image' ? 'image' : 'file',
            'name' => (string) ($row['attachment_name'] ?? ''),
            'size' => (int) ($row['attachment_size'] ?? 0),
        ];
    }

    $conversations[] = $conversation;
}

ulink_ok([
    'conversations' => $conversations,
    'contacts'      => $conversations,
    'data'          => $conversations,
    'count'         => count($conversations),
    'unread'        => ulink_unread_message_count($userId),
    'limit'         => $pagination['limit'],
    'offset'        => $pagination['offset'],
    'has_more'      => $hasMore,
]);