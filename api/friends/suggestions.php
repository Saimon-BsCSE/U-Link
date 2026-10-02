<?php
/**
 * api/friends/suggestions.php
 *
 * GET /api/friends/suggestions.php?limit=12
 *
 * Backs the "People you may know" rail.
 */

require_once __DIR__ . '/../../config/bootstrap.php';

ulink_require_method('GET');

$me = ulink_require_auth();
$userId = (int) $me['id'];

$limit = ulink_pagination(ulink_query_int('limit', 12), 0, 50)['limit'];

$suggestions = ulink_friend_suggestions($userId, $limit);

ulink_ok([
    'suggestions' => $suggestions,
    'pymk'       => $suggestions,
    'count'      => count($suggestions),
]);
