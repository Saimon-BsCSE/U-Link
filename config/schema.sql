-- =============================================================================
-- U-Link social network - MySQL / MariaDB schema
--
-- Apply with:  mysql -u <user> -p < config/schema.sql
--
-- The file is idempotent (CREATE TABLE IF NOT EXISTS) so it can be re-run.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `ulink_db`
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `ulink_db`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `student_id`    VARCHAR(20)  DEFAULT NULL,
    `full_name`     VARCHAR(120) NOT NULL,
    `email`         VARCHAR(190) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `profile_pic`   VARCHAR(500) DEFAULT NULL,
    `cover_pic`     VARCHAR(500) DEFAULT NULL,
    `department`    VARCHAR(100) DEFAULT NULL,
    `batch`         VARCHAR(20)  DEFAULT NULL,
    `bio`           TEXT         DEFAULT NULL,
    -- The extra "About" fields the profile editor owns. All are optional and
    -- are rendered on the About card; `interests` is a short comma-separated
    -- tag list (normalised on write, never trusted as markup on read).
    `headline`      VARCHAR(160) DEFAULT NULL,
    `location`      VARCHAR(120) DEFAULT NULL,
    `website`       VARCHAR(255) DEFAULT NULL,
    `interests`     VARCHAR(255) DEFAULT NULL,
    `role`          ENUM('student','faculty','admin') NOT NULL DEFAULT 'student',
    `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
    `last_seen_at`  DATETIME     DEFAULT NULL,
    `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    -- utf8mb4 with a 190 byte limit keeps the index inside the 767 byte
    -- prefix limit on older InnoDB row formats.
    UNIQUE KEY `uq_users_email` (`email`),
    UNIQUE KEY `uq_users_student_id` (`student_id`),
    KEY `idx_users_department` (`department`),
    KEY `idx_users_created_at` (`created_at`),
    KEY `idx_users_full_name` (`full_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- communities
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `communities` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `slug`        VARCHAR(160) DEFAULT NULL,
    `name`        VARCHAR(160) NOT NULL,
    `description` TEXT         DEFAULT NULL,
    `icon`        VARCHAR(60)  NOT NULL DEFAULT 'group',
    `pic`         VARCHAR(500) DEFAULT NULL,
    `cover_pic`   VARCHAR(500) DEFAULT NULL,
    `is_private`  TINYINT(1)   NOT NULL DEFAULT 0,
    `created_by`  INT UNSIGNED DEFAULT NULL,
    `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_communities_slug` (`slug`),
    KEY `idx_communities_name` (`name`),
    CONSTRAINT `fk_communities_creator`
        FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- community_members
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `community_members` (
    `community_id` INT UNSIGNED NOT NULL,
    `user_id`      INT UNSIGNED NOT NULL,
    `role`         ENUM('member','admin') NOT NULL DEFAULT 'member',
    `joined_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`community_id`, `user_id`),
    KEY `idx_cm_user` (`user_id`),
    CONSTRAINT `fk_cm_community`
        FOREIGN KEY (`community_id`) REFERENCES `communities` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cm_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- posts
--
-- community_id is nullable: NULL means a post appears in the main newsfeed.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `posts` (
    `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`      INT UNSIGNED NOT NULL,
    `community_id` INT UNSIGNED DEFAULT NULL,
    `content`      TEXT         NOT NULL,
    `image_url`    VARCHAR(500) DEFAULT NULL,
    `visibility`   ENUM('public','friends','private') NOT NULL DEFAULT 'public',
    `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    -- The newsfeed is always "newest first, optionally scoped to a community",
    -- so this composite index serves both queries.
    KEY `idx_posts_feed` (`created_at`, `id`),
    KEY `idx_posts_user` (`user_id`, `created_at`),
    KEY `idx_posts_community` (`community_id`, `created_at`),
    CONSTRAINT `fk_posts_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_posts_community`
        FOREIGN KEY (`community_id`) REFERENCES `communities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- post_likes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `post_likes` (
    `post_id`    INT UNSIGNED NOT NULL,
    `user_id`    INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`post_id`, `user_id`),
    KEY `idx_post_likes_user` (`user_id`),
    CONSTRAINT `fk_post_likes_post`
        FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_post_likes_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- comments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `comments` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `post_id`    INT UNSIGNED NOT NULL,
    `user_id`    INT UNSIGNED NOT NULL,
    `content`    TEXT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_comments_post` (`post_id`, `created_at`),
    KEY `idx_comments_user` (`user_id`),
    CONSTRAINT `fk_comments_post`
        FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_comments_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- friendships
--
-- The original schema used
--     PRIMARY KEY (LEAST(user_id_1, user_id_2), GREATEST(user_id_1, user_id_2))
-- which MySQL rejects: a PRIMARY KEY column must be a plain column reference,
-- not a function expression. The pair is instead normalised on write (a is
-- always the lower id, b the higher) and keyed on (a, b), with
-- status_requested_by recording which side initiated so the request can be
-- attributed back to the right user.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `friendships` (
    `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id_1`         INT UNSIGNED NOT NULL,
    `user_id_2`         INT UNSIGNED NOT NULL,
    `status`            ENUM('pending','accepted','declined','blocked') NOT NULL DEFAULT 'pending',
    `status_requested_by` INT UNSIGNED DEFAULT NULL,
    `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `responded_at`      DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_friendship_pair` (`user_id_1`, `user_id_2`),
    KEY `idx_friendship_user2` (`user_id_2`, `status`),
    KEY `idx_friendship_user1` (`user_id_1`, `status`),
    CONSTRAINT `fk_friendship_user1`
        FOREIGN KEY (`user_id_1`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_friendship_user2`
        FOREIGN KEY (`user_id_2`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- messages
-- -----------------------------------------------------------------------------
-- Direct messages. A row may carry text, an attachment, or both - the frontend
-- allows either to be empty as long as the other is present.
--
-- The attachment columns are nullable so text-only messages need no values. The
-- path is the only field the server trusts: it is generated during upload and
-- never taken from the client. Everything the browser displays (name, mime,
-- size) is metadata recorded alongside it.
--
-- Attachment bytes are NOT served straight off the filesystem. api/messages/
-- attachment.php re-checks that the viewer is a participant before streaming,
-- so a guessed filename cannot expose a document.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
    `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sender_id`        INT UNSIGNED NOT NULL,
    `receiver_id`      INT UNSIGNED NOT NULL,
    `message`          TEXT NOT NULL,
    `attachment_type`  VARCHAR(20) DEFAULT NULL,
    `attachment_name`  VARCHAR(255) DEFAULT NULL,
    `attachment_path`  VARCHAR(500) DEFAULT NULL,
    `attachment_mime`  VARCHAR(120) DEFAULT NULL,
    `attachment_size`  INT UNSIGNED DEFAULT NULL,
    `is_read`          TINYINT(1) NOT NULL DEFAULT 0,
    `read_at`          DATETIME DEFAULT NULL,
    `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_messages_conversation` (`sender_id`, `receiver_id`, `id`),
    KEY `idx_messages_inbox` (`receiver_id`, `is_read`, `id`),
    CONSTRAINT `fk_messages_sender`
        FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_messages_receiver`
        FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`       INT UNSIGNED NOT NULL COMMENT 'recipient',
    `type`          VARCHAR(40)  NOT NULL,
    `content`       TEXT NOT NULL,
    `from_user_id`  INT UNSIGNED DEFAULT NULL,
    `reference_id`  INT UNSIGNED DEFAULT NULL COMMENT 'post / comment / friendship id',
    `is_read`       TINYINT(1) NOT NULL DEFAULT 0,
    `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_notifications_inbox` (`user_id`, `is_read`, `id`),
    KEY `idx_notifications_type` (`user_id`, `type`, `id`),
    CONSTRAINT `fk_notifications_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_notifications_from_user`
        FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `events` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title`       VARCHAR(200) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `location`    VARCHAR(200) DEFAULT NULL,
    `image_url`   VARCHAR(500) DEFAULT NULL,
    `event_date`  DATETIME NOT NULL,
    `end_date`    DATETIME DEFAULT NULL,
    `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_events_date` (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `event_interest` (
    `event_id`  INT UNSIGNED NOT NULL,
    `user_id`   INT UNSIGNED NOT NULL,
    `status`    ENUM('interested','not_interested') NOT NULL DEFAULT 'interested',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`event_id`, `user_id`),
    KEY `idx_event_interest_user` (`user_id`),
    CONSTRAINT `fk_event_interest_event`
        FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_event_interest_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- user_activities (telemetry)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_activities` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`       INT UNSIGNED NOT NULL,
    `activity_type` VARCHAR(50) NOT NULL,
    `details`       JSON DEFAULT NULL,
    `ip_address`    VARCHAR(45) DEFAULT NULL,
    `user_agent`    TEXT DEFAULT NULL,
    `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_activity` (`user_id`, `created_at`),
    KEY `idx_activity_type` (`activity_type`, `created_at`),
    CONSTRAINT `fk_user_activities_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- login_attempts (brute force throttling)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `login_attempts` (
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `identifier` VARCHAR(190) NOT NULL COMMENT 'email or student id that was tried',
    `ip_address` VARCHAR(45) NOT NULL,
    `successful` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_login_attempts_lookup` (`identifier`, `ip_address`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- user_sessions (device list / revocation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_sessions` (
    `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id`       INT UNSIGNED NOT NULL,
    `session_token` VARCHAR(191) NOT NULL,
    `ip_address`    VARCHAR(45) DEFAULT NULL,
    `user_agent`    TEXT DEFAULT NULL,
    `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_activity` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `expires_at`    DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_session_token` (`session_token`),
    KEY `idx_user_id` (`user_id`),
    CONSTRAINT `fk_user_sessions_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- user_settings
--
-- One row per user holding their preferences. Defaults live on the columns, so a
-- user who has never opened Settings still behaves like a first-class account:
-- the row is created on demand by ulink_user_settings() rather than at sign-up,
-- which keeps register.php and the seed data unaware of this table.
--
-- `profile_visibility` and `message_privacy` are enums because they are read on
-- hot paths (profile view, message send) and a typo in a request must be
-- rejected at write time, not tolerated at read time.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_settings` (
    `user_id`               INT UNSIGNED NOT NULL,
    `compact_feed`          TINYINT(1) NOT NULL DEFAULT 0,
    `reduce_motion`         TINYINT(1) NOT NULL DEFAULT 0,
    `profile_visibility`    ENUM('public','friends','private') NOT NULL DEFAULT 'public',
    `show_online_status`    TINYINT(1) NOT NULL DEFAULT 1,
    `allow_search_by_id`    TINYINT(1) NOT NULL DEFAULT 1,
    `message_privacy`       ENUM('everyone','friends') NOT NULL DEFAULT 'everyone',
    `notify_likes`          TINYINT(1) NOT NULL DEFAULT 1,
    `notify_comments`       TINYINT(1) NOT NULL DEFAULT 1,
    `notify_friend_requests` TINYINT(1) NOT NULL DEFAULT 1,
    `notify_events`         TINYINT(1) NOT NULL DEFAULT 1,
    `updated_at`            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`),
    CONSTRAINT `fk_user_settings_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- saved_posts (bookmarks)
--
-- A private, per-user bookmark list. The composite primary key makes the
-- save/unsave toggle idempotent at the database level, so a double-click cannot
-- create two rows, and both foreign keys cascade so deleting a post or an
-- account clears its bookmarks rather than orphaning them.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `saved_posts` (
    `user_id`    INT UNSIGNED NOT NULL,
    `post_id`    INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `post_id`),
    KEY `idx_saved_posts_user` (`user_id`, `created_at`),
    CONSTRAINT `fk_saved_posts_user`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_saved_posts_post`
        FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- post_reports (moderation queue)
--
-- A report is a durable record rather than a toast: the unique key means one
-- account can report a post once, and the row survives even if the reporter is
-- deleted only up to the cascade. `reason` is an enum so a typo cannot invent a
-- moderation category, and `details` is plain text capped at write time.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `post_reports` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `post_id`     INT UNSIGNED NOT NULL,
    `reporter_id` INT UNSIGNED NOT NULL,
    `reason`      ENUM('spam','harassment','misinformation','other') NOT NULL DEFAULT 'other',
    `details`     VARCHAR(500) DEFAULT NULL,
    `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_post_reports_once` (`post_id`, `reporter_id`),
    KEY `idx_post_reports_post` (`post_id`, `created_at`),
    CONSTRAINT `fk_post_reports_post`
        FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_post_reports_user`
        FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
