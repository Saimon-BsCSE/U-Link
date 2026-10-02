<?php
/**
 * api/posts/create.php
 *
 * POST /api/posts/create.php
 *
 * Body: { text, image?, community_id? }
 *
 * The author is always taken from the session. The original endpoint accepted a
 * `userId` field from the request body, so anyone could post as any account.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$input = ulink_input();

$content    = ulink_plain_text(ulink_input_str($input, 'text'), ULINK_POST_MAX_CHARS);
$rawImage   = $input['image'] ?? null;
// `community_id` is the documented key, but every other community endpoint in
// the app reads `communityId`, and silently posting to the wrong place because
// of a snake_case slip is worse than accepting both. Same treatment as
// messages/send.php's `text` / `message` alias.
$communityId = ulink_input_int($input, 'community_id');
if ($communityId === null) {
    $communityId = ulink_input_int($input, 'communityId');
}

if (ulink_input_str($input, 'text') === '' && (!is_string($rawImage) || trim($rawImage) === '')) {
    ulink_fail('Write something or attach a photo before posting.', 422);
}

// Reject an over-long body rather than silently truncating the user's words.
$rawText = is_string($input['text'] ?? null) ? trim($input['text']) : '';
if (mb_strlen($rawText) > ULINK_POST_MAX_CHARS) {
    ulink_fail('Posts are limited to ' . ULINK_POST_MAX_CHARS . ' characters.', 422);
}

// Posting into a community requires membership.
ulink_require_community_membership($communityId, $userId);
$communityId = ($communityId !== null && (int) $communityId > 0) ? (int) $communityId : null;

/* ------------------------------------------------------------------ *
 | Image
 | ------------------------------------------------------------------ */

$imageUrl = null;

if (is_string($rawImage) && trim($rawImage) !== '') {
    $trimmed = trim($rawImage);

    if (ulink_split_data_uri($trimmed) !== null) {
        $imageUrl = ulink_save_upload($trimmed, 'posts', ULINK_UPLOAD_MAX_BYTES);
        if ($imageUrl === null) {
            ulink_fail('That image could not be processed. Use a JPG, PNG, GIF or WEBP under 5 MB.', 422);
        }
    } elseif (ulink_is_remote_url($trimmed)) {
        $imageUrl = $trimmed;
    } else {
        ulink_fail('Unsupported image. Upload a file or paste an image link.', 422);
    }
}

/* ------------------------------------------------------------------ *
 | Insert
 | ------------------------------------------------------------------ */

try {
    $postId = Database::insert('posts', [
        'user_id'      => $userId,
        'community_id' => $communityId,
        'content'      => $content !== '' ? $content : '(photo)',
        'image_url'    => $imageUrl,
        'visibility'   => 'public',
    ]);
} catch (DatabaseConstraintException $e) {
    if ($imageUrl !== null && str_starts_with($imageUrl, 'uploads/')) {
        ulink_delete_upload($imageUrl);
    }
    ulink_fail('Could not publish the post. Please try again.', 409);
} catch (DatabaseException $e) {
    ulink_log_error('Post insert failed: ' . $e->getMessage(), $e);
    if ($imageUrl !== null && str_starts_with($imageUrl, 'uploads/')) {
        ulink_delete_upload($imageUrl);
    }
    ulink_fail('Could not publish the post right now. Please try again.', 503);
}

ulink_log_activity('post_created', [
    'post_id'     => $postId,
    'community_id'=> $communityId,
    'has_image'   => $imageUrl !== null,
    'length'      => mb_strlen($content),
], $userId);

/*
 * Return the post in exactly the shape createPostHTML() expects, including the
 * author fields. The original response omitted name/pic, so a newly created
 * post rendered with "Unknown" as the author until the next feed refresh.
 */
$name = (string) $me['full_name'];

ulink_ok([
    'message' => 'Post created.',
    'post'    => [
        'id'           => $postId,
        'userId'       => $userId,
        'name'         => $name,
        'pic'          => ulink_avatar_url($me['profile_pic'], $name),
        'dept'         => $me['department'],
        'batch'        => $me['batch'],
        'role'         => ucfirst((string) ($me['role'] ?? 'student')),
        'text'         => $content,
        'image'        => $imageUrl,
        'communityId'  => $communityId,
        'likes'        => 0,
        'comments'     => 0,
        'liked'        => false,
        'created_at'   => gmdate('Y-m-d H:i:s'),
        'commentsList' => [],
    ],
], 201);
