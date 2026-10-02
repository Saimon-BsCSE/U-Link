<?php
/**
 * api/users/profile.php
 *
 * GET /api/users/profile.php?id=123
 *
 * Returns a public profile. Email address and student ID are only included
 * when the requester is the owner or an admin; the original endpoint exposed
 * every user's email to anyone who knew their id.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$query   = ulink_query();
$viewer  = ulink_current_user();
$viewerId = $viewer !== null ? (int) $viewer['id'] : null;
$targetId = ulink_input_int($query, 'id');

if ($targetId === null || $targetId <= 0) {
    $targetId = $viewerId;
}

if ($targetId === null) {
    ulink_fail('Provide a user id or sign in.', 422);
}

$user = Database::fetchOne(
    'SELECT u.id, u.student_id, u.full_name, u.email, u.profile_pic, u.cover_pic,
            u.department, u.batch, u.bio, u.headline, u.location, u.website, u.interests,
            u.role, u.created_at, u.last_seen_at,
            (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) AS posts_count
       FROM users u
      WHERE u.id = :id
      LIMIT 1',
    ['id' => $targetId]
);

if ($user === null) {
    ulink_fail('User not found.', 404);
}

$isSelf = $viewerId !== null && $viewerId === $targetId;
$isAdmin = ulink_is_admin($viewer);
$isFriend = $viewerId !== null ? ulink_are_friends($viewerId, $targetId) : false;

// `profile_visibility` is enforced here rather than in the renderer, because a
// client can always skip the renderer. public = everyone, friends = accepted
// friends (or self/admin), private = self/admin only.
$visibility = (string) ulink_user_setting($targetId, 'profile_visibility', 'public');
$canSeeDetails = $isSelf
    || $isAdmin
    || $visibility === 'public'
    || ($visibility === 'friends' && $isFriend);

$public = ulink_user_public($user, $isSelf || $isAdmin);
$public['is_self'] = $isSelf;
$public['is_friend'] = $isFriend;
$public['is_self_or_friend'] = $isSelf || $isFriend;
$public['limited'] = !$canSeeDetails;
$public['visibility'] = $visibility;

if ($canSeeDetails) {
    $public['posts_count'] = (int) $user['posts_count'];
    $public['postsCount'] = (int) $user['posts_count'];
} else {
    // The profile is gated, so the post list endpoint returns nothing for this
    // viewer. Reporting the real count would advertise content they cannot see.
    $public['bio'] = '';
    $public['headline'] = '';
    $public['location'] = '';
    $public['website'] = '';
    $public['interests'] = '';
    $public['dept'] = null;
    $public['department'] = null;
    $public['batch'] = null;
    $public['posts_count'] = 0;
    $public['postsCount'] = 0;
}

$public['friends_count'] = ulink_friend_count($targetId);
$public['friendsCount'] = $public['friends_count'];

$friendship = $viewerId !== null ? ulink_friendship_row($viewerId, $targetId) : null;
$public['request_pending'] = $friendship !== null
    && $friendship['status'] === 'pending'
    && (int) $friendship['status_requested_by'] === $viewerId;
$public['request_incoming'] = $friendship !== null
    && $friendship['status'] === 'pending'
    && (int) $friendship['status_requested_by'] === $targetId;

ulink_ok(['user' => $public]);
