<?php
/**
 * api/users/password.php
 *
 * POST /api/users/password.php
 *
 * Body: { current_password, new_password }
 *
 * Changing a password is the one account action that has to prove the person at
 * the keyboard is the owner, not just someone holding a live session (a shared
 * laptop, a stolen cookie). The current password is therefore verified even
 * though the request is already authenticated.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$input   = ulink_input();
$current = (string) ($input['current_password'] ?? '');
$new     = (string) ($input['new_password'] ?? '');

if ($current === '') {
    ulink_fail('Enter your current password.', 422, ['field' => 'current_password']);
}

$problem = ulink_password_problem($new);
if ($problem !== null) {
    ulink_fail($problem, 422, ['field' => 'new_password']);
}

if (hash_equals($current, $new)) {
    ulink_fail('Your new password must be different from the current one.', 422, ['field' => 'new_password']);
}

$row = Database::fetchOne(
    'SELECT password_hash FROM users WHERE id = :id LIMIT 1',
    ['id' => $userId]
);

if ($row === null || !password_verify($current, (string) $row['password_hash'])) {
    ulink_log_activity('password_change_failed', ['reason' => 'bad_current'], $userId);
    ulink_fail('Your current password is incorrect.', 401, ['field' => 'current_password']);
}

try {
    Database::update('users', [
        'password_hash' => password_hash($new, PASSWORD_DEFAULT),
    ], $userId);
} catch (DatabaseException $e) {
    ulink_log_error('Password update failed: ' . $e->getMessage(), $e);
    ulink_fail('Could not change your password. Please try again.', 503);
}

// Rotate the session id so a cookie captured before the change cannot keep the
// old session alive.
if (session_status() === PHP_SESSION_ACTIVE) {
    session_regenerate_id(true);
}

ulink_log_activity('password_changed', null, $userId);

ulink_ok(['message' => 'Password changed successfully.']);
