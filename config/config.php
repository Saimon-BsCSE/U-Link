<?php
/**
 * config/config.php
 *
 * Central application configuration.
 *
 * Every value can be overridden with an environment variable, or by placing a
 * `.env` file in the project root (one `KEY=value` per line, `#` comments).
 * Environment variables win over the `.env` file, which wins over the defaults
 * below. Defaults mirror the original local-development setup so the project
 * still runs with zero configuration.
 */

if (!function_exists('ulink_load_dotenv')) {
    /**
     * Minimal `.env` loader. Deliberately dependency free: it only reads
     * `KEY=value` pairs and never overrides a variable that is already set in
     * the real environment.
     */
    function ulink_load_dotenv(string $file): void
    {
        if (!is_readable($file)) {
            return;
        }

        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
                continue;
            }

            [$key, $value] = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            // Strip matching surrounding quotes.
            $len = strlen($value);
            if ($len >= 2 && ($value[0] === '"' || $value[0] === "'")
                && $value[$len - 1] === $value[0]) {
                $value = substr($value, 1, -1);
            }

            if ($key !== '' && getenv($key) === false) {
                putenv($key . '=' . $value);
                $_ENV[$key] = $value;
            }
        }
    }
}

if (!function_exists('ulink_env')) {
    /**
     * Read a configuration value from the environment.
     *
     * The literal strings "null" and "false" are treated as empty so a template
     * can explicitly blank out a value.
     */
    function ulink_env(string $key, $default = null)
    {
        $value = getenv($key);
        if ($value === false) {
            return $default;
        }

        if (is_string($value)) {
            $lowered = strtolower(trim($value));
            if ($lowered === '' || $lowered === 'null' || $lowered === 'false') {
                return $default;
            }
        }

        return $value;
    }
}

if (!function_exists('ulink_env_bool')) {
    function ulink_env_bool(string $key, bool $default = false): bool
    {
        $value = ulink_env($key);
        if ($value === null) {
            return $default;
        }
        if (is_bool($value)) {
            return $value;
        }
        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
    }
}

if (!function_exists('ulink_env_int')) {
    function ulink_env_int(string $key, int $default): int
    {
        $value = ulink_env($key);
        if ($value === null || !is_numeric($value)) {
            return $default;
        }
        return (int) $value;
    }
}

if (!function_exists('ulink_env_list')) {
    /** Read a comma separated environment value as a trimmed list. */
    function ulink_env_list(string $key, array $default = []): array
    {
        $value = ulink_env($key);
        if ($value === null) {
            return $default;
        }
        $items = array_values(array_filter(
            array_map('trim', explode(',', (string) $value)),
            static fn($item) => $item !== ''
        ));
        return $items ?: $default;
    }
}

/* -------------------------------------------------------------------------
 | Configuration
 |
 | Guarded by a sentinel so the file stays safe to `include` more than once
 | (several endpoints include both config.php and database.php).
 | ---------------------------------------------------------------------- */

if (!defined('ULINK_CONFIG_LOADED')) {
    define('ULINK_CONFIG_LOADED', true);

    /** Absolute path to the project root (the directory holding index.html). */
    define('ULINK_BASE_PATH', dirname(__DIR__));

    ulink_load_dotenv(ULINK_BASE_PATH . '/.env');

    /** Absolute path to the publicly served uploads directory. */
    define('ULINK_UPLOAD_PATH', ULINK_BASE_PATH . '/uploads');

    /* -------------------------------------------------------------- Runtime */

    define('ULINK_DEBUG', ulink_env_bool('ULINK_DEBUG', false));

    /** Comma separated list of allowed origins, or `*` for any. */
    define('ULINK_ALLOWED_ORIGINS', (string) ulink_env('ULINK_ALLOWED_ORIGINS', '*'));

    /** Shared secret required by api/init/setup.php. Empty means "no token". */
    define('ULINK_SETUP_TOKEN', (string) ulink_env('ULINK_SETUP_TOKEN', ''));

    /* ------------------------------------------------------------- Database */

    define('ULINK_DB_DRIVER', strtolower((string) ulink_env('ULINK_DB_DRIVER', 'mysql')));
    define('ULINK_DB_HOST', (string) ulink_env('ULINK_DB_HOST', '127.0.0.1'));
    define('ULINK_DB_PORT', ulink_env_int('ULINK_DB_PORT', 3306));
    define('ULINK_DB_NAME', (string) ulink_env('ULINK_DB_NAME', 'ulink_db'));
    define('ULINK_DB_USER', (string) ulink_env('ULINK_DB_USER', 'root'));
    define('ULINK_DB_PASS', (string) ulink_env('ULINK_DB_PASS', ''));
    define('ULINK_DB_CHARSET', (string) ulink_env('ULINK_DB_CHARSET', 'utf8mb4'));

    /** Reconnection attempts after a dropped connection. */
    define('ULINK_DB_RETRIES', ulink_env_int('ULINK_DB_RETRIES', 2));

    /* ------------------------------------------------------------- Sessions */

    define('ULINK_SESSION_NAME', (string) ulink_env('ULINK_SESSION_NAME', 'ulink_session'));
    define('ULINK_SESSION_LIFETIME', ulink_env_int('ULINK_SESSION_LIFETIME', 86400 * 7));
    define('ULINK_SESSION_SAMESITE', (string) ulink_env('ULINK_SESSION_SAMESITE', 'Lax'));

    /** Auto-detected: only force the Secure flag when the request is over HTTPS. */
    define('ULINK_COOKIE_SECURE', ulink_env_bool('ULINK_COOKIE_SECURE',
        (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
        || (($_SERVER['SERVER_PORT'] ?? '') === '443')
    ));

    /** Only trust X-Forwarded-For when explicitly enabled behind a known proxy. */
    define('ULINK_TRUST_PROXY', ulink_env_bool('ULINK_TRUST_PROXY', false));

    /* -------------------------------------------------------------- Uploads */

    define('ULINK_UPLOAD_MAX_BYTES', ulink_env_int('ULINK_UPLOAD_MAX_BYTES', 5 * 1024 * 1024));
    define('ULINK_UPLOAD_MAX_DIMENSION', ulink_env_int('ULINK_UPLOAD_MAX_DIMENSION', 2000));

    /* ----------------------------------------------------------- Attachments */

    // Documents are capped lower than images: they travel through the chat
    // composer and are not displayed inline, so a large file is no benefit.
    define('ULINK_ATTACHMENT_MAX_BYTES', ulink_env_int('ULINK_ATTACHMENT_MAX_BYTES', 10 * 1024 * 1024));
    define('ULINK_ATTACHMENT_MAX_CHARS', ulink_env_int('ULINK_ATTACHMENT_MAX_CHARS', 180));

    /* ---------------------------------------------------------- Text limits */

    define('ULINK_POST_MAX_CHARS', ulink_env_int('ULINK_POST_MAX_CHARS', 5000));
    define('ULINK_COMMENT_MAX_CHARS', ulink_env_int('ULINK_COMMENT_MAX_CHARS', 2000));
    define('ULINK_BIO_MAX_CHARS', ulink_env_int('ULINK_BIO_MAX_CHARS', 500));
    define('ULINK_MESSAGE_MAX_CHARS', ulink_env_int('ULINK_MESSAGE_MAX_CHARS', 4000));

    /* ----------------------------------------------------------- Pagination */

    define('ULINK_PAGE_DEFAULT', ulink_env_int('ULINK_PAGE_DEFAULT', 20));
    define('ULINK_PAGE_MAX', ulink_env_int('ULINK_PAGE_MAX', 50));

    /* --------------------------------------------------------- Domain rules */

    define('ULINK_MIN_PASSWORD_LENGTH', ulink_env_int('ULINK_MIN_PASSWORD_LENGTH', 8));
    define('ULINK_MAX_PASSWORD_LENGTH', ulink_env_int('ULINK_MAX_PASSWORD_LENGTH', 128));
    define('ULINK_MAX_NAME_LENGTH', ulink_env_int('ULINK_MAX_NAME_LENGTH', 120));
    define('ULINK_MAX_STUDENT_ID_LENGTH', ulink_env_int('ULINK_MAX_STUDENT_ID_LENGTH', 20));

    /**
     * Activity types the client is allowed to record. Anything else is dropped
     * so the telemetry table cannot be used to inject arbitrary values.
     */
    define('ULINK_ACTIVITY_TYPES', [
        'post_created',
        'post_liked',
        'post_unliked',
        'post_deleted',
        'post_edited',
        'post_saved',
        'post_reported',
        'comment_added',
        'user_login',
        'user_logout',
        'user_registered',
        'profile_updated',
        'page_view',
        'friend_request_sent',
        'friend_request_accepted',
        'friend_request_rejected',
        'friend_removed',
        'community_joined',
        'community_left',
        'message_sent',
        'event_rsvp',
        'search',
        'account_deactivated',
        'password_changed',
        'password_change_failed',
    ]);
}
