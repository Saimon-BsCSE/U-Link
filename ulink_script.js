
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

// -- System Initialization --
function generateCommunityPosts() {
    const roles = ["President", "Vice President", "HR", "General Secretary", "Executive Member", "Member"];

    const communitySpecificContexts = {
        'c1': [
            "Just finished a great coding competition! 💻",
            "Who's excited for the DevFest next month?",
            "Sharing some useful Python resources for beginners.",
            "Our hackathon winners have been announced!",
            "Any tips for optimizing React state management?"
        ],
        'c2': [
            "Check out this shot from yesterday's golden hour at UIU! 📸",
            "Photography workshop coming up this Friday.",
            "What's your favorite lens for street photography?",
            "Sharing some raw edits from the recent campus tour.",
            "Let's talk about composition techniques for landscapes."
        ],
        'c3': [
            "The circuit design workshop was a huge success! ⚡",
            "Any seniors can help with the microprocessors project?",
            "Excited for the upcoming EEE seminar on renewable energy.",
            "Just got my new soldering station! Ready to build.",
            "Sharing some insights on signal processing."
        ],
        'c4': [
            "Rover testing in progress at the UIU playground! 🚀",
            "Mechanical subsystem update: We are looking stable.",
            "Our team is heading to the international rover challenge!",
            "Sharing some b-roll from our assembly phase.",
            "What sensors should we prioritize for the next iteration?"
        ],
        'c5': [
            "Practice session for the annual fest starts at 4 PM! 🎭",
            "Music is the soul of UIU. Who's in for a jam session?",
            "Rehearsing the new drama script. It's looking great!",
            "Cultural night photos are finally out! Link in bio.",
            "Join our dance troop for the upcoming inter-university fest."
        ],
        'c6': [
            "New app update just dropped! 📱 Check it out on Play Store.",
            "Discussing the latest design trends in mobile UI.",
            "Anyone interested in a Flutter vs React Native debate?",
            "Sharing my first published app journey with you all.",
            "Join our APP development workshop series starting Monday."
        ],
        'c7': [
            "Fascinating lecture on Deep Learning today! 🧠",
            "Generative AI is changing the world. How should we adapt?",
            "Sharing my latest training results from the Kaggle contest.",
            "AI Explorers team is building something huge. Stay tuned!",
            "What's your favorite AI framework: PyTorch or TensorFlow?"
        ],
        'c8': [
            "Public speaking session today was enlightening! 🗣️",
            "Improving vocabulary one day at a time. Here are 5 new words.",
            "Debate competition registration is now open!",
            "Sharing some tips on writing formal essays.",
            "English Language Forum weekly meet-up in Room 402."
        ],
        'c9': [
            "Tournament finals are tonight! ⚽ Who will win the trophy?",
            "My eFootball dream team is finally complete.",
            "Looking for 2v2 partners for the upcoming league.",
            "Sharing some crazy goal clips from today's matches.",
            "Patch notes discussion: How are the new physics handling?"
        ],
        'c10': [
            "Great match yesterday! Our team played amazing.",
            "Registration for the inter-department sports tournament is open.",
            "Practice session at 4 PM in the playground.",
            "Who wants to join the futsal match this weekend?",
            "Sharing highlights from the recent cricket cup!"
        ],
        'c11': [
            "Competitive programming contest this Saturday!",
            "Any recommendations for learning system design?",
            "We are organizing a workshop on open source contributions.",
            "Just solved my 100th LeetCode problem! 💻",
            "Discussing the latest tech news and framework updates."
        ],
        'c12': [
            "Amazing seminar on entrepreneurship and start-ups today.",
            "Looking for team members for the business case competition.",
            "Let's discuss the latest stock market trends.",
            "UIU Business Club is organizing an industrial tour next week.",
            "Sharing some tips on effective marketing strategies! 📈"
        ],
        'c13': [
            "Fascinating discoveries in genetic engineering!",
            "Biotech lab session was great today. We observed some cool microbes.",
            "Sharing resources on bioinformatics and computational biology.",
            "Upcoming seminar on sustainable biomaterials.",
            "Who's attending the national biotechnology fair?"
        ],
        'c14': [
            "Understanding drug delivery systems in our recent lecture.",
            "Pharmacy Club blood donation drive was a huge success!",
            "Tips for memorizing pharmacology classifications? 💊",
            "Discussing the role of clinical pharmacists in modern healthcare.",
            "Preparing for the upcoming pharmacy internship interviews."
        ],
        'c15': [
            "Great turnout at the Data Visualization workshop!",
            "Kaggle competition deadline is approaching, let's form a team.",
            "Pandas or Polars? Let's discuss data manipulation frameworks.",
            "Sharing my latest project on predictive modeling. 📊",
            "Anyone interested in a study group for machine learning math?"
        ]
    };

    MOCK_COMMUNITIES.forEach(community => {
        const posts = [];
        const contexts = communitySpecificContexts[community.id] || ["Hey everyone! Welcome to our community.", "Excited to share our progress."];

        for (let i = 1; i <= 20; i++) {
            const randomUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
            const randomRole = roles[Math.floor(Math.random() * roles.length)];
            const text = contexts[Math.floor(Math.random() * contexts.length)];

            // 40% chance of having an image
            const hasImage = Math.random() < 0.4;
            const postImage = hasImage && community.feedImages ? community.feedImages[Math.floor(Math.random() * community.feedImages.length)] : "";

            posts.push({
                id: `cp_${community.id}_${i}`,
                userId: randomUser.id,
                communityRole: randomRole,
                text: text,
                image: postImage,
                likes: Math.floor(Math.random() * 80) + 1,
                comments: Math.floor(Math.random() * 15),
                liked: false,
                commentsList: [], // Initializing comments for interactivity
                timestamp: `${Math.floor(Math.random() * 23) + 1}h ago`
            });
        }
        MOCK_COMMUNITY_POSTS[community.id] = posts;
    });
}
generateCommunityPosts();

function generateNewsfeedPosts() {
    const postTexts = [
        "Has anyone tried the new pasta at the cafeteria? 🍝 It's actually pretty good!",
        "Midterms got me like 😵‍💫 Keep pushing everyone!",
        "Missing my 8am class because Dhaka traffic is undefeated. 🚗🚕🚙",
        "Just saw the cutest cat near the admin building! 🐈",
        "Library is completely full. Where else can I study quietly?",
        "Beautiful weather today. Perfect for a walk around the campus between classes. ☀️",
        "Does anyone know if we have a holiday next Thursday?",
        "Can someone explain the last slide of DSP lecture? I'm completely lost. 😭",
        "I finally got my campus ID badge today! Feeling official. 🎓",
        "Just deployed my first Next.js project on Vercel! It works! 🚀",
        "Is it just me or is the Wi-Fi acting up again?",
        "The recent seminar on AI in Medicine was absolutely mind-blowing. 🧠",
        "Anybody down for a quick match of FIFA in the common room? 🎮",
        "Shoutout to the guard at Gate 2, always smiling! Have a great day everyone.",
        "Pro tip: Always bring an umbrella. The weather app lies. ☔"
    ];

    for (let i = 0; i < 20; i++) {
        const randomUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
        const text = postTexts[i % postTexts.length];
        const postImage = Math.random() < 0.7 ? `https://picsum.photos/seed/nf${Math.random().toString().substring(2, 8)}/800/400` : "";

        state.posts.push({
            id: `nf_${i}`,
            userId: randomUser.id,
            text: text,
            image: postImage,
            likes: Math.floor(Math.random() * 300) + 15,
            comments: Math.floor(Math.random() * 40),
            liked: false,
            commentsList: []
        });
    }
}
generateNewsfeedPosts();

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
    document.getElementById('display-info').innerText = `${state.user.dept} • ${state.user.batch} • ID: ${state.user.id}`;
    document.getElementById('nav-profile-pic').src = state.user.pic;

    const sidebarPic = document.getElementById('sidebar-profile-pic');
    if (sidebarPic) sidebarPic.src = state.user.pic;

    const friendsCountBadge = document.getElementById('friends-count-badge');
    if (friendsCountBadge) friendsCountBadge.innerText = state.friends.length;

    // Profile view updates
    document.getElementById('profile-name').innerText = state.user.name;
    document.getElementById('profile-bio').innerText = state.user.bio;
    document.getElementById('profile-picture').src = state.user.pic;
    document.getElementById('post-user-pic').src = state.user.pic;
    const profilePicField = document.getElementById('post-user-pic-profile');
    if (profilePicField) profilePicField.src = state.user.pic;
    document.getElementById('profile-friends-count').innerText = state.friends.length;
    document.getElementById('profile-posts-count').innerText = state.user.postsCount;

    // Settings view updates
    const settingsNameInput = document.getElementById('settings-name-input');
    if (settingsNameInput) settingsNameInput.value = state.user.name;
    const settingsBioInput = document.getElementById('settings-bio-input');
    if (settingsBioInput) settingsBioInput.value = state.user.bio || "";
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
            el.classList.add('text-orange-600', 'dark:text-orange-500', 'border-b-2', 'border-orange-600');
            el.classList.remove('text-slate-600', 'dark:text-slate-400');
        } else {
            el.classList.remove('text-orange-600', 'dark:text-orange-500', 'border-b-2', 'border-orange-600');
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
        if (tabId === 'events') renderEventsGrid();
        if (tabId === 'communities') renderCommunitiesList();
        if (tabId === 'explore') switchExploreTab('main');
        if (tabId === 'messages') {
            document.getElementById('right-sidebar').classList.add('hidden');
            renderMessagesViewList();
        } else {
            document.getElementById('right-sidebar').classList.remove('hidden');
            
        }
    }

    updateGlobalFab(tabId);
}

function switchExploreTab(subTabId) {
    // Hide all explore sub-views
    const exploreViews = ['explore-main-view', 'explore-programming-view', 'explore-research-view', 'explore-gaming-view', 'explore-career-view'];
    exploreViews.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(`explore-${subTabId}-view`);
    if (target) {
        target.classList.remove('hidden');
    }

    // Scroll to top when switching internal tabs
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update FAB based on explore sub-tab
    updateGlobalFab('explore', subTabId);
}

function updateGlobalFab(tabId, subTabId = 'main') {
    const fabButton = document.getElementById('global-fab');
    if (!fabButton) return;

    let icon = 'edit';
    let text = 'Create Post';
    let action = 'focusCreatePost()';
    let colorClass = 'bg-primary';

    if (tabId === 'explore') {
        if (subTabId === 'programming') {
            icon = 'code'; text = 'Share Project'; colorClass = 'bg-indigo-600'; action = "alert('Share Project feature coming soon!')";
        } else if (subTabId === 'research') {
            icon = 'emoji_objects'; text = 'Submit Idea'; colorClass = 'bg-teal-600'; action = "alert('Submit Research Idea feature coming soon!')";
        } else if (subTabId === 'gaming') {
            icon = 'sports_esports'; text = 'Find Squad'; colorClass = 'bg-fuchsia-600'; action = "alert('Find Squad feature coming soon!')";
        } else if (subTabId === 'career') {
            icon = 'upload_file'; text = 'Upload CV'; colorClass = 'bg-blue-600'; action = "alert('Upload CV feature coming soon!')";
        } else {
            fabButton.classList.add('hidden');
            return;
        }
    } else if (tabId === 'events') {
        icon = 'event'; text = 'Host Event'; action = "alert('Host event feature coming soon!')"; colorClass = 'bg-orange-600';
    } else if (tabId === 'communities') {
        icon = 'group_add'; text = 'New Community'; action = "alert('Create community feature coming soon!')"; colorClass = 'bg-primary';
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

function submitPost(source = 'home') {
    const textId = source === 'home' ? 'post-text' : (source === 'profile' ? 'post-text-profile' : 'post-text');
    const textEl = document.getElementById(textId);
    if (!textEl) return;
    let text = textEl.value.trim();
    const feeling = selectedFeeling[source];
    if (feeling) text = text ? `${text} — feeling ${feeling}` : `feeling ${feeling}`;
    if (!text && !uploadedImageBase64) return;

    const newPost = {
        id: Date.now(),
        userId: state.user.id,
        text: text,
        image: uploadedImageBase64,
        likes: 0,
        comments: 0,
        liked: false,
        commentsList: []
    };

    state.posts.unshift(newPost);
    state.user.postsCount++;

    // Reset the correct textarea
    textEl.value = "";
    // Reset image for the correct source
    removeImage(source);
    resetFeeling(source);

    if (activeTab === 'home') renderFeed();
    if (activeTab === 'profile') renderUserPosts();
    updateUI();
}

// --- Feed Rendering & Interaction ---
function getUserDetails(id) {
    if (id === state.user?.id) return state.user;
    return MOCK_USERS.find(u => u.id === id) || { name: "Unknown", dept: "N/A", role: "Unknown", batch: "N/A", pic: "" };
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

function renderFeed() {
    const container = document.getElementById('feed-container');
    container.innerHTML = state.posts.map(post => createPostHTML(post)).join('');
}

function renderUserPosts() {
    const container = document.getElementById('my-posts-container');
    const userPosts = state.posts.filter(p => p.userId === state.user.id);
    if (userPosts.length === 0) {
        container.innerHTML = `<p class="text-on-surface-variant text-center py-8">No posts yet.</p>`;
    } else {
        container.innerHTML = userPosts.map(post => createPostHTML(post)).join('');
    }
}

function createPostHTML(post) {
    const author = getUserDetails(post.userId);
    const fallbackImage = `https://picsum.photos/seed/fallback_${post.id}/800/500`;
    const imgHtml = post.image ? `<div class="overflow-hidden rounded-xl mt-4 border border-slate-200 dark:border-slate-700/60 shadow-sm transition-transform duration-500 hover:scale-[1.01]"><img src="${post.image}" onerror="this.onerror=null; this.src='${fallbackImage}';" class="w-full max-h-96 object-cover bg-slate-100 dark:bg-slate-800"></div>` : '';
    const likeIcon = post.liked ? 'favorite' : 'favorite_border';
    const likeClass = post.liked ? 'text-red-500' : 'text-slate-500';
    const likeFill = post.liked ? '1' : '0';

    const commentsHtml = post.commentsList ? post.commentsList.map(c => `
        <div class="bg-surface-container-high rounded-xl p-3 mb-2 border border-slate-100 dark:border-slate-800">
            <span class="font-extrabold text-xs mr-1 cursor-pointer hover:underline text-primary" onclick="openPublicProfile('${c.userId || '101'}')">${c.name}</span>
            <span class="text-sm text-slate-700 dark:text-slate-300 font-medium">${c.text}</span>
        </div>`).join('') : "";

    return `<div class="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-700/60 hover:shadow-2xl transition-all duration-300">
        <div class="flex gap-4 mb-4 cursor-pointer group w-fit" onclick="openPublicProfile('${author.id}')">
            <img src="${author.pic}" class="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-white dark:border-slate-700 group-hover:opacity-90 transition-all">
            <div class="flex flex-col justify-center">
                <h4 class="font-extrabold text-base leading-tight group-hover:underline text-slate-900 dark:text-slate-100">${author.name}</h4>
                <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors mt-0.5">${author.role === 'Student' ? author.dept + ' • Batch ' + author.batch : author.role + ' • ' + author.dept} <span class="mx-1">•</span> <span class="material-symbols-outlined text-[10px] inline-block align-middle">public</span></p>
            </div>
        </div>
        <p class="text-[15px] font-semibold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">${post.text}</p>
        ${imgHtml}
        <div class="flex items-center gap-6 mt-5 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
            <button onclick="toggleLike('${post.id}', this)" class="flex items-center gap-2 group flex-1 justify-center sm:flex-none sm:justify-start">
                <div class="p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors ${post.liked ? 'bg-red-50 dark:bg-red-900/20' : ''}">
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
                <button onclick="submitComment('${post.id}', this)" class="bg-primary text-white p-2 rounded-full w-9 h-9 flex items-center justify-center hover:bg-primary/90 transition-colors active:scale-95">
                    <span class="material-symbols-outlined text-sm">send</span>
                </button>
            </div>
        </div>
    </div>`;
}

function toggleLike(postId, btn) {
    const post = state.posts.find(p => String(p.id) === String(postId));
    if (post) {
        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;

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
    const postCard = btn.closest('.bg-gradient-to-br');
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

function submitComment(postId, btn) {
    // Use relative DOM traversal to avoid duplicate ID issues
    const postCard = btn.closest('.bg-gradient-to-br');
    const input = postCard ? postCard.querySelector('.post-comment-input') : null;
    const text = input ? input.value.trim() : '';
    if (!text) return;

    const post = state.posts.find(p => String(p.id) === String(postId));
    if (post) {
        if (!post.commentsList) post.commentsList = [];
        post.commentsList.push({
            id: Date.now(),
            userId: state.user.id,
            name: state.user.name,
            text: text
        });
        post.comments = post.commentsList.length;
        input.value = '';

        // Update only the comments list within this specific post card (no full re-render needed)
        const commentsListDiv = postCard.querySelector('.max-h-40');
        if (commentsListDiv) {
            const newComment = document.createElement('div');
            newComment.className = 'bg-surface-container-high rounded-xl p-3 mb-2 border border-slate-100 dark:border-slate-800';
            newComment.innerHTML = `<span class="font-extrabold text-xs mr-1 cursor-pointer hover:underline text-primary" onclick="openPublicProfile('${state.user.id}')">${state.user.name}</span><span class="text-sm text-slate-700 dark:text-slate-300 font-medium">${post.commentsList[post.commentsList.length - 1].text}</span>`;
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
function handleSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const dropdown = document.getElementById('search-dropdown');
    if (query.length < 1) {
        dropdown.classList.add('hidden');
        return;
    }

    const results = MOCK_USERS.filter(u => u.name.toLowerCase().includes(query));

    if (results.length === 0) {
        dropdown.innerHTML = `<div class="p-4 text-sm text-center text-on-surface-variant">No users found</div>`;
    } else {
        dropdown.innerHTML = results.map(u => `
        <div class="flex items-center gap-3 p-3 hover:bg-surface-container-low cursor-pointer transition-colors" onclick="openPublicProfile('${u.id}')">
            <img src="${u.pic}" class="w-8 h-8 rounded-full border border-slate-200">
            <div>
                <div class="font-bold text-sm">${u.name}</div>
                <div class="text-xs text-on-surface-variant">${u.role === 'Student' ? u.dept + ' • Batch ' + u.batch : u.role + ' • ' + u.dept}</div>
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

function openPublicProfile(userId) {
    if (userId === state.user?.id) {
        switchTab('profile');
        return;
    }

    const user = MOCK_USERS.find(u => u.id === userId) || { id: userId, name: "Unknown User", role: "Student", dept: "N/A", batch: "N/A", pic: "https://ui-avatars.com/api/?name=Unknown&background=random" };

    document.getElementById('search-dropdown').classList.add('hidden');
    document.getElementById('search-input').value = "";

    currentOtherUserId = userId;
    switchTab('other-profile');

    document.getElementById('other-profile-name').innerText = user.name;
    document.getElementById('other-profile-bio').innerText = user.role === 'Student' ? `${user.dept} • Batch ${user.batch}` : `${user.role} • ${user.dept}`;
    document.getElementById('other-profile-picture').src = user.pic;
    document.getElementById('other-profile-about').innerText = user.bio || `Passionate ${user.role} at United International University. Active in the digital quad.`;

    const userPosts = state.posts.filter(p => p.userId === userId);
    document.getElementById('other-profile-posts-count').innerText = userPosts.length;
    document.getElementById('other-profile-friends-count').innerText = Math.floor(Math.random() * 200) + 50;

    const postsContainer = document.getElementById('other-posts-container');
    if (userPosts.length === 0) {
        postsContainer.innerHTML = `<p class="text-on-surface-variant text-center py-8">No posts yet.</p>`;
    } else {
        postsContainer.innerHTML = userPosts.map(post => createPostHTML(post)).join('');
    }

    const isFriend = state.friends.includes(userId);
    let actionHtml = '';
    if (isFriend) {
        actionHtml = `<button class="px-6 py-2 bg-surface-container-high text-on-surface rounded-full font-bold shadow-sm cursor-default text-sm">Connected</button>
                      <button onclick="openChat('${user.id}')" class="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-1"><span class="material-symbols-outlined text-sm">chat</span> Message</button>`;
    } else {
        actionHtml = `<button onclick="sendFriendRequest('${user.id}', this)" class="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm">Add Friend</button>
                      <button onclick="openChat('${user.id}')" class="px-6 py-2 bg-secondary text-white rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-1"><span class="material-symbols-outlined text-sm">chat</span> Message</button>`;
    }
    document.getElementById('other-profile-actions').innerHTML = actionHtml;
}

function closePublicProfile() { } // Stub for compatibility

// --- Messages View Logic ---
function renderMessagesViewList(query = '') {
    const container = document.getElementById('messages-contact-list');
    container.innerHTML = '';

    // Get unique users from chat history or fallback to friends if empty
    let chatUserIds = Object.keys(state.chatHistory);
    if (chatUserIds.length === 0) chatUserIds = state.friends.slice(0, 5); // Just show some friends initially

    let users = chatUserIds.map(id => MOCK_USERS.find(u => u.id === id)).filter(Boolean);

    if (query) {
        users = users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()));
    }

    container.innerHTML = users.map(user => {
        const history = state.chatHistory[user.id] || [];
        const lastMsg = history.length > 0 ? history[history.length - 1].text : 'Start chatting...';
        const isMe = history.length > 0 && history[history.length - 1].sender === 'me';

        return `<div class="p-3 hover:bg-white dark:hover:bg-slate-700/50 rounded-2xl cursor-pointer transition-all flex gap-3 items-center border border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm" onclick="openMessagesViewChat('${user.id}')">
            <div class="relative">
                <img src="${user.pic}" class="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-[0_2px_5px_rgba(0,0,0,0.05)]">
                <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm"></div>
            </div>
            <div class="flex-1 overflow-hidden">
                <h4 class="font-bold text-[14px] text-slate-800 dark:text-slate-200 truncate">${user.name}</h4>
                <p class="text-[12px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">${isMe ? 'You: ' : ''}${lastMsg}</p>
            </div>
            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Now</div>
        </div>`;
    }).join('');
}

function handleMessagesSearch() {
    const query = document.getElementById('messages-search-input').value;
    renderMessagesViewList(query);
}

function refreshMessagesList() {
    const btn = document.querySelector('[title="Refresh"] span');
    if (btn) {
        btn.classList.add('animate-spin');
        setTimeout(() => btn.classList.remove('animate-spin'), 500);
    }

    // Shuffle friends artificially for demonstration
    state.friends.sort(() => Math.random() - 0.5);

    document.getElementById('messages-search-input').value = '';
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

function openMessagesViewChat(userId) {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) return;

    state.activeMessagesUserId = userId;

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

function renderMessagesViewBody() {
    const container = document.getElementById('messages-active-body');
    const history = state.chatHistory[state.activeMessagesUserId] || [];

    if (history.length === 0) {
        const user = MOCK_USERS.find(u => u.id === state.activeMessagesUserId);
        container.innerHTML = `<div class="text-center w-full my-auto flex flex-col items-center justify-center opacity-70">
            <img src="${user.pic}" class="w-20 h-20 rounded-full object-cover mb-4 shadow-sm border border-slate-200">
            <h4 class="font-bold text-lg text-slate-800 dark:text-slate-200">${user.name}</h4>
            <p class="text-xs text-slate-500 mt-1">Say hi to start the conversation!</p>
        </div>`;
        return;
    }

    container.innerHTML = history.map(msg => {
        const isMe = msg.sender === 'me';
        if (isMe) {
            return `<div class="flex justify-end mb-2 slide-in-bottom">
                <div class="bg-gradient-to-br from-primary to-orange-500 text-white max-w-[75%] rounded-[20px] rounded-br-[4px] px-5 py-2.5 text-[14px] font-medium shadow-[0_4px_10px_rgba(243,109,33,0.2)] tracking-wide leading-relaxed">
                    ${msg.text}
                </div>
            </div>`;
        } else {
            const user = MOCK_USERS.find(u => u.id === state.activeMessagesUserId);
            return `<div class="flex justify-start mb-2 gap-3 slide-in-bottom">
                <img src="${user.pic}" class="w-8 h-8 rounded-full object-cover mt-auto border-2 border-white dark:border-slate-800 shadow-sm">
                <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 max-w-[75%] rounded-[20px] rounded-bl-[4px] px-5 py-2.5 text-[14px] font-medium shadow-[0_4px_10px_rgba(0,0,0,0.02)] tracking-wide leading-relaxed">
                    ${msg.text}
                </div>
            </div>`;
        }
    }).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
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

function sendMessagesViewMessage() {
    const input = document.getElementById('messages-input-field');
    const text = input.value.trim();
    if (!text || !state.activeMessagesUserId) return;

    if (!state.chatHistory[state.activeMessagesUserId]) {
        state.chatHistory[state.activeMessagesUserId] = [];
    }

    state.chatHistory[state.activeMessagesUserId].push({ sender: 'me', text: text });
    input.value = "";

    renderMessagesViewBody();
    renderMessagesViewList(); // update sidebar latest msg

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

// --- Chat Logic ---
function openChat(userId) {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) return;

    state.activeChatUserId = userId;
    document.getElementById('chat-user-pic').src = user.pic;
    document.getElementById('chat-user-name').innerText = user.name;

    const widget = document.getElementById('chat-widget');
    widget.classList.remove('hidden');
    setTimeout(() => {
        widget.classList.remove('scale-0');
        widget.classList.add('scale-100');
    }, 10);

    renderChatHistory();
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

function renderChatHistory() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = "";
    const history = state.chatHistory[state.activeChatUserId] || [];

    if (history.length === 0) {
        const user = MOCK_USERS.find(u => u.id === state.activeChatUserId);
        container.innerHTML = `<div class="text-center text-on-surface-variant text-xs mt-4">Start of conversation with ${user ? user.name.split(' ')[0] : 'user'}</div>`;
        return;
    }

    history.forEach(msg => {
        const isMe = msg.sender === 'me';
        const el = document.createElement('div');
        el.className = `max-w-[80%] rounded-2xl px-4 py-2 w-fit shadow-sm break-words ${isMe ? 'bg-primary text-white ml-auto rounded-tr-sm' : 'bg-surface-container-high text-on-surface mr-auto rounded-tl-sm'}`;
        el.innerText = msg.text;
        container.appendChild(el);
    });
    container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || !state.activeChatUserId) return;

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

function timeAgo(offset = 0) {
    const mins = [2, 5, 11, 18, 32, 47, 58];
    const hrs = [1, 2, 3, 5];
    const pick = v => v[Math.floor(Math.random() * v.length)];
    if (offset > 8) return `${pick(hrs)}h ago`;
    return `${pick(mins)}m ago`;
}

/* ── sendFriendRequest ──────────────────────────────── */
function sendFriendRequest(userId, btnElement) {
    if (btnElement) {
        btnElement.innerHTML = `<span class="material-symbols-outlined text-[15px]">schedule</span> Requested`;
        btnElement.classList.add('opacity-80', 'cursor-default');
        btnElement.classList.remove('bg-primary', 'hover:scale-105', 'active:scale-95');
        btnElement.onclick = null;
    }
    _scheduleMockAccept(userId);
}

/* ── Auto-accept simulation ──────────────────────────── */
function _scheduleMockAccept(userId) {
    if (_pendingAutoAccepts.has(userId)) return;
    _pendingAutoAccepts.add(userId);

    const delay = 4000 + Math.random() * 1000; // 4-5 seconds

    setTimeout(() => {
        const user = MOCK_USERS.find(u => u.id === userId);
        if (!user) return;

        // 1. Add as friend
        if (!state.friends.includes(userId)) {
            state.friends.push(userId);
        }
        // Remove from pending requests list if present
        state.friendRequests = state.friendRequests.filter(id => id !== userId);

        // 2. Push an "accepted" notification
        const notifId = Date.now();
        state.notifications.unshift({
            id: notifId,
            type: 'system',
            subtype: 'accepted',
            text: `${user.name} accepted your friend request! You are now connected. 🎉`,
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
        if (t === tab) {
            btn.classList.add('notif-tab-active');
            btn.classList.remove('text-slate-500', 'dark:text-slate-400',
                'hover:bg-slate-100', 'dark:hover:bg-slate-800', 'bg-orange-500', 'text-white');
        } else {
            btn.classList.remove('notif-tab-active', 'bg-orange-500', 'text-white');
            btn.classList.add('text-slate-500', 'hover:bg-slate-100');
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
                <span class="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl mb-3">notifications_off</span>
                <p class="text-sm font-bold text-slate-400 dark:text-slate-500">No notifications here</p>
                <p class="text-xs text-slate-400 dark:text-slate-600 mt-1">You're all caught up! 🎉</p>
            </div>`;
        return;
    }

    list.innerHTML = notifs.map((n, idx) => {
        const meta = getNotifMeta(n.type);
        const isNew = !n.read;
        const pic = n.pic || (n.fromId ? (MOCK_USERS.find(u => u.id === n.fromId) || {}).pic : null);
        const ts = n.ts || timeAgo(idx);

        // Avatar: user pic if available, else icon
        const avatarHtml = pic
            ? `<img src="${pic}" alt="" class="w-10 h-10 rounded-full object-cover border-2 ${isNew ? 'border-orange-200' : 'border-slate-100 dark:border-slate-700'} flex-shrink-0 shadow-sm"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
            : '';
        const iconFallback = `
            <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isNew ? 'bg-orange-100 dark:bg-orange-900/40' : 'bg-slate-100 dark:bg-slate-800'}" ${pic ? 'style="display:none"' : ''}>
                <span class="material-symbols-outlined text-[18px] ${isNew ? 'text-orange-500' : 'text-slate-400'}" style="font-variation-settings:'FILL' 1">${meta.icon}</span>
            </div>`;

        // Action buttons for incoming requests
        let actionHtml = '';
        if (n.type === 'request' && !n.read) {
            actionHtml = `
                <div class="flex gap-2 mt-2.5">
                    <button onclick="acceptRequest(${n.id}, '${n.fromId}')"
                        class="flex-1 py-1.5 bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-400 text-white text-[12px] font-bold rounded-xl shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">person_check</span> Accept
                    </button>
                    <button onclick="rejectRequest(${n.id})"
                        class="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 text-slate-500 dark:text-slate-400 text-[12px] font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1">
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
                    <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${isAccepted ? 'notif-dot-system' : meta.dot}"></span>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-[13px] ${isNew ? 'font-semibold text-slate-800 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-400'} leading-snug">${n.text}</p>
                    <p class="text-[11px] ${isNew ? 'text-orange-500 font-bold' : 'text-slate-400 dark:text-slate-500'} mt-1">${ts}</p>
                    ${actionHtml}
                </div>
                ${isNew ? `<span class="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-300 mt-1.5"></span>` : ''}
            </div>
        </div>`;
    }).join('');
}

/* ── Individual actions ─────────────────────────────── */
function markNotifRead(notifId) {
    const notif = state.notifications.find(n => n.id === notifId);
    if (notif) notif.read = true;
    updateNotificationsBadge();
    renderNotifications();
}

function acceptRequest(notifId, userId) {
    const notif = state.notifications.find(n => n.id === notifId);
    if (notif) notif.read = true;
    if (!state.friends.includes(userId)) state.friends.push(userId);
    state.friendRequests = state.friendRequests.filter(id => id !== userId);
    updateUI();
    updateNotificationsBadge();
    renderNotifications();
    if (activeTab === 'friends') renderFriendsView();
}

function rejectRequest(notifId) {
    const notif = state.notifications.find(n => n.id === notifId);
    if (notif) notif.read = true;
    updateNotificationsBadge();
    renderNotifications();
}

function markAllRead() {
    state.notifications.forEach(n => n.read = true);
    updateNotificationsBadge();
    renderNotifications();
}


// --- Profile Editing ---
function toggleEditProfile() {
    const form = document.getElementById('profile-edit-form');
    const display = document.getElementById('profile-display');

    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        display.classList.add('hidden');
        document.getElementById('edit-name').value = state.user.name;
        document.getElementById('edit-bio').value = state.user.bio;
    } else {
        form.classList.add('hidden');
        display.classList.remove('hidden');
    }
}

function saveProfile() {
    state.user.name = document.getElementById('edit-name').value;
    state.user.bio = document.getElementById('edit-bio').value;
    updateUI();
    toggleEditProfile();
}

function updateProfilePic(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            state.user.pic = e.target.result;
            updateUI();
            if (activeTab === 'home') renderFeed();
            if (activeTab === 'profile') renderUserPosts();
        }
        reader.readAsDataURL(file);
    }
}

// --- Form Event Listeners ---
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const idInput = document.getElementById('login-id').value.trim();

    let isValid = false;

    if (/^\d+$/.test(idInput)) {
        if (idInput.length === 10) {
            isValid = true;
        } else {
            alert("Numeric Student ID must be exactly 10 digits.");
            return;
        }
    } else {
        if (idInput.endsWith('uiu.ac.bd')) {
            isValid = true;
        } else {
            alert("Please enter a valid UIU Email ending with uiu.ac.bd or a 10-digit numeric ID.");
            return;
        }
    }

    if (isValid) {
        login({
            name: "Saimon Islam",
            id: /^\d+$/.test(idInput) ? idInput : "0112330140",
            dept: "CSE",
            batch: "Batch 233"
        });
    }
});

document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const id = document.getElementById('reg-id').value;
    const dept = document.getElementById('reg-dept').value;
    const batch = document.getElementById('reg-batch').value;
    const email = document.getElementById('reg-email').value;
    const picInput = document.getElementById('reg-pic');

    const completeRegistration = (picData) => {
        if (email.endsWith('uiu.ac.bd') && /^\d+$/.test(id) && /^\d{3}$/.test(batch)) {
            login({ name, id, dept, batch }, picData);
        } else {
            alert("Ensure all fields are correct. Use an email ending with uiu.ac.bd, a numeric Student ID, and a 3-digit batch code.");
        }
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

function logout() {
    if (confirm("Are you sure to log out?")) {
        state.user = null;
        const mainApp = document.getElementById('main-app');
        mainApp.classList.add('opacity-0');
        setTimeout(() => {
            mainApp.classList.add('hidden');
            const authView = document.getElementById('auth-view');
            authView.classList.remove('hidden');
            setTimeout(() => authView.classList.remove('opacity-0'), 50);
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

    // Use the 3 events explicitly created to match the right sidebar theme
    const sidebarEventIds = ['e10', 'e11', 'e12'];
    const events = MOCK_EVENTS.filter(e => sidebarEventIds.includes(e.id));

    container.innerHTML = events.map(event => {
        const dateColorClass = event.id === 'e10' ? 'text-primary' : (event.id === 'e11' ? 'text-orange-500' : 'text-blue-500');

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

    // Persist online status so it doesn't bounce around every re-render
    if (!MOCK_USERS[0].hasOwnProperty('online')) {
        MOCK_USERS.forEach(u => u.online = Math.random() > 0.35);
    }

    const users = [...MOCK_USERS].sort((a, b) => b.online - a.online);

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
                <p class="text-[10px] ${u.online ? 'text-green-500' : 'text-slate-400'}">${u.online ? 'Active now' : 'Offline'}</p>
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

function renderEventsGrid() {
    const container = document.getElementById('events-grid-container');
    if (!container) return;

    const monthMap = { 'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5, 'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11 };

    const sortedEvents = [...MOCK_EVENTS].sort((a, b) => {
        if (monthMap[a.month] !== monthMap[b.month]) {
            return monthMap[a.month] - monthMap[b.month];
        }
        return parseInt(a.date) - parseInt(b.date);
    });

    container.innerHTML = sortedEvents.map(event => `
        <div class="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group" onclick="openEventModal('${event.id}')">
            <div class="relative h-48 overflow-hidden">
                <img src="${event.img}" alt="${event.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-center shadow-sm">
                    <div class="text-primary font-black text-lg leading-none">${event.date}</div>
                    <div class="text-[10px] font-bold uppercase tracking-widest text-secondary mt-1">${event.month}</div>
                </div>
            </div>
            <div class="p-5 flex flex-col h-[200px]">
                <div class="flex items-start justify-between mb-2">
                    <h3 class="text-xl font-bold leading-tight flex-1 truncate">${event.title}</h3>
                </div>
                <div class="flex items-center gap-2 mb-4 text-sm text-on-surface-variant flex-shrink-0">
                    <span class="material-symbols-outlined text-[16px]">location_on</span>
                    <span class="truncate">${event.location}</span>
                </div>
                <p class="text-sm text-slate-600 mb-4 line-clamp-2 min-h-[40px] flex-shrink-0">${event.desc}</p>
                <div class="mt-auto">
                    ${event.interested === true ?
            '<button class="w-full bg-primary text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"><span class="material-symbols-outlined text-[18px]">check_circle</span> Going</button>' :
            (event.interested === false ?
                '<button class="w-full bg-red-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"><span class="material-symbols-outlined text-[18px]">cancel</span> Not going</button>' :
                '<button class="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold py-2 rounded-lg transition-colors">See Details</button>'
            )
        }
                </div>
            </div>
        </div>
    `).join('');
}

let activeEventId = null;

function openEventModal(eventId) {
    const event = MOCK_EVENTS.find(e => e.id === eventId);
    if (!event) return;

    activeEventId = eventId;

    document.getElementById('event-modal-img').src = event.img;
    document.getElementById('event-modal-day').innerText = event.date;
    document.getElementById('event-modal-month').innerText = event.month;
    document.getElementById('event-modal-title').innerText = event.title;
    document.getElementById('event-modal-location').innerText = event.location;
    document.getElementById('event-modal-description').innerText = event.desc;

    const btnInt = document.getElementById('btn-interested');
    const btnNotInt = document.getElementById('btn-not-interested');

    // Default / interested styling updates based on state
    if (event.interested === true) {
        btnInt.className = "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-primary text-white shadow-md transform scale-105 border border-primary";
        btnNotInt.className = "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-surface-container-high hover:bg-red-100 text-slate-400 hover:text-red-600 border border-transparent";
    } else if (event.interested === false) {
        btnInt.className = "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-transparent";
        btnNotInt.className = "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-red-500 text-white shadow-md transform scale-105 border border-red-500";
    } else {
        btnInt.className = "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-transparent";
        btnNotInt.className = "flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-surface-container-high hover:bg-red-100 text-slate-600 hover:text-red-600 border border-transparent";
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

function toggleEventInterest(isInterested) {
    if (!activeEventId) return;
    const event = MOCK_EVENTS.find(e => e.id === activeEventId);
    if (!event) return;

    if (event.interested === isInterested) {
        event.interested = null; // Unselect if clicked again
    } else {
        event.interested = isInterested;
    }

    renderEventsGrid();
    closeEventModal();
}

function renderPeopleYouMayKnow() {
    const container = document.getElementById('people-you-may-know');
    if (!container) return;

    // Show users not yet in our friends list (max 3)
    const suggestions = MOCK_USERS
        .filter(u => !state.friends.includes(u.id))
        .slice(0, 3);

    container.innerHTML = suggestions.map(u => `
        <div class="pymk-card">
            <img src="${u.pic}" class="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onclick="openPublicProfile('${u.id}')">
            <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:underline"
                    onclick="openPublicProfile('${u.id}')">${u.name}</p>
                <p class="text-[10px] text-slate-500">${u.role === 'Student' ? 'Batch ' + u.batch + ' · ' + u.dept : u.role + ' · ' + u.dept}</p>
                <button
                    onclick="handlePymkAdd('${u.id}', this)"
                    class="mt-1.5 px-3 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold rounded-full transition-colors flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">person_add</span> Add Friend
                </button>
            </div>
        </div>
    `).join('');
}

function handlePymkAdd(userId, btn) {
    btn.innerHTML = '<span class="material-symbols-outlined text-sm">schedule</span> Requested';
    btn.disabled = true;
    btn.classList.add('opacity-60', 'cursor-not-allowed');
    // Schedule mock auto-accept
    _scheduleMockAccept(userId);
    // Refresh after a short delay so friended users disappear from PYMK
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
    const reqCount = state.friendRequests.length;
    const badge = document.getElementById('requests-badge');
    if (badge) badge.textContent = reqCount;

    if (activeFriendsTab === 'all') {
        const friendsList = MOCK_USERS.filter(u => state.friends.includes(u.id));
        const grid = document.getElementById('friends-grid');
        const emptyState = document.getElementById('friends-empty');

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
                        <p class="text-[11px] text-slate-500 mb-4">${u.role === 'Student' ? u.role + ' · ' + u.dept + ' · Batch ' + u.batch : u.role + ' · ' + u.dept}</p>
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
        const recommendations = MOCK_USERS.filter(u => !state.friends.includes(u.id) && u.id !== state.user.id && !state.friendRequests.includes(u.id));
        const grid = document.getElementById('pymk-grid');

        grid.innerHTML = recommendations.map(u => `
            <div class="friend-card border border-surface-container-highest flex flex-col group">
                <div class="h-16 bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 relative">
                    <img src="${u.pic}" class="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-slate-900 absolute -bottom-8 left-1/2 -translate-x-1/2 cursor-pointer group-hover:scale-105 transition-transform" onclick="openPublicProfile('${u.id}')">
                </div>
                <div class="pt-10 pb-4 px-4 flex-1 flex flex-col items-center text-center">
                    <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100 cursor-pointer hover:underline truncate w-full" onclick="openPublicProfile('${u.id}')">${u.name}</h3>
                    <p class="text-[11px] text-slate-500 mb-4">${u.role === 'Student' ? u.dept + ' · Batch ' + u.batch : u.role + ' · ' + u.dept}</p>
                    <div class="mt-auto w-full">
                        <button onclick="handlePymkAdd('${u.id}', this)" class="w-full bg-primary hover:bg-primary/90 text-white py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"><span class="material-symbols-outlined text-[1rem]">person_add</span> Add Friend</button>
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

    const requesters = MOCK_USERS.filter(u => state.friendRequests.includes(u.id));
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

    // Mutual friends count (mock: random 1-8)
    const getMutuals = (id) => ((parseInt(id) * 3) % 9) + 1;

    grid.innerHTML = requesters.map(u => `
        <div id="req-card-${u.id}" class="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700/60 hover:shadow-md transition-all group flex flex-col">
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
                    ${u.role === 'Student' ? u.dept + ' · Batch ' + u.batch : u.role + ' · ' + u.dept}
                </p>
                <!-- Mutual friends -->
                <div class="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span class="material-symbols-outlined text-[14px] text-orange-400">group</span>
                    <span>${getMutuals(u.id)} mutual friends</span>
                </div>
                <!-- Action buttons -->
                <div class="mt-4 w-full flex flex-col gap-2">
                    <button onclick="acceptFriendRequest('${u.id}')" id="accept-btn-${u.id}"
                        class="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-orange-600 hover:to-orange-400 text-white py-2.5 rounded-xl font-bold text-sm shadow-md shadow-orange-200 dark:shadow-orange-900/30 hover:shadow-orange-300/50 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[17px]">person_check</span> Accept
                    </button>
                    <button onclick="rejectFriendRequest('${u.id}')" id="reject-btn-${u.id}"
                        class="w-full bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 hover:border-rose-200">
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

function acceptFriendRequest(userId) {
    const card = document.getElementById(`req-card-${userId}`);
    const acceptBtn = document.getElementById(`accept-btn-${userId}`);
    const rejectBtn = document.getElementById(`reject-btn-${userId}`);

    // Button loading state
    acceptBtn.disabled = true;
    acceptBtn.innerHTML = `<span class="material-symbols-outlined text-[17px] animate-spin">progress_activity</span> Accepting...`;

    setTimeout(() => {
        // Move from requests → friends
        state.friendRequests = state.friendRequests.filter(id => id !== userId);
        state.friends.push(userId);

        // Animate card out
        card.style.transition = 'all 0.4s ease';
        card.style.transform = 'scale(0.85)';
        card.style.opacity = '0';
        setTimeout(() => {
            card.remove();
            renderFriendRequestsPanel();
            showToast(`✅ Friend request accepted! You are now connected.`);
        }, 400);
    }, 600);
}

function rejectFriendRequest(userId) {
    const card = document.getElementById(`req-card-${userId}`);
    const rejectBtn = document.getElementById(`reject-btn-${userId}`);

    rejectBtn.disabled = true;
    rejectBtn.innerHTML = `<span class="material-symbols-outlined text-[17px]">close</span> Declining...`;

    setTimeout(() => {
        state.friendRequests = state.friendRequests.filter(id => id !== userId);

        card.style.transition = 'all 0.35s ease';
        card.style.transform = 'scale(0.85)';
        card.style.opacity = '0';
        setTimeout(() => {
            card.remove();
            renderFriendRequestsPanel();
            showToast(`Request declined.`);
        }, 350);
    }, 500);
}

function acceptAllRequests() {
    const ids = [...state.friendRequests];
    if (ids.length === 0) return;

    // Accept all at once
    ids.forEach(id => {
        state.friends.push(id);
    });
    state.friendRequests = [];

    // Animate all cards out
    ids.forEach(id => {
        const card = document.getElementById(`req-card-${id}`);
        if (card) {
            card.style.transition = 'all 0.35s ease';
            card.style.transform = 'scale(0.85)';
            card.style.opacity = '0';
        }
    });

    setTimeout(() => {
        renderFriendRequestsPanel();
        showToast(`🎉 You accepted ${ids.length} friend request${ids.length > 1 ? 's' : ''}!`);
    }, 400);
}

function removeFriend(userId, btn) {
    if (!confirm('Remove this friend?')) return;
    state.friends = state.friends.filter(id => id !== userId);
    renderFriendsView();
    showToast('Friend removed.');
}

// --- Communities View & Profile ---
function renderCommunitiesList() {
    const container = document.getElementById('communities-list-container');
    if (!container) return;

    container.innerHTML = MOCK_COMMUNITIES.map(c => {
        let btnStatus = `<button onclick="openCommunityProfile('${c.id}'); event.stopPropagation();" class="px-4 py-1.5 rounded-full text-xs font-bold border border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-sm">Join</button>`;
        if (state.joinedCommunities.includes(c.id)) {
            btnStatus = `<button class="px-4 py-1.5 rounded-full text-xs font-bold bg-primary text-white transition-all shadow-sm pointer-events-none">Joined</button>`;
        } else if (state.pendingCommunities.includes(c.id)) {
            btnStatus = `<button class="px-4 py-1.5 rounded-full text-xs font-bold bg-slate-200 text-slate-500 transition-all shadow-sm pointer-events-none">Pending...</button>`;
        }

        return `
        <div onclick="openCommunityProfile('${c.id}')" class="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4 group cursor-pointer hover:bg-surface-container-low transition-colors shadow-sm">
            <div class="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <img src="${c.pic}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1">
                <h4 class="font-bold text-sm">${c.name}</h4>
                <p class="text-xs text-on-surface-variant">${c.members} Members</p>
            </div>
            ${btnStatus}
        </div>
        `;
    }).join('');
}

function openCommunityProfile(communityId) {
    const community = MOCK_COMMUNITIES.find(c => c.id === communityId);
    if (!community) return;

    activeCommunityId = communityId;
    switchTab('community-profile');

    // Populate Headers
    document.getElementById('community-profile-pic').src = community.pic;
    document.getElementById('community-nav-pic').src = community.pic;
    document.getElementById('community-profile-name').innerText = community.name;
    document.getElementById('community-profile-members').innerText = community.members;
    document.getElementById('community-profile-cover').style.backgroundImage = `url(${community.cover})`;

    const btn = document.getElementById('community-join-btn');
    if (state.joinedCommunities.includes(communityId)) {
        btn.innerText = "Joined";
        btn.className = "px-8 py-2 rounded-xl text-sm font-bold bg-primary text-white shadow-sm pointer-events-none";
        btn.onclick = null;
    } else if (state.pendingCommunities.includes(communityId)) {
        btn.innerText = "Pending...";
        btn.className = "px-8 py-2 rounded-xl text-sm font-bold bg-slate-200 text-slate-500 shadow-sm pointer-events-none";
        btn.onclick = null;
    } else {
        btn.innerText = "Join";
        btn.className = "px-8 py-2 rounded-xl text-sm font-bold border border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-sm";
        btn.onclick = () => handleJoinCommunity(communityId);
    }

    renderCommunityFeed(communityId);
}

function handleJoinCommunity(communityId) {
    const btn = document.getElementById('community-join-btn');
    btn.innerText = "Pending...";
    btn.className = "px-8 py-2 rounded-xl text-sm font-bold bg-slate-200 text-slate-500 shadow-sm pointer-events-none";
    state.pendingCommunities.push(communityId);

    // Re-render feed instantly to show pending status
    renderCommunityFeed(communityId);
    renderCommunitiesList(); // Update the main list page if navigated back

    // After 5s delay, convert to Joined
    setTimeout(() => {
        state.pendingCommunities = state.pendingCommunities.filter(id => id !== communityId);
        state.joinedCommunities.push(communityId);

        if (activeCommunityId === communityId) {
            btn.innerText = "Joined";
            btn.className = "px-8 py-2 rounded-xl text-sm font-bold bg-primary text-white shadow-sm pointer-events-none";
            renderCommunityFeed(communityId);
        }
    }, 5000);
}

function renderCommunityFeed(communityId) {
    const container = document.getElementById('community-feed-container');
    const warning = document.getElementById('community-locked-warning');
    const isJoined = state.joinedCommunities.includes(communityId);

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

    const posts = MOCK_COMMUNITY_POSTS[communityId] || [];

    container.innerHTML = posts.map(post => {
        const author = getUserDetails(post.userId);

        // Feed interaction locking logic depending on isJoined
        let heartIcon = post.liked ? 'favorite' : 'favorite_border';
        let heartAction = isJoined ? `onclick="toggleCommunityLike('${communityId}', '${post.id}', this)"` : '';
        let heartClass = post.liked ? 'text-red-500 material-symbols-outlined' : 'text-on-surface hover:text-red-500 material-symbols-outlined';
        let heartFill = post.liked ? '1' : '0';

        const opacityLock = isJoined ? '' : 'opacity-50 pointer-events-none';

        // Show comments logic
        const commentsHtml = (post.showComments && post.commentsList) ? `
            <div class="mt-4 pt-4 border-t border-slate-100 space-y-3">
                ${post.commentsList.map(c => `
                    <div class="flex gap-2">
                        <img src="${getUserDetails(c.userId).pic}" class="w-7 h-7 rounded-full object-cover">
                        <div class="bg-slate-50 p-2 rounded-xl flex-1">
                            <p class="text-[11px] font-bold">${c.name}</p>
                            <p class="text-xs text-slate-700">${c.text}</p>
                        </div>
                    </div>
                `).join('')}
                <div class="flex gap-2 mt-2">
                    <img src="${state.user.pic}" class="w-7 h-7 rounded-full object-cover">
                    <div class="flex-1 relative">
                        <input type="text" placeholder="Write a comment..." 
                            onkeydown="if(event.key==='Enter') addCommunityComment('${communityId}', '${post.id}', this.value)"
                            class="w-full bg-slate-100 border-none rounded-full px-4 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none">
                    </div>
                </div>
            </div>
        ` : '';

        return `
        <div class="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-slate-100 flex gap-4">
            <img src="${author.pic}" class="w-12 h-12 rounded-full object-cover">
            <div class="flex-1">
                <div class="flex items-start justify-between">
                    <div>
                        <h4 class="font-bold text-sm">${author.name} <span class="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded ml-1 font-bold">${post.communityRole}</span></h4>
                        <p class="text-[11px] text-slate-500 font-medium">${post.timestamp}</p>
                    </div>
                </div>
                <p class="text-sm mt-3 text-slate-800 leading-relaxed font-medium">${post.text}</p>
                ${post.image ? `<img src="${post.image}" class="mt-3 rounded-xl w-full h-auto object-cover border border-slate-100 max-h-80 shadow-sm">` : ''}
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

function submitCommunityPost() {
    const input = document.getElementById('community-post-input');
    if (!input || !activeCommunityId) return;
    const text = input.value.trim();
    if (!text && !uploadedImageBase64) return;

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
    if (!state.joinedCommunities.includes(communityId)) return;
    const posts = MOCK_COMMUNITY_POSTS[communityId];
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    post.showComments = !post.showComments;
    renderCommunityFeed(communityId);
}

function addCommunityComment(communityId, postId, text) {
    if (!text.trim()) return;
    const posts = MOCK_COMMUNITY_POSTS[communityId];
    const post = posts.find(p => p.id === postId);
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

function handleCommunityShare(communityId, postId) {
    if (!state.joinedCommunities.includes(communityId)) return;
    if (confirm("Do you want to share this post to your newsfeed?")) {
        const community = MOCK_COMMUNITIES.find(c => c.id === communityId);
        const posts = MOCK_COMMUNITY_POSTS[communityId];
        const sharedPost = posts.find(p => p.id === postId);
        if (!sharedPost) return;
        const originalAuthor = getUserDetails(sharedPost.userId);

        const newPost = {
            id: Date.now(),
            userId: state.user.id,
            text: `[Shared from ${community.name}]\n\nOriginal post by ${originalAuthor.name}:\n${sharedPost.text}`,
            image: sharedPost.image,
            likes: 0,
            comments: 0,
            liked: false,
            commentsList: []
        };
        state.posts.unshift(newPost);
        if (state.user) state.user.postsCount++;
        showToast("Post shared to your timeline!");
    }
}

function toggleCommunityLike(communityId, postId, btn) {
    if (!state.joinedCommunities.includes(communityId)) return;
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

// --- Explore Popup Logic ---
window.openExplorePopup = function (config) {
    const modal = document.getElementById('explore-popup');
    const content = document.getElementById('explore-popup-content');
    const accent = document.getElementById('explore-popup-accent');
    const iconWrap = document.getElementById('explore-popup-icon-wrap');
    const icon = document.getElementById('explore-popup-icon');
    const title = document.getElementById('explore-popup-title');
    const subtitle = document.getElementById('explore-popup-subtitle');
    const body = document.getElementById('explore-popup-body');
    const footer = document.getElementById('explore-popup-footer');

    if (!modal) return;

    // Reset items
    title.innerText = config.title || 'Information';
    subtitle.innerText = config.subtitle || '';
    icon.innerText = config.icon || 'info';
    body.innerHTML = config.bodyHtml || '<p class="text-slate-600">No details available at the moment.</p>';

    // Default footer if none provided
    if (config.footerHtml) {
        footer.innerHTML = config.footerHtml;
    } else {
        footer.innerHTML = `<button onclick="closeExplorePopup()" class="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-sm hover:bg-slate-800 transition-colors">Close</button>`;
    }

    // Apply color theme (using Tailwind colors)
    const colorMap = {
        indigo: { accent: 'bg-indigo-600', iconBg: 'bg-indigo-50', iconText: 'text-indigo-600' },
        teal: { accent: 'bg-teal-600', iconBg: 'bg-teal-50', iconText: 'text-teal-600' },
        fuchsia: { accent: 'bg-fuchsia-600', iconBg: 'bg-fuchsia-100', iconText: 'text-fuchsia-600' },
        blue: { accent: 'bg-blue-600', iconBg: 'bg-blue-50', iconText: 'text-blue-600' },
        emerald: { accent: 'bg-emerald-600', iconBg: 'bg-emerald-50', iconText: 'text-emerald-600' },
        amber: { accent: 'bg-amber-600', iconBg: 'bg-amber-50', iconText: 'text-amber-600' },
        pink: { accent: 'bg-pink-600', iconBg: 'bg-pink-50', iconText: 'text-pink-600' },
        slate: { accent: 'bg-slate-600', iconBg: 'bg-slate-50', iconText: 'text-slate-600' }
    };

    const theme = colorMap[config.theme] || colorMap.indigo;
    accent.className = `h-1.5 w-full ${theme.accent}`;
    iconWrap.className = `w-12 h-12 rounded-xl ${theme.iconBg} ${theme.iconText} flex items-center justify-center shadow-sm`;

    // Show modal
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
    }, 10);
};

window.closeExplorePopup = function () {
    const modal = document.getElementById('explore-popup');
    const content = document.getElementById('explore-popup-content');
    if (!modal) return;
    modal.classList.add('opacity-0');
    content.classList.remove('scale-100');
    content.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
};

window.scrollSlider = function (sliderId, direction) {
    const slider = document.getElementById(sliderId);
    if (!slider) return;
    const scrollAmount = 300;
    slider.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
    });
};

window.postQuestion = function () {
    const subjectInput = document.getElementById('qa-subject');
    const detailsInput = document.getElementById('qa-details');
    const list = document.getElementById('qa-forum-list');

    if (!subjectInput || !detailsInput || !list) return;

    const subject = subjectInput.value.trim();
    if (!subject) {
        showToast("Please enter a subject!");
        return;
    }

    const newQuestionHtml = `
        <hr class="border-surface-container-highest">
        <div class="group cursor-pointer">
            <h4 class="font-semibold text-sm mb-2 text-slate-800 group-hover:text-primary transition-colors leading-snug">${subject}</h4>
            <div class="flex gap-1.5 mb-2">
                <span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-wider">New</span>
                <span class="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold uppercase tracking-wider">Recent</span>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-500">
                <span class="flex items-center gap-1 text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded"><span class="material-symbols-outlined text-[12px]">schedule</span> Pending</span>
                <span>0 answers</span>
            </div>
        </div>
    `;

    list.insertAdjacentHTML('beforeend', newQuestionHtml);

    closeExplorePopup();
    showToast("Question posted successfully!");
};

// --- Settings ---
function switchSettingsTab(tabId) {
    // Hide all panels
    document.querySelectorAll('.settings-panel').forEach(el => {
        el.classList.remove('block');
        el.classList.add('hidden');
    });
    // Show active panel
    const activePanel = document.getElementById(`settings-${tabId}-panel`);
    if (activePanel) {
        activePanel.classList.remove('hidden');
        activePanel.classList.add('block');
    }

    // Update button styles
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        if (btn.classList.contains(tabId)) {
            btn.classList.remove('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
            btn.classList.add('bg-primary', 'text-white');
        } else {
            btn.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
            btn.classList.remove('bg-primary', 'text-white');
        }
    });
}

function saveAccountSettings() {
    const newName = document.getElementById('settings-name-input').value.trim();
    const newBio = document.getElementById('settings-bio-input').value.trim();

    if (!newName) {
        if (typeof showToast === 'function') showToast("Name cannot be empty!");
        else alert("Name cannot be empty!");
        return;
    }

    state.user.name = newName;
    state.user.bio = newBio;

    updateUI();

    if (typeof showToast === 'function') showToast("Settings saved successfully!");
    else alert("Settings saved successfully!");
}

function toggleDarkMode(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
}

// Initialize theme on load
(function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';

    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.checked = isDark;
    }
})();
