<?php
/**
 * api/users/search.php
 *
 * GET /api/users/search.php?q=rak&limit=10
 *
 * Backs the top-bar search dropdown and "People you may know".
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$query = ulink_plain_text(ulink_query_str('q'), 80);
$limit = ulink_pagination(ulink_query_int('limit', 10), 0, 30)['limit'];

if ($query === '') {
    ulink_ok(['users' => [], 'results' => [], 'count' => 0, 'query' => $query]);
}

$escaped = Database::likeEscape($query);
$like    = '%' . $escaped . '%';
$prefix  = $escaped . '%';

// The escape character is a single backslash, but it has to reach the server as
// the SQL string literal '\\'. Writing that directly inside a single-quoted PHP
// string produces an unterminated literal and a syntax error, so build it here.
$escape = "ESCAPE '\\\\'";

$rows = Database::fetchAll(
    "SELECT u.id, u.student_id, u.full_name, u.profile_pic, u.cover_pic, u.department,
            u.batch, u.bio, u.role, u.last_seen_at
       FROM users u
       LEFT JOIN user_settings us ON us.user_id = u.id
      WHERE u.is_active = 1
        AND u.id <> :me
        AND (u.full_name LIKE :name $escape
             OR u.student_id LIKE :sid $escape
             OR u.department LIKE :dept $escape)
        AND (
              COALESCE(us.allow_search_by_id, 1) = 1
              OR u.full_name LIKE :name2 $escape
              OR u.department LIKE :dept2 $escape
            )
      ORDER BY
        CASE WHEN u.full_name LIKE :exact $escape THEN 0
             WHEN u.student_id LIKE :exact2 $escape THEN 1
             ELSE 2 END,
        u.full_name ASC
      LIMIT :limit",
    [
        'me'     => $userId,
        'name'   => $like,
        'sid'    => $like,
        'dept'   => $like,
        'name2'  => $like,
        'dept2'  => $like,
        'exact'  => $prefix,
        'exact2' => $prefix,
        'limit'  => $limit,
    ]
);

$friendIds = array_flip(ulink_friend_ids($userId));
$outgoing  = [];
foreach (ulink_outgoing_requests($userId) as $request) {
    $outgoing[(int) $request['userId']] = true;
}

$users = array_map(static function (array $row) use ($friendIds, $outgoing): array {
    $user = ulink_user_public($row, false);
    $user['is_friend'] = isset($friendIds[(int) $row['id']]);
    $user['request_pending'] = isset($outgoing[(int) $row['id']]);
    return $user;
}, $rows);

ulink_log_activity('search', ['q' => $query, 'results' => count($users)], $userId);

ulink_ok([
    'users'   => $users,
    'results' => $users,
    'count'   => count($users),
    'query'   => $query,
]);
