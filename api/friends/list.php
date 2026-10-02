<?php
/**
 * api/friends/list.php
 *
 * GET /api/friends/list.php
 *
 * Returns the accepted friend list plus incoming and outgoing requests in a
 * single response, which is what the Friends view needs to render.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$friends   = ulink_friend_list($userId);
$incoming  = ulink_incoming_requests($userId);
$outgoing  = ulink_outgoing_requests($userId);

ulink_ok([
    'friends'   => $friends,
    'requests'  => $incoming,
    'incoming'  => $incoming,
    'sent'      => $outgoing,
    'outgoing'  => $outgoing,
    'counts'    => [
        'friends'  => count($friends),
        'requests' => count($incoming),
    ],
]);
