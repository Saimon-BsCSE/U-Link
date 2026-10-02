<?php
/**
 * api/messages/attachment.php
 *
 * GET /api/messages/attachment.php?id=<message id>
 *
 * Streams a message attachment to one of its two participants.
 *
 * The stored file name is a 32-character random hex string, so it is not really
 * guessable - but "not guessable" is not "not readable". Anything that has ever
 * seen a URL can keep it, and the uploads directory is served by the web
 * server directly, so a URL that leaks once stays leaked forever. Routing every
 * read through this endpoint means access is re-checked on each request and the
 * server path is never published.
 *
 * Disposition is chosen by the stored type rather than by anything the client
 * sends:
 *
 *   images  inline, with the sniffed image mime type. Only the four raster
 *           formats ulink_save_upload()/ulink_image_type_from_binary() accept
 *           ever get here, so this cannot be turned into markup.
 *   files   attachment, which forces a download and means the browser never
 *           renders the body in the site's origin. Combined with
 *           X-Content-Type-Options: nosniff this closes stored XSS through an
 *           uploaded document.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$me      = ulink_require_auth();
$userId  = (int) $me['id'];
$messageId = ulink_query_int('id');

if ($messageId === null || $messageId <= 0) {
    ulink_fail('Attachment not found.', 404);
}

$row = Database::fetchOne(
    'SELECT sender_id, receiver_id, attachment_type, attachment_name,
            attachment_path, attachment_mime, attachment_size
       FROM messages
      WHERE id = :id AND attachment_path IS NOT NULL
      LIMIT 1',
    ['id' => $messageId]
);

if ($row === null) {
    ulink_fail('Attachment not found.', 404);
}

// The whole point of this endpoint: only the two people in the thread.
if ((int) $row['sender_id'] !== $userId && (int) $row['receiver_id'] !== $userId) {
    // 404 rather than 403 so the endpoint does not confirm that a given
    // message id exists to somebody who has no business knowing.
    ulink_fail('Attachment not found.', 404);
}

$relative = (string) $row['attachment_path'];

// Resolve and confirm the file is still inside the uploads tree. The path came
// from our own database, but a containment check costs nothing and this is the
// one place that turns a stored string into a file read.
if (strpos($relative, 'uploads/') !== 0 || strpos($relative, '..') !== false) {
    ulink_log_error('Refusing attachment with unexpected path: ' . $relative);
    ulink_fail('Attachment not found.', 404);
}

$realBase = realpath(ULINK_UPLOAD_PATH);
$realFile = realpath(ULINK_BASE_PATH . '/' . $relative);

if ($realBase === false || $realFile === false || !is_file($realFile)) {
    ulink_fail('Attachment not found.', 404);
}

if (strpos($realFile, $realBase . DIRECTORY_SEPARATOR) !== 0) {
    ulink_log_error('Refusing attachment outside the uploads directory: ' . $realFile);
    ulink_fail('Attachment not found.', 404);
}

$isImage = ((string) $row['attachment_type']) === 'image';

// Re-derive the mime type from the bytes rather than trusting the column, so a
// column that was tampered with cannot make the browser sniff its way to script
// execution. The stored value is only used when the sniff is inconclusive.
$mime = (string) $row['attachment_mime'];

if ($isImage) {
    $sniffed = ulink_image_type_from_binary((string) @file_get_contents($realFile));
    if ($sniffed !== null) {
        $mime = $sniffed['mime'];
    } elseif (!in_array($mime, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], true)) {
        // Not a recognised image and the stored type is not one either: fall
        // back to a download so nothing is rendered inline.
        $isImage = false;
    }
}

if ($isImage) {
    $mime = $mime !== '' ? $mime : 'application/octet-stream';
} else {
    // Force a download and never advertise a content type the browser could
    // render. application/octet-stream is inert everywhere.
    $mime = 'application/octet-stream';
}

$filename = ulink_attachment_label((string) $row['attachment_name'], basename($realFile));

// RFC 5987: the label is UTF-8 and may contain characters an HTTP header
// cannot carry literally.
$ascii = preg_replace('/[^\x20-\x7E]/', '_', $filename) ?? 'attachment';
$ascii = str_replace(['"', '\\'], '_', $ascii);

$size = @filesize($realFile);

header('Content-Type: ' . $mime);
header('Content-Length: ' . ($size === false ? 0 : $size));
header(
    'Content-Disposition: ' . ($isImage ? 'inline' : 'attachment')
    . '; filename="' . $ascii . '"'
    . "; filename*=UTF-8''" . rawurlencode($filename)
);
// Without this a browser may ignore the Content-Type above and sniff the body,
// which is how an uploaded .txt containing HTML becomes script on this origin.
header('X-Content-Type-Options: nosniff');
header('Content-Security-Policy: default-src \'none\'; sandbox');
header('Cache-Control: private, max-age=3600');
// Uploads are user content; never let a browser second-guess the type.
header('Cross-Origin-Resource-Policy: same-origin');

while (ob_get_level() > 0) {
    ob_end_clean();
}

readfile($realFile);
