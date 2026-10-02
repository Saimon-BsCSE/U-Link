<?php
/**
 * api/bootstrap.php
 *
 * GET /api/bootstrap.php
 *
 * One round trip that fills the whole client `state`: the signed-in user, their
 * friends and requests, notifications, communities, events and messages.
 *
 * The frontend previously shipped 52 hard-coded mock users, 32 mock posts, 15
 * mock communities and 12 mock events, so every one of those screens looked
 * populated but was identical for every visitor and vanished on reload.
 */

require_once __DIR__ . '/../config/bootstrap.php';

ulink_require_method('GET');

$me = ulink_require_auth();
$userId = (int) $me['id'];

ulink_touch_session();

$friends  = ulink_friend_list($userId);
$requests = ulink_incoming_requests($userId);
$sent     = ulink_outgoing_requests($userId);

$communityRows = Database::fetchAll(
    'SELECT c.id, c.name, c.description, c.icon, c.pic, c.cover_pic, c.is_private, c.created_at,
            (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id) AS member_count
       FROM communities c
      ORDER BY c.name ASC
      LIMIT 100'
);

// One query for all of these rows. Shaping them one at a time meant 100
// membership lookups on every page load of the entire app.
$joinedIds = ulink_user_community_ids($userId);

$communities = array_map(
    static fn(array $row): array => ulink_community_public($row, $userId, $joinedIds),
    $communityRows
);

$notificationRows = Database::fetchAll(
    'SELECT n.id, n.type, n.content, n.from_user_id, n.reference_id, n.is_read, n.created_at,
            u.full_name, u.profile_pic
       FROM notifications n
       LEFT JOIN users u ON u.id = n.from_user_id
      WHERE n.user_id = :me
      ORDER BY n.created_at DESC, n.id DESC
      LIMIT 60',
    ['me' => $userId]
);

$notifications = array_map(static function (array $row): array {
    $name = (string) ($row['full_name'] ?? '');

    return [
        'id'         => (int) $row['id'],
        'type'       => (string) $row['type'],
        'text'       => (string) $row['content'],
        'read'       => (int) $row['is_read'] === 1,
        'fromId'     => $row['from_user_id'] !== null ? (int) $row['from_user_id'] : null,
        'pic'        => $row['from_user_id'] !== null ? ulink_avatar_url($row['profile_pic'], $name) : null,
        'referenceId'=> $row['reference_id'] !== null ? (int) $row['reference_id'] : null,
        'ts'         => $row['created_at'],
    ];
}, $notificationRows);

$eventRows = Database::fetchAll(
    'SELECT e.id, e.title, e.description, e.location, e.image_url, e.event_date,
            (SELECT COUNT(*) FROM event_interest ei2
                  WHERE ei2.event_id = e.id AND ei2.status = \'interested\') AS interested_count,
            ei.status AS my_status
       FROM events e
       LEFT JOIN event_interest ei ON ei.event_id = e.id AND ei.user_id = :me
      WHERE e.event_date >= (NOW() - INTERVAL 1 DAY)
      ORDER BY e.event_date ASC
      LIMIT 30',
    ['me' => $userId]
);

$events = array_map('ulink_event_public', $eventRows);

$user = ulink_user_public($me, true);
$user['posts_count'] = (int) Database::fetchValue(
    'SELECT COUNT(*) FROM posts WHERE user_id = :id',
    ['id' => $userId]
);
$user['postsCount'] = $user['posts_count'];
$user['friends_count'] = count($friends);
$user['friendsCount'] = $user['friends_count'];
$user['unread_notifications'] = ulink_unread_notification_count($userId);
$user['unread_messages'] = ulink_unread_message_count($userId);

// Preferences ride along so the shell can apply compact feed / reduce motion on
// first paint without a second request, and the Settings tab is populated
// before it is ever opened.
$settings = ulink_settings_public(ulink_user_settings($userId));

ulink_ok([
    'user'          => $user,
    'settings'      => $settings,
    'friends'       => $friends,
    'requests'      => $requests,
    'sent'          => $sent,
    'notifications' => $notifications,
    'communities'   => $communities,
    'events'        => $events,
    'suggestions'   => ulink_friend_suggestions($userId, 12),
    'joined'        => array_values(array_map(
        static fn($c) => $c['id'],
        array_filter($communities, static fn($c) => $c['joined'])
    )),
    'counts'        => [
        'friends'         => count($friends),
        'requests'        => count($requests),
        'notifications'   => ulink_unread_notification_count($userId),
        'unread_messages' => ulink_unread_message_count($userId),
        'communities'     => count(array_filter($communities, static fn($c) => $c['joined'])),
    ],
]);
