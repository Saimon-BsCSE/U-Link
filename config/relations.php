<?php
/**
 * config/relations.php
 *
 * Relationship helpers (friendships, notifications, communities, messages).
 *
 * These live in one place because the same rules have to hold across several
 * endpoints: a friendship is always stored with the lower user id in
 * user_id_1, notifications must never be self-addressed, and a community
 * membership is the single source of truth for "is this user a member".
 */

require_once __DIR__ . '/bootstrap.php';

/* -------------------------------------------------------------------------
 | Friendships
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_friendship_row')) {
    /**
     * Fetch the friendship between two users regardless of column order.
     *
     * @return array<string, mixed>|null
     */
    function ulink_friendship_row(int $userA, int $userB): ?array
    {
        $low = min($userA, $userB);
        $high = max($userA, $userB);

        return Database::fetchOne(
            'SELECT id, user_id_1, user_id_2, status, status_requested_by, created_at
               FROM friendships
              WHERE user_id_1 = :low AND user_id_2 = :high
              LIMIT 1',
            ['low' => $low, 'high' => $high]
        );
    }
}

if (!function_exists('ulink_friend_ids')) {
    /**
     * All accepted friend ids for a user.
     *
     * @return array<int, int>
     */
    function ulink_friend_ids(int $userId): array
    {
        $rows = Database::fetchAll(
            "SELECT CASE WHEN user_id_1 = :me THEN user_id_2 ELSE user_id_1 END AS friend_id
               FROM friendships
              WHERE (user_id_1 = :me2 OR user_id_2 = :me3) AND status = 'accepted'",
            ['me' => $userId, 'me2' => $userId, 'me3' => $userId]
        );

        return array_map(static fn($r) => (int) $r['friend_id'], $rows);
    }
}

if (!function_exists('ulink_friend_count')) {
    function ulink_friend_count(int $userId): int
    {
        return count(ulink_friend_ids($userId));
    }
}

if (!function_exists('ulink_are_friends')) {
    function ulink_are_friends(int $userA, int $userB): bool
    {
        $row = ulink_friendship_row($userA, $userB);
        return $row !== null && $row['status'] === 'accepted';
    }
}

if (!function_exists('ulink_user_exists')) {
    function ulink_user_exists(int $userId): bool
    {
        return Database::fetchValue('SELECT id FROM users WHERE id = :id LIMIT 1', ['id' => $userId]) !== null;
    }
}

if (!function_exists('ulink_user_name')) {
    function ulink_user_name(int $userId): string
    {
        $name = Database::fetchValue('SELECT full_name FROM users WHERE id = :id LIMIT 1', ['id' => $userId]);
        return is_string($name) && $name !== '' ? $name : 'Someone';
    }
}

if (!function_exists('ulink_is_blocked')) {
    /**
     * Has $blocker blocked $blocked?
     *
     * The block lives on the friendships row: status = 'blocked' with
     * `status_requested_by` naming the blocker. That column is the only thing
     * distinguishing the blocker from the blocked, because
     * `friendships.user_id_1` is stored low-id-first.
     *
     * @return bool
     */
    function ulink_is_blocked(int $blocker, int $blocked): bool
    {
        if ($blocker === $blocked) {
            return false;
        }

        $row = ulink_friendship_row($blocker, $blocked);

        return $row !== null
            && $row['status'] === 'blocked'
            && (int) ($row['status_requested_by'] ?? 0) === $blocker;
    }
}

if (!function_exists('ulink_send_friend_request')) {
    /**
     * Create or refresh a pending friend request.
     *
     * @return array{status: string, friendship_id: int, message: string}
     */
    function ulink_send_friend_request(int $fromId, int $toId): array
    {
        $low = min($fromId, $toId);
        $high = max($fromId, $toId);

        $existing = ulink_friendship_row($fromId, $toId);

        if ($existing !== null) {
            switch ($existing['status']) {
                case 'blocked':
                    // `blocked` used to fall through the switch entirely: the
                    // row stayed blocked, the request still answered 201 with
                    // "Friend request sent.", and a fresh `request`
                    // notification landed in the blocker's inbox where accept,
                    // reject and cancel all 409. The feature looked live and
                    // protected nobody.
                    if ((int) ($existing['status_requested_by'] ?? 0) === $fromId) {
                        // They blocked us. Do not confirm the block exists.
                        return [
                            'status'        => 'blocked',
                            'friendship_id' => (int) $existing['id'],
                            'message'       => 'This user is not accepting friend requests.',
                        ];
                    }

                    return [
                        'status'        => 'blocked',
                        'friendship_id' => (int) $existing['id'],
                        'message'       => 'You cannot send friend requests to this user.',
                    ];

                    // no break
                case 'accepted':
                    return [
                        'status'        => 'already_friends',
                        'friendship_id' => (int) $existing['id'],
                        'message'       => 'You are already connected.',
                    ];
                case 'pending':
                    // They already asked; treat this as an accept so the UI can
                    // never end up with a request pointing at itself.
                    if ((int) $existing['status_requested_by'] === $toId) {
                        Database::update('friendships', [
                            'status'       => 'accepted',
                            'responded_at' => gmdate('Y-m-d H:i:s'),
                        ], (int) $existing['id']);
                        return [
                            'status'        => 'accepted',
                            'friendship_id' => (int) $existing['id'],
                            'message'       => 'Friend request accepted.',
                        ];
                    }
                    return [
                        'status'        => 'already_pending',
                        'friendship_id' => (int) $existing['id'],
                        'message'       => 'Friend request already sent.',
                    ];
                case 'declined':
                    // Re-open as a fresh request.
                    Database::update('friendships', [
                        'status'             => 'pending',
                        'status_requested_by' => $fromId,
                        'created_at'         => gmdate('Y-m-d H:i:s'),
                        'responded_at'       => null,
                    ], (int) $existing['id']);
                    break;
            }
        } else {
            $friendshipId = Database::insert('friendships', [
                'user_id_1'           => $low,
                'user_id_2'           => $high,
                'status'              => 'pending',
                'status_requested_by' => $fromId,
            ]);
            $existing = ['id' => $friendshipId];
        }

        $fromName = ulink_user_name($fromId);
        ulink_notify($toId, 'request', $fromName . ' sent you a friend request', $fromId, (int) $existing['id']);

        return [
            'status'        => 'pending',
            'friendship_id' => (int) $existing['id'],
            'message'       => 'Friend request sent.',
        ];
    }
}

if (!function_exists('ulink_event_public')) {
    /**
     * Shape one `events` row for the API.
     *
     * Both `api/events/list.php` and `api/bootstrap.php` call this: they used to
     * carry separate copies of the mapper and drifted, so the bootstrap payload
     * was missing `my_status` and `interested_count` and the frontend could not
     * tell whether an RSVP was already recorded.
     *
     * @param array<string, mixed> $row Row containing `event_date` and
     *                                   `my_status`, which both callers select.
     */
    function ulink_event_public(array $row): array
    {
        // strtotime/date pair on a UTC-written column: strtotime reads the
        // literal as UTC (matching how it is stored), but date() then formats it
        // in the server's local zone, which shifts the day and hour wherever
        // date.timezone is not UTC.
        $timestamp = strtotime((string) ($row['event_date'] ?? ''));
        $status    = $row['my_status'] ?? null;

        return [
            'id'          => (int) $row['id'],
            'title'       => (string) ($row['title'] ?? ''),
            'description' => (string) ($row['description'] ?? ''),
            // `desc` is what the renderer reads; keep both so either name works.
            'desc'        => (string) ($row['description'] ?? ''),
            'location'    => (string) ($row['location'] ?? ''),
            'img'         => $row['image_url'] ?? null,
            'image'       => $row['image_url'] ?? null,
            'date'        => $timestamp !== false ? gmdate('Y-m-d', $timestamp) : null,
            'month'       => $timestamp !== false ? gmdate('M', $timestamp) : null,
            'day'         => $timestamp !== false ? gmdate('j', $timestamp) : null,
            'time'        => $timestamp !== false ? gmdate('g:i A', $timestamp) : null,
            'event_date'  => $row['event_date'] ?? null,
            // Tri-state: true = going, false = declined, null = no response yet.
            'interested'  => $status === 'interested' ? true : ($status === 'not_interested' ? false : null),
            'my_status'   => $status,
            'interested_count' => (int) ($row['interested_count'] ?? 0),
        ];
    }
}

if (!function_exists('ulink_clear_friendship_notifications')) {
    /**
     * Drop every notification that only existed because of one friendship.
     *
     * Called when the friendship row itself is deleted (unfriend, unblock). If
     * these rows survive, the notification panel keeps telling somebody that a
     * friend request is waiting when nothing can act on it any more.
     *
     * @return int Number of rows removed.
     */
    function ulink_clear_friendship_notifications(int $userA, int $userB, ?int $friendshipId = null): int
    {
        $where = "type IN ('request', 'request_accepted')
                   AND ((user_id = :owner AND from_user_id = :peer)
                     OR (user_id = :peer_owner AND from_user_id = :peer_actor))";

        // This connection uses native prepares, which reject a named
        // placeholder that appears more than once ("Invalid parameter number"),
        // so the two directions get their own names even though they hold the
        // same two ids.
        $params = [
            'owner'      => $userA,
            'peer'       => $userB,
            'peer_owner' => $userB,
            'peer_actor' => $userA,
        ];

        // Narrow by friendship id when we have it, so unrelated notifications
        // between the same two people survive.
        if ($friendshipId !== null) {
            $where .= ' AND reference_id = :fid';
            $params['fid'] = $friendshipId;
        }

        return Database::run("DELETE FROM notifications WHERE {$where}", $params)->rowCount();
    }
}

if (!function_exists('ulink_incoming_requests')) {
    /**
     * Pending requests addressed to a user, with sender details.
     *
     * @return array<int, array<string, mixed>>
     */
    function ulink_incoming_requests(int $userId): array
    {
        // Incoming == the other side initiated it.
        $rows = Database::fetchAll(
            // `f.created_at` is aliased rather than left bare. Unaliased it lands
            // on the row under the name `created_at`, which is exactly the key
            // ulink_user_public() copies into the nested `user` object - so every
            // request row advertised the *time the request was sent* as the time
            // the account was created. Nothing reads it today, but it is wrong in
            // the payload and it is the same mistake that made conversation rows
            // report a message timestamp as an account creation date.
            "SELECT f.id AS friendship_id, f.created_at AS request_created_at,
                    u.id, u.student_id, u.full_name,
                    u.email, u.profile_pic, u.cover_pic, u.department, u.batch, u.bio, u.role,
                    u.last_seen_at
               FROM friendships f
               JOIN users u ON u.id = f.status_requested_by
              WHERE (f.user_id_1 = :a OR f.user_id_2 = :b)
                AND f.status = 'pending'
                AND f.status_requested_by <> :me",
            ['a' => $userId, 'b' => $userId, 'me' => $userId]
        );

        ulink_preload_user_settings(array_column($rows, 'id'));

        return array_map(static function (array $row): array {
            // Sanitised for the same reason as outgoing requests: a pending
            // request is not yet a relationship, and accepting one returns the
            // full row.
            $user = ulink_user_public($row, false);

            // `id` is the *user* id, matching friends, suggestions and every
            // other person-shaped list the frontend receives. It used to be the
            // friendship id, so the Accept button on a request card called
            // friends/action.php with a friendship id as the target user and got
            // a 409 instead of accepting anything.
            return [
                'id'            => $user['id'],
                'userId'        => $user['id'],
                'friendshipId'  => (int) $row['friendship_id'],
                'user'          => $user,
                'name'          => $user['name'],
                'pic'           => $user['pic'],
                'dept'          => $user['dept'],
                'batch'         => $user['batch'],
                'role'          => $user['role'],
                'created_at'    => $row['request_created_at'],
                'text'          => $user['name'] . ' sent you a friend request',
            ];
        }, $rows);
    }
}

if (!function_exists('ulink_outgoing_requests')) {
    /**
     * Pending requests a user has sent.
     *
     * @return array<int, array<string, mixed>>
     */
    function ulink_outgoing_requests(int $userId): array
    {
        $rows = Database::fetchAll(
            // See ulink_incoming_requests() for why f.created_at is aliased. The
            // `last_seen_at` here also used to be missing while the incoming query
            // selected it, so an outgoing request row reported everyone as
            // offline - a present-or-not flag that disagreed with itself depending
            // on which tab you were looking at.
            "SELECT f.id AS friendship_id, f.created_at AS request_created_at,
                    u.id, u.student_id, u.full_name,
                    u.email, u.profile_pic, u.cover_pic, u.department, u.batch, u.bio, u.role,
                    u.last_seen_at
               FROM friendships f
               JOIN users u
                 ON u.id = CASE WHEN f.user_id_1 = :me THEN f.user_id_2 ELSE f.user_id_1 END
              WHERE (f.user_id_1 = :a OR f.user_id_2 = :b)
                AND f.status = 'pending'
                AND f.status_requested_by = :requester",
            ['me' => $userId, 'a' => $userId, 'b' => $userId, 'requester' => $userId]
        );

        ulink_preload_user_settings(array_column($rows, 'id'));

        return array_map(static function (array $row): array {
            // Sanitised: this list is reachable by anyone who knows a user id,
            // so including email/student_id made it a PII lookup table. You
            // learn who they are from the accepted-friendship payload instead.
            $user = ulink_user_public($row, false);

            // See ulink_incoming_requests(): `id` is the user id here too, so a
            // request row is interchangeable with a friend row on the client.
            return [
                'id'           => $user['id'],
                'userId'       => $user['id'],
                'friendshipId' => (int) $row['friendship_id'],
                'user'         => $user,
                'name'         => $user['name'],
                'pic'          => $user['pic'],
                'dept'         => $user['dept'],
                'batch'        => $user['batch'],
                'role'         => $user['role'],
                'created_at'   => $row['request_created_at'],
            ];
        }, $rows);
    }
}

if (!function_exists('ulink_friend_list')) {
    /**
     * Accepted friends with their profile data.
     *
     * @return array<int, array<string, mixed>>
     */
    function ulink_friend_list(int $userId): array
    {
        $rows = Database::fetchAll(
            "SELECT u.id, u.student_id, u.full_name, u.email, u.profile_pic, u.cover_pic,
                    u.department, u.batch, u.bio, u.role, u.last_seen_at
               FROM friendships f
               JOIN users u
                 ON u.id = CASE WHEN f.user_id_1 = :me THEN f.user_id_2 ELSE f.user_id_1 END
              WHERE (f.user_id_1 = :a OR f.user_id_2 = :b) AND f.status = 'accepted'
              ORDER BY u.full_name ASC",
            ['me' => $userId, 'a' => $userId, 'b' => $userId]
        );

        ulink_preload_user_settings(array_column($rows, 'id'));

        return array_map(static function (array $row): array {
            $user = ulink_user_public($row, true);
            $user['is_friend'] = true;
            return $user;
        }, $rows);
    }
}

if (!function_exists('ulink_friend_suggestions')) {
    /**
     * "People you may know": friends-of-friends first, then other students,
     * never including the user, existing friends or pending request partners.
     *
     * @return array<int, array<string, mixed>>
     */
    function ulink_friend_suggestions(int $userId, int $limit = 12): array
    {
        $limit = max(1, min($limit, 50));

        $rows = Database::fetchAll(
            "SELECT DISTINCT u.id, u.student_id, u.full_name, u.email, u.profile_pic,
                    u.cover_pic, u.department, u.batch, u.bio, u.role, u.last_seen_at,
                    (SELECT COUNT(*) FROM friendships f2
                       JOIN friendships f1 ON (f1.user_id_2 = f2.user_id_1 OR f1.user_id_1 = f2.user_id_2)
                      WHERE (f1.user_id_1 = :a OR f1.user_id_2 = :b)
                        AND f1.status = 'accepted' AND f2.status = 'accepted'
                        AND f2.user_id_1 = u.id) AS mutuals
               FROM users u
              WHERE u.id <> :me
                AND u.is_active = 1
                AND u.id NOT IN (
                      SELECT CASE WHEN user_id_1 = :c THEN user_id_2 ELSE user_id_1 END
                        FROM friendships
                       WHERE user_id_1 = :d OR user_id_2 = :e
                  )
              ORDER BY mutuals DESC, u.created_at DESC
              LIMIT :lim",
            [
                'a' => $userId, 'b' => $userId, 'me' => $userId,
                'c' => $userId, 'd' => $userId, 'e' => $userId,
                'lim' => $limit,
            ]
        );

        ulink_preload_user_settings(array_column($rows, 'id'));

        return array_map(static function (array $row): array {
            // Sanitised. Suggestions are by definition people you have no
            // relationship with, and this endpoint hands back a dozen of them
            // per call, so `true` here was a bulk email + student id dump.
            $user = ulink_user_public($row, false);
            $user['mutuals'] = (int) ($row['mutuals'] ?? 0);
            $user['is_friend'] = false;
            return $user;
        }, $rows);
    }
}

/* -------------------------------------------------------------------------
 | Communities
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_community_member_ids')) {
    /** @return array<int, int> */
    function ulink_community_member_ids(int $communityId): array
    {
        $rows = Database::fetchAll(
            'SELECT user_id FROM community_members WHERE community_id = :c',
            ['c' => $communityId]
        );
        return array_map(static fn($r) => (int) $r['user_id'], $rows);
    }
}

if (!function_exists('ulink_community_member_count')) {
    function ulink_community_member_count(int $communityId): int
    {
        return (int) Database::fetchValue(
            'SELECT COUNT(*) FROM community_members WHERE community_id = :c',
            ['c' => $communityId]
        );
    }
}

if (!function_exists('ulink_is_community_member')) {
    function ulink_is_community_member(int $communityId, int $userId): bool
    {
        return Database::fetchValue(
            'SELECT 1 FROM community_members WHERE community_id = :c AND user_id = :u LIMIT 1',
            ['c' => $communityId, 'u' => $userId]
        ) !== null;
    }
}

if (!function_exists('ulink_is_community_admin')) {
    /**
     * True when $userId is an admin of $communityId.
     *
     * Community admins moderate their own group's posts. This is deliberately
     * separate from the global-admin check so being an admin of one group never
     * hands out rights over another group's content.
     */
    function ulink_is_community_admin(int $communityId, int $userId): bool
    {
        if ($communityId <= 0 || $userId <= 0) {
            return false;
        }

        return Database::fetchValue(
            'SELECT 1 FROM community_members
              WHERE community_id = :c AND user_id = :u AND role = :r LIMIT 1',
            ['c' => $communityId, 'u' => $userId, 'r' => 'admin']
        ) !== null;
    }
}

if (!function_exists('ulink_require_community_membership')) {
    /**
     * Fail with 403 unless $userId belongs to $communityId.
     *
     * One helper for every write path that targets a community post. The guard
     * used to live only in posts/create.php, so posts/comment.php - which did
     * not even select community_id - and posts/like.php let a non-member write
     * into any community, including a private one, which made the create-side
     * check cosmetic.
     *
     * @param int|null $communityId null for a profile post, which has no gate.
     */
    function ulink_require_community_membership($communityId, int $userId): void
    {
        if ($communityId === null || (int) $communityId <= 0) {
            return;
        }

        if (!ulink_is_community_member((int) $communityId, $userId)) {
            ulink_fail('Join this community before interacting with it.', 403);
        }
    }
}

if (!function_exists('ulink_user_community_ids')) {
    /** @return array<int, int> */
    function ulink_user_community_ids(int $userId): array
    {
        $rows = Database::fetchAll(
            'SELECT community_id FROM community_members WHERE user_id = :u',
            ['u' => $userId]
        );
        return array_map(static fn($r) => (int) $r['community_id'], $rows);
    }
}

if (!function_exists('ulink_community_public')) {
    /**
     * Shape a community row for the API, adding membership state for a viewer.
     *
     * @param  array<string, mixed>  $row
     * @param  array<int,int>|null   $joinedIds The viewer's community ids, when
     *         the caller already has them. Passing null costs one membership
     *         query *per row*, which is what api/bootstrap.php used to pay for
     *         all 100 of its communities on every page load.
     * @return array<string, mixed>
     */
    function ulink_community_public(array $row, ?int $viewerId = null, ?array $joinedIds = null): array
    {
        $id = (int) $row['id'];

        // The two fields are the same number, so the fallback was being computed
        // twice whenever member_count was absent.
        $memberCount = $row['member_count'] ?? null;
        $members = $memberCount === null
            ? ulink_community_member_count($id)
            : (int) $memberCount;

        if ($viewerId === null) {
            $joined = false;
        } elseif ($joinedIds !== null) {
            $joined = in_array($id, array_map('intval', $joinedIds), true);
        } else {
            $joined = ulink_is_community_member($id, $viewerId);
        }

        return [
            'id'          => $id,
            'name'        => (string) $row['name'],
            'description' => (string) ($row['description'] ?? ''),
            'icon'        => (string) ($row['icon'] ?? 'group'),
            'pic'         => $row['pic'] ?? null,
            'cover'       => $row['cover_pic'] ?? null,
            'cover_pic'   => $row['cover_pic'] ?? null,
            'is_private'  => (int) ($row['is_private'] ?? 0) === 1,
            'members'     => $members,
            'memberCount' => $members,
            'created_at'  => $row['created_at'] ?? null,
            'joined'      => $joined,
        ];
    }
}

if (!function_exists('ulink_store_entity_image')) {
    /**
     * Store an optional image for a community or event.
     *
     * Accepts a base64 data URI (uploaded file) or a remote URL, stores uploads
     * under uploads/<subdir>/, and returns null for an empty value. Anything
     * else fails the request rather than writing a broken path.
     */
    function ulink_store_entity_image($value, string $subdir): ?string
    {
        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        $value = trim($value);

        if (ulink_split_data_uri($value) !== null) {
            $stored = ulink_save_upload($value, $subdir, ULINK_UPLOAD_MAX_BYTES);
            if ($stored === null) {
                ulink_fail('That image could not be processed. Use a JPG, PNG, GIF or WEBP under 5 MB.', 422);
            }
            return $stored;
        }

        if (ulink_is_remote_url($value)) {
            return $value;
        }

        ulink_fail('Unsupported image. Upload a file or paste an image link.', 422);
    }
}

/* -------------------------------------------------------------------------
 | Messages
 | ---------------------------------------------------------------------- */

if (!function_exists('ulink_message_public')) {
    /**
     * @param  array<string, mixed> $row
     * @return array<string, mixed>
     */
    function ulink_message_public(array $row, int $viewerId): array
    {
        $senderId = (int) $row['sender_id'];

        $message = [
            'id'        => (int) $row['id'],
            'text'      => (string) $row['message'],
            'message'   => (string) $row['message'],
            'senderId'  => $senderId,
            'fromId'    => $senderId,
            'receiverId'=> (int) $row['receiver_id'],
            'mine'      => $senderId === $viewerId,
            'read'      => (int) ($row['is_read'] ?? 0) === 1,
            'ts'        => $row['created_at'] ?? null,
            'created_at'=> $row['created_at'] ?? null,
        ];

        // The stored path is deliberately not exposed. The browser gets a URL
        // on the download endpoint instead, which re-checks that the viewer is
        // a participant before it streams a byte. Handing out
        // "uploads/messages/<name>" would let anyone who guessed or harvested
        // a filename read a private document.
        $path = isset($row['attachment_path']) ? (string) $row['attachment_path'] : '';
        if ($path !== '') {
            $message['attachment'] = [
                'type' => ((string) ($row['attachment_type'] ?? 'file')) === 'image' ? 'image' : 'file',
                'name' => (string) ($row['attachment_name'] ?? 'Attachment'),
                'mime' => (string) ($row['attachment_mime'] ?? ''),
                'size' => (int) ($row['attachment_size'] ?? 0),
                'url'  => 'api/messages/attachment.php?id=' . (int) $row['id'],
            ];
        }

        return $message;
    }
}

if (!function_exists('ulink_conversation_peer')) {
    /**
     * The other participant of a conversation with $otherId.
     */
    function ulink_conversation_peer(int $viewerId, int $otherId): ?int
    {
        return $otherId === $viewerId ? null : $otherId;
    }
}

if (!function_exists('ulink_unread_message_count')) {
    function ulink_unread_message_count(int $userId, ?int $peerId = null): int
    {
        try {
            if ($peerId === null) {
                return (int) Database::fetchValue(
                    'SELECT COUNT(*) FROM messages WHERE receiver_id = :me AND is_read = 0',
                    ['me' => $userId]
                );
            }

            return (int) Database::fetchValue(
                'SELECT COUNT(*) FROM messages
                  WHERE receiver_id = :me AND sender_id = :peer AND is_read = 0',
                ['me' => $userId, 'peer' => $peerId]
            );
        } catch (Throwable $e) {
            return 0;
        }
    }
}
