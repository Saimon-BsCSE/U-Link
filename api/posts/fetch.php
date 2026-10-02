<?php
/**
 * api/posts/fetch.php
 *
 * GET /api/posts/fetch.php
 *
 * Query: limit, offset, user_id (author filter), community_id, mine=1,
 *        scope=feed|all|saved, id (single post)
 *
 * `scope` defaults to `feed`, which is the main newsfeed: only posts with no
 * community. `scope=all` also returns the posts somebody made inside a
 * community, which is what a personal profile needs - its post count includes
 * both, so the list has to as well. `scope=saved` returns the viewer's private
 * bookmark list and requires a session.
 *
 * Response `data[]` entries use the camelCase field names the frontend
 * consumes: id, userId, name, pic, text, image, likes, comments, liked, saved,
 * commentsList, communityId, communityName, created_at.
 *
 * Rewritten from the original, which
 *   - hard-coded `liked` to false, so a liked post never rendered as liked
 *     after a refresh;
 *   - ran one extra query per post to load comments (N+1);
 *   - always returned the newest 50 posts with no way to page.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$viewerId = ulink_current_user_id();
$query    = ulink_query();

$pagination = ulink_pagination(
    ulink_input_int($query, 'limit', ULINK_PAGE_DEFAULT),
    ulink_input_int($query, 'offset', 0),
    ULINK_PAGE_MAX
);

$limit     = $pagination['limit'];
$offset    = $pagination['offset'];
$userId    = ulink_input_int($query, 'user_id');
$communityId = ulink_input_int($query, 'community_id');
$postId    = ulink_input_int($query, 'id');
$mine      = ulink_input_bool($query, 'mine');
$scope     = strtolower(ulink_query_str('scope', 'feed'));

if (!in_array($scope, ['feed', 'all', 'saved'], true)) {
    ulink_fail("Unknown scope: " . ulink_escape($scope), 422);
}

if ($scope === 'saved' && $viewerId === null) {
    ulink_fail('Sign in to view your saved posts.', 401);
}

if ($mine) {
    $userId = $viewerId;
}

// Profile visibility gates a user-scoped read the same way api/users/profile.php
// does, so choosing "friends" or "only me" hides the posts too, not just the
// header fields.
if ($userId !== null && $userId > 0 && $userId !== $viewerId) {
    $visibility = (string) ulink_user_setting($userId, 'profile_visibility', 'public');
    $friend     = $viewerId !== null && ulink_are_friends($viewerId, $userId);
    $canView    = $visibility === 'public'
        || ($visibility === 'friends' && $friend)
        || ulink_is_admin();

    if (!$canView) {
        ulink_ok([
            'data'    => [],
            'count'   => 0,
            'limit'   => $limit,
            'offset'  => $offset,
            'hasMore' => false,
        ]);
    }
}

$where  = [];
$params = [];

// Only community posts carry a community_id; NULL means the main newsfeed.
// An explicit community_id always wins, then scope, then the feed default.
if ($communityId !== null && $communityId > 0) {
    $where[] = 'p.community_id = :community_id';
    $params['community_id'] = $communityId;
    // Only *private* communities are gated. Reading a public community you have
    // not joined is normal browsing and detail.php still allows it; what must
    // not happen is a private group's posts being served to anyone holding the
    // id, which is exactly what an explicit community_id used to do.
    $requested = Database::fetchOne(
        'SELECT is_private FROM communities WHERE id = :id LIMIT 1',
        ['id' => $communityId]
    );
    if ($requested !== null
        && (int) $requested['is_private'] === 1
        && ($viewerId === null || !ulink_is_community_member($communityId, $viewerId))
    ) {
        ulink_fail('This community is private. Join it to see its posts.', 403);
    }
} elseif ($scope === 'feed') {
    $where[] = 'p.community_id IS NULL';
}

if ($postId !== null && $postId > 0) {
    $where[] = 'p.id = :post_id';
    $params['post_id'] = $postId;
}

if ($userId !== null && $userId > 0) {
    $where[] = 'p.user_id = :user_id';
    $params['user_id'] = $userId;
}

// `scope=saved` is the viewer's private bookmark list. The saved LEFT JOIN
// below is viewer-scoped, so "the join matched" is exactly "the viewer saved
// this post"; no third copy of the viewer id placeholder is needed.
if ($scope === 'saved') {
    $where[] = 'sp.user_id IS NOT NULL';
}

// `scope=all` on its own contributes no predicate, so the list used to be
// empty and the query came out as `WHERE  ORDER BY ...` - a 500 with the whole
// statement in the body whenever ULINK_DEBUG is on.
$whereSql = $where === [] ? '1 = 1' : implode(' AND ', $where);

/*
 * Liked state is resolved with a LEFT JOIN against the viewer rather than a
 * correlated subquery, and comment counts with grouped scalar subqueries so a
 * single row per post comes back.
 */
$viewerJoin = $viewerId !== null
    ? 'LEFT JOIN post_likes pl ON pl.post_id = p.id AND pl.user_id = :viewer_id'
    : '';
$savedJoin = $viewerId !== null
    ? 'LEFT JOIN saved_posts sp ON sp.post_id = p.id AND sp.user_id = :saved_viewer_id'
    : '';
if ($viewerId !== null) {
    $params['viewer_id'] = $viewerId;
    $params['saved_viewer_id'] = $viewerId;
}

$sql = "SELECT p.id,
               p.user_id,
               p.content,
               p.image_url,
               p.community_id,
               p.created_at,
               u.full_name,
               u.profile_pic,
               u.student_id,
               u.department,
               u.batch,
               u.role,
               c.name AS community_name,
               (SELECT COUNT(*) FROM post_likes pl2 WHERE pl2.post_id = p.id) AS likes_count,
               (SELECT COUNT(*) FROM comments c2 WHERE c2.post_id = p.id)   AS comments_count,
               " . ($viewerId !== null ? 'CASE WHEN pl.user_id IS NULL THEN 0 ELSE 1 END' : '0') . " AS liked,
               " . ($viewerId !== null ? 'CASE WHEN sp.user_id IS NULL THEN 0 ELSE 1 END' : '0') . " AS saved
          FROM posts p
          JOIN users u ON u.id = p.user_id
          LEFT JOIN communities c ON c.id = p.community_id
          {$viewerJoin}
          {$savedJoin}
         WHERE {$whereSql}
         ORDER BY p.created_at DESC, p.id DESC
         LIMIT :limit OFFSET :offset";

$rows = Database::fetchAll($sql, $params + ['limit' => $limit, 'offset' => $offset]);

$postIds = array_map(static fn($r) => (int) $r['id'], $rows);

/*
 * Load every comment for the page in one query. The original issued a query
 * per post, so a 20 post feed ran 21 round trips.
 */
$commentsByPost = [];
if ($postIds !== []) {
    $placeholders = implode(',', array_fill(0, count($postIds), '?'));
    $commentRows = Database::fetchAll(
        "SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
                u.full_name, u.profile_pic
           FROM comments c
           JOIN users u ON u.id = c.user_id
          WHERE c.post_id IN ({$placeholders})
          ORDER BY c.created_at ASC, c.id ASC",
        $postIds
    );

    foreach ($commentRows as $comment) {
        $commentsByPost[(int) $comment['post_id']][] = [
            'id'        => (int) $comment['id'],
            'postId'    => (int) $comment['post_id'],
            'userId'    => (int) $comment['user_id'],
            'name'      => (string) $comment['full_name'],
            'pic'       => ulink_avatar_url($comment['profile_pic'], $comment['full_name']),
            'text'      => (string) $comment['content'],
            'created_at'=> $comment['created_at'],
        ];
    }
}

$posts = array_map(static function (array $row) use ($commentsByPost): array {
    $name = (string) $row['full_name'];

    return [
        'id'           => (int) $row['id'],
        'userId'       => (int) $row['user_id'],
        'name'         => $name,
        'pic'          => ulink_avatar_url($row['profile_pic'], $name),
        'dept'         => $row['department'],
        'batch'        => $row['batch'],
        'role'         => ucfirst((string) $row['role']),
        'text'         => (string) $row['content'],
        'image'        => $row['image_url'],
        'communityId'  => $row['community_id'] !== null ? (int) $row['community_id'] : null,
        'communityName'=> $row['community_name'] ?? null,
        'likes'        => (int) $row['likes_count'],
        'comments'     => (int) $row['comments_count'],
        'liked'        => (int) $row['liked'] === 1,
        'saved'        => (int) ($row['saved'] ?? 0) === 1,
        'created_at'   => $row['created_at'],
        'commentsList' => $commentsByPost[(int) $row['id']] ?? [],
    ];
}, $rows);

// A page exactly as long as the limit may have more rows behind it.
$hasMore = count($rows) === $limit;

ulink_ok([
    'data'    => $posts,
    'count'   => count($posts),
    'limit'   => $limit,
    'offset'  => $offset,
    'hasMore' => $hasMore,
]);
