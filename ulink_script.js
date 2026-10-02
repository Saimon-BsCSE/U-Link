
//  U-Link – Application Script  (ulink_script.js)

// --- Mock Data & State ---
const MOCK_USERS = [
    { id: "101", name: "Sadika Rahman", dept: "CSE", role: "Student", batch: "211", pic: "Asserts/sadika_Rahman.jpeg" },
    { id: "102", name: "Rakib Hasan", dept: "BBA", role: "Student", batch: "203", pic: "Asserts/rakib.jpeg" },
    { id: "103", name: "Nusrat Jahan", dept: "EEE", role: "Student", batch: "221", pic: "Asserts/nusrat_jahan.jpeg" },
    { id: "104", name: "Dr. Ahmed Kabir", dept: "CSE", role: "Professor", batch: "N/A", pic: "Asserts/Dr. Ahmed Kabir.jpeg" },
    { id: "105", name: "Jamal Uddin", dept: "Admin", role: "Staff", batch: "N/A", pic: "Asserts/jamal.jpg" },
    { id: "106", name: "Tania Akter", dept: "Data Science", role: "Student", batch: "231", pic: "Asserts/tania.jpeg" },
    { id: "107", name: "Mehedi Hassan", dept: "CSE", role: "Student", batch: "223", pic: "Asserts/mehedi.jpeg" },
    { id: "108", name: "Priya Das", dept: "Pharmacy", role: "Student", batch: "225", pic: "Asserts/priya.jpeg" },
    { id: "109", name: "Arif Hossain", dept: "Civil", role: "Student", batch: "212", pic: "Asserts/arif.jpeg" },
    { id: "110", name: "Lamia Sultana", dept: "English", role: "Student", batch: "234", pic: "Asserts/lamia.jpeg" },
    { id: "111", name: "Omar Faruk", dept: "BBA", role: "Student", batch: "221", pic: "Asserts/faruk.jpeg" },
    { id: "112", name: "Dr. Farzana Islam", dept: "Pharmacy", role: "Professor", batch: "N/A", pic: "Asserts/Dr. Farzana Islam.jpeg" },
    { id: "113", name: "Ayesha Siddiqa", dept: "Architecture", role: "Student", batch: "211", pic: "Asserts/ayesha.jpeg" },
    { id: "114", name: "Kamrul Hasan", dept: "CSE", role: "Lecturer", batch: "N/A", pic: "Asserts/Kamrul Hasan.jpeg" },
    { id: "115", name: "Nazmul Huda", dept: "Economics", role: "Student", batch: "222", pic: "Asserts/nazmul.jpeg" },
    { id: "116", name: "Dr. Laila Zaman", dept: "BBA", role: "Professor", batch: "N/A", pic: "Asserts/Dr. Laila Zaman.jpeg" },
    { id: "117", name: "Rifat Ahmed", dept: "Civil", role: "Student", batch: "213", pic: "Asserts/rifat.jpeg" },
    { id: "118", name: "Shammi Akter", dept: "IT Support", role: "Staff", batch: "N/A", pic: "Asserts/shammi.jpeg" },
    { id: "119", name: "Fahim Faysal", dept: "EEE", role: "Student", batch: "233", pic: "Asserts/fahim.jpeg" },
    { id: "120", name: "Sumaiya Binte", dept: "Pharmacy", role: "Lecturer", batch: "N/A", pic: "Asserts/sumaiya.jpeg" },
    { id: "121", name: "Tahsin Alam", dept: "Data Science", role: "Student", batch: "232", pic: "Asserts/tahsin.jpeg" },
    { id: "122", name: "Asma Ul Husna", dept: "English", role: "Student", batch: "221", pic: "Asserts/asma.jpeg" },
    { id: "123", name: "Syed Muntasir", dept: "CSE", role: "Student", batch: "201", pic: "Asserts/sayed.jpeg" },
    { id: "124", name: "Dr. Rafiqul Ali", dept: "Civil", role: "Faculty", batch: "N/A", pic: "Asserts/rafikul.jpeg" },
    { id: "125", name: "Jannatul Ferdaus", dept: "BBA", role: "Student", batch: "211", pic: "Asserts/jannat.jpg" },
    { id: "126", name: "Sara Islam", dept: "Pharmacy", role: "Student", batch: "223", pic: "Asserts/sara.jpeg" },
    { id: "127", name: "Tanvir Ahmed", dept: "EEE", role: "Student", batch: "212", pic: "Asserts/tanvir.jpeg" },
    { id: "128", name: "Sabina Yeasmin", dept: "BBA", role: "Student", batch: "202", pic: "Asserts/sabrina.jpeg" },
    { id: "129", name: "Mahir Chowdhury", dept: "CSE", role: "Student", batch: "231", pic: "Asserts/mahir.jpeg" },
    { id: "130", name: "Nishat Mazumder", dept: "Civil", role: "Student", batch: "221", pic: "Asserts/nishat.jpeg" },
    { id: "131", name: "Dr. Shiblee Imtiaz", dept: "CSE", role: "Professor", batch: "N/A", pic: "Asserts/shibli.jpeg" },
    { id: "132", name: "Rina Akter", dept: "Admin", role: "Staff", batch: "N/A", pic: "Asserts/rina.jpeg" },
    { id: "133", name: "Nafis Iqbal", dept: "Data Science", role: "Student", batch: "222", pic: "Asserts/nafis.jpeg" },
    { id: "134", name: "Zerin Khan", dept: "Architecture", role: "Student", batch: "213", pic: "Asserts/zerin.jpeg" },
    { id: "135", name: "Hasan Mahmud", dept: "Economics", role: "Student", batch: "233", pic: "Asserts/hasan.jpeg" }
];

const MOCK_EVENTS = [
    { id: 'e1', title: 'Borshoboron (Pohela Boishakh)', date: '15', month: 'APR', location: 'UIU Playground', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60', desc: 'Join us in celebrating the Bengali New Year with traditional food, cultural performances, and the grand rally! Registration includes food token.', interested: null },
    { id: 'e2', title: 'UIU National Career Fair 2026', date: '22', month: 'MAY', location: 'School of Business (2nd floor)', img: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&auto=format&fit=crop&q=60', desc: 'Over 50 top tech and business companies hiring for internships and full-time positions. Bring your resumes! Open to all UIU students.', interested: null },
    { id: 'e3', title: 'Advanced Machine Learning Lab', date: '05', month: 'JUN', location: 'Department of CSE (4th floor)', img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60', desc: 'Hands-on workshop covering neural network architectures using PyTorch. Hosted by the UIU Data Science Club. Limited seats! Laptop required.', interested: null },
    { id: 'e4', title: 'Inter-University Hackathon', date: '12', month: 'MAY', location: 'Department of CSE (4th floor)', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', desc: 'Join a 48-hour coding sprint. Build impactful projects and win amazing prizes provided by Google and AWS! Minimum team size 3.', interested: null },
    { id: 'e5', title: 'Final Year Project Show', date: '18', month: 'JUN', location: 'Department of EEE (5th floor)', img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=60', desc: 'Explore the amazing capstone projects from the graduating class. From smart robotics to AI web apps! Open for all.', interested: null },
    { id: 'e6', title: 'Winter Acoustic Concert', date: '20', month: 'DEC', location: 'UIU Playground', img: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop&q=60', desc: 'Vibe with local bands and UIU\'s finest acoustic performers under the winter sky. Coffee and snacks stalls available.', interested: null },
    { id: 'e7', title: 'Startup Pitch Deck Competition', date: '09', month: 'JUL', location: 'School of Business (2nd floor)', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=60', desc: 'Got a million dollar idea? Pitch it directly to local VC firms! Win up to 5 Lakhs seed funding.', interested: null },
    { id: 'e8', title: 'Civil & Architectural Expo', date: '11', month: 'AUG', location: 'UIU Gallery', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60', desc: 'Showcasing brilliant 3D printed structural models and smart city designs from the UIU Civil Department.', interested: null },
    { id: 'e9', title: 'Health & Life Science Camp', date: '14', month: 'SEP', location: 'School of Life-Science (9th floor)', img: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=60', desc: 'Free blood donation camp and health checkups! Organized by the Pharmacy and Health Sciences department.', interested: null },
    { id: 'e10', title: 'CSE Hackathon 2025', date: '18', month: 'MAY', location: 'UIU Auditorium', img: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&auto=format&fit=crop&q=60', desc: 'Join the biggest internal CSE hackathon. 24 hours to build something amazing!', interested: null },
    { id: 'e11', title: 'Photography Club Shoot', date: '22', month: 'MAY', location: 'Campus Garden', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60', desc: 'A hands-on portrait shooting session with the UIU Photography Club. Bring your gear!', interested: null },
    { id: 'e12', title: 'UIU Cultural Fest 2025', date: '03', month: 'JUN', location: 'Main Stage', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60', desc: 'Annual cultural extravaganza featuring drama, poetry, and live music performances.', interested: null }
];

const MOCK_COMMUNITIES = [
    { id: 'c1', name: 'CSE Society', members: '2.4k', icon: 'computer', pic: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=200&fit=crop', cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80', feedImages: ['https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60'] },
    { id: 'c2', name: 'UIU Photography Club', members: '1.8k', icon: 'photo_camera', pic: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&h=200&fit=crop', cover: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&auto=format&fit=crop&q=80', feedImages: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&auto=format&fit=crop&q=60'] },
    { id: 'c3', name: 'EEE Bash', members: '2.1k', icon: 'bolt', pic: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=200&fit=crop', cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80', feedImages: ['https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&auto=format&fit=crop&q=60'] },
    { id: 'c4', name: 'UIU Mars Rover Team', members: '340', icon: 'rocket_launch', pic: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=200&h=200&fit=crop', cover: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1200&auto=format&fit=crop&q=80', feedImages: ['https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&auto=format&fit=crop&q=60'] },
    { id: 'c5', name: 'UIU Cultural Club', members: '4.2k', icon: 'theater_comedy', pic: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80', feedImages: ['https://images.unsplash.com/photo-1493225457124-a1a2a5ea3761?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=60'] },
    { id: 'c6', name: 'UIU APP Forum', members: '1.5k', icon: 'apps', pic: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=200&h=200&fit=crop', cover: 'https://images.unsplash.com/photo-1607519782500-1123999905c5?w=1200&auto=format&fit=crop&q=80', feedImages: ['https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=800&auto=format&fit=crop&q=60'] },
    { id: 'c7', name: 'UIU AI Explorers', members: '890', icon: 'psychology', pic: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=200&fit=crop', cover: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&auto=format&fit=crop&q=80', feedImages: ['https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=60'] },
    { id: 'c8', name: 'UIU English Language Forum', members: '1.1k', icon: 'record_voice_over', pic: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop', cover: 'https://images.unsplash.com/photo-1455390582262-044cdead27d8?w=1200&auto=format&fit=crop&q=80', feedImages: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=60'] },
    { id: 'c9', name: 'UIU Efootball Community', members: '1.9k', icon: 'sports_esports', pic: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&h=200&fit=crop', cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80', feedImages: ['https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&auto=format&fit=crop&q=60', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60'] },
    { id: 'c10', name: 'UIU Sports Club', members: '3.1k', icon: 'sports_soccer', pic: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=200&h=200&fit=crop', cover: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=1200&auto=format&fit=crop&q=80', feedImages: [] },
    { id: 'c11', name: 'UIU Computer Club', members: '2.8k', icon: 'memory', pic: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&h=200&fit=crop', cover: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80', feedImages: [] },
    { id: 'c12', name: 'UIU Business Club', members: '2.5k', icon: 'cases', pic: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&h=200&fit=crop', cover: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&auto=format&fit=crop&q=80', feedImages: [] },
    { id: 'c13', name: 'UIU Biotechnology Club', members: '1.2k', icon: 'biotech', pic: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=200&h=200&fit=crop', cover: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&auto=format&fit=crop&q=80', feedImages: [] },
    { id: 'c14', name: 'UIU Pharmacy Club', members: '1.4k', icon: 'medication', pic: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=200&fit=crop', cover: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&auto=format&fit=crop&q=80', feedImages: [] },
    { id: 'c15', name: 'UIU Data Science Club', members: '1.8k', icon: 'query_stats', pic: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop', cover: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80', feedImages: [] }
];

const MOCK_COMMUNITY_POSTS = {}; // Will be populated dynamically

const state = {
    user: null,
    activeChatUserId: null,
    activeMessagesUserId: null,
    // The File queued for the next message, if any. Held outside chatHistory
    // because it is never stored - it only exists between picking it and the
    // send completing.
    pendingAttachment: null,
    chatHistory: {},
    notifications: [
        { id: 1, type: "like", text: "Sadika Rahman liked your post", read: false },
        { id: 2, type: "request", text: "Rakib Hasan sent you a friend request", read: false, fromId: "102" },
        { id: 3, type: "request", text: "Tania Akter sent you a friend request", read: false, fromId: "106" },
        { id: 4, type: "group", text: "CSE GROUP: New announcement posted regarding Hackathon finals.", read: false },
        { id: 5, type: "group", text: "HACKATHON GROUP: Registration closes tomorrow!", read: false },
        { id: 6, type: "group", text: "CULTURAL GROUP: Annual fest meeting at 3 PM in Room 102.", read: false },
        { id: 7, type: "like", text: "Mehedi Hassan reacted ❤️ to your post", read: false },
        { id: 8, type: "comment", text: "Omar Faruk commented on your photo", read: false },
        { id: 9, type: "event", text: "Reminder: 'Borshoboron (Pohela Boishakh)' is happening tomorrow!", read: false },
        { id: 10, type: "mention", text: "Ayesha Siddiqa mentioned you in a post in UIU AI Explorers.", read: false },
        { id: 11, type: "like", text: "Kamrul Hasan liked your comment on the programming hub.", read: false },
        { id: 12, type: "group", text: "UIU Efootball Community: Tournament brackets are live!", read: true },
        { id: 13, type: "event", text: "Dr. Laila Zaman invited you to 'Startup Pitch Deck Competition'.", read: true }
    ],
    friends: ["101", "103", "104", "109", "110", "111", "112", "113", "114", "115"],
    friendRequests: ["102", "106", "107", "119", "122", "129", "133"],  // incoming requests
    joinedCommunities: [], // Definitively empty so join logic works natively
    pendingCommunities: [],
    contactsExpanded: false,
    // The signed-in user's own posts, fetched separately from the newsfeed page.
    myPosts: [],
    // Which list the home feed is showing: the main newsfeed ('feed'), every
    // campus post including communities ('campus'), or the viewer's private
    // bookmarks ('saved'). See setFeedScope()/renderFeed().
    feedScope: 'feed',
    // Paging for the home feed. renderFeed() loads one page at a time and the
    // bottom sentinel pulls the next. When the server runs out of rows we
    // recycle the loaded page so the feed never hits a hard end.
    feedOffset: 0,
    feedLimit: 10,
    feedHasMore: true,
    feedLoading: false,
    feedCycle: 0,
    feedObserver: null,
    // Bumped by every full (non-append) render so a slow response for a scope
    // the user has already left cannot repaint over the current one.
    feedSeq: 0,
    // Explore hub. `exploreData` caches the single /explore.php payload so the
    // four tabs render without four requests; `exploreTab` remembers the open
    // tab across navigation.
    exploreData: null,
    exploreTab: 'discover',
    // Events. `events` holds the rows for the currently selected scope, fetched
    // from /events/list.php separately from the bootstrap payload (which is
    // upcoming-only), and `eventScope` is one of upcoming|going|past|all.
    events: [],
    eventScope: 'upcoming',
    // Distinguishes "scope not fetched yet" from "fetched and genuinely empty".
    eventsLoaded: false,
    // Post ids the viewer chose to hide from their own feed. This is a local
    // preference (like a muted word), so it lives in localStorage rather than
    // the database; the key is namespaced per account so two people on the same
    // browser do not share a hide list.
    hiddenPosts: new Set(),
    // The post currently being reported, while #report-overlay is open.
    reportPostId: null,
    posts: [
        {
            id: 1, userId: "101",
            text: "Excited for the upcoming CSE Hackathon! 🚀 Our team has been preparing for weeks. Wish us luck!",
            image: "", likes: 145, comments: 5, liked: false,
            commentsList: [
                { id: 101, userId: "102", name: "Rakib Hasan", text: "Best of luck! You guys are going to crush it! 💪" },
                { id: 102, userId: "103", name: "Nusrat Jahan", text: "See you there! May the best team win 🏆" },
                { id: 103, userId: "105", name: "Jamal Uddin", text: "Make us proud! Rooting for you all 🎉" },
                { id: 104, userId: "104", name: "Dr. Ahmed Kabir", text: "Great initiative! Keep pushing the boundaries of innovation." },
                { id: 105, userId: "107", name: "Mehedi Hassan", text: "Let's go team! The library's been booked solid 😂" }
            ]
        },
        {
            id: 2, userId: "102",
            text: "Anyone have notes for FIN201? Midterm is coming up fast!!! 😬",
            image: "", likes: 12, comments: 3, liked: false,
            commentsList: [
                { id: 108, userId: "103", name: "Nusrat Jahan", text: "I have chapter 3 & 4 summaries, ping me 📖" },
                { id: 109, userId: "111", name: "Omar Faruk", text: "Check the master drive link pinned in our WhatsApp group!" },
                { id: 110, userId: "101", name: "Sadika Rahman", text: "Count me in if you find them! Same boat here 😅" }
            ]
        },
        {
            id: 3, userId: "103",
            text: "The annual UIU Cultural Fest was absolutely AMAZING! 🎭🎶 Can't wait for next year. Who else was there?",
            image: "", likes: 234, comments: 4, liked: false,
            commentsList: [
                { id: 111, userId: "102", name: "Rakib Hasan", text: "It was incredible! The dance performance blew my mind 🔥" },
                { id: 112, userId: "101", name: "Sadika Rahman", text: "Already bought the tickets for next year! 😄" },
                { id: 113, userId: "105", name: "Jamal Uddin", text: "Lovely to see everyone enjoying themselves!" },
                { id: 114, userId: "110", name: "Lamia Sultana", text: "The poetry segment was my favourite part 🌸" }
            ]
        },
        {
            id: 4, userId: "101",
            text: "Sharing my complete Web Programming notes for the final exam! Drive link in the comments 📚✨",
            image: "", likes: 189, comments: 5, liked: false,
            commentsList: [
                { id: 115, userId: "103", name: "Nusrat Jahan", text: "Thank you so much!! Truly a life saver 🙏" },
                { id: 116, userId: "102", name: "Rakib Hasan", text: "Appreciate it so much, you're the best!" },
                { id: 117, userId: "107", name: "Mehedi Hassan", text: "Legend move! Sharing is caring 🫶" },
                { id: 118, userId: "106", name: "Tania Akter", text: "You're amazing Sadika! Sending good karma your way ✨" },
                { id: 119, userId: "109", name: "Arif Hossain", text: "Just what I needed before the exam, thanks!" }
            ]
        },
        {
            id: 5, userId: "104",
            text: "📢 REMINDER: Data Structures makeup class is scheduled for TOMORROW at 10 AM in Room 405. Attendance mandatory. Please be on time.",
            image: "", likes: 120, comments: 3, liked: false,
            commentsList: [
                { id: 120, userId: "102", name: "Rakib Hasan", text: "Noted Sir, will be there on time! 🙏" },
                { id: 121, userId: "103", name: "Nusrat Jahan", text: "Will be there! Thank you for the reminder." },
                { id: 122, userId: "107", name: "Mehedi Hassan", text: "Perfect timing, I was just looking for this info!" }
            ]
        },
        {
            id: 6, userId: "105",
            text: "⚠️ Campus cafeteria will be CLOSED this Friday for maintenance works. Please make alternate arrangements for lunch.",
            image: "", likes: 45, comments: 2, liked: false,
            commentsList: [
                { id: 123, userId: "101", name: "Sadika Rahman", text: "Thanks for the heads up! Going off-campus then 🍜" },
                { id: 124, userId: "109", name: "Arif Hossain", text: "Good to know! Appreciate the timely notice." }
            ]
        },
        {
            id: 7, userId: "106",
            text: "Just submitted my final project on Machine Learning-based traffic prediction for Dhaka city 🤖🚦 It's been a wild 3-month ride but we did it!",
            image: "", likes: 312, comments: 6, liked: false,
            commentsList: [
                { id: 125, userId: "101", name: "Sadika Rahman", text: "That sounds absolutely fascinating!! Congrats 🎉" },
                { id: 126, userId: "107", name: "Mehedi Hassan", text: "Bro this is next level! When is the presentation?" },
                { id: 127, userId: "104", name: "Dr. Ahmed Kabir", text: "Excellent work Tania! Looking forward to your presentation." },
                { id: 128, userId: "108", name: "Priya Das", text: "We need more projects like this! So impactful 🙌" },
                { id: 129, userId: "110", name: "Lamia Sultana", text: "Wow, that's incredible! You're an inspiration ✨" },
                { id: 130, userId: "102", name: "Rakib Hasan", text: "Proud of you!! Can't wait to see the results." }
            ]
        },
        {
            id: 8, userId: "107",
            text: "UIU Table Tennis Inter-Department Tournament results are in! 🏓 CSE takes GOLD!! Shoutout to the whole team 🥇",
            image: "", likes: 278, comments: 4, liked: false,
            commentsList: [
                { id: 131, userId: "101", name: "Sadika Rahman", text: "CSE FOREVER!!! 🔥🔥" },
                { id: 132, userId: "103", name: "Nusrat Jahan", text: "EEE will get you next time 😤 Congrats though!" },
                { id: 133, userId: "111", name: "Omar Faruk", text: "BBA in shambles lol. Well played guys!! 🏆" },
                { id: 134, userId: "109", name: "Arif Hossain", text: "Absolute legends! Watching from the sidelines was electric." }
            ]
        },
        {
            id: 9, userId: "108",
            text: "Friendly reminder to everyone: World Pharmacist Day is next week! 💊 Come visit our awareness booth in the quad 9AM–4PM. Free health screenings!",
            image: "", likes: 98, comments: 3, liked: false,
            commentsList: [
                { id: 135, userId: "105", name: "Jamal Uddin", text: "Great initiative! Will announce this on the board too 👍" },
                { id: 136, userId: "106", name: "Tania Akter", text: "Will definitely be there! Love this kind of community event!" },
                { id: 137, userId: "110", name: "Lamia Sultana", text: "Thank you for doing this Priya! So important 💪" }
            ]
        },
        {
            id: 10, userId: "112",
            text: "📣 EEE Lab Update: The new Robotics Lab equipment has arrived! Students enrolled in EEE 405 can start using the facilities from Monday. Please check your schedule!",
            image: "", likes: 156, comments: 4, liked: false,
            commentsList: [
                { id: 138, userId: "103", name: "Nusrat Jahan", text: "This is huge!! Finally the equipment we've been waiting for 😭" },
                { id: 139, userId: "109", name: "Arif Hossain", text: "Amazing news Dr. Farzana! Civil students are jealous 😄" },
                { id: 140, userId: "107", name: "Mehedi Hassan", text: "Can CSE students visit? We'd love to collaborate!" },
                { id: 141, userId: "112", name: "Dr. Farzana Islam", text: "Of course! Reach out via email to schedule cross-dept sessions 🤝" }
            ]
        },
        {
            id: 11, userId: "109",
            text: "Our Civil Engineering capstone bridge design just got selected for the National Youth Engineering Competition 🌉 UIU representing! Any support from the community would mean the world.",
            image: "", likes: 430, comments: 5, liked: false,
            commentsList: [
                { id: 142, userId: "104", name: "Dr. Ahmed Kabir", text: "Phenomenal achievement! UIU is proud of you all 🎊" },
                { id: 143, userId: "101", name: "Sadika Rahman", text: "This is AMAZING Arif!! 🏆 You're going to win it!" },
                { id: 144, userId: "106", name: "Tania Akter", text: "Following this journey! Please post updates 🙏" },
                { id: 145, userId: "111", name: "Omar Faruk", text: "Big ups!! Entire campus is behind you guys 💪" },
                { id: 146, userId: "108", name: "Priya Das", text: "Go go go!! Break a leg (not literally 😂) you've got this!" }
            ]
        },
        {
            id: 12, userId: "110",
            text: "Poem of the week 🌸\n\n'The campus hums with whispered dreams,\nBetween the clauses, coffee steams.\nWe learn, we fail, we rise again—\nUIU, where we find our pen.' ✍️\n\nFeedback welcome!",
            image: "", likes: 201, comments: 3, liked: false,
            commentsList: [
                { id: 147, userId: "103", name: "Nusrat Jahan", text: "Absolutely beautiful! 😭 This hit different during exam week." },
                { id: 148, userId: "108", name: "Priya Das", text: "Wow, this gave me chills! Talent right here 🌟" },
                { id: 149, userId: "105", name: "Jamal Uddin", text: "Very touching words. Thank you for sharing this gem." }
            ]
        },
        {
            id: 13, userId: "123",
            text: "Late night coding session at the library. The grind never stops! 💻☕ #CSElife #UIU",
            image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&auto=format&fit=crop&q=60",
            likes: 156, comments: 4, liked: false,
            commentsList: [
                { id: 150, userId: "101", name: "Sadika Rahman", text: "Don't forget to stay hydrated! 💧" },
                { id: 151, userId: "129", name: "Mahir Chowdhury", text: "I'm on the 3rd floor, come say hi!" }
            ]
        },
        {
            id: 14, userId: "126",
            text: "Finally finished our lab report on organic chemistry! Chemistry is tough but so rewarding. 🧪📖",
            image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format&fit=crop&q=60",
            likes: 89, comments: 2, liked: false,
            commentsList: [
                { id: 152, userId: "108", name: "Priya Das", text: "Congrats Sara! That lab was a nightmare lol." }
            ]
        },
        {
            id: 15, userId: "127",
            text: "Sunset at UIU campus is just something else. ❤️ Campus beauty never gets old. 🌅",
            image: "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&auto=format&fit=crop&q=60",
            likes: 542, comments: 12, liked: false,
            commentsList: [
                { id: 153, userId: "103", name: "Nusrat Jahan", text: "Wow, what a shot!! 😍" },
                { id: 154, userId: "134", name: "Zerin Khan", text: "Perfect timing!" }
            ]
        },
        {
            id: 16, userId: "130",
            text: "Testing our bridge model for the structural mechanics project. Fingers crossed! 🌉🏗️",
            image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&auto=format&fit=crop&q=60",
            likes: 210, comments: 5, liked: false,
            commentsList: [
                { id: 155, userId: "109", name: "Arif Hossain", text: "Good luck guys! You got this." }
            ]
        },
        {
            id: 17, userId: "133",
            text: "Exploring the new Data Science lab setup. Exciting times ahead with Big Data! 📊🤖",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60",
            likes: 175, comments: 3, liked: false,
            commentsList: [
                { id: 156, userId: "104", name: "Dr. Ahmed Kabir", text: "Make the most of it, Nafis!" }
            ]
        },
        {
            id: 18, userId: "128",
            text: "Group study session for the midterm. Business ethics can be quite debatable! 📚📈",
            image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=60",
            likes: 132, comments: 4, liked: false,
            commentsList: [
                { id: 157, userId: "102", name: "Rakib Hasan", text: "Save me a seat next time!" }
            ]
        },
        {
            id: 19, userId: "134",
            text: "Working on my 3D model for the sustainable housing project. Slow progress but steady. 🏠📐",
            image: "https://images.unsplash.com/photo-1503387762-592ed58ee44b?w=800&auto=format&fit=crop&q=60",
            likes: 289, comments: 7, liked: false,
            commentsList: [
                { id: 158, userId: "113", name: "Ayesha Siddiqa", text: "That looks amazing, Zerin!" }
            ]
        },
        {
            id: 20, userId: "135",
            text: "Analyzing GDP growth trends for the Economics assignment. Numbers don't lie! 📉🤔",
            image: "https://images.unsplash.com/photo-1543286386-2e659306cd6c?w=800&auto=format&fit=crop&q=60",
            likes: 67, comments: 1, liked: false,
            commentsList: []
        },
        {
            id: 21, userId: "121",
            text: "Just hit a new PR at the campus gym! Feeling energized. 💪🏋️‍♂️ #UIUfitness",
            image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop&q=60",
            likes: 310, comments: 8, liked: false,
            commentsList: [
                { id: 159, userId: "111", name: "Omar Faruk", text: "Nice work bro! Getting strong." }
            ]
        },
        {
            id: 22, userId: "122",
            text: "Fresh flowers from the campus garden. Spring is officially here! 🌸🌿 #UIUBeauty",
            image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop&q=60",
            likes: 425, comments: 10, liked: false,
            commentsList: [
                { id: 160, userId: "110", name: "Lamia Sultana", text: "So pretty! I saw them this morning too." }
            ]
        },
        {
            id: 23, userId: "107",
            text: "Friday morning football with the boys! Best way to start the weekend. ⚽🏃‍♂️",
            image: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800&auto=format&fit=crop&q=60",
            likes: 215, comments: 6, liked: false,
            commentsList: [
                { id: 161, userId: "131", name: "Dr. Shiblee Imtiaz", text: "Keep it up! Sports are essential for health." }
            ]
        },
        {
            id: 24, userId: "103",
            text: "Designing my first PCB for the microcontrollers course. Loving the process! ⚡🔌",
            image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60",
            likes: 198, comments: 4, liked: false,
            commentsList: [
                { id: 162, userId: "112", name: "Dr. Farzana Islam", text: "Excellent precision, Nusrat!" }
            ]
        },
        {
            id: 25, userId: "125",
            text: "UIU Entrepreneurship Club meeting today. So many inspiring ideas! 💡🚀 #Startups",
            image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=60",
            likes: 145, comments: 3, liked: false,
            commentsList: [
                { id: 163, userId: "116", name: "Dr. Laila Zaman", text: "Great energy in the room today." }
            ]
        },
        {
            id: 26, userId: "117",
            text: "Site visit for our survey class. Practical learning is always better! 🏗️📏",
            image: "https://images.unsplash.com/photo-1503387762-592ed58ee44b?w=800&auto=format&fit=crop&q=60",
            likes: 182, comments: 2, liked: false,
            commentsList: [
                { id: 164, userId: "124", name: "Dr. Rafiqul Ali", text: "Hope you learned a lot today, Rifat." }
            ]
        },
        {
            id: 27, userId: "115",
            text: "Debate competition prep. Researching our points for the final round. 🗣️🏛️",
            image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=60",
            likes: 120, comments: 5, liked: false,
            commentsList: [
                { id: 165, userId: "110", name: "Lamia Sultana", text: "You guys will be amazing!" }
            ]
        },
        {
            id: 28, userId: "111",
            text: "Coffee break with friends in between classes. Much needed! ☕🍩",
            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=60",
            likes: 245, comments: 9, liked: false,
            commentsList: [
                { id: 166, userId: "128", name: "Sabina Yeasmin", text: "Next round is on me!" }
            ]
        },
        {
            id: 29, userId: "109",
            text: "Rainy day at campus. The view from the library is so peaceful. 🌧️📚",
            image: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop&q=60",
            likes: 389, comments: 14, liked: false,
            commentsList: [
                { id: 167, userId: "101", name: "Sadika Rahman", text: "I love this weather! ⛈️" }
            ]
        },
        {
            id: 30, userId: "131",
            text: "Just published my latest research paper on Artificial Intelligence in Healthcare. UIU is making strides! 🏥🤖",
            image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60",
            likes: 670, comments: 25, liked: false,
            commentsList: [
                { id: 168, userId: "104", name: "Dr. Ahmed Kabir", text: "Congratulations Shiblee! Great work." },
                { id: 169, userId: "106", name: "Tania Akter", text: "This is inspiring, Sir!" }
            ]
        },
        {
            id: 31, userId: "132",
            text: "Remember to collect your ID cards from the admin office if you haven't yet! 🆔🏛️",
            image: "", likes: 56, comments: 12, liked: false,
            commentsList: [
                { id: 170, userId: "129", name: "Mahir Chowdhury", text: "Will be there soon!" }
            ]
        },
        {
            id: 32, userId: "102",
            text: "Gaming tournament registrations are live! Who's in for League of Legends? 🎮🔥",
            image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60",
            likes: 198, comments: 34, liked: false,
            commentsList: [
                { id: 171, userId: "121", name: "Tahsin Alam", text: "Count me in!!" }
            ]
        }
    ]
};

// -- Toast Notifications --
/**
 * Show a toast notification to the user
 * @param {string} message - The message to display
 * @param {string} type - Type of toast: 'success', 'error', 'info', 'warning' (default: 'info')
 * @param {number} duration - Duration in milliseconds before auto-dismiss (default: 4500)
 */
function showToast(message, type = 'info', duration = 4500, action = null) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn('Toast container not found');
        return;
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notif';
    
    // Add type-specific styling
    if (type === 'success' || type === 'accepted') {
        toast.classList.add('toast-accepted');
    }

    // Determine icon
    let iconName = 'info';
    if (type === 'success' || type === 'accepted') {
        iconName = 'check_circle';
    } else if (type === 'error') {
        iconName = 'error';
    } else if (type === 'warning') {
        iconName = 'warning';
    }

    const actionHtml = action && action.label
        ? `<button type="button" data-toast-action class="ml-auto shrink-0 text-xs font-extrabold uppercase tracking-wide text-primary hover:underline">${escapeHtml(action.label)}</button>`
        : '';

    toast.innerHTML = `
        <span class="material-symbols-outlined">${iconName}</span>
        <div>
            <p class="font-medium text-sm">${message}</p>
        </div>
        ${actionHtml}
        <button class="${actionHtml ? '' : 'ml-auto '}shrink-0 text-slate-400 hover:text-slate-600" onclick="this.closest('.toast-notif').remove()">
            <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
    `;

    if (actionHtml) {
        const actionBtn = toast.querySelector('[data-toast-action]');
        if (actionBtn) {
            actionBtn.addEventListener('click', () => {
                try {
                    action.onClick();
                } finally {
                    toast.remove();
                }
            });
        }
    }

    container.appendChild(toast);

    // Auto-dismiss after duration
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-dismiss');
            setTimeout(() => toast.remove(), 320);
        }
    }, duration);
}

/**
 * Show an error message
 */
function showError(message, duration = 5000) {
    showToast(message, 'error', duration);
}

/**
 * Show a success message
 */
function showSuccess(message, duration = 3000) {
    showToast(message, 'success', duration);
}

// -- Confirmation dialog -----------------------------------------------------
//
// A native browser confirmation blocks the main thread, cannot be styled to
// match the app and reads as a browser dialog rather than part of the product.
// Every caller here sits inside an async function, so a promise-returning
// replacement is a drop-in: `if (!await showConfirm('...')) return;`
let confirmResolver = null;

function showConfirm(message, options = {}) {
    const title = options.title || 'Are you sure?';
    const confirmText = options.confirmText || 'Confirm';
    const cancelText = options.cancelText || 'Cancel';
    const icon = options.icon || 'help';
    const danger = options.danger === true;

    const overlay = document.getElementById('confirm-overlay');
    if (!overlay) {
        // The overlay ships in index.html, so this means the markup and the
        // script are out of step. Refuse the action rather than falling back to
        // a browser dialog; nothing in the product is allowed to use one.
        console.warn('Confirm overlay not found; refusing the action.');
        return Promise.resolve(false);
    }

    const okBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');
    const iconEl = document.getElementById('confirm-icon');

    // textContent, not innerHTML: the message can carry user-supplied names.
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    iconEl.textContent = icon;
    okBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;

    // A destructive confirmation is the one case where a filled brand button
    // sends the wrong signal, so it swaps to the error container.
    okBtn.classList.toggle('bg-error-container', danger);
    okBtn.classList.toggle('text-on-error-container', danger);
    okBtn.classList.toggle('bg-primary', !danger);
    okBtn.classList.toggle('text-on-primary', !danger);

    // Opening a second question while one is pending settles the first, so the
    // caller awaiting it is never left hanging on a promise nobody will resolve.
    if (confirmResolver) {
        const stale = confirmResolver;
        confirmResolver = null;
        stale(false);
    }

    overlay.classList.remove('hidden');
    overlay.classList.add('flex');

    return new Promise((resolve) => {
        confirmResolver = resolve;
        // Focus after the display flip, otherwise the browser cannot scroll the
        // button into view and focus silently stays on <body>.
        requestAnimationFrame(() => okBtn.focus());
    });
}

function closeConfirm(answer) {
    const overlay = document.getElementById('confirm-overlay');
    if (!overlay) return;

    overlay.classList.add('hidden');
    overlay.classList.remove('flex');

    const resolve = confirmResolver;
    confirmResolver = null;
    if (resolve) resolve(answer === true);
}

(function initConfirmDialog() {
    const overlay = document.getElementById('confirm-overlay');
    if (!overlay) return;

    document.getElementById('confirm-ok')
        .addEventListener('click', () => closeConfirm(true));
    document.getElementById('confirm-cancel')
        .addEventListener('click', () => closeConfirm(false));

    // Clicking the scrim is the usual "dismiss without deciding".
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeConfirm(false);
    });

    document.addEventListener('keydown', (event) => {
        if (confirmResolver && event.key === 'Escape') closeConfirm(false);
    });
})();

// -- Picture lightbox ---------------------------------------------------------
//
// Message pictures are fetched as blobs so the participant check runs, and the
// blob is shown through an object URL. The lightbox does not own that URL - the
// thread's render does - so opening and closing is just a class toggle.
let imageViewerPrevFocus = null;

function openImageViewer(url) {
    const overlay = document.getElementById('image-viewer-overlay');
    const img = document.getElementById('image-viewer-img');
    if (!overlay || !img || !url) return;

    imageViewerPrevFocus = document.activeElement;

    img.src = url;
    img.alt = 'Shared picture, enlarged';
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');

    requestAnimationFrame(() => {
        const close = overlay.querySelector('button');
        if (close) close.focus();
    });
}

function closeImageViewer() {
    const overlay = document.getElementById('image-viewer-overlay');
    if (!overlay) return;

    overlay.classList.add('hidden');
    overlay.classList.remove('flex');

    const img = document.getElementById('image-viewer-img');
    if (img) img.removeAttribute('src');   // stop the full-size decode

    if (imageViewerPrevFocus && imageViewerPrevFocus.isConnected) {
        imageViewerPrevFocus.focus();
    }
    imageViewerPrevFocus = null;
}

(function initImageViewer() {
    const overlay = document.getElementById('image-viewer-overlay');
    if (!overlay) return;

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !overlay.classList.contains('hidden')) {
            closeImageViewer();
        }
    });
})();


let activeTab = 'home';
let activeCommunityId = null;
let currentOtherUserId = null;
let uploadedImageBase64 = "";
let activeFriendsTab = 'all';
let selectedFeeling = { home: '', profile: '', community: '' };


// --- Authentication ---
function toggleAuth() {
    document.getElementById('login-section').classList.toggle('hidden');
    document.getElementById('register-section').classList.toggle('hidden');
}

function login(userData, customPic = null) {
    state.user = {
        pic: customPic ? customPic : "https://ui-avatars.com/api/?name=" + encodeURIComponent(userData.name) + "&background=random",
        bio: "Student at UIU",
        role: "Student",
        batch: "233",
        postsCount: 0,
        ...userData
    };
    const authView = document.getElementById('auth-view');
    authView.classList.add('opacity-0', 'transition-opacity', 'duration-500');
    setTimeout(() => {
        authView.classList.add('hidden');
        const mainApp = document.getElementById('main-app');
        mainApp.classList.remove('hidden');
        mainApp.classList.add('opacity-0', 'transition-opacity', 'duration-500');


        updateUI();
        loadHiddenPosts();
        switchTab('home');
        renderFeed();
        updateNotificationsBadge();
        renderRightSidebar();


        setTimeout(() => mainApp.classList.remove('opacity-0'), 50);
    }, 500);
}

function updateUI() {
    if (!state.user) return;
    document.getElementById('display-name').innerText = state.user.name.toUpperCase();
    document.getElementById('display-info').innerText = `${state.user.dept} • ${state.user.batch} • ID: ${state.user.studentId || state.user.id}`;
    document.getElementById('nav-profile-pic').src = state.user.pic;

    const sidebarPic = document.getElementById('sidebar-profile-pic');
    if (sidebarPic) sidebarPic.src = state.user.pic;

    const friendsCountBadge = document.getElementById('friends-count-badge');
    if (friendsCountBadge) friendsCountBadge.innerText = state.friends.length;

    // Profile view updates. Every write is guarded because the profile markup
    // is optional: the offline shell and the other-profile view share this
    // function and must not throw on a missing node.
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    };

    setText('profile-name', state.user.name);
    setText('profile-bio', state.user.bio || '');
    const profilePicEl = document.getElementById('profile-picture');
    if (profilePicEl) profilePicEl.src = state.user.pic;

    const headlineParts = [
        state.user.dept || null,
        state.user.batch ? `Batch ${state.user.batch}` : null,
        `ID: ${state.user.studentId || state.user.id}`
    ].filter(Boolean);
    setText('profile-headline', headlineParts.join(' • '));

    const roleBadge = document.getElementById('profile-role-badge');
    if (roleBadge) {
        roleBadge.innerText = state.user.role || 'Student';
        roleBadge.classList.remove('hidden');
    }

    // The cover is a data column the backend has always stored and returned; this
    // is the only place that paints it. An empty or missing value leaves the CSS
    // gradient showing through, so a profile without a cover still looks designed.
    const profileCover = document.getElementById('profile-cover');
    if (profileCover) {
        profileCover.style.backgroundImage = state.user.cover_pic
            ? `url(${state.user.cover_pic})`
            : '';
    }
    const postUserPic = document.getElementById('post-user-pic');
    if (postUserPic) postUserPic.src = state.user.pic;
    const profilePicField = document.getElementById('post-user-pic-profile');
    if (profilePicField) profilePicField.src = state.user.pic;

    setText('profile-friends-count', state.friends.length);
    setText('profile-posts-count', state.user.postsCount);
    setText('profile-community-count', (state.joinedCommunities || []).length);

    // About panel: the same data as the header, laid out as a definition list,
    // plus the optional fields the profile editor owns. `headline` is the
    // user's own tagline; the rest default to an em dash so the list keeps its
    // shape even when nothing has been filled in.
    const tagline = state.user.headline || '';
    const taglineEl = document.getElementById('profile-tagline');
    if (taglineEl) {
        taglineEl.innerText = tagline;
        taglineEl.classList.toggle('hidden', tagline === '');
    }

    const aboutHeadlineEl = document.getElementById('profile-about-headline');
    if (aboutHeadlineEl) {
        aboutHeadlineEl.innerText = tagline;
        aboutHeadlineEl.classList.toggle('hidden', tagline === '');
    }

    setText('profile-about-bio', state.user.bio || 'No bio yet.');
    setText('profile-about-dept', state.user.dept || '—');
    setText('profile-about-batch', state.user.batch || '—');
    setText('profile-about-id', state.user.studentId || state.user.id || '—');
    setText('profile-about-location', state.user.location || '—');
    setText('profile-about-joined', formatJoinedDate(state.user.joined || state.user.created_at));

    // The website is a real link when set, and an inert dash when not, so a
    // cleared field never leaves a dead link pointing at "#".
    const websiteEl = document.getElementById('profile-about-website');
    if (websiteEl) {
        if (state.user.website) {
            websiteEl.innerText = String(state.user.website).replace(/^https?:\/\//i, '');
            websiteEl.href = state.user.website;
            websiteEl.classList.remove('pointer-events-none');
        } else {
            websiteEl.innerText = '—';
            websiteEl.href = '#';
            websiteEl.classList.add('pointer-events-none');
        }
    }

    // Interests are stored as a comma-separated string and shown as chips.
    const interestsEl = document.getElementById('profile-about-interests');
    if (interestsEl) {
        const tags = String(state.user.interests || '').split(',').map(t => t.trim()).filter(Boolean);
        if (tags.length > 0) {
            interestsEl.innerHTML = tags.map(tag =>
                `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary-container text-on-primary-container">${escapeHtml(tag)}</span>`
            ).join('');
            interestsEl.classList.remove('hidden');
            interestsEl.classList.add('flex');
        } else {
            interestsEl.innerHTML = '';
            interestsEl.classList.add('hidden');
            interestsEl.classList.remove('flex');
        }
    }

    // Settings -> Account mirrors the live values.
    const settingsNameInput = document.getElementById('settings-name-input');
    if (settingsNameInput) settingsNameInput.value = state.user.name;
    const settingsDeptInput = document.getElementById('settings-dept-input');
    if (settingsDeptInput) settingsDeptInput.value = state.user.dept || '';
    const settingsBatchInput = document.getElementById('settings-batch-input');
    if (settingsBatchInput) settingsBatchInput.value = state.user.batch || '';
    const settingsBioInput = document.getElementById('settings-bio-input');
    if (settingsBioInput) settingsBioInput.value = state.user.bio || "";
    const settingsEmail = document.getElementById('settings-email-display');
    if (settingsEmail) settingsEmail.value = state.user.email || '';
    const settingsId = document.getElementById('settings-id-display');
    if (settingsId) settingsId.value = state.user.studentId || state.user.id || '';
}

// "2025-03-04 10:20:30" is UTC (the DB clock); append Z so the month shown is
// the one the user actually joined in, not one shifted by their offset.
function formatJoinedDate(value) {
    if (!value) return '—';
    const raw = String(value);
    const iso = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const date = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}

// --- Navigation & Views ---
function switchTab(tabId) {
    activeTab = tabId;
    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.add('hidden', 'opacity-0');
    });

    // Update nav active states
    document.querySelectorAll('.nav-link').forEach(el => {
        if (el.dataset.tab === tabId) {
            el.classList.add('text-orange-600', 'dark:text-orange-400', 'border-b-2', 'border-orange-600', 'dark:border-orange-500');
            el.classList.remove('text-slate-600', 'dark:text-slate-400');
        } else {
            el.classList.remove('text-orange-600', 'dark:text-orange-400', 'border-b-2', 'border-orange-600', 'dark:border-orange-500');
            el.classList.add('text-slate-600', 'dark:text-slate-400');
        }
    });

    document.querySelectorAll('.side-nav-link').forEach(el => {
        if (el.dataset.tab === tabId) {
            el.classList.add('bg-orange-50', 'dark:bg-orange-900/20', 'text-orange-700', 'dark:text-orange-400');
            el.classList.remove('text-slate-500', 'dark:text-slate-400', 'hover:bg-orange-50');
        } else {
            el.classList.remove('bg-orange-50', 'dark:bg-orange-900/20', 'text-orange-700', 'dark:text-orange-400');
            el.classList.add('text-slate-500', 'dark:text-slate-400', 'hover:bg-orange-50');
        }
    });

    // Show target view
    const targetView = document.getElementById(`${tabId}-view`);
    if (targetView) {
        targetView.classList.remove('hidden');
        setTimeout(() => targetView.classList.remove('opacity-0'), 50);
        if (tabId === 'home') renderFeed();
        if (tabId === 'profile') renderUserPosts();
        if (tabId === 'friends') renderFriendsView();
        if (tabId === 'events') openEventsView();
        if (tabId === 'communities') renderCommunitiesList();
        if (tabId === 'settings') loadSettings();
        if (tabId === 'explore') switchExploreTab('main');
        if (tabId === 'messages') {
            document.getElementById('right-sidebar').classList.add('hidden');
            // The conversation list is not part of the bootstrap payload, so
            // rendering straight from the cache made a fresh page load show
            // every friend as "Start chatting..." and hide the threads that
            // actually exist. Fetched on entry instead, so the request is only
            // made when the tab is opened.
            loadMessagesView();
        } else {
            document.getElementById('right-sidebar').classList.remove('hidden');
            
        }
    }

    updateGlobalFab(tabId);
}

function updateGlobalFab(tabId, subTabId = 'main') {
    const fabButton = document.getElementById('global-fab');
    if (!fabButton) return;

    let icon = 'edit';
    let text = 'Create Post';
    let action = 'focusCreatePost()';
    let colorClass = 'bg-primary';

    if (tabId === 'explore') {
        // Explore has its own prominent composer buttons in the hero, so a
        // floating action here would only duplicate them.
        fabButton.classList.add('hidden');
        return;
    } else if (tabId === 'events') {
        icon = 'event'; text = 'Host Event'; action = 'openCreateEventModal()'; colorClass = 'bg-orange-600';
    } else if (tabId === 'communities') {
        icon = 'group_add'; text = 'New Community'; action = 'openCreateCommunityModal()'; colorClass = 'bg-primary';
    } else if (tabId === 'friends') {
        icon = 'person_add'; text = 'Find Friends'; action = "document.getElementById('search-input').focus();"; colorClass = 'bg-secondary';
    }

    fabButton.className = `fixed bottom-6 right-6 z-50 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center group ${colorClass}`;
    fabButton.setAttribute('onclick', action);

    fabButton.innerHTML = `
        <span class="material-symbols-outlined mr-0 group-hover:mr-2 transition-all text-xl">${icon}</span>
        <span class="text-sm font-bold w-0 overflow-hidden group-hover:w-auto opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">${text}</span>
    `;
    fabButton.classList.remove('hidden');
}

/* ── Explore (previous version) ────────────────────────────────────────────
   Explore is a set of sub-portals (main, programming, research, gaming,
   career). switchExploreTab() swaps the visible sub-portal, updateGlobalFab()
   reflects the change, and the shared openExplorePopup() dialog powers every
   information/action sheet the sub-portals open. */

// Pre-computed SVG fallbacks. Built once so the data URIs stay quote-free when
// embedded inside single-quoted HTML attributes.
const FALLBACK_COMMUNITY_COVER = coverFallback('#0ea5e9', '#6366f1', 'Community');
const FALLBACK_COMMUNITY_PIC = coverFallback('#f97316', '#fb7185', 'U');
const FALLBACK_EVENT = coverFallback('#f59e0b', '#ef4444', 'Event');
const FALLBACK_AVATAR = coverFallback('#0ea5e9', '#6366f1', 'U-Link');

// One card component reused by the Communities tab and the search results, so a
// community always looks the same everywhere.
function exploreCommunityCard(c) {
    const joined = ULink.isLive ? Boolean(c.joined) : state.joinedCommunities.includes(String(c.id));
    const pic = c.pic || c.cover || c.cover_pic || FALLBACK_COMMUNITY_PIC;
    const cover = c.cover_pic || c.cover || c.pic || '';
    const members = c.memberCount ?? c.members ?? 0;
    const coverHtml = cover
        ? `<img src="${escapeHtml(cover)}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_COMMUNITY_COVER}'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">`
        : `<img src="${FALLBACK_COMMUNITY_COVER}" class="w-full h-full object-cover">`;

    return `
    <article class="group bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/30 shadow-sm hover:shadow-lg transition-all flex flex-col">
        <div class="relative h-28 cursor-pointer" onclick="openCommunityProfile('${c.id}')">
            ${coverHtml}
            <div class="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent"></div>
        </div>
        <div class="px-4 pb-4 -mt-7 relative flex flex-col flex-1">
            <img src="${escapeHtml(pic)}" onerror="this.onerror=null;this.src='${FALLBACK_COMMUNITY_PIC}'" alt=""
                class="w-14 h-14 rounded-2xl object-cover border-4 border-surface-container-lowest shadow">
            <h3 class="mt-2 font-bold text-on-surface truncate cursor-pointer hover:text-primary transition-colors"
                onclick="openCommunityProfile('${c.id}')">${escapeHtml(c.name)}</h3>
            <p class="text-xs text-on-surface-variant font-medium">${members} member${members === 1 ? '' : 's'}</p>
            <p class="text-sm text-on-surface-variant mt-2 line-clamp-2 min-h-[40px]">${escapeHtml(c.description || '')}</p>
            <button onclick="handleJoinCommunity('${c.id}')"
                class="mt-3 w-full py-2 rounded-xl text-sm font-bold transition-all ${joined
                    ? 'bg-surface-container-high text-on-surface-variant hover:bg-red-50 hover:text-red-600'
                    : 'bg-primary text-on-primary hover:bg-primary/90'}">${joined ? 'Joined' : 'Join'}</button>
        </div>
    </article>`;
}

// One card component for every event surface (Events tab, search).
function exploreEventCard(event) {
    const img = event.img || event.image || '';
    const going = event.interested === true;
    const notGoing = event.interested === false;
    const month = String(event.month || '').toUpperCase();
    const day = event.day || event.date || '';
    const count = event.interested_count ?? event.interestedCount ?? 0;
    const time = event.time || '';
    const imageHtml = img
        ? `<img src="${escapeHtml(img)}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_EVENT}'" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">`
        : `<img src="${FALLBACK_EVENT}" class="w-full h-full object-cover">`;
    const badge = going
        ? '<span class="absolute top-3 right-3 bg-primary text-on-primary text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">check_circle</span>Going</span>'
        : (notGoing
            ? '<span class="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">cancel</span>Not going</span>'
            : '');

    return `
    <article class="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group border border-outline-variant/30 flex flex-col"
        onclick="openEventModal('${event.id}')">
        <div class="relative h-44 overflow-hidden bg-surface-container-highest">
            ${imageHtml}
            <div class="absolute top-3 left-3 bg-surface-container-lowest/95 backdrop-blur px-3 py-1.5 rounded-xl text-center shadow">
                <div class="text-primary font-black text-lg leading-none">${escapeHtml(String(day))}</div>
                <div class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">${escapeHtml(month)}</div>
            </div>
            ${badge}
        </div>
        <div class="p-5 flex flex-col flex-1">
            <h3 class="text-lg font-bold leading-tight line-clamp-2 min-h-[48px] text-on-surface">${escapeHtml(event.title)}</h3>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-on-surface-variant">
                ${time ? `<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">schedule</span>${escapeHtml(time)}</span>` : ''}
                <span class="truncate flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">location_on</span>${escapeHtml(event.location || '')}</span>
            </div>
            <div class="flex items-center justify-between mt-auto pt-4">
                <span class="text-xs font-bold text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">group</span>${count} interested</span>
                <span class="text-xs font-bold text-primary flex items-center gap-1">Details <span class="material-symbols-outlined text-[15px]">arrow_forward</span></span>
            </div>
        </div>
    </article>`;
}

// Sub-portals that live inside #explore-view.
const EXPLORE_SUBVIEWS = ['main', 'programming', 'research', 'gaming', 'career'];

function switchExploreTab(subTab) {
    if (!EXPLORE_SUBVIEWS.includes(subTab)) subTab = 'main';
    EXPLORE_SUBVIEWS.forEach(id => {
        const el = document.getElementById('explore-' + id + '-view');
        if (el) el.classList.toggle('hidden', id !== subTab);
    });
    updateGlobalFab('explore', subTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Shared Explore popup ──────────────────────────────────────────────────
   One dialog, themed per card. `config` accepts:
     { title, subtitle, icon, theme, bodyHtml, footerHtml } */
const EXPLORE_POPUP_THEMES = {
    indigo: { bar: 'from-indigo-500 to-purple-500', chip: 'bg-indigo-50 text-indigo-600' },
    blue: { bar: 'from-blue-500 to-cyan-500', chip: 'bg-blue-50 text-blue-600' },
    emerald: { bar: 'from-emerald-500 to-teal-500', chip: 'bg-emerald-50 text-emerald-600' },
    teal: { bar: 'from-teal-500 to-emerald-500', chip: 'bg-teal-50 text-teal-600' },
    fuchsia: { bar: 'from-fuchsia-500 to-pink-500', chip: 'bg-fuchsia-50 text-fuchsia-600' }
};

function openExplorePopup(config) {
    const popup = document.getElementById('explore-popup');
    if (!popup || !config) return;
    const theme = EXPLORE_POPUP_THEMES[config.theme] || EXPLORE_POPUP_THEMES.indigo;

    document.getElementById('explore-popup-title').innerText = config.title || '';
    document.getElementById('explore-popup-subtitle').innerText = config.subtitle || '';
    document.getElementById('explore-popup-icon').innerText = config.icon || 'info';
    document.getElementById('explore-popup-body').innerHTML = config.bodyHtml || '';
    document.getElementById('explore-popup-footer').innerHTML = config.footerHtml || '';

    document.getElementById('explore-popup-accent').className =
        `h-1.5 w-full bg-gradient-to-r ${theme.bar}`;
    document.getElementById('explore-popup-icon-wrap').className =
        `w-12 h-12 rounded-xl ${theme.chip} flex items-center justify-center shadow-sm`;

    popup.classList.remove('hidden');
    const content = document.getElementById('explore-popup-content');
    requestAnimationFrame(() => {
        popup.classList.remove('opacity-0');
        if (content) content.classList.remove('scale-95');
    });
}

function closeExplorePopup() {
    const popup = document.getElementById('explore-popup');
    if (!popup) return;
    const content = document.getElementById('explore-popup-content');
    popup.classList.add('opacity-0');
    if (content) content.classList.add('scale-95');
    setTimeout(() => popup.classList.add('hidden'), 250);
}

function scrollSlider(sliderId, direction) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    const amount = Math.max(240, Math.round(slider.clientWidth * 0.8));
    slider.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
}

// Posts the Q&A form inside the Programming sub-portal and reflects it in the
// forum list without leaving the page.
function postQuestion() {
    const subjectEl = document.getElementById('qa-subject');
    const detailsEl = document.getElementById('qa-details');
    const subject = subjectEl ? subjectEl.value.trim() : '';
    const details = detailsEl ? detailsEl.value.trim() : '';
    if (!subject) {
        showToast('Add a subject for your question.', 'warning');
        if (subjectEl) subjectEl.focus();
        return;
    }
    const list = document.getElementById('qa-forum-list');
    if (!list) return;
    const author = (state.user && (state.user.full_name || state.user.name)) || 'You';
    const avatar = (state.user && (state.user.profile_pic || state.user.pic)) || FALLBACK_AVATAR;
    const card = document.createElement('div');
    card.className = 'group cursor-pointer';
    card.innerHTML = `
        <div class="flex items-center gap-2 mb-2">
            <img src="${escapeHtml(avatar)}" class="w-8 h-8 rounded-full object-cover" alt="">
            <div>
                <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100">${escapeHtml(author)}</h4>
                <p class="text-[10px] text-slate-500">Just now</p>
            </div>
        </div>
        <h4 class="font-bold text-on-surface group-hover:text-purple-600 transition-colors">${escapeHtml(subject)}</h4>
        ${details ? `<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">${escapeHtml(details)}</p>` : ''}
        <div class="flex gap-2 mt-3">
            <span class="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold rounded-full">New</span>
            <span class="px-2 py-0.5 bg-slate-100 dark:bg-surface-container-high text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-full">#question</span>
        </div>`;
    list.prepend(card);
    if (subjectEl) subjectEl.value = '';
    if (detailsEl) detailsEl.value = '';
    closeExplorePopup();
    showToast('Question posted to the community forum.', 'success');
}

/* ── Create community ───────────────────────────────────────────────────── */

let createCommunityImages = { pic: null, cover: null };

function readFileAsDataUri(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function openCreateCommunityModal() {
    const overlay = document.getElementById('create-community-overlay');
    if (!overlay) return;
    createCommunityImages = { pic: null, cover: null };
    const name = document.getElementById('create-community-name');
    const desc = document.getElementById('create-community-desc');
    const priv = document.getElementById('create-community-private');
    const previews = document.getElementById('create-community-previews');
    if (name) name.value = '';
    if (desc) desc.value = '';
    if (priv) priv.checked = false;
    if (previews) previews.innerHTML = '';
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    document.body.style.overflow = 'hidden';
    setTimeout(() => name && name.focus(), 50);
}

function closeCreateCommunityModal() {
    const overlay = document.getElementById('create-community-overlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    document.body.style.overflow = '';
}

async function onCreateCommunityImage(event, kind) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const uri = await readFileAsDataUri(file);
    createCommunityImages[kind] = uri;
    const previews = document.getElementById('create-community-previews');
    if (!previews) return;
    const existing = previews.querySelector(`[data-preview="${kind}"]`);
    if (existing) existing.remove();
    const img = document.createElement('img');
    img.dataset.preview = kind;
    img.src = uri;
    img.alt = kind;
    img.className = kind === 'cover'
        ? 'h-14 rounded-lg object-cover flex-1'
        : 'w-14 h-14 rounded-full object-cover';
    previews.appendChild(img);
}

async function submitCreateCommunity(btn) {
    const name = (document.getElementById('create-community-name') || {}).value || '';
    const description = (document.getElementById('create-community-desc') || {}).value || '';
    const isPrivate = Boolean((document.getElementById('create-community-private') || {}).checked);

    if (name.trim().length < 3) {
        showToast('Give your community a name of at least 3 characters.', 'error');
        return;
    }

    if (!ULink.isLive) {
        // Offline: keep the flow usable by adding a local-only group.
        MOCK_COMMUNITIES.unshift({
            id: 'local-' + Date.now(),
            name: name.trim(),
            description: description.trim(),
            pic: createCommunityImages.pic || '',
            cover_pic: createCommunityImages.cover || '',
            memberCount: 1,
            joined: true,
            is_private: isPrivate
        });
        closeCreateCommunityModal();
        renderCommunitiesList();
        showToast('Community created.');
        return;
    }

    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Creating…';
    const res = await ULinkAPI.createCommunity({
        name: name.trim(),
        description: description.trim(),
        is_private: isPrivate,
        pic: createCommunityImages.pic,
        cover: createCommunityImages.cover
    });
    btn.disabled = false;
    btn.innerHTML = original;

    if (res.status !== 'success') {
        showToast(res.message || 'Could not create the community.', 'error');
        return;
    }

    const community = res.community || res.data || {};
    if (community && community.id) {
        ULink.data.communities = [community, ...(ULink.data.communities || [])];
        if (state.exploreData && Array.isArray(state.exploreData.communities)) {
            state.exploreData.communities = [community, ...state.exploreData.communities];
        }
    }
    closeCreateCommunityModal();
    renderCommunitiesList();
    showToast('Community created.');
    if (community && community.id) openCommunityProfile(community.id);
}

/* ── Create event ───────────────────────────────────────────────────────── */

let createEventImage = null;

function openCreateEventModal() {
    const overlay = document.getElementById('create-event-overlay');
    if (!overlay) return;
    createEventImage = null;
    ['create-event-title-input', 'create-event-desc', 'create-event-location', 'create-event-start', 'create-event-end']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const preview = document.getElementById('create-event-preview');
    if (preview) preview.innerHTML = '';
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    document.body.style.overflow = 'hidden';
    const title = document.getElementById('create-event-title-input');
    setTimeout(() => title && title.focus(), 50);
}

function closeCreateEventModal() {
    const overlay = document.getElementById('create-event-overlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    document.body.style.overflow = '';
}

async function onCreateEventImage(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    createEventImage = await readFileAsDataUri(file);
    const preview = document.getElementById('create-event-preview');
    if (preview) preview.innerHTML = `<img src="${createEventImage}" alt="" class="w-full h-40 object-cover rounded-xl">`;
}

async function submitCreateEvent(btn) {
    const title = (document.getElementById('create-event-title-input') || {}).value || '';
    const description = (document.getElementById('create-event-desc') || {}).value || '';
    const location = (document.getElementById('create-event-location') || {}).value || '';
    const rawStart = (document.getElementById('create-event-start') || {}).value || '';
    const rawEnd = (document.getElementById('create-event-end') || {}).value || '';

    if (title.trim().length < 3) {
        showToast('Give your event a title of at least 3 characters.', 'error');
        return;
    }
    if (!rawStart) {
        showToast('Pick a start date and time.', 'error');
        return;
    }

    // <input type="datetime-local"> emits "YYYY-MM-DDTHH:mm"; the API stores
    // "YYYY-MM-DD HH:mm:ss" as UTC wall time.
    const toApi = (v) => (v ? v.replace('T', ' ') + (v.length === 16 ? ':00' : '') : '');

    if (!ULink.isLive) {
        showToast('Connect to the server to host an event.', 'error');
        return;
    }

    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Creating…';
    const res = await ULinkAPI.createEvent({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        event_date: toApi(rawStart),
        end_date: toApi(rawEnd),
        image: createEventImage
    });
    btn.disabled = false;
    btn.innerHTML = original;

    if (res.status !== 'success') {
        showToast(res.message || 'Could not create the event.', 'error');
        return;
    }

    const event = res.event || res.data || {};
    if (event && event.id) {
        state.events = [event, ...(state.events || [])];
        ULink.data.events = [event, ...(ULink.data.events || [])];
        if (state.exploreData && Array.isArray(state.exploreData.events)) {
            state.exploreData.events = [event, ...state.exploreData.events];
        }
    }
    closeCreateEventModal();
    renderEventsGrid();
    showToast('Event created.');
    if (event && event.id) setTimeout(() => openEventModal(event.id), 150);
}

// --- Post Creation & Formatting ---
function focusCreatePost() {
    if (activeTab !== 'home' && activeTab !== 'profile') {
        switchTab('home');
    }
    setTimeout(() => {
        const inputId = activeTab === 'profile' ? 'post-text-profile' : 'post-text';
        const el = document.getElementById(inputId);
        if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

function previewImage(event, source = 'home') {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            uploadedImageBase64 = e.target.result;
            const previewId = source === 'home' ? 'image-preview' : (source === 'community' ? 'image-preview-community' : 'image-preview-profile');
            const containerId = source === 'home' ? 'image-preview-container' : (source === 'community' ? 'image-preview-container-community' : 'image-preview-container-profile');

            document.getElementById(previewId).src = uploadedImageBase64;
            document.getElementById(containerId).classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }
}

function removeImage(source = 'home') {
    uploadedImageBase64 = "";
    if (source === 'home' || source === 'all') {
        document.getElementById('post-image-input').value = "";
        document.getElementById('image-preview-container').classList.add('hidden');
    }
    if ((source === 'profile' || source === 'all') && document.getElementById('post-image-input-profile')) {
        document.getElementById('post-image-input-profile').value = "";
        document.getElementById('image-preview-container-profile').classList.add('hidden');
    }
    if ((source === 'community' || source === 'all') && document.getElementById('post-image-input-community')) {
        document.getElementById('post-image-input-community').value = "";
        document.getElementById('image-preview-container-community').classList.add('hidden');
    }
}

// --- Feeling Picker ---
function toggleFeelingDropdown(source) {
    const dropdown = document.getElementById(`feeling-dropdown-${source}`);
    if (!dropdown) return;
    const isHidden = dropdown.classList.contains('hidden');
    // Close all feeling dropdowns first
    document.querySelectorAll('[id^="feeling-dropdown-"]').forEach(d => d.classList.add('hidden'));
    if (isHidden) {
        dropdown.classList.remove('hidden');
        // Close if clicking outside
        setTimeout(() => {
            function outsideClick(e) {
                if (!dropdown.contains(e.target) && e.target.id !== `feeling-btn-${source}` && !document.getElementById(`feeling-btn-${source}`)?.contains(e.target)) {
                    dropdown.classList.add('hidden');
                    document.removeEventListener('click', outsideClick);
                }
            }
            document.addEventListener('click', outsideClick);
        }, 0);
    }
}

function selectFeeling(feeling, source) {
    selectedFeeling[source] = feeling;
    const textEl = document.getElementById(`feeling-text-${source}`);
    const iconEl = document.getElementById(`feeling-icon-${source}`);

    if (textEl) {
        textEl.textContent = feeling;
        // Remove 'hidden' class regardless of breakpoint variant
        textEl.classList.remove('hidden', 'sm:inline');
        textEl.style.display = 'inline';
    }
    if (iconEl) {
        iconEl.classList.add('hidden');
        iconEl.style.display = 'none';
    }
    // Close dropdown
    const dropdown = document.getElementById(`feeling-dropdown-${source}`);
    if (dropdown) dropdown.classList.add('hidden');
}

function resetFeeling(source) {
    selectedFeeling[source] = '';
    const textEl = document.getElementById(`feeling-text-${source}`);
    const iconEl = document.getElementById(`feeling-icon-${source}`);

    if (textEl) {
        // Restore default text if available
        const defaultText = textEl.getAttribute('data-default') || '';
        textEl.textContent = defaultText;
        textEl.style.display = '';
        // Re-add the original classes
        if (source === 'home') {
            textEl.classList.add('hidden', 'sm:inline');
        } else {
            textEl.classList.add('hidden');
            textEl.style.display = 'none';
        }
    }
    if (iconEl) {
        iconEl.classList.remove('hidden');
        iconEl.style.display = '';
    }
}

async function submitPost(source = 'home') {
    const textId = source === 'home' ? 'post-text' : (source === 'profile' ? 'post-text-profile' : 'post-text');
    const textEl = document.getElementById(textId);
    if (!textEl) return;
    let text = textEl.value.trim();
    const feeling = selectedFeeling[source];
    if (feeling) text = text ? `${text} — feeling ${feeling}` : `feeling ${feeling}`;
    if (!text && !uploadedImageBase64) return;

    // No userId: the server attributes the post to the session holder.
    const result = await ULinkAPI.createPost({ text, image: uploadedImageBase64 });

    if (result.status !== 'success') {
        if (showError) showError(result.message || 'Could not publish your post.');
        return;
    }

    state.posts.unshift({
        id: result.post.id,
        userId: result.post.userId,
        name: result.post.name,
        pic: result.post.pic,
        text: result.post.text,
        image: result.post.image,
        likes: result.post.likes ?? 0,
        comments: result.post.comments ?? 0,
        liked: false,
        commentsList: []
    });
    if (state.user) state.user.postsCount++;

    // Reset the correct textarea
    textEl.value = "";
    // Reset image for the correct source
    removeImage(source);
    resetFeeling(source);

    ActivityLogger.logPostCreated(result.post.id, text.length);

    if (activeTab === 'home') await renderFeed();
    if (activeTab === 'profile') renderUserPosts();
    updateUI();
}

// --- Feed Rendering & Interaction ---
/**
 * One-line "dept • batch" description of a person, used in every byline.
 *
 * The API leaves `department` and `batch` NULL for accounts that never filled
 * them in, and the mock rows only carry `dept`, so normalise both shapes here
 * rather than rendering the literal string "null".
 */
function userSubtitle(user) {
    if (!user) return 'N/A';

    const role = user.role || 'Student';
    const dept = user.dept || user.department || 'N/A';
    const batch = user.batch || 'N/A';

    return String(role).toLowerCase() === 'student'
        ? `Batch ${batch} • ${dept}`
        : `${role} • ${dept}`;
}

function getUserDetails(id) {
    // The API returns numeric ids while the mocks used strings, so compare as
    // strings or every lookup misses and the byline reads "Unknown".
    const key = String(id);

    if (state.user && String(state.user.id) === key) return state.user;

    const found = ULink.findUser(key);
    if (found) return found;

    return { name: "Unknown", dept: "N/A", role: "Unknown", batch: "N/A", pic: "" };
}

function shuffleNewsfeed(btn) {
    // Add visual feedback to the button's icon
    const icon = btn?.querySelector('.material-symbols-outlined');
    if (icon) {
        icon.classList.add('rotate-180');
        setTimeout(() => icon.classList.remove('rotate-180'), 500);
    }

    // Shuffle the posts using Fisher-Yates
    for (let i = state.posts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.posts[i], state.posts[j]] = [state.posts[j], state.posts[i]];
    }

    const container = document.getElementById('feed-container');
    if (container) {
        container.style.opacity = '0'; // Fade out
        setTimeout(() => {
            renderFeed();
            // Optional: scroll to top of feed
            document.getElementById('home-view').scrollTo({ top: 0, behavior: 'smooth' });
            container.style.opacity = '1'; // Fade in
        }, 300);
    } else {
        renderFeed();
    }
}

/**
 * Turn an API post row into the shape the renderers expect.
 *
 * Carries `dept`/`batch`/`role` through as well: createPostHTML() needs them for
 * the byline, and dropping them here is what made posts by people outside the
 * signed-in user's friend list render as "undefined - undefined".
 */
function normalisePost(p) {
    return {
        id: p.id,
        userId: p.userId,
        name: p.name,
        pic: p.pic,
        dept: p.dept,
        batch: p.batch,
        role: p.role,
        text: p.text,
        image: p.image,
        communityId: p.communityId ?? null,
        communityName: p.communityName ?? null,
        likes: p.likes ?? 0,
        comments: p.comments ?? 0,
        liked: Boolean(p.liked),
        saved: Boolean(p.saved),
        created_at: p.created_at || null,
        commentsList: p.commentsList || []
    };
}

// A compact "3h", "2d" style age for a post. Falls back to an empty string for
// rows that predate the created_at column (the offline mocks) so the byline
// never shows "Invalid Date".
function postTimeAgo(value) {
    if (!value) return '';
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return '';
    const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w ago`;
    return new Date(then).toLocaleDateString();
}

// A tiny inline SVG gradient used when a post/cover image fails to load. It
// keeps the layout intact and never leaves a broken-image glyph behind.
function coverFallback(from = '#f97316', to = '#fb7185', label = 'U-Link') {
    const text = String(label).slice(0, 18).replace(/[<>&]/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">`
        + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
        + `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>`
        + `</linearGradient></defs>`
        + `<rect width="800" height="500" fill="url(#g)"/>`
        + `<text x="50%" y="50%" fill="rgba(255,255,255,0.9)" font-family="sans-serif" font-size="64" font-weight="700" text-anchor="middle" dominant-baseline="central">${text}</text>`
        + `</svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// Round initials avatar used when a profile picture is missing or fails.
window.ulinkAvatarFallback = function (letter) {
    const ch = String(letter || 'U').toUpperCase().slice(0, 1);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">`
        + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`
        + `<stop offset="0" stop-color="#f97316"/><stop offset="1" stop-color="#fb7185"/>`
        + `</linearGradient></defs>`
        + `<rect width="96" height="96" rx="48" fill="url(#g)"/>`
        + `<text x="50%" y="54%" fill="#fff" font-family="sans-serif" font-size="44" font-weight="700" text-anchor="middle" dominant-baseline="central">${ch}</text>`
        + `</svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
};

async function renderFeed(options = {}) {
    const append = Boolean(options.append);
    const container = document.getElementById('feed-container');
    if (append && state.feedLoading) return;

    // A full render supersedes any in-flight one; an append keeps the current
    // generation so a concurrent reset can invalidate it.
    const seq = append ? state.feedSeq : ++state.feedSeq;

    state.feedLoading = true;
    setFeedLoader(true);
    setupFeedInfiniteScroll();

    // 'feed' is posts outside any community, 'campus' is every post including
    // community posts, 'saved' is the viewer's private bookmarks.
    const scope = state.feedScope === 'campus' ? 'all'
        : (state.feedScope === 'saved' ? 'saved' : 'feed');

    if (!append) {
        state.feedOffset = 0;
        state.feedHasMore = true;
        state.feedCycle = 0;
    }

    let page = [];
    let hasMore = false;
    try {
        const result = await ULinkAPI.fetchPosts({
            scope,
            limit: state.feedLimit,
            offset: state.feedOffset
        });
        if (result.status === 'success') {
            page = (result.data || []).map(normalisePost);
            hasMore = Boolean(result.hasMore);
        } else if (result.status === 'error' && result.message) {
            showToast(result.message, 'error');
        }
    } catch (e) {
        // Keep whatever is already in state.posts so the feed still renders.
        console.error("Failed to fetch posts from API, keeping the current feed", e);
    }

    // A newer render has started while this request was in flight. Drop the
    // stale page entirely: the newer call owns feedLoading and the loader.
    if (seq !== state.feedSeq) return;

    state.posts = append ? (state.posts || []).concat(page) : page;
    state.feedOffset += page.length;
    state.feedHasMore = hasMore && page.length > 0;
    state.feedLoading = false;

    if (!container) { setFeedLoader(false); return; }

    // Hiding is a local feed preference; it must not leak into the profile's
    // own post list, so the filter is applied here and not in renderUserPosts.
    const visible = page.filter(p => !state.hiddenPosts.has(String(p.id)));
    if (append) {
        if (visible.length) {
            container.insertAdjacentHTML('beforeend', visible.map(post => createPostHTML(post)).join(''));
        }
    } else {
        container.innerHTML = visible.map(post => createPostHTML(post)).join('');
    }

    updateFeedEmptyState();
    setFeedLoader(false);
}

function setFeedLoader(loading) {
    const loader = document.getElementById('feed-loader');
    if (!loader) return;
    loader.classList.toggle('hidden', !loading);
    loader.classList.toggle('flex', loading);
}

function updateFeedEmptyState() {
    const container = document.getElementById('feed-container');
    if (!container) return;
    const existing = document.getElementById('feed-empty');
    if (container.querySelector('[data-post-card]')) {
        if (existing) existing.remove();
        return;
    }
    if (existing) return;
    const messages = {
        saved: "You haven't saved any posts yet. Tap the ••• menu on a post to keep it here.",
        campus: 'No campus posts yet. Be the first to share something.',
        feed: 'Nothing here yet. Follow a community or add a friend to fill your feed.'
    };
    const el = document.createElement('p');
    el.id = 'feed-empty';
    el.className = 'text-on-surface-variant text-center py-12';
    el.textContent = messages[state.feedScope] || messages.feed;
    container.appendChild(el);
}

// Pull the next page when the sentinel scrolls into view. Once the server runs
// out of rows we recycle the loaded ones, so the feed never hits a hard end.
async function loadMoreFeed() {
    if (state.feedLoading || activeTab !== 'home') return;
    if (state.feedHasMore) {
        await renderFeed({ append: true });
    } else {
        recycleFeed();
    }
}

// Append a fresh copy of the already-loaded posts with a divider, so scrolling
// can continue past the last real post. Each copy carries an `instance` suffix
// on its element ids, otherwise the duplicates would collide in getElementById.
function recycleFeed() {
    const container = document.getElementById('feed-container');
    if (!container) return;
    const visible = (state.posts || []).filter(p => !state.hiddenPosts.has(String(p.id)));
    if (visible.length === 0) return;

    state.feedCycle += 1;
    const label = state.feedScope === 'saved'
        ? "That's every saved post — showing them again"
        : "You're all caught up — showing earlier posts";
    const divider = `<div class="feed-cycle-divider"><span class="material-symbols-outlined text-[16px]">restart_alt</span><span>${label}</span></div>`;
    container.insertAdjacentHTML('beforeend', divider + visible.map(post => createPostHTML(post, state.feedCycle)).join(''));
}

function setupFeedInfiniteScroll() {
    const sentinel = document.getElementById('feed-sentinel');
    if (!sentinel || state.feedObserver) return;
    state.feedObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) loadMoreFeed(); });
    }, { rootMargin: '700px 0px', threshold: 0 });
    state.feedObserver.observe(sentinel);
}

// The three-way scope control above the feed: Your Feed / Campus / Saved.
function setFeedScope(scope, btn) {
    state.feedScope = ['feed', 'campus', 'saved'].includes(scope) ? scope : 'feed';
    document.querySelectorAll('[data-feed-scope]').forEach(b => {
        const active = b.dataset.feedScope === state.feedScope;
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
        b.classList.toggle('bg-primary', active);
        b.classList.toggle('text-on-primary', active);
        b.classList.toggle('text-on-surface-variant', !active);
    });
    if (activeTab === 'home') renderFeed();
}

function refreshFeed(btn) {
    const icon = btn?.querySelector('.material-symbols-outlined');
    if (icon) {
        icon.classList.add('rotate-180');
        setTimeout(() => icon.classList.remove('rotate-180'), 500);
    }
    if (activeTab === 'home') renderFeed();
}

// Backwards-compatible alias for the old single Saved toggle.
function toggleSavedFeed() {
    setFeedScope(state.feedScope === 'saved' ? 'feed' : 'saved');
}

async function renderUserPosts() {
    const container = document.getElementById('my-posts-container');
    if (!container) return;
    if (!state.user) return;

    // The newsfeed is only one page of everyone's posts, so filtering it would
    // show fewer cards than the post count in the profile header. Ask the API
    // for this user's own posts instead.
    if (ULink.isLive) {
        // `scope=all` because the post count in the profile header includes
        // community posts; asking for the feed alone would show fewer cards
        // than the number printed above them.
        const result = await ULinkAPI.fetchPosts({ mine: 1, scope: 'all', limit: 50 });
        if (result.status === 'success') {
            state.myPosts = (result.data || []).map(normalisePost);
        }
    } else {
        state.myPosts = state.posts.filter(p => String(p.userId) === String(state.user.id));
    }

    if (state.myPosts.length === 0) {
        container.innerHTML = `<p class="text-on-surface-variant text-center py-8">No posts yet.</p>`;
        return;
    }

    container.innerHTML = state.myPosts.map(post => createPostHTML(post)).join('');
}

function createPostHTML(post, instance = null) {
    // Post rows from the API carry the author's name and avatar directly; the
    // richer dept/batch only exist once we resolve the user. Anything missing
    // falls back to a readable placeholder so the byline never says
    // "undefined • undefined".
    const author = { ...getUserDetails(post.userId) };
    if (post.name) author.name = post.name;
    if (post.pic) author.pic = post.pic;
    // The API already resolved dept/batch/role for the author, so prefer those
    // over a store lookup that may not know the person.
    if (post.dept) author.dept = post.dept;
    if (post.batch) author.batch = post.batch;
    if (post.role) author.role = post.role;
    if (author.id === undefined || author.id === null) author.id = post.userId;

    const role = author.role || 'Student';
    const dept = author.dept || author.department || 'N/A';
    const byline = userSubtitle(author);
    const postAge = postTimeAgo(post.created_at);

    // Only the author (or a community admin, which the API decides server side)
    // gets the edit/delete affordances. Every post gets a menu, though: anyone
    // can bookmark it, copy a link, hide it from their own feed, or report it.
    // The popover replaces the original single "Delete post" menu.
    const isOwnPost = state.user && String(post.userId) === String(state.user.id);
    const postId = escapeHtml(post.id);
    // Recycled copies of the same post need distinct element ids, or the
    // duplicate-id lookups would always hit the first instance. The suffix goes
    // into every id while data-post-card keeps the real id for the handlers.
    const uid = instance === null ? postId : `${postId}-r${instance}`;
    const saveLabel = post.saved ? 'Unsave post' : 'Save post';
    const saveIcon = post.saved ? 'bookmark_remove' : 'bookmark_add';

    const ownerItems = isOwnPost ? `
                <button role="menuitem" onclick="startEditPost('${postId}', this)"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors text-left">
                    <span class="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span> Edit post
                </button>` : '';

    const reportItem = !isOwnPost ? `
                <button role="menuitem" onclick="openReportModal('${postId}')"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors text-left">
                    <span class="material-symbols-outlined text-[18px] text-on-surface-variant">flag</span> Report post
                </button>` : '';

    const deleteItem = isOwnPost ? `
                <div class="h-px bg-outline-variant/40 my-1"></div>
                <button role="menuitem" onclick="deletePost('${postId}')"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-error hover:bg-error-container/30 transition-colors text-left">
                    <span class="material-symbols-outlined text-[18px]">delete</span> Delete post
                </button>` : '';

    const optionsMenuHtml = `
        <div class="relative shrink-0">
            <button onclick="togglePostMenu(event, this)" aria-label="Post options" aria-haspopup="menu"
                class="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high active:scale-95 transition-all">
                <span class="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
            <div id="post-menu-${uid}" role="menu"
                class="post-menu hidden absolute right-0 top-11 z-30 w-52 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-2xl overflow-hidden">
                ${ownerItems}
                <button role="menuitem" onclick="toggleSavePost('${postId}', this)"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors text-left">
                    <span class="material-symbols-outlined text-[18px] text-on-surface-variant post-save-icon">${saveIcon}</span>
                    <span class="post-save-label">${saveLabel}</span>
                </button>
                <button role="menuitem" onclick="copyPostLink('${postId}')"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors text-left">
                    <span class="material-symbols-outlined text-[18px] text-on-surface-variant">link</span> Copy link
                </button>
                <button role="menuitem" onclick="hidePost('${postId}')"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors text-left">
                    <span class="material-symbols-outlined text-[18px] text-on-surface-variant">visibility_off</span> Hide from feed
                </button>
                ${reportItem}
                ${deleteItem}
            </div>
        </div>`;

    const fallbackImage = coverFallback('#0ea5e9', '#6366f1', 'U-Link');
    const imgHtml = post.image ? `<div class="post-media overflow-hidden rounded-2xl mt-4 border border-slate-200 dark:border-slate-700/60 shadow-sm"><img src="${escapeHtml(post.image)}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackImage}';" class="w-full max-h-[30rem] object-cover bg-slate-100 dark:bg-surface-container-high transition-transform duration-500 hover:scale-[1.02]"></div>` : '';
    const likeIcon = post.liked ? 'favorite' : 'favorite_border';
    const likeClass = post.liked ? 'text-red-500' : 'text-slate-500';
    const likeFill = post.liked ? '1' : '0';

    // A profile lists community posts too, so say where they went - otherwise
    // the same text appears in two places with no explanation.
    const communityChipHtml = post.communityName
        ? `<p class="mb-2">
               <button onclick="openCommunityProfile('${escapeHtml(post.communityId)}')"
                   class="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline">
                   <span class="material-symbols-outlined text-[13px]">groups</span>
                   ${escapeHtml(post.communityName)}
               </button>
           </p>`
        : '';

    const commentsHtml = post.commentsList ? post.commentsList.map(c => `
        <div class="bg-surface-container-high rounded-xl p-3 mb-2 border border-slate-100 dark:border-slate-800">
            <span class="font-extrabold text-xs mr-1 cursor-pointer hover:underline text-primary" onclick="openPublicProfile('${escapeHtml(c.userId ?? post.userId)}')">${escapeHtml(c.name || '')}</span>
            <span class="text-sm text-slate-700 dark:text-slate-300 font-medium">${escapeHtml(c.text || '')}</span>
        </div>`).join('') : "";

    return `<div id="post-card-${uid}" data-post-card="${postId}" class="post-card bg-surface-container-lowest rounded-2xl p-5 sm:p-6 border border-outline-variant/30 shadow-sm hover:shadow-lg hover:border-outline-variant/50 transition-all duration-300">
        <div class="flex items-start gap-3 mb-4">
            <div class="flex gap-3 cursor-pointer group flex-1 min-w-0" onclick="openPublicProfile('${escapeHtml(author.id)}')">
                <img src="${escapeHtml(author.pic || '')}" onerror="this.onerror=null; this.src=window.ulinkAvatarFallback('${escapeHtml((author.name || 'U').charAt(0))}')" class="w-11 h-11 rounded-full object-cover ring-2 ring-surface-container-high">
                <div class="flex flex-col justify-center min-w-0">
                    <h4 class="font-bold text-[15px] leading-tight group-hover:text-primary transition-colors text-on-surface truncate">${escapeHtml(author.name || 'Unknown')}</h4>
                    <p class="text-xs font-medium text-on-surface-variant mt-0.5 truncate">${escapeHtml(byline)}${postAge ? ` <span class="mx-1">•</span> ${escapeHtml(postAge)}` : ''} <span class="mx-1">•</span> <span class="material-symbols-outlined text-[10px] inline-block align-middle">public</span></p>
                </div>
            </div>
            ${optionsMenuHtml}
        </div>
        ${communityChipHtml}
        <div id="post-content-${uid}">
            <p id="post-text-${uid}" class="post-text text-[15px] font-medium text-on-surface leading-relaxed whitespace-pre-wrap break-words">${escapeHtml(post.text || '')}</p>
            <div id="post-edit-${uid}" class="post-edit hidden mt-1">
                <textarea id="post-edit-input-${uid}" rows="3"
                    class="post-edit-input w-full rounded-xl bg-surface-container-high border border-outline-variant/50 text-on-surface text-[15px] font-medium p-3 focus:ring-2 focus:ring-primary outline-none resize-none">${escapeHtml(post.text || '')}</textarea>
                <div class="flex items-center justify-end gap-2 mt-2">
                    <button type="button" onclick="cancelPostEdit('${postId}', this)"
                        class="px-4 py-2 rounded-full text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors">Cancel</button>
                    <button type="button" onclick="savePostEdit('${postId}', this)"
                        class="px-5 py-2 rounded-full text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 active:scale-95 transition-all">Save</button>
                </div>
            </div>
        </div>
        ${imgHtml}
        <div class="flex items-center gap-6 mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
            <button onclick="toggleLike('${post.id}', this)" class="flex items-center gap-2 group flex-1 justify-center sm:flex-none sm:justify-start">
                <div class="p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors ${post.liked ?'bg-red-50 dark:bg-red-900/20' : ''}">
                  <span class="material-symbols-outlined text-2xl ${likeClass} transition-transform group-active:scale-75" style="font-variation-settings: 'FILL' ${likeFill};">${likeIcon}</span>
                </div>
                <span class="text-sm font-bold ${likeClass}">${post.likes}</span>
            </button>
            <button onclick="toggleComments(this)" class="flex items-center gap-2 text-slate-500 dark:text-slate-400 group flex-1 justify-center sm:flex-none sm:justify-start">
                <div class="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                  <span class="material-symbols-outlined text-2xl">chat_bubble_outline</span>
                </div>
                <span class="text-sm font-bold">${post.comments}</span>
            </button>
        </div>
        <!-- Comments Section -->
        <div class="post-comments-section hidden mt-4 pt-4 border-t border-surface-container-highest/30">
            <div class="max-h-40 overflow-y-auto mb-3 pr-1 hide-scrollbar">
                ${commentsHtml}
            </div>
            <div class="flex gap-2">
                <input type="text" class="post-comment-input flex-1 bg-surface-container-high border-none rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="Write a comment...">
                <button onclick="submitComment('${post.id}', this)" class="bg-primary text-on-primary p-2 rounded-full w-9 h-9 flex items-center justify-center hover:bg-primary/90 transition-colors active:scale-95">
                    <span class="material-symbols-outlined text-sm">send</span>
                </button>
            </div>
        </div>
    </div>`;
}

// Open/close the per-post "..." popover. Only one can be open at a time, and a
// click anywhere else closes them (the listener is installed once, below).
function togglePostMenu(event, btn) {
    if (event) event.stopPropagation();
    const menu = btn && btn.parentElement ? btn.parentElement.querySelector('.post-menu') : null;
    const wasOpen = menu && !menu.classList.contains('hidden');
    closeAllPostMenus();
    if (menu && !wasOpen) menu.classList.remove('hidden');
}

document.addEventListener('click', () => {
    document.querySelectorAll('[id^="post-menu-"]').forEach(el => el.classList.add('hidden'));
});

async function deletePost(postId) {
    document.querySelectorAll('[id^="post-menu-"]').forEach(el => el.classList.add('hidden'));

    const post = (state.myPosts || []).find(p => String(p.id) === String(postId))
        || (state.posts || []).find(p => String(p.id) === String(postId));
    if (!post) return;

    const confirmed = await showConfirm(
        'Delete this post? Its likes and comments go with it, and this cannot be undone.',
        { title: 'Delete post', confirmText: 'Delete', danger: true, icon: 'delete' }
    );
    if (!confirmed) return;

    const result = await ULinkAPI.deletePost(Number(postId));
    if (result.status !== 'success') {
        if (showError) showError(result.message || 'Could not delete that post.');
        return;
    }

    // Drop it from both stores so the feed and the profile agree immediately,
    // then let the server's post count follow.
    state.posts = (state.posts || []).filter(p => String(p.id) !== String(postId));
    state.myPosts = (state.myPosts || []).filter(p => String(p.id) !== String(postId));
    state.hiddenPosts.delete(String(postId));
    if (state.user && Number(state.user.postsCount) > 0) {
        state.user.postsCount = Number(state.user.postsCount) - 1;
    }

    updateUI();
    if (activeTab === 'home') renderFeed();
    if (activeTab === 'profile') renderUserPosts();
    if (activeTab === 'other-profile' && currentOtherUserId) openPublicProfile(currentOtherUserId);

    showToast('Post deleted.');
}

// ---------------------------------------------------------------------------
// Post actions: edit, bookmark, hide, copy link, report
// ---------------------------------------------------------------------------

function findPost(postId) {
    return (state.myPosts || []).find(p => String(p.id) === String(postId))
        || (state.posts || []).find(p => String(p.id) === String(postId))
        || null;
}

function closeAllPostMenus() {
    document.querySelectorAll('[id^="post-menu-"]').forEach(el => el.classList.add('hidden'));
}

// Inline edit: swap the text paragraph for a textarea in place, so the viewer
// keeps the post's position in the feed. Cancel restores the original text and
// "changes nothing" is guaranteed because nothing is sent until Save.
function startEditPost(postId, btn) {
    closeAllPostMenus();
    const card = btn ? btn.closest('[data-post-card]') : null;
    const paragraph = card ? card.querySelector('.post-text') : document.getElementById(`post-text-${postId}`);
    const editor = card ? card.querySelector('.post-edit') : document.getElementById(`post-edit-${postId}`);
    const input = card ? card.querySelector('.post-edit-input') : document.getElementById(`post-edit-input-${postId}`);
    if (!paragraph || !editor || !input) return;

    input.value = paragraph.textContent || '';
    paragraph.classList.add('hidden');
    editor.classList.remove('hidden');
    input.focus();
    // Put the caret at the end so the text can be appended to straight away.
    input.setSelectionRange(input.value.length, input.value.length);
}

function cancelPostEdit(postId, btn) {
    const card = btn ? btn.closest('[data-post-card]') : null;
    const paragraph = card ? card.querySelector('.post-text') : document.getElementById(`post-text-${postId}`);
    const editor = card ? card.querySelector('.post-edit') : document.getElementById(`post-edit-${postId}`);
    if (paragraph) paragraph.classList.remove('hidden');
    if (editor) editor.classList.add('hidden');
}

async function savePostEdit(postId, btn) {
    const card = btn ? btn.closest('[data-post-card]') : null;
    const input = card ? card.querySelector('.post-edit-input') : document.getElementById(`post-edit-input-${postId}`);
    if (!input) return;

    const text = (input.value || '').trim();
    if (text === '') {
        showError('Write something before saving your changes.');
        return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
    const result = await ULinkAPI.editPost(Number(postId), text);
    if (btn) { btn.disabled = false; btn.textContent = 'Save'; }

    if (result.status !== 'success') {
        showError(result.message || 'Could not save your changes.');
        return;
    }

    const newText = result.post && typeof result.post.text === 'string' ? result.post.text : text;
    applyPostText(postId, newText);
    cancelPostEdit(postId, btn);
    showToast('Post updated.', 'success');
}

function applyPostText(postId, text) {
    [(state.posts || []), (state.myPosts || [])].forEach(list => {
        list.forEach(p => { if (String(p.id) === String(postId)) p.text = text; });
    });
    document.querySelectorAll(`[data-post-card="${postId}"]`).forEach(card => {
        const paragraph = card.querySelector('.post-text');
        if (paragraph) paragraph.textContent = text;
    });
}

// Save/unsave is a server-side bookmark (saved_posts). Update the button in
// place rather than re-rendering so the feed does not jump, then drop the card
// when unsaving from the Saved tab.
async function toggleSavePost(postId) {
    closeAllPostMenus();
    if (!findPost(postId)) return;

    const result = await ULinkAPI.savePost(Number(postId));
    if (result.status !== 'success') {
        showError(result.message || 'Could not update your saved posts.');
        return;
    }

    const saved = Boolean(result.saved);
    applyPostSaved(postId, saved);
    showToast(saved ? 'Saved to your posts.' : 'Removed from your saved posts.', saved ? 'success' : 'info');

    if (state.feedScope === 'saved' && !saved && activeTab === 'home') {
        renderFeed();
    }
}

function applyPostSaved(postId, saved) {
    [(state.posts || []), (state.myPosts || [])].forEach(list => {
        list.forEach(p => { if (String(p.id) === String(postId)) p.saved = saved; });
    });
    document.querySelectorAll(`[data-post-card="${postId}"]`).forEach(card => {
        const label = card.querySelector('.post-save-label');
        const icon = card.querySelector('.post-save-icon');
        if (label) label.textContent = saved ? 'Unsave post' : 'Save post';
        if (icon) icon.textContent = saved ? 'bookmark_remove' : 'bookmark_add';
    });
}

// Hiding is a local, per-account preference. It removes the card from this
// viewer's feed only (never from the author's profile), and the toast offers an
// immediate undo.
function hidePost(postId) {
    closeAllPostMenus();
    state.hiddenPosts.add(String(postId));
    persistHiddenPosts();
    if (activeTab === 'home') renderFeed();
    showToast('Post hidden from your feed.', 'info', 6000, {
        label: 'Undo',
        onClick: () => unhidePost(postId)
    });
}

function unhidePost(postId) {
    state.hiddenPosts.delete(String(postId));
    persistHiddenPosts();
    if (activeTab === 'home') renderFeed();
    showToast('Post restored.', 'success');
}

function hiddenPostsStorageKey() {
    const uid = state.user && state.user.id ? state.user.id : 'guest';
    return `ulink_hidden_posts_${uid}`;
}

function loadHiddenPosts() {
    state.hiddenPosts = new Set();
    try {
        const raw = localStorage.getItem(hiddenPostsStorageKey());
        if (raw) JSON.parse(raw).forEach(id => state.hiddenPosts.add(String(id)));
    } catch (e) {
        // A corrupt value must never break the feed; start with an empty set.
        state.hiddenPosts = new Set();
    }
}

function persistHiddenPosts() {
    try {
        localStorage.setItem(hiddenPostsStorageKey(), JSON.stringify([...state.hiddenPosts]));
    } catch (e) {
        // Storage can be full or blocked; hiding still works for this session.
    }
}

async function copyPostLink(postId) {
    closeAllPostMenus();
    const url = `${location.origin}${location.pathname}?post=${encodeURIComponent(postId)}`;

    // Prefer the async clipboard API when it is available, but fall back to the
    // legacy selection copy if it is missing *or* rejects. A secure context can
    // expose navigator.clipboard yet refuse the write (permissions, no transient
    // activation), and the legacy route still works there. Only report failure
    // when neither route succeeds.
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(url);
            copied = true;
        } catch (e) {
            copied = false;
        }
    }

    if (!copied) {
        try {
            const scratch = document.createElement('textarea');
            scratch.value = url;
            scratch.setAttribute('readonly', '');
            scratch.style.position = 'fixed';
            scratch.style.opacity = '0';
            document.body.appendChild(scratch);
            scratch.select();
            copied = document.execCommand('copy');
            scratch.remove();
        } catch (e) {
            copied = false;
        }
    }

    if (copied) {
        showToast('Link copied to clipboard.', 'success');
    } else {
        showError('Could not copy the link automatically.');
    }
}

function openReportModal(postId) {
    closeAllPostMenus();
    const overlay = document.getElementById('report-overlay');
    if (!overlay) {
        showError('Reporting is unavailable right now.');
        return;
    }

    state.reportPostId = String(postId);
    const form = document.getElementById('report-form');
    if (form) form.reset();
    const firstReason = document.querySelector('input[name="report-reason"]');
    if (firstReason) firstReason.checked = true;
    const details = document.getElementById('report-details');
    if (details) details.value = '';

    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    const firstButton = overlay.querySelector('button, input');
    if (firstButton) firstButton.focus();
}

function closeReportModal() {
    const overlay = document.getElementById('report-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }
    state.reportPostId = null;
}

async function submitPostReport(btn) {
    const postId = state.reportPostId;
    if (!postId) { closeReportModal(); return; }

    const reasonEl = document.querySelector('input[name="report-reason"]:checked');
    const reason = reasonEl ? reasonEl.value : 'other';
    const detailsEl = document.getElementById('report-details');
    const details = detailsEl ? detailsEl.value.trim() : '';

    if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }
    const result = await ULinkAPI.reportPost(Number(postId), reason, details);
    if (btn) { btn.disabled = false; btn.textContent = 'Submit report'; }

    if (result.status !== 'success') {
        showError(result.message || 'Could not submit the report.');
        return;
    }

    closeReportModal();
    showToast(result.message || 'Thanks. Our moderators will review this post.', 'success');
}

// A copied link points back at this page with ?post=<id>. Pull just that post
// and scroll to it, so a shared link lands on the post rather than the top of
// the feed.
async function handlePostDeepLink() {
    const params = new URLSearchParams(location.search);
    const postId = params.get('post');
    if (!postId || !ULink.isLive || !state.user) return;

    try {
        const result = await ULinkAPI.fetchPosts({ id: Number(postId), scope: 'all', limit: 1 });
        const rows = (result.status === 'success' && Array.isArray(result.data)) ? result.data : [];
        if (rows.length === 0) {
            showToast('That post is no longer available.', 'warning');
            return;
        }
        const post = normalisePost(rows[0]);
        if (activeTab !== 'home') switchTab('home');

        // renderFeed() refetches the newsfeed and replaces state.posts wholesale,
        // so the linked post has to be merged in *after* that fetch. Unshifting it
        // first only worked when the post also belonged in the default feed; a
        // community or otherwise off-feed post was dropped by the render.
        await renderFeed();
        if (!state.posts.some(p => String(p.id) === String(post.id))) {
            state.posts.unshift(post);
            const container = document.getElementById('feed-container');
            if (container) container.insertAdjacentHTML('afterbegin', createPostHTML(post));
        }
        highlightPost(String(post.id));
    } catch (e) {
        // A failed deep link should not break the normal feed load.
        console.warn('Could not open the linked post', e);
    }
}

function highlightPost(postId) {
    const card = document.querySelector(`[data-post-card="${String(postId).replace(/"/g, '')}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-surface');
    setTimeout(() => card.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-surface'), 2600);
}

async function toggleLike(postId, btn) {
    const post = findPost(postId);
    if (post) {
        // No userId: the like is recorded against the session holder.
        const result = await ULinkAPI.likePost(Number(post.id));
        if (result.status !== 'success') {
            if (showError) showError(result.message || 'Could not update your like.');
            return;
        }

        // Trust the server's counts rather than incrementing locally, so the
        // button cannot drift away from the stored value.
        post.liked = result.action === 'liked';
        post.likes = result.likes;
        ActivityLogger.logPostLiked(Number(post.id));

        if (btn) {
            const iconDiv = btn.querySelector('div');
            const iconSpan = btn.querySelector('span.material-symbols-outlined');
            const textSpan = btn.querySelectorAll('span')[1];

            if (post.liked) {
                iconDiv.classList.add('bg-red-50', 'dark:bg-red-900/20');
                iconSpan.classList.remove('text-slate-500');
                iconSpan.classList.add('text-red-500', 'like-animation');
                iconSpan.innerText = 'favorite';
                iconSpan.style.fontVariationSettings = "'FILL' 1";

                textSpan.classList.remove('text-slate-500');
                textSpan.classList.add('text-red-500');

                setTimeout(() => iconSpan.classList.remove('like-animation'), 500);
            } else {
                iconDiv.classList.remove('bg-red-50', 'dark:bg-red-900/20');
                iconSpan.classList.remove('text-red-500');
                iconSpan.classList.add('text-slate-500');
                iconSpan.innerText = 'favorite_border';
                iconSpan.style.fontVariationSettings = "'FILL' 0";

                textSpan.classList.remove('text-red-500');
                textSpan.classList.add('text-slate-500');
            }
            textSpan.innerText = post.likes;
        } else {
            if (activeTab === 'home') renderFeed();
            if (activeTab === 'profile') renderUserPosts();
            if (activeTab === 'other-profile' && currentOtherUserId) openPublicProfile(currentOtherUserId);
        }
    }
}

function toggleComments(btn) {
    // Use relative DOM traversal to avoid duplicate ID issues across home/profile views
    const postCard = btn.closest('[data-post-card]');
    if (postCard) {
        const commentsDiv = postCard.querySelector('.post-comments-section');
        if (commentsDiv) {
            commentsDiv.classList.toggle('hidden');
            // Focus the comment input when opened
            if (!commentsDiv.classList.contains('hidden')) {
                const input = commentsDiv.querySelector('.post-comment-input');
                if (input) setTimeout(() => input.focus(), 50);
            }
        }
    }
}

async function submitComment(postId, btn) {
    // Use relative DOM traversal to avoid duplicate ID issues
    const postCard = btn.closest('[data-post-card]');
    const input = postCard ? postCard.querySelector('.post-comment-input') : null;
    const text = input ? input.value.trim() : '';
    if (!text) return;

    const post = findPost(postId);
    if (post) {
        const result = await ULinkAPI.commentPost(Number(post.id), text);
        if (result.status !== 'success') {
            if (showError) showError(result.message || 'Could not add your comment.');
            return;
        }

        const comment = result.comment;
        if (!post.commentsList) post.commentsList = [];
        post.commentsList.push({
            id: comment.id,
            userId: comment.userId ?? state.user.id,
            name: comment.name || state.user.name,
            pic: comment.pic || state.user.pic,
            text: comment.text || text
        });
        post.comments = result.comments ?? post.commentsList.length;

        ActivityLogger.logCommentAdded(Number(post.id), comment.id, text.length);

        input.value = '';

        // Update only the comments list within this specific post card (no full re-render needed)
        const commentsListDiv = postCard.querySelector('.max-h-40');
        if (commentsListDiv) {
            const newComment = document.createElement('div');
            newComment.className = 'bg-surface-container-high rounded-xl p-3 mb-2 border border-slate-100 dark:border-slate-800';
            newComment.innerHTML = `<span class="font-extrabold text-xs mr-1 cursor-pointer hover:underline text-primary" onclick="openPublicProfile('${state.user.id}')">${escapeHtml(post.commentsList[post.commentsList.length - 1].name)}</span><span class="text-sm text-slate-700 dark:text-slate-300 font-medium">${escapeHtml(post.commentsList[post.commentsList.length - 1].text)}</span>`;
            commentsListDiv.appendChild(newComment);
            commentsListDiv.scrollTop = commentsListDiv.scrollHeight;
        }

        // Also update the comment count in the button
        const commentBtn = postCard.querySelector('[onclick^="toggleComments"]');
        if (commentBtn) {
            const countSpan = commentBtn.querySelector('span.text-sm.font-bold');
            if (countSpan) countSpan.textContent = post.comments;
        }
    }
}

// --- Search & Profiles ---
async function handleSearch() {
    const input = document.getElementById('search-input');
    const dropdown = document.getElementById('search-dropdown');
    if (!input || !dropdown) return;

    const query = input.value.trim().toLowerCase();
    if (query.length < 1) {
        dropdown.classList.add('hidden');
        return;
    }

    let results;

    if (ULink.isLive) {
        // Search the database. Drop any stale results while the request is in
        // flight so a slow response cannot overwrite a newer one.
        const requestId = (handleSearch._seq = (handleSearch._seq || 0) + 1);
        const response = await ULinkAPI.searchUsers(query, 10);
        if (requestId !== handleSearch._seq) return;

        if (response.status === 'success') {
            results = response.users || [];
        } else if (ULink.isOffline(response)) {
            dropdown.innerHTML = `<div class="p-4 text-sm text-center text-on-surface-variant">Cannot reach the server</div>`;
            dropdown.classList.remove('hidden');
            return;
        } else {
            results = [];
        }
    } else {
        results = MOCK_USERS.filter(u => u.name.toLowerCase().includes(query));
    }

    if (results.length === 0) {
        dropdown.innerHTML = `<div class="p-4 text-sm text-center text-on-surface-variant">No users found</div>`;
    } else {
        dropdown.innerHTML = results.map(u => `
        <div class="flex items-center gap-3 p-3 hover:bg-surface-container-low cursor-pointer transition-colors" onclick="openPublicProfile('${u.id}')">
            <img src="${u.pic}" class="w-8 h-8 rounded-full border border-slate-200">
            <div>
                <div class="font-bold text-sm">${u.name}</div>
                <div class="text-xs text-on-surface-variant">${escapeHtml(userSubtitle(u))}</div>
            </div>
        </div>
    `).join('');
    }
    dropdown.classList.remove('hidden');
}

// Hide search dropdown & notifications on body click
document.addEventListener('click', (e) => {
    if (!e.target.closest('#search-dropdown') && !e.target.closest('#search-input')) {
        document.getElementById('search-dropdown').classList.add('hidden');
    }
    if (!e.target.closest('#notifications-panel') && !e.target.closest('#notif-bell-btn')) {
        document.getElementById('notifications-panel').classList.add('hidden');
    }
});

async function openPublicProfile(userId) {
    if (String(userId) === String(state.user?.id)) {
        switchTab('profile');
        return;
    }

    const dropdown = document.getElementById('search-dropdown');
    const input = document.getElementById('search-input');
    if (dropdown) dropdown.classList.add('hidden');
    if (input) input.value = "";

    currentOtherUserId = userId;
    switchTab('other-profile');

    // Fetch the real profile. The email and student id are only present for the
    // session holder, so nothing sensitive leaks into this view.
    const response = await ULinkAPI.profile(Number(userId));
    const user = response.status === 'success' && response.user
        ? response.user
        : (ULink.findUser(userId) || {
            id: userId,
            name: 'Unknown User',
            role: 'student',
            dept: 'N/A',
            batch: 'N/A',
            pic: 'https://ui-avatars.com/api/?name=Unknown&background=random'
        });

    const isStudent = String(user.role || 'student').toLowerCase() === 'student';

    document.getElementById('other-profile-name').innerText = user.name || 'Unknown User';
    document.getElementById('other-profile-bio').innerText = isStudent
        ? `${user.dept || 'N/A'} • Batch ${user.batch || 'N/A'}`
        : `${user.role || 'Unknown'} • ${user.dept || 'N/A'}`;
    document.getElementById('other-profile-about').innerText = user.bio || '';

    const picEl = document.getElementById('other-profile-picture');
    picEl.src = user.pic || 'Asserts/default-avatar.jpg';
    picEl.onerror = function () { this.onerror = null; this.src = 'Asserts/default-avatar.jpg'; };

    // Real counts, not the random numbers the mock profile invented. The list of
    // posts comes from the API too - the loaded newsfeed page only holds one
    // page of everyone's posts, so filtering it would under-report.
    let userPosts = [];
    if (ULink.isLive) {
        const result = await ULinkAPI.fetchPosts({ user_id: Number(userId), scope: 'all', limit: 50 });
        if (result.status === 'success') {
            userPosts = (result.data || []).map(normalisePost);
        }
    } else {
        userPosts = state.posts.filter(p => String(p.userId) === String(userId));
    }

    document.getElementById('other-profile-posts-count').innerText =
        user.postsCount ?? user.posts_count ?? userPosts.length;
    document.getElementById('other-profile-friends-count').innerText =
        user.friendsCount ?? user.friends_count ?? 0;

    const postsContainer = document.getElementById('other-posts-container');
    if (userPosts.length === 0) {
        postsContainer.innerHTML = `<p class="text-on-surface-variant text-center py-8">No posts yet.</p>`;
    } else {
        postsContainer.innerHTML = userPosts.map(post => createPostHTML(post)).join('');
    }

    const target = Number(user.id);
    const isFriend = state.friends.map(String).includes(String(target));
    const isPending = (ULink.data.sent || []).some(u => String(u.id) === String(target));

    let actionHtml;
    if (isFriend) {
        actionHtml = `<button class="px-6 py-2 bg-surface-container-high text-on-surface rounded-full font-bold shadow-sm cursor-default text-sm">Connected</button>
                      <button onclick="openChat('${target}')" class="px-6 py-2 bg-primary text-on-primary rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-1"><span class="material-symbols-outlined text-sm">chat</span> Message</button>`;
    } else if (isPending) {
        actionHtml = `<button class="px-6 py-2 bg-slate-200 dark:bg-surface-container-highest text-slate-500 rounded-full font-bold shadow-sm cursor-default text-sm">Requested</button>
                      <button onclick="openChat('${target}')" class="px-6 py-2 bg-secondary text-on-secondary rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-1"><span class="material-symbols-outlined text-sm">chat</span> Message</button>`;
    } else {
        actionHtml = `<button onclick="sendFriendRequest('${target}', this)" class="px-6 py-2 bg-primary text-on-primary rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm">Add Friend</button>
                      <button onclick="openChat('${target}')" class="px-6 py-2 bg-secondary text-on-secondary rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-1"><span class="material-symbols-outlined text-sm">chat</span> Message</button>`;
    }
    document.getElementById('other-profile-actions').innerHTML = actionHtml;
}

function closePublicProfile() { } // Stub for compatibility

// --- Messages View Logic ---

/* -------------------------------------------------------------------------- */
/* Message attachments                                                          */
/* -------------------------------------------------------------------------- */

// Mirrors the server allowlist in ulink_document_type_from_binary(). The server
// is the authority - it sniffs the bytes - but checking here means an obvious
// mistake is caught instantly with a readable message instead of after an
// upload, and the accept attribute alone cannot do this because it is only a
// filter hint the user can override.
const MESSAGE_ATTACHMENT_ACCEPT = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 'application/rtf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip', 'application/x-zip-compressed', 'application/octet-stream',
    'text/plain', 'text/csv', 'application/json'
];

// The caps the server enforces: ULINK_UPLOAD_MAX_BYTES for pictures and
// ULINK_ATTACHMENT_MAX_BYTES for documents.
const MESSAGE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const MESSAGE_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

// Icon for each document type the server accepts.
const MESSAGE_DOCUMENT_ICONS = {
    pdf: 'picture_as_pdf',
    doc: 'description', docx: 'description', rtf: 'description',
    xls: 'table_chart', xlsx: 'table_chart',
    ppt: 'slideshow', pptx: 'slideshow',
    txt: 'article', csv: 'table_rows', json: 'data_object',
    zip: 'folder_zip'
};

/**
 * Open the file picker, optionally narrowing it to pictures.
 *
 * The accept attribute is swapped in for the duration of the click, so the two
 * composer buttons can offer different filters without needing two inputs.
 */
function pickMessageAttachment(acceptFilter) {
    const input = document.getElementById('message-attachment');
    if (!input) return;

    if (acceptFilter) {
        input.dataset.defaultAccept = input.accept;
        input.accept = acceptFilter;
    }

    input.click();
}

/**
 * change handler for #message-attachment.
 *
 * The input's value is cleared unconditionally: without that, picking the same
 * file twice in a row fires no change event the second time and the send button
 * silently does nothing.
 */
function onMessageAttachmentPicked(input) {
    const file = input.files && input.files[0];
    const previousAccept = input.dataset.defaultAccept;

    if (previousAccept) {
        input.accept = previousAccept;
        delete input.dataset.defaultAccept;
    }

    input.value = '';

    if (!file) return;

    const problem = validateMessageAttachment(file);
    if (problem) {
        if (showError) showError(problem);
        return;
    }

    state.pendingAttachment = file;
    renderMessageAttachmentPreview();
}

/**
 * @returns {string|null} A message saying why the file cannot be sent, or null
 *   when it is acceptable.
 */
function validateMessageAttachment(file) {
    if (!file || typeof file.size !== 'number') {
        return 'That file could not be read.';
    }

    if (file.size === 0) {
        return 'That file is empty.';
    }

    // A browser's reported type comes from the OS registry or the file's own
    // extension, so it is a hint only - but it makes for a fast, specific error
    // message. The verdict that matters is the server sniffing the bytes.
    const type = (file.type || '').toLowerCase();

    if (type.startsWith('image/')) {
        if (!MESSAGE_ATTACHMENT_ACCEPT.includes(type)) {
            return 'Pictures must be JPG, PNG, GIF or WebP. "' + file.name + '" is a ' + type + ' file.';
        }
        if (file.size > MESSAGE_IMAGE_MAX_BYTES) {
            return 'Pictures can be up to ' + formatFileSize(MESSAGE_IMAGE_MAX_BYTES)
                + '. "' + file.name + '" is ' + formatFileSize(file.size) + '.';
        }
        return null;
    }

    // An empty or generic type is left to the server, which sniffs the content.
    if (type && !MESSAGE_ATTACHMENT_ACCEPT.includes(type)) {
        return 'Documents must be PDF, Word, Excel, PowerPoint, RTF, text, CSV, JSON or ZIP. "'
            + file.name + '" is ' + (/^[aeiou]/i.test(type) ? 'an ' : 'a ') + type + ' file.';
    }

    if (file.size > MESSAGE_DOCUMENT_MAX_BYTES) {
        return 'Documents can be up to ' + formatFileSize(MESSAGE_DOCUMENT_MAX_BYTES)
            + '. "' + file.name + '" is ' + formatFileSize(file.size) + '.';
    }

    return null;
}

/** Human-readable byte count. */
function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/** Lower-cased extension, without the dot. */
function fileExtension(name) {
    const text = String(name || '');
    const dot = text.lastIndexOf('.');
    return dot > 0 ? text.slice(dot + 1).toLowerCase() : '';
}

/** Throw away whatever is queued for the next message. */
function clearMessageAttachment() {
    state.pendingAttachment = null;

    const input = document.getElementById('message-attachment');
    if (input) {
        input.value = '';
        delete input.dataset.defaultAccept;
    }

    renderMessageAttachmentPreview();
}

/**
 * Draw the queued attachment as a dismissible chip above the composer.
 *
 * A pending picture gets a real thumbnail from a local object URL, which also
 * confirms the file renders as an image before anything is uploaded.
 */
function renderMessageAttachmentPreview() {
    const container = document.getElementById('message-attachment-preview');
    if (!container) return;

    // Release the previous thumbnail before replacing the markup, or every
    // pick leaks an object URL for the life of the document.
    container.querySelectorAll('img[data-object-url]').forEach(img => {
        if (img.dataset.objectUrl) URL.revokeObjectURL(img.dataset.objectUrl);
    });

    const file = state.pendingAttachment;
    if (!file) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    container.classList.remove('hidden');

    let thumb;
    if ((file.type || '').startsWith('image/')) {
        const url = URL.createObjectURL(file);
        thumb = '<img src="' + escapeHtml(url) + '" data-object-url="1" alt=""'
            + ' class="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-600 flex-shrink-0">';
    } else {
        const icon = MESSAGE_DOCUMENT_ICONS[fileExtension(file.name)] || 'insert_drive_file';
        thumb = '<div class="w-14 h-14 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary'
            + ' flex items-center justify-center flex-shrink-0">'
            + '<span class="material-symbols-outlined text-[26px]">' + icon + '</span></div>';
    }

    container.innerHTML = ''
        + '<div class="flex items-center gap-3 p-2 pr-3 rounded-2xl max-w-full'
        + ' bg-slate-100 dark:bg-surface-container-highest border border-slate-200 dark:border-slate-600">'
        + thumb
        + '<div class="min-w-0">'
        + '<p class="text-[13px] font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">'
        + escapeHtml(file.name || 'Attachment') + '</p>'
        + '<p class="text-[11px] font-medium text-slate-500 dark:text-slate-400">'
        + escapeHtml(formatFileSize(file.size)) + '</p>'
        + '</div>'
        + '<button onclick="clearMessageAttachment()" title="Remove attachment" aria-label="Remove attachment"'
        + ' class="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:text-error hover:bg-error/10 transition-all'
        + ' flex items-center justify-center flex-shrink-0">'
        + '<span class="material-symbols-outlined text-[18px]">close</span></button>'
        + '</div>';
}

function renderMessagesViewList(query = '') {
    const container = document.getElementById('messages-contact-list');
    if (!container) return;

    let users;

    if (ULink.isLive) {
        // The server owns conversation state: one row per thread, newest first.
        users = (ULink.data.conversations || []).map(row => ({
            id: row.userId,
            name: row.name,
            pic: row.pic,
            lastMessage: row.lastMessage || 'Start chatting...',
            unread: row.unread || 0,
            isMe: Boolean(row.lastFromMe),
            attachment: row.attachment || null
        }));

        // Threads the user has never started are not in the response, so offer
        // friends as "new chat" entries too.
        const known = new Set(users.map(u => String(u.id)));
        for (const friend of (ULink.data.friends || [])) {
            if (!known.has(String(friend.id))) {
                users.push({
                    id: friend.id,
                    name: friend.name,
                    pic: friend.pic,
                    lastMessage: 'Start chatting...',
                    unread: 0,
                    isMe: false,
                    isNew: true
                });
            }
        }
    } else {
        // Get unique users from chat history or fallback to friends if empty
        let chatUserIds = Object.keys(state.chatHistory);
        if (chatUserIds.length === 0) chatUserIds = state.friends.slice(0, 5);

        users = chatUserIds.map(id => MOCK_USERS.find(u => String(u.id) === String(id))).filter(Boolean);
        users = users.map(user => {
            const history = state.chatHistory[user.id] || [];
            const last = history[history.length - 1];
            return {
                ...user,
                lastMessage: last ? last.text : 'Start chatting...',
                unread: 0,
                isMe: Boolean(last && last.sender === 'me')
            };
        });
    }

    if (query) {
        const needle = query.toLowerCase();
        users = users.filter(u => (u.name || '').toLowerCase().includes(needle));
    }

    if (users.length === 0) {
        container.innerHTML = `<p class="text-on-surface-variant text-center py-8 px-4">No conversations yet.</p>`;
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="p-3 hover:bg-white dark:hover:bg-slate-700/50 rounded-2xl cursor-pointer transition-all flex gap-3 items-center border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm" onclick="openMessagesViewChat('${user.id}')">
            <div class="relative flex-shrink-0">
                <img src="${escapeHtml(user.pic || '')}" onerror="this.src='Asserts/default-avatar.jpg'" class="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-[0_2px_5px_rgba(0,0,0,0.05)]">
                ${user.unread ? `<div class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">${user.unread}</div>` : ''}
            </div>
            <div class="flex-1 overflow-hidden">
                <h4 class="font-bold text-[14px] text-slate-800 dark:text-slate-200 truncate">${escapeHtml(user.name || '')}</h4>
                <p class="text-[12px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">${user.isMe ? 'You: ' : ''}${user.attachment ? attachmentListGlyph(user.attachment.type) : ''}${escapeHtml(user.lastMessage || '')}</p>
            </div>
        </div>`).join('');
}

/**
 * Small leading glyph for a thread whose last message carried an attachment.
 *
 * The server already replaces an empty body with "Sent a photo" / "Sent a
 * document", so the glyph is a cue rather than the only signal - a thread with
 * both text and a file gets the glyph next to the text.
 */
function attachmentListGlyph(type) {
    const icon = type === 'image' ? 'image' : 'draft';
    return '<span class="material-symbols-outlined text-[13px] align-[-3px] mr-1 text-primary" aria-hidden="true">'
        + icon + '</span>';
}

function handleMessagesSearch() {
    const query = document.getElementById('messages-search-input').value;
    renderMessagesViewList(query);
}

/**
 * Re-read the conversation list from the server.
 *
 * Re-reading rather than reshuffling an array is what picks up messages sent
 * from another device.
 *
 * @param {boolean} quiet Suppress the toast on failure - used when the list is
 *   loaded as a side effect of opening the tab, where an error is not the
 *   user's doing and the cached list is still worth showing.
 * @returns {Promise<boolean>} Whether the server answered.
 */
async function loadConversations(quiet = false) {
    if (!ULink.isLive) return false;

    const result = await ULinkAPI.conversations();

    if (result.status === 'success') {
        ULink.data.conversations = result.conversations || [];
        return true;
    }

    if (!quiet && showError) {
        showError(result.message || 'Could not load your conversations.');
    }
    return false;
}

/** Entry point for the Messages tab: load, then paint. */
async function loadMessagesView() {
    await loadConversations(true);
    renderMessagesViewList();
}

async function refreshMessagesList() {
    const btn = document.querySelector('[title="Refresh"] span');
    if (btn) {
        btn.classList.add('animate-spin');
        setTimeout(() => btn.classList.remove('animate-spin'), 500);
    }

    const input = document.getElementById('messages-search-input');
    if (input) input.value = '';

    await loadConversations(false);

    renderMessagesViewList();
}

function startNewMessage() {
    const searchInput = document.getElementById('messages-search-input');
    if (searchInput) {
        searchInput.focus();
        // Optional: show some visual hint
        searchInput.parentElement.classList.add('ring-2', 'ring-primary');
        setTimeout(() => searchInput.parentElement.classList.remove('ring-2', 'ring-primary'), 1000);
    }
}

async function openMessagesViewChat(userId) {
    const user = ULink.findUser(userId)
        || (ULink.data.conversations || []).find(c => String(c.userId) === String(userId));

    if (!user) return;

    state.activeMessagesUserId = userId;

    // A file picked for the previous thread must not ride along into this one.
    clearMessageAttachment();

    // Hide empty state, show active chat
    document.getElementById('messages-empty-state').classList.add('hidden');
    document.getElementById('messages-active-header').classList.remove('hidden');
    document.getElementById('messages-active-header').classList.add('flex');
    document.getElementById('messages-active-body').classList.remove('hidden');
    document.getElementById('messages-active-body').classList.add('flex');
    document.getElementById('messages-active-input').classList.remove('hidden');
    document.getElementById('messages-active-input').classList.add('flex');

    // Set Header
    document.getElementById('messages-active-pic').src = user.pic;
    document.getElementById('messages-active-name').innerText = user.name;

    renderMessagesViewBody();
    setTimeout(() => document.getElementById('messages-input-field').focus(), 100);
}

async function renderMessagesViewBody() {
    const container = document.getElementById('messages-active-body');
    if (!container) return;

    let history = state.chatHistory[state.activeMessagesUserId] || [];

    if (ULink.isLive) {
        const result = await ULinkAPI.thread(Number(state.activeMessagesUserId), true);
        if (result.status !== 'success') {
            container.innerHTML = `<p class="text-on-surface-variant text-center py-8">${escapeHtml(result.message || 'Could not load this conversation.')}</p>`;
            return;
        }

        // Cache the thread so re-renders do not need another request.
        history = (result.messages || []).map(m => ({
            id: m.id,
            sender: Number(m.senderId) === Number(state.user.id) ? 'me' : 'them',
            text: m.text,
            attachment: m.attachment ? { ...m.attachment, id: m.id } : null,
            ts: m.created_at || ''
        }));
        state.chatHistory[state.activeMessagesUserId] = history;

        const peer = result.user || {};
        const picEl = document.getElementById('messages-active-pic');
        if (picEl) picEl.src = peer.pic || 'Asserts/default-avatar.jpg';
        const nameEl = document.getElementById('messages-active-name');
        if (nameEl && peer.name) nameEl.innerText = peer.name;
    }

    if (history.length === 0) {
        const user = ULink.findUser(state.activeMessagesUserId) || { name: 'this person', pic: '' };
        container.innerHTML = `<div class="text-center w-full my-auto flex flex-col items-center justify-center opacity-70">
            <img src="${escapeHtml(user.pic || '')}" onerror="this.src='Asserts/default-avatar.jpg'" class="w-20 h-20 rounded-full object-cover mb-4 shadow-sm border border-slate-200">
            <h4 class="font-bold text-lg text-slate-800 dark:text-slate-200">${escapeHtml(user.name || '')}</h4>
            <p class="text-xs text-slate-500 mt-1">Say hi to start the conversation!</p>
        </div>`;
        return;
    }

    const peer = ULink.findUser(state.activeMessagesUserId) || { pic: '', name: '' };

    // Object URLs minted for the previous render are about to be discarded.
    releaseMessageImageUrls(container);

    container.innerHTML = history.map(msg => {
        const bubble = renderMessageAttachment(msg)
            || (msg.text ? `<div class="px-5 py-2.5 text-[14px] font-medium tracking-wide leading-relaxed whitespace-pre-wrap break-words">${escapeHtml(msg.text)}</div>` : '');

        if (!bubble) return '';

        if (msg.sender === 'me') {
            return `<div class="flex justify-end mb-2 slide-in-bottom">
                <div class="bg-gradient-to-br from-cta-from to-cta-to text-on-cta max-w-[75%] rounded-[20px] rounded-br-[4px] overflow-hidden shadow-[0_4px_10px_rgba(243,109,33,0.2)]">${bubble}</div>
            </div>`;
        }

        return `<div class="flex justify-start mb-2 gap-3 slide-in-bottom">
            <img src="${escapeHtml(peer.pic || '')}" onerror="this.src='Asserts/default-avatar.jpg'" class="w-8 h-8 rounded-full object-cover mt-auto border-2 border-white dark:border-slate-800 shadow-sm flex-shrink-0">
            <div class="bg-white dark:bg-surface-container-lowest border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 max-w-[75%] rounded-[20px] rounded-bl-[4px] overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.02)]">${bubble}</div>
        </div>`;
    }).join('');

    // Images arrive after the request for their bytes. The scroll below is done
    // against the placeholder layout, so images landing later cannot scroll the
    // container back to the wrong place.
    hydrateMessageImages(container);

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

/**
 * Render the attachment carried by a message, or null when it carries none.
 *
 * A message can have a picture, a document, both, or - in principle - neither,
 * so the caller falls back to the text body when this returns null.
 */
function renderMessageAttachment(msg) {
    const attachment = msg.attachment;
    if (!attachment) return null;

    // Offline stub: the bytes never left the browser, so there is nothing to
    // fetch and nothing to download - show what is locally available.
    if (attachment.local) {
        const caption = msg.text
            ? '<div class="px-5 py-2.5 text-[14px] font-medium leading-relaxed whitespace-pre-wrap break-words">'
                + escapeHtml(msg.text) + '</div>'
            : '';

        if (attachment.type === 'image' && attachment.url) {
            // The same definite box as the live path in hydrateMessageImages(),
            // and for the same reason: without it the flex row collapses around
            // the image and the picture disappears.
            return caption
                + '<img src="' + escapeHtml(attachment.url) + '" alt="Shared picture"'
                + ' class="w-64 max-w-full h-44 object-cover block">';
        }

        return caption + renderMessageDocument(attachment, 'Not sent: you are offline.');
    }

    if (!attachment.url) return null;

    const caption = msg.text
        ? `<div class="px-5 py-2.5 text-[14px] font-medium tracking-wide leading-relaxed whitespace-pre-wrap break-words">${escapeHtml(msg.text)}</div>`
        : '';

    if (attachment.type === 'image') {
        // A placeholder, not the picture: the bytes come from the download
        // endpoint, which checks that the viewer is a participant before it
        // returns anything. Pointing an <img> straight at the endpoint would
        // also work for cookies, but going through fetch lets the object URL be
        // revoked deterministically when the thread is re-rendered.
        //
        // The fixed size is deliberate: it reserves the space the picture will
        // occupy, so the thread does not jump every time an image lands.
        return caption
            + '<div class="message-image-attach w-64 max-w-full h-44 bg-black/10 dark:bg-black/30'
            + ' rounded-[14px] flex items-center justify-center"'
            + ' data-message-id="' + escapeHtml(String(msg.id || '')) + '">'
            + '<span class="material-symbols-outlined text-[28px] text-current animate-pulse">image</span>'
            + '</div>';
    }

    return caption + renderMessageDocument(attachment, '');
}

/** The download row used for a document attachment. */
function renderMessageDocument(attachment, note) {
    const icon = MESSAGE_DOCUMENT_ICONS[fileExtension(attachment.name)] || 'insert_drive_file';
    const size = attachment.size ? formatFileSize(attachment.size) : '';

    // An `attachment` download hint plus an onclick that fetches through the API:
    // the bytes are never rendered in the page and the endpoint URL is never
    // pasted into the address bar, so it cannot be shared by accident.
    const action = attachment.local || !attachment.id
        ? ''
        : ' onclick="return downloadMessageAttachment(' + escapeHtml(String(attachment.id)) + ')"';

    return '<a href="#" download class="flex items-center gap-3 px-4 py-3'
        + (attachment.local ? '' : ' hover:bg-black/5 dark:hover:bg-white/5') + ' transition-colors no-underline"'
        + action + '>'
        // The tile and both icons take the bubble's own text colour rather than
        // a fixed `text-primary`. A `<span>` inherits `color`, so inside an
        // outgoing bubble - whose wrapper is the orange CTA gradient with
        // `text-on-cta` - the icon was primary-on-primary: a ratio of 1, an
        // invisible glyph. Incoming bubbles still tint it with the frosted tile.
        + '<div class="w-10 h-10 rounded-lg bg-black/5 dark:bg-white/10 text-current flex items-center justify-center flex-shrink-0">'
        + '<span class="material-symbols-outlined text-[22px]">' + icon + '</span></div>'
        + '<div class="min-w-0 flex-1">'
        + '<p class="text-[13px] font-semibold truncate">' + escapeHtml(attachment.name || 'Document') + '</p>'
        // No opacity here: it was dropping the 11px line to 3.3:1 on an outgoing
        // bubble, under the 4.5:1 that small text needs. Size and weight carry
        // the hierarchy instead of contrast.
        + '<p class="text-[11px] font-medium">' + escapeHtml(note || size) + '</p>'
        + '</div>'
        // The download glyph had the same opacity problem: at 60% it measured
        // 2.8:1 on the gradient, under the 3:1 a graphical control needs. Full
        // strength and the same inherited colour clear it.
        + (attachment.local || !attachment.id
            ? ''
            : '<span class="material-symbols-outlined text-[20px] flex-shrink-0">download</span>')
        + '</a>';
}

/**
 * Fetch and display the pictures in a rendered thread.
 *
 * Done after the markup is in place so the layout is already correct, and one
 * at a time so a long thread does not open a dozen parallel requests.
 */
async function hydrateMessageImages(container) {
    const placeholders = Array.from(container.querySelectorAll('.message-image-attach'));
    if (placeholders.length === 0) return;

    // Sequentially rather than in parallel: a thread can hold a dozen pictures
    // and firing every request at once would delay the first one behind the rest.
    for (const placeholder of placeholders) {
        const messageId = placeholder.dataset.messageId;
        if (!messageId) continue;

        const result = await ULinkAPI.getAttachment(messageId);

        // The thread was re-rendered, or scrolled away from, while the bytes
        // were in flight.
        if (!placeholder.isConnected) continue;

        if (result.status !== 'success' || !result.blob) {
            placeholder.outerHTML = '<div class="px-5 py-3 text-[13px] font-medium flex items-center gap-2">'
                + '<span class="material-symbols-outlined text-[18px]">broken_image</span>'
                + escapeHtml(result.message || 'This picture is no longer available.')
                + '</div>';
            continue;
        }

        const url = URL.createObjectURL(result.blob);
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Shared picture';
        img.dataset.objectUrl = url;
        // A definite box, which is what makes the picture appear at all.
        //
        // The bubble is a flex row sized by its content, and this image is that
        // content. Given only `max-w-full` the width resolves against a parent
        // waiting on the image, so it resolves to zero; the element is then 0x0
        // and never loads, and every picture message rendered as an invisible
        // sliver. `w-64 h-44` is the same box the placeholder in
        // renderMessageAttachment() reserves, so the picture drops into space
        // that has already been made for it - no jump when it arrives, and the
        // fixed size keeps a very tall photo from swallowing the thread. The full
        // image is a click away. `loading="lazy"` is deliberately absent: the
        // bytes are already in hand, fetched one message at a time.
        img.className = 'w-64 max-w-full h-44 object-cover cursor-zoom-in block';

        placeholder.replaceWith(img);

        img.onload = () => { img.onclick = () => openImageViewer(url); };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            img.remove();
            placeholder.replaceWith(Object.assign(document.createElement('div'), {
                className: 'px-5 py-3 text-[13px] font-medium flex items-center gap-2',
                textContent: 'This picture could not be displayed.'
            }));
        };
    }
}

/** Drop the object URLs held by the images inside a container. */
function releaseMessageImageUrls(container) {
    container.querySelectorAll('[data-object-url]').forEach(el => {
        if (el.dataset.objectUrl) URL.revokeObjectURL(el.dataset.objectUrl);
    });
}

/**
 * Download a document attachment and save it under its original name.
 *
 * Returns false so the anchor's default navigation is suppressed - the browser
 * would otherwise treat the href="#" click as a page navigation.
 */
async function downloadMessageAttachment(messageId) {
    const button = document.activeElement;
    if (button) button.setAttribute('aria-busy', 'true');

    const result = await ULinkAPI.getAttachment(messageId);

    if (button) {
        button.removeAttribute('aria-busy');
        button.classList.remove('opacity-50', 'pointer-events-none');
    }

    if (result.status !== 'success' || !result.blob) {
        if (showError) showError(result.message || 'That file could not be downloaded.');
        return false;
    }

    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename || 'attachment';
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Revoked on the next tick: revoking synchronously can cancel the download
    // in some browsers before it has read the blob.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return false;
}

function generateAutoReply(text) {
    const lowerText = text.toLowerCase();

    // Greetings
    if (lowerText.match(/\\b(hi|hello|hey|sup)\\b/)) {
        const replies = ["Hi there! How's your day going?", "Hello! What's up?", "Hey! Need anything?", "Hi! Doing well?"];
        return replies[Math.floor(Math.random() * replies.length)];
    }
    // How are you
    else if (lowerText.includes("how are you") || lowerText.includes("how r u") || lowerText.includes("hows it going")) {
        const replies = ["I'm doing well, just trying to focus on my assignments. You?", "Been a bit busy, but I'm good! How about you?", "Doing great! The weather is nice today."];
        return replies[Math.floor(Math.random() * replies.length)];
    }
    // Academics: Assignment / Homework / Project
    else if (lowerText.match(/\\b(project|assignment|homework|report|presentation)\\b/)) {
        return "I'm still working on mine too. The deadline is pretty close!";
    }
    // Facilities: Canteen / Food / Hungry
    else if (lowerText.match(/\\b(food|eat|lunch|canteen|cafeteria|hungry)\\b/)) {
        return "Let's go to the cafeteria! I'm starving. 🍔";
    }
    // Facilities: Library / Study
    else if (lowerText.match(/\\b(library|study|quiet)\\b/)) {
        return "The library is totally packed right now. Any other good spots?";
    }
    // Campus life/Classes / Exams
    else if (lowerText.match(/\\b(exam|quiz|midterm|final)\\b/)) {
        return "Don't remind me... I need to start studying for that. 😭";
    }
    else if (lowerText.match(/\\b(class|room|schedule|routine)\\b/)) {
        return "Not sure about the exact room, did you check the online portal?";
    }
    else if (lowerText.match(/\\b(notes|slide|pdf|material)\\b/)) {
        return "I don't have the complete notes right now, but I can send you the slides later tonight!";
    }
    // Help / Questions
    else if (lowerText.includes("help") || lowerText.includes("question") || lowerText.includes("confused")) {
        return "Sure, what do you need help with? I'll try my best!";
    }
    // Fun / Love
    else if (lowerText.includes("love") || lowerText.includes("miss you")) {
        return "Are you sure? Actually I have the same feelings for you too! 😅";
    }
    // Goodbyes
    else if (lowerText.match(/\\b(bye|goodbye|cya|see ya|ttyl)\\b/)) {
        return "Talk to you later! Bye!";
    }
    // Thanks
    else if (lowerText.includes("thanks") || lowerText.includes("thank you") || lowerText.includes("thnx")) {
        return "You're very welcome! Let me know if you need anything else.";
    }
    // Default Fallback
    else {
        const defaults = ["That makes sense. Tell me more!", "Haha yeah, absolutely.", "I completely agree with you on that.", "Wait, really? 😅", "I'll have to think about that and let you know!"];
        return defaults[Math.floor(Math.random() * defaults.length)];
    }
}

/**
 * Send whatever is in the composer.
 *
 * The pending attachment is sent with the text, and the send button is disabled
 * for the duration so a slow upload on a large file cannot be submitted twice.
 * On failure the text and the attachment are both left in place - a failed send
 * is usually a connectivity blip, and clearing the composer would throw the
 * user's work away.
 */
async function sendMessagesViewMessage() {
    const input = document.getElementById('messages-input-field');
    const text = input.value.trim();
    const file = state.pendingAttachment;

    if ((!text && !file) || !state.activeMessagesUserId) return;

    if (ULink.isLive) {
        setMessagesSending(true);

        const result = await ULinkAPI.sendMessage(Number(state.activeMessagesUserId), text, file);
        setMessagesSending(false);

        if (result.status !== 'success') {
            if (showError) showError(result.message || 'Could not send your message.');
            return;
        }

        input.value = '';
        clearMessageAttachment();
        ActivityLogger.logMessageSent(Number(state.activeMessagesUserId), text.length);

        // The sent message plus any history the server now holds.
        await renderMessagesViewBody();
        await refreshMessagesList();
        return;
    }

    // Offline demo path: there is no upload endpoint to call, so a picked file
    // is shown locally as a stub and its bytes are dropped.
    if (!state.chatHistory[state.activeMessagesUserId]) {
        state.chatHistory[state.activeMessagesUserId] = [];
    }

    if (file) {
        const isImage = (file.type || '').startsWith('image/');
        state.chatHistory[state.activeMessagesUserId].push({
            sender: 'me',
            text: text,
            attachment: {
                type: isImage ? 'image' : 'file',
                name: file.name || 'Attachment',
                size: file.size,
                // No id, so renderMessageAttachment() keeps this on the local
                // path rather than asking the API for bytes that were never sent.
                local: true,
                url: isImage ? URL.createObjectURL(file) : ''
            }
        });
    }

    state.chatHistory[state.activeMessagesUserId].push({ sender: 'me', text: text });
    input.value = '';
    clearMessageAttachment();

    renderMessagesViewBody();
    renderMessagesViewList(); // update sidebar latest msg

    if (!text) return;   // nothing for the canned reply to work from

    const botReply = generateAutoReply(text);

    // Simulate typing and reply
    setTimeout(() => {
        if (state.activeMessagesUserId) {
            state.chatHistory[state.activeMessagesUserId].push({ sender: 'them', text: 'Typing...' });
            renderMessagesViewBody();
            renderMessagesViewList();

            setTimeout(() => {
                const hist = state.chatHistory[state.activeMessagesUserId];
                if (hist && hist.length > 0 && hist[hist.length - 1].text === 'Typing...') {
                    hist.pop(); // remove typing indicator
                    hist.push({ sender: 'them', text: botReply });
                    renderMessagesViewBody();
                    renderMessagesViewList();
                }
            }, 800 + Math.random() * 800);
        }
    }, 600);
}

/**
 * Put the composer into (or out of) its sending state.
 *
 * Disabling rather than hiding: the button has to stay in place or the input
 * shifts sideways while a file uploads, which reads as a glitch.
 */
function setMessagesSending(busy) {
    const sendBtn = document.getElementById('messages-send-btn');
    const attachBtn = document.getElementById('messages-attach-btn');
    const input = document.getElementById('messages-input-field');
    const glyph = sendBtn ? sendBtn.querySelector('.material-symbols-outlined') : null;

    if (sendBtn) {
        sendBtn.disabled = busy;
        sendBtn.classList.toggle('opacity-50', busy);
        sendBtn.classList.toggle('pointer-events-none', busy);
        sendBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
    }
    if (attachBtn) {
        attachBtn.disabled = busy;
        attachBtn.classList.toggle('opacity-40', busy);
    }
    if (input) input.disabled = busy;

    if (glyph) {
        if (busy) {
            glyph.dataset.idleIcon = glyph.textContent;
            glyph.textContent = 'progress_activity';
            glyph.classList.add('animate-spin');
        } else {
            glyph.textContent = glyph.dataset.idleIcon || 'send';
            delete glyph.dataset.idleIcon;
            glyph.classList.remove('animate-spin');
        }
    }
}
// --- Chat Logic ---
async function openChat(userId) {
    const user = ULink.findUser(userId)
        || (ULink.data.conversations || []).find(c => String(c.userId) === String(userId));

    if (!user) {
        if (showError) showError('You can only message people you have connected with.');
        return;
    }

    state.activeChatUserId = userId;
    document.getElementById('chat-user-pic').src = user.pic;
    document.getElementById('chat-user-name').innerText = user.name;

    const widget = document.getElementById('chat-widget');
    widget.classList.remove('hidden');
    setTimeout(() => {
        widget.classList.remove('scale-0');
        widget.classList.add('scale-100');
    }, 10);

    await renderChatHistory();
    setTimeout(() => document.getElementById('chat-input').focus(), 300);
}

function closeChat() {
    const widget = document.getElementById('chat-widget');
    widget.classList.remove('scale-100');
    widget.classList.add('scale-0');
    setTimeout(() => {
        widget.classList.add('hidden');
        state.activeChatUserId = null;
    }, 300);
}

async function renderChatHistory() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    container.innerHTML = "";

    let history = state.chatHistory[state.activeChatUserId] || [];

    if (ULink.isLive) {
        const result = await ULinkAPI.thread(Number(state.activeChatUserId), true);
        if (result.status !== 'success') {
            container.innerHTML = `<div class="text-center text-on-surface-variant text-xs mt-4">${escapeHtml(result.message || 'Could not load this conversation.')}</div>`;
            return;
        }

        history = (result.messages || []).map(m => ({
            sender: Number(m.senderId) === Number(state.user.id) ? 'me' : 'them',
            text: m.text
        }));
        state.chatHistory[state.activeChatUserId] = history;
    }

    if (history.length === 0) {
        const user = ULink.findUser(state.activeChatUserId);
        container.innerHTML = `<div class="text-center text-on-surface-variant text-xs mt-4">Start of conversation with ${escapeHtml(user ? String(user.name || '').split(' ')[0] : 'user')}</div>`;
        return;
    }

    history.forEach(msg => {
        const isMe = msg.sender === 'me';
        const el = document.createElement('div');
        el.className = `max-w-[80%] rounded-2xl px-4 py-2 w-fit shadow-sm break-words ${isMe ?'bg-primary text-white ml-auto rounded-tr-sm' : 'bg-surface-container-high text-on-surface mr-auto rounded-tl-sm'}`;
        el.innerText = msg.text;
        container.appendChild(el);
    });
    container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || !state.activeChatUserId) return;

    // Live: go to the server, exactly like the Messages tab does.
    //
    // This used to skip the API entirely and just push the bubble into local
    // state, then invent a canned reply. So every message sent from a profile or
    // the Friends page looked delivered in the widget and reached nobody: the
    // recipient never got it, it was absent from the Messages tab after a
    // reload, and the "reply" was generated on the sender's machine. The
    // offline branch below is honest about being a demo; this one was not.
    if (ULink.isLive) {
        const result = await ULinkAPI.sendMessage(Number(state.activeChatUserId), text);

        if (result.status !== 'success') {
            if (showError) showError(result.message || 'Could not send your message.');
            return;
        }

        input.value = '';
        ActivityLogger.logMessageSent(Number(state.activeChatUserId), text.length);

        // The server is now the source of truth for the thread, so re-render from
        // it rather than from whatever was appended locally.
        await renderChatHistory();
        if (typeof refreshMessagesList === 'function') await refreshMessagesList();
        return;
    }

    if (!state.chatHistory[state.activeChatUserId]) {
        state.chatHistory[state.activeChatUserId] = [];
    }

    state.chatHistory[state.activeChatUserId].push({ sender: 'me', text });
    input.value = "";
    renderChatHistory();

    // Bot logic
    const botReply = generateAutoReply(text);

    // Mock receiving a reply
    setTimeout(() => {
        if (state.activeChatUserId) {
            state.chatHistory[state.activeChatUserId].push({ sender: 'them', text: 'Typing...' });
            renderChatHistory();

            setTimeout(() => {
                const hist = state.chatHistory[state.activeChatUserId];
                if (hist && hist[hist.length - 1].text === 'Typing...') {
                    hist.pop(); // remove typing indicator
                    hist.push({ sender: 'them', text: botReply });
                    if (document.getElementById('chat-widget').classList.contains('scale-100')) {
                        renderChatHistory();
                    }
                }
            }, 800 + Math.random() * 800);
        }
    }, 600);
}

// --- Social Actions & Notifications ---

// Track which requests we've already fired the auto-accept for
const _pendingAutoAccepts = new Set();
// Active notification tab
let activeNotifTab = 'all';

/* ── Icon / meta helpers ─────────────────────────────── */
const NOTIF_META = {
    like: { icon: 'favorite', dot: 'notif-dot-like', label: 'Like' },
    request: { icon: 'person_add', dot: 'notif-dot-request', label: 'Request' },
    group: { icon: 'groups', dot: 'notif-dot-group', label: 'Group' },
    event: { icon: 'event', dot: 'notif-dot-event', label: 'Event' },
    comment: { icon: 'chat_bubble', dot: 'notif-dot-comment', label: 'Comment' },
    mention: { icon: 'alternate_email', dot: 'notif-dot-mention', label: 'Mention' },
    system: { icon: 'check_circle', dot: 'notif-dot-system', label: 'System' },
};

function getNotifMeta(type) {
    return NOTIF_META[type] || NOTIF_META.system;
}

/**
 * Turn a server timestamp ("Y-m-d H:i:s", UTC) into a relative label.
 * Falls back to the raw string if it cannot be parsed.
 */
function timeAgoFrom(stamp) {
    if (!stamp) return '';
    const parsed = Date.parse(String(stamp).replace(' ', 'T') + 'Z');
    if (Number.isNaN(parsed)) return String(stamp);

    const seconds = Math.max(0, Math.floor((Date.now() - parsed) / 1000));
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return new Date(parsed).toLocaleDateString();
}

function timeAgo(offset = 0) {
    const mins = [2, 5, 11, 18, 32, 47, 58];
    const hrs = [1, 2, 3, 5];
    const pick = v => v[Math.floor(Math.random() * v.length)];
    if (offset > 8) return `${pick(hrs)}h ago`;
    return `${pick(mins)}m ago`;
}

/* ── sendFriendRequest ──────────────────────────────── */
async function sendFriendRequest(userId, btnElement) {
    const showRequested = () => {
        if (!btnElement) return;
        btnElement.innerHTML = `<span class="material-symbols-outlined text-[15px]">schedule</span> Requested`;
        btnElement.classList.add('opacity-80', 'cursor-default');
        btnElement.classList.remove('bg-primary', 'hover:scale-105', 'active:scale-95');
        btnElement.onclick = null;
    };

    if (ULink.isLive) {
        if (btnElement) {
            btnElement.disabled = true;
            btnElement.innerHTML = `<span class="material-symbols-outlined text-[15px]">progress_activity</span>`;
        }

        const result = await ULinkAPI.friendAction('request', Number(userId));

        if (result.status !== 'success') {
            if (showError) showError(result.message || 'Could not send the request.');
            return;
        }

        showRequested();
        ActivityLogger.logFriendRequestSent(Number(userId));

        // Re-read so `sent` and the counters match the server, and the profile
        // button reads "Requested" instead of inviting a duplicate.
        await ULink.refreshFriends();

        if (activeTab === 'other-profile') {
            openPublicProfile(currentOtherUserId);
        }
        return;
    }

    showRequested();
    _scheduleMockAccept(userId);
}

/* ── Auto-accept simulation ──────────────────────────── */
function _scheduleMockAccept(userId) {
    if (_pendingAutoAccepts.has(userId)) return;
    _pendingAutoAccepts.add(userId);

    const delay = 4000 + Math.random() * 1000; // 4-5 seconds

    setTimeout(() => {
        const user = ULink.findUser(userId);
        if (!user) return;

        // 1. Add as friend
        if (!state.friends.map(String).includes(String(userId))) {
            state.friends.push(String(userId));
        }
        // Remove from pending requests list if present
        state.friendRequests = state.friendRequests.filter(id => String(id) !== String(userId));

        // 2. Push an "accepted" notification
        const notifId = Date.now();
        state.notifications.unshift({
            id: notifId,
            type: 'system',
            subtype: 'accepted',
            text: `${user.name} accepted your friend request! You are now connected.`,
            fromId: userId,
            pic: user.pic,
            read: false,
            ts: 'Just now'
        });

        // 3. Update badge & re-render if panel is open
        updateNotificationsBadge();
        const panel = document.getElementById('notifications-panel');
        if (panel && !panel.classList.contains('hidden')) {
            renderNotifications();
        }

        // 4. Update friends count in UI
        updateUI();
        if (activeTab === 'friends') renderFriendsView();

        // 5. Show real-time toast
        _showAcceptedToast(user);
    }, delay);
}

/* ── Toast system ─────────────────────────────────────── */
function _showAcceptedToast(user) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const id = `toast-${Date.now()}`;
    const div = document.createElement('div');
    div.id = id;
    div.className = 'toast-notif toast-accepted';
    div.innerHTML = `
        <div class="relative flex-shrink-0">
            <img src="${user.pic}" alt="${user.name}"
                 class="w-11 h-11 rounded-full object-cover border-2 border-green-200 shadow"
                 onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random'">
            <span class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow border border-white">
                <span class="material-symbols-outlined text-white text-[10px]" style="font-variation-settings:'FILL' 1">check</span>
            </span>
        </div>
        <div class="flex-1 min-w-0">
            <p class="text-[13px] font-black text-slate-800 dark:text-slate-100 leading-snug">${user.name} accepted your request!</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">${user.role} · ${user.dept} · You are now friends 🎉</p>
            <button onclick="openPublicProfile('${user.id}'); _dismissToast('${id}')"
                class="mt-2 text-[11px] font-bold text-green-600 dark:text-green-400 hover:underline active:scale-95 transition-all">
                View Profile →
            </button>
        </div>
        <button onclick="_dismissToast('${id}')"
            class="flex-shrink-0 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors -mt-1 -mr-1">
            <span class="material-symbols-outlined text-slate-400 text-[16px]">close</span>
        </button>
    `;
    container.appendChild(div);

    // Auto-dismiss after 5 s
    setTimeout(() => _dismissToast(id), 5000);
}

function _dismissToast(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('toast-dismiss');
    el.addEventListener('animationend', () => el.remove(), { once: true });
}

/* ── toggleNotifications ─────────────────────────────── */
function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
    const isHidden = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    if (isHidden) {
        // Trigger animation by removing and re-adding
        panel.style.animation = 'none';
        requestAnimationFrame(() => {
            panel.style.animation = '';
        });
        renderNotifications();
        // Mark requests-tab badge
        _updateNotifTabBadges();
    }
}

/* ── Tab switching ──────────────────────────────────── */
function switchNotifTab(tab) {
    activeNotifTab = tab;
    ['all', 'requests', 'activity'].forEach(t => {
        const btn = document.getElementById(`ntab-${t}`);
        if (!btn) return;
        // The active look lives entirely in .notif-tab-active, which sets both
        // the fill and the label with !important. Inactive tabs therefore need
        // the full text/hover set back, dark variants included - the previous
        // branch restored only text-slate-500 and hover:bg-slate-100, so any tab
        // visited after the first was left unstyled in dark mode.
        if (t === tab) {
            btn.classList.add('notif-tab-active');
            btn.classList.remove('text-slate-500', 'dark:text-slate-400',
                'hover:bg-slate-100', 'dark:hover:bg-slate-800');
        } else {
            btn.classList.remove('notif-tab-active');
            btn.classList.add('text-slate-500', 'dark:text-slate-400',
                'hover:bg-slate-100', 'dark:hover:bg-slate-800');
        }
    });
    renderNotifications();
}

/* ── Badge helpers ──────────────────────────────────── */
function updateNotificationsBadge() {
    const unread = state.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    if (unread > 0) {
        badge.classList.remove('hidden');
        badge.textContent = unread > 9 ? '9+' : unread;
    } else {
        badge.classList.add('hidden');
        badge.textContent = '';
    }
    // Also update the count pill inside the panel header
    const pill = document.getElementById('notif-count-pill');
    if (pill) {
        if (unread > 0) {
            pill.classList.remove('hidden');
            pill.textContent = `${unread} new`;
        } else {
            pill.classList.add('hidden');
        }
    }
    _updateNotifTabBadges();
}

function _updateNotifTabBadges() {
    const reqCount = state.notifications.filter(n => n.type === 'request' && !n.read).length;
    const reqBadge = document.getElementById('ntab-requests-badge');
    if (reqBadge) {
        if (reqCount > 0) {
            reqBadge.classList.remove('hidden');
            reqBadge.textContent = reqCount;
        } else {
            reqBadge.classList.add('hidden');
        }
    }
}

/* ── renderNotifications ─────────────────────────────── */
function renderNotifications() {
    const list = document.getElementById('notifications-list');
    if (!list) return;

    // Filter by active tab
    let notifs = state.notifications;
    if (activeNotifTab === 'requests') {
        notifs = notifs.filter(n => n.type === 'request' || n.subtype === 'accepted');
    } else if (activeNotifTab === 'activity') {
        notifs = notifs.filter(n => n.type !== 'request' && n.subtype !== 'accepted');
    }

    if (notifs.length === 0) {
        list.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-center px-6">
                <span class="material-symbols-outlined text-slate-300 dark:text-slate-500 text-5xl mb-3">notifications_off</span>
                <p class="text-sm font-bold text-slate-400 dark:text-slate-500">No notifications here</p>
                <p class="text-xs text-slate-400 dark:text-slate-400 mt-1">You're all caught up! 🎉</p>
            </div>`;
        return;
    }

    list.innerHTML = notifs.map((n, idx) => {
        const meta = getNotifMeta(n.type);
        const isNew = !n.read;

        // Live notifications carry the actor's avatar already; only fall back to
        // the mock roster for the offline set.
        const pic = n.pic
            || (n.fromId
                ? ((ULink.findUser(n.fromId) || MOCK_USERS.find(u => String(u.id) === String(n.fromId)) || {}).pic)
                : null);

        // The API sends a timestamp; timeAgo() only makes sense for the mocks.
        const ts = n.ts ? timeAgoFrom(n.ts) : timeAgo(idx);

        // Avatar: user pic if available, else icon
        const avatarHtml = pic
            ? `<img src="${pic}" alt="" class="w-10 h-10 rounded-full object-cover border-2 ${isNew ?'border-orange-200' : 'border-slate-100 dark:border-slate-700'} flex-shrink-0 shadow-sm"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
            : '';
        const iconFallback = `
            <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isNew ?'bg-orange-100 dark:bg-orange-900/40' : 'bg-slate-100 dark:bg-slate-800'}" ${pic ? 'style="display:none"' : ''}>
                <span class="material-symbols-outlined text-[18px] ${isNew ?'text-orange-500' : 'text-slate-400'}" style="font-variation-settings:'FILL' 1">${meta.icon}</span>
            </div>`;

        // Action buttons for incoming requests
        let actionHtml = '';
        if (n.type === 'request' && !n.read) {
            actionHtml = `
                <div class="flex gap-2 mt-2.5">
                    <button onclick="acceptRequest(${n.id}, '${n.fromId}', this)"
                        class="flex-1 py-1.5 bg-gradient-to-r from-cta-from to-cta-to hover:brightness-110 text-on-cta text-[12px] font-bold rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">person_check</span> Accept
                    </button>
                    <button onclick="rejectRequest(${n.id}, this)"
                        class="flex-1 py-1.5 bg-slate-100 dark:bg-surface-container-high hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 text-slate-500 dark:text-slate-400 text-[12px] font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">close</span> Decline
                    </button>
                </div>`;
        }

        // "Accepted" system notification gets a special look
        const isAccepted = n.subtype === 'accepted';
        const wrapperClass = isNew
            ? 'notif-item-unread'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60';

        return `
        <div class="relative px-4 py-3.5 border-b border-slate-100/80 dark:border-slate-700/40 transition-colors cursor-pointer ${wrapperClass}"
             onclick="markNotifRead(${n.id})">
            <div class="flex gap-3 items-start">
                <div class="relative flex-shrink-0">
                    ${avatarHtml}${iconFallback}
                    <!-- Type dot -->
                    <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${isAccepted ?'notif-dot-system' : meta.dot}"></span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-[13px] ${isNew ?'font-semibold text-slate-800 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-400'} leading-snug">${n.text}</p>
                    <p class="text-[11px] ${isNew ?'text-orange-500 font-bold' : 'text-slate-400 dark:text-slate-500'} mt-1">${ts}</p>
                    ${actionHtml}
                </div>
                ${isNew ? `<span class="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-300 mt-1.5"></span>` : ''}
            </div>
        </div>`;
    }).join('');
}

/* ── Individual actions ─────────────────────────────── */
/**
 * Mark one notification read.
 *
 * Fires the request in the background rather than awaiting it: the row is
 * repainted immediately because that is what the click is asking for, and a
 * failure here is not worth interrupting the panel over. It used to only flip
 * the local flag, so a refresh brought the unread badge straight back.
 */
function markNotifRead(notifId) {
    const notif = state.notifications.find(n => String(n.id) === String(notifId));
    if (notif) notif.read = true;
    updateNotificationsBadge();
    renderNotifications();

    if (ULink.isLive) {
        ULinkAPI.markNotificationRead(Number(notifId)).catch(() => {});
    }
}

/**
 * Accept a friend request from the notification panel.
 *
 * This used to mutate `state.friends` and stop there: nothing reached the
 * server, so the friendship did not exist, the row came back after a refresh,
 * and the Requests tab kept listing the same person.
 */
async function acceptRequest(notifId, userId, btn) {
    const notif = state.notifications.find(n => String(n.id) === String(notifId));

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>';
    }

    if (ULink.isLive) {
        const result = await ULinkAPI.friendAction('accept', Number(userId));
        if (result.status !== 'success') {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="material-symbols-outlined text-[14px]">person_check</span> Accept';
            }
            if (showError) showError(result.message || 'Could not accept the request.');
            return;
        }

        await ULink.refreshFriends();
        await ULink.refreshNotifications();
    } else {
        if (notif) notif.read = true;
        if (!state.friends.includes(String(userId))) state.friends.push(String(userId));
        state.friendRequests = state.friendRequests.filter(id => String(id) !== String(userId));
        updateUI();
    }

    if (notif) notif.read = true;
    updateNotificationsBadge();
    renderNotifications();
    renderFriendRequestsPanel();
    renderFriendsView();
    showToast('Friend request accepted.');
}

/** Decline a friend request from the notification panel. See acceptRequest(). */
async function rejectRequest(notifId, btn) {
    const notif = state.notifications.find(n => String(n.id) === String(notifId));

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>';
    }

    if (ULink.isLive) {
        const result = await ULinkAPI.friendAction('reject', Number(notif?.fromId));
        if (result.status !== 'success') {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<span class="material-symbols-outlined text-[14px]">close</span> Decline';
            }
            if (showError) showError(result.message || 'Could not decline the request.');
            return;
        }

        await ULink.refreshFriends();
        await ULink.refreshNotifications();
    } else if (notif) {
        notif.read = true;
        state.friendRequests = state.friendRequests.filter(id => String(id) !== String(notif.fromId));
    }

    if (notif) notif.read = true;
    updateNotificationsBadge();
    renderNotifications();
    renderFriendRequestsPanel();
    renderFriendsView();
    showToast('Friend request declined.');
}

/**
 * Mark every notification read, on the server as well as locally.
 *
 * The badge used to clear and then reappear on the next reload, because the
 * is_read column was never touched.
 */
async function markAllRead(btn) {
    state.notifications.forEach(n => n.read = true);
    updateNotificationsBadge();
    renderNotifications();

    if (ULink.isLive) {
        if (btn) btn.disabled = true;
        const result = await ULinkAPI.markAllNotificationsRead();
        if (btn) btn.disabled = false;
        if (result.status !== 'success') {
            if (showError) showError(result.message || 'Could not mark them read.');
            return;
        }
        await ULink.refreshNotifications();
    }

    if (ULink.data.counts) ULink.data.counts.notifications = 0;
    updateNotificationsBadge();
    updateUI();
    showToast('Notifications marked as read.');
}


// --- Profile Editing ---
//
// The old editor swapped an inline form with the profile header. It is now a
// single dialog that covers every editable field. Pictures are read locally
// into data URIs and only uploaded when Save is pressed, so cancelling leaves
// the account untouched.
let profileEditState = { profile_pic: null, cover_pic: null };

function openProfileEditor() {
    if (!state.user) return;

    profileEditState = { profile_pic: null, cover_pic: null };

    const name = document.getElementById('profile-edit-name');
    const dept = document.getElementById('profile-edit-dept');
    const batch = document.getElementById('profile-edit-batch');
    const sid = document.getElementById('profile-edit-id');
    const bio = document.getElementById('profile-edit-bio');
    const headline = document.getElementById('profile-edit-headline');
    const location = document.getElementById('profile-edit-location');
    const website = document.getElementById('profile-edit-website');
    const interests = document.getElementById('profile-edit-interests');
    const avatar = document.getElementById('profile-edit-avatar-preview');
    const cover = document.getElementById('profile-edit-cover-preview');

    if (name) name.value = state.user.name || '';
    if (dept) dept.value = state.user.dept || '';
    if (batch) batch.value = state.user.batch || '';
    if (sid) sid.value = state.user.studentId || state.user.id || '';
    if (bio) bio.value = state.user.bio || '';
    if (headline) headline.value = state.user.headline || '';
    if (location) location.value = state.user.location || '';
    if (website) website.value = state.user.website || '';
    if (interests) interests.value = state.user.interests || '';
    if (avatar) avatar.src = state.user.pic || '';
    if (cover) {
        cover.style.backgroundImage = state.user.cover_pic ? `url(${state.user.cover_pic})` : '';
    }

    const overlay = document.getElementById('profile-edit-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
    }
    document.body.classList.add('overflow-hidden');
    if (name) setTimeout(() => name.focus(), 50);
}

function closeProfileEditor() {
    const overlay = document.getElementById('profile-edit-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }
    document.body.classList.remove('overflow-hidden');
}

function onProfileEditPic(event, kind) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        if (showError) showError('Images must be smaller than 5 MB.');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        if (kind === 'cover') {
            profileEditState.cover_pic = e.target.result;
            const cover = document.getElementById('profile-edit-cover-preview');
            if (cover) cover.style.backgroundImage = `url(${e.target.result})`;
        } else {
            profileEditState.profile_pic = e.target.result;
            const avatar = document.getElementById('profile-edit-avatar-preview');
            if (avatar) avatar.src = e.target.result;
        }
    };
    reader.onerror = () => { if (showError) showError('Could not read that file.'); };
    reader.readAsDataURL(file);
}

async function saveProfileEditor(btn) {
    if (!state.user) return;

    const name = document.getElementById('profile-edit-name');
    const dept = document.getElementById('profile-edit-dept');
    const batch = document.getElementById('profile-edit-batch');
    const bio = document.getElementById('profile-edit-bio');
    const headline = document.getElementById('profile-edit-headline');
    const location = document.getElementById('profile-edit-location');
    const website = document.getElementById('profile-edit-website');
    const interests = document.getElementById('profile-edit-interests');

    const payload = {
        name: name ? name.value.trim() : '',
        department: dept ? dept.value.trim() : '',
        batch: batch ? batch.value.trim() : '',
        bio: bio ? bio.value.trim() : '',
        headline: headline ? headline.value.trim() : '',
        location: location ? location.value.trim() : '',
        website: website ? website.value.trim() : '',
        interests: interests ? interests.value.trim() : ''
    };

    if (!payload.name) {
        if (showError) showError('Name cannot be empty.');
        if (name) name.focus();
        return;
    }

    if (profileEditState.profile_pic) payload.profile_pic = profileEditState.profile_pic;
    if (profileEditState.cover_pic) payload.cover_pic = profileEditState.cover_pic;

    const original = btn ? btn.textContent : null;
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

    try {
        const result = await ULinkAPI.updateProfile(payload);

        if (result.status !== 'success') {
            if (showError) showError(result.message || 'Could not save your profile.');
            return;
        }

        // Take the server's normalised values rather than the raw form input.
        ULink.applyUser({ ...(ULink.data.user || {}), ...(result.user || {}) });
        if (result.profile_pic) state.user.pic = result.profile_pic;
        if (result.cover_pic) state.user.cover_pic = result.cover_pic;

        ActivityLogger.logProfileUpdated({ fields: Object.keys(payload) });
        updateUI();
        if (activeTab === 'home') await renderFeed();
        if (activeTab === 'profile') renderUserPosts();

        closeProfileEditor();
        showToast('Profile updated.');
    } finally {
        if (btn) { btn.disabled = false; if (original !== null) btn.textContent = original; }
    }
}

function updateProfilePic(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Guard client-side so an oversized file fails fast instead of uploading
    // several megabytes before the server rejects it.
    if (file.size > 5 * 1024 * 1024) {
        if (showError) showError('Images must be smaller than 5 MB.');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        const result = await ULinkAPI.updateProfile({ profile_pic: e.target.result });

        if (result.status !== 'success') {
            if (showError) showError(result.message || 'Could not update your photo.');
            return;
        }

        // The endpoint keeps profile_pic at the top level for this call site.
        if (result.profile_pic) {
            state.user.pic = result.profile_pic;
        } else if (result.user && result.user.profile_pic) {
            state.user.pic = result.user.profile_pic;
        }

        updateUI();
        if (activeTab === 'home') await renderFeed();
        if (activeTab === 'profile') renderUserPosts();
        showToast('Profile photo updated.');
    };
    reader.onerror = () => { if (showError) showError('Could not read that file.'); };
    reader.readAsDataURL(file);
}

// The cover photo follows the avatar exactly: a base64 JSON POST to
// users/update.php, which stores it under uploads/covers/ and writes the guard
// pair that ulink_delete_upload() now clears on replacement. It is a separate
// handler because the size ceiling and the response key differ.
function updateProfileCover(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        if (showError) showError('Cover photos must be smaller than 5 MB.');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        const result = await ULinkAPI.updateProfile({ cover_pic: e.target.result });

        if (result.status !== 'success') {
            if (showError) showError(result.message || 'Could not update your cover.');
            return;
        }

        const cover = result.cover_pic || (result.user && result.user.cover_pic);
        if (cover) {
            state.user.cover_pic = cover;
            const coverEl = document.getElementById('profile-cover');
            if (coverEl) coverEl.style.backgroundImage = `url(${cover})`;
        }

        showToast('Cover photo updated.');
    };
    reader.onerror = () => { if (showError) showError('Could not read that file.'); };
    reader.readAsDataURL(file);
}

// --- Form Event Listeners ---
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idInput = document.getElementById('login-id').value.trim();
    const passInput = document.getElementById('login-pass').value.trim();

    if (!idInput || !passInput) {
        if (showError) showError('Enter your e-mail or student ID and your password.');
        return;
    }

    const result = await ULinkAPI.login(idInput, passInput);

    if (result.status !== 'success') {
        if (showError) showError(result.message || 'Login failed. Please try again.');
        return;
    }

    // Pull the rest of the state down before switching views, otherwise the
    // shell renders with the hard-coded mock friends and notifications.
    await ULink.hydrate();

    // Hand the shell the server's user object. login() in backend_integration.js
    // prefers ULink.data.user and logs the activity for us.
    login(ULink.data.user || result.user);

    // The feed and sidebar both read from the freshly hydrated state.
    await renderFeed();
    await handlePostDeepLink();
    renderRightSidebar();
    updateNotificationsBadge();

    ActivityLogger.logLogin(ULink.data.user ? ULink.data.user.email || idInput : idInput);
    showToast(`Welcome back, ${(ULink.data.user || {}).name || ''}!`);
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const id = document.getElementById('reg-id').value;
    const dept = document.getElementById('reg-dept').value;
    const batch = document.getElementById('reg-batch').value;
    const picInput = document.getElementById('reg-pic');

    const completeRegistration = async (picData) => {
        const result = await ULinkAPI.register({
            name: name.trim(),
            email: email.trim(),
            password: pass,
            student_id: id.trim(),
            department: dept,
            batch: batch.trim(),
            profile_pic: picData
        });

        if (result.status !== 'success') {
            if (showError) showError(result.message || 'Registration failed.');
            return;
        }

        if (showSuccess) showSuccess('Registration successful! Please sign in.');
        document.getElementById('register-form').reset();
        // Flip back to the login tab so they can sign in straight away.
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('register-section').classList.add('hidden');
    };

    if (picInput && picInput.files && picInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            completeRegistration(e.target.result);
        }
        reader.readAsDataURL(picInput.files[0]);
    } else {
        completeRegistration(null);
    }
});

async function logout() {
    if (!await showConfirm('Log out of U-Link on this device?', {
        title: 'Log out',
        confirmText: 'Log out',
        icon: 'logout'
    })) return;

    // Record the logout *before* dropping the session: activities/log.php
    // requires a session, so firing it after logout.php always answered 401 and
    // the audit trail silently had no logouts in it at all.
    try {
        await ActivityLogger.logLogout();
    } catch (e) {
        console.error("Could not record the logout activity", e);
    }

    // Drop the session server-side. A failure here still clears the local state
    // below, so the user is never stuck in a half-signed-in shell.
    try {
        await ULinkAPI.logout();
    } catch (e) {
        console.error("Logout API failed", e);
    }

    ULink.reset();

    state.user = null;
    // The feed scope and hide list belong to the account that just left; reset
    // them so the next person on this browser starts from a clean feed.
    state.feedScope = 'feed';
    state.hiddenPosts = new Set();

    const mainApp = document.getElementById('main-app');
    if (mainApp) {
        mainApp.classList.add('opacity-0');
        setTimeout(() => {
            mainApp.classList.add('hidden');
            const authView = document.getElementById('auth-view');
            if (authView) {
                authView.classList.remove('hidden');
                setTimeout(() => authView.classList.remove('opacity-0'), 50);
            }
            document.getElementById('login-form').reset();
            document.getElementById('register-form').reset();
            switchTab('home');
        }, 500);
    }
}

// ── Right Sidebar ─────────────────────────────────────────────────────────

/**
 * Randomly assigns online/offline status to MOCK_USERS and renders
 * both the Contacts list and the People You May Know panel.
 */
function renderRightSidebar() {
    renderContacts();
    renderPeopleYouMayKnow();
    renderRightSidebarEvents();
}

function renderRightSidebarEvents() {
    const container = document.getElementById('right-sidebar-events-list');
    if (!container) return;

    let events;
    if (ULink.isLive) {
        // The three soonest upcoming events.
        events = (ULink.data.events || []).filter(e => e.date).slice(0, 3);
    } else {
        const sidebarEventIds = ['e10', 'e11', 'e12'];
        events = MOCK_EVENTS.filter(e => sidebarEventIds.includes(e.id));
    }

    if (events.length === 0) {
        container.innerHTML = `<p class="text-[11px] text-slate-500 px-1 py-2">No upcoming events.</p>`;
        return;
    }

    container.innerHTML = events.map((event, index) => {
        // Cycle the accent colours so the three cards stay visually distinct.
        const dateColorClass = ['text-primary', 'text-orange-500', 'text-blue-500'][index % 3];

        return `
        <div class="right-event-card group" onclick="switchTab('events'); setTimeout(() => openEventModal('${event.id}'), 100);">
            <div class="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-slate-200 dark:border-slate-700">
                <img src="${event.img}" class="w-full h-full object-cover group-hover:scale-110 transition-transform">
            </div>
            <div class="right-event-date min-w-[30px] flex-shrink-0 flex flex-col items-center justify-center">
                <span class="text-[9px] font-bold uppercase ${dateColorClass}">${event.month}</span>
                <span class="text-xl font-black ${dateColorClass} leading-none mt-[-2px]">${event.date}</span>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors truncate">${event.title}</p>
                <p class="text-[10px] text-slate-500 truncate mt-0.5" title="${event.location}">${event.location}</p>
            </div>
        </div>
        `;
    }).join('');
}

function renderContacts() {
    const container = document.getElementById('contacts-list');
    if (!container) return;

    let users;
    if (ULink.isLive) {
        // Real friends, with the presence flag the API reports.
        users = [...(ULink.data.friends || [])];
    } else {
        // Persist online status so it doesn't bounce around every re-render
        if (!MOCK_USERS[0].hasOwnProperty('online')) {
            MOCK_USERS.forEach(u => u.online = Math.random() > 0.35);
        }
        users = [...MOCK_USERS].sort((a, b) => b.online - a.online);
    }

    users = users.sort((a, b) => Number(!!b.online) - Number(!!a.online));

    // Only show 5/6 contacts when minimized
    const maxContacts = state.contactsExpanded ? users.length : 6;
    const displayedUsers = users.slice(0, maxContacts);

    let html = displayedUsers.map(u => `
        <div class="contact-row" onclick="openChat('${u.id}')">
            <div class="relative flex-shrink-0">
                <img src="${u.pic}" class="w-9 h-9 rounded-full object-cover border border-slate-200">
                ${u.online ? '<span class="contact-online-dot"></span>' : ''}
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">${u.name}</p>
                <p class="text-[10px] ${u.online ?'text-green-700 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}">${u.online ? 'Active now' : 'Offline'}</p>
            </div>
            ${u.online ? '<span class="material-symbols-outlined text-slate-400 text-base hover:text-primary transition-colors">chat</span>' : ''}
        </div>
    `).join('');

    if (users.length > 6) {
        html += `
        <button onclick="toggleContactsExpanded()" class="w-full mt-2 py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1">
            ${state.contactsExpanded ? 'See Less <span class="material-symbols-outlined text-[1rem]">expand_less</span>' : 'See More <span class="material-symbols-outlined text-[1rem]">expand_more</span>'}
        </button>
        `;
    }

    container.innerHTML = html;
}

function toggleContactsExpanded() {
    state.contactsExpanded = !state.contactsExpanded;
    renderContacts();
}

async function loadEvents(scope = state.eventScope || 'upcoming') {
    if (!ULink.isLive) {
        state.events = [...MOCK_EVENTS];
        return;
    }
    try {
        // "Going" has no server scope of its own, so it reads the full list and
        // filters on the `interested` flag the API already sends back.
        const res = await ULinkAPI.events(scope === 'going' ? 'all' : scope);
        if (res.status === 'success') {
            state.events = (res.events || res.data || []).map(normaliseEvent);
            state.eventsLoaded = true;
        } else if (res.message) {
            showToast(res.message, 'error');
        }
    } catch (e) {
        console.error('Could not load events', e);
    }
}

async function openEventsView() {
    await loadEvents(state.eventScope || 'upcoming');
    renderEventsGrid();
}

async function setEventScope(scope) {
    if (!['upcoming', 'going', 'past', 'all'].includes(scope)) scope = 'upcoming';
    state.eventScope = scope;
    applyEventScope();
    await loadEvents(scope);
    renderEventsGrid();
}

function applyEventScope() {
    const scope = state.eventScope || 'upcoming';
    document.querySelectorAll('[data-event-scope]').forEach(b => {
        const active = b.dataset.eventScope === scope;
        b.classList.toggle('bg-primary', active);
        b.classList.toggle('text-on-primary', active);
        b.classList.toggle('text-on-surface-variant', !active);
        b.classList.toggle('hover:text-on-surface', !active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
}

function renderEventsGrid() {
    const container = document.getElementById('events-grid-container');
    if (!container) return;

    applyEventScope();

    // Prefer the scope-specific list once loadEvents() has run; fall back to the
    // bootstrap payload only before the first fetch, so an intentionally empty
    // scope (e.g. Past) shows its empty state instead of the upcoming list.
    let list = state.eventsLoaded
        ? [...(state.events || [])]
        : [...(ULink.data.events || MOCK_EVENTS)];

    const scope = state.eventScope || 'upcoming';
    if (scope === 'going') {
        list = list.filter(e => e.interested === true);
    }

    if (list.length === 0) {
        const message = {
            upcoming: 'No upcoming events right now.',
            going: 'You have not marked any event as going yet.',
            past: 'No past events to look back on.',
            all: 'No events have been created yet.'
        }[scope] || 'No events scheduled right now.';
        container.innerHTML = `<p class="text-on-surface-variant text-center py-12 col-span-full">${message}</p>`;
        return;
    }

    container.innerHTML = list.map(exploreEventCard).join('');
}

let activeEventId = null;

function findEvent(eventId) {
    const key = String(eventId);
    const pools = [state.events || [], ULink.data.events || []];
    for (const pool of pools) {
        const hit = pool.find(e => String(e.id) === key);
        if (hit) return hit;
    }
    return MOCK_EVENTS.find(e => String(e.id) === key) || null;
}

function openEventModal(eventId) {
    const event = findEvent(eventId);
    if (!event) return;

    activeEventId = eventId;

    // A community or event row may have no artwork; fall back to a generated
    // gradient tile rather than a broken image icon.
    const modalImg = document.getElementById('event-modal-img');
    modalImg.src = event.img || FALLBACK_EVENT;
    modalImg.onerror = function () {
        this.onerror = null;
        this.src = FALLBACK_EVENT;
    };
    document.getElementById('event-modal-day').innerText = event.date;
    document.getElementById('event-modal-month').innerText = event.month;
    document.getElementById('event-modal-title').innerText = event.title;
    document.getElementById('event-modal-location').innerText = event.time
        ? `${event.location || ''} • ${event.time}`
        : (event.location || '');
    document.getElementById('event-modal-description').innerText = event.desc || event.description || '';

    const btnInt = document.getElementById('btn-interested');
    const btnNotInt = document.getElementById('btn-not-interested');

    // Default / interested styling updates based on state
    if (event.interested === true) {
        btnInt.className = "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-primary text-on-primary shadow-md transform scale-105 border border-primary";
        btnNotInt.className = "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-surface-container-high hover:bg-red-100 text-slate-400 hover:text-red-600 border border-transparent";
    } else if (event.interested === false) {
        btnInt.className = "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-on-primary border border-transparent";
        btnNotInt.className = "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-red-600 text-white hover:brightness-110 shadow-md transform scale-105 border border-red-500";
    } else {
        btnInt.className = "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-on-primary border border-transparent";
        btnNotInt.className = "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-surface-container-high hover:bg-red-100 text-slate-600 dark:text-slate-300 hover:text-red-600 border border-transparent";
    }

    const modal = document.getElementById('event-modal');
    const content = document.getElementById('event-modal-content');

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    }, 10);

    document.body.style.overflow = 'hidden';
}

function closeEventModal() {
    const modal = document.getElementById('event-modal');
    const content = document.getElementById('event-modal-content');

    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        activeEventId = null;
    }, 300);
}

async function toggleEventInterest(isInterested) {
    if (!activeEventId) return;
    const event = findEvent(activeEventId);
    if (!event) return;

    // Clicking the current choice again clears the RSVP entirely.
    const next = event.interested === isInterested ? null : isInterested;

    if (!ULink.isLive) {
        event.interested = next;
        renderEventsGrid();
        openEventModal(activeEventId);
        return;
    }

    const result = await ULinkAPI.rsvp(
        Number(activeEventId),
        next === null ? null : next,
        next === null ? 'clear' : undefined
    );

    if (result.status !== 'success') {
        if (showError) showError(result.message || 'Could not save your RSVP.');
        return;
    }

    // Reflect the confirmed server state. All three fields have to move
    // together: `interested` drives the buttons, `my_status` the API contract
    // and `interested_count` the attendee total, and leaving any of them stale
    // makes the grid disagree with the server on the next render.
    event.interested = result.rsvp_status === 'interested'
        ? true
        : (result.rsvp_status === 'not_interested' ? false : null);
    event.my_status = result.rsvp_status ?? null;

    // The server counts attendees, not RSVPs, and sends the total back. This
    // used to be inferred from whether a row was added or deleted, which
    // drifted the moment someone switched between Going and Not going.
    if (typeof result.interested_count === 'number') {
        event.interested_count = result.interested_count;
    }

    renderEventsGrid();
    renderRightSidebarEvents();

    // Keep the modal open so the updated Going / Not going state is visible,
    // then repaint its buttons.
    openEventModal(activeEventId);

    if (showToast) showToast(result.message || 'RSVP saved.');
}

function renderPeopleYouMayKnow() {
    const container = document.getElementById('people-you-may-know');
    if (!container) return;

    // Live suggestions come from the server (friends of friends, mutual
    // communities); fall back to the mock list when the backend is offline.
    let suggestions;
    if (ULink.isLive) {
        suggestions = (ULink.data.suggestions || []).slice(0, 3);
    } else {
        suggestions = MOCK_USERS.filter(u => !state.friends.includes(String(u.id))).slice(0, 3);
    }

    if (suggestions.length === 0) {
        container.innerHTML = `<p class="text-[11px] text-slate-500 px-1">No suggestions right now.</p>`;
        return;
    }

    container.innerHTML = suggestions.map(u => `
        <div class="pymk-card">
            <img src="${escapeHtml(u.pic || '')}" onerror="this.src='Asserts/default-avatar.jpg'" class="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onclick="openPublicProfile('${u.id}')">
            <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:underline"
                    onclick="openPublicProfile('${u.id}')">${escapeHtml(u.name || 'Unknown')}</p>
                <p class="text-[10px] text-slate-500 truncate">${escapeHtml(userSubtitle(u))}</p>
                <button
                    onclick="handlePymkAdd('${u.id}', this)"
                    class="mt-1.5 px-3 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold rounded-full transition-colors flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">person_add</span> Add Friend
                </button>
            </div>
        </div>
    `).join('');
}

async function handlePymkAdd(userId, btn) {
    const original = btn.innerHTML;

    if (ULink.isLive) {
        // Persist the request. No userId is trusted by the server: it acts on
        // the session holder and `userId` is simply the target of the request.
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">progress_activity</span>';

        const result = await ULinkAPI.friendAction('request', Number(userId));

        btn.disabled = false;

        if (result.status !== 'success') {
            btn.innerHTML = original;
            if (showError) showError(result.message || 'Could not send the request.');
            return;
        }

        if (result.request_pending) {
            btn.innerHTML = '<span class="material-symbols-outlined text-sm">schedule</span> Requested';
            btn.disabled = true;
            btn.classList.add('opacity-60', 'cursor-not-allowed');
        } else {
            btn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Friends';
            btn.disabled = true;
            btn.classList.add('opacity-60', 'cursor-not-allowed');
        }

        ActivityLogger.logFriendRequestSent(Number(userId));

        await ULink.refreshFriends();

        // Drop the card from the suggestions once it has been actioned.
        ULink.data.suggestions = (ULink.data.suggestions || [])
            .filter(u => String(u.id) !== String(userId));

        renderPeopleYouMayKnow();
        if (activeTab === 'friends') renderFriendsView();
        return;
    }

    // Offline: keep the old optimistic behaviour.
    btn.innerHTML = '<span class="material-symbols-outlined text-sm">schedule</span> Requested';
    btn.disabled = true;
    btn.classList.add('opacity-60', 'cursor-not-allowed');
    _scheduleMockAccept(userId);
    setTimeout(() => {
        renderPeopleYouMayKnow();
        if (activeTab === 'friends') renderFriendsView();
    }, 1500);
}

// ── Friends View ──────────────────────────────────────────────────────────

function switchFriendsTab(tab) {
    activeFriendsTab = tab;

    const activeClass = "px-4 py-2 bg-primary text-white rounded-full text-sm font-bold shadow-sm transition-all active:scale-95";
    const inactiveClass = "px-4 py-2 bg-surface-container-high text-on-surface rounded-full text-sm font-bold hover:bg-surface-container-highest transition-all active:scale-95";
    const inactiveClassFlex = "px-4 py-2 bg-surface-container-high text-on-surface rounded-full text-sm font-bold hover:bg-surface-container-highest transition-all active:scale-95 flex items-center gap-2";

    document.getElementById('friends-tab-all').className = tab === 'all' ? activeClass : inactiveClass;
    document.getElementById('friends-tab-requests').className = tab === 'requests' ? activeClass + ' flex items-center gap-2' : inactiveClassFlex;
    document.getElementById('friends-tab-pymk').className = tab === 'pymk' ? activeClass : inactiveClass;

    document.getElementById('friends-panel-all').classList.toggle('hidden', tab !== 'all');
    document.getElementById('friends-panel-requests').classList.toggle('hidden', tab !== 'requests');
    document.getElementById('friends-panel-pymk').classList.toggle('hidden', tab !== 'pymk');

    renderFriendsView();
}

function renderFriendsView() {
    // Always sync the requests badge
    const reqCount = ULink.isLive
        ? (ULink.data.requests || []).length
        : state.friendRequests.length;
    const badge = document.getElementById('requests-badge');
    if (badge) badge.textContent = reqCount;

    if (activeFriendsTab === 'all') {
        // Live friends come from the database with their real names and
        // avatars; the mock list is only an offline fallback.
        const friendsList = ULink.isLive
            ? (ULink.data.friends || [])
            : MOCK_USERS.filter(u => state.friends.includes(String(u.id)));
        const grid = document.getElementById('friends-grid');
        const emptyState = document.getElementById('friends-empty');
        if (!grid || !emptyState) return;

        if (friendsList.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            grid.innerHTML = friendsList.map(u => `
                <div class="friend-card border border-surface-container-highest flex flex-col group">
                    <div class="h-16 bg-gradient-to-r from-orange-400 to-rose-400 relative">
                        <img src="${u.pic}" class="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-slate-900 absolute -bottom-8 left-1/2 -translate-x-1/2 cursor-pointer group-hover:scale-105 transition-transform" onclick="openPublicProfile('${u.id}')">
                    </div>
                    <div class="pt-10 pb-4 px-4 flex-1 flex flex-col items-center text-center">
                        <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100 cursor-pointer hover:underline truncate w-full" onclick="openPublicProfile('${u.id}')">${u.name}</h3>
                        <p class="text-[11px] text-slate-500 mb-4">${escapeHtml(userSubtitle(u))}</p>
                        <div class="mt-auto w-full flex gap-2">
                            <button onclick="openChat('${u.id}')" class="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-1.5 rounded-lg text-xs font-bold transition-colors">Message</button>
                            <button onclick="removeFriend('${u.id}', this)" class="bg-surface-container-high hover:bg-red-100 hover:text-red-600 text-slate-500 w-8 flex items-center justify-center rounded-lg transition-colors" title="Remove Friend"><span class="material-symbols-outlined text-[1rem]">person_remove</span></button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } else if (activeFriendsTab === 'requests') {
        renderFriendRequestsPanel();
    } else {
        const myId = state.user ? String(state.user.id) : '';
        const recommendations = ULink.isLive
            ? (ULink.data.suggestions || [])
            : MOCK_USERS.filter(u => !state.friends.includes(String(u.id))
                && String(u.id) !== myId
                && !state.friendRequests.includes(String(u.id)));
        const grid = document.getElementById('pymk-grid');
        if (!grid) return;

        grid.innerHTML = recommendations.map(u => `
            <div class="friend-card border border-surface-container-highest flex flex-col group">
                <div class="h-16 bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 relative">
                    <img src="${u.pic}" class="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-slate-900 absolute -bottom-8 left-1/2 -translate-x-1/2 cursor-pointer group-hover:scale-105 transition-transform" onclick="openPublicProfile('${u.id}')">
                </div>
                <div class="pt-10 pb-4 px-4 flex-1 flex flex-col items-center text-center">
                    <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100 cursor-pointer hover:underline truncate w-full" onclick="openPublicProfile('${u.id}')">${u.name}</h3>
                    <p class="text-[11px] text-slate-500 mb-4">${escapeHtml(userSubtitle(u))}</p>
                    <div class="mt-auto w-full">
                        <button onclick="handlePymkAdd('${u.id}', this)" class="w-full bg-primary hover:bg-primary/90 text-on-primary py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"><span class="material-symbols-outlined text-[1rem]">person_add</span> Add Friend</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function renderFriendRequestsPanel() {
    const grid = document.getElementById('requests-grid');
    const empty = document.getElementById('requests-empty');
    const subtitle = document.getElementById('requests-subtitle');
    const acceptAllBtn = document.getElementById('accept-all-btn');
    if (!grid || !empty || !subtitle || !acceptAllBtn) return;

    // Pending requests are real rows from the database when signed in.
    const requesters = ULink.isLive
        ? (ULink.data.requests || [])
        : MOCK_USERS.filter(u => state.friendRequests.includes(String(u.id)));
    const count = requesters.length;

    subtitle.textContent = count > 0 ? `${count} pending request${count > 1 ? 's' : ''}` : 'No pending requests';

    if (count === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
        acceptAllBtn.classList.add('hidden');
        return;
    }

    empty.classList.add('hidden');
    acceptAllBtn.classList.remove('hidden');

    // Mutual friend counts are a real number when known; otherwise fall back to
    // the deterministic mock so the offline layout still looks the same.
    const getMutuals = (id) => {
        const live = (ULink.data.suggestions || []).find(u => String(u.id) === String(id));
        if (live && typeof live.mutuals === 'number') return live.mutuals;
        return ((parseInt(id, 10) || 1) * 3) % 9 + 1;
    };

    grid.innerHTML = requesters.map(u => `
        <div id="req-card-${u.id}" class="bg-white dark:bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700/60 hover:shadow-md transition-all group flex flex-col">
            <!-- Cover banner -->
            <div class="h-20 bg-gradient-to-r from-orange-400 via-rose-400 to-pink-400 relative">
                <div class="absolute inset-0 opacity-30" style="background-image: radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px); background-size: 14px 14px;"></div>
                <img src="${u.pic}" alt="${u.name}"
                    class="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-800 absolute -bottom-10 left-1/2 -translate-x-1/2 shadow-lg group-hover:scale-105 transition-transform cursor-pointer"
                    onclick="openPublicProfile('${u.id}')">
            </div>
            <!-- Info -->
            <div class="pt-12 pb-5 px-5 flex-1 flex flex-col items-center text-center">
                <h3 class="font-extrabold text-[15px] text-slate-800 dark:text-slate-100 cursor-pointer hover:text-primary transition-colors" onclick="openPublicProfile('${u.id}')">${u.name}</h3>
                <p class="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                    ${escapeHtml(userSubtitle(u))}
                </p>
                <!-- Mutual friends -->
                <div class="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span class="material-symbols-outlined text-[14px] text-orange-400">group</span>
                    <span>${getMutuals(u.id)} mutual friends</span>
                </div>
                <!-- Action buttons -->
                <div class="mt-4 w-full flex flex-col gap-2">
                    <button onclick="acceptFriendRequest('${u.id}')" id="accept-btn-${u.id}"
                        class="w-full bg-gradient-to-r from-cta-from to-cta-to hover:brightness-110 text-on-cta py-2.5 rounded-xl font-bold text-sm shadow-md shadow-orange-200 dark:shadow-orange-900/30 hover:shadow-orange-300/50 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[17px]">person_check</span> Accept
                    </button>
                    <button onclick="rejectFriendRequest('${u.id}')" id="reject-btn-${u.id}"
                        class="w-full bg-slate-100 dark:bg-surface-container-high hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 hover:border-rose-200">
                        <span class="material-symbols-outlined text-[17px]">person_remove</span> Decline
                    </button>
                    <button onclick="openPublicProfile('${u.id}')"
                        class="w-full py-2 rounded-xl font-semibold text-[12px] text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">open_in_new</span> View Profile
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/** Fade a request card out and refresh the panel. */
function _dismissRequestCard(userId, delay = 350) {
    const card = document.getElementById(`req-card-${userId}`);
    if (card) {
        card.style.transition = 'all 0.35s ease';
        card.style.transform = 'scale(0.85)';
        card.style.opacity = '0';
        setTimeout(() => card.remove(), delay);
    }
}

async function acceptFriendRequest(userId) {
    const acceptBtn = document.getElementById(`accept-btn-${userId}`);

    if (acceptBtn) {
        acceptBtn.disabled = true;
        acceptBtn.innerHTML = `<span class="material-symbols-outlined text-[17px] animate-spin">progress_activity</span> Accepting...`;
    }

    if (ULink.isLive) {
        const result = await ULinkAPI.friendAction('accept', Number(userId));
        if (result.status !== 'success') {
            if (acceptBtn) {
                acceptBtn.disabled = false;
                acceptBtn.innerHTML = `<span class="material-symbols-outlined text-[17px]">person_check</span> Accept`;
            }
            if (showError) showError(result.message || 'Could not accept the request.');
            return;
        }

        // Re-read rather than patching the arrays by hand: accept moves the
        // person between `requests` and `friends` and bumps both counters, and
        // guessing that here is what left the Requests tab showing somebody who
        // had already been accepted.
        await ULink.refreshFriends();

        _dismissRequestCard(userId);
        await ULink.refreshNotifications();

        renderFriendRequestsPanel();
        renderFriendsView();
        updateNotificationsBadge();
        updateUI();
        showToast('Friend request accepted. You are now connected.');
        return;
    }

    // Offline: move the request locally after a short beat.
    setTimeout(() => {
        state.friendRequests = state.friendRequests.filter(id => String(id) !== String(userId));
        state.friends.push(String(userId));

        _dismissRequestCard(userId);
        setTimeout(() => {
            renderFriendRequestsPanel();
            showToast('Friend request accepted. You are now connected.');
        }, 400);
    }, 600);
}

async function rejectFriendRequest(userId) {
    const rejectBtn = document.getElementById(`reject-btn-${userId}`);

    if (rejectBtn) {
        rejectBtn.disabled = true;
        rejectBtn.innerHTML = `<span class="material-symbols-outlined text-[17px]">close</span> Declining...`;
    }

    if (ULink.isLive) {
        const result = await ULinkAPI.friendAction('decline', Number(userId));
        if (result.status !== 'success' && result.status !== 'error') {
            if (showError) showError(result.message || 'Could not decline the request.');
            return;
        }

        await ULink.refreshFriends();

        _dismissRequestCard(userId);
        await ULink.refreshNotifications();

        renderFriendRequestsPanel();
        renderFriendsView();
        updateNotificationsBadge();
        showToast('Request declined.');
        return;
    }

    setTimeout(() => {
        state.friendRequests = state.friendRequests.filter(id => String(id) !== String(userId));
        _dismissRequestCard(userId);
        setTimeout(() => {
            renderFriendRequestsPanel();
            showToast('Request declined.');
        }, 350);
    }, 500);
}

async function acceptAllRequests() {
    const ids = ULink.isLive
        ? (ULink.data.requests || []).map(u => u.id)
        : [...state.friendRequests];

    if (ids.length === 0) return;

    const btn = document.getElementById('accept-all-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span> Accepting...`;
    }

    if (ULink.isLive) {
        // Accept sequentially: the endpoint is a state transition per pair, and
        // firing them all at once would interleave notifications unpredictably.
        let accepted = 0;
        for (const id of ids) {
            const result = await ULinkAPI.friendAction('accept', Number(id));
            if (result.status === 'success') {
                accepted++;
            }
            _dismissRequestCard(id, 0);
        }

        await ULink.refreshFriends();

        await ULink.refreshNotifications();

        renderFriendRequestsPanel();
        renderFriendsView();
        updateNotificationsBadge();
        updateUI();
        showToast(`Accepted ${accepted} friend request${accepted === 1 ? '' : 's'}.`);
        return;
    }

    ids.forEach(id => state.friends.push(String(id)));
    state.friendRequests = [];
    ids.forEach(id => _dismissRequestCard(id, 400));

    setTimeout(() => {
        renderFriendRequestsPanel();
        showToast(`Accepted ${ids.length} friend request${ids.length > 1 ? 's' : ''}.`);
    }, 400);
}

async function removeFriend(userId, btn) {
    if (!await showConfirm('You will both lose each other from your friends list.', {
        title: 'Remove friend',
        confirmText: 'Remove',
        icon: 'person_remove',
        danger: true
    })) return;

    if (ULink.isLive) {
        const result = await ULinkAPI.friendAction('remove', Number(userId));
        if (result.status !== 'success') {
            if (showError) showError(result.message || 'Could not remove this friend.');
            return;
        }

        await ULink.refreshFriends();

        renderFriendsView();
        renderUserPosts();
        showToast('Friend removed.');
        return;
    }

    state.friends = state.friends.filter(id => String(id) !== String(userId));
    renderFriendsView();
    showToast('Friend removed.');
}

// --- Communities View & Profile ---
function renderCommunitiesList() {
    const container = document.getElementById('communities-list-container');
    if (!container) return;

    // Prefer the discovery payload when Explore has already loaded it, so the
    // Communities tab and the Explore rail can never disagree.
    const communities = (state.exploreData && state.exploreData.communities && state.exploreData.communities.length)
        ? state.exploreData.communities
        : (ULink.isLive ? (ULink.data.communities || []) : MOCK_COMMUNITIES);

    if (communities.length === 0) {
        container.innerHTML = `<p class="text-on-surface-variant text-center py-8 col-span-full">No communities yet. Be the first to create one.</p>`;
        return;
    }

    container.innerHTML = communities.map(exploreCommunityCard).join('');
}

/** Look a community up in the live store first, then the explore cache, then the mock list. */
function findCommunity(communityId) {
    const key = String(communityId);
    const pools = [
        (state.exploreData && state.exploreData.communities) || [],
        ULink.data.communities || []
    ];
    for (const pool of pools) {
        const hit = pool.find(c => String(c.id) === key);
        if (hit) return hit;
    }
    return MOCK_COMMUNITIES.find(c => String(c.id) === key) || null;
}

async function openCommunityProfile(communityId) {
    const community = findCommunity(communityId);
    if (!community) return;

    activeCommunityId = communityId;
    switchTab('community-profile');

    // Populate Headers
    const pic = community.pic || community.cover_pic || community.cover || FALLBACK_COMMUNITY_PIC;
    const cover = community.cover_pic || community.cover || community.pic || '';
    const members = community.memberCount ?? community.members ?? 0;

    for (const id of ['community-profile-pic', 'community-nav-pic']) {
        const el = document.getElementById(id);
        if (el) {
            el.src = pic;
            el.onerror = function () { this.onerror = null; this.src = FALLBACK_COMMUNITY_PIC; };
        }
    }
    document.getElementById('community-profile-name').innerText = community.name;
    document.getElementById('community-profile-members').innerText = members;
    document.getElementById('community-profile-cover').style.backgroundImage = cover
        ? `url(${cover})`
        : `url(${FALLBACK_COMMUNITY_COVER})`;

    renderCommunityFeed(communityId);

    const joined = ULink.isLive ? Boolean(community.joined) : state.joinedCommunities.includes(communityId);
    _setCommunityJoinButton(communityId, joined);

    await renderCommunityFeed(communityId);
}

/** Is the signed-in user a member of this community? */
function isCommunityJoined(communityId) {
    if (ULink.isLive) {
        const live = (ULink.data.communities || []).find(c => String(c.id) === String(communityId));
        return live ? Boolean(live.joined) : false;
    }
    return state.joinedCommunities.includes(communityId);
}

/**
 * Paint the membership controls for a community.
 *
 * Three states, because a single button cannot express them: Join when you are
 * not a member, a "Joined" confirmation plus a Leave button when you are. The
 * previous version overwrote Join with an inert "Joined" label, so membership
 * could be gained but never lost from the interface.
 */
function _setCommunityJoinButton(communityId, joined, busy = false) {
    const joinBtn  = document.getElementById('community-join-btn');
    const joinedBtn = document.getElementById('community-joined-btn');
    const leaveBtn = document.getElementById('community-leave-btn');

    // `hidden` and `flex` are both display utilities and Tailwind decides
    // between them by stylesheet order, not class order, so nothing here may
    // also carry a display class.
    const show = (el, on) => { if (el) el.classList.toggle('hidden', !on); };

    if (busy) {
        show(joinBtn, false);
        show(joinedBtn, false);
        show(leaveBtn, true);
        if (leaveBtn) {
            leaveBtn.disabled = true;
            leaveBtn.innerText = 'Working...';
            leaveBtn.onclick = null;
        }
        return;
    }

    if (leaveBtn) {
        leaveBtn.disabled = false;
        leaveBtn.innerText = 'Leave';
        leaveBtn.onclick = null;
    }

    show(joinBtn, !joined);
    show(joinedBtn, joined);
    show(leaveBtn, joined);

    // Both controls drive the same handler: it reads the current state and
    // sends the opposite action, so the two can never disagree.
    if (joinBtn)   joinBtn.onclick   = () => handleJoinCommunity(communityId);
    if (joinedBtn) joinedBtn.onclick = () => handleJoinCommunity(communityId);
    if (leaveBtn)  leaveBtn.onclick  = () => handleJoinCommunity(communityId);
}

async function handleJoinCommunity(communityId) {
    const joined = isCommunityJoined(communityId);

    if (ULink.isLive) {
        _setCommunityJoinButton(communityId, joined, true);

        const result = await ULinkAPI.communityAction(joined ? 'leave' : 'join', Number(communityId));
        if (result.status !== 'success') {
            _setCommunityJoinButton(communityId, joined);
            if (showError) showError(result.message || 'Could not update your membership.');
            return;
        }

        // Apply the confirmed state to the local stores. A community opened
        // from Explore may only exist in the explore cache, so both are updated.
        const applyMembership = (row) => {
            if (!row) return;
            row.joined = result.joined !== undefined ? Boolean(result.joined) : !joined;
            // The endpoint returns the new count; taking it avoids a stale
            // "9 Members" sitting above the feed after leaving or joining.
            if (result.members !== undefined) {
                row.memberCount = Number(result.members);
            }
        };
        applyMembership((ULink.data.communities || []).find(c => String(c.id) === String(communityId)));
        if (state.exploreData && Array.isArray(state.exploreData.communities)) {
            applyMembership(state.exploreData.communities.find(c => String(c.id) === String(communityId)));
        }
        state.joinedCommunities = (ULink.data.communities || [])
            .filter(c => c.joined)
            .map(c => c.id);

        _setCommunityJoinButton(communityId, isCommunityJoined(communityId));
        await renderCommunityFeed(communityId);
        renderCommunitiesList();

        // The header member count is part of this screen, so leaving must not
        // leave "-1 Members" sitting above the feed until the next visit.
        const fresh = findCommunity(communityId);
        const membersEl = document.getElementById('community-profile-members');
        if (fresh && membersEl && String(activeCommunityId) === String(communityId)) {
            membersEl.innerText = fresh.memberCount ?? fresh.members ?? 0;
        }

        showToast(isCommunityJoined(communityId) ? `Joined the community.` : `Left the community.`);
        return;
    }

    // Offline: keep the old optimistic pending → joined animation.
    if (joined) {
        // Leaving a mock community, which only means forgetting it locally.
        state.joinedCommunities = state.joinedCommunities.filter(id => String(id) !== String(communityId));
        _setCommunityJoinButton(communityId, false);
        renderCommunityFeed(communityId);
        renderCommunitiesList();
        showToast('Left the community.');
        return;
    }

    _setCommunityJoinButton(communityId, false, true);
    state.pendingCommunities.push(communityId);

    renderCommunityFeed(communityId);
    renderCommunitiesList();

    setTimeout(() => {
        state.pendingCommunities = state.pendingCommunities.filter(id => String(id) !== String(communityId));
        state.joinedCommunities.push(communityId);

        if (String(activeCommunityId) === String(communityId)) {
            _setCommunityJoinButton(communityId, true);
            renderCommunityFeed(communityId);
        }
    }, 5000);
}

async function renderCommunityFeed(communityId) {
    const container = document.getElementById('community-feed-container');
    const warning = document.getElementById('community-locked-warning');
    if (!container || !warning) return;

    const isJoined = isCommunityJoined(communityId);

    const postInput = document.getElementById('community-post-input');
    const postBtn = document.getElementById('community-post-btn');
    const postImgInput = document.getElementById('post-image-input-community');
    const postImgBtn = document.getElementById('community-post-img-btn');
    if (postInput && postBtn) {
        postInput.disabled = !isJoined;
        postBtn.disabled = !isJoined;
        if (postImgInput) postImgInput.disabled = !isJoined;
        if (postImgBtn) postImgBtn.disabled = !isJoined;
    }

    if (isJoined) {
        warning.classList.add('hidden');
    } else {
        warning.classList.remove('hidden');
    }

    // One request returns the community plus its feed, so the page does not
    // need a second round trip for the posts.
    let posts;
    if (ULink.isLive) {
        const detail = await ULinkAPI.community(Number(communityId), true);
        if (detail.status !== 'success') {
            container.innerHTML = `<p class="text-on-surface-variant text-center py-8">${escapeHtml(detail.message || 'Could not load this community.')}</p>`;
            return;
        }

        posts = (detail.posts || []).map(p => ({
            ...p,
            id: String(p.id),
            userId: p.userId,
            communityRole: 'Member',
            timestamp: p.created_at ? timeAgoFrom(p.created_at) : '',
            commentsList: p.commentsList || []
        }));
    } else {
        posts = MOCK_COMMUNITY_POSTS[communityId] || [];
    }

    if (posts.length === 0) {
        container.innerHTML = `<p class="text-on-surface-variant text-center py-8">No posts in this community yet.</p>`;
        return;
    }

    container.innerHTML = posts.map(post => {
        // Live rows already carry the author's name and avatar; only the mock
        // rows need a lookup.
        const author = post.name
            ? { name: post.name, pic: post.pic }
            : getUserDetails(post.userId);

        // Feed interaction locking logic depending on isJoined
        let heartIcon = post.liked ? 'favorite' : 'favorite_border';
        let heartAction = isJoined ? `onclick="toggleCommunityLike('${communityId}', '${post.id}', this)"` : '';
        let heartClass = post.liked ? 'text-red-500 material-symbols-outlined' : 'text-on-surface hover:text-red-500 material-symbols-outlined';
        let heartFill = post.liked ? '1' : '0';

        const opacityLock = isJoined ? '' : 'opacity-50 pointer-events-none';

        // Show comments logic
        //
        // The composer has to render even when there are zero comments, or the
        // first comment could never be written. `showComments` is only consulted
        // in the offline path; live data always ships the comment list and the
        // click re-fetches it.
        const comments = post.commentsList || [];
        const commentsOpen = ULink.isLive || Boolean(post.showComments);
        const commentsHtml = commentsOpen ? `
            <div class="mt-4 pt-4 border-t border-slate-100 space-y-3">
                ${comments.length ? comments.map(c => `
                    <div class="flex gap-2">
                        <img src="${escapeHtml(c.pic || (getUserDetails(c.userId) || {}).pic || '')}" onerror="this.src='Asserts/default-avatar.jpg'" class="w-7 h-7 rounded-full object-cover">
                        <div class="bg-slate-50 dark:bg-surface-container p-2 rounded-xl flex-1">
                            <p class="text-[11px] font-bold">${escapeHtml(c.name || '')}</p>
                            <p class="text-xs text-slate-700 dark:text-slate-300">${escapeHtml(c.text || '')}</p>
                        </div>
                    </div>
                `).join('') : '<p class="text-[11px] text-on-surface-variant">No comments yet. Be the first.</p>'}
                <div class="flex gap-2 mt-2">
                    <img src="${escapeHtml(state.user.pic)}" onerror="this.src='Asserts/default-avatar.jpg'" class="w-7 h-7 rounded-full object-cover">
                    <div class="flex-1 relative">
                        <input type="text" placeholder="Write a comment..." 
                            onkeydown="if(event.key==='Enter') addCommunityComment('${communityId}', '${post.id}', this.value)"
                            class="w-full bg-slate-100 dark:bg-surface-container-high border-none rounded-full px-4 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none">
                    </div>
                </div>
            </div>
        ` : '';

        return `
        <div class="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-slate-100 flex gap-4">
            <img src="${escapeHtml(author.pic || '')}" onerror="this.src='Asserts/default-avatar.jpg'" class="w-12 h-12 rounded-full object-cover">
            <div class="flex-1">
                <div class="flex items-start justify-between">
                    <div>
                        <h4 class="font-bold text-sm">${escapeHtml(author.name || 'Unknown')} <span class="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded ml-1 font-bold">${escapeHtml(post.communityRole || '')}</span></h4>
                        <p class="text-[11px] text-slate-500 font-medium">${escapeHtml(post.timestamp || '')}</p>
                    </div>
                </div>
                <p class="text-sm mt-3 text-slate-800 dark:text-slate-200 leading-relaxed font-medium">${escapeHtml(post.text)}</p>
                ${post.image ? `<img src="${escapeHtml(post.image)}" class="mt-3 rounded-xl w-full h-auto object-cover border border-slate-100 max-h-80 shadow-sm">` : ''}
                <div class="flex items-center gap-6 mt-4">
                    <button ${heartAction} class="flex items-center gap-1.5 transition-colors group ${opacityLock}">
                        <span class="${heartClass} text-[20px] group-active:scale-125 transition-transform" style="font-variation-settings: 'FILL' ${heartFill};">${heartIcon}</span>
                        <span class="text-xs font-bold text-on-surface">${post.likes}</span>
                    </button>
                    <button onclick="toggleCommunityComments('${communityId}', '${post.id}')" class="flex items-center gap-1.5 text-on-surface hover:text-primary transition-colors ${opacityLock}">
                        <span class="material-symbols-outlined text-[20px]">chat_bubble_outline</span>
                        <span class="text-xs font-bold">${post.comments}</span>
                    </button>
                    <button onclick="handleCommunityShare('${communityId}', '${post.id}')" class="flex items-center gap-1.5 text-on-surface hover:text-primary transition-colors ml-auto ${opacityLock}">
                        <span class="material-symbols-outlined text-[20px]">share</span>
                        <span class="text-xs font-bold hidden sm:inline">Share</span>
                    </button>
                </div>
                ${commentsHtml}
            </div>
        </div>
        `;
    }).join('');
}

async function submitCommunityPost() {
    const input = document.getElementById('community-post-input');
    if (!input || !activeCommunityId) return;

    const text = input.value.trim();
    if (!text && !uploadedImageBase64) return;

    if (!isCommunityJoined(activeCommunityId)) {
        if (showError) showError('Join the community before posting.');
        return;
    }

    if (ULink.isLive) {
        const result = await ULinkAPI.createPost({
            text,
            image: uploadedImageBase64,
            community_id: Number(activeCommunityId)
        });

        if (result.status !== 'success') {
            if (showError) showError(result.message || 'Could not publish your post.');
            return;
        }

        input.value = "";
        removeImage('community');
        await renderCommunityFeed(activeCommunityId);
        showToast('Posted to the community.');
        return;
    }

    if (!MOCK_COMMUNITY_POSTS[activeCommunityId]) {
        MOCK_COMMUNITY_POSTS[activeCommunityId] = [];
    }

    const newPost = {
        id: `cp_${activeCommunityId}_new_${Date.now()}`,
        userId: state.user.id,
        communityRole: "Member",
        text: text,
        image: uploadedImageBase64,
        likes: 0,
        comments: 0,
        liked: false,
        commentsList: [],
        timestamp: "Just now"
    };

    MOCK_COMMUNITY_POSTS[activeCommunityId].unshift(newPost);
    input.value = "";
    removeImage('community');
    renderCommunityFeed(activeCommunityId);
}

function toggleCommunityComments(communityId, postId) {
    if (!isCommunityJoined(communityId)) return;

    if (ULink.isLive) {
        // The server always returns the comment list; show/hide is local state.
        renderCommunityFeed(communityId);
        return;
    }

    const posts = MOCK_COMMUNITY_POSTS[communityId];
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) return;

    post.showComments = !post.showComments;
    renderCommunityFeed(communityId);
}

async function addCommunityComment(communityId, postId, text) {
    if (!text.trim()) return;

    if (ULink.isLive) {
        const result = await ULinkAPI.commentPost(Number(postId), text.trim());
        if (result.status !== 'success') {
            if (showError) showError(result.message || 'Could not add your comment.');
            return;
        }
        await renderCommunityFeed(communityId);
        return;
    }

    const posts = MOCK_COMMUNITY_POSTS[communityId];
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) return;

    post.commentsList.push({
        id: Date.now(),
        userId: state.user.id,
        name: state.user.name,
        text: text
    });
    post.comments++;
    renderCommunityFeed(communityId);
}

async function handleCommunityShare(communityId, postId) {
    if (!isCommunityJoined(communityId)) return;
    if (!await showConfirm('This will post a copy to your newsfeed, visible to everyone who follows you.', {
        title: 'Share to newsfeed',
        confirmText: 'Share',
        icon: 'share'
    })) return;

    const community = findCommunity(communityId);
    if (!community) return;

    let sharedText;
    let sharedImage = null;

    if (ULink.isLive) {
        const detail = await ULinkAPI.community(Number(communityId), true);
        if (detail.status !== 'success') {
            if (showError) showError(detail.message || 'Could not load that post.');
            return;
        }
        const source = (detail.posts || []).find(p => String(p.id) === String(postId));
        if (!source) return;
        sharedText = source.text;
        sharedImage = source.image;
    } else {
        const posts = MOCK_COMMUNITY_POSTS[communityId];
        const source = posts.find(p => String(p.id) === String(postId));
        if (!source) return;
        const originalAuthor = getUserDetails(source.userId);
        sharedText = `[Shared from ${community.name}]\n\nOriginal post by ${originalAuthor.name}:\n${source.text}`;
        sharedImage = source.image;
    }

    const result = await ULinkAPI.createPost({
        text: `[Shared from ${community.name}]\n\n${sharedText}`,
        image: sharedImage || ''
    });

    if (result.status !== 'success') {
        if (showError) showError(result.message || 'Could not share this post.');
        return;
    }

    if (state.user) state.user.postsCount++;
    await renderFeed();
    showToast('Post shared to your timeline!');
}

async function toggleCommunityLike(communityId, postId, btn) {
    if (!isCommunityJoined(communityId)) return;

    if (ULink.isLive) {
        const result = await ULinkAPI.likePost(Number(postId));
        if (result.status !== 'success') {
            if (showError) showError(result.message || 'Could not update your like.');
            return;
        }

        // Reflect the server's confirmed counts, then repaint the card.
        const detail = await ULinkAPI.community(Number(communityId), true);
        if (detail.status === 'success') {
            const row = (detail.posts || []).find(p => String(p.id) === String(postId));
            if (row && btn) {
                const iconSpan = btn.querySelector('span.material-symbols-outlined');
                const textSpan = btn.querySelectorAll('span')[1];
                if (iconSpan) {
                    iconSpan.classList.toggle('text-red-500', Boolean(row.liked));
                    iconSpan.classList.toggle('text-on-surface', !row.liked);
                    iconSpan.innerText = row.liked ? 'favorite' : 'favorite_border';
                    iconSpan.style.fontVariationSettings = `'FILL' ${row.liked ? 1 : 0}`;
                    if (row.liked) {
                        iconSpan.classList.add('like-animation');
                        setTimeout(() => iconSpan.classList.remove('like-animation'), 500);
                    }
                }
                if (textSpan) textSpan.innerText = row.likes;
            }
        }
        return;
    }

    const posts = MOCK_COMMUNITY_POSTS[communityId];
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) return;

    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;

    if (btn) {
        const iconSpan = btn.querySelector('span.material-symbols-outlined');
        const textSpan = btn.querySelectorAll('span')[1];

        if (post.liked) {
            iconSpan.classList.remove('text-on-surface', 'hover:text-red-500');
            iconSpan.classList.add('text-red-500', 'like-animation');
            iconSpan.innerText = 'favorite';
            iconSpan.style.fontVariationSettings = "'FILL' 1";

            setTimeout(() => iconSpan.classList.remove('like-animation'), 500);
        } else {
            iconSpan.classList.remove('text-red-500');
            iconSpan.classList.add('text-on-surface', 'hover:text-red-500');
            iconSpan.innerText = 'favorite_border';
            iconSpan.style.fontVariationSettings = "'FILL' 0";
        }
        textSpan.innerText = post.likes;
    } else {
        renderCommunityFeed(communityId);
    }
}

// --- Settings ---
//
// Preferences are persisted in `user_settings` (api/settings/*.php). This small
// store mirrors the server defaults so the UI can respond instantly, and applies
// the appearance flags as classes on <html>.
const ULinkSettings = {
    DEFAULTS: {
        compact_feed: false,
        reduce_motion: false,
        profile_visibility: 'public',
        show_online_status: true,
        allow_search_by_id: true,
        message_privacy: 'everyone',
        notify_likes: true,
        notify_comments: true,
        notify_friend_requests: true,
        notify_events: true
    },
    current: {},

    apply(settings) {
        this.current = { ...this.DEFAULTS, ...(settings || {}) };
        const root = document.documentElement;
        root.classList.toggle('compact-feed', !!this.current.compact_feed);
        root.classList.toggle('reduce-motion', !!this.current.reduce_motion);
        return this.current;
    }
};

function switchSettingsTab(tabId) {
    document.querySelectorAll('.settings-panel').forEach(el => {
        el.classList.remove('block');
        el.classList.add('hidden');
    });
    const activePanel = document.getElementById(`settings-${tabId}-panel`);
    if (activePanel) {
        activePanel.classList.remove('hidden');
        activePanel.classList.add('block');
    }

    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('bg-primary', isActive);
        btn.classList.toggle('text-on-primary', isActive);
        btn.classList.toggle('text-on-surface-variant', !isActive);
        btn.classList.toggle('hover:bg-surface-container-high', !isActive);
    });

    // Re-read from the live store so a value changed elsewhere is not stale.
    if (tabId === 'account') updateUI();
    if (tabId === 'preferences' || tabId === 'privacy' || tabId === 'notifications') {
        fillSettingsForm();
    }
}

// Paint every settings control from ULinkSettings.current.
function fillSettingsForm() {
    const s = ULinkSettings.current;
    const check = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.checked = !!value;
    };
    const select = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };

    check('settings-compact-feed', s.compact_feed);
    check('settings-reduce-motion', s.reduce_motion);
    check('settings-show-online', s.show_online_status);
    check('settings-allow-search', s.allow_search_by_id);
    check('settings-notify-likes', s.notify_likes);
    check('settings-notify-comments', s.notify_comments);
    check('settings-notify-friend-requests', s.notify_friend_requests);
    check('settings-notify-events', s.notify_events);
    select('settings-profile-visibility', s.profile_visibility);
    select('settings-message-privacy', s.message_privacy);

    const dark = document.getElementById('dark-mode-toggle');
    if (dark) dark.checked = document.documentElement.classList.contains('dark');
}

async function loadSettings(force = false) {
    // The bootstrap payload already carries the settings, so the common path
    // never needs a second request.
    if (ULink.data.settings && !force) {
        ULinkSettings.apply(ULink.data.settings);
        fillSettingsForm();
        return ULinkSettings.current;
    }

    if (!ULink.isLive) {
        ULinkSettings.apply(ULink.data.settings || {});
        fillSettingsForm();
        return ULinkSettings.current;
    }

    const result = await ULinkAPI.settings();
    if (result.status === 'success' && result.settings) {
        ULink.data.settings = result.settings;
        ULinkSettings.apply(result.settings);
    }
    fillSettingsForm();
    return ULinkSettings.current;
}

async function saveSetting(key, value) {
    // Optimistic: apply straight away so the toggle reacts without a round trip.
    ULinkSettings.current[key] = value;
    ULinkSettings.apply(ULinkSettings.current);

    if (!ULink.isLive) {
        showToast('Setting saved.');
        return;
    }

    const result = await ULinkAPI.updateSettings({ [key]: value });
    if (result.status !== 'success') {
        showError(result.message || 'Could not save that setting.');
        // Re-read the server value so the control does not keep a change that
        // was rejected.
        ULink.data.settings = null;
        await loadSettings(true);
        return;
    }

    ULink.data.settings = result.settings;
    ULinkSettings.apply(result.settings);
    fillSettingsForm();
    showToast('Setting saved.');
}

async function saveAccountSettings() {
    const nameInput = document.getElementById('settings-name-input');
    if (!nameInput) return;

    const deptInput = document.getElementById('settings-dept-input');
    const batchInput = document.getElementById('settings-batch-input');
    const bioInput = document.getElementById('settings-bio-input');

    const newName = nameInput.value.trim();
    const newDept = deptInput ? deptInput.value.trim() : (state.user.dept || '');
    const newBatch = batchInput ? batchInput.value.trim() : (state.user.batch || '');
    const newBio = bioInput ? bioInput.value.trim() : (state.user.bio || '');

    if (!newName) {
        showToast("Name cannot be empty!", 'error');
        nameInput.focus();
        return;
    }
    if (newName.length < 2) {
        showToast("Name must be at least 2 characters.", 'error');
        nameInput.focus();
        return;
    }

    // This used to assign straight onto state.user and never touch the API, so
    // every change made in Settings was lost on reload. Same endpoint the
    // profile editor uses; the target is always the session holder.
    if (ULink.isLive) {
        const result = await ULinkAPI.updateProfile({
            name: newName,
            department: newDept,
            batch: newBatch,
            bio: newBio
        });

        if (result.status !== 'success') {
            showToast(result.message || 'Could not save your settings.', 'error');
            return;
        }

        // Take the server's normalised values rather than the raw form input.
        ULink.applyUser({ ...(ULink.data.user || {}), ...(result.user || {}) });
        ActivityLogger.logProfileUpdated({ name: newName });
    } else {
        state.user.name = newName;
        state.user.dept = newDept;
        state.user.batch = newBatch;
        state.user.bio = newBio;
    }

    updateUI();
    showToast("Settings saved successfully!", 'success');
}

async function changePassword() {
    const current = document.getElementById('settings-current-password');
    const next = document.getElementById('settings-new-password');
    const confirm = document.getElementById('settings-confirm-password');
    if (!current || !next || !confirm) return;

    if (!current.value) {
        showError('Enter your current password.');
        current.focus();
        return;
    }
    if (!next.value) {
        showError('Enter a new password.');
        next.focus();
        return;
    }
    if (next.value !== confirm.value) {
        showError('The new passwords do not match.');
        confirm.focus();
        return;
    }

    const result = await ULinkAPI.changePassword(current.value, next.value);
    if (result.status !== 'success') {
        showError(result.message || 'Could not change your password.');
        return;
    }

    current.value = '';
    next.value = '';
    confirm.value = '';
    showToast('Password changed successfully.');
}

async function deactivateAccount() {
    const confirmed = await showConfirm(
        'Deactivating hides your profile from U-Link until an administrator re-enables it, and signs you out. Nothing is deleted.',
        { title: 'Deactivate account', confirmText: 'Deactivate', danger: true, icon: 'warning' }
    );
    if (!confirmed) return;

    const passwordInput = document.getElementById('settings-deactivate-password');
    const password = passwordInput ? passwordInput.value : '';
    if (!password) {
        showError('Enter your password to confirm.');
        if (passwordInput) passwordInput.focus();
        return;
    }

    const result = await ULinkAPI.deactivateAccount(password);
    if (result.status !== 'success') {
        showError(result.message || 'Could not deactivate your account.');
        return;
    }

    showToast('Your account has been deactivated.');
    setTimeout(() => window.location.reload(), 1200);
}

// Switching the theme only flips a class on <html>, and the browser does not
// always recompute every descendant. Elements with a `backdrop-filter` are
// promoted to their own compositing layer and can keep the styles that layer
// was first painted with, so a translucent card stays light after the user
// switches to dark mode and its own text becomes unreadable against it. Moving
// the app shell forces a full style recompute of the subtree, which is the only
// reliable trigger found; a plain class flip and a filter nudge both failed
// intermittently.
function forceThemeRepaint() {
    const app = document.getElementById('main-app');
    if (!app || !app.parentNode) return;
    const marker = document.createComment('theme-repaint');
    app.parentNode.insertBefore(marker, app);
    app.parentNode.removeChild(app);
    marker.parentNode.replaceChild(app, marker);
}

function updateThemeToggleIcon() {
    const icon = document.getElementById('theme-toggle-icon');
    if (!icon) return;
    icon.innerText = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode';
}

function toggleDarkMode(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
    updateThemeToggleIcon();
    forceThemeRepaint();
}

// Initialize theme on load. A saved choice always wins; otherwise follow the
// operating system, which is the behaviour people expect from a theme toggle.
(function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;

    document.documentElement.classList.toggle('dark', isDark);
    updateThemeToggleIcon();

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.checked = isDark;
    }
})();
