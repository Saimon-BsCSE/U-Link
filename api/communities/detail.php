<?php
/**
 * api/communities/detail.php
 *
 * GET /api/communities/detail.php?id=3
 *
 * A community plus its members and, optionally, its feed. `?feed=1` returns
 * posts in one round trip so opening a community does not need two requests.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$communityId = ulink_query_int('id');
if ($communityId === null || $communityId <= 0) {
    ulink_fail('A valid community id is required.', 422);
}

$row = Database::fetchOne(
    'SELECT c.id, c.name, c.description, c.icon, c.pic, c.cover_pic, c.is_private, c.created_at,
            (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id) AS member_count
       FROM communities c
      WHERE c.id = :id
      LIMIT 1',
    ['id' => $communityId]
);

if ($row === null) {
    ulink_fail('Community not found.', 404);
}

$community = ulink_community_public($row, $userId);

// is_private was selected and published but never checked, so the member roster
// and the whole feed of a private group were readable by anyone who knew its
// id. A non-member of a private community gets the card and nothing else.
$isPrivate = (int) ($row['is_private'] ?? 0) === 1;
$isMember  = ulink_is_community_member($communityId, $userId);

if ($isPrivate && !$isMember) {
    ulink_ok([
        'community' => $community,
        'members'   => [],
        'member_count' => (int) ($community['memberCount'] ?? 0),
        'is_member' => false,
        'locked'    => true,
        'message'   => 'This community is private. Join it to see its members and posts.',
    ]);
}

$members = array_map(
    static fn(array $m): array => ulink_user_public($m, false),
    Database::fetchAll(
        'SELECT u.id, u.student_id, u.full_name, u.profile_pic, u.cover_pic, u.department,
                u.batch, u.bio, u.role, cm.role AS community_role, cm.joined_at
           FROM community_members cm
           JOIN users u ON u.id = cm.user_id
          WHERE cm.community_id = :c
          ORDER BY cm.joined_at ASC
          LIMIT 100',
        ['c' => $communityId]
    )
);

$payload = [
    'community' => $community,
    'members'   => $members,
];

if (ulink_query_int('feed', 0) === 1 || ulink_query_str('include') === 'feed') {
    $pagination = ulink_pagination(ulink_query_int('limit', ULINK_PAGE_DEFAULT), ulink_query_int('offset', 0));

    $rows = Database::fetchAll(
        "SELECT p.id, p.user_id, p.content, p.image_url, p.created_at,
                u.full_name, u.profile_pic, u.department, u.batch, u.role,
                (SELECT COUNT(*) FROM post_likes pl2 WHERE pl2.post_id = p.id) AS likes_count,
                (SELECT COUNT(*) FROM comments c2 WHERE c2.post_id = p.id)   AS comments_count,
                CASE WHEN pl.user_id IS NULL THEN 0 ELSE 1 END AS liked
           FROM posts p
           JOIN users u ON u.id = p.user_id
           LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.user_id = :viewer
          WHERE p.community_id = :community
          ORDER BY p.created_at DESC, p.id DESC
          LIMIT :limit OFFSET :offset",
        [
            'viewer'   => $userId,
            'community'=> $communityId,
            'limit'    => $pagination['limit'],
            'offset'   => $pagination['offset'],
        ]
    );

    $postIds = array_map(static fn($r) => (int) $r['id'], $rows);
    $commentsByPost = [];

    if ($postIds !== []) {
        $placeholders = implode(',', array_fill(0, count($postIds), '?'));
        foreach (Database::fetchAll(
            "SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, u.full_name
               FROM comments c JOIN users u ON u.id = c.user_id
              WHERE c.post_id IN ({$placeholders})
              ORDER BY c.created_at ASC, c.id ASC",
            $postIds
        ) as $comment) {
            $commentsByPost[(int) $comment['post_id']][] = [
                'id'         => (int) $comment['id'],
                'userId'     => (int) $comment['user_id'],
                'name'       => (string) $comment['full_name'],
                'text'       => (string) $comment['content'],
                'created_at' => $comment['created_at'],
            ];
        }
    }

    // The closure has no access to $communityId, so capture it alongside the
    // comment index. Without this the whole endpoint failed with
    // "Undefined variable $communityId".
    $payload['posts'] = array_map(static function (array $r) use ($commentsByPost, $communityId): array {
        $name = (string) $r['full_name'];
        return [
            'id'           => (int) $r['id'],
            'userId'       => (int) $r['user_id'],
            'name'         => $name,
            'pic'          => ulink_avatar_url($r['profile_pic'], $name),
            'dept'         => $r['department'],
            'batch'        => $r['batch'],
            'role'         => ucfirst((string) $r['role']),
            'text'         => (string) $r['content'],
            'image'        => $r['image_url'],
            'communityId'  => $communityId,
            'likes'        => (int) $r['likes_count'],
            'comments'     => (int) $r['comments_count'],
            'liked'        => (int) $r['liked'] === 1,
            'created_at'   => $r['created_at'],
            'commentsList' => $commentsByPost[(int) $r['id']] ?? [],
        ];
    }, $rows);
}

ulink_ok($payload);
