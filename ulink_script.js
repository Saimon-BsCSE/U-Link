
//  U-Link – Application Script  (ulink_script.js)

// --- Mock Data & State ---
const MOCK_USERS = [
    { id: "101", name: "Sadika Rahman", dept: "CSE", role: "Student", batch: "211", pic: "https://ui-avatars.com/api/?name=Sadika+Rahman&background=random" },
    { id: "102", name: "Rakib Hasan", dept: "BBA", role: "Student", batch: "203", pic: "https://ui-avatars.com/api/?name=Rakib+Hasan&background=random" },
    { id: "103", name: "Nusrat Jahan", dept: "EEE", role: "Student", batch: "221", pic: "https://ui-avatars.com/api/?name=Nusrat+Jahan&background=random" },
    { id: "104", name: "Dr. Ahmed Kabir", dept: "CSE", role: "Faculty", batch: "N/A", pic: "https://ui-avatars.com/api/?name=Dr+Ahmed+Kabir&background=random" },
    { id: "105", name: "Jamal Uddin", dept: "Admin", role: "Staff", batch: "N/A", pic: "https://ui-avatars.com/api/?name=Jamal+Uddin&background=random" }
];

const state = {
    user: null,
    activeChatUserId: null,
    chatHistory: {},
    posts: [
        { id: 1, userId: "101", text: "Excited for the upcoming CSE Hackathon!", image: "", likes: 145, comments: 5, liked: false, commentsList: [{ id: 101, userId: "102", name: "Rakib Hasan", text: "Best of luck!" }, { id: 102, userId: "103", name: "Nusrat Jahan", text: "See you there!" }, { id: 105, userId: "105", name: "Jamal Uddin", text: "Make us proud!" }, { id: 106, userId: "104", name: "Dr. Ahmed Kabir", text: "Great initiative!" }, { id: 107, userId: "101", name: "Sarah Khan", text: "Let's go team!" }] },
        { id: 2, userId: "102", text: "Anyone have notes for FIN201? Midterm is coming up fast!", image: "", likes: 12, comments: 3, liked: false, commentsList: [{ id: 108, userId: "103", name: "Nusrat Jahan", text: "I have the chapter 3 & 4 summaries, ping me." }, { id: 109, userId: "102", name: "Rakib Hasan", text: "Check the master drive link pinned in our WhatsApp group." }, { id: 110, userId: "101", name: "Sadika Rahman", text: "Count me in if you find them!" }] },
        { id: 3, userId: "103", text: "Excited for the upcoming concert! Who else is going?", image: "", likes: 234, comments: 4, liked: false, commentsList: [{ id: 103, userId: "102", name: "Rakib Hasan", text: "It will be awesome!" }, { id: 111, userId: "101", name: "Sadika Rahman", text: "Already bought the tickets!" }, { id: 112, userId: "105", name: "Jamal Uddin", text: "Have a great time everyone!" }, { id: 113, userId: "103", name: "Nusrat Jahan", text: "Can't wait!" }] },
        { id: 4, userId: "101", text: "Sharing my Web programming notes. Feel free to use them! 📚", image: "", likes: 89, comments: 2, liked: false, commentsList: [{ id: 104, userId: "103", name: "Nusrat Jahan", text: "Thank you so much! Truly a life saver." }, { id: 114, userId: "102", name: "Rakib Hasan", text: "Appreciate it." }] },
        { id: 5, userId: "104", text: "Reminder: Data Structures makeup class is scheduled for tomorrow at 10 AM in room 405. Please be on time.", image: "", likes: 120, comments: 2, liked: false, commentsList: [{ id: 115, userId: "102", name: "Rakib Hasan", text: "Noted sir." }, { id: 116, userId: "103", name: "Nusrat Jahan", text: "Will be there!" }] },
        { id: 6, userId: "105", text: "Campus cafeteria will be closed this Friday for maintenance works. Please make alternate arrangements for lunch.", image: "", likes: 45, comments: 1, liked: false, commentsList: [{ id: 117, userId: "101", name: "Sadika Rahman", text: "Thanks for the heads up!" }] }
    ],
    notifications: [
        { id: 1, type: "like", text: "Sadika Rahman liked your post", read: false },
        { id: 2, type: "request", text: "Rakib Hasan sent you a friend request", read: false, fromId: "102" },
        { id: 3, type: "group", text: "CSE GROUP: New announcement posted regarding Hackathon finals.", read: false },
        { id: 4, type: "group", text: "HACKATHON GROUP: Registration closes tomorrow! Make sure you fill correctly.", read: false },
        { id: 5, type: "group", text: "CULTURAL GROUP: Annual fest meeting at 3 PM in Room 102.", read: false }
    ],
    friends: [] // IDs
};

let activeTab = 'home';
let currentOtherUserId = null;
let uploadedImageBase64 = "";

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

    // Profile view updates
    document.getElementById('profile-name').innerText = state.user.name;
    document.getElementById('profile-bio').innerText = state.user.bio;
    document.getElementById('profile-picture').src = state.user.pic;
    document.getElementById('post-user-pic').src = state.user.pic;
    const profilePicField = document.getElementById('post-user-pic-profile');
    if (profilePicField) profilePicField.src = state.user.pic;
    document.getElementById('profile-friends-count').innerText = state.friends.length;
    document.getElementById('profile-posts-count').innerText = state.user.postsCount;
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
    }
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
            const previewId = source === 'home' ? 'image-preview' : 'image-preview-profile';
            const containerId = source === 'home' ? 'image-preview-container' : 'image-preview-container-profile';

            document.getElementById(previewId).src = uploadedImageBase64;
            document.getElementById(containerId).classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }
}

function removeImage() {
    uploadedImageBase64 = "";
    document.getElementById('post-image-input').value = "";
    document.getElementById('image-preview-container').classList.add('hidden');

    if (document.getElementById('post-image-input-profile')) {
        document.getElementById('post-image-input-profile').value = "";
        document.getElementById('image-preview-container-profile').classList.add('hidden');
    }
}

function submitPost(source = 'home') {
    const textId = source === 'home' ? 'post-text' : 'post-text-profile';
    const text = document.getElementById(textId).value.trim();
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

    // Reset
    document.getElementById('post-text').value = "";
    if (document.getElementById('post-text-profile')) document.getElementById('post-text-profile').value = "";
    removeImage();

    if (activeTab === 'home') renderFeed();
    if (activeTab === 'profile') renderUserPosts();
    updateUI();
}

// --- Feed Rendering & Interaction ---
function getUserDetails(id) {
    if (id === state.user?.id) return state.user;
    return MOCK_USERS.find(u => u.id === id) || { name: "Unknown", dept: "N/A", role: "Unknown", batch: "N/A", pic: "" };
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
    const imgHtml = post.image ? `<img src="${post.image}" class="w-full mt-3 rounded-xl max-h-96 object-cover border border-surface-container-highest">` : '';
    const likeIcon = post.liked ? 'favorite' : 'favorite_border';
    const likeClass = post.liked ? 'text-red-500' : 'text-slate-500';
    const likeFill = post.liked ? '1' : '0';

    const commentsHtml = post.commentsList ? post.commentsList.map(c => `
        <div class="bg-surface-container-high rounded-lg p-2.5 mb-2">
            <span class="font-bold text-xs mr-1 cursor-pointer hover:underline text-primary" onclick="openPublicProfile('${c.userId || '101'}')">${c.name}</span>
            <span class="text-sm">${c.text}</span>
        </div>`).join('') : "";

    return `<div class="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container-highest/20 hover:shadow-md transition-shadow">
        <div class="flex gap-3 mb-3 cursor-pointer group w-fit" onclick="openPublicProfile('${author.id}')">
            <img src="${author.pic}" class="w-10 h-10 rounded-full object-cover border border-slate-100 group-hover:opacity-80 transition-opacity">
            <div>
                <h4 class="font-bold text-sm leading-tight group-hover:underline text-on-surface">${author.name}</h4>
                <p class="text-xs text-on-surface-variant group-hover:text-primary transition-colors">${author.role === 'Student' ? author.dept + ' • Batch ' + author.batch : author.role + ' • ' + author.dept}</p>
            </div>
        </div>
        <p class="text-sm font-medium leading-relaxed whitespace-pre-wrap">${post.text}</p>
        ${imgHtml}
        <div class="flex gap-6 mt-4 pt-4 border-t border-surface-container-highest/50">
            <button onclick="toggleLike(${post.id})" class="flex items-center gap-2 group">
                <div class="p-1.5 rounded-full group-hover:bg-red-50 transition-colors ${post.liked ? 'bg-red-50' : ''}">
                  <span class="material-symbols-outlined text-xl ${likeClass} transition-transform group-active:scale-75" style="font-variation-settings: 'FILL' ${likeFill};">${likeIcon}</span>
                </div>
                <span class="text-sm font-semibold ${likeClass}">${post.likes}</span>
            </button>
            <button onclick="toggleComments(${post.id})" class="flex items-center gap-2 text-slate-500 group">
                <div class="p-1.5 rounded-full group-hover:bg-blue-50 transition-colors">
                  <span class="material-symbols-outlined text-xl">chat_bubble_outline</span>
                </div>
                <span class="text-sm font-semibold">${post.comments}</span>
            </button>
        </div>
        <!-- Comments Section -->
        <div id="comments-${post.id}" class="hidden mt-4 pt-4 border-t border-surface-container-highest/30">
            <div class="max-h-40 overflow-y-auto mb-3 pr-1 hide-scrollbar">
                ${commentsHtml}
            </div>
            <div class="flex gap-2">
                <input type="text" id="comment-input-${post.id}" class="flex-1 bg-surface-container-high border-none rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="Write a comment...">
                <button onclick="submitComment(${post.id})" class="bg-primary text-white p-2 rounded-full w-9 h-9 flex items-center justify-center hover:bg-primary/90 transition-colors active:scale-95">
                    <span class="material-symbols-outlined text-sm">send</span>
                </button>
            </div>
        </div>
    </div>`;
}

function toggleLike(postId) {
    const post = state.posts.find(p => p.id === postId);
    if (post) {
        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;

        if (activeTab === 'home') renderFeed();
        if (activeTab === 'profile') renderUserPosts();
        if (activeTab === 'other-profile' && currentOtherUserId) openPublicProfile(currentOtherUserId);
    }
}

function toggleComments(postId) {
    const commentsDiv = document.getElementById(`comments-${postId}`);
    if (commentsDiv) {
        commentsDiv.classList.toggle('hidden');
    }
}

function submitComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;

    const post = state.posts.find(p => p.id === postId);
    if (post) {
        if (!post.commentsList) post.commentsList = [];
        post.commentsList.push({
            id: Date.now(),
            userId: state.user.id,
            name: state.user.name,
            text: text
        });
        post.comments = post.commentsList.length;
        input.value = "";
        if (activeTab === 'home') renderFeed();
        if (activeTab === 'profile') renderUserPosts();
        if (activeTab === 'other-profile' && currentOtherUserId) openPublicProfile(currentOtherUserId);

        // Keep comments open after rendering
        setTimeout(() => toggleComments(postId), 10);
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
    if (!e.target.closest('#notifications-panel') && !e.target.closest('[onclick="toggleNotifications()"]')) {
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
    let botReply = "That makes sense. Tell me more!";
    const lowerText = text.toLowerCase();

    if (lowerText.includes("hello") || lowerText.includes("hi ") || lowerText === "hi") {
        botReply = "Hi there! How's your day going?";
    } else if (lowerText.includes("how are you")) {
        botReply = "I'm doing well, just trying to focus on my assignments. You?";
    } else if (lowerText.includes("project") || lowerText.includes("assignment")) {
        botReply = "I'm still working on mine too. The deadline is pretty close!";
    } else if (lowerText.includes("bye")) {
        botReply = "Talk to you later! Bye!";
    } else if (lowerText.includes("thanks") || lowerText.includes("thank you")) {
        botReply = "You're very welcome!";
    } else if (lowerText.includes("notes")) {
        botReply = "I don't have the notes right now, but I can ask around and let you know.";
    } else if (lowerText.includes("love")) {
        botReply = "Are you sure? Actually I have the same feelings for you too!";
    }

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
function sendFriendRequest(userId, btnElement) {
    if (btnElement) {
        btnElement.innerText = "Requested";
        btnElement.classList.add("bg-surface-container-high", "text-on-surface", "cursor-default");
        btnElement.classList.remove("bg-primary", "text-white", "hover:scale-105", "active:scale-95");
        btnElement.onclick = null;
    } else {
        alert("Friend request sent!");
    }
}

function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        renderNotifications();
    }
}

function updateNotificationsBadge() {
    const unread = state.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    if (unread > 0) {
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function renderNotifications() {
    const list = document.getElementById('notifications-list');
    if (state.notifications.length === 0) {
        list.innerHTML = `<div class="p-4 text-center text-sm text-on-surface-variant">No notifications</div>`;
        return;
    }

    list.innerHTML = state.notifications.map(n => {
        const bg = n.read ? '' : 'bg-surface-container-low';
        let actionText = '';
        if (n.type === 'request' && !n.read) {
            actionText = `
            <div class="mt-2 flex gap-2">
                <button onclick="acceptRequest(${n.id}, '${n.fromId}')" class="px-3 py-1 bg-primary text-white text-xs font-bold rounded shadow hover:bg-primary/90">Accept</button>
                <button onclick="rejectRequest(${n.id})" class="px-3 py-1 bg-surface-container-high text-on-surface text-xs font-bold rounded hover:bg-surface-variant">Reject</button>
            </div>
        `;
        }
        return `
        <div class="p-3 border-b border-surface-container-highest hover:bg-surface-container-high transition-colors ${bg}">
            <p class="text-sm font-medium leading-tight">${n.text}</p>
            ${actionText}
        </div>
    `;
    }).join('');
}

function acceptRequest(notifId, userId) {
    const notif = state.notifications.find(n => n.id === notifId);
    if (notif) notif.read = true;
    if (!state.friends.includes(userId)) {
        state.friends.push(userId);
    }
    updateUI();
    updateNotificationsBadge();
    renderNotifications();
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
}

function renderContacts() {
    const container = document.getElementById('contacts-list');
    if (!container) return;

    // Give each user a random online status (persisted on the object)
    const users = MOCK_USERS.map(u => ({
        ...u,
        online: Math.random() > 0.35   // ~65 % chance online
    }));

    // Sort: online first
    users.sort((a, b) => b.online - a.online);

    container.innerHTML = users.map(u => `
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
                <p class="text-[10px] text-slate-500">${u.role} · ${u.dept}</p>
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
    sendFriendRequest(userId, null);
    btn.innerHTML = '<span class="material-symbols-outlined text-sm">check_circle</span> Requested';
    btn.disabled = true;
    btn.classList.add('opacity-60', 'cursor-not-allowed');
    // Refresh after a short delay so friended users disappear from PYMK
    setTimeout(() => renderPeopleYouMayKnow(), 1500);
}

