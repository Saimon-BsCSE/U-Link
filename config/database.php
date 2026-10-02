<?php
/**
 * config/database.php
 *
 * PDO/MySQL access layer.
 *
 * Behaviour notes:
 *  - Failures raise a DatabaseException instead of echoing JSON and calling
 *    exit(). The previous implementation printed a response body and exited,
 *    which made it impossible for callers to add their own headers and turned
 *    any connection problem into an unparseable 200 response.
 *  - The connection is a lazily created singleton, so including this file is
 *    cheap and no connection is opened unless a query actually runs.
 *  - Native prepared statements are used (EMULATE_PREPARES = false) so bound
 *    parameters are sent out-of-band and can never be reinterpreted as SQL.
 */

require_once __DIR__ . '/config.php';

class DatabaseException extends RuntimeException
{
}

/** Thrown for constraint violations that the caller can present to the user. */
class DatabaseConstraintException extends DatabaseException
{
}

class Database
{
    /** @var PDO|null Shared connection instance. */
    private static $instance = null;

    /** @var string|null Driver name of the shared connection. */
    private static $connectedDriver = null;

    /** @var string|null Last connection error, for diagnostics only. */
    private static $lastError = null;

    /** @var PDO|null Per-instance handle kept for backwards compatibility. */
    public $conn = null;

    /**
     * Build the PDO DSN for the configured driver.
     *
     * Pass an empty string to omit the database name and get a server-level
     * connection, which is what the installer needs in order to issue
     * CREATE DATABASE.
     */
    public static function dsn(?string $database = null): string
    {
        $database = $database ?? ULINK_DB_NAME;

        if (ULINK_DB_DRIVER === 'sqlite') {
            // A database name of ":memory:" is passed straight through.
            return 'sqlite:' . $database;
        }

        if ($database === '') {
            return sprintf(
                'mysql:host=%s;port=%d;charset=%s',
                ULINK_DB_HOST,
                ULINK_DB_PORT,
                ULINK_DB_CHARSET
            );
        }

        return sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            ULINK_DB_HOST,
            ULINK_DB_PORT,
            $database,
            ULINK_DB_CHARSET
        );
    }

    /**
     * Credentials for the configured driver.
     *
     * @return array{0: string|null, 1: string|null}
     */
    public static function credentials(): array
    {
        if (ULINK_DB_DRIVER === 'sqlite') {
            return [null, null];
        }

        return [ULINK_DB_USER, ULINK_DB_PASS];
    }

    /**
     * Return the shared connection, opening it on first use.
     *
     * @throws DatabaseException
     */
    public static function connection(): PDO
    {
        if (self::$instance instanceof PDO) {
            return self::$instance;
        }

        [$user, $password] = self::credentials();

        $attempts = max(1, ULINK_DB_RETRIES + 1);
        $lastException = null;

        for ($attempt = 1; $attempt <= $attempts; $attempt++) {
            try {
                $pdo = new PDO(self::dsn(), $user, $password, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    // Real prepared statements: bound values never reach the
                    // SQL parser.
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::ATTR_STRINGIFY_FETCHES  => false,
                ]);

                if (ULINK_DB_DRIVER !== 'sqlite') {
                    // Predictable, portable session settings.
                    $pdo->exec("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION'");
                    $pdo->exec("SET time_zone = '+00:00'");
                } else {
                    $pdo->exec('PRAGMA foreign_keys = ON');
                    $pdo->exec('PRAGMA journal_mode = WAL');
                    $pdo->exec('PRAGMA busy_timeout = 5000');
                }

                self::$instance = $pdo;
                self::$connectedDriver = ULINK_DB_DRIVER;
                self::$lastError = null;

                return $pdo;
            } catch (PDOException $e) {
                $lastException = $e;
                // "server has gone away" / "lost connection": worth retrying.
                $lostConnection = in_array($e->getCode(), [2006, 2013, 2002, 1040], true);
                if ($attempt < $attempts && $lostConnection) {
                    usleep(200000 * $attempt);
                }
            }
        }

        self::$lastError = $lastException ? $lastException->getMessage() : 'unknown error';

        throw new DatabaseException(
            'Database connection failed: ' . self::$lastError,
            0,
            $lastException
        );
    }

    /**
     * Backwards compatible instance method used by the existing endpoints.
     *
     * @throws DatabaseException
     */
    public function getConnection(): PDO
    {
        $this->conn = self::connection();
        return $this->conn;
    }

    /**
     * True when a connection can be established and a trivial query succeeds.
     */
    public static function isConnected(): bool
    {
        try {
            self::connection()->query('SELECT 1');
            return true;
        } catch (Throwable $e) {
            return false;
        }
    }

    /** Driver of the live connection ("mysql" or "sqlite"). */
    public static function driver(): string
    {
        return self::$connectedDriver ?? ULINK_DB_DRIVER;
    }

    /** Last connection error message, or null. */
    public static function lastError(): ?string
    {
        return self::$lastError;
    }

    /**
     * Open a standalone connection, bypassing the shared instance.
     *
     * `connectToServer()` connects without selecting a database, which is
     * required to create it. `connectTo($name)` selects a specific database.
     *
     * @throws DatabaseException
     */
    public static function connectToServer(): PDO
    {
        return self::openConnection('');
    }

    /**
     * @throws DatabaseException
     */
    public static function connectTo(?string $database = null): PDO
    {
        return self::openConnection($database ?? ULINK_DB_NAME);
    }

    /**
     * @throws DatabaseException
     */
    private static function openConnection(string $database): PDO
    {
        [$user, $password] = self::credentials();

        try {
            $pdo = new PDO(self::dsn($database), $user, $password, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_STRINGIFY_FETCHES  => false,
            ]);
        } catch (PDOException $e) {
            throw new DatabaseException('Database connection failed: ' . $e->getMessage(), 0, $e);
        }

        if (ULINK_DB_DRIVER !== 'sqlite') {
            $pdo->exec("SET time_zone = '+00:00'");
        } else {
            $pdo->exec('PRAGMA foreign_keys = ON');
        }

        return $pdo;
    }

    /**
     * Run a callback inside a transaction, committing on success and rolling
     * back on any throwable.
     *
     * @template T
     * @param  callable(PDO): T $callback
     * @return T
     * @throws Throwable
     */
    /** @var array<string, array<int, string>> Memoised columns() results. */
    private static array $columnCache = [];

    public static function transaction(callable $callback)
    {
        $pdo = self::connection();
        $ownsTransaction = !$pdo->inTransaction();

        if ($ownsTransaction) {
            $pdo->beginTransaction();
        }

        try {
            $result = $callback($pdo);
            if ($ownsTransaction) {
                $pdo->commit();
            }
            return $result;
        } catch (Throwable $e) {
            if ($ownsTransaction && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Prepare, execute and return the statement. Central place where driver
     * specific errors are translated into something the API layer understands.
     *
     * @param  array<string, mixed> $params
     * @throws DatabaseException
     */
    public static function run(string $sql, array $params = []): PDOStatement
    {
        $pdo = self::connection();

        try {
            $stmt = $pdo->prepare($sql);

            foreach ($params as $key => $value) {
                $name = is_int($key) ? $key + 1 : (str_starts_with((string) $key, ':') ? $key : ':' . $key);
                $type = PDO::PARAM_STR;

                if (is_int($value) || is_bool($value)) {
                    $type = PDO::PARAM_INT;
                    $value = (int) $value;
                } elseif ($value === null) {
                    $type = PDO::PARAM_NULL;
                }

                $stmt->bindValue($name, $value, $type);
            }

            $stmt->execute();

            return $stmt;
        } catch (PDOException $e) {
            // 23000/23505 == integrity constraint violation (duplicate, FK, ...).
            if ((string) $e->getCode() === '23000' || $e->getCode() === 19) {
                throw new DatabaseConstraintException($e->getMessage(), (int) $e->getCode(), $e);
            }

            throw new DatabaseException('Query failed: ' . $e->getMessage(), (int) $e->getCode(), $e);
        }
    }

    /**
     * Fetch a single row, or null.
     *
     * @param  array<string, mixed> $params
     * @return array<string, mixed>|null
     */
    public static function fetchOne(string $sql, array $params = []): ?array
    {
        $row = self::run($sql, $params)->fetch();
        return $row === false ? null : $row;
    }

    /**
     * Fetch all rows.
     *
     * @param  array<string, mixed> $params
     * @return array<int, array<string, mixed>>
     */
    public static function fetchAll(string $sql, array $params = []): array
    {
        return self::run($sql, $params)->fetchAll();
    }

    /**
     * Fetch a single scalar value from the first column of the first row.
     *
     * @param  array<string, mixed> $params
     */
    public static function fetchValue(string $sql, array $params = [])
    {
        $value = self::run($sql, $params)->fetchColumn();
        return $value === false ? null : $value;
    }

    /**
     * Insert a row and return the new primary key.
     *
     * @param  array<string, mixed> $data
     */
    public static function insert(string $table, array $data): int
    {
        $columns = array_keys($data);
        $placeholders = array_map(static fn($c) => ':' . $c, $columns);

        $sql = sprintf(
            'INSERT INTO `%s` (%s) VALUES (%s)',
            $table,
            '`' . implode('`, `', $columns) . '`',
            implode(', ', $placeholders)
        );

        self::run($sql, $data);

        return (int) self::connection()->lastInsertId();
    }

    /**
     * Update rows by primary key.
     *
     * This is the *single integer key* helper. It deliberately refuses a $pk
     * that is not a real column of the table, because the alternative is a
     * query that compiles and silently rewrites more rows than the caller
     * meant: `Database::update('community_members', ['role' => 'admin'], $uid,
     * 'user_id')` promotes an admin in *every* community the user belongs to,
     * because that table is keyed by `(community_id, user_id)` and `user_id`
     * matches every one of their rows.
     *
     * @param  array<string, mixed> $data
     */
    public static function update(string $table, array $data, int $id, string $pk = 'id'): int
    {
        if ($data === []) {
            return 0;
        }

        $columns = self::columns($table);

        if ($columns !== [] && !in_array($pk, $columns, true)) {
            throw new RuntimeException(sprintf(
                'Database::update(%s, ..., %d, %s): `%s` is not a column of `%s`. '
                . 'Use Database::run() when the key is composite or non-numeric.',
                $table,
                $id,
                $pk,
                $pk,
                $table
            ));
        }

        $assignments = [];
        $params = [];
        foreach ($data as $column => $value) {
            if ($columns !== [] && !in_array($column, $columns, true)) {
                throw new RuntimeException(sprintf(
                    'Database::update(%s): `%s` is not a column of `%s`.',
                    $table,
                    $column,
                    $table
                ));
            }
            $assignments[] = sprintf('`%s` = :set_%s', $column, $column);
            $params['set_' . $column] = $value;
        }
        $params['__pk'] = $id;

        $sql = sprintf(
            'UPDATE `%s` SET %s WHERE `%s` = :__pk',
            $table,
            implode(', ', $assignments),
            $pk
        );

        return self::run($sql, $params)->rowCount();
    }

    /**
     * Delete rows by primary key.
     */
    public static function delete(string $table, int $id, string $pk = 'id'): int
    {
        return self::run("DELETE FROM `{$table}` WHERE `{$pk}` = :id", ['id' => $id])->rowCount();
    }

    /**
     * Escape a string for use inside a LIKE pattern so user supplied `%` and
     * `_` are matched literally.
     */
    public static function likeEscape(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    /**
     * True when the given table exists in the current database.
     */
    public static function tableExists(string $table): bool
    {
        try {
            if (self::driver() === 'sqlite') {
                $found = self::fetchValue(
                    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = :t",
                    ['t' => $table]
                );
                return $found !== null;
            }

            $found = self::fetchValue(
                'SELECT table_name FROM information_schema.tables WHERE table_schema = :db AND table_name = :t',
                ['db' => ULINK_DB_NAME, 't' => $table]
            );
            return $found !== null;
        } catch (Throwable $e) {
            return false;
        }
    }

    /**
     * Column names for a table (empty array when the table is missing).
     *
     * Memoised per process: Database::update() consults this on every call, and
     * auth/session.php touches the users table on every authenticated request,
     * so an uncached information_schema query would be one extra round trip per
     * request. The cache is a lookup only - a stale entry can only make the
     * update() guard throw a clearer error, never write to the wrong column.
     *
     * @return array<int, string>
     */
    public static function columns(string $table): array
    {
        if (isset(self::$columnCache[$table])) {
            return self::$columnCache[$table];
        }

        $columns = [];
        try {
            if (self::driver() === 'sqlite') {
                $rows = self::fetchAll("PRAGMA table_info(`{$table}`)");
                $columns = array_map(static fn($r) => (string) $r['name'], $rows);
            } else {
                $rows = self::fetchAll(
                    'SELECT column_name FROM information_schema.columns WHERE table_schema = :db AND table_name = :t',
                    ['db' => ULINK_DB_NAME, 't' => $table]
                );
                $columns = array_map(static fn($r) => (string) $r['column_name'], $rows);
            }
        } catch (Throwable $e) {
            $columns = [];
        }

        self::$columnCache[$table] = $columns;

        return $columns;
    }

    /**
     * Add any columns in $wanted that $table does not already have.
     *
     * schema.sql is written with CREATE TABLE IF NOT EXISTS, which is safe to
     * re-run but will never add a column to a table that already exists. So a
     * new column only reaches a fresh database, and every existing install is
     * left running the old shape until someone notices. This closes that gap:
     * the installer calls it after applying the schema, so an existing database
     * converges on the declared shape without a manual ALTER.
     *
     * $wanted maps column name to the definition that follows the name, e.g.
     * ['attachment_mime' => 'VARCHAR(120) DEFAULT NULL']. The type is taken
     * from this file rather than from the live table, so the schema stays the
     * single source of truth.
     *
     * @param  array<string,string> $wanted
     * @return array<int,string>  Columns that were added.
     */
    public static function addMissingColumns(string $table, array $wanted): array
    {
        $added = [];

        if (!self::tableExists($table)) {
            return $added;
        }

        $existing = array_map('strval', self::columns($table));
        if ($existing === []) {
            return $added;
        }

        foreach ($wanted as $column => $definition) {
            if (!preg_match('/^[a-z_][a-z0-9_]*$/i', $column)) {
                continue;
            }

            if (in_array($column, $existing, true)) {
                continue;
            }

            // Identifiers cannot be bound as parameters. Both the name and the
            // definition are gated above / come from this codebase, never from
            // user input.
            $sql = 'ALTER TABLE `' . $table . '` ADD COLUMN `' . $column . '` ' . $definition;

            try {
                self::connection()->exec($sql);
                $added[] = $column;
                // columns() memoises, and the migration check below reads it.
                unset(self::$columnCache[$table]);
            } catch (Throwable $e) {
                // A concurrent installer may have won the race; that is fine.
                unset(self::$columnCache[$table]);
                if (!in_array($column, array_map('strval', self::columns($table)), true)) {
                    throw new RuntimeException(
                        sprintf(
                            'Could not add column %s.%s: %s',
                            $table,
                            $column,
                            $e->getMessage()
                        ),
                        0,
                        $e
                    );
                }
            }
        }

        return $added;
    }
}
