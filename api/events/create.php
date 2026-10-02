<?php
/**
 * api/events/create.php
 *
 * POST /api/events/create.php
 *
 * Body: { title, description?, location?, event_date, end_date?, image? }
 *
 * `event_date` / `end_date` accept "Y-m-d", "Y-m-d H:i" or "Y-m-d\TH:i" and are
 * stored as UTC wall time, matching how the seeded rows and the public
 * formatter (gmdate) treat the column. `image` accepts a data URI or remote URL.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$input = ulink_input();

$title = trim(ulink_input_str($input, 'title'));
if (mb_strlen($title) < 3) {
    ulink_fail('Give your event a title of at least 3 characters.', 422);
}
$title = ulink_plain_text($title, 200);

$description = ulink_plain_text(ulink_input_str($input, 'description'), 2000);
$location    = ulink_plain_text(ulink_input_str($input, 'location'), 200);
$image       = ulink_store_entity_image($input['image'] ?? null, 'events');

$tz = new DateTimeZone('UTC');
$parse = static function (string $raw) use ($tz): ?DateTimeImmutable {
    $raw = trim($raw);
    if ($raw === '') {
        return null;
    }
    foreach (['Y-m-d\TH:i:s', 'Y-m-d\TH:i', 'Y-m-d H:i:s', 'Y-m-d H:i', 'Y-m-d'] as $format) {
        $dt = DateTimeImmutable::createFromFormat('!' . $format, $raw, $tz);
        if ($dt !== false) {
            return $dt;
        }
    }
    $ts = strtotime($raw);
    return $ts === false ? null : (new DateTimeImmutable('@' . $ts))->setTimezone($tz);
};

$start = $parse(ulink_input_str($input, 'event_date'));
if ($start === null) {
    ulink_fail('Pick a valid date and time for the event.', 422);
}

$end = $parse(ulink_input_str($input, 'end_date'));
if ($end !== null && $end < $start) {
    $end = null;
}

try {
    $eventId = Database::insert('events', [
        'title'       => $title,
        'description' => $description,
        'location'    => $location,
        'image_url'   => $image,
        'event_date'  => $start->format('Y-m-d H:i:s'),
        'end_date'    => $end?->format('Y-m-d H:i:s'),
    ]);
} catch (DatabaseException $e) {
    ulink_log_error('Event create failed: ' . $e->getMessage(), $e);
    if ($image !== null && str_starts_with($image, 'uploads/')) {
        ulink_delete_upload($image);
    }
    ulink_fail('Could not create the event right now. Please try again.', 503);
}

ulink_log_activity('event_created', ['event_id' => $eventId], $userId);

$row = Database::fetchOne(
    'SELECT e.id, e.title, e.description, e.location, e.image_url, e.event_date, e.end_date, e.created_at,
            (SELECT COUNT(*) FROM event_interest ei2
                  WHERE ei2.event_id = e.id AND ei2.status = \'interested\') AS interested_count,
            ei.status AS my_status
       FROM events e
       LEFT JOIN event_interest ei ON ei.event_id = e.id AND ei.user_id = :me
      WHERE e.id = :id
      LIMIT 1',
    ['me' => $userId, 'id' => $eventId]
);

ulink_ok([
    'message' => 'Event created.',
    'event'   => ulink_event_public($row ?? []),
], 201);
