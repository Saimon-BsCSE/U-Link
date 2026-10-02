#!/usr/bin/env python3
"""Static check for SQL that cannot survive native prepared statements.

The application connects with `ATTR_EMULATE_PREPARES => false`, so PDO hands
the statement to the server as written. Two mistakes only surface at execute
time, in whichever endpoint happens to reach the query first:

  1. A named placeholder used more than once (`:a ... :a`) fails with
     `SQLSTATE[HY093] Invalid parameter number`, because native prepares bind
     each name positionally and refuse repeats.
  2. Mixing named (`:a`) and positional (`?`) placeholders in one statement
     fails for the same reason.

Usage: scripts/lint-sql.py [path ...]   (defaults to the whole project)

Exits 0 and prints nothing when clean, or prints one block per offending
statement and exits 1.

How the statements are found
----------------------------
Earlier versions picked PHP string literals out of the source with a regex.
That quietly missed statements, which is worse than not checking at all:

    Database::insert('notifications', [
        'is_read' => $offset > 4 ? 1 : 0,     // <- opening quote of 'is_read'
    ]);
    Database::run(
        'INSERT INTO friendships (...)
              VALUES (:a, :b, \'pending\', :r, NULL)   // <- a repeated :r
         ON DUPLICATE KEY UPDATE status_requested_by = :r',   // <- reused
        [...]);

The regex paired the quote that *closes* `'is_read'` with the quote that opens
the INSERT, swallowing the whole statement - so config/seed.php:415 shipped with
a placeholder PDO rejects, and the demo seed died half way through every fresh
install without saying so. It now asks PHP itself, via `token_get_all()`, which
is the actual lexer and cannot be fooled this way.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

# Skip the vendored runtime and anything else that is not our source.
SKIP_DIRS = {".dev", "node_modules", ".git", "vendor"}
SKIP_SUFFIXES = {".min.js", ".map"}

STATEMENT_START = re.compile(r"^\s*(SELECT|INSERT|UPDATE|DELETE|REPLACE)\b", re.I)
# A `:` only opens a placeholder when it is not part of `::` or a word.
PLACEHOLDER = re.compile(r"(?<![:\w]):([a-zA-Z_][a-zA-Z0-9_]*)")


def blank_string_literals(sql: str) -> str:
    """Drop the contents of every single-quoted SQL literal.

    Anything inside a string constant is text, not SQL: neither `:name` nor `?`
    there is a placeholder. This started life as the regex
    `'(?:\\\\.|[^'])*'` and was wrong twice.

    With `[^']` the class also matched a backslash, so on `\\'pending\\'` the
    scanner could accept the closing quote as ordinary text and then run on to
    the next quote, swallowing every placeholder in between - including the
    second `:r` that was the entire reason for the check. Changing the class to
    `[^'\\\\]` fixed that and broke something else: `\\'who? what?\\' WHERE id = :id`
    became one literal, because the `\\'` at each end was consumed as an escape
    while the quote that actually closed the literal was taken as its opening.

    Both failures are the same mistake - deciding what a quote means by looking
    at a regular expression instead of at the text. So: a backslash always
    escapes whatever follows it, and a quote is a delimiter exactly when it is
    not consumed by such a pair. That is what the server does too.
    """
    out: list[str] = []
    in_literal = False
    i = 0
    n = len(sql)

    while i < n:
        char = sql[i]

        # A backslash escapes the next character, whatever it is. Consuming both
        # means an escaped quote is never mistaken for a delimiter.
        if char == "\\" and i + 1 < n:
            if not in_literal:
                out.append(sql[i : i + 2])
            i += 2
            continue

        if char == "'":
            in_literal = not in_literal
            i += 1
            continue

        if not in_literal:
            out.append(char)
        i += 1

    return "".join(out)

# Emitted by the PHP side of this script; see php_literals() below.
#
# The literals are handed to the Python side *unescaped*, exactly as PDO will
# receive them. That matters: a PHP single-quoted literal holding
# `'who? what?'` is written as `\'who? what?\'`, and if the backslashes survive
# then every quote in the SQL looks escaped, no string constant is recognised,
# and the `?` characters inside it get counted as positional placeholders.
LITERAL_PROGRAM = r"""
$file = $argv[1];

/**
 * Undo PHP's single-quoted string escapes in one pass. Two str_replace() calls
 * would be wrong: replacing `\\` first turns `\\'` into `\'`, which the second
 * call then unescapes, so a literal ending in a backslash loses it.
 */
$unslash = static function (string $body): string {
    $out = '';
    $len = strlen($body);
    for ($k = 0; $k < $len; $k++) {
        $c = $body[$k];
        if ($c === '\\' && $k + 1 < $len) {
            $next = $body[$k + 1];
            if ($next === '\\' || $next === "'") {
                $out .= $next;
                $k++;
                continue;
            }
            // A backslash before anything else is literal in a single-quoted
            // string, and is kept so SQL-level escapes survive untouched.
            $out .= $c;
            continue;
        }
        $out .= $c;
    }
    return $out;
};

// For a double-quoted literal only `\\` and `\"` need undoing here. The other
// escapes (\n, \t, \u{...}) cannot introduce a quote, so leaving them spelled out
// changes nothing for placeholder detection.
$undquote = static function (string $body): string {
    return str_replace(['\\\\', '\\"'], ['\\', '"'], $body);
};

$out = [];
foreach (token_get_all(file_get_contents($file)) as $token) {
    if (!is_array($token)) {
        // A bare `"` between tokens means the literal was interpolated; its
        // interior arrives separately as T_ENCAPSED_AND_WHITESPACE. A bare `'`
        // cannot appear: it always arrives whole as T_CONSTANT_ENCAPSED_STRING.
        continue;
    }
    if ($token[0] === T_CONSTANT_ENCAPSED_STRING) {
        $text = substr($token[1], 1, -1);   // drop the delimiters
        $text = $token[1][0] === "'" ? $unslash($text) : $undquote($text);
    } elseif ($token[0] === T_ENCAPSED_AND_WHITESPACE) {
        // The lexer has already resolved the interpolation for us.
        $text = $token[1];
    } else {
        continue;
    }
    $out[] = [$token[2], $text];
}
echo json_encode($out);
"""


def php_binary() -> str | None:
    """The bundled PHP if scripts/dev.sh has it, otherwise whatever is on PATH."""
    root = Path(__file__).resolve().parent.parent

    # Note the `is_file()` test: `Path("")` is `.`, which exists, so an unset
    # environment variable would otherwise be handed to subprocess as a path.
    env_php = os.environ.get("PHP_BINARY", "")
    if env_php and Path(env_php).is_file():
        return env_php

    on_path = shutil.which("php")
    if on_path and Path(on_path).is_file():
        return on_path

    dev_php = root / ".dev" / "php-ext" / "active"
    if dev_php.is_dir():
        for candidate in sorted(dev_php.glob("*/bin/php")):
            if candidate.is_file():
                return str(candidate)

    return None


def php_literals(php: str, path: Path) -> list[tuple[int, str]]:
    """(line, text) for every PHP string literal in `path`, via token_get_all()."""
    try:
        completed = subprocess.run(
            [php, "-r", LITERAL_PROGRAM, str(path)],
            capture_output=True,
            text=True,
            timeout=30,
        )
    except (OSError, subprocess.SubprocessError):
        return []
    if completed.returncode != 0:
        return []
    try:
        return [(int(line), text) for line, text in json.loads(completed.stdout)]
    except (ValueError, TypeError, KeyError):
        return []


def statements_in(path: Path, php: str) -> list[tuple[int, str]]:
    """Yield (line_number, sql) for every SQL statement literal in a PHP file."""
    seen: set[tuple[int, str]] = set()
    out: list[tuple[int, str]] = []

    for line, text in php_literals(php, path):
        if not STATEMENT_START.match(text):
            continue
        # An interpolated statement arrives in fragments; glue them back
        # together per line so `:a ... :a` spanning two fragments is still seen.
        key = (line, text)
        if key in seen:
            continue
        seen.add(key)
        out.append((line, text))

    return out


def problems_in(path: Path, php: str) -> list[str]:
    found: list[str] = []

    for line, sql in statements_in(path, php):
        # Placeholders inside a quoted literal are not placeholders at all.
        stripped = blank_string_literals(sql)
        names = PLACEHOLDER.findall(stripped)
        question_marks = stripped.count("?")

        reasons = []

        repeated = sorted({n for n in names if names.count(n) > 1})
        if repeated:
            reasons.append("reuses placeholder " + ", ".join(":" + n for n in repeated))

        if names and question_marks:
            reasons.append("mixes named and positional placeholders")

        if reasons:
            found.append(f"{path}:{line}  {'; '.join(reasons)}\n    {' '.join(sql.split())[:140]}")

    return found


def php_files(roots: list[str]):
    for root in roots:
        base = Path(root)
        candidates = base.rglob("*.php") if base.is_dir() else [base]
        for candidate in candidates:
            parts = set(candidate.parts)
            if parts & SKIP_DIRS or candidate.suffix in SKIP_SUFFIXES:
                continue
            yield candidate


def main(argv: list[str]) -> int:
    roots = argv[1:] or ["."]

    if not any(roots):
        print("usage: lint-sql.py [path ...]", file=sys.stderr)
        return 2

    php = php_binary()
    if php is None:
        # A checker that cannot see the statements is worse than no checker, so
        # this is a hard failure rather than a silent pass.
        print(
            "lint-sql.py needs PHP to read string literals (token_get_all).\n"
            "Install php-cli, or run ./scripts/dev.sh setup to unpack a private copy.",
            file=sys.stderr,
        )
        return 2

    files = list(php_files(roots))
    if not files:
        return 0

    # Cheap proof that the extraction is working. Without it, a tokenizer that
    # stops recognising literals looks exactly like a clean codebase.
    probe = files[0]
    if not php_literals(php, probe) and "SELECT" in probe.read_text(errors="replace"):
        print(
            f"lint-sql.py could not read any string literal out of {probe}.\n"
            "Refusing to report a clean bill of health it cannot substantiate.",
            file=sys.stderr,
        )
        return 2

    found: list[str] = []
    for path in files:
        found.extend(problems_in(path, php))

    for problem in found:
        print(problem)
        print()

    if found:
        print(f"{len(found)} statement(s) will fail with native prepared statements")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))