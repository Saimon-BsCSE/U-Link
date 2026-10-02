<?php
/**
 * api/notifications/list.php
 *
 * GET /api/notifications/list.php?tab=all|requests|activity&limit=50
 *
 * The notification panel in the frontend has three tabs: everything, friend
 * requests and general activity. All three are served here.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$tab = strtolower(ulink_query_str('tab', 'all'));

$pagination = ulink_pagination(
    ulink_query_int('limit', ULINK_PAGE_DEFAULT),
    ulink_query_int('offset', 0),
    ULINK_PAGE_MAX
);

// "request" also covers its resolution states so the Requests tab empties
// itself once a request is accepted or declined.
$requestTypes = ['request', 'request_accepted'];

$where  = ['n.user_id = :me'];
$params = ['me' => $userId];

// Every placeholder has to be named: this connection runs with native prepares,
// and PDO refuses to mix positional and named parameters in one statement.
if ($tab === 'requests') {
    $where[] = 'n.type IN (:req_request, :req_accepted)';
    $where[] = 'n.is_read = 0';
    $params['req_request']  = $requestTypes[0];
    $params['req_accepted'] = $requestTypes[1];
} elseif ($tab === 'activity') {
    $where[] = 'n.type NOT IN (:skip_request, :skip_accepted)';
    $params['skip_request']  = $requestTypes[0];
    $params['skip_accepted'] = $requestTypes[1];
}

$whereSql = implode(' AND ', $where);

$rows = Database::fetchAll(
    "SELECT n.id, n.type, n.content, n.from_user_id, n.reference_id, n.is_read, n.created_at,
            u.full_name, u.profile_pic
       FROM notifications n
       LEFT JOIN users u ON u.id = n.from_user_id
      WHERE {$whereSql}
      ORDER BY n.created_at DESC, n.id DESC
      LIMIT :limit OFFSET :offset",
    $params + ['limit' => $pagination['limit'], 'offset' => $pagination['offset']]
);

$notifications = array_map(static function (array $row): array {
    $name = (string) ($row['full_name'] ?? '');

    return [
        'id'         => (int) $row['id'],
        'type'       => (string) $row['type'],
        'text'       => (string) $row['content'],
        'content'    => (string) $row['content'],
        'read'       => (int) $row['is_read'] === 1,
        'is_read'    => (int) $row['is_read'] === 1,
        'fromId'     => $row['from_user_id'] !== null ? (int) $row['from_user_id'] : null,
        'fromName'   => $name,
        'pic'        => $row['from_user_id'] !== null ? ulink_avatar_url($row['profile_pic'], $name) : null,
        'referenceId'=> $row['reference_id'] !== null ? (int) $row['reference_id'] : null,
        'ts'         => $row['created_at'],
        'created_at' => $row['created_at'],
    ];
}, $rows);

$unreadTotal = ulink_unread_notification_count($userId);
$unreadRequests = (int) Database::fetchValue(
    "SELECT COUNT(*) FROM notifications
      WHERE user_id = :me AND is_read = 0 AND type IN ('request', 'request_accepted')",
    ['me' => $userId]
);

ulink_ok([
    'notifications' => $notifications,
    'data'          => $notifications,
    'count'         => count($notifications),
    'unread'        => $unreadTotal,
    'counts'        => [
        'all'      => $unreadTotal,
        'requests' => $unreadRequests,
        'activity' => max(0, $unreadTotal - $unreadRequests),
    ],
    'limit'  => $pagination['limit'],
    'offset' => $pagination['offset'],
]);
