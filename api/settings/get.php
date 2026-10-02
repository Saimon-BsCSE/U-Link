<?php
/**
 * api/settings/get.php
 *
 * GET /api/settings/get.php
 *
 * Returns the signed-in user's preferences. The row is created on demand, so
 * a brand-new account answers with the defaults rather than a 404.
 *
 * Response `settings` uses JSON booleans/strings, which is what the settings
 * panels bind to; the raw 0/1 integers would land in `input.checked` as the
 * string "0" and read as truthy.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$me = ulink_require_auth();
$userId = (int) $me['id'];

ulink_ok([
    'settings' => ulink_settings_public(ulink_user_settings($userId)),
]);
