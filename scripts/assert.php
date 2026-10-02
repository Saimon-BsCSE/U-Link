<?php
/**
 * scripts/assert.php
 *
 * Response assertion helper for scripts/test-api.sh.
 *
 *   php scripts/assert.php 'count($d["data"] ?? []) > 0'
 *   php scripts/assert.php 'foreach (...) { ... } return true;' [arg ...]
 *
 * Reads the JSON response body on stdin, decodes it into $d, and evaluates the
 * supplied snippet. The snippet may be either a bare expression or a block of
 * statements ending in `return`, so both styles work. Any string the snippet
 * returns is reported as the failure reason; `true` means the check passed.
 *
 * Extra arguments after the snippet are available to it as $argv[1], $argv[2]...
 */

// $argv keeps PHP's native layout: $argv[0] is this script, $argv[1] is the
// snippet, and any extra arguments the caller passed follow at $argv[2], ...
// The snippet can therefore read its own parameters as $argv[2], $argv[3]...
$d = json_decode(stream_get_contents(STDIN), true);

/** Walk a dotted path through the decoded body, returning null when absent. */
$path = static function ($root, string $p) {
    foreach (explode('.', $p) as $key) {
        if ($key === '') {
            continue;
        }
        if (is_object($root) && isset($root->$key)) {
            $root = $root->$key;
            continue;
        }
        if (!is_array($root) || !array_key_exists($key, $root)) {
            return null;
        }
        $root = $root[$key];
    }
    return $root;
};

/** True when the array at $key has a row whose $field equals $value. */
$find = static function ($root, string $key, array $value) use ($path) {
    $list = $path($root, $key);
    if (!is_array($list)) {
        return false;
    }
    foreach ($list as $row) {
        if (is_array($row) && ($row[$value[0]] ?? null) == $value[1]) {
            return true;
        }
    }
    return false;
};

/** True when every element of the array at $key carries all of $keys. */
$hasKeys = static function ($root, string $key, array $keys) use ($path) {
    $list = $path($root, $key);
    if (!is_array($list)) {
        return "{$key} is not an array";
    }
    foreach ($list as $i => $row) {
        $normalised = is_object($row) ? (array) $row : $row;
        if (!is_array($normalised)) {
            return "{$key}[{$i}] is not an object";
        }
        foreach ($keys as $needed) {
            if (!array_key_exists($needed, $normalised)) {
                return "{$key}[{$i}] is missing '{$needed}'";
            }
        }
    }
    return true;
};

/** True when the object at $key carries all of $keys. */
$hasFields = static function ($root, string $key, array $keys) use ($path) {
    $object = $path($root, $key);
    if (is_object($object)) {
        $object = (array) $object;
    }
    if (!is_array($object)) {
        return "'{$key}' is not an object";
    }
    foreach ($keys as $needed) {
        if (!array_key_exists($needed, $object)) {
            return "'{$key}' is missing '{$needed}'";
        }
    }
    return true;
};

if ($argc < 2 || trim($argv[1]) === '') {
    echo 'no assertion supplied';
    exit(1);
}

$snippet = $argv[1];

// A bare expression is wrapped in "return (...);" so its value is the result.
// Statement blocks are run as-is. Try the expression form first and fall back to
// the block form when the snippet is not a single expression.
try {
    $result = eval('return (' . $snippet . ');');
} catch (ParseError $e) {
    try {
        $result = eval($snippet);
    } catch (Throwable $inner) {
        echo 'error: ' . $inner->getMessage();
        exit(1);
    }
} catch (Throwable $e) {
    echo 'error: ' . $e->getMessage();
    exit(1);
}

if ($result === true) {
    echo 'true';
    exit(0);
}

echo is_string($result) ? $result : var_export($result, true);
exit(0);