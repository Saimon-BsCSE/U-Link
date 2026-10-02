<?php
/**
 * api/users/update.php
 *
 * POST /api/users/update.php
 *
 * Body: { name?, bio?, department?, batch?, profile_pic?, cover_pic? }
 *
 * Security fix: the original endpoint read `userId` from the request body when
 * no session existed, and used it even when one did. Any visitor could rewrite
 * any account's name, bio and avatar. The target is now always the session user.
 *
 * Response keeps `profile_pic` at the top level because updateProfilePic() in
 * the frontend reads `result.profile_pic` directly.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$input = ulink_input();

$updates = [];
$changed = [];

/* ------------------------------------------------------------------ *
 | Text fields
 | ------------------------------------------------------------------ */

if (array_key_exists('name', $input)) {
    $name = ulink_plain_text(ulink_input_str($input, 'name'), ULINK_MAX_NAME_LENGTH);
    if ($name === '') {
        ulink_fail('Name cannot be empty.', 422, ['field' => 'name']);
    }
    if (mb_strlen($name) < 2) {
        ulink_fail('Name must be at least 2 characters.', 422, ['field' => 'name']);
    }
    if ($name !== $me['full_name']) {
        $updates['full_name'] = $name;
        $changed[] = 'name';
    }
}

if (array_key_exists('bio', $input)) {
    // An empty string is a legitimate value here: it clears the bio. The
    // original code turned null into "no valid data to update" and could never
    // clear a field.
    $bio = ulink_plain_text(ulink_input_str($input, 'bio'), ULINK_BIO_MAX_CHARS);
    if ($bio !== (string) ($me['bio'] ?? '')) {
        $updates['bio'] = $bio;
        $changed[] = 'bio';
    }
}

if (array_key_exists('headline', $input)) {
    $headline = ulink_plain_text(ulink_input_str($input, 'headline'), 160);
    if ($headline !== (string) ($me['headline'] ?? '')) {
        $updates['headline'] = $headline !== '' ? $headline : null;
        $changed[] = 'headline';
    }
}

if (array_key_exists('location', $input)) {
    $location = ulink_plain_text(ulink_input_str($input, 'location'), 120);
    if ($location !== (string) ($me['location'] ?? '')) {
        $updates['location'] = $location !== '' ? $location : null;
        $changed[] = 'location';
    }
}

if (array_key_exists('website', $input)) {
    $website = trim(ulink_input_str($input, 'website'));

    if ($website === '') {
        $website = null;
    } else {
        // Accept "example.com" as well as a full URL and store an absolute
        // http(s) address. A scheme that is not web-safe (javascript:, data:)
        // is rejected outright rather than stored and sanitised on render.
        if (preg_match('~^[a-z][a-z0-9+.-]*://~i', $website) !== 1) {
            $website = 'https://' . $website;
        }
        $scheme = strtolower((string) parse_url($website, PHP_URL_SCHEME));
        if (filter_var($website, FILTER_VALIDATE_URL) === false
            || !in_array($scheme, ['http', 'https'], true)
            || parse_url($website, PHP_URL_HOST) === null
        ) {
            ulink_fail(
                'Enter a valid website address, for example https://example.com.',
                422,
                ['field' => 'website']
            );
        }
        $website = mb_substr($website, 0, 255);
    }

    if ((string) ($website ?? '') !== (string) ($me['website'] ?? '')) {
        $updates['website'] = $website;
        $changed[] = 'website';
    }
}

if (array_key_exists('interests', $input)) {
    // A short, normalised tag list: split on commas, drop blanks and
    // duplicates, and cap both the count and each tag so the chips stay
    // readable. Stored as a plain comma-joined string.
    $tags = [];
    foreach (explode(',', ulink_input_str($input, 'interests')) as $tag) {
        $tag = ulink_plain_text(trim($tag), 30);
        if ($tag === '' || in_array($tag, $tags, true)) {
            continue;
        }
        $tags[] = $tag;
        if (count($tags) === 5) {
            break;
        }
    }
    $interests = $tags === [] ? null : implode(', ', $tags);

    if ((string) ($interests ?? '') !== (string) ($me['interests'] ?? '')) {
        $updates['interests'] = $interests;
        $changed[] = 'interests';
    }
}

if (array_key_exists('department', $input)) {
    $department = ulink_plain_text(ulink_input_str($input, 'department'), 100);
    if ($department !== (string) ($me['department'] ?? '')) {
        $updates['department'] = $department !== '' ? $department : null;
        $changed[] = 'department';
    }
}

if (array_key_exists('batch', $input)) {
    $batch = ulink_plain_text(ulink_input_str($input, 'batch'), 20);
    if ($batch !== (string) ($me['batch'] ?? '')) {
        $updates['batch'] = $batch !== '' ? $batch : null;
        $changed[] = 'batch';
    }
}

/* ------------------------------------------------------------------ *
 | Images
 | ------------------------------------------------------------------ */

$replacedImages = [];

foreach (['profile_pic', 'cover_pic'] as $field) {
    // Two transports for the same field: a base64 data URI in JSON, and a real
    // multipart upload. Previously only the first was handled, and the
    // is_string() test below silently skipped the second - so a multipart
    // client got 200 "Nothing to update." and no picture.
    $upload = $_FILES[$field] ?? null;
    $isUpload = is_array($upload)
        && (int) ($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;

    if (!$isUpload && !array_key_exists($field, $input)) {
        continue;
    }

    $subdir = $field === 'profile_pic' ? 'profiles' : 'covers';
    $maxBytes = $field === 'profile_pic' ? 2 * 1024 * 1024 : ULINK_UPLOAD_MAX_BYTES;

    $saved = $isUpload
        ? ulink_save_profile_image($upload, $subdir)
        : (is_string($input[$field]) && trim($input[$field]) !== ''
            ? ulink_save_upload($input[$field], $subdir, $maxBytes)
            : null);

    if ($saved === null) {
        ulink_fail(
            // Parenthesised on purpose: `.` binds tighter than `?:`, so the
            // unparenthesised version concatenated first and then picked a
            // branch - the cover error message was the bare string 'Cover
            // photo' with no explanation at all.
            ($field === 'profile_pic' ? 'Profile picture' : 'Cover photo')
                . ' could not be processed. Use a JPG, PNG, GIF or WEBP image.',
            422,
            ['field' => $field]
        );
    }

    // Replace the file only once the new one is safely on disk.
    $previous = $me[$field] ?? null;
    $updates[$field] = $saved;
    $changed[] = $field;
    $replacedImages[$field] = $previous;
}

/* ------------------------------------------------------------------ *
 | Persist
 * ------------------------------------------------------------------ */

if ($updates === []) {
    // Nothing matched, but the client may still be waiting for the current
    // avatar path (e.g. it re-sent an identical picture). Return success with
    // the stored values instead of a confusing 400.
    $public = ulink_user_public($me, true);
    ulink_ok([
        'message'     => 'Nothing to update.',
        'user'        => $public,
        'profile_pic' => $public['profile_pic'],
        'cover_pic'   => $public['cover_pic'],
    ]);
}

try {
    Database::update('users', $updates, $userId);
} catch (DatabaseException $e) {
    ulink_log_error('Profile update failed: ' . $e->getMessage(), $e);
    ulink_fail('Could not save your profile. Please try again.', 503);
}

// Only drop the old files once the update committed.
foreach ($replacedImages as $field => $previous) {
    if (is_string($previous) && str_starts_with($previous, 'uploads/')) {
        ulink_delete_upload($previous);
    }
}

ulink_log_activity('profile_updated', ['fields' => $changed], $userId);

$fresh = Database::fetchOne(
    'SELECT id, student_id, full_name, email, profile_pic, cover_pic, department, batch,
            bio, headline, location, website, interests, role, created_at
       FROM users WHERE id = :id LIMIT 1',
    ['id' => $userId]
);

$public = ulink_user_public($fresh ?? $me, true);

ulink_ok([
    'message'     => 'Profile updated.',
    'user'        => $public,
    'name'        => $public['name'],
    'bio'         => $public['bio'],
    'updated'     => $changed,
    // Kept at the top level for updateProfilePic() in ulink_script.js.
    'profile_pic' => $public['profile_pic'],
    'cover_pic'   => $public['cover_pic'],
]);
