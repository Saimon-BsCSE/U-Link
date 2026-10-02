<?php
/**
 * api/friends/action.php
 *
 * POST /api/friends/action.php
 *
 * Body: { action, userId }
 *
 * action:
 *   request  send a friend request
 *   accept   accept an incoming request
 *   reject   decline an incoming request
 *   cancel   withdraw a request you sent
 *   remove   unfriend
 *   block    refuse all further contact
 *
 * The target user always comes from `userId` (that is the point of the
 * endpoint); the acting user is always the session user.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$input  = ulink_input();
$action = strtolower(ulink_input_str($input, 'action'));
$targetId = ulink_input_int($input, 'userId');

if ($action === '') {
    ulink_fail('An action is required.', 422);
}

if ($targetId === null || $targetId <= 0) {
    ulink_fail('A valid user id is required.', 422);
}

if ($targetId === $userId) {
    ulink_fail('You cannot do that on your own account.', 422);
}

if (!ulink_user_exists($targetId)) {
    ulink_fail('User not found.', 404);
}

$targetName = ulink_user_name($targetId);
$row        = ulink_friendship_row($userId, $targetId);
$low        = min($userId, $targetId);
$high       = max($userId, $targetId);

switch ($action) {
    /* ------------------------------------------------------------- request */
    case 'request':
    case 'add':
    case 'send':
        $result = ulink_send_friend_request($userId, $targetId);

        if ($result['status'] === 'blocked') {
            // Reported as a refusal, not a success: a 201 here told the caller
            // the request was delivered when no request exists.
            ulink_fail($result['message'], 403, ['action' => 'blocked']);
        }

        if ($result['status'] === 'pending') {
            ulink_log_activity('friend_request_sent', [
                'to_user_id' => $targetId,
            ], $userId);
        }

        ulink_ok([
            'message'       => $result['message'],
            'action'        => $result['status'],
            'friendship_id' => $result['friendship_id'],
            'is_friend'     => $result['status'] === 'accepted',
            'request_pending' => $result['status'] === 'pending',
        ], $result['status'] === 'already_friends' ? 200 : 201);

        // no break
    /* ------------------------------------------------------------- accept */
    case 'accept':
        if ($row === null || $row['status'] !== 'pending') {
            ulink_fail('There is no pending request from this user.', 409);
        }
        if ((int) $row['status_requested_by'] !== $targetId) {
            // They are the recipient, not the requester.
            ulink_fail('You cannot accept your own request.', 409);
        }

        Database::transaction(static function () use ($row, $userId, $targetId): void {
            Database::update('friendships', [
                'status'       => 'accepted',
                'responded_at' => gmdate('Y-m-d H:i:s'),
            ], (int) $row['id']);

            // The request notification is no longer actionable.
            Database::run(
                'UPDATE notifications SET is_read = 1
                  WHERE user_id = :me AND from_user_id = :them
                    AND type = \'request\' AND reference_id = :fid AND is_read = 0',
                ['me' => $userId, 'them' => $targetId, 'fid' => (int) $row['id']]
            );
        });

        ulink_notify(
            $targetId,
            'request_accepted',
            (string) $me['full_name'] . ' accepted your friend request',
            $userId,
            (int) $row['id']
        );
        ulink_log_activity('friend_request_accepted', [
            'user_id' => $targetId,
        ], $userId);

        ulink_ok([
            'message'   => 'Friend request accepted.',
            'action'    => 'accepted',
            'is_friend' => true,
            'user'      => ulink_user_public(
                Database::fetchOne('SELECT * FROM users WHERE id = :id', ['id' => $targetId]) ?: [],
                true
            ),
        ]);

        // no break
    /* ------------------------------------------------------------- reject */
    case 'reject':
    case 'decline':
        if ($row === null || $row['status'] !== 'pending') {
            ulink_fail('There is no pending request from this user.', 409);
        }
        if ((int) $row['status_requested_by'] !== $targetId) {
            ulink_fail('You can only decline requests sent to you.', 409);
        }

        // Transactional, like accept: if the notification update fails the
        // request must stay pending, because declining the row alone leaves a
        // `request` notification in the other inbox that can no longer be
        // actioned - accept, reject and cancel all 409 on a declined row.
        Database::transaction(static function () use ($row, $userId, $targetId): void {
            Database::update('friendships', [
                'status'       => 'declined',
                'responded_at' => gmdate('Y-m-d H:i:s'),
            ], (int) $row['id']);

            Database::run(
                'UPDATE notifications SET is_read = 1
                  WHERE user_id = :me AND from_user_id = :them AND type = \'request\' AND reference_id = :fid',
                ['me' => $userId, 'them' => $targetId, 'fid' => (int) $row['id']]
            );
        });

        ulink_log_activity('friend_request_rejected', [
            'user_id' => $targetId,
        ], $userId);

        ulink_ok([
            'message'   => 'Request declined.',
            'action'    => 'declined',
            'is_friend' => false,
        ]);

        // no break
    /* ------------------------------------------------------------- cancel */
    case 'cancel':
        if ($row === null || $row['status'] !== 'pending') {
            ulink_fail('There is no pending request to cancel.', 409);
        }
        if ((int) $row['status_requested_by'] !== $userId) {
            ulink_fail('You can only cancel requests that you sent.', 409);
        }

        Database::transaction(static function () use ($row, $userId, $targetId): void {
            Database::delete('friendships', (int) $row['id']);
            Database::run(
                'DELETE FROM notifications
                  WHERE user_id = :them AND from_user_id = :me AND type = \'request\' AND reference_id = :fid',
                ['them' => $targetId, 'me' => $userId, 'fid' => (int) $row['id']]
            );
        });

        ulink_ok([
            'message'         => 'Friend request withdrawn.',
            'action'          => 'cancelled',
            'is_friend'       => false,
            'request_pending' => false,
        ]);

        // no break
    /* ------------------------------------------------------------- remove */
    case 'remove':
    case 'unfriend':
        if ($row === null || $row['status'] !== 'accepted') {
            ulink_fail('You are not connected to this user.', 409);
        }

        Database::transaction(static function () use ($row, $userId, $targetId): void {
            Database::delete('friendships', (int) $row['id']);
            ulink_clear_friendship_notifications($userId, $targetId, (int) $row['id']);
        });

        ulink_log_activity('friend_removed', ['user_id' => $targetId], $userId);

        ulink_ok([
            'message'   => $targetName . ' has been removed from your friends.',
            'action'    => 'removed',
            'is_friend' => false,
        ]);

        // no break
    /* -------------------------------------------------------------- block */
    case 'block':
        Database::transaction(static function () use ($row, $low, $high, $userId): void {
            if ($row === null) {
                Database::insert('friendships', [
                    'user_id_1'           => $low,
                    'user_id_2'           => $high,
                    'status'              => 'blocked',
                    'status_requested_by' => $userId,
                ]);
            } else {
                Database::update('friendships', [
                    'status'              => 'blocked',
                    'status_requested_by' => $userId,
                    'responded_at'        => gmdate('Y-m-d H:i:s'),
                ], (int) $row['id']);
            }
        });

        // Blocking someone with a request still in flight used to leave the
        // `request` notification in their inbox, where every action 409s.
        if ($row !== null) {
            ulink_clear_friendship_notifications($userId, $targetId, (int) $row['id']);
        }

        ulink_ok([
            'message'   => $targetName . ' has been blocked.',
            'action'    => 'blocked',
            'is_friend' => false,
        ]);

        // no break
    /* ------------------------------------------------------ unblock / nop */
    case 'unblock':
        if ($row !== null && $row['status'] === 'blocked') {
            Database::delete('friendships', (int) $row['id']);
            ulink_clear_friendship_notifications($userId, $targetId, (int) $row['id']);
        }
        ulink_ok([
            'message'   => $targetName . ' has been unblocked.',
            'action'    => 'unblocked',
            'is_friend' => false,
        ]);

        // no break
    default:
        ulink_fail('Unsupported action: ' . ulink_escape($action), 422);
}
