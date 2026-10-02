<?php
/**
 * api/explore.php
 *
 * GET /api/explore.php
 *
 * One round trip behind the whole Explore hub: trending posts, the busiest
 * public communities, the next few upcoming events, and a handful of people
 * suggestions. Explore used to be a wall of hard-coded markup; this endpoint is
 * what makes it real without four separate requests.
 */

require_once __DIR__ . '/../config/bootstrap.php';

ulink_require_method('GET');

$me = ulink_require_auth();
$userId = (int) $me['id'];

/* ---------------------------------------------------------------- trending */

$trendingRows = Database::fetchAll(
    "SELECT p.id, p.user_id, p.content, p.image_url, p.community_id, p.created_at,
            u.full_name, u.profile_pic, u.department, u.batch, u.role,
            c.name AS community_name,
            (SELECT COUNT(*) FROM post_likes pl2 WHERE pl2.post_id = p.id) AS likes_count,
            (SELECT COUNT(*) FROM comments c2 WHERE c2.post_id = p.id)   AS comments_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN communities c ON c.id = p.community_id
      WHERE p.visibility = 'public'
        AND (p.community_id IS NULL OR c.is_private = 0)
      ORDER BY (likes_count * 3 + comments_count * 2) DESC, p.created_at DESC, p.id DESC
      LIMIT 6"
);

$trending = array_map(static function (array $row): array {
    $name = (string) $row['full_name'];

    return [
        'id'            => (int) $row['id'],
        'userId'        => (int) $row['user_id'],
        'name'          => $name,
        'pic'           => ulink_avatar_url($row['profile_pic'], $name),
        'dept'          => $row['department'],
        'batch'         => $row['batch'],
        'role'          => ucfirst((string) $row['role']),
        'text'          => (string) $row['content'],
        'image'         => $row['image_url'],
        'communityId'   => $row['community_id'] !== null ? (int) $row['community_id'] : null,
        'communityName' => $row['community_name'] ?? null,
        'likes'         => (int) $row['likes_count'],
        'comments'      => (int) $row['comments_count'],
        'created_at'    => $row['created_at'],
    ];
}, $trendingRows);

/* -------------------------------------------------------------- communities */

// Only public groups belong in a discovery rail; a private group that still
// showed up here would not be private.
$communityRows = Database::fetchAll(
    'SELECT c.id, c.name, c.description, c.icon, c.pic, c.cover_pic, c.is_private, c.created_at,
            (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id) AS member_count
       FROM communities c
      WHERE c.is_private = 0
      ORDER BY member_count DESC, c.name ASC
      LIMIT 8'
);

$communities = array_map(
    static fn(array $row): array => ulink_community_public($row, $userId),
    $communityRows
);

/* ------------------------------------------------------------------ events */

$eventRows = Database::fetchAll(
    'SELECT e.id, e.title, e.description, e.location, e.image_url, e.event_date, e.end_date, e.created_at,
            (SELECT COUNT(*) FROM event_interest ei2
                  WHERE ei2.event_id = e.id AND ei2.status = \'interested\') AS interested_count,
            ei.status AS my_status
       FROM events e
       LEFT JOIN event_interest ei ON ei.event_id = e.id AND ei.user_id = :me
      WHERE e.event_date >= (NOW() - INTERVAL 1 DAY)
      ORDER BY e.event_date ASC, e.id ASC
      LIMIT 6',
    ['me' => $userId]
);

$events = array_map('ulink_event_public', $eventRows);

/* ------------------------------------------------------------------ people */

$people = ulink_friend_suggestions($userId, 8);

// On a dense demo graph the viewer may already be connected to everyone, which
// leaves the People rail empty. Fall back to a few other accounts so the tab
// always has something to show.
if ($people === []) {
    $people = array_map(
        static fn(array $row): array => ulink_user_public($row, false),
        Database::fetchAll(
            'SELECT u.id, u.student_id, u.full_name, u.profile_pic, u.cover_pic, u.department,
                    u.batch, u.bio, u.role
               FROM users u
              WHERE u.id <> :me
              ORDER BY u.id ASC
              LIMIT 8',
            ['me' => $userId]
        )
    );
}

ulink_ok([
    'trending'    => $trending,
    'communities' => $communities,
    'events'      => $events,
    'people'      => $people,
]);
