<?php
/**
 * config/media.php
 *
 * Curated, relevant artwork for the demo communities and events.
 *
 * The database stores a URL in `communities.pic` / `communities.cover_pic` and
 * `events.image_url`. Every entry below is a stable Unsplash CDN photo chosen to
 * match the subject of its community or event, so the directory and the events
 * grid never show a broken image or an unrelated stock photo. The frontend
 * still falls back to a locally generated SVG gradient if a network image
 * cannot load, so the layout holds even without internet.
 *
 * Keeping the mapping in one place means a fresh `ulink_seed_demo_data()` run
 * and the already-populated database can be kept in step from the same list.
 */

if (!function_exists('ulink_unsplash')) {
    /**
     * Build a sized, cropped Unsplash CDN URL from a photo id.
     */
    function ulink_unsplash(string $id, int $width = 800): string
    {
        return 'https://images.unsplash.com/' . $id
            . '?auto=format&fit=crop&w=' . $width . '&q=70';
    }
}

if (!function_exists('ulink_community_media')) {
    /**
     * Community artwork keyed by slug.
     *
     * @return array<string, array{pic: string, cover: string}>
     */
    function ulink_community_media(): array
    {
        $ids = [
            'cse-group'    => ['photo-1461749280684-dccba630e2f6', 'photo-1515879218367-8466d910aaa4'],
            'hackathon'    => ['photo-1504384308090-c894fdcc538d', 'photo-1522071820081-009f0129c71c'],
            'photography'  => ['photo-1502920917128-1aa500764cbd', 'photo-1516035069371-29a1b244cc32'],
            'eee-bash'     => ['photo-1518770660439-4636190af475', 'photo-1581092160562-40aa08e78837'],
            'cultural'     => ['photo-1514525253161-7a46d19cd819', 'photo-1493225457124-a3eb161ffa5f'],
            'app-forum'    => ['photo-1512941937669-90a1b58e7e9c', 'photo-1555949963-aa79dcee981c'],
            'ai-explorers' => ['photo-1620712943543-bcc4688e7485', 'photo-1677442136019-21780ecad995'],
            'english-forum'=> ['photo-1456513080510-7bf3a84b82f8', 'photo-1524995997946-a1c2e315a42f'],
            'efootball'    => ['photo-1542751371-adc38448a05e', 'photo-1511512578047-dfb367046420'],
            'sports'       => ['photo-1579952363873-27f3bade9f55', 'photo-1461896836934-ffe607ba8211'],
            'computer-club'=> ['photo-1485827404703-89b55fcc595e', 'photo-1531746790731-6c087fecd65a'],
            'business-club'=> ['photo-1521737604893-d14cc237f11d', 'photo-1556761175-5973dc0f32e7'],
            'biotech'      => ['photo-1532187863486-abf9dbad1b69', 'photo-1579154204601-01588f351e67'],
            'pharmacy'     => ['photo-1587854692152-cbe660dbde88', 'photo-1471864190281-a93a3070b6de'],
            'data-science' => ['photo-1551288049-bebda4e38f71', 'photo-1526628953301-3e589a6a8b74'],
        ];

        $out = [];
        foreach ($ids as $slug => [$pic, $cover]) {
            $out[$slug] = [
                'pic'   => ulink_unsplash($pic, 400),
                'cover' => ulink_unsplash($cover, 1200),
            ];
        }

        return $out;
    }
}

if (!function_exists('ulink_event_media')) {
    /**
     * Event artwork keyed by the exact seeded title.
     *
     * @return array<string, string>
     */
    function ulink_event_media(): array
    {
        $ids = [
            'Borshoboron (Pohela Boishakh)'      => 'photo-1533174072545-7a4b6ad7a6c3',
            'CSE Inter-Department Hackathon'     => 'photo-1504384308090-c894fdcc538d',
            'Startup Pitch Deck Competition'     => 'photo-1559136555-9303baea8ebd',
            'AI Explorers: Reading Transformers' => 'photo-1620712943543-bcc4688e7485',
            'Annual Sports Week'                 => 'photo-1579952363873-27f3bade9f55',
            'Photography Walk: Old Dhaka'        => 'photo-1502920917128-1aa500764cbd',
            'English Language Forum: Debate'     => 'photo-1456513080510-7bf3a84b82f8',
            'App Forum Project Showcase'         => 'photo-1512941937669-90a1b58e7e9c',
            'Pharmacy Industry Visit'            => 'photo-1587854692152-cbe660dbde88',
            'Efootball Tournament Finals'        => 'photo-1542751371-adc38448a05e',
            'Career Fair: Spring Edition'        => 'photo-1542744173-8e7e53415bb0',
            'Cultural Club Annual Meeting'       => 'photo-1514525253161-7a46d19cd819',
        ];

        $out = [];
        foreach ($ids as $title => $id) {
            $out[$title] = ulink_unsplash($id, 1000);
        }

        return $out;
    }
}
