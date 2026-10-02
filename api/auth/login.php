<?php
/**
 * api/auth/login.php
 *
 * POST /api/auth/login.php
 *
 * Body: { email, password }
 *
 * The `email` field accepts either a registered email address or a student ID,
 * because the sign-in form is labelled "10 Digit Numeric ID Or Valid UIU
 * E-mail" but the original implementation only ever matched on email.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$input    = ulink_input();
$login    = ulink_plain_text(ulink_input_str($input, 'email'), 190);
$password = (string) ($input['password'] ?? '');

if ($login === '' || $password === '') {
    ulink_fail('Enter your email or student ID and your password.', 422);
}

$login = strtolower($login);
$ip    = ulink_client_ip();

/* ------------------------------------------------------------------ *
 | Brute force throttling
 | ------------------------------------------------------------------ */

$maxAttempts = 8;
$window      = 900; // 15 minutes

try {
    // $window is a hard-coded integer, so interpolating it is safe: MySQL does
    // not accept a bound parameter inside an INTERVAL expression.
    $recentFailures = (int) Database::fetchValue(
        "SELECT COUNT(*) FROM login_attempts
          WHERE identifier = :id AND successful = 0
            AND created_at > (NOW() - INTERVAL {$window} SECOND)",
        ['id' => $login]
    );
} catch (Throwable $e) {
    $recentFailures = 0; // Never lock users out because telemetry is broken.
}

if ($recentFailures >= $maxAttempts) {
    header('Retry-After: ' . $window);
    ulink_fail('Too many failed attempts. Please try again in a few minutes.', 429);
}

/** Best effort audit trail; must never block the login itself. */
$recordAttempt = static function (bool $success) use ($login, $ip): void {
    try {
        Database::insert('login_attempts', [
            'identifier' => $login,
            'ip_address' => $ip,
            'successful' => $success ? 1 : 0,
        ]);
    } catch (Throwable $e) {
        ulink_log_error('login_attempts insert failed: ' . $e->getMessage(), $e);
    }
};

/* ------------------------------------------------------------------ *
 | Look the account up by email *or* student id
 | ------------------------------------------------------------------ */

$user = Database::fetchOne(
    'SELECT id, student_id, full_name, email, password_hash, profile_pic, cover_pic,
            department, batch, bio, role, is_active, created_at
       FROM users
      WHERE email = :email OR student_id = :sid
      LIMIT 1',
    ['email' => $login, 'sid' => $login]
);

/*
 * Always run a hash comparison so the response time does not reveal whether an
 * account exists. The previous version returned 404 for unknown users and 401
 * for a wrong password, which leaked the user list.
 */
$hash = is_array($user) ? (string) $user['password_hash'] : '$2y$12$usesomesillystringforsalttoavoidtimingleaks0000000000000000000';
$passwordOk = password_verify($password, $hash);

if (!is_array($user) || !$passwordOk) {
    $recordAttempt(false);
    ulink_fail('Incorrect email/student ID or password.', 401);
}

if ((int) ($user['is_active'] ?? 1) !== 1) {
    $recordAttempt(false);
    ulink_fail('This account has been disabled. Contact support.', 403);
}

$recordAttempt(true);

/* ------------------------------------------------------------------ *
 * Establish the session
 * ------------------------------------------------------------------ */

ulink_start_session_for_user((int) $user['id'], (string) $user['email']);
ulink_record_session((int) $user['id']);

try {
    Database::update('users', ['last_seen_at' => gmdate('Y-m-d H:i:s')], (int) $user['id']);
} catch (Throwable $e) {
    ulink_log_error('Failed to update last_seen_at: ' . $e->getMessage(), $e);
}

ulink_log_activity('user_login', ['email' => $user['email']], (int) $user['id']);

$postsCount = (int) Database::fetchValue(
    'SELECT COUNT(*) FROM posts WHERE user_id = :id',
    ['id' => $user['id']]
);

$public = ulink_user_public($user, true);
$public['posts_count'] = $postsCount;
$public['postsCount'] = $postsCount;
$public['friends_count'] = ulink_friend_count((int) $user['id']);

ulink_ok([
    'message' => 'Login successful.',
    'user'    => $public,
]);
