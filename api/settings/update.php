<?php
/**
 * api/settings/update.php
 *
 * POST /api/settings/update.php
 *
 * Body: any subset of the keys below. Unknown keys are ignored; sending none
 * of the known keys is a 422 so a typo cannot silently "succeed".
 *
 *   compact_feed, reduce_motion, show_online_status, allow_search_by_id,
 *   notify_likes, notify_comments, notify_friend_requests, notify_events  (bool)
 *   profile_visibility  (public | friends | private)
 *   message_privacy     (everyone | friends)
 *
 * This is the only writer for `user_settings`, so every enum is validated here
 * rather than trusted at read time.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$input = ulink_input();

$boolKeys = [
    'compact_feed',
    'reduce_motion',
    'show_online_status',
    'allow_search_by_id',
    'notify_likes',
    'notify_comments',
    'notify_friend_requests',
    'notify_events',
];

$enumKeys = [
    'profile_visibility' => ['public', 'friends', 'private'],
    'message_privacy'    => ['everyone', 'friends'],
];

$updates = [];
$changed = [];

foreach ($boolKeys as $key) {
    if (!array_key_exists($key, $input)) {
        continue;
    }

    $value = ulink_input_bool($input, $key) ? 1 : 0;
    $updates[$key] = $value;
    $changed[] = $key;
}

foreach ($enumKeys as $key => $allowed) {
    if (!array_key_exists($key, $input)) {
        continue;
    }

    $value = strtolower(ulink_input_str($input, $key));
    if (!in_array($value, $allowed, true)) {
        ulink_fail(
            ucfirst(str_replace('_', ' ', $key)) . ' must be one of: ' . implode(', ', $allowed) . '.',
            422,
            ['field' => $key]
        );
    }

    $updates[$key] = $value;
    $changed[] = $key;
}

if ($updates === []) {
    ulink_fail('No recognised settings were provided.', 422);
}

// Make sure the row exists before the UPDATE rather than after: an UPDATE that
// matches no rows reports 0 and would otherwise look like a successful save.
ulink_user_settings($userId);

try {
    Database::update('user_settings', $updates, $userId, 'user_id');
} catch (DatabaseException $e) {
    ulink_log_error('Settings update failed: ' . $e->getMessage(), $e);
    ulink_fail('Could not save your settings. Please try again.', 503);
}

ulink_forget_user_settings($userId);

$fresh = ulink_user_settings($userId);

ulink_log_activity('settings_updated', ['fields' => $changed], $userId);

ulink_ok([
    'message'  => 'Settings saved.',
    'settings' => ulink_settings_public($fresh),
    'updated'  => $changed,
]);
