<?php
/**
 * scripts/assign-media.php
 *
 * Apply the curated community and event artwork from config/media.php to an
 * already-populated database. `ulink_seed_demo_data()` only runs on an empty
 * database, so this is how a live install picks up new photos without being
 * wiped and re-seeded.
 *
 * Safe to run repeatedly: it only writes rows whose stored URL differs from the
 * curated one.
 *
 * Usage:
 *   ./scripts/dev.sh php scripts/assign-media.php
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/media.php';

$communities = 0;
foreach (ulink_community_media() as $slug => $art) {
    $communities += Database::run(
        'UPDATE communities
            SET pic = :pic, cover_pic = :cover
          WHERE slug = :slug
            AND (pic IS NULL OR cover_pic IS NULL OR pic <> :pic2 OR cover_pic <> :cover2)',
        [
            'pic'    => $art['pic'],
            'cover'  => $art['cover'],
            'slug'   => $slug,
            'pic2'   => $art['pic'],
            'cover2' => $art['cover'],
        ]
    )->rowCount();
}

$events = 0;
foreach (ulink_event_media() as $title => $image) {
    $events += Database::run(
        'UPDATE events
            SET image_url = :image
          WHERE title = :title
            AND (image_url IS NULL OR image_url <> :image2)',
        ['image' => $image, 'title' => $title, 'image2' => $image]
    )->rowCount();
}

fwrite(STDOUT, "Updated {$communities} community row(s) and {$events} event row(s).\n");
