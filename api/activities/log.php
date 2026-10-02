<?php
/**
 * api/activities/log.php
 *
 * POST /api/activities/log.php
 *
 * Body: { activity_type, details?, timestamp? }
 *
 * Security fix: the original endpoint preferred a client supplied `user_id`
 * over the session, so any caller could write activity rows against any
 * account. The user id now always comes from the session, and unknown activity
 * types are rejected.
 *
 * `details` is accepted both as a JSON string (what the frontend sends) and as
 * an object.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$input = ulink_input();
$type  = ulink_input_str($input, 'activity_type', ulink_input_str($input, 'type'));

if ($type === '') {
    ulink_fail('activity_type is required.', 422);
}

if (!in_array($type, ULINK_ACTIVITY_TYPES, true)) {
    // Silently drop unknown types: the client must not be able to invent
    // telemetry categories, and a 4xx here would only produce console noise
    // for an otherwise successful action.
    ulink_fail('Unsupported activity type.', 422, ['supported' => ULINK_ACTIVITY_TYPES]);
}

$details = $input['details'] ?? null;
if ($details !== null && !is_string($details) && !is_array($details)) {
    $details = null;
}

ulink_log_activity($type, $details, $userId);

ulink_ok(['message' => 'Activity logged.']);
