<?php
/**
 * api/messages/send.php
 *
 * POST /api/messages/send.php
 *
 * Body, either:
 *   JSON      { userId, text }
 *   multipart userId, text, attachment=<file>
 *
 * A message needs text, an attachment, or both - an empty composer with a
 * picture attached is a normal thing to send, so neither field is required on
 * its own.
 *
 * multipart is supported because the JSON path would mean base64 for every
 * file, which inflates a 10 MB upload by a third and buffers it in memory twice.
 * ulink_input() falls back to $_POST, so the field names are the same either
 * way and existing JSON clients keep working unchanged.
 *
 * The recipient must be an existing user. The previous behaviour of the
 * frontend was to answer itself with a canned bot reply from the browser; that
 * simulation is replaced by a real stored message, and the auto-reply is kept
 * client side as a demo courtesy.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$input  = ulink_input();
$peerId = ulink_input_int($input, 'userId');

// `text` is the documented key (it matches posts/create.php); `message` is
// accepted as an alias because that is the name the response uses and the one
// people reach for first.
$rawMessage = $input['text'] ?? ($input['message'] ?? '');
$text   = ulink_plain_text(is_scalar($rawMessage) ? (string) $rawMessage : '', ULINK_MESSAGE_MAX_CHARS);

/*
 * -------------------------------------------------------------------------
 * Attachment
 *
 * Validated and stored before the row is written so a rejected file never
 * produces a message. The upload is rolled back if the insert then fails.
 * ---------------------------------------------------------------------- */

$attachment = null;
$upload     = $_FILES['attachment'] ?? null;

if (is_array($upload) && (int) ($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $attachment = ulink_save_attachment($upload, 'messages');

    if ($attachment === null) {
        // ulink_save_attachment() logs the specific reason; the client gets a
        // message it can act on.
        ulink_fail(
            'That file could not be attached. Send a JPG, PNG, GIF or WebP picture, '
            . 'or a PDF, Word, Excel, PowerPoint, text, CSV, JSON or ZIP document.',
            422
        );
    }
}

if ($peerId === null || $peerId <= 0) {
    ulink_fail('Choose someone to send this to.', 422);
}
if ($peerId === $userId) {
    ulink_fail('You cannot message yourself.', 422);
}

// Text is optional now that a message can carry an attachment instead, so the
// "type something" check only applies when there is no file.
if ($text === '' && $attachment === null) {
    ulink_fail('Type a message or attach a file before sending.', 422);
}

$rawText = is_string($rawMessage) ? trim($rawMessage) : '';
if (mb_strlen($rawText) > ULINK_MESSAGE_MAX_CHARS) {
    ulink_fail('Messages are limited to ' . ULINK_MESSAGE_MAX_CHARS . ' characters.', 422);
}

if (!ulink_user_exists($peerId)) {
    // The file was already written. Do not leave it behind for a message that
    // will never exist.
    if ($attachment !== null) {
        ulink_delete_upload($attachment['path']);
    }
    ulink_fail('User not found.', 404);
}

// Blocking has to stop delivery, not just friend requests: this endpoint had no
// block check at all, so "refuse all further contact" stopped at the friends
// screen while direct messages kept arriving.
if (ulink_is_blocked($peerId, $userId)) {
    if ($attachment !== null) {
        ulink_delete_upload($attachment['path']);
    }
    ulink_fail('This user is not accepting messages.', 403);
}

// `message_privacy` is the recipient's choice, so it is looked up on the peer,
// not the sender. "friends" means accepted connections only.
$privacy = (string) ulink_user_setting($peerId, 'message_privacy', 'everyone');
if ($privacy === 'friends' && !ulink_are_friends($peerId, $userId)) {
    if ($attachment !== null) {
        ulink_delete_upload($attachment['path']);
    }
    ulink_fail('This user only accepts messages from their connections.', 403);
}

$row = [
    'sender_id'   => $userId,
    'receiver_id' => $peerId,
    'message'     => $text,
    'is_read'     => 0,
];

if ($attachment !== null) {
    $row['attachment_type'] = $attachment['type'];
    $row['attachment_name'] = $attachment['name'];
    $row['attachment_path'] = $attachment['path'];
    $row['attachment_mime'] = $attachment['mime'];
    $row['attachment_size'] = $attachment['size'];
}

try {
    $messageId = Database::insert('messages', $row);
} catch (Throwable $e) {
    // Without this the bytes survive a message that was never stored, and
    // nothing ever points at them again.
    if ($attachment !== null) {
        ulink_delete_upload($attachment['path']);
    }
    ulink_log_error('Failed to store message', $e);
    ulink_fail('Could not send your message. Please try again.', 500);
}

ulink_log_activity('message_sent', [
    'to_user_id' => $peerId,
    'length'     => mb_strlen($text),
    'attachment' => $attachment !== null ? $attachment['type'] : null,
], $userId);

$saved = Database::fetchOne(
    'SELECT id, sender_id, receiver_id, message, is_read, created_at,
            attachment_type, attachment_name, attachment_path,
            attachment_mime, attachment_size
       FROM messages WHERE id = :id LIMIT 1',
    ['id' => $messageId]
);

ulink_ok([
    'message' => ulink_message_public($saved ?? [], $userId),
    'unread'  => ulink_unread_message_count($peerId),
], 201);
