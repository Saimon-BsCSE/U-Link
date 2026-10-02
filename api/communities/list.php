<?php
/**
 * api/communities/list.php
 *
 * GET /api/communities/list.php?scope=all|joined&limit=50
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$scope = strtolower(ulink_query_str('scope', 'all'));
$pagination = ulink_pagination(
    ulink_query_int('limit', ULINK_PAGE_DEFAULT),
    ulink_query_int('offset', 0),
    ULINK_PAGE_MAX
);

$where  = ['1 = 1'];
$params = ['me' => $userId];

if ($scope === 'joined') {
    $where[] = 'EXISTS (SELECT 1 FROM community_members cm
                         WHERE cm.community_id = c.id AND cm.user_id = :me)';
}

// `scope=all` listed private groups to everyone. Hiding them from the directory
// is not the access control - detail.php and posts/fetch.php gate the contents -
// but a private group that still shows up in "Trending" is not private.
$where[] = '(c.is_private = 0
             OR EXISTS (SELECT 1 FROM community_members cm2
                         WHERE cm2.community_id = c.id AND cm2.user_id = :me))';

$rows = Database::fetchAll(
    'SELECT c.id, c.name, c.description, c.icon, c.pic, c.cover_pic, c.is_private, c.created_at,
            (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id) AS member_count,
            (SELECT COUNT(*) FROM posts p WHERE p.community_id = c.id) AS post_count
       FROM communities c
      WHERE ' . implode(' AND ', $where) . '
      ORDER BY c.name ASC, c.id ASC
      LIMIT :limit OFFSET :offset',
    $params + ['limit' => $pagination['limit'], 'offset' => $pagination['offset']]
);

// One membership query for the whole page rather than one per community.
$joinedIds = ulink_user_community_ids($userId);

$communities = array_map(static function (array $row) use ($userId, $joinedIds): array {
    $community = ulink_community_public($row, $userId, $joinedIds);
    $community['post_count'] = (int) ($row['post_count'] ?? 0);
    return $community;
}, $rows);

ulink_ok([
    'communities' => $communities,
    'data'        => $communities,
    'count'       => count($communities),
    'joined'      => array_values(array_map(
        static fn($c) => $c['id'],
        array_filter($communities, static fn($c) => $c['joined'])
    )),
    'limit'  => $pagination['limit'],
    'offset' => $pagination['offset'],
]);
