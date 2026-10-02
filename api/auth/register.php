<?php
/**
 * api/auth/register.php
 *
 * POST /api/auth/register.php
 *
 * Body: { name, email, password, student_id?, department?, batch?, profile_pic? }
 *   profile_pic may be a base64 data URI.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$input = ulink_input();

$name       = ulink_plain_text(ulink_input_str($input, 'name'), ULINK_MAX_NAME_LENGTH);
$email      = ulink_plain_text(ulink_input_str($input, 'email'), 190);
$password   = (string) ($input['password'] ?? '');
$studentId  = ulink_plain_text(ulink_input_str($input, 'student_id'), ULINK_MAX_STUDENT_ID_LENGTH);
$department = ulink_plain_text(ulink_input_str($input, 'department'), 100);
$batch      = ulink_plain_text(ulink_input_str($input, 'batch'), 20);

/* ------------------------------------------------------------------ *
 | Validation
 | ------------------------------------------------------------------ */

if ($name === '') {
    ulink_fail('Full name is required.', 422, ['field' => 'name']);
}
if (mb_strlen($name) < 2) {
    ulink_fail('Full name must be at least 2 characters.', 422, ['field' => 'name']);
}

if ($email === '') {
    ulink_fail('Email address is required.', 422, ['field' => 'email']);
}
if (!ulink_is_email($email)) {
    ulink_fail('Enter a valid email address.', 422, ['field' => 'email']);
}
$email = strtolower($email);

if ($password === '') {
    ulink_fail('Password is required.', 422, ['field' => 'password']);
}
if (($problem = ulink_password_problem($password)) !== null) {
    ulink_fail($problem, 422, ['field' => 'password']);
}

if ($studentId !== '' && !preg_match('/^[A-Za-z0-9\-]+$/', $studentId)) {
    ulink_fail('Student ID may only contain letters, numbers and hyphens.', 422, ['field' => 'student_id']);
}
if (strlen($studentId) > ULINK_MAX_STUDENT_ID_LENGTH) {
    ulink_fail('Student ID is too long.', 422, ['field' => 'student_id']);
}

// Optional fields must be NULL rather than '' so the UNIQUE index on
// student_id does not collide between users who left it blank. MySQL treats
// every '' as the same value, which made the second blank registration fail.
$studentId = $studentId !== '' ? $studentId : null;
$department = $department !== '' ? $department : null;
$batch = $batch !== '' ? $batch : null;

/* ------------------------------------------------------------------ *
 | Uniqueness
 | ------------------------------------------------------------------ */

if (Database::fetchValue('SELECT id FROM users WHERE email = :email LIMIT 1', ['email' => $email]) !== null) {
    ulink_fail('An account with this email already exists.', 409, ['field' => 'email']);
}

if ($studentId !== null
    && Database::fetchValue('SELECT id FROM users WHERE student_id = :sid LIMIT 1', ['sid' => $studentId]) !== null) {
    ulink_fail('An account with this student ID already exists.', 409, ['field' => 'student_id']);
}

/* ------------------------------------------------------------------ *
 | Avatar
 | ------------------------------------------------------------------ */

$profilePic = null;
$rawPic = $input['profile_pic'] ?? null;
if (is_string($rawPic) && trim($rawPic) !== '') {
    $profilePic = ulink_save_upload($rawPic, 'profiles', 2 * 1024 * 1024);
    if ($profilePic === null) {
        ulink_fail('Profile picture could not be processed. Use a JPG, PNG, GIF or WEBP image.', 422, ['field' => 'profile_pic']);
    }
}

/* ------------------------------------------------------------------ *
 | Create
 | ------------------------------------------------------------------ */

try {
    $userId = Database::insert('users', [
        'student_id'    => $studentId,
        'full_name'     => $name,
        'email'         => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'profile_pic'   => $profilePic,
        'department'    => $department,
        'batch'         => $batch,
        'role'          => 'student',
        'is_active'     => 1,
    ]);
} catch (DatabaseConstraintException $e) {
    // Lost a race against a concurrent registration.
    if ($profilePic !== null) {
        ulink_delete_upload($profilePic);
    }
    ulink_fail('An account with those details already exists.', 409);
} catch (DatabaseException $e) {
    ulink_log_error('Registration insert failed: ' . $e->getMessage(), $e);
    if ($profilePic !== null) {
        ulink_delete_upload($profilePic);
    }
    ulink_fail('Unable to create the account right now. Please try again.', 503);
}

ulink_log_activity('user_registered', [
    'student_id' => $studentId,
    'department' => $department,
], $userId);

$user = Database::fetchOne(
    'SELECT id, student_id, full_name, email, profile_pic, cover_pic, department, batch,
            bio, role, created_at
       FROM users WHERE id = :id LIMIT 1',
    ['id' => $userId]
);

ulink_ok([
    'message' => 'Registration successful. You can sign in now.',
    'user'    => ulink_user_public($user ?? [], true),
], 201);
