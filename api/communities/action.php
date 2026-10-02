<?php
/**
 * api/communities/action.php
 *
 * POST /api/communities/action.php
 *
 * Body: { action, communityId }
 *   action: join | leave
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$input       = ulink_input();
$action      = strtolower(ulink_input_str($input, 'action'));
$communityId = ulink_input_int($input, 'communityId');

if ($communityId === null || $communityId <= 0) {
    ulink_fail('A valid community id is required.', 422);
}

$community = Database::fetchOne(
    'SELECT id, name, is_private FROM communities WHERE id = :id LIMIT 1',
    ['id' => $communityId]
);

if ($community === null) {
    ulink_fail('Community not found.', 404);
}

$name = (string) $community['name'];
$isPrivate = (int) ($community['is_private'] ?? 0) === 1;
$isMember = ulink_is_community_member($communityId, $userId);

switch ($action) {
    case 'join':
        if ($isMember) {
            ulink_ok([
                'message' => 'You have already joined ' . $name . '.',
                'action'  => 'joined',
                'joined'  => true,
            ]);
        }

        // is_private is selected above and honoured by list/detail, so join has
        // to honour it too - otherwise a private group is one POST away from
        // being public.
        if ($isPrivate) {
            ulink_fail('This community is private. Ask an admin for an invitation.', 403);
        }

        Database::transaction(static function () use ($communityId, $userId, $name): void {
            Database::run(
                'INSERT INTO community_members (community_id, user_id, role) VALUES (:c, :u, \'member\')
                 ON DUPLICATE KEY UPDATE role = \'member\'',
                ['c' => $communityId, 'u' => $userId]
            );

            if ((int) Database::fetchValue(
                'SELECT COUNT(*) FROM community_members WHERE community_id = :c',
                ['c' => $communityId]
            ) === 1) {
                // The community has no creator recorded; attribute the first
                // member as its admin so the group is never orphaned.
                Database::update('communities', ['created_by' => $userId], $communityId);
                // Both halves of the primary key. community_members is keyed by
                // (community_id, user_id); a bare user_id predicate matches
                // every membership row the caller has, so joining any empty
                // community silently promoted the user to admin of all of them.
                Database::run(
                    'UPDATE community_members SET role = \'admin\'
                     WHERE community_id = :c AND user_id = :u',
                    ['c' => $communityId, 'u' => $userId]
                );
            }
        });

        ulink_log_activity('community_joined', ['community_id' => $communityId], $userId);

        ulink_ok([
            'message' => 'Welcome to ' . $name . '!',
            'action'  => 'joined',
            'joined'  => true,
            'members' => ulink_community_member_count($communityId),
        ], 201);

        // no break
    case 'leave':
        if (!$isMember) {
            ulink_ok([
                'message' => 'You are not a member of ' . $name . '.',
                'action'  => 'left',
                'joined'  => false,
            ]);
        }

        // The last member cannot leave, otherwise the community becomes
        // unreachable with no way to rejoin it.
        if (ulink_community_member_count($communityId) <= 1) {
            ulink_fail('You are the only member of this community. Delete it instead of leaving.', 409);
        }

        Database::run(
            'DELETE FROM community_members WHERE community_id = :c AND user_id = :u',
            ['c' => $communityId, 'u' => $userId]
        );

        ulink_log_activity('community_left', ['community_id' => $communityId], $userId);

        ulink_ok([
            'message' => 'You have left ' . $name . '.',
            'action'  => 'left',
            'joined'  => false,
            'members' => ulink_community_member_count($communityId),
        ]);

        // no break
    default:
        ulink_fail('Unsupported action: ' . ulink_escape($action), 422);
}
