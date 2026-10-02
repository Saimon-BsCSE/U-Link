<?php
/**
 * api/auth/logout.php
 *
 * GET|POST /api/auth/logout.php
 *
 * The frontend issues a plain GET, so both verbs are accepted.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET', 'POST');

$userId = ulink_current_user_id();

if ($userId !== null) {
    // Record the logout before the session is torn down, otherwise the
    // activity logger can no longer resolve the user id.
    ulink_log_activity('user_logout', [], $userId);
    ulink_forget_session_record();
}

ulink_destroy_session();

ulink_ok(['message' => 'Logged out successfully.']);
