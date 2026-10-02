<?php
/**
 * config/bootstrap.php
 *
 * Single entry point shared by every API endpoint. Handles CORS and preflight,
 * secure sessions, JSON request/response plumbing, authentication, activity
 * logging, notifications and image uploads.
 *
 * Endpoints should start with:
 *
 *     require_once __DIR__ . '/../../config/bootstrap.php';
 *     ulink_require_method('POST');
 *     $user = ulink_require_auth();
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/sql.php';

/* -------------------------------------------------------------------------
 | Errors
 | ---------------------------------------------------------------------- */

if (!defined('ULINK_ERRORS_CONFIGURED')) {
    define('ULINK_ERRORS_CONFIGURED', true);

    // Never leak a stack trace to the browser; log it instead.
    ini_set('display_errors', '0');
    error_reporting(E_ALL);

    set_error_handler(static function (int $severity, string $message, string $file = '', int $line = 0): bool {
        if (!(error_reporting() & $severity)) {
            return false;
        }
        throw new ErrorException($message, 0, $severity, $file, $line);
    });

    set_exception_handler(static function (Throwable $e): void {
        ulink_log_error('Uncaught ' . get_class($e) . ': ' . $e->getMessage(), $e);

        // config/install.php and the test scripts share this bootstrap, and both
        // judge success by the exit code. This handler used to emit a JSON body
        // and then return normally, which under the CLI SAPI means exit 0 - so a
        // demo seed that died half way through still let `setup.sh` print
        // "Setup complete", with the missing rows never mentioned. On the
        // command line the diagnostic belongs on stderr and the status has to
        // be non-zero.
        if (PHP_SAPI === 'cli') {
            fwrite(STDERR, 'error: ' . $e->getMessage() . PHP_EOL);
            exit(1);
        }

        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=UTF-8');
        }

        echo json_encode([
            'status'  => 'error',
            'message' => ULINK_DEBUG ? $e->getMessage() : 'An unexpected server error occurred.',
        ], JSON_UNESCAPED_SLASHES);

        exit(1);
    });
}

if (!function_exists('ulink_log_error')) {
    /** Append a diagnostic line to the project log. Never throws. */
    function ulink_log_error(string $message, ?Throwable $e = null): void
    {
        $logDir = ULINK_BASE_PATH . '/logs';
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0775, true);
        }
        if (!is_writable($logDir)) {
            return;
        }

        $line = sprintf(
            "[%s] %s%s\n",
            gmdate('Y-m-d H:i:s'),
            $message,
            $e ? "\n" . $e->getTraceAsString() : ''
        );

        @file_put_contents($logDir . '/app.log', $line, FILE_APPEND | LOCK_EX);
    }
}

if (!function_exists('ulink_log_info')) {
    /**
     * Record a notable but non-fatal event - a migration that altered a table, a
     * retry that succeeded. Same log file as ulink_log_error(), so a support
     * dump is one file; the difference is intent, and an informational line
     * written through ulink_log_error() reads as a fault when it is not.
     */
    function ulink_log_info(string $message): void
    {
        ulink_log_error($message);
    }
}

/* -------------------------------------------------------------------------
 | CORS
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_is_origin_allowed')) {
    function ulink_is_origin_allowed(string $origin): bool
    {
        $allowed = ULINK_ALLOWED_ORIGINS;

        if ($allowed === '*') {
            return true;
        }

        foreach (ulink_env_list('ULINK_ALLOWED_ORIGINS') as $entry) {
            if ($entry === '*' || strcasecmp($entry, $origin) === 0) {
                return true;
            }
            // Support `https://example.com` matching `https://example.com:8443`.
            if (rtrim($entry, '/') === rtrim($origin, '/')) {
                return true;
            }
        }

        return false;
    }
}

if (!function_exists('ulink_apply_cors')) {
    /**
     * Emit CORS and hardening headers, and answer preflight requests.
     *
     * Credentials are never combined with a wildcard origin: browsers reject
     * `Access-Control-Allow-Origin: *` together with
     * `Access-Control-Allow-Credentials: true`, which silently broke
     * session cookies on any cross-origin deployment.
     */
    function ulink_apply_cors(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if ($origin !== '' && ulink_is_origin_allowed($origin)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
            header('Access-Control-Allow-Credentials: true');
        } elseif (ULINK_ALLOWED_ORIGINS === '*' && !ulink_env_bool('ULINK_REQUIRE_ORIGIN', false)) {
            header('Access-Control-Allow-Origin: *');
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
        header('Access-Control-Expose-Headers: X-Total-Count');
        header('Access-Control-Max-Age: 86400');

        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('Referrer-Policy: strict-origin-when-cross-origin');

        if (ulink_env_bool('ULINK_HSTS', false)) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }

        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}

/* -------------------------------------------------------------------------
 | Sessions
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_start_session')) {
    /**
     * Start a hardened session with a consistent cookie configuration.
     *
     * The original code configured cookies only in login.php with
     * SameSite=Strict, so logout.php, session.php and every posts endpoint
     * started a session with PHP's defaults (a *different* cookie). A user
     * could therefore be logged in and yet appear logged out to some
     * endpoints. Configuration now lives in exactly one place.
     */
    function ulink_start_session(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        if (headers_sent()) {
            // Cannot set cookies any more; the request still works for
            // read-only endpoints.
            return;
        }

        session_name(ULINK_SESSION_NAME);

        session_set_cookie_params([
            'lifetime' => ULINK_SESSION_LIFETIME,
            'path'     => '/',
            'domain'   => '',
            // SameSite=Lax still blocks cross-site POSTs (the CSRF vector that
            // matters) while not breaking normal same-site navigation.
            'secure'   => ULINK_COOKIE_SECURE,
            'httponly' => true,
            'samesite' => ULINK_SESSION_SAMESITE,
        ]);

        @session_start([
            'cookie_httponly' => true,
            'use_strict_mode' => true, // Reject attacker-supplied session IDs.
            'use_only_cookies' => true,
            'gc_maxlifetime'  => ULINK_SESSION_LIFETIME,
        ]);
    }
}

/* -------------------------------------------------------------------------
 | Responses
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_json')) {
    /** Send a JSON response and terminate the request. */
    function ulink_json(array $payload, int $status = 200): void
    {
        if (!headers_sent()) {
            http_response_code($status);
            header('Content-Type: application/json; charset=UTF-8');
            header('Cache-Control: no-store, no-cache, must-revalidate');
            header('X-Content-Type-Options: nosniff');
        }

        $json = json_encode(
            $payload,
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR
        );

        echo $json === false ? '{"status":"error","message":"Response encoding failed."}' : $json;
        exit;
    }
}

if (!function_exists('ulink_ok')) {
    /**
     * Send a success envelope.
     *
     * `status` belongs to the envelope, so a payload key of the same name is
     * dropped rather than merged. Previously the `+` operator dropped it
     * silently, which hid a real bug in events/rsvp.php: the endpoint asked for
     * `status => 'interested'` and the caller received `status => 'success'`, so
     * the RSVP state never reached the client. `message` is deliberately still
     * allowed through - a success response may carry its own copy.
     */
    function ulink_ok(array $payload = [], int $status = 200): void
    {
        unset($payload['status']);

        ulink_json(['status' => 'success'] + $payload, $status);
    }
}

if (!function_exists('ulink_fail')) {
    function ulink_fail(string $message, int $status = 400, array $extra = []): void
    {
        unset($extra['status'], $extra['message']);

        ulink_json(['status' => 'error', 'message' => $message] + $extra, $status);
    }
}

if (!function_exists('ulink_method_not_allowed')) {
    function ulink_method_not_allowed(array $allowed): void
    {
        header('Allow: ' . implode(', ', $allowed));
        ulink_fail('Method not allowed.', 405);
    }
}

if (!function_exists('ulink_require_method')) {
    /** Abort unless the current request method is one of $allowed. */
    function ulink_require_method(string ...$allowed): void
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        if (!in_array($method, array_map('strtoupper', $allowed), true)) {
            ulink_method_not_allowed($allowed);
        }
    }
}

/* -------------------------------------------------------------------------
 | Input
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_input')) {
    /**
     * Read the request payload.
     *
     * Accepts a JSON body, form encoded data or a JSON body sent as the
     * `payload` form field. The original code only ever looked at
     * php://input plus $_POST and threw notices on arrays.
     *
     * @return array<string, mixed>
     */
    function ulink_input(): array
    {
        static $cache = null;

        if ($cache !== null) {
            return $cache;
        }

        $data = [];

        $raw = file_get_contents('php://input');
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $data = $decoded;
            }
        }

        if ($data === [] && isset($_POST['payload']) && is_string($_POST['payload'])) {
            $decoded = json_decode($_POST['payload'], true);
            if (is_array($decoded)) {
                $data = $decoded;
            }
        }

        if ($data === []) {
            $data = $_POST;
        }

        $cache = $data;
        return $data;
    }
}

if (!function_exists('ulink_input_str')) {
    /**
     * Read a string field.
     *
     * Arrays (from `?a[]=1` style parameters) are rejected rather than
     * silently coerced, which used to raise "Array to string conversion".
     */
    function ulink_input_str(array $data, string $key, string $default = ''): string
    {
        if (!array_key_exists($key, $data)) {
            return $default;
        }

        $value = $data[$key];
        if ($value === null || is_bool($value) || is_array($value) || is_object($value)) {
            return $default;
        }

        return trim((string) $value);
    }
}

if (!function_exists('ulink_input_int')) {
    function ulink_input_int(array $data, string $key, ?int $default = null): ?int
    {
        if (!array_key_exists($key, $data) || $data[$key] === null || $data[$key] === '') {
            return $default;
        }
        if (is_array($data[$key])) {
            return $default;
        }
        if (!is_numeric($data[$key])) {
            return $default;
        }
        return (int) $data[$key];
    }
}

if (!function_exists('ulink_input_bool')) {
    function ulink_input_bool(array $data, string $key, bool $default = false): bool
    {
        if (!array_key_exists($key, $data) || $data[$key] === null) {
            return $default;
        }
        $value = $data[$key];
        if (is_bool($value)) {
            return $value;
        }
        if (is_array($value)) {
            return $default;
        }
        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], false);
    }
}

if (!function_exists('ulink_query')) {
    /**
     * Read a value from the query string, falling back to the JSON body.
     *
     * @return array<string, mixed>
     */
    function ulink_query(): array
    {
        $data = ulink_input();
        return array_merge($data, $_GET);
    }
}

if (!function_exists('ulink_query_str')) {
    function ulink_query_str(string $key, string $default = ''): string
    {
        return ulink_input_str(ulink_query(), $key, $default);
    }
}

if (!function_exists('ulink_query_int')) {
    function ulink_query_int(string $key, ?int $default = null): ?int
    {
        return ulink_input_int(ulink_query(), $key, $default);
    }
}

/* -------------------------------------------------------------------------
 | Validation & sanitising
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_plain_text')) {
    /**
     * Normalise free text for storage.
     *
     * Content is stored as plain text with all markup removed. The frontend
     * renders posts and comments through innerHTML, so storing markup would be
     * a stored-XSS hole; the previous code called htmlspecialchars() which
     * left literal `&amp;` sequences in the database and double-escaped on
     * every read/write cycle.
     */
    function ulink_plain_text(?string $value, int $maxLength = 0): string
    {
        if ($value === null) {
            return '';
        }

        // Strip tags, then decode entities so `&amp;lt;b&amp;gt;` cannot be
        // re-introduced as markup on a later read.
        $text = strip_tags($value);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = strip_tags($text);

        // Drop control characters except newlines and tabs.
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? $text;

        // Normalise line endings and collapse runs of blank lines.
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        $text = preg_replace("/\n{3,}/", "\n\n", $text) ?? $text;

        // Reject invalid UTF-8 outright rather than storing mojibake.
        if (!mb_check_encoding($text, 'UTF-8')) {
            $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');
        }

        $text = trim($text);

        if ($maxLength > 0 && mb_strlen($text, 'UTF-8') > $maxLength) {
            $text = mb_substr($text, 0, $maxLength, 'UTF-8');
        }

        return $text;
    }
}

if (!function_exists('ulink_escape')) {
    /** Escape a value for safe interpolation into HTML. */
    function ulink_escape(?string $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}

if (!function_exists('ulink_is_email')) {
    function ulink_is_email(string $email): bool
    {
        return $email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
}

if (!function_exists('ulink_password_problem')) {
    /**
     * Validate a password, returning an error message or null when acceptable.
     */
    function ulink_password_problem(string $password): ?string
    {
        if ($password === '') {
            return 'Password is required.';
        }

        $length = strlen($password);
        if ($length < ULINK_MIN_PASSWORD_LENGTH) {
            return 'Password must be at least ' . ULINK_MIN_PASSWORD_LENGTH . ' characters.';
        }
        if ($length > ULINK_MAX_PASSWORD_LENGTH) {
            return 'Password must be at most ' . ULINK_MAX_PASSWORD_LENGTH . ' characters.';
        }
        if (preg_match('/^\s+$/', $password)) {
            return 'Password cannot be only whitespace.';
        }
        if (trim($password) !== $password) {
            return 'Password cannot start or end with a space.';
        }

        return null;
    }
}

if (!function_exists('ulink_pagination')) {
    /**
     * Clamp a requested page size and compute the offset.
     *
     * @return array{limit: int, offset: int}
     */
    function ulink_pagination(?int $limit = null, ?int $offset = null, ?int $max = null): array
    {
        $max = $max ?? ULINK_PAGE_MAX;
        $limit = $limit ?? ULINK_PAGE_DEFAULT;
        $limit = max(1, min($limit, $max));
        $offset = max(0, $offset ?? 0);

        return ['limit' => $limit, 'offset' => $offset];
    }
}

/* -------------------------------------------------------------------------
 | Request metadata
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_client_ip')) {
    function ulink_client_ip(): string
    {
        if (ULINK_TRUST_PROXY && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $parts = explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR']);
            $ip = trim($parts[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }

        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : 'unknown';
    }
}

if (!function_exists('ulink_user_agent')) {
    function ulink_user_agent(): string
    {
        $agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        return ulink_plain_text(substr($agent, 0, 255));
    }
}

/* -------------------------------------------------------------------------
 | Authentication
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_current_user_id')) {
    /** Authenticated user id from the session, or null. */
    function ulink_current_user_id(): ?int
    {
        ulink_start_session();

        $id = $_SESSION['user_id'] ?? null;
        if ($id === null || !is_numeric($id)) {
            return null;
        }

        $id = (int) $id;
        return $id > 0 ? $id : null;
    }
}

if (!function_exists('ulink_current_user')) {
    /**
     * Load the authenticated user row, or null.
     *
     * @return array<string, mixed>|null
     */
    function ulink_current_user(bool $fresh = false): ?array
    {
        static $cache = null;
        static $cachedId = null;

        $userId = ulink_current_user_id();
        if ($userId === null) {
            $cache = null;
            $cachedId = null;
            return null;
        }

        if (!$fresh && $cache !== null && $cachedId === $userId) {
            return $cache;
        }

        try {
            $user = Database::fetchOne(
                // The optional About columns are included so callers that diff
                // an incoming value against the stored one (users/update.php)
                // can see what is actually there. Leaving them out made every
                // field look empty, so an empty incoming value always matched
                // and a field could be set but never cleared.
                'SELECT id, student_id, full_name, email, profile_pic, cover_pic, department,
                        batch, bio, headline, location, website, interests, role, created_at
                   FROM users
                  WHERE id = :id
                  LIMIT 1',
                ['id' => $userId]
            );
        } catch (Throwable $e) {
            ulink_log_error('ulink_current_user failed: ' . $e->getMessage(), $e);
            return null;
        }

        if ($user === null) {
            // The account was deleted while the session was still alive.
            ulink_destroy_session();
            return null;
        }

        $cache = $user;
        $cachedId = $userId;

        return $user;
    }
}

if (!function_exists('ulink_require_auth')) {
    /**
     * Require a valid session, returning the user row.
     *
     * The user id always comes from the session. Endpoints that previously
     * accepted a `userId` field in the request body let any caller write data
     * as any other account.
     *
     * @return array<string, mixed>
     */
    function ulink_require_auth(): array
    {
        $user = ulink_current_user();

        if ($user === null) {
            ulink_fail('Unauthorized. Please sign in again.', 401);
        }

        return $user;
    }
}

if (!function_exists('ulink_is_admin')) {
    function ulink_is_admin(?array $user = null): bool
    {
        $user = $user ?? ulink_current_user();
        return $user !== null && ($user['role'] ?? '') === 'admin';
    }
}

if (!function_exists('ulink_start_session_for_user')) {
    /**
     * Bind a freshly authenticated user to the session, rotating the session
     * id first to prevent session fixation.
     */
    function ulink_start_session_for_user(int $userId, string $email): void
    {
        ulink_start_session();
        session_regenerate_id(true);

        $_SESSION['user_id'] = $userId;
        $_SESSION['email'] = $email;
        $_SESSION['created_at'] = time();
        $_SESSION['last_seen'] = time();
    }
}

if (!function_exists('ulink_destroy_session')) {
    /** Clear the PHP session and expire the session cookie. */
    function ulink_destroy_session(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return;
        }

        $_SESSION = [];

        if (ini_get('session.use_cookies') && !headers_sent()) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires'  => time() - 42000,
                'path'     => $params['path'],
                'domain'   => $params['domain'],
                'secure'   => $params['secure'],
                'httponly' => $params['httponly'],
                'samesite' => $params['samesite'] ?? ULINK_SESSION_SAMESITE,
            ]);
        }

        session_destroy();
    }
}

if (!function_exists('ulink_touch_session')) {
    /** Refresh the stored activity timestamp for the current session. */
    function ulink_touch_session(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return;
        }
        $_SESSION['last_seen'] = time();
    }
}

if (!function_exists('ulink_record_session')) {
    /**
     * Mirror the active session into the user_sessions table so the account
     * can list and revoke devices. The schema declared the table but nothing
     * ever wrote to it.
     */
    function ulink_record_session(int $userId): void
    {
        $token = session_id();
        if (!is_string($token) || $token === '') {
            return;
        }

        try {
            Database::run(
                'INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
                      VALUES (:user_id, :token, :ip, :agent, :expires)
                 ON DUPLICATE KEY UPDATE ip_address = VALUES(ip_address),
                                         user_agent  = VALUES(user_agent),
                                         last_activity = CURRENT_TIMESTAMP,
                                         expires_at   = VALUES(expires_at)',
                [
                    'user_id' => $userId,
                    'token'   => $token,
                    'ip'      => ulink_client_ip(),
                    'agent'   => ulink_user_agent(),
                    'expires' => gmdate('Y-m-d H:i:s', time() + ULINK_SESSION_LIFETIME),
                ]
            );
        } catch (Throwable $e) {
            // Telemetry must never break the request.
            ulink_log_error('ulink_record_session failed: ' . $e->getMessage(), $e);
        }
    }
}

if (!function_exists('ulink_forget_session_record')) {
    function ulink_forget_session_record(): void
    {
        $token = session_id();
        if (!is_string($token) || $token === '' || !Database::tableExists('user_sessions')) {
            return;
        }

        try {
            Database::run('DELETE FROM user_sessions WHERE session_token = :t', ['t' => $token]);
        } catch (Throwable $e) {
            ulink_log_error('ulink_forget_session_record failed: ' . $e->getMessage(), $e);
        }
    }
}

/* -------------------------------------------------------------------------
 | Activity logging
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_log_activity')) {
    /**
     * Record a user action.
     *
     * Always attributed to the session user. Unknown activity types are
     * dropped rather than stored, and failures are swallowed so telemetry can
     * never break a user-facing request.
     *
     * @param array<string, mixed>|string|null $details
     */
    function ulink_log_activity(string $type, $details = null, ?int $userId = null): void
    {
        $type = trim($type);
        if ($type === '') {
            return;
        }

        $userId = $userId ?? ulink_current_user_id();
        if ($userId === null) {
            return;
        }

        if (!in_array($type, ULINK_ACTIVITY_TYPES, true)) {
            ulink_log_error('Rejected unknown activity type: ' . $type);
            return;
        }

        if (!Database::tableExists('user_activities')) {
            return;
        }

        if (is_string($details)) {
            $decoded = json_decode($details, true);
            $details = is_array($decoded) ? $decoded : ['value' => ulink_plain_text($details, 500)];
        }

        // Cap the payload so a huge post body cannot bloat the log table.
        $encoded = json_encode(
            is_array($details) ? $details : ['value' => (string) $details],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        );
        if ($encoded === false) {
            $encoded = '{}';
        }
        if (strlen($encoded) > 2000) {
            $encoded = json_encode(['truncated' => true]);
        }

        try {
            Database::run(
                'INSERT INTO user_activities (user_id, activity_type, details, ip_address, user_agent)
                      VALUES (:user_id, :type, :details, :ip, :agent)',
                [
                    'user_id' => $userId,
                    'type'    => $type,
                    'details' => $encoded,
                    'ip'      => ulink_client_ip(),
                    'agent'   => ulink_user_agent(),
                ]
            );
        } catch (Throwable $e) {
            ulink_log_error('ulink_log_activity failed: ' . $e->getMessage(), $e);
        }
    }
}

/* -------------------------------------------------------------------------
 | Notifications
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_notify')) {
    /**
     * Create a notification for a user, skipping self-notifications.
     *
     * The docblock here used to also claim that duplicates of the same
     * (type, actor, target) triple were skipped. Nothing deduplicated: every
     * call inserted. That was invisible while the only caller was the friend
     * request path, which reaches this at most once per request, and became a
     * real problem when a blocked user could still push notifications - a
     * blocked requester filled the blocker's inbox with rows that accept,
     * reject and cancel all refuse. That path is now a 403 before it gets here.
     *
     * Idempotency stays with the caller, which is the only layer that knows
     * whether two events are the same event.
     */
    function ulink_notify(
        int $userId,
        string $type,
        string $content,
        ?int $fromUserId = null,
        ?int $referenceId = null
    ): ?int {
        if ($userId <= 0 || $userId === $fromUserId) {
            return null;
        }

        // Respect the recipient's notification preferences. Muted types create
        // no row at all, so the bell badge and the list stay consistent.
        if (!ulink_notification_allowed($userId, $type)) {
            return null;
        }

        if (!Database::tableExists('notifications')) {
            return null;
        }

        try {
            return Database::insert('notifications', [
                'user_id'         => $userId,
                'type'            => $type,
                'content'         => ulink_plain_text($content, 500),
                'from_user_id'    => $fromUserId,
                'reference_id'    => $referenceId,
                'is_read'         => 0,
            ]);
        } catch (Throwable $e) {
            ulink_log_error('ulink_notify failed: ' . $e->getMessage(), $e);
            return null;
        }
    }
}

if (!function_exists('ulink_unread_notification_count')) {
    function ulink_unread_notification_count(int $userId): int
    {
        try {
            if (!Database::tableExists('notifications')) {
                return 0;
            }
            return (int) Database::fetchValue(
                'SELECT COUNT(*) FROM notifications WHERE user_id = :id AND is_read = 0',
                ['id' => $userId]
            );
        } catch (Throwable $e) {
            return 0;
        }
    }
}

/* -------------------------------------------------------------------------
 | Uploads
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_image_type_from_binary')) {
    /**
     * Detect the real image type from the decoded bytes.
     *
     * The previous code trusted the MIME type declared inside the data URI,
     * so a payload could claim `data:image/png;base64,` while actually being
     * arbitrary content, and the file was stored with that extension.
     *
     * @return array{ext: string, mime: string}|null
     */
    function ulink_image_type_from_binary(string $binary): ?array
    {
        if ($binary === '') {
            return null;
        }

        $info = @getimagesizefromstring($binary);
        if ($info !== false && !empty($info['mime'])) {
            $allowed = [
                IMAGETYPE_JPEG => ['jpg', 'image/jpeg'],
                IMAGETYPE_PNG  => ['png', 'image/png'],
                IMAGETYPE_GIF  => ['gif', 'image/gif'],
                IMAGETYPE_WEBP => ['webp', 'image/webp'],
            ];
            if (isset($allowed[$info[2]])) {
                return ['ext' => $allowed[$info[2]][0], 'mime' => $allowed[$info[2]][1]];
            }
            return null;
        }

        // Fall back to a magic-byte check for WEBP, which some builds of
        // getimagesizefromstring do not recognise.
        if (strncmp($binary, 'RIFF', 4) === 0 && strncmp(substr($binary, 8, 4), 'WEBP', 4) === 0) {
            return ['ext' => 'webp', 'mime' => 'image/webp'];
        }

        return null;
    }
}

if (!function_exists('ulink_split_data_uri')) {
    /**
     * Split a `data:<mime>;base64,<payload>` string.
     *
     * @return array{0: string, 1: string}|null [mime, rawBase64]
     */
    function ulink_split_data_uri(string $value): ?array
    {
        if (!preg_match('#^data:([a-z0-9.+-]+/[a-z0-9.+-]+)?;base64,(.*)$#is', $value, $m)) {
            return null;
        }

        return [strtolower($m[1] ?? ''), preg_replace('/\s+/', '', $m[2]) ?? ''];
    }
}

if (!function_exists('ulink_is_remote_url')) {
    /** True for an http(s) URL that may be stored as-is. */
    function ulink_is_remote_url(?string $value): bool
    {
        if (!is_string($value) || $value === '') {
            return false;
        }
        if (strlen($value) > 1000) {
            return false;
        }
        $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));
        if ($scheme !== 'http' && $scheme !== 'https') {
            return false;
        }
        return filter_var($value, FILTER_VALIDATE_URL) !== false;
    }
}

if (!function_exists('ulink_save_upload')) {
    /**
     * Persist a data-URI image and return its public relative path.
     *
     * Writes are confined to the uploads directory and the final name is
     * generated server side, so a client cannot choose the path.
     *
     * @return string|null Public path such as "uploads/profiles/x.jpg", or null.
     */
    function ulink_save_upload(string $dataUri, string $subdir = '', int $maxBytes = 0): ?string
    {
        $maxBytes = $maxBytes > 0 ? $maxBytes : ULINK_UPLOAD_MAX_BYTES;

        $parts = ulink_split_data_uri($dataUri);
        if ($parts === null) {
            return null;
        }

        [$declaredMime, $base64] = $parts;
        if ($base64 === '') {
            return null;
        }

        // Guard against a decompression bomb before decoding.
        $approxBytes = (int) (strlen($base64) * 3 / 4);
        if ($approxBytes > $maxBytes) {
            ulink_log_error('Rejected oversized upload (' . $approxBytes . ' bytes)');
            return null;
        }

        $binary = base64_decode($base64, true);
        if ($binary === false || $binary === '') {
            return null;
        }

        if (strlen($binary) > $maxBytes) {
            ulink_log_error('Rejected oversized upload (' . strlen($binary) . ' bytes)');
            return null;
        }

        $type = ulink_image_type_from_binary($binary);
        if ($type === null) {
            // Not a recognised raster image. Reject rather than storing.
            ulink_log_error('Rejected upload with unrecognised image data (declared ' . $declaredMime . ')');
            return null;
        }

        $subdir = trim($subdir, '/');
        $dir = ULINK_UPLOAD_PATH . ($subdir !== '' ? '/' . $subdir : '');

        if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
            ulink_log_error('Cannot create upload directory: ' . $dir);
            return null;
        }

        if (!is_writable($dir)) {
            ulink_log_error('Upload directory is not writable: ' . $dir);
            return null;
        }

        // Random name: uniqid() is time based and guessable.
        $filename = bin2hex(random_bytes(16)) . '.' . $type['ext'];
        $target = $dir . '/' . $filename;

        if (file_put_contents($target, $binary, LOCK_EX) === false) {
            ulink_log_error('Failed to write upload: ' . $target);
            return null;
        }

        @chmod($target, 0644);

        // Block script execution just in case .htaccess is unavailable.
        @file_put_contents($target . '.htaccess', "php_flag engine off\nOptions -ExecCGI\nRemoveHandler .php .phtml .php3 .php4 .php5 .php7 .php8\n");

        return 'uploads/' . ($subdir !== '' ? $subdir . '/' : '') . $filename;
    }
}

if (!function_exists('ulink_delete_upload')) {
    /** Best-effort removal of a previously stored upload. */
    function ulink_delete_upload(?string $relativePath): void
    {
        if (!is_string($relativePath) || $relativePath === '') {
            return;
        }

        // Only ever touch paths inside the uploads directory.
        if (strpos($relativePath, 'uploads/') !== 0 || strpos($relativePath, '..') !== false) {
            return;
        }

        $absolute = ULINK_BASE_PATH . '/' . ltrim($relativePath, '/');
        $realBase = realpath(ULINK_UPLOAD_PATH);
        $realFile = realpath($absolute);

        if ($realBase === false || $realFile === false) {
            return;
        }
        if (strpos($realFile, $realBase . DIRECTORY_SEPARATOR) !== 0) {
            return;
        }

        // The stored file and the guard ulink_save_upload() wrote beside it are
        // removed as a pair.
        //
        // Leaving the guard behind is not a harmless leftover: it is a real file
        // named `<32 hex chars>.png.htaccess`, so replacing an avatar once per
        // session adds one of them forever. uploads/profiles/ had accumulated
        // 186 of them for a directory whose actual images numbered one.
        @unlink($realFile);
        @unlink($realFile . '.htaccess');
    }
}

if (!function_exists('ulink_document_type_from_binary')) {
    /**
     * Identify an allowed document by sniffing its bytes.
     *
     * The client-supplied name and MIME type are advisory only - both are
     * attacker controlled - so the stored extension comes from this lookup. An
     * allowlist rather than a blocklist: anything not recognised is rejected,
     * so a new executable or markup format cannot slip through by default.
     *
     * Anything the browser could render as markup is deliberately absent. SVG
     * and HTML are excluded on purpose, because a document served from the site
     * origin with an attacker-controlled body is a stored-XSS vector.
     *
     * @return array{ext: string, mime: string}|null
     */
    function ulink_document_type_from_binary(string $binary): ?array
    {
        if ($binary === '') {
            return null;
        }

        static $allowed = [
            'application/pdf' => 'pdf',
            'application/msword' => 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
            'application/vnd.ms-excel' => 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
            'application/vnd.ms-powerpoint' => 'ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'pptx',
            'application/rtf' => 'rtf',
            'application/zip' => 'zip',
            'text/plain' => 'txt',
            'text/csv' => 'csv',
            'application/json' => 'json',
        ];

        // A few of these share magic bytes (OOXML and ODF are both ZIP
        // containers), so the container is inspected one level down to tell the
        // three OOXML types apart. Anything ambiguous stays rejected.
        $mime = '';
        if (function_exists('finfo_open')) {
            $finfo = @finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo !== false) {
                $detected = @finfo_buffer($finfo, $binary);
                if (is_string($detected) && $detected !== '') {
                    $mime = strtolower(trim(explode(';', $detected)[0]));
                }
                @finfo_close($finfo);
            }
        }

        // finfo reports bare application/zip for every OOXML file, and some
        // builds report application/octet-stream for plain text. Fall back to
        // content markers before giving up.
        if ($mime === '' || $mime === 'application/zip' || $mime === 'application/x-zip-compressed'
            || $mime === 'application/octet-stream') {
            $refined = ulink_zip_document_type($binary);
            if ($refined !== null) {
                return $refined;
            }
            if ($mime === 'application/zip' || $mime === 'application/x-zip-compressed') {
                return null;   // a zip we could not identify
            }
        }

        if ($mime === 'application/octet-stream') {
            $mime = ulink_text_document_mime($binary);
            if ($mime === null) {
                return null;
            }
        }

        if (!isset($allowed[$mime])) {
            return null;
        }

        return ['ext' => $allowed[$mime], 'mime' => $mime];
    }
}

if (!function_exists('ulink_zip_document_type')) {
    /**
     * Tell the OOXML types apart by the part names inside the ZIP container.
     *
     * xlsx/pptx/docx are all application/zip as far as sniffing is concerned.
     * The distinguishing marker is a required entry in [Content_Types].xml,
     * which is stored uncompressed, so the substring is findable in the raw
     * bytes without a full archive parse.
     *
     * @return array{ext: string, mime: string}|null
     */
    function ulink_zip_document_type(string $binary): ?array
    {
        if (strncmp($binary, "PK\x03\x04", 4) !== 0 && strncmp($binary, "PK\x05\x06", 4) !== 0) {
            return null;
        }

        // Cheap marker scan. The full [Content_Types].xml path appears within
        // the first few KB of every Office file, so there is no need to walk
        // the whole archive.
        $head = substr($binary, 0, 8192);

        $markers = [
            'word/document.xml' => [
                'ext' => 'docx',
                'mime' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
            'xl/workbook.xml' => [
                'ext' => 'xlsx',
                'mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ],
            'ppt/presentation.xml' => [
                'ext' => 'pptx',
                'mime' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            ],
        ];

        foreach ($markers as $needle => $type) {
            if (strpos($head, $needle) !== false) {
                return $type;
            }
        }

        // A plain zip archive is allowed as an attachment.
        return ['ext' => 'zip', 'mime' => 'application/zip'];
    }
}

if (!function_exists('ulink_text_document_mime')) {
    /**
     * Decide whether the bytes are plain text, and as which subtype.
     *
     * Guards against a binary blob being stored as .txt and then handed to the
     * browser as text/plain.
     *
     * @return string|null 'text/plain' | 'text/csv' | 'application/json' | null
     */
    function ulink_text_document_mime(string $binary): ?string
    {
        if ($binary === '') {
            return null;
        }

        // A NUL byte, or a high proportion of non-printable bytes, means this
        // is not text.
        if (strpos($binary, "\0") !== false) {
            return null;
        }

        $sample = substr($binary, 0, 4096);
        $printable = preg_match_all('/[\x09\x0A\x0D\x20-\x7E]/', $sample);
        if (!is_int($printable) || $printable === 0) {
            return null;
        }

        $ratio = $printable / max(1, strlen($sample));
        if ($ratio < 0.95) {
            return null;
        }

        $trimmed = ltrim($sample);
        if ($trimmed !== '' && ($trimmed[0] === '{' || $trimmed[0] === '[')) {
            // Only claim JSON when it actually decodes, otherwise a CSV that
            // happens to start with a bracket would be mislabelled.
            $decoded = json_decode($sample, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return 'application/json';
            }
        }

        // RFC 4180: consistent commas with no NULs and all-printable content.
        if (substr_count($sample, ',') >= 1) {
            return 'text/csv';
        }

        return 'text/plain';
    }
}

if (!function_exists('ulink_save_attachment')) {
    /**
     * Store one uploaded file and describe it for the messages table.
     *
     * Accepts either a picture or a document. The extension is chosen from the
     * sniffed bytes rather than the uploaded name, so a .php renamed to .pdf is
     * rejected on content and a .pdf is stored under a server-generated .pdf.
     *
     * The original name is kept purely as a display label and is sanitised to
     * its basename, stripped of control characters and truncated, since it is
     * echoed back to every participant.
     *
     * @param  array<string, mixed> $file One entry from $_FILES.
     * @return array{type: string, name: string, path: string, mime: string, size: int}|null
     *         Null on any rejection; the reason is logged.
     */
    function ulink_save_attachment(array $file, string $subdir = 'messages'): ?array
    {
        $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);

        if ($error === UPLOAD_ERR_NO_FILE) {
            return null;
        }

        // UPLOAD_ERR_INI_SIZE / FORM_SIZE mean the request as a whole was too
        // big for PHP to buffer, so there is nothing to sniff.
        if ($error !== UPLOAD_ERR_OK) {
            $labels = [
                UPLOAD_ERR_INI_SIZE   => 'larger than the server upload limit',
                UPLOAD_ERR_FORM_SIZE  => 'larger than the form allows',
                UPLOAD_ERR_PARTIAL    => 'only partially uploaded',
                UPLOAD_ERR_NO_TMP_DIR => 'no temporary directory',
                UPLOAD_ERR_CANT_WRITE => 'could not be written to disk',
                UPLOAD_ERR_EXTENSION  => 'blocked by a PHP extension',
            ];
            ulink_log_error('Attachment rejected: ' . ($labels[$error] ?? ('upload error ' . $error)));
            return null;
        }

        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            ulink_log_error('Attachment rejected: not a recognised PHP upload');
            return null;
        }

        // is_uploaded_file() passed, so this is a genuine upload; still refuse
        // anything that is not a regular file (a symlink or a fifo would hang).
        $size = @filesize($tmp);
        if ($size === false || $size <= 0) {
            ulink_log_error('Attachment rejected: unreadable or empty');
            return null;
        }

        if ($size > ULINK_ATTACHMENT_MAX_BYTES) {
            ulink_log_error('Attachment rejected: ' . $size . ' bytes exceeds ' . ULINK_ATTACHMENT_MAX_BYTES);
            return null;
        }

        // Sniffing needs the bytes in memory, and the cap above bounds this.
        $binary = @file_get_contents($tmp);
        if ($binary === false || $binary === '') {
            ulink_log_error('Attachment rejected: could not read the uploaded file');
            return null;
        }

        $image = ulink_image_type_from_binary($binary);
        if ($image !== null) {
            $kind = 'image';
            $ext = $image['ext'];
            $mime = $image['mime'];

            if ($size > ULINK_UPLOAD_MAX_BYTES) {
                ulink_log_error('Attachment rejected: image of ' . $size . ' bytes exceeds ' . ULINK_UPLOAD_MAX_BYTES);
                return null;
            }
        } else {
            $document = ulink_document_type_from_binary($binary);
            if ($document === null) {
                ulink_log_error('Attachment rejected: content is neither an allowed image nor an allowed document');
                return null;
            }

            $kind = 'file';
            $ext = $document['ext'];
            $mime = $document['mime'];
        }

        $subdir = trim($subdir, '/');
        if ($subdir !== '' && !preg_match('#^[a-z0-9/_-]+$#i', $subdir)) {
            ulink_log_error('Attachment rejected: invalid destination directory');
            return null;
        }

        $dir = ULINK_UPLOAD_PATH . ($subdir !== '' ? '/' . $subdir : '');
        if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
            ulink_log_error('Attachment rejected: cannot create ' . $dir);
            return null;
        }
        if (!is_writable($dir)) {
            ulink_log_error('Attachment rejected: ' . $dir . ' is not writable');
            return null;
        }

        // Server-generated name. uniqid() is time based and guessable, and the
        // extension comes from the sniff above, never from the client.
        $filename = bin2hex(random_bytes(16)) . '.' . $ext;
        $target = $dir . '/' . $filename;

        // Move rather than copy: move_uploaded_file also enforces that the
        // source really was an HTTP upload.
        if (!@move_uploaded_file($tmp, $target)) {
            ulink_log_error('Attachment rejected: could not store the upload');
            return null;
        }

        @chmod($target, 0644);

        // No per-file .htaccess guard here, unlike ulink_save_upload(): this
        // directory denies every request outright (uploads/messages/.htaccess,
        // and router.php for the built-in server), so a file-level guard would
        // only add a second hidden file next to every attachment.

        return [
            'type' => $kind,
            'name' => ulink_attachment_label((string) ($file['name'] ?? ''), $filename),
            'path' => 'uploads/' . ($subdir !== '' ? $subdir . '/' : '') . $filename,
            'mime' => $mime,
            'size' => $size,
        ];
    }
}

if (!function_exists('ulink_save_profile_image')) {
    /**
     * Store an avatar or cover image sent as multipart/form-data.
     *
     * api/users/update.php also accepts a base64 data URI in JSON, which is how
     * the current frontend sends it. But $input['profile_pic'] on a multipart
     * request is the $_FILES *array*, and update.php tested it with is_string(),
     * so the field was skipped, nothing was written, and the endpoint answered
     * 200 "Nothing to update." - a silent no-op for any client that used the
     * obvious multipart form, which is also how messages/send.php takes files.
     *
     * Delegates to the same byte sniffing as a message attachment and returns
     * the stored path, so a renamed .php is rejected on content rather than on
     * its name.
     *
     * @param  array<string, mixed> $file One entry from $_FILES.
     * @return string|null              Relative path, or null when rejected.
     */
    function ulink_save_profile_image(array $file, string $subdir): ?string
    {
        // The attachment path accepts documents too; an avatar may not.
        $stored = ulink_save_attachment($file, $subdir);
        if ($stored === null) {
            return null;
        }

        if ($stored['type'] !== 'image') {
            ulink_log_error('Rejected ' . $subdir . ' upload: not a raster image');
            ulink_delete_upload($stored['path']);
            return null;
        }

        return (string) $stored['path'];
    }
}

if (!function_exists('ulink_attachment_label')) {
    /**
     * Turn an uploaded filename into something safe to render.
     *
     * The label is shown to both participants in the thread and in the
     * conversation list, so it is reduced to a basename, stripped of control
     * characters and bidi overrides, and truncated. The extension is dropped
     * when it only restates the stored type.
     */
    function ulink_attachment_label(string $uploadedName, string $storedName): string
    {
        $name = str_replace(["\\", '/'], '', $uploadedName);
        $name = preg_replace('/[\x00-\x1F\x7F]/u', '', $name) ?? '';
        // Bidi overrides can disguise an extension; drop them outright.
        $name = preg_replace('/[\x{202A}-\x{202E}\x{2066}-\x{2069}]/u', '', $name) ?? '';
        $name = trim($name);

        if ($name === '' || $name === '.' || $name === '..') {
            $name = $storedName;
        }

        if (mb_strlen($name) <= ULINK_ATTACHMENT_MAX_CHARS) {
            return $name;
        }

        // Keep the extension: "report-fina…" is not a useful label on its own.
        $ext = pathinfo($name, PATHINFO_EXTENSION);
        $stem = pathinfo($name, PATHINFO_FILENAME);
        $keep = ULINK_ATTACHMENT_MAX_CHARS - (mb_strlen($ext) + 2);
        if ($keep < 4) {
            return mb_substr($name, 0, ULINK_ATTACHMENT_MAX_CHARS);
        }

        return mb_substr($stem, 0, $keep) . '.' . $ext;
    }
}

if (!function_exists('ulink_upload_subdirs')) {
    /**
     * Subdirectories under uploads/ that the app writes into.
     *
     * Declared once so the installer, the health check and the upload guard all
     * agree, and so adding an endpoint that stores files cannot silently skip
     * the directory-preparation step.
     *
     * @return array<int, string>
     */
    function ulink_upload_subdirs(): array
    {
        return ['profiles', 'covers', 'posts', 'messages', 'communities', 'events'];
    }
}

if (!function_exists('ulink_ensure_upload_dirs')) {
    function ulink_ensure_upload_dirs(): array
    {
        $failed = [];

        // One entry per subdirectory any endpoint writes into, so the health
        // check and the installer agree with what the code actually uses.
        $dirs = array_merge(
            [ULINK_UPLOAD_PATH],
            array_map(static fn(string $sub): string => ULINK_UPLOAD_PATH . '/' . $sub, ulink_upload_subdirs())
        );

        foreach ($dirs as $dir) {
            if (is_dir($dir)) {
                if (!is_writable($dir)) {
                    $failed[] = $dir . ' (not writable)';
                }
                continue;
            }
            if (!@mkdir($dir, 0775, true) && !is_dir($dir)) {
                $failed[] = $dir . ' (could not create)';
            }
        }

        return $failed;
    }
}

if (!function_exists('ulink_prune_orphan_upload_guards')) {
    /**
     * Delete the per-file .htaccess guards whose image no longer exists.
     *
     * ulink_save_upload() writes `<image>.htaccess` beside each stored upload and
     * ulink_delete_upload() now removes the pair together, so nothing new leaks.
     * Anything still lying around was orphaned by an earlier version, and they
     * are pure garbage: a guard for a file that is not there protects nothing.
     *
     * Deliberately narrow. It only considers a name ending in `.htaccess` whose
     * sibling with that suffix stripped does not exist, so it can never remove a
     * directory-level guard, a real upload, or anything outside uploads/.
     *
     * @return int the number of files removed
     */
    function ulink_prune_orphan_upload_guards(): int
    {
        $removed = 0;
        $dirs = array_merge(
            [ULINK_UPLOAD_PATH],
            array_map(static fn(string $sub): string => ULINK_UPLOAD_PATH . '/' . $sub, ulink_upload_subdirs())
        );

        foreach ($dirs as $dir) {
            // scandir() skips the entries it cannot read instead of warning, and
            // an unreadable directory is not this function's problem to solve.
            $entries = @scandir($dir);
            if ($entries === false) {
                continue;
            }

            foreach ($entries as $entry) {
                if (!str_ends_with($entry, '.htaccess') || strlen($entry) <= strlen('.htaccess')) {
                    continue;
                }

                $image = substr($entry, 0, -strlen('.htaccess'));
                if (is_file($dir . '/' . $image)) {
                    continue;
                }

                if (@unlink($dir . '/' . $entry)) {
                    $removed++;
                }
            }
        }

        return $removed;
    }
}

/* -------------------------------------------------------------------------
 | Presentation helpers
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_avatar_url')) {
    /**
     * Normalise a stored avatar into something usable in an <img src>.
     * Falls back to a deterministic generated-avatar URL.
     */
    function ulink_avatar_url(?string $path, ?string $seed = null): string
    {
        $path = is_string($path) ? trim($path) : '';

        if ($path !== '') {
            if (str_starts_with($path, 'data:')) {
                return $path;
            }
            if (ulink_is_remote_url($path)) {
                return $path;
            }
            if (str_starts_with($path, 'uploads/')) {
                return $path;
            }
            // Legacy absolute filesystem paths stored by older versions.
            if (str_starts_with($path, '/')) {
                $candidate = ULINK_BASE_PATH . $path;
                if (is_file($candidate)) {
                    return ltrim($path, '/');
                }
            }
        }

        $seed = $seed !== null && $seed !== '' ? $seed : 'ulink';
        return 'https://ui-avatars.com/api/?name=' . rawurlencode($seed) . '&background=random';
    }
}

if (!function_exists('ulink_user_is_online')) {
    /**
     * Presence, derived from last_seen_at.
     *
     * @param array<string, mixed> $user Row that may carry `last_seen_at`.
     */
    function ulink_user_is_online(array $user): bool
    {
        if (!empty($user['is_online'])) {
            return true;
        }

        $seen = $user['last_seen_at'] ?? ($user['online'] ?? null);
        if (!is_string($seen) || trim($seen) === '') {
            return false;
        }

        $timestamp = strtotime($seen);
        if ($timestamp === false) {
            return false;
        }

        // 5 minutes, matching the convention messages/conversations.php uses.
        return (time() - $timestamp) < 300;
    }
}

if (!function_exists('ulink_user_public')) {
    /**
     * Shape a user row for the API.
     *
     * $includePrivate gates email + student id, and it is a disclosure control,
     * not a formatting flag. Pass true only for:
     *
     *   * the caller's own account (auth + bootstrap), and
     *   * someone the caller already has an established relationship with - an
     *     accepted friend, or a live chat partner.
     *
     * Everyone else gets the public shape. In particular friend *suggestions*
     * and *outgoing* requests are strangers, and handing them the full row turns
     * both endpoints into a lookup table for any user id in the database.
     * api/users/profile.php and api/users/search.php apply the same rule.
     *
     * @param  array<string, mixed> $user
     * @param  bool $includePrivate Include email and student id.
     * @return array<string, mixed>
     */
    function ulink_user_public(array $user, bool $includePrivate = false): array
    {
        $name = (string) ($user['full_name'] ?? 'Unknown User');

        $out = [
            'id'         => (int) ($user['id'] ?? 0),
            'name'       => $name,
            'full_name'  => $name,
            'pic'        => ulink_avatar_url($user['profile_pic'] ?? null, $name),
            'profile_pic'=> ulink_avatar_url($user['profile_pic'] ?? null, $name),
            'cover_pic'  => $user['cover_pic'] ?? null,
            'dept'       => $user['department'] ?? null,
            'department' => $user['department'] ?? null,
            'batch'      => $user['batch'] ?? null,
            'role'       => ucfirst((string) ($user['role'] ?? 'student')),
            // There is no `is_online` column and no caller passes `online`, so
            // this used to be permanently false and every friend row rendered
            // "Offline". Presence is derived from last_seen_at, the same way
            // messages/conversations.php already derived it.
            //
            // `show_online_status` is a real preference: when the user turned
            // presence off, everyone else sees them as offline. A caller that
            // already selected the column passes it in; otherwise the lookup is
            // served from the per-request cache (list renders call
            // ulink_preload_user_settings() first, so this is not an N+1).
            'online'     => ulink_user_is_online($user)
                && !((int) (array_key_exists('show_online_status', $user)
                        ? $user['show_online_status']
                        : ulink_user_setting((int) ($user['id'] ?? 0), 'show_online_status', 1)) === 0),
        ];

        $out['bio'] = (string) ($user['bio'] ?? '');

        // Optional About fields. Always present (as ''), so the renderer can
        // assign them without a guard and a cleared field actually clears.
        foreach (['headline', 'location', 'website', 'interests'] as $aboutField) {
            $out[$aboutField] = (string) ($user[$aboutField] ?? '');
        }

        if ($includePrivate) {
            $out['email'] = $user['email'] ?? null;
            $out['student_id'] = $user['student_id'] ?? null;
            $out['studentId'] = $user['student_id'] ?? null;
        }

        if (isset($user['created_at'])) {
            $out['created_at'] = $user['created_at'];
        }
        if (isset($user['posts_count'])) {
            $out['posts_count'] = (int) $user['posts_count'];
            $out['postsCount'] = (int) $user['posts_count'];
        }
        if (isset($user['friends_count'])) {
            $out['friends_count'] = (int) $user['friends_count'];
            $out['friendsCount'] = (int) $user['friends_count'];
        }

        return $out;
    }
}

/* -------------------------------------------------------------------------
 | User settings
 |
 | Preferences live in `user_settings`, one row per user, created on demand so
 | that neither registration nor the seeder has to know about the table. The
 | helpers below are the single gateway to that row: they default a missing
 | column, cache per request, and allow a list render to preload many users in
 | one query instead of one query per person.
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_default_settings')) {
    /**
     * Every preference the app understands, with the column defaults.
     *
     * api/settings/update.php validates against this and the frontend mirrors
     * it in ULinkSettings.DEFAULTS, so adding a key here needs a matching entry
     * there and in config/schema.sql.
     *
     * @return array<string, mixed>
     */
    function ulink_default_settings(): array
    {
        return [
            'compact_feed'           => 0,
            'reduce_motion'          => 0,
            'profile_visibility'     => 'public',
            'show_online_status'     => 1,
            'allow_search_by_id'     => 1,
            'message_privacy'        => 'everyone',
            'notify_likes'           => 1,
            'notify_comments'        => 1,
            'notify_friend_requests' => 1,
            'notify_events'          => 1,
        ];
    }
}

if (!function_exists('ulink_settings_cache')) {
    /**
     * The per-request settings cache, exposed by reference so
     * ulink_preload_user_settings() can fill it in bulk.
     *
     * @return array<int, array<string, mixed>>
     */
    function &ulink_settings_cache(): array
    {
        static $cache = [];
        return $cache;
    }
}

if (!function_exists('ulink_user_settings')) {
    /**
     * A user's settings, creating the row with defaults the first time.
     *
     * @return array<string, mixed>
     */
    function ulink_user_settings(int $userId): array
    {
        $cache = &ulink_settings_cache();

        if (isset($cache[$userId])) {
            return $cache[$userId];
        }

        $defaults = ulink_default_settings();

        if ($userId <= 0 || !Database::tableExists('user_settings')) {
            return $cache[$userId] = $defaults + ['user_id' => $userId];
        }

        $row = null;
        try {
            $row = Database::fetchOne(
                'SELECT * FROM user_settings WHERE user_id = :id LIMIT 1',
                ['id' => $userId]
            );

            if ($row === null) {
                try {
                    Database::run(
                        'INSERT INTO user_settings (user_id) VALUES (:id)',
                        ['id' => $userId]
                    );
                } catch (Throwable $e) {
                    // Lost a race with another request creating the same row;
                    // the re-read below picks it up.
                    ulink_log_error('settings insert raced: ' . $e->getMessage(), $e);
                }

                $row = Database::fetchOne(
                    'SELECT * FROM user_settings WHERE user_id = :id LIMIT 1',
                    ['id' => $userId]
                );
            }
        } catch (Throwable $e) {
            ulink_log_error('settings lookup failed: ' . $e->getMessage(), $e);
            $row = null;
        }

        return $cache[$userId] = array_merge($defaults, is_array($row) ? $row : [], ['user_id' => $userId]);
    }
}

if (!function_exists('ulink_preload_user_settings')) {
    /**
     * Warm the settings cache for many users in a single query.
     *
     * Call this before mapping a list of users through ulink_user_public() so
     * that show_online_status is honoured without an N+1.
     *
     * @param array<int, int|string> $userIds
     */
    function ulink_preload_user_settings(array $userIds): void
    {
        $ids = [];
        foreach ($userIds as $id) {
            $id = (int) $id;
            if ($id > 0) {
                $ids[$id] = $id;
            }
        }

        if ($ids === [] || !Database::tableExists('user_settings')) {
            return;
        }

        $cache = &ulink_settings_cache();
        $missing = array_values(array_diff_key($ids, $cache));

        if ($missing === []) {
            return;
        }

        $defaults = ulink_default_settings();

        try {
            $placeholders = implode(',', array_fill(0, count($missing), '?'));
            $rows = Database::fetchAll(
                "SELECT * FROM user_settings WHERE user_id IN ({$placeholders})",
                $missing
            );
        } catch (Throwable $e) {
            ulink_log_error('settings preload failed: ' . $e->getMessage(), $e);
            return;
        }

        $found = [];
        foreach ($rows as $row) {
            $found[(int) $row['user_id']] = $row;
        }

        foreach ($missing as $id) {
            $cache[$id] = array_merge(
                $defaults,
                $found[$id] ?? [],
                ['user_id' => $id]
            );
        }
    }
}

if (!function_exists('ulink_user_setting')) {
    /**
     * One preference for one user, falling back to the column default.
     *
     * @param mixed $default
     * @return mixed
     */
    function ulink_user_setting(int $userId, string $key, $default = null)
    {
        $settings = ulink_user_settings($userId);

        if (array_key_exists($key, $settings)) {
            return $settings[$key];
        }

        $defaults = ulink_default_settings();

        return array_key_exists($key, $defaults) ? $defaults[$key] : $default;
    }
}

if (!function_exists('ulink_forget_user_settings')) {
    /**
     * Drop one user's settings from the per-request cache after a write.
     */
    function ulink_forget_user_settings(int $userId): void
    {
        $cache = &ulink_settings_cache();
        unset($cache[$userId]);
    }
}

if (!function_exists('ulink_notification_allowed')) {
    /**
     * Should a notification of this type reach this user, given their prefs?
     *
     * Types without a matching preference (system, group, ...) are always
     * allowed: the switch list only covers the social interactions a user can
     * reasonably mute, and silently dropping the rest would hide information
     * they cannot re-enable.
     */
    function ulink_notification_allowed(int $userId, string $type): bool
    {
        $map = [
            'like'             => 'notify_likes',
            'comment'          => 'notify_comments',
            'request'          => 'notify_friend_requests',
            'request_accepted' => 'notify_friend_requests',
            'event'            => 'notify_events',
        ];

        $key = $map[strtolower($type)] ?? null;
        if ($key === null) {
            return true;
        }

        return (int) ulink_user_setting($userId, $key, 1) === 1;
    }
}

if (!function_exists('ulink_settings_public')) {
    /**
     * Shape a raw settings row for the wire.
     *
     * Booleans stay booleans and enums stay strings: the frontend binds these
     * straight to checkbox/select controls, and the raw 0/1 ints would land in
     * `input.checked` as the string "0" and read as truthy.
     *
     * @param  array<string, mixed> $raw
     * @return array<string, mixed>
     */
    function ulink_settings_public(array $raw): array
    {
        return [
            'compact_feed'           => (int) ($raw['compact_feed'] ?? 0) === 1,
            'reduce_motion'          => (int) ($raw['reduce_motion'] ?? 0) === 1,
            'profile_visibility'     => (string) ($raw['profile_visibility'] ?? 'public'),
            'show_online_status'     => (int) ($raw['show_online_status'] ?? 1) === 1,
            'allow_search_by_id'     => (int) ($raw['allow_search_by_id'] ?? 1) === 1,
            'message_privacy'        => (string) ($raw['message_privacy'] ?? 'everyone'),
            'notify_likes'           => (int) ($raw['notify_likes'] ?? 1) === 1,
            'notify_comments'        => (int) ($raw['notify_comments'] ?? 1) === 1,
            'notify_friend_requests' => (int) ($raw['notify_friend_requests'] ?? 1) === 1,
            'notify_events'          => (int) ($raw['notify_events'] ?? 1) === 1,
        ];
    }
}

/* -------------------------------------------------------------------------
 | Schema migrations
 |
 | schema.sql declares the target shape using CREATE TABLE IF NOT EXISTS, which
 | re-runs safely but never adds a column to a table that already exists. Every
 | column added after a database was first created therefore has to be listed
 | here as well, or an existing install silently keeps the old shape.
 |
 | Both lists are idempotent: columns that are already present are skipped.
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_column_migrations')) {
    /**
     * Columns added after the tables were first shipped, keyed by table.
     *
     * Keep each entry byte-identical to the matching column in schema.sql. The
     * installer verifies that, so drift fails loudly at setup time rather than
     * as a type mismatch much later.
     *
     * @return array<string, array<string, string>>
     */
    function ulink_column_migrations(): array
    {
        return [
            'users' => [
                // Optional "About" fields added after the first installs.
                'headline'  => 'VARCHAR(160) DEFAULT NULL',
                'location'  => 'VARCHAR(120) DEFAULT NULL',
                'website'   => 'VARCHAR(255) DEFAULT NULL',
                'interests' => 'VARCHAR(255) DEFAULT NULL',
            ],
            'messages' => [
                // Message attachments (pictures and documents).
                'attachment_type' => "VARCHAR(20) DEFAULT NULL",
                'attachment_name' => "VARCHAR(255) DEFAULT NULL",
                'attachment_path' => "VARCHAR(500) DEFAULT NULL",
                'attachment_mime' => "VARCHAR(120) DEFAULT NULL",
                'attachment_size' => 'INT UNSIGNED DEFAULT NULL',
            ],
        ];
    }
}

if (!function_exists('ulink_apply_column_migrations')) {
    /**
     * Bring every table up to the shape schema.sql declares.
     *
     * @return array<string, array<int, string>> Added columns, keyed by table.
     */
    function ulink_apply_column_migrations(): array
    {
        $added = [];

        foreach (ulink_column_migrations() as $table => $columns) {
            $result = Database::addMissingColumns($table, $columns);
            if ($result !== []) {
                $added[$table] = $result;
                ulink_log_info('Added columns to ' . $table . ': ' . implode(', ', $result));
            }
        }

        return $added;
    }
}

/* -------------------------------------------------------------------------
 | Boot
 | ---------------------------------------------------------------------- */

// Relationship helpers (friendships, notifications, communities, messages).
// Loaded last so every function above is already defined.
require_once __DIR__ . '/relations.php';

ulink_apply_cors();
