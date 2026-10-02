<?php
/**
 * config/seed.php
 *
 * Loads a demo data set: users, friendships, communities, events, posts,
 * comments, likes and notifications.
 *
 * Idempotent - running it twice does not duplicate anything. The demo accounts
 * all share the password `password123`.
 *
 * Run it with:
 *   php -r 'require "config/seed.php"; print_r(ulink_seed_demo_data());'
 * or through  /api/init/setup.php?seed=1
 */

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/media.php';

/** Password shared by every demo account. */
if (!defined('ULINK_DEMO_PASSWORD')) {
    define('ULINK_DEMO_PASSWORD', 'password123');
}

if (!function_exists('ulink_seed_users')) {
    /**
     * Demo accounts. `pic` points at the avatars already shipped in Asserts/.
     *
     * @return array<int, array<string, string|null>>
     */
    function ulink_seed_users(): array
    {
        return [
            ['full_name' => 'Saimon Rahman',       'email' => 'saimon@uiu.ac.bd',  'student_id' => '201011301',  'department' => 'Computer Science & Engineering', 'batch' => '23', 'role' => 'student', 'pic' => 'Asserts/zerin.jpeg',            'bio' => 'Building things for the campus.'],
            ['full_name' => 'Nusrat Jahan',       'email' => 'nusrat@uiu.ac.bd',  'student_id' => '201011302',  'department' => 'Computer Science & Engineering', 'batch' => '23', 'role' => 'student', 'pic' => 'Asserts/nusrat_jahan.jpeg',     'bio' => 'CSE undergrad. Loves compilers.'],
            ['full_name' => 'Rakib Hasan',        'email' => 'rakib@uiu.ac.bd',   'student_id' => '201011303',  'department' => 'Computer Science & Engineering', 'batch' => '23', 'role' => 'student', 'pic' => 'Asserts/rakib.jpeg',            'bio' => 'Robotics club member.'],
            ['full_name' => 'Mehedi Hassan',      'email' => 'mehedi@uiu.ac.bd',  'student_id' => '201011304',  'department' => 'Computer Science & Engineering', 'batch' => '22', 'role' => 'student', 'pic' => 'Asserts/mehedi.jpeg',           'bio' => 'Coffee, code, repeat.'],
            ['full_name' => 'Tania Akter',        'email' => 'tania@uiu.ac.bd',   'student_id' => '201021305',  'department' => 'Computer Science & Engineering', 'batch' => '22', 'role' => 'student', 'pic' => 'Asserts/tania.jpeg',            'bio' => 'UIU APP Forum coordinator.'],
            ['full_name' => 'Ayesha Siddiqa',     'email' => 'ayesha@uiu.ac.bd',  'student_id' => '201021306',  'department' => 'Data Science',                    'batch' => '22', 'role' => 'student', 'pic' => 'Asserts/ayesha.jpeg',           'bio' => 'ML enthusiast. Kaggle addict.'],
            ['full_name' => 'Omar Faruk',         'email' => 'omar@uiu.ac.bd',    'student_id' => '201011307',  'department' => 'Computer Science & Engineering', 'batch' => '21', 'role' => 'student', 'pic' => 'Asserts/faruk.jpeg',            'bio' => 'Photographer on weekends.'],
            ['full_name' => 'Farhana Kabir',      'email' => 'farhana@uiu.ac.bd', 'student_id' => '201021307',  'department' => 'Business Administration',        'batch' => '22', 'role' => 'student', 'pic' => 'Asserts/sabrina.jpeg',          'bio' => 'Marketing club.'],
            ['full_name' => 'Dr. Ahmed Kabir',    'email' => 'a.kabir@uiu.ac.bd', 'student_id' => 'F1001',      'department' => 'Computer Science & Engineering', 'batch' => '-',  'role' => 'faculty', 'pic' => 'Asserts/Dr. Ahmed Kabir.jpeg',   'bio' => 'Associate Professor, CSE.'],
            ['full_name' => 'Dr. Laila Zaman',    'email' => 'l.zaman@uiu.ac.bd', 'student_id' => 'F1002',      'department' => 'Business Administration',        'batch' => '-',  'role' => 'faculty', 'pic' => 'Asserts/Dr. Laila Zaman.jpeg',   'bio' => 'Faculty of Business Studies.'],
            ['full_name' => 'Priya Choudhury',    'email' => 'priya@uiu.ac.bd',   'student_id' => '201011308',  'department' => 'Electrical Engineering',         'batch' => '21', 'role' => 'student', 'pic' => 'Asserts/priya.jpeg',            'bio' => 'EEE Bash organiser.'],
            ['full_name' => 'Jamal Uddin',        'email' => 'jamal@uiu.ac.bd',   'student_id' => '201011309',  'department' => 'Computer Science & Engineering', 'batch' => '20', 'role' => 'student', 'pic' => 'Asserts/jamal.jpg',             'bio' => 'Library regular.'],
            ['full_name' => 'Sabrina Nahar',      'email' => 'sabrina@uiu.ac.bd', 'student_id' => '201021310',  'department' => 'English Language & Literature', 'batch' => '22', 'role' => 'student', 'pic' => 'Asserts/sabrina.jpeg',          'bio' => 'Debate society.'],
            ['full_name' => 'Kamrul Hasan',       'email' => 'kamrul@uiu.ac.bd',  'student_id' => '201011311',  'department' => 'Computer Science & Engineering', 'batch' => '21', 'role' => 'student', 'pic' => 'Asserts/Kamrul Hasan.jpeg',      'bio' => 'Competitive programming.'],
            ['full_name' => 'Rina Sultana',      'email' => 'rina@uiu.ac.bd',    'student_id' => '201021312',  'department' => 'Pharmacy',                      'batch' => '22', 'role' => 'student', 'pic' => 'Asserts/rina.jpeg',            'bio' => 'Pharmacy club.'],
            ['full_name' => 'Tanvir Ahmed',       'email' => 'tanvir@uiu.ac.bd',  'student_id' => '201011313',  'department' => 'Computer Science & Engineering', 'batch' => '20', 'role' => 'student', 'pic' => 'Asserts/tanvir.jpeg',           'bio' => 'UIU Mars Rover team lead.'],
        ];
    }
}

if (!function_exists('ulink_seed_communities')) {
    /** @return array<int, array<string, mixed>> */
    function ulink_seed_communities(): array
    {
        return [
            ['slug' => 'cse-group',      'name' => 'CSE Group',                'icon' => 'code',             'description' => 'Announcements, help and resources for every Computer Science student at UIU.'],
            ['slug' => 'hackathon',      'name' => 'Hackathon Group',          'icon' => 'emoji_events',    'description' => 'The annual UIU inter-department hackathon. Teams, mentors and logistics.'],
            ['slug' => 'photography',    'name' => 'UIU Photography Club',     'icon' => 'photo_camera',    'description' => 'Photo walks, exhibitions and darkroom workshops.'],
            ['slug' => 'eee-bash',       'name' => 'EEE Bash',                 'icon' => 'bolt',            'description' => 'Department of Electrical Engineering, unofficial but enthusiastic.'],
            ['slug' => 'cultural',       'name' => 'UIU Cultural Club',        'icon' => 'theater_comedy',  'description' => 'Annual fest, cultural nights and rehearsals.'],
            ['slug' => 'app-forum',      'name' => 'UIU APP Forum',            'icon' => 'apps',            'description' => 'Android application development, meetups and project showcases.'],
            ['slug' => 'ai-explorers',   'name' => 'UIU AI Explorers',         'icon' => 'psychology',      'description' => 'Papers, workshops and model debugging help.'],
            ['slug' => 'english-forum',  'name' => 'UIU English Language Forum','icon' => 'record_voice_over','description' => 'Spelling bee, debate and language exchange.'],
            ['slug' => 'efootball',      'name' => 'UIU Efootball Community',  'icon' => 'sports_esports',  'description' => 'Tournament brackets, scrims and highlights.'],
            ['slug' => 'sports',         'name' => 'UIU Sports Club',          'icon' => 'sports_soccer',   'description' => 'Football, cricket and the annual sports week.'],
            ['slug' => 'computer-club',  'name' => 'UIU Computer Club',        'icon' => 'memory',          'description' => 'Hardware lab access, Linux workshops and CTFs.'],
            ['slug' => 'business-club',  'name' => 'UIU Business Club',        'icon' => 'cases',           'description' => 'Case competitions, pitch practice and internships.'],
            ['slug' => 'biotech',        'name' => 'UIU Biotechnology Club',   'icon' => 'biotech',         'description' => 'Lab work, seminars and research opportunities.'],
            ['slug' => 'pharmacy',       'name' => 'UIU Pharmacy Club',        'icon' => 'medication',      'description' => 'Pharmacy students, industry visits and seminars.'],
            ['slug' => 'data-science',   'name' => 'UIU Data Science Club',    'icon' => 'query_stats',     'description' => 'Datasets, visualisation and machine learning practice.'],
        ];
    }
}

if (!function_exists('ulink_seed_events')) {
    /** @return array<int, array<string, mixed>> */
    function ulink_seed_events(): array
    {
        $base = strtotime('+1 day 10:00:00');
        $media = ulink_event_media();

        $events = [
            ['Borshoboron (Pohela Boishakh)',    'UIU Playground, Block C',  'The Bengali new year festival, with stalls, music and food across the campus grounds.'],
            ['CSE Inter-Department Hackathon',   'UITL Auditorium',          'Twenty four hours, cross-department teams, mentors on site. Registration closes the night before.'],
            ['Startup Pitch Deck Competition',    'Business School, Room 402','Ten minutes on stage and five with the judges. Open to all departments.'],
            ['AI Explorers: Reading Transformers','CSE Lab 3',                 'Walkthrough of attention, then a hands-on fine-tuning session.'],
            ['Annual Sports Week',                'UIU Playground',           'Football, cricket, volleyball and badminton across five days.'],
            ['Photography Walk: Old Dhaka',      'Meeting at Gate 2',        'Sunrise to golden hour. Bring a camera or borrow one of ours.'],
            ['English Language Forum: Debate',    'Humanities Building, 110', 'Motion: social media does more harm than good to university life.'],
            ['App Forum Project Showcase',        'Innovation Centre',        'Demo day for the projects built this semester.'],
            ['Pharmacy Industry Visit',          'Meeting at the Gate',      'A day at a local pharmaceutical manufacturing plant.'],
            ['Efootball Tournament Finals',       'E-Sports Arena, Level 2',  'Double elimination. Brackets and live scores on the big screen.'],
            ['Career Fair: Spring Edition',      'UITL Hall',                'Thirty employers, CV clinic and mock interviews.'],
            ['Cultural Club Annual Meeting',     'Auditorium',               'Fest planning, committee formation and budget review.'],
        ];

        $out = [];
        foreach ($events as $index => [$title, $location, $description]) {
            $start = $base + ($index * 86400 * 2);
            $out[] = [
                'title'       => $title,
                'location'    => $location,
                'description' => $description,
                'image_url'   => $media[$title] ?? null,
                'event_date'  => gmdate('Y-m-d H:i:s', $start),
                'end_date'    => gmdate('Y-m-d H:i:s', $start + 4 * 3600),
            ];
        }

        return $out;
    }
}

if (!function_exists('ulink_seed_demo_data')) {
    /**
     * Load the demo data set. Safe to run repeatedly.
     *
     * @return array{status: string, users: int, communities: int, events: int, posts: int, comments: int, skipped: bool}
     */
    function ulink_seed_demo_data(): array
    {
        $result = [
            'status'      => 'ok',
            'users'       => 0,
            'communities' => 0,
            'events'      => 0,
            'posts'       => 0,
            'comments'    => 0,
            'skipped'     => false,
        ];

        foreach (['users', 'communities', 'events', 'posts', 'post_likes', 'comments', 'community_members', 'friendships'] as $table) {
            if (!Database::tableExists($table)) {
                $result['status'] = 'error';
                $result['skipped'] = true;
                $result['error'] = "Missing table `{$table}`. Run the schema first.";
                return $result;
            }
        }

        // Already seeded?
        $existing = (int) Database::fetchValue('SELECT COUNT(*) FROM users');
        if ($existing > 0) {
            $result['skipped'] = true;
            $result['users'] = $existing;
            $result['message'] = 'Database already contains ' . $existing . ' users; seeding skipped.';
            return $result;
        }

        $passwordHash = password_hash(ULINK_DEMO_PASSWORD, PASSWORD_DEFAULT);
        $userIds      = [];
        $emailToId    = [];

        /* ---------------------------------------------------------------- users */
        foreach (ulink_seed_users() as $spec) {
            $email = strtolower($spec['email']);

            // Only store the avatar when the file actually exists.
            $pic = $spec['pic'];
            if ($pic !== null && !is_file(ULINK_BASE_PATH . '/' . $pic)) {
                $pic = null;
            }

            $userIds[] = Database::insert('users', [
                'student_id'    => $spec['student_id'],
                'full_name'     => $spec['full_name'],
                'email'         => $email,
                'password_hash' => $passwordHash,
                'profile_pic'   => $pic,
                'department'    => $spec['department'],
                'batch'         => $spec['batch'],
                'bio'           => $spec['bio'],
                'role'          => $spec['role'],
                'is_active'     => 1,
            ]);

            $emailToId[$email] = end($userIds);
        }
        $result['users'] = count($userIds);

        // The accounts have to predate everything they go on to write.
        //
        // Every other table in this file is backdated, so the demo reads like a
        // fortnight of activity rather than one frozen instant. `users.created_at`
        // was left at its column default, which is *now* - and that claimed Nusrat
        // sent you a message half an hour before she had an account at all. It
        // only shows up if you look at the conversation payload closely: the peer
        // object carries the account's `created_at`, and one suite assertion
        // compares it against the message timestamp precisely to catch a nested
        // user object that was built from the message row instead of the users
        // table. Backdating the accounts by a few weeks costs nothing and makes
        // the whole data set self-consistent, so the oldest post - a day and a
        // half old - is comfortably newer than the person who wrote it.
        $joinedAt = time() - (86400 * 45);
        foreach ($userIds as $offset => $userId) {
            Database::run(
                'UPDATE users SET created_at = :t WHERE id = :id',
                [
                    't'  => gmdate('Y-m-d H:i:s', $joinedAt - ($offset * 32400)),
                    'id' => $userId,
                ]
            );
        }

        /* ----------------------------------------------------------- communities */
        $communityIds = [];
        $communityMedia = ulink_community_media();
        foreach (ulink_seed_communities() as $spec) {
            $art = $communityMedia[$spec['slug']] ?? ['pic' => null, 'cover' => null];
            $communityIds[$spec['slug']] = Database::insert('communities', [
                'slug'        => $spec['slug'],
                'name'        => $spec['name'],
                'description' => $spec['description'],
                'icon'        => $spec['icon'],
                'pic'         => $art['pic'],
                'cover_pic'   => $art['cover'],
                'is_private'  => 0,
                'created_by'  => $userIds[0],
            ]);
        }
        $result['communities'] = count($communityIds);

        /* --------------------------------------------------------------- events */
        foreach (ulink_seed_events() as $spec) {
            Database::insert('events', [
                'title'       => $spec['title'],
                'description' => $spec['description'],
                'location'    => $spec['location'],
                'image_url'   => $spec['image_url'],
                'event_date'  => $spec['event_date'],
                'end_date'    => $spec['end_date'],
            ]);
            $result['events']++;
        }

        /* ------------------------------------------------------------ friendships */
        // Everyone is connected to the demo account, plus a ring of friends
        // between them so "people you may know" has mutual counts to show.
        $demoId = $userIds[0];

        $link = static function (int $a, int $b, string $status = 'accepted') use ($demoId): void {
            $low  = min($a, $b);
            $high = max($a, $b);
            Database::run(
                'INSERT INTO friendships (user_id_1, user_id_2, status, status_requested_by, responded_at)
                      VALUES (:a, :b, :s, :r, :t)
                 ON DUPLICATE KEY UPDATE status = VALUES(status)',
                [
                    'a' => $low,
                    'b' => $high,
                    's' => $status,
                    'r' => $a,
                    't' => $status === 'accepted' ? gmdate('Y-m-d H:i:s') : null,
                ]
            );
        };

        foreach ($userIds as $id) {
            // $userIds includes $demoId. Linking it to itself created a
            // friendship row with user_id_1 = user_id_2, which then showed up
            // in the demo user's own friend list and inflated friends_count.
            if ($id !== $demoId) {
                $link($demoId, $id);
            }
        }
        // A few extra connections between the other accounts.
        $link($userIds[1], $userIds[2]);
        $link($userIds[1], $userIds[3]);
        $link($userIds[2], $userIds[5]);
        $link($userIds[4], $userIds[6]);
        $link($userIds[9], $userIds[10]);
        $link($userIds[3], $userIds[12]);

        /* ------------------------------------------------- community membership */
        $memberships = [
            'cse-group'     => [0, 1, 2, 3, 6, 7, 11, 12, 14],
            'hackathon'     => [0, 1, 2, 3, 4, 11],
            'ai-explorers'  => [0, 1, 5, 8, 11],
            'app-forum'     => [0, 1, 4, 14],
            'computer-club' => [0, 1, 2, 6, 14],
            'photography'   => [0, 2, 6],
            'cultural'      => [0, 4, 6, 7],
            'efootball'     => [0, 2, 3, 6],
            'data-science'  => [0, 5, 14],
            'eee-bash'      => [0, 10],
            'english-forum' => [0, 12],
            'business-club' => [0, 7, 8],
            'sports'        => [0, 2, 6],
            'biotech'       => [0, 13],
            'pharmacy'      => [0, 13],
        ];

        foreach ($memberships as $slug => $indexes) {
            foreach ($indexes as $index) {
                if (!isset($userIds[$index], $communityIds[$slug])) {
                    continue;
                }
                Database::run(
                    'INSERT IGNORE INTO community_members (community_id, user_id, role)
                              VALUES (:c, :u, :r)',
                    [
                        'c' => $communityIds[$slug],
                        'u' => $userIds[$index],
                        'r' => $index === 0 ? 'admin' : 'member',
                    ]
                );
            }
        }

        /* ------------------------------------------------------------------ posts */
        // The demo account ($userIds[0]) needs posts of its own, otherwise the
        // profile page, the "my posts" tab and the sidebar post counter are all
        // empty on a fresh install.
        $postSpecs = [
            [$userIds[0], null, "Welcome to U-Link. This is your feed: follow a community, join a club, and the announcements land here.", null],
            [$userIds[0], 'cse-group', "Office hours for the compilers course moved to Thursday this week. Same room, 3pm to 5pm.", null],
            [$userIds[1], null, "Excited for the upcoming CSE Hackathon! Our team has been preparing for weeks. Wish us luck!", null],
            [$userIds[2], null, "Anyone have notes for FIN201? Midterm is coming up fast.", null],
            [$userIds[5], null, "Finally got my first transformer fine-tune under 4 GB of VRAM. Write-up coming this week.", null],
            [$userIds[6], 'photography', "Sunrise walk at the old city this morning. Golden hour does half the work for you.", 'jannat.jpg'],
            [$userIds[4], 'app-forum', "Showcase is in two weeks. If your app still crashes on rotation, come to lab 3 tonight.", null],
            [$userIds[3], null, "The library third floor is air conditioned again. Considering the last three weeks.", null],
            [$userIds[8], null, "Reminder: mid-semester project proposals are due Friday. Two pages, no more.", null],
            [$userIds[10], 'eee-bash', "Lab report template updated for the new course codes. Old ones will not upload.", null],
            [$userIds[12], 'english-forum', "Motion for next debate published. Come argue badly, it is more fun that way.", null],
            [$userIds[7], null, "Anyone else keep forgetting the internship portal closes at 5pm sharp? It is 4:40.", null],
            [$userIds[13], null, "Pharmacy club industry visit sign-ups are open. Twenty seats, first come first served.", null],
            [$userIds[11], null, "Three of us are doing the CTF on Saturday. Looking for one more, preferably someone who knows what a null byte is.", null],
            [$userIds[9], null, "Business club case competition brief is up. The scenario this year is a local grocery chain going digital.", null],
            [$userIds[5], 'ai-explorers', "Reading list for the transformers session. Two papers, one blog post, and the annotated implementation.", null],
            [$userIds[2], 'hackathon', "Registration closes tonight at midnight. Do it now, do not forget.", null],
            [$userIds[14], 'computer-club', "Built a rack out of two old desktops and a lot of zip ties. It works. Mostly.", null],
        ];

        $postIds = [];
        $now = time();

        foreach ($postSpecs as $offset => [$userId, $communitySlug, $content, $image]) {
            $imagePath = null;
            if ($image !== null && is_file(ULINK_BASE_PATH . '/Asserts/' . $image)) {
                $imagePath = 'Asserts/' . $image;
            }

            $postId = Database::insert('posts', [
                'user_id'      => $userId,
                'community_id' => $communitySlug !== null ? ($communityIds[$communitySlug] ?? null) : null,
                'content'      => $content,
                'image_url'    => $imagePath,
                'visibility'   => 'public',
            ]);
            $postIds[] = $postId;
            $result['posts']++;

            // Backdate so the feed has a believable timeline.
            Database::run(
                'UPDATE posts SET created_at = :t WHERE id = :id',
                ['t' => gmdate('Y-m-d H:i:s', $now - ($offset * 5400)), 'id' => $postId]
            );
        }

        /* --------------------------------------------------------------- comments */
        $commentSpecs = [
            [0, 2, "Best of luck! You guys are going to crush it!"],
            [0, 3, "See you there. May the best team win."],
            [0, 11, "The library has been booked solid, good luck finding a desk."],
            [1, 1, "I have chapter 3 and 4 summaries, message me."],
            [1, 8, "Which sections exactly? Chapter 4 is a lot for one night."],
            [2, 5, "VRAM or system RAM? Big difference for finetuning."],
            [2, 11, "That is a very small number and I am very jealous."],
            [3, 6, "That second shot is unreal."],
            [3, 0, "Where was this taken? The light is perfect."],
            [4, 2, "Will there be a recording for people who cannot make it?"],
            [6, 9, "Confirmed, I was there at 11am and it was still broken."],
            [11, 0, "I can do Saturday, though I will be useless until the last hour."],
            [13, 1, "Is the blog post the one on the annotated implementation?"],
        ];

        foreach ($commentSpecs as $offset => [$postIndex, $userIndex, $text]) {
            if (!isset($postIds[$postIndex], $userIds[$userIndex])) {
                continue;
            }
            $commentId = Database::insert('comments', [
                'post_id' => $postIds[$postIndex],
                'user_id' => $userIds[$userIndex],
                'content' => $text,
            ]);
            $result['comments']++;

            Database::run(
                'UPDATE comments SET created_at = :t WHERE id = :id',
                ['t' => gmdate('Y-m-d H:i:s', $now - (($offset + 1) * 1800)), 'id' => $commentId]
            );
        }

        /* ------------------------------------------------------------------ likes */
        foreach ($postIds as $postIndex => $postId) {
            $likers = $userIds;
            shuffle($likers);
            $howMany = 2 + ($postIndex % 5);
            foreach (array_slice($likers, 0, $howMany) as $liker) {
                if ($liker === Database::fetchValue('SELECT user_id FROM posts WHERE id = :id', ['id' => $postId])) {
                    continue; // nobody likes their own post
                }
                Database::run(
                    'INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (:p, :u)',
                    ['p' => $postId, 'u' => $liker]
                );
            }
        }

        /* --------------------------------------------------------- notifications */
        $notificationSpecs = [
            [$userIds[1], 'like',   $userIds[2],  'Nusrat Jahan liked your post',            0],
            [$userIds[1], 'comment', $userIds[3],  'Mehedi Hassan commented on your photo',  1],
            [$userIds[1], 'request', $userIds[12], 'Sabrina Nahar sent you a friend request', 2],
            [$userIds[1], 'group',   null,         'CSE Group: Hackathon registration closes tonight.', 3],
            [$userIds[1], 'event',   null,         'Reminder: Borshoboron is happening tomorrow.',    4],
            [$userIds[1], 'request_accepted', $userIds[4], 'Tania Akter accepted your friend request', 5],
        ];

        foreach ($notificationSpecs as $offset => [$userId, $type, $fromId, $content, $reference]) {
            $notificationId = Database::insert('notifications', [
                'user_id'      => $userId,
                'type'         => $type,
                'content'      => $content,
                'from_user_id' => $fromId,
                'reference_id' => $postIds[$reference] ?? null,
                'is_read'      => $offset > 4 ? 1 : 0,
            ]);

            Database::run(
                'UPDATE notifications SET created_at = :t WHERE id = :id',
                ['t' => gmdate('Y-m-d H:i:s', $now - (($offset + 1) * 1200)), 'id' => $notificationId]
            );
        }

        // A pending inbound request so the Friends > Requests tab is not empty.
        // The row has to be reset fully: an earlier run may have left an
        // *outgoing* pending request between the same two users, and only
        // flipping `status` would leave `status_requested_by` pointing the wrong
        // way, so the seeded request would never show up as incoming.
        //
        // `:requested_by` appears twice on purpose - once in VALUES, once in the
        // update clause - and so it needs two distinct placeholder names.
        // PDO connects with native prepares, which bind each name positionally
        // and reject a repeat with `SQLSTATE[HY093] Invalid parameter number`.
        // The single `:r` this used to have made the statement fail on every
        // fresh install, and because install.php reported the failure as a JSON
        // blob that setup.sh printed as a success, the demo data silently lost
        // everything below this line: the seeded conversation (so the Messages
        // tab opened empty) and the event RSVPs (so no event had an attendee).
        Database::run(
            'INSERT INTO friendships (user_id_1, user_id_2, status, status_requested_by, responded_at)
                  VALUES (:a, :b, \'pending\', :requested_by, NULL)
             ON DUPLICATE KEY UPDATE status = \'pending\',
                                     status_requested_by = :requested_by_update,
                                     responded_at = NULL',
            [
                'a' => min($demoId, $userIds[5]),
                'b' => max($demoId, $userIds[5]),
                'requested_by' => $userIds[5],
                'requested_by_update' => $userIds[5],
            ]
        );
        Database::insert('notifications', [
            'user_id'      => $demoId,
            'type'         => 'request',
            'content'      => ulink_user_name($userIds[5]) . ' sent you a friend request',
            'from_user_id' => $userIds[5],
            'reference_id' => (int) Database::fetchValue(
                'SELECT id FROM friendships WHERE user_id_1 = :a AND user_id_2 = :b',
                ['a' => min($demoId, $userIds[5]), 'b' => max($demoId, $userIds[5])]
            ),
            'is_read'      => 0,
        ]);

        /* ------------------------------------------------------------- messages */
        $messageSpecs = [
            [$demoId, $userIds[1], 'Are you going to the hackathon orientation on Friday?'],
            [$userIds[1], $demoId, 'Yes, should be there by four. Meet at the auditorium?'],
            [$userIds[1], $demoId, 'Works for me. I will grab seats near the front.'],
        ];

        foreach ($messageSpecs as $offset => [$senderId, $receiverId, $text]) {
            $messageId = Database::insert('messages', [
                'sender_id'   => $senderId,
                'receiver_id' => $receiverId,
                'message'     => $text,
                'is_read'     => $offset === 0 ? 0 : 1,
            ]);
            Database::run(
                'UPDATE messages SET created_at = :t WHERE id = :id',
                ['t' => gmdate('Y-m-d H:i:s', $now - (($offset + 1) * 600)), 'id' => $messageId]
            );
        }

        /* ------------------------------------------------------- event responses */
        Database::run(
            'INSERT IGNORE INTO event_interest (event_id, user_id, status) VALUES (1, :u, \'interested\')',
            ['u' => $demoId]
        );
        Database::run(
            'INSERT IGNORE INTO event_interest (event_id, user_id, status) VALUES (2, :u, \'interested\')',
            ['u' => $demoId]
        );

        $result['demo_login'] = 'saimon@uiu.ac.bd / ' . ULINK_DEMO_PASSWORD;

        return $result;
    }
}
