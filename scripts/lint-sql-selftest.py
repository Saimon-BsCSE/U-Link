#!/usr/bin/env python3
"""Self-test for scripts/lint-sql.py.

The linter's whole job is to fail loudly, so the ways it can fail *quietly* are
the ones worth pinning down. Both bugs it has had were silent:

  * its regex tokenizer paired the quote closing `'is_read'` with the quote
    opening a later `Database::run('INSERT ...')`, so that statement was never
    examined at all;
  * its string-literal scanner let `[^']` match the backslash of `\'`, and then
    ran past the next quote - swallowing the very placeholder it was looking
    for.

Both are invisible from the outside: the linter prints nothing and exits 0. So
each fixture here asserts that a defect is *reported*, not merely that a clean
file passes.

Usage: scripts/lint-sql-selftest.py
Exits 0 when every fixture behaves, 1 otherwise.
"""

from __future__ import annotations

import importlib.util
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent


def load():
    spec = importlib.util.spec_from_file_location("lint_sql", HERE / "lint-sql.py")
    if spec is None or spec.loader is None:
        raise SystemExit("cannot load scripts/lint-sql.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# (name, php source, must report at least one problem)
POSITIVES: list[tuple[str, str]] = [
    (
        "a placeholder reused in an upsert",
        """<?php
Database::run(
    'INSERT INTO friendships (user_id_1, user_id_2, status, status_requested_by)
          VALUES (:a, :b, \\'pending\\', :r, NULL)
     ON DUPLICATE KEY UPDATE status_requested_by = :r',
    ['a' => 1, 'b' => 2, 'r' => 3]
);
""",
    ),
    (
        "a placeholder reused plainly",
        """<?php
Database::fetchAll('SELECT * FROM posts WHERE user_id = :u AND id <> :u', ['u' => 1]);
""",
    ),
    (
        "named and positional placeholders mixed",
        """<?php
Database::fetchAll('SELECT * FROM posts WHERE user_id = :u AND visibility = ?', ['u' => 1]);
""",
    ),
    (
        "the statement is reached only after a run of bare array keys",
        # This is the shape that hid config/seed.php:416. The quote that opens
        # `'is_read'` is followed by no closing quote on that line, which is
        # enough to derail a regex tokenizer.
        """<?php
Database::insert('notifications', [
    'type'     => $type,
    'content'  => $content,
    'is_read'  => $offset > 4 ? 1 : 0,
]);

Database::run(
    'INSERT INTO friendships (user_id_1, user_id_2, status, status_requested_by)
          VALUES (:a, :b, \\'pending\\', :r, NULL)
     ON DUPLICATE KEY UPDATE status_requested_by = :r',
    ['a' => 1, 'b' => 2, 'r' => 3]
);
""",
    ),
    (
        "a repeated placeholder separated by an escaped string literal",
        """<?php
Database::run(
    'UPDATE users SET bio = \\'hello\\' WHERE id = :id AND student_id <> :id',
    ['id' => 1]
);
""",
    ),
    (
        "an interpolated heredoc",
        """<?php
$sql = <<<SQL
    SELECT * FROM posts
     WHERE user_id = :u
       AND community_id = :u
SQL;
Database::fetchAll($sql, ['u' => 1]);
""",
    ),
]

# (name, php source, must report nothing)
NEGATIVES: list[tuple[str, str]] = [
    (
        "each placeholder used once",
        """<?php
Database::fetchAll(
    'SELECT id, content FROM posts WHERE user_id = :u AND community_id = :c LIMIT :l',
    ['u' => 1, 'c' => 2, 'l' => 10]
);
""",
    ),
    (
        "placeholders that only look like placeholders",
        """<?php
Database::run('UPDATE posts SET content = :t WHERE id = :id', ['t' => 'a:b', 'id' => 1]);
Database::fetchAll('SELECT id FROM posts WHERE content LIKE \\'%:notaplaceholder%\\'');
""",
    ),
    (
        "a question mark inside a string literal",
        """<?php
Database::run(
    'UPDATE posts SET content = \\'who? what?\\' WHERE id = :id',
    ['id' => 1]
);
""",
    ),
    (
        "an escaped quote does not end the literal",
        """<?php
Database::run(
    'INSERT INTO events (id, title) VALUES (1, \\'Bob\\'s talk\\') WHERE id = :id',
    ['id' => 1]
);
""",
    ),
    (
        "no SQL at all",
        """<?php
echo 'hello';
$greeting = "world";
""",
    ),
]


def check(module, name: str, source: str, want_problems: bool) -> list[str]:
    failures = []
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "fixture.php"
        path.write_text(source)
        php = module.php_binary()
        if php is None:
            return [f"{name}: no PHP binary available to read the fixture"]

        literals = module.php_literals(php, path)
        if not literals:
            return [f"{name}: the extractor read no literals at all"]

        found = module.problems_in(path, php)
        got = len(found)
        if want_problems and got == 0:
            failures.append(f"{name}: expected a problem, found none")
        elif not want_problems and got > 0:
            failures.append(f"{name}: expected no problem, found {got}: {found[0]}")
    return failures


def main() -> int:
    module = load()

    failures: list[str] = []
    for name, source in POSITIVES:
        failures.extend(check(module, name, source, True))
    for name, source in NEGATIVES:
        failures.extend(check(module, name, source, False))

    total = len(POSITIVES) + len(NEGATIVES)
    if failures:
        for failure in failures:
            print(f"FAIL  {failure}", file=sys.stderr)
        print(f"\n{len(failures)} of {total} lint-sql self-tests failed", file=sys.stderr)
        return 1

    print(f"lint-sql self-test: {total} fixtures behaved as expected")
    return 0


if __name__ == "__main__":
    sys.exit(main())