<?php
/**
 * api/events/list.php
 *
 * GET /api/events/list.php?scope=upcoming|past|all
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$scope = strtolower(ulink_query_str('scope', 'upcoming'));

$where  = ['1 = 1'];
$params = ['me' => $userId];

if ($scope === 'upcoming') {
    $where[] = 'e.event_date >= (NOW() - INTERVAL 1 DAY)';
} elseif ($scope === 'past') {
    $where[] = 'e.event_date < (NOW() - INTERVAL 1 DAY)';
}

$rows = Database::fetchAll(
    'SELECT e.id, e.title, e.description, e.location, e.image_url, e.event_date, e.end_date,
            e.created_at,
            (SELECT COUNT(*) FROM event_interest ei2
                  WHERE ei2.event_id = e.id AND ei2.status = \'interested\') AS interested_count,
            ei.status AS my_status
       FROM events e
       LEFT JOIN event_interest ei ON ei.event_id = e.id AND ei.user_id = :me
      WHERE ' . implode(' AND ', $where) . '
      ORDER BY ' . ($scope === 'past' ? 'e.event_date DESC, e.id DESC' : 'e.event_date ASC, e.id ASC') . '
      LIMIT :limit OFFSET :offset',
    $params + ulink_pagination(
        ulink_query_int('limit', ULINK_PAGE_DEFAULT),
        ulink_query_int('offset', 0),
        ULINK_PAGE_MAX
    )
);

$events = array_map('ulink_event_public', $rows);

ulink_ok([
    'events' => $events,
    'data'   => $events,
    'count'  => count($events),
]);
