<?php
/**
 * api/init/setup.php
 *
 * GET|POST /api/init/setup.php
 *
 * Creates the database (if needed), applies config/schema.sql and optionally
 * loads the demo data set.
 *
 * Why this was rewritten: the original split the schema on ";" and discarded
 * any statement that started with "--". Every CREATE TABLE in schema.sql is
 * preceded by a "-- comment" line, so *all* of them were filtered out and the
 * script reported "Database initialized successfully" having created nothing.
 * It also required an already-existing database to connect to before it could
 * create one.
 *
 * Set ULINK_SETUP_TOKEN to require `?token=...` in production.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET', 'POST');

/* ------------------------------------------------------------------ *
 | Guard
 | ------------------------------------------------------------------ */

if (ULINK_SETUP_TOKEN !== '') {
    $provided = ulink_query_str('token') ?: ulink_input_str(ulink_input(), 'token');
    if (!hash_equals(ULINK_SETUP_TOKEN, $provided)) {
        ulink_fail('A valid setup token is required.', 403);
    }
}

$shouldSeed = ulink_query_int('seed', ulink_input_bool(ulink_input(), 'seed') ? 1 : 0) === 1;

/* ------------------------------------------------------------------ *
 * 1. Make sure the database exists
 * ------------------------------------------------------------------ */

// $existed records whether the schema was already in place before this run, so
// the response can honestly report whether anything was actually created. It
// previously reported `created => true` on every single run, because
// CREATE DATABASE IF NOT EXISTS runs unconditionally.
$existed = Database::tableExists('users');

try {
    $server = Database::connectToServer();

    if (Database::driver() !== 'sqlite') {
        $server->exec(sprintf(
            'CREATE DATABASE IF NOT EXISTS `%s` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
            str_replace('`', '', ULINK_DB_NAME)
        ));
    }
} catch (DatabaseException $e) {
    ulink_log_error('setup: could not reach the database server: ' . $e->getMessage(), $e);
    ulink_fail(
        'Could not connect to the database server. Check ULINK_DB_HOST / ULINK_DB_PORT / '
        . 'ULINK_DB_USER in your .env file. (' . $e->getMessage() . ')',
        503
    );
}

/* ------------------------------------------------------------------ *
 * 2. Apply the schema
 | ------------------------------------------------------------------ */

$schemaPath = ULINK_BASE_PATH . '/config/schema.sql';

if (!is_readable($schemaPath)) {
    ulink_fail('Schema file not found at config/schema.sql.', 500);
}

$schema = file_get_contents($schemaPath);
if ($schema === false) {
    ulink_fail('Schema file could not be read.', 500);
}

$statements = ulink_split_sql($schema);

// CREATE DATABASE / USE are handled above; running them again is harmless but
// pointless, and `USE` would be rejected by some drivers.
$statements = array_values(array_filter($statements, static function (string $sql): bool {
    $normalised = ltrim($sql);
    return stripos($normalised, 'USE ') !== 0 && stripos($normalised, 'CREATE DATABASE') !== 0;
}));

$executed = 0;
$errors   = [];

foreach ($statements as $sql) {
    try {
        Database::connection()->exec($sql);
        $executed++;
    } catch (Throwable $e) {
        $errors[] = [
            'statement' => substr(preg_replace('/\s+/', ' ', $sql) ?? $sql, 0, 160),
            'error'     => $e->getMessage(),
        ];
        ulink_log_error('setup: statement failed: ' . $e->getMessage() . ' :: ' . substr($sql, 0, 120));
    }
}

// schema.sql is CREATE TABLE IF NOT EXISTS, so re-running it on an existing
// install never adds a column. Apply the recorded column migrations too, the
// same way config/install.php does, so the web setup path leaves the database
// fully current instead of one schema revision behind.
$migrated = [];
try {
    $migrated = ulink_apply_column_migrations();
} catch (Throwable $e) {
    $errors[] = ['statement' => 'column migrations', 'error' => $e->getMessage()];
    ulink_log_error('setup: column migration failed: ' . $e->getMessage(), $e);
}

if ($errors !== []) {
    ulink_fail('Schema could not be fully applied.', 500, [
        'applied' => $executed,
        'errors'  => $errors,
    ]);
}

/* ------------------------------------------------------------------ *
 * 3. Uploads
 * ------------------------------------------------------------------ */

$dirProblems = ulink_ensure_upload_dirs();

/* ------------------------------------------------------------------ *
 * 4. Optional demo data
 * ------------------------------------------------------------------ */

$seeded = null;
if ($shouldSeed) {
    try {
        $seeder = require ULINK_BASE_PATH . '/config/seed.php';
        $seeded = is_callable($seeder) ? $seeder() : ['status' => 'unavailable'];
    } catch (Throwable $e) {
        ulink_log_error('setup: seeding failed: ' . $e->getMessage(), $e);
        $seeded = ['status' => 'error', 'error' => $e->getMessage()];
    }
}

/* ------------------------------------------------------------------ *
 * 5. Report
 * ------------------------------------------------------------------ */

ulink_ok([
    'message' => 'Database initialized successfully.',
    'database'=> ULINK_DB_NAME,
    'driver'  => Database::driver(),
    'created' => !$existed,
    'existed' => $existed,
    'statements' => $executed,
    'migrations' => $migrated,
    'tables'   => array_values(array_filter([
        'users', 'posts', 'post_likes', 'comments', 'communities', 'community_members',
        'friendships', 'messages', 'notifications', 'events', 'event_interest',
        'user_activities', 'login_attempts', 'user_sessions', 'user_settings',
        'saved_posts', 'post_reports',
    ], static fn(string $t): bool => Database::tableExists($t))),
    'uploads' => $dirProblems === [] ? 'ok' : $dirProblems,
    'seed'    => $seeded,
]);
