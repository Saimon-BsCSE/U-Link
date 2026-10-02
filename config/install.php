<?php
/**
 * config/install.php
 *
 * Command line installer. Applies config/schema.sql, creates the database if
 * it is missing and can load the demo data set.
 *
 *   php config/install.php              install the schema
 *   php config/install.php --seed       install and load demo data
 *   php config/install.php --seed-only  load demo data into an existing database
 *   php config/install.php --force      drop and recreate every table first
 *
 * This performs exactly the same work as /api/init/setup.php, without needing
 * a browser or an HTTP request.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("config/install.php can only be run from the command line.\n");
}

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/seed.php';

$options = array_slice($argv, 1);
$wantSeed = in_array('--seed', $options, true);
$seedOnly = in_array('--seed-only', $options, true);
$force    = in_array('--force', $options, true);

$isSqlite = ULINK_DB_DRIVER === 'sqlite';

function say(string $message): void
{
    fwrite(STDOUT, $message . PHP_EOL);
}

function fail(string $message): never
{
    fwrite(STDERR, 'error: ' . $message . PHP_EOL);
    exit(1);
}

say('');
say('U-Link installer');
say('---------------');
say('driver    : ' . ULINK_DB_DRIVER);
say('database  : ' . ($isSqlite ? ULINK_DB_NAME : ULINK_DB_NAME . '@' . ULINK_DB_HOST . ':' . ULINK_DB_PORT));
say('');

/* ------------------------------------------------------------------ *
 * Create the database, then open it
 * ------------------------------------------------------------------ */

if (!$isSqlite) {
    try {
        $server = Database::connectToServer();
        $server->exec(sprintf(
            'CREATE DATABASE IF NOT EXISTS `%s` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
            str_replace('`', '', ULINK_DB_NAME)
        ));
        say('[ok] database `' . ULINK_DB_NAME . '` exists');
    } catch (Throwable $e) {
        fail('could not create the database: ' . $e->getMessage());
    }
}

try {
    $pdo = Database::connection();
    say('[ok] connected to `' . ULINK_DB_NAME . '`');
} catch (DatabaseException $e) {
    fail('cannot open the target database: ' . $e->getMessage());
}

/* ------------------------------------------------------------------ *
 * Optionally drop everything first
 * ------------------------------------------------------------------ */

if ($force) {
    $tables = [
        'post_reports', 'saved_posts', 'user_settings',
        'user_sessions', 'login_attempts', 'user_activities', 'event_interest', 'events',
        'notifications', 'messages', 'friendships', 'comments', 'post_likes', 'posts',
        'community_members', 'communities', 'users',
    ];

    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach ($tables as $table) {
        $pdo->exec("DROP TABLE IF EXISTS `{$table}`");
    }
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
    say('[ok] dropped ' . count($tables) . ' existing tables');
}

/* ------------------------------------------------------------------ *
 | Apply the schema
 * ------------------------------------------------------------------ */

if (!$seedOnly) {
    $schemaPath = ULINK_BASE_PATH . '/config/schema.sql';
    if (!is_readable($schemaPath)) {
        fail('cannot read config/schema.sql');
    }

    $sql = file_get_contents($schemaPath);
    if ($sql === false) {
        fail('cannot read config/schema.sql');
    }

    $statements = array_values(array_filter(
        ulink_split_sql($sql),
        static function (string $statement): bool {
            $normalised = ltrim($statement);
            return stripos($normalised, 'USE ') !== 0
                && stripos($normalised, 'CREATE DATABASE') !== 0;
        }
    ));

    say('[..] applying ' . count($statements) . ' statements');

    $applied = 0;
    foreach ($statements as $statement) {
        try {
            $pdo->exec($statement);
            $applied++;
        } catch (Throwable $e) {
            $preview = substr(preg_replace('/\s+/', ' ', $statement) ?? $statement, 0, 120);
            fwrite(STDERR, '[!!] failed: ' . $preview . PHP_EOL);
            fwrite(STDERR, '     ' . $e->getMessage() . PHP_EOL);
            exit(1);
        }
    }

    say('[ok] applied ' . $applied . ' statements');
}

/* ------------------------------------------------------------------ *
 * Column migrations
 *
 * The schema is CREATE TABLE IF NOT EXISTS, so re-running it is safe but it
 * will not add a column to a table that already exists. Every column added
 * after a database was first created is therefore listed in
 * ulink_column_migrations() and applied here, or an existing install keeps
 * running the old shape.
 * ------------------------------------------------------------------ */

// Runs in seed-only mode too: the operations are idempotent and no-op when the
// table does not exist, so there is no reason to skip them there.
$added = ulink_apply_column_migrations();

if ($added === []) {
    say('[ok] schema columns already current');
} else {
    foreach ($added as $table => $columns) {
        say('[ok] added to ' . $table . ': ' . implode(', ', $columns));
    }
}

// A migration typo that silently no-ops is the worst outcome here, so the
// applied shape is checked against what was asked for rather than trusted.
foreach (ulink_column_migrations() as $table => $columns) {
    if (!Database::tableExists($table)) {
        continue;   // verified below by the table check
    }
    $live = array_map('strval', Database::columns($table));
    foreach (array_keys($columns) as $column) {
        if (!in_array($column, $live, true)) {
            fail('migration did not take effect: ' . $table . '.' . $column);
        }
    }
}
say('[ok] verified migrated columns');

/* ------------------------------------------------------------------ *
 * Verify
 * ------------------------------------------------------------------ */

$expected = [
    'users', 'posts', 'post_likes', 'comments', 'communities', 'community_members',
    'friendships', 'messages', 'notifications', 'events', 'event_interest',
    'user_activities', 'login_attempts', 'user_sessions', 'user_settings',
    'saved_posts', 'post_reports',
];

$missing = array_values(array_filter($expected, static fn(string $t): bool => !Database::tableExists($t)));

if ($missing !== []) {
    fail('these tables are still missing: ' . implode(', ', $missing));
}
say('[ok] all ' . count($expected) . ' tables present');

/* ------------------------------------------------------------------ *
 * Upload directories
 * ------------------------------------------------------------------ */

$dirProblems = ulink_ensure_upload_dirs();
if ($dirProblems === []) {
    say('[ok] uploads directory is writable');
} else {
    foreach ($dirProblems as $problem) {
        fwrite(STDERR, '[!!] ' . $problem . PHP_EOL);
    }
    fail('fix the upload directory permissions listed above');
}

// Clear out guards left behind for images that no longer exist. Cheap, safe, and
// it only has to run once to undo what earlier versions accumulated.
$orphans = ulink_prune_orphan_upload_guards();
say($orphans === 0
    ? '[ok] no orphaned upload guards to clean up'
    : '[ok] removed ' . $orphans . ' orphaned upload guard(s)');

/* ------------------------------------------------------------------ *
 * Seed
 * ------------------------------------------------------------------ */

if ($wantSeed || $seedOnly) {
    say('[..] loading demo data');
    $result = ulink_seed_demo_data();

    if (($result['status'] ?? '') === 'error') {
        // The two failure paths report under different keys: a missing table
        // sets `error`, everything else arrives as an exception or as `message`.
        // Reading only one of them is how a failed seed once reported itself as
        // a success with a generic reason.
        fail($result['error'] ?? $result['message'] ?? 'seeding failed');
    }

    if ($result['skipped'] ?? false) {
        say('[ok] ' . ($result['message'] ?? 'seeding skipped'));
    } else {
        say('[ok] users:       ' . $result['users']);
        say('[ok] communities: ' . $result['communities']);
        say('[ok] events:      ' . $result['events']);
        say('[ok] posts:       ' . $result['posts']);
        say('[ok] comments:    ' . $result['comments']);
        say('');
        say('Demo login: ' . ($result['demo_login'] ?? 'saimon@uiu.ac.bd / password123'));
    }
}

say('');
say('Installation complete. Start the server with:  ./scripts/dev.sh start');
say('');
