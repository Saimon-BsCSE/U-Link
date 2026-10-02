<?php
/**
 * api/events/rsvp.php
 *
 * POST /api/events/rsvp.php
 *
 * Body: { eventId, interested: true|false|null }
 *
 * interested: true  -> going
 *           false -> not going
 *           null / "clear" -> remove the response
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('POST');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$input     = ulink_input();
$eventId   = ulink_input_int($input, 'eventId');
$action    = strtolower(ulink_input_str($input, 'action', 'set'));
$interested = array_key_exists('interested', $input) ? $input['interested'] : null;

if ($eventId === null || $eventId <= 0) {
    ulink_fail('A valid event id is required.', 422);
}

$event = Database::fetchOne(
    'SELECT id, title FROM events WHERE id = :id LIMIT 1',
    ['id' => $eventId]
);

if ($event === null) {
    ulink_fail('Event not found.', 404);
}

// Normalise the three possible request shapes into a single tri-state.
//
// Every spelling of "no response" has to be caught *before* the boolean
// coercion below, because that coercion maps every unrecognised string to
// false. The string "clear" was missing from this list, so the documented
// `{"interested": "clear"}` form recorded a decline and kept the row - the
// exact opposite of what the caller asked for, and indistinguishable from a
// deliberate "not going" in the response. The SPA never hit it because it
// passes `action: 'clear'` instead, which is why it survived.
$clear = in_array($action, ['clear', 'remove', 'reset'], true)
    || $interested === null
    || $interested === ''
    || (is_string($interested)
        && in_array(strtolower($interested), ['null', 'clear', 'remove', 'reset', 'none'], true));

if (!$clear) {
    if (is_string($interested)) {
        $interested = in_array(strtolower($interested), ['1', 'true', 'yes', 'interested'], true);
    } else {
        $interested = (bool) $interested;
    }
}

if ($clear) {
    Database::run(
        'DELETE FROM event_interest WHERE event_id = :e AND user_id = :u',
        ['e' => $eventId, 'u' => $userId]
    );
    $status = null;
} else {
    $status = $interested ? 'interested' : 'not_interested';
    Database::run(
        'INSERT INTO event_interest (event_id, user_id, status) VALUES (:e, :u, :s)
         ON DUPLICATE KEY UPDATE status = VALUES(status)',
        ['e' => $eventId, 'u' => $userId, 's' => $status]
    );
}

ulink_log_activity('event_rsvp', [
    'event_id' => $eventId,
    'status'   => $status,
], $userId);

ulink_ok([
    'message'   => $status === null
        ? 'Your response has been cleared.'
        : ($status === 'interested' ? 'See you there!' : 'Response recorded.'),
    'eventId'   => $eventId,
    // Tri-state: true = going, false = declined, null = cleared.
    'interested'=> $status === 'interested' ? true : ($status === 'not_interested' ? false : null),
    // Named `rsvp_status`, not `status`: `status` is the response envelope and
    // ulink_ok() drops a payload key that would collide with it.
    'rsvp_status' => $status,
    // The authoritative total, so the client stops guessing it from the row
    // insert/delete. With the count now restricted to status = 'interested',
    // switching between going and not-going changes it by 1 - which the old
    // arithmetic got wrong - while clearing a response changes it by 1 only if
    // the person was going.
    'interested_count' => (int) Database::fetchValue(
        "SELECT COUNT(*) FROM event_interest WHERE event_id = :e AND status = 'interested'",
        ['e' => $eventId]
    ),
]);
