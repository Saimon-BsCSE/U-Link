<?php
/**
 * config/sql.php
 *
 * SQL script parsing used by the installer.
 */

if (!function_exists('ulink_split_sql')) {
    /**
     * Split a SQL script into individual statements.
     *
     * A naive explode(';', $sql) breaks on semicolons inside string literals
     * and on any comment that precedes a statement. The original installer did
     * exactly that and then discarded every segment starting with "--", so
     * because every CREATE TABLE in schema.sql is preceded by a comment line,
     * the script reported success having created zero tables.
     *
     * This walks the script one character at a time, tracking line comments,
     * block comments, and single/double/backtick quoting, so only top-level
     * semicolons break a statement.
     *
     * @return array<int, string> Non-empty statements with the trailing ';' removed.
     */
    function ulink_split_sql(string $sql): array
    {
        $statements = [];
        $current    = '';
        $length     = strlen($sql);

        $inSingle       = false; // '...'
        $inDouble       = false; // "..."
        $inBacktick     = false; // `...`
        $inLineComment  = false;
        $inBlockComment = false;

        for ($i = 0; $i < $length; $i++) {
            $char = $sql[$i];
            $next = $i + 1 < $length ? $sql[$i + 1] : '';

            /* ------------------------------- comments ------------------------------- */
            if ($inLineComment) {
                if ($char === "\n") {
                    $inLineComment = false;
                    $current .= "\n"; // keep line structure for readable errors
                }
                continue;
            }

            if ($inBlockComment) {
                if ($char === '*' && $next === '/') {
                    $inBlockComment = false;
                    $i++;
                }
                continue;
            }

            if (!$inSingle && !$inDouble && !$inBacktick) {
                // "--" comment. MySQL requires whitespace after the second dash.
                if ($char === '-' && $next === '-') {
                    $after = $i + 2 < $length ? $sql[$i + 2] : ' ';
                    if ($after === ' ' || $after === "\t" || $after === "\n" || $after === "\r") {
                        $inLineComment = true;
                        $i++;
                        continue;
                    }
                }

                // "#" comment
                if ($char === '#') {
                    $inLineComment = true;
                    continue;
                }

                // "/* ... */" comment
                if ($char === '/' && $next === '*') {
                    $inBlockComment = true;
                    $i++;
                    continue;
                }
            }

            /* -------------------------------- quoting -------------------------------- */
            if ($inSingle) {
                $current .= $char;
                if ($char === '\\' && $next !== '') { // backslash escape
                    $current .= $next;
                    $i++;
                    continue;
                }
                if ($char === "'") {
                    if ($next === "'") { // '' is an escaped quote
                        $current .= $next;
                        $i++;
                        continue;
                    }
                    $inSingle = false;
                }
                continue;
            }

            if ($inDouble) {
                $current .= $char;
                if ($char === '\\' && $next !== '') {
                    $current .= $next;
                    $i++;
                    continue;
                }
                if ($char === '"') {
                    if ($next === '"') {
                        $current .= $next;
                        $i++;
                        continue;
                    }
                    $inDouble = false;
                }
                continue;
            }

            if ($inBacktick) {
                $current .= $char;
                if ($char === '`') {
                    $inBacktick = false;
                }
                continue;
            }

            if ($char === "'") { $inSingle   = true; $current .= $char; continue; }
            if ($char === '"') { $inDouble   = true; $current .= $char; continue; }
            if ($char === '`') { $inBacktick = true; $current .= $char; continue; }

            /* --------------------------- statement break --------------------------- */
            if ($char === ';') {
                $trimmed = trim($current);
                if ($trimmed !== '') {
                    $statements[] = $trimmed;
                }
                $current = '';
                continue;
            }

            $current .= $char;
        }

        $trimmed = trim($current);
        if ($trimmed !== '') {
            $statements[] = $trimmed;
        }

        return $statements;
    }
}

if (!function_exists('ulink_sql_has_table')) {
    /**
     * True when a statement creates a table.
     */
    function ulink_sql_has_table(string $sql, string $table): bool
    {
        return (bool) preg_match(
            '/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?' . preg_quote($table, '/') . '`?/i',
            $sql
        );
    }
}
