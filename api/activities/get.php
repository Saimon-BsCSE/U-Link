<?php
/**
 * api/activities/get.php
 *
 * GET /api/activities/get.php?limit=50&offset=0
 *
 * Security fix: the original endpoint accepted any `user_id` from the query
 * string with no authentication, so the full activity history of every account
 * was publicly readable. A user may now only read their own log; admins may
 * read anyone's with an explicit `user_id`.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$me = ulink_require_auth();
$viewerId = (int) $me['id'];

$query    = ulink_query();
$requested = ulink_input_int($query, 'user_id');

$isAdmin = ulink_is_admin($me);

if ($requested !== null && $requested !== $viewerId && !$isAdmin) {
    ulink_fail('You can only view your own activity.', 403);
}

$userId = $requested ?? $viewerId;

$pagination = ulink_pagination(
    ulink_input_int($query, 'limit', ULINK_PAGE_DEFAULT),
    ulink_input_int($query, 'offset', 0),
    ULINK_PAGE_MAX
);

$rows = Database::fetchAll(
    'SELECT id, user_id, activity_type, details, ip_address, created_at
       FROM user_activities
      WHERE user_id = :user_id
      ORDER BY created_at DESC, id DESC
      LIMIT :limit OFFSET :offset',
    [
        'user_id' => $userId,
        'limit'   => $pagination['limit'],
        'offset'  => $pagination['offset'],
    ]
);

$activities = array_map(static function (array $row): array {
    $details = $row['details'];
    if (is_string($details) && $details !== '') {
        $decoded = json_decode($details, true);
        $details = is_array($decoded) ? $decoded : $details;
    } else {
        $details = null;
    }

    return [
        'id'            => (int) $row['id'],
        'user_id'       => (int) $row['user_id'],
        'activity_type' => (string) $row['activity_type'],
        'details'       => $details,
        'ip_address'    => $row['ip_address'],
        'created_at'    => $row['created_at'],
    ];
}, $rows);

$total = (int) Database::fetchValue(
    'SELECT COUNT(*) FROM user_activities WHERE user_id = :user_id',
    ['user_id' => $userId]
);

ulink_ok([
    'data'   => $activities,
    'total'  => $total,
    'count'  => count($activities),
    'limit'  => $pagination['limit'],
    'offset' => $pagination['offset'],
    'hasMore'=> $pagination['offset'] + count($activities) < $total,
]);
