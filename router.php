<?php
/**
 * router.php
 *
 * Router for PHP's built-in development server:
 *
 *     php -S 127.0.0.1:8080 -t . router.php
 *
 * Serves existing static files directly and hands everything under /api to the
 * matching PHP script. In production Apache or nginx serves the same paths
 * without this file (see .htaccess).
 */

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = urldecode($path);
$root = __DIR__;

// Reject traversal attempts outright.
if (strpos($path, "\0") !== false || strpos($path, '..') !== false) {
    http_response_code(400);
    echo 'Bad request';
    return true;
}

/* --------------------------------------------------- existing static file */

// Private upload directory. Message attachments are only ever readable through
// api/messages/attachment.php, which checks that the requester is a participant
// in the thread. Serving the files here would publish them to anyone holding a
// URL, so the directory is refused outright.
//
// (Under Apache uploads/messages/.htaccess does the same thing. This router
// exists because the PHP built-in server ignores .htaccess entirely, which
// would otherwise make the dev environment leak what production protects.)
if (preg_match('#^/uploads/messages(/|$)#i', $path)) {
    http_response_code(404);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'status'  => 'error',
        'message' => 'Attachment not found.',
    ]);
    return true;
}

// Apache config is never content.
if (preg_match('#(^|/)\.ht#i', $path)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Not found';
    return true;
}

$candidate = realpath($root . $path);

if ($candidate !== false && is_file($candidate) && strpos($candidate, $root) === 0) {
    // Never serve PHP source, even by direct URL.
    if (strtolower(pathinfo($candidate, PATHINFO_EXTENSION)) === 'php') {
        return false; // let the built-in server execute it
    }
    return false; // let the built-in server stream it
}

/* --------------------------------------------------------- API endpoints */
if (preg_match('#^/api/([A-Za-z0-9/_-]+)\.php$#', $path, $matches)) {
    $script = $root . '/api/' . $matches[1] . '.php';

    if (is_file($script)) {
        // Serve the endpoint from its own directory so relative includes and
        // upload paths resolve the same way they do under Apache.
        chdir(dirname($script));
        require $script;
        return true;
    }

    http_response_code(404);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'status'  => 'error',
        'message' => 'Unknown API endpoint: /api/' . $matches[1] . '.php',
    ]);
    return true;
}

/* ------------------------------------------------- SPA fallback to index */
$index = $root . '/index.html';
if (is_file($index)) {
    // A missing file under /uploads/ is a 404, not the application shell.
    //
    // Replacing a profile picture deletes the file the old URL pointed at, so
    // this is not a hypothetical path: every avatar change leaves one broken
    // image URL behind. Answering it with 200 and a page of HTML makes an
    // <img> report success while rendering a browser error page, and it means a
    // client checking only the status code cannot tell a real image from a
    // 200-shaped hole. Under Apache the same request gets a real 404 for free;
    // this only exists because the built-in server has no such fallback.
    if (preg_match('#^/uploads/#i', $path)) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=UTF-8');
        echo 'Not found';
        return true;
    }

    header('Content-Type: text/html; charset=UTF-8');
    readfile($index);
    return true;
}

http_response_code(404);
echo 'Not found';
return true;
