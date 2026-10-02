<?php
/**
 * api/test/health-check.php
 *
 * GET /api/test/health-check.php
 *
 * Diagnostics for deployment and troubleshooting. Reports problems as data
 * instead of dying, so a single call tells you everything that is wrong.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$health = [
    'status'      => 'ok',
    'timestamp'   => gmdate('c'),
    'app'         => [
        'version'  => '2.0',
        'basePath' => ULINK_BASE_PATH,
        'debug'    => ULINK_DEBUG,
        'php'      => PHP_VERSION,
        'timezone' => date_default_timezone_get(),
    ],
    'extensions'  => [],
    'database'    => [],
    'tables'      => [],
    'files'       => [],
    'permissions' => [],
    'session'     => [
        'active'  => session_status() === PHP_SESSION_ACTIVE,
        'name'    => session_name(),
        'user_id' => ulink_current_user_id(),
    ],
    'issues'      => [],
];

/* ------------------------------------------------------------- extensions */
foreach (['pdo', 'pdo_mysql', 'pdo_sqlite', 'json', 'session', 'mbstring', 'fileinfo'] as $extension) {
    $loaded = extension_loaded($extension);
    $health['extensions'][$extension] = $loaded;

    // pdo_mysql is required for the default driver; the rest are strongly
    // recommended but have graceful fallbacks.
    if (in_array($extension, ['pdo', 'pdo_mysql', 'json', 'session'], true) && !$loaded) {
        $health['issues'][] = "Missing PHP extension: {$extension}";
        $health['status'] = 'error';
    }
}

/* --------------------------------------------------------------- database */
try {
    $pdo = Database::connection();
    $health['database'] = [
        'connected' => true,
        'driver'    => Database::driver(),
        'host'      => ULINK_DB_DRIVER === 'sqlite' ? 'local file' : ULINK_DB_HOST,
        'port'      => ULINK_DB_DRIVER === 'sqlite' ? null : ULINK_DB_PORT,
        'database'  => ULINK_DB_NAME,
        'server'    => (string) $pdo->getAttribute(PDO::ATTR_SERVER_VERSION),
    ];
} catch (Throwable $e) {
    $health['database'] = [
        'connected' => false,
        'driver'    => ULINK_DB_DRIVER,
        'error'     => $e->getMessage(),
    ];
    $health['issues'][] = 'Database is not reachable: ' . $e->getMessage();
    $health['status'] = 'error';
}

/* ----------------------------------------------------------------- tables */
$expectedTables = [
    'users', 'posts', 'post_likes', 'comments', 'communities', 'community_members',
    'friendships', 'messages', 'notifications', 'events', 'event_interest',
    'user_activities', 'login_attempts', 'user_sessions',
];

if (!empty($health['database']['connected'])) {
    foreach ($expectedTables as $table) {
        $exists = Database::tableExists($table);
        $entry = ['exists' => $exists];

        if ($exists) {
            try {
                $entry['rows'] = (int) Database::fetchValue("SELECT COUNT(*) FROM `{$table}`");
            } catch (Throwable $e) {
                $entry['rows'] = null;
                $entry['error'] = $e->getMessage();
            }
        } else {
            $health['issues'][] = "Missing table: {$table} (run api/init/setup.php)";
            $health['status'] = 'error';
        }

        $health['tables'][$table] = $entry;
    }
}

/* ------------------------------------------------------------------ files */
foreach ([
    'index.html',
    'ulink_script.js',
    'backend_integration.js',
    'ulink.css',
    'config/config.php',
    'config/database.php',
    'config/bootstrap.php',
    'config/schema.sql',
    'api/bootstrap.php',
    'api/auth/login.php',
    'api/auth/register.php',
    'api/auth/logout.php',
    'api/auth/session.php',
    'api/posts/fetch.php',
    'api/posts/create.php',
    'api/posts/like.php',
    'api/posts/comment.php',
    'api/users/profile.php',
    'api/users/update.php',
    'api/users/search.php',
    'api/friends/list.php',
    'api/friends/action.php',
    'api/friends/suggestions.php',
    'api/notifications/list.php',
    'api/notifications/read.php',
    'api/communities/list.php',
    'api/communities/detail.php',
    'api/communities/action.php',
    'api/messages/conversations.php',
    'api/messages/fetch.php',
    'api/messages/send.php',
    'api/events/list.php',
    'api/events/rsvp.php',
    'api/activities/log.php',
    'api/activities/get.php',
    'api/init/setup.php',
] as $file) {
    $health['files'][$file] = is_file(ULINK_BASE_PATH . '/' . $file);
}

/* ------------------------------------------------------------ permissions */
foreach (ulink_ensure_upload_dirs() as $problem) {
    $health['issues'][] = 'Upload directory problem: ' . $problem;
    $health['status'] = 'error';
}

$health['permissions'] = [
    'uploads' => [
        'exists'   => is_dir(ULINK_UPLOAD_PATH),
        'readable' => is_readable(ULINK_UPLOAD_PATH),
        'writable' => is_writable(ULINK_UPLOAD_PATH),
    ],
    'uploads/profiles' => [
        'exists'   => is_dir(ULINK_UPLOAD_PATH . '/profiles'),
        'readable' => is_readable(ULINK_UPLOAD_PATH . '/profiles'),
        'writable' => is_writable(ULINK_UPLOAD_PATH . '/profiles'),
    ],
    'logs' => [
        'exists'   => is_dir(ULINK_BASE_PATH . '/logs'),
        'writable' => is_writable(ULINK_BASE_PATH . '/logs'),
    ],
];

/* ------------------------------------------------------------------- done */
$health['ok'] = $health['issues'] === [];

ulink_json([
    'status'  => $health['status'],
    'message' => $health['ok']
        ? 'All systems operational.'
        : count($health['issues']) . ' issue(s) detected.',
    'report'  => $health,
], $health['ok'] ? 200 : 503);
