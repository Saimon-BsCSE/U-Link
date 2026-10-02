<?php
/**
 * api/users/deactivate.php
 *
 * POST /api/users/deactivate.php
 *
 * Body: { password }
 *
 * Deactivation is reversible: `users.is_active` goes to 0 and api/auth/login.php
 * already refuses a disabled account, so the profile simply disappears from the
 * network until an administrator re-enables it. Nothing is deleted.
 *
 * The request must repeat the account password. The endpoint is authenticated
 * already, but this is destructive enough that a borrowed session should not be
 * able to trigger it.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$input    = ulink_input();
$password = (string) ($input['password'] ?? '');

if ($password === '') {
    ulink_fail('Enter your password to confirm.', 422, ['field' => 'password']);
}

$row = Database::fetchOne(
    'SELECT password_hash, role FROM users WHERE id = :id LIMIT 1',
    ['id' => $userId]
);

if ($row === null || !password_verify($password, (string) $row['password_hash'])) {
    ulink_fail('That password is incorrect.', 401, ['field' => 'password']);
}

// Refuse to empty the administrator bench: if this is the last active admin,
// deactivating would leave nobody able to re-enable anyone.
if (($row['role'] ?? '') === 'admin') {
    $activeAdmins = (int) Database::fetchValue(
        "SELECT COUNT(*) FROM users WHERE role = 'admin' AND is_active = 1"
    );

    if ($activeAdmins <= 1) {
        ulink_fail('You are the only active administrator, so this account cannot be deactivated.', 409);
    }
}

try {
    Database::update('users', ['is_active' => 0], $userId);
} catch (DatabaseException $e) {
    ulink_log_error('Deactivation failed: ' . $e->getMessage(), $e);
    ulink_fail('Could not deactivate your account. Please try again.', 503);
}

ulink_log_activity('account_deactivated', null, $userId);

// Clear the tracking rows so a "device list" never shows a disabled account as
// signed in, then end the current session.
try {
    Database::run('DELETE FROM user_sessions WHERE user_id = :id', ['id' => $userId]);
} catch (Throwable $e) {
    ulink_log_error('Clearing sessions during deactivation failed: ' . $e->getMessage(), $e);
}

ulink_destroy_session();

ulink_ok(['message' => 'Your account has been deactivated.']);
