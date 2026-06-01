// Integration with Node.js Backend

const getBackendHost = () => {
    const h = window.location.hostname;
    return (h === '' || h === '127.0.0.1') ? 'localhost' : h;
};
const BACKEND_DOMAIN = getBackendHost();
const API_BASE_URL = `http://${BACKEND_DOMAIN}:5000/api`;
let authToken = localStorage.getItem('ulink_token');
let socket = null;

function initSocket() {
    if (!authToken) return;
    if (socket) socket.disconnect();

    // Assumes io is globally available from the socket.io.js script tag
    socket = io(`http://${BACKEND_DOMAIN}:5000`, {
        auth: { token: authToken }
    });

    socket.on('connect', () => {
        console.log('Connected to real-time server');
    });

    socket.on('connect_error', (err) => {
        console.warn('Socket connection error:', err.message);
    });

    // FIX #14: Backend emits 'notification', not 'new_notification'
    socket.on('notification', (data) => {
        console.log('New notification:', data);
        state.notifications.unshift({
            id: Date.now(),
            type: data.type,
            text: data.message,
            read: false,
            fromId: data.senderId,
            timestamp: new Date().toISOString()
        });
        if (typeof updateNotificationsBadge === 'function') updateNotificationsBadge();
        if (typeof renderNotifications === 'function') renderNotifications();
    });

    // FIX #14: Backend emits 'friendRequest', not 'friend_request_received'
    socket.on('friendRequest', (data) => {
        console.log('Friend request received from:', data.senderId);
        fetchFriendsStateFromBackend();
    });

    // FIX #14: Backend emits 'friendAccept', not 'friend_request_accepted'
    socket.on('friendAccept', (data) => {
        console.log('Friend request accepted by:', data.acceptorId);
        fetchFriendsStateFromBackend();
    });

    // FIX #14: Backend emits 'receiveMessage', not 'receive_message'
    socket.on('receiveMessage', (msg) => {
        console.log('New message from:', msg.senderId);
        if (window.currentChatUserId === String(msg.senderId)) {
            const chatBox = document.getElementById('chat-messages');
            if (chatBox) {
                // FIX #13: Use msg.content instead of msg.text
                chatBox.innerHTML += `
                    <div class="flex justify-start mb-4">
                        <img src="${msg.senderPic || 'Asserts/default_avatar.png'}" class="w-8 h-8 rounded-full mr-2 object-cover">
                        <div class="bg-surface-container-highest text-on-surface px-4 py-2 rounded-2xl rounded-tl-sm max-w-[75%] shadow-sm text-sm">
                            ${msg.content}
                        </div>
                    </div>
                `;
                chatBox.scrollTop = chatBox.scrollHeight;
            }
            // FIX #14: Backend socket uses 'markAsRead', not 'mark_messages_read'
            socket.emit('markAsRead', { senderId: msg.senderId });
        } else {
            // Show a subtle notification instead of blocking alert
            if (typeof updateNotificationsBadge === 'function') updateNotificationsBadge();
            console.info(`New message from user ${msg.senderId}`);
        }
    });
}

async function initSession() {
    if (!authToken) return;
    try {
        // FIX #3: /auth/me now exists. Unwrap the { success, data } envelope.
        const res = await fetchWithAuth('/auth/me');
        if (res.ok) {
            const json = await res.json();
            const data = json.data; // unwrap envelope
            // Hook into existing app logic for login initialization
            if (typeof login === 'function') {
                login(data);
            } else {
                state.user = data;
            }
            initSocket();
            fetchPostsFromBackend();
            fetchFriendsStateFromBackend();
            fetchNotificationsFromBackend();
            renderContacts();
        } else {
            // Invalid token
            authToken = null;
            localStorage.removeItem('ulink_token');
        }
    } catch (err) {
        console.error("Session init failed:", err);
    }
}

// Automatically init session if token exists
if (authToken) {
    document.addEventListener('DOMContentLoaded', initSession);
}

// Utility to make auth requests
async function fetchWithAuth(url, options = {}) {
    const headers = options.headers || {};
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(API_BASE_URL + url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        // Token expired or invalid
        authToken = null;
        localStorage.removeItem('ulink_token');
        if (typeof logout === 'function') logout();
    }

    return response;
}

// 1. Override Authentication Forms
const initAuthForms = () => {
    // Override Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const newLoginForm = loginForm.cloneNode(true);
        loginForm.parentNode.replaceChild(newLoginForm, loginForm);

        newLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // FIX #1: The input is 'login-id' (email or studentId). We send it
            // as the 'email' field — the updated backend now accepts either.
            const loginId = document.getElementById('login-id').value.trim();
            const password = document.getElementById('login-pass').value;

            try {
                const res = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // FIX #1: Field name is 'email' (backend supports studentId lookup via same field)
                    body: JSON.stringify({ email: loginId, password })
                });
                const data = await res.json();

                if (res.ok) {
                    authToken = data.token;
                    localStorage.setItem('ulink_token', authToken);
                    initSocket();
                    // Hook back into the original login UI flow
                    if (typeof login === 'function') login(data.user);
                    fetchPostsFromBackend();
                    fetchFriendsStateFromBackend();
                    fetchNotificationsFromBackend();
                    renderContacts();
                } else {
                    alert('Login failed: ' + (data.error || 'Unknown error'));
                }
            } catch (err) {
                console.error(err);
                alert('Network error. Is the backend running on port 5000?');
            }
        });
    }

    // Override Register Form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        const newRegisterForm = registerForm.cloneNode(true);
        registerForm.parentNode.replaceChild(newRegisterForm, registerForm);

        newRegisterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // FIX #2: Map frontend field IDs to the correct backend field names
            const fullName = document.getElementById('reg-name').value;
            const studentId = document.getElementById('reg-id').value;
            const department = document.getElementById('reg-dept').value;
            const batch = document.getElementById('reg-batch').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-pass').value;

            try {
                const res = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // FIX #2: Correct field names matching backend schema
                    body: JSON.stringify({ fullName, studentId, department, batch, email, password })
                });
                const data = await res.json();

                if (res.ok) {
                    alert('Registration successful! You can now log in.');
                    if (typeof toggleAuth === 'function') toggleAuth(); // Switch to login view
                } else {
                    alert('Registration failed: ' + (data.error || 'Unknown error'));
                }
            } catch (err) {
                console.error(err);
                alert('Network error.');
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthForms);
} else {
    initAuthForms();
}

// 2. Override Logout
const originalLogout = window.logout;
window.logout = function() {
    authToken = null;
    localStorage.removeItem('ulink_token');
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    if (originalLogout) originalLogout();
};

// 3. Fetch Posts from Backend
async function fetchPostsFromBackend() {
    try {
        // FIX #8: Correct endpoint is /posts/feed, not /posts
        const res = await fetchWithAuth('/posts/feed');
        if (res.ok) {
            const json = await res.json();
            // FIX #8 + #9: Unwrap { success, count, data: [...] } envelope and fix field mapping
            const posts = json.data || [];
            state.posts = posts.map(p => ({
                // FIX #9: Backend uses 'author' object, '_id', 'content', 'likes' array
                id: p._id,
                userId: p.author?._id || p.author,
                text: p.content,
                image: p.mediaUrl || '',
                likes: p.likes ? p.likes.length : 0,
                comments: p.comments ? p.comments.length : 0,
                liked: state.user ? (p.likes || []).some(id => String(id) === String(state.user.id)) : false,
                commentsList: (p.comments || []).map(c => ({
                    userId: c.user?._id || c.user,
                    name: c.user?.fullName || '',
                    text: c.content
                })),
                // Author details from populate
                userName: p.author?.fullName || '',
                userPic: p.author?.profilePicture || '',
                userDept: p.author?.department || '',
                timestamp: p.createdAt
            }));
            if (typeof activeTab !== 'undefined') {
                if (activeTab === 'home' && typeof renderFeed === 'function') renderFeed();
                if (activeTab === 'profile' && typeof renderUserPosts === 'function') renderUserPosts();
            }
        }
    } catch (err) {
        console.error("Failed to fetch posts:", err);
    }
}

// 3.5 Fetch Notifications from Backend
window.fetchNotificationsFromBackend = async function() {
    try {
        const res = await fetchWithAuth('/notifications');
        if (res.ok) {
            // FIX #11: Unwrap { success, count, data: [...] } envelope
            const json = await res.json();
            state.notifications = (json.data || []).map(n => ({
                id: n._id,
                type: n.type,
                text: n.content,
                read: n.isRead,
                fromId: n.sender?._id || n.sender,
                fromName: n.sender?.fullName || '',
                fromPic: n.sender?.profilePicture || '',
                timestamp: n.createdAt
            }));
            if (typeof updateNotificationsBadge === 'function') updateNotificationsBadge();
            if (typeof renderNotifications === 'function') renderNotifications();
        }
    } catch (err) {
        console.error("Failed to fetch notifications:", err);
    }
};

// FIX #4: Changed method from POST to PUT to match backend route definition
window.markAllRead = async function() {
    try {
        const res = await fetchWithAuth('/notifications/read', { method: 'PUT' });
        if (res.ok) {
            state.notifications.forEach(n => n.read = true);
            if (typeof updateNotificationsBadge === 'function') updateNotificationsBadge();
            if (typeof renderNotifications === 'function') renderNotifications();
        }
    } catch (err) {
        console.error("Failed to mark notifications as read:", err);
    }
};

// 4. Override Post Creation
window.submitPost = async function(source = 'home') {
    const textId = source === 'home' ? 'post-text' : (source === 'profile' ? 'post-text-profile' : 'post-text');
    const textEl = document.getElementById(textId);
    if (!textEl) return;
    let text = textEl.value.trim();
    if (typeof selectedFeeling !== 'undefined') {
        const feeling = selectedFeeling[source];
        if (feeling) text = text ? `${text} — feeling ${feeling}` : `feeling ${feeling}`;
    }
    if (!text && !uploadedImageBase64) return;

    try {
        // Backend expects 'content', not 'text'
        const body = { content: text };
        if (uploadedImageBase64) body.mediaUrl = uploadedImageBase64;

        const res = await fetchWithAuth('/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            textEl.value = "";
            if (typeof removeImage === 'function') removeImage(source);
            if (typeof resetFeeling === 'function') resetFeeling(source);
            fetchPostsFromBackend();
        } else {
            const data = await res.json();
            alert('Failed to create post: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        console.error(err);
        alert('Network error.');
    }
};

// 5. Override Post HTML generation to use Backend author data
const originalCreatePostHTML = window.createPostHTML;
window.createPostHTML = function(post) {
    // If post has userName (from backend), use it. Otherwise fallback to mock
    let author;
    if (post.userName) {
        author = {
            id: post.userId,
            name: post.userName,
            pic: post.userPic,
            dept: post.userDept,
            role: "Student",
            batch: ""
        };
    } else {
        author = typeof getUserDetails === 'function' ? getUserDetails(post.userId) : { id: post.userId, name: 'Unknown', pic: '', dept: '' };
    }

    const fallbackImage = `https://picsum.photos/seed/fallback_${post.id}/800/500`;
    const imgHtml = post.image ? `<div class="overflow-hidden rounded-xl mt-4 border border-slate-200 dark:border-slate-700/60 shadow-sm transition-transform duration-500 hover:scale-[1.01]"><img src="${post.image}" onerror="this.onerror=null; this.src='${fallbackImage}';" class="w-full max-h-96 object-cover bg-slate-100 dark:bg-slate-800"></div>` : '';
    const likeIcon = post.liked ? 'favorite' : 'favorite_border';
    const likeClass = post.liked ? 'text-red-500' : 'text-slate-500';
    const likeFill = post.liked ? '1' : '0';

    const commentsHtml = post.commentsList ? post.commentsList.map(c => `
        <div class="bg-surface-container-high rounded-xl p-3 mb-2 border border-slate-100 dark:border-slate-800">
            <span class="font-extrabold text-xs mr-1 cursor-pointer hover:underline text-primary" onclick="openPublicProfile('${c.userId}')">${c.name || c.userId}</span>
            <span class="text-sm text-slate-700 dark:text-slate-300 font-medium">${c.text}</span>
        </div>`).join('') : "";

    const isMyPost = state.user && String(state.user.id) === String(post.userId);
    const deleteBtnHtml = isMyPost ? `
        <button onclick="deletePost('${post.id}')" class="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete Post">
            <span class="material-symbols-outlined text-xl">close</span>
        </button>
    ` : '';

    return `<div class="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-700/60 hover:shadow-2xl transition-all duration-300 mb-6 relative">
        ${deleteBtnHtml}
        <div class="flex gap-4 mb-4 cursor-pointer group w-fit" onclick="openPublicProfile('${author.id}')">
            <img src="${author.pic || 'Asserts/default_avatar.png'}" class="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-white dark:border-slate-700 group-hover:opacity-90 transition-all">
            <div class="flex flex-col justify-center">
                <h4 class="font-extrabold text-base leading-tight group-hover:underline text-slate-900 dark:text-slate-100">${author.name}</h4>
                <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors mt-0.5">${author.dept} <span class="mx-1">•</span> <span class="material-symbols-outlined text-[10px] inline-block align-middle">public</span></p>
            </div>
        </div>
        <p class="text-[15px] font-semibold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">${post.text}</p>
        ${imgHtml}

        <div class="flex items-center gap-6 mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <button class="flex items-center gap-2 group transition-all" onclick="toggleLike('${post.id}', '${typeof activeTab !== 'undefined' ? activeTab : 'home'}')">
                <div class="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                    <span class="material-symbols-outlined text-[24px] ${likeClass} group-active:scale-75 transition-transform" style="font-variation-settings: 'FILL' ${likeFill}">${likeIcon}</span>
                </div>
                <span class="font-bold text-[14px] ${likeClass}">${post.likes}</span>
            </button>
            <button class="flex items-center gap-2 group transition-all" onclick="toggleCommentSection('${post.id}')">
                <div class="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                    <span class="material-symbols-outlined text-[22px] text-slate-500 group-hover:text-blue-500">chat_bubble_outline</span>
                </div>
                <span class="font-bold text-[14px] text-slate-500 group-hover:text-blue-500">${post.comments}</span>
            </button>
        </div>

        <div id="comments-section-${post.id}" class="hidden mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <div class="max-h-60 overflow-y-auto pr-2 custom-scrollbar mb-4">
                ${commentsHtml}
            </div>
            <div class="flex gap-3 mt-3">
                <img src="${state.user?.pic || state.user?.profilePicture || 'Asserts/default_avatar.png'}" class="w-8 h-8 rounded-full object-cover">
                <div class="flex-1 flex bg-slate-50 dark:bg-slate-900/50 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:ring-2 ring-primary/20 transition-all">
                    <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." class="flex-1 bg-transparent border-none text-sm px-4 focus:ring-0 text-slate-800 dark:text-slate-200">
                    <button class="px-4 text-primary hover:bg-primary/10 font-bold text-sm transition-colors" onclick="addComment('${post.id}', '${typeof activeTab !== 'undefined' ? activeTab : 'home'}')">Post</button>
                </div>
            </div>
        </div>
    </div>`;
};

// 6. Override Like
// FIX #5: Changed method from POST to PUT to match backend route definition
window.toggleLike = async function(postId, source = 'home') {
    // If it's a mock post (like from community), handle it normally
    if (String(postId).startsWith('cp_') || String(postId).startsWith('nf_')) {
        console.log("Mock post liked");
        return;
    }

    try {
        const res = await fetchWithAuth(`/posts/${postId}/like`, { method: 'PUT' });
        if (res.ok) {
            fetchPostsFromBackend();
        }
    } catch (err) {
        console.error(err);
    }
};

// 7. Override Comment
window.addComment = async function(postId, source = 'home') {
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input || !input.value.trim()) return;

    try {
        const res = await fetchWithAuth(`/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Backend expects 'content', not 'text'
            body: JSON.stringify({ content: input.value.trim() })
        });

        if (res.ok) {
            fetchPostsFromBackend();
        }
    } catch (err) {
        console.error(err);
    }
};

window.toggleCommentSection = function(postId) {
    const section = document.getElementById(`comments-section-${postId}`);
    if (section) {
        section.classList.toggle('hidden');
    }
};

// FIX #10: openPublicProfile now uses correct endpoint /users/:id and unwraps response
window.openPublicProfile = async function(userId) {
    if (state.user && userId === String(state.user.id)) {
        if (typeof switchTab === 'function') switchTab('profile');
        return;
    }

    let user;
    try {
        const res = await fetchWithAuth(`/users/${userId}`);
        if (res.ok) {
            const json = await res.json();
            const data = json.data; // FIX #10: unwrap envelope
            user = {
                id: data.id || data._id,
                name: data.fullName,
                role: "Student",
                dept: data.department,
                batch: data.batch || "",
                pic: data.profilePicture || "Asserts/default_avatar.png",
                bio: data.bio || `Passionate student at United International University. Active in the digital quad.`
            };
        }
    } catch (err) {
        console.error("Error fetching user profile:", err);
    }

    // Fallback if not found in db (e.g. mock users)
    if (!user && typeof MOCK_USERS !== 'undefined') {
        user = MOCK_USERS.find(u => String(u.id) === String(userId));
    }

    if (!user) {
        user = { id: userId, name: "Unknown User", role: "Student", dept: "N/A", batch: "N/A", pic: "Asserts/default_avatar.png", bio: "No information available." };
    }

    const searchDropdown = document.getElementById('search-dropdown');
    const searchInput = document.getElementById('search-input');
    if (searchDropdown) searchDropdown.classList.add('hidden');
    if (searchInput) searchInput.value = "";

    if (typeof currentOtherUserId !== 'undefined') window.currentOtherUserId = userId;
    if (typeof switchTab === 'function') switchTab('other-profile');

    const nameEl = document.getElementById('other-profile-name');
    const bioEl = document.getElementById('other-profile-bio');
    const picEl = document.getElementById('other-profile-picture');
    const aboutEl = document.getElementById('other-profile-about');
    if (nameEl) nameEl.innerText = user.name;
    if (bioEl) bioEl.innerText = user.role === 'Student' ? `${user.dept} • Batch ${user.batch}` : `${user.role} • ${user.dept}`;
    if (picEl) picEl.src = user.pic;
    if (aboutEl) aboutEl.innerText = user.bio;

    const userPosts = state.posts.filter(p => String(p.userId) === String(userId));
    const postsCountEl = document.getElementById('other-profile-posts-count');
    const friendsCountEl = document.getElementById('other-profile-friends-count');
    if (postsCountEl) postsCountEl.innerText = userPosts.length;
    if (friendsCountEl) friendsCountEl.innerText = '—';

    const postsContainer = document.getElementById('other-posts-container');
    if (postsContainer) {
        postsContainer.innerHTML = userPosts.length === 0
            ? `<p class="text-on-surface-variant text-center py-8">No posts yet.</p>`
            : userPosts.map(post => window.createPostHTML(post)).join('');
    }

    // Set default action buttons while we check friendship status
    const actionsEl = document.getElementById('other-profile-actions');
    const isFriend = Array.isArray(state.friends) && state.friends.includes(String(userId));
    if (actionsEl) {
        actionsEl.innerHTML = isFriend
            ? `<button class="px-6 py-2 bg-surface-container-high text-on-surface rounded-full font-bold shadow-sm cursor-default text-sm">Connected</button>
               <button onclick="openChat('${user.id}')" class="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-1"><span class="material-symbols-outlined text-sm">chat</span> Message</button>`
            : `<button onclick="sendFriendRequest('${user.id}', this)" class="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm">Add Friend</button>
               <button onclick="openChat('${user.id}')" class="px-6 py-2 bg-secondary text-white rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-1"><span class="material-symbols-outlined text-sm">chat</span> Message</button>`;
    }

    // Fetch accurate friendship status from backend
    try {
        const statusRes = await fetchWithAuth(`/users/friends/status/${userId}`);
        if (statusRes.ok) {
            const { status } = await statusRes.json();
            if (!actionsEl) return;

            if (status === 'friends') {
                actionsEl.innerHTML = `
                    <button class="px-6 py-2 bg-surface-container-high text-on-surface rounded-full font-bold shadow-sm cursor-default text-sm">Connected</button>
                    <button onclick="openChat('${userId}')" class="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-1"><span class="material-symbols-outlined text-sm">chat</span> Message</button>`;
            } else if (status === 'sent') {
                actionsEl.innerHTML = `
                    <button class="px-6 py-2 bg-surface-container-high text-on-surface rounded-full font-bold shadow-sm opacity-50 cursor-not-allowed text-sm">Request Sent</button>
                    <button onclick="openChat('${userId}')" class="px-6 py-2 bg-secondary text-white rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-1"><span class="material-symbols-outlined text-sm">chat</span> Message</button>`;
            } else if (status === 'received') {
                actionsEl.innerHTML = `
                    <button onclick="acceptFriendRequest('${userId}')" class="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm">Accept Request</button>
                    <button onclick="openChat('${userId}')" class="px-6 py-2 bg-secondary text-white rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-1"><span class="material-symbols-outlined text-sm">chat</span> Message</button>`;
            } else {
                actionsEl.innerHTML = `
                    <button onclick="sendFriendRequest('${userId}', this)" class="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm">Add Friend</button>
                    <button onclick="openChat('${userId}')" class="px-6 py-2 bg-secondary text-white rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-1"><span class="material-symbols-outlined text-sm">chat</span> Message</button>`;
            }
        }
    } catch (err) {
        console.error('Failed to check friendship status:', err);
    }
};

// 8. Friend Request Logic — FIX #7: Use REST API instead of non-existent socket events
window.sendFriendRequest = async function(userId, btnElement) {
    if (btnElement) {
        btnElement.innerText = "Sending...";
        btnElement.disabled = true;
    }
    try {
        const res = await fetchWithAuth(`/users/friends/request/${userId}`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            if (btnElement) {
                btnElement.innerText = "Request Sent";
                btnElement.classList.add('opacity-50', 'cursor-not-allowed');
            }
        } else {
            if (btnElement) {
                btnElement.innerText = "Add Friend";
                btnElement.disabled = false;
            }
            alert(data.error || 'Failed to send request');
        }
    } catch (err) {
        console.error('sendFriendRequest failed:', err);
        if (btnElement) { btnElement.innerText = "Add Friend"; btnElement.disabled = false; }
    }
};

// FIX #7: acceptFriendRequest uses REST API
window.acceptFriendRequest = async function(userId) {
    const btn = document.getElementById(`accept-btn-${userId}`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined text-[17px] animate-spin">sync</span> Accepting...`;
    }
    try {
        const res = await fetchWithAuth(`/users/friends/accept/${userId}`, { method: 'POST' });
        if (res.ok) {
            // Remove the card from the UI
            const card = document.getElementById(`req-card-${userId}`);
            if (card) card.remove();
            fetchFriendsStateFromBackend();
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to accept request');
            if (btn) { btn.disabled = false; btn.innerHTML = `<span class="material-symbols-outlined text-[17px]">person_check</span> Accept`; }
        }
    } catch (err) {
        console.error('acceptFriendRequest failed:', err);
    }
};

// FIX #7: declineFriendRequest uses REST API
window.declineFriendRequest = async function(userId) {
    const btn = document.getElementById(`reject-btn-${userId}`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined text-[17px] animate-spin">sync</span> Declining...`;
    }
    try {
        const res = await fetchWithAuth(`/users/friends/decline/${userId}`, { method: 'POST' });
        if (res.ok) {
            const card = document.getElementById(`req-card-${userId}`);
            if (card) card.remove();
            fetchFriendsStateFromBackend();
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to decline request');
            if (btn) { btn.disabled = false; btn.innerHTML = `<span class="material-symbols-outlined text-[17px]">person_remove</span> Decline`; }
        }
    } catch (err) {
        console.error('declineFriendRequest failed:', err);
    }
};

// 9. Chat Logic
window.currentChatUserId = null;

window.openChat = async function(userId) {
    window.currentChatUserId = String(userId);

    try {
        // FIX #10: Correct endpoint + unwrap
        const res = await fetchWithAuth(`/users/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch user');
        const userJson = await res.json();
        const otherUser = userJson.data;

        if (typeof switchTab === 'function') switchTab('messages');

        const chatHeaderName = document.getElementById('chat-header-name');
        if (chatHeaderName) chatHeaderName.innerText = otherUser.fullName;

        const chatHeaderPic = document.getElementById('chat-header-pic');
        if (chatHeaderPic) chatHeaderPic.src = otherUser.profilePicture || 'Asserts/default_avatar.png';

        // Fetch chat history
        const historyRes = await fetchWithAuth(`/messages/${userId}`);
        const historyJson = await historyRes.json();
        // FIX #11: Unwrap response envelope
        const history = historyJson.data || [];

        const chatBox = document.getElementById('chat-messages');
        if (chatBox) {
            chatBox.innerHTML = '';

            history.forEach(msg => {
                const isMe = String(msg.senderId) === String(state.user?.id);
                if (isMe) {
                    chatBox.innerHTML += `
                        <div class="flex justify-end mb-4">
                            <div class="bg-primary text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[75%] shadow-sm text-sm">
                                ${msg.content}
                            </div>
                        </div>
                    `;
                } else {
                    chatBox.innerHTML += `
                        <div class="flex justify-start mb-4">
                            <img src="${otherUser.profilePicture || 'Asserts/default_avatar.png'}" class="w-8 h-8 rounded-full mr-2 object-cover">
                            <div class="bg-surface-container-highest text-on-surface px-4 py-2 rounded-2xl rounded-tl-sm max-w-[75%] shadow-sm text-sm">
                                ${msg.content}
                            </div>
                        </div>
                    `;
                }
            });
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        if (socket) {
            // FIX #14: Backend event is 'markAsRead' not 'mark_messages_read'
            socket.emit('markAsRead', { senderId: userId });
        }

    } catch (err) {
        console.error("Failed to open chat", err);
    }
};

window.sendMessage = function() {
    if (!socket || !window.currentChatUserId) return;

    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();

    // FIX #14: Backend socket event is 'sendMessage', not 'send_message'
    socket.emit('sendMessage', { receiverId: window.currentChatUserId, content: text });

    // Optimistically update UI
    const chatBox = document.getElementById('chat-messages');
    if (chatBox) {
        chatBox.innerHTML += `
            <div class="flex justify-end mb-4">
                <div class="bg-primary text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[75%] shadow-sm text-sm">
                    ${text}
                </div>
            </div>
        `;
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    input.value = '';
};

// Also attach event listener to chat input for "Enter" key
const initChatEvents = () => {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.sendMessage();
            }
        });
    }

    const chatSendBtn = document.getElementById('chat-send-btn');
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', window.sendMessage);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatEvents);
} else {
    initChatEvents();
}

window.sendMessagesViewMessage = window.sendMessage;

// 10. Fetch and render Real Friends from Backend
window.realFriendsData = [];
window.realFriendRequestsData = [];

// FIX #6: Correct endpoints /users/friends and /users/friends/requests + unwrap .data
window.fetchFriendsStateFromBackend = async function() {
    try {
        const [friendsRes, requestsRes] = await Promise.all([
            fetchWithAuth('/users/friends'),
            fetchWithAuth('/users/friends/requests')
        ]);
        if (friendsRes.ok) {
            const json = await friendsRes.json();
            // FIX #6: Unwrap .data envelope
            const friends = json.data || [];
            state.friends = friends.map(f => String(f.id || f._id));
            window.realFriendsData = friends;
        }
        if (requestsRes.ok) {
            const json = await requestsRes.json();
            // FIX #6: Unwrap .data envelope
            const reqs = json.data || [];
            state.friendRequests = reqs.map(r => String(r.id || r._id));
            window.realFriendRequestsData = reqs;
        }

        const reqCount = (state.friendRequests || []).length;
        const badge = document.getElementById('requests-badge');
        if (badge) badge.textContent = reqCount;

        const friendsCountBadge = document.getElementById('friends-count-badge');
        if (friendsCountBadge) friendsCountBadge.innerText = (state.friends || []).length;

        const profileFriendsCount = document.getElementById('profile-friends-count');
        if (profileFriendsCount) profileFriendsCount.innerText = (state.friends || []).length;

        if (typeof activeFriendsTab !== 'undefined' && typeof activeTab !== 'undefined' && activeTab === 'friends') {
            if (typeof renderFriendsView === 'function') renderFriendsView();
        }
    } catch (e) {
        console.error("Failed to fetch friends state:", e);
    }
};

window.renderFriendsView = function() {
    if (typeof activeFriendsTab === 'undefined') return;

    if (activeFriendsTab === 'all') {
        const grid = document.getElementById('friends-grid');
        const emptyState = document.getElementById('friends-empty');
        if (!grid) return;

        const friendsList = window.realFriendsData || [];

        if (friendsList.length === 0) {
            grid.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
        } else {
            if (emptyState) emptyState.classList.add('hidden');
            grid.innerHTML = friendsList.map(u => `
                <div class="friend-card border border-surface-container-highest flex flex-col group">
                    <div class="h-16 bg-gradient-to-r from-orange-400 to-rose-400 relative">
                        <img src="${u.profilePicture || u.pic || 'Asserts/default_avatar.png'}" class="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-slate-900 absolute -bottom-8 left-1/2 -translate-x-1/2 cursor-pointer group-hover:scale-105 transition-transform" onclick="openPublicProfile('${u.id || u._id}')">
                    </div>
                    <div class="pt-10 pb-4 px-4 flex-1 flex flex-col items-center text-center">
                        <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100 cursor-pointer hover:underline truncate w-full" onclick="openPublicProfile('${u.id || u._id}')">${u.fullName || u.name}</h3>
                        <p class="text-[11px] text-slate-500 mb-4">${u.department || u.dept || ''} ${u.batch ? '· Batch ' + u.batch : ''}</p>
                        <div class="mt-auto w-full flex gap-2">
                            <button onclick="openChat('${u.id || u._id}')" class="flex-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-1.5 rounded-lg text-xs font-bold transition-colors">Message</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } else if (activeFriendsTab === 'requests') {
        if (typeof window.renderFriendRequestsPanel === 'function') window.renderFriendRequestsPanel();
    } else {
        const grid = document.getElementById('pymk-grid');
        if (grid) grid.innerHTML = `<p class="text-center text-slate-500 col-span-3 py-10">People you may know is managed by the backend (coming soon).</p>`;
    }
};

window.renderFriendRequestsPanel = function() {
    const grid = document.getElementById('requests-grid');
    const empty = document.getElementById('requests-empty');
    const subtitle = document.getElementById('requests-subtitle');
    const acceptAllBtn = document.getElementById('accept-all-btn');
    if (!grid) return;

    const requesters = window.realFriendRequestsData || [];
    const count = requesters.length;

    if (subtitle) subtitle.textContent = count > 0 ? `${count} pending request${count > 1 ? 's' : ''}` : 'No pending requests';

    if (count === 0) {
        grid.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        if (acceptAllBtn) acceptAllBtn.classList.add('hidden');
        return;
    }

    if (empty) empty.classList.add('hidden');
    if (acceptAllBtn) acceptAllBtn.classList.remove('hidden');

    grid.innerHTML = requesters.map(u => `
        <div id="req-card-${u.id || u._id}" class="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700/60 hover:shadow-md transition-all group flex flex-col">
            <div class="h-20 bg-gradient-to-r from-orange-400 via-rose-400 to-pink-400 relative">
                <img src="${u.profilePicture || u.pic || 'Asserts/default_avatar.png'}" alt="${u.fullName || u.name}"
                    class="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-800 absolute -bottom-10 left-1/2 -translate-x-1/2 shadow-lg group-hover:scale-105 transition-transform cursor-pointer"
                    onclick="openPublicProfile('${u.id || u._id}')">
            </div>
            <div class="pt-12 pb-5 px-5 flex-1 flex flex-col items-center text-center">
                <h3 class="font-extrabold text-[15px] text-slate-800 dark:text-slate-100 cursor-pointer hover:text-primary transition-colors" onclick="openPublicProfile('${u.id || u._id}')">${u.fullName || u.name}</h3>
                <p class="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                    ${u.department || u.dept || ''} ${u.batch ? '· Batch ' + u.batch : ''}
                </p>
                <div class="mt-4 w-full flex flex-col gap-2">
                    <button onclick="acceptFriendRequest('${u.id || u._id}')" id="accept-btn-${u.id || u._id}"
                        class="w-full bg-gradient-to-r from-primary to-orange-500 text-white py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[17px]">person_check</span> Accept
                    </button>
                    <button onclick="declineFriendRequest('${u.id || u._id}')" id="reject-btn-${u.id || u._id}"
                        class="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[17px]">person_remove</span> Decline
                    </button>
                </div>
            </div>
        </div>
    `).join('');
};

// FIX #15: Contacts list — use correct field names from backend (_id, fullName, profilePicture)
window.renderContacts = async function() {
    const container = document.getElementById('contacts-list');
    if (!container) return;
    try {
        const res = await fetchWithAuth('/messages/contacts');
        if (res.ok) {
            // FIX #11: Unwrap response envelope
            const json = await res.json();
            const conversations = json.data || [];
            if (conversations.length === 0) {
                container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">No contacts yet.<br>Connect with friends to start chatting.</p>`;
                return;
            }
            container.innerHTML = conversations.map(u => `
                <div class="contact-row cursor-pointer flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl" onclick="openChat('${u._id}')">
                    <div class="relative flex-shrink-0">
                        <img src="${u.profilePic || 'Asserts/default_avatar.png'}" class="w-9 h-9 rounded-full object-cover border border-slate-200">
                        ${u.onlineStatus ? `<span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>` : ''}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">${u.name}</p>
                        <p class="text-[10px] text-slate-400 truncate">${u.onlineStatus ? 'Online' : 'Offline'}</p>
                    </div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error(err);
    }
};

// 11. User Search Integration
window.searchUsersFromBackend = async function(query) {
    if (!query || query.trim().length < 2) return [];
    try {
        const res = await fetchWithAuth(`/users/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
            const json = await res.json();
            // FIX #11: Unwrap .data envelope
            return json.data || [];
        }
    } catch (err) {
        console.error('Search failed:', err);
    }
    return [];
};

// Hook into search input if it exists
const initSearchIntegration = () => {
    const searchInput = document.getElementById('search-input');
    const searchDropdown = document.getElementById('search-dropdown');
    if (!searchInput || !searchDropdown) return;

    let searchTimeout = null;
    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        if (searchTimeout) clearTimeout(searchTimeout);

        if (query.length < 2) {
            searchDropdown.classList.add('hidden');
            return;
        }

        searchTimeout = setTimeout(async () => {
            const users = await searchUsersFromBackend(query);
            if (users.length === 0) {
                searchDropdown.innerHTML = `<div class="p-4 text-center text-slate-400 text-sm">No users found</div>`;
            } else {
                searchDropdown.innerHTML = users.map(u => `
                    <div class="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer rounded-xl transition-colors" onclick="openPublicProfile('${u.id || u._id}')">
                        <img src="${u.profilePicture || 'Asserts/default_avatar.png'}" class="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700">
                        <div>
                            <p class="font-bold text-sm text-slate-800 dark:text-slate-100">${u.fullName}</p>
                            <p class="text-xs text-slate-500">${u.department || ''} ${u.batch ? '· Batch ' + u.batch : ''}</p>
                        </div>
                    </div>
                `).join('');
            }
            searchDropdown.classList.remove('hidden');
        }, 300);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.classList.add('hidden');
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchIntegration);
} else {
    initSearchIntegration();
}

// 12. Profile Update
window.updateProfileOnBackend = async function(updates) {
    try {
        const res = await fetchWithAuth('/users/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (res.ok) {
            const json = await res.json();
            const updatedUser = json.data;
            if (state.user) {
                Object.assign(state.user, updatedUser);
            }
            return updatedUser;
        }
    } catch (err) {
        console.error('Profile update failed:', err);
    }
    return null;
};

// 13. Delete Post
window.deletePost = async function(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
        const res = await fetchWithAuth(`/posts/${postId}`, { method: 'DELETE' });
        if (res.ok) {
            fetchPostsFromBackend();
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to delete post');
        }
    } catch (err) {
        console.error('Delete failed:', err);
    }
};

// 14. Fetch Communities from Backend
window.fetchCommunitiesFromBackend = async function() {
    try {
        const res = await fetchWithAuth('/communities');
        if (res.ok) {
            const json = await res.json();
            const communities = json.data || json;
            state.communities = communities;
            return communities;
        }
    } catch (err) {
        console.error('Failed to fetch communities:', err);
    }
    return [];
};

window.joinCommunity = async function(communityId) {
    try {
        const res = await fetchWithAuth(`/communities/${communityId}/join`, { method: 'POST' });
        if (res.ok) {
            fetchCommunitiesFromBackend();
        }
    } catch (err) {
        console.error('Failed to join community:', err);
    }
};

window.leaveCommunity = async function(communityId) {
    try {
        const res = await fetchWithAuth(`/communities/${communityId}/leave`, { method: 'POST' });
        if (res.ok) {
            fetchCommunitiesFromBackend();
        }
    } catch (err) {
        console.error('Failed to leave community:', err);
    }
};

// 15. Fetch Events from Backend
window.fetchEventsFromBackend = async function() {
    try {
        const res = await fetchWithAuth('/events');
        if (res.ok) {
            const json = await res.json();
            const events = json.data || json;
            state.events = events;
            return events;
        }
    } catch (err) {
        console.error('Failed to fetch events:', err);
    }
    return [];
};

window.toggleEventInterest = async function(eventId) {
    try {
        const res = await fetchWithAuth(`/events/${eventId}/interest`, { method: 'POST' });
        if (res.ok) {
            fetchEventsFromBackend();
        }
    } catch (err) {
        console.error('Failed to toggle event interest:', err);
    }
};

// 16. Notification helper functions
window.acceptRequest = function(notifId, userId) {
    if (window.acceptFriendRequest) {
        window.acceptFriendRequest(userId);
    }
    if (state.notifications) {
        const notif = state.notifications.find(n => String(n.id) === String(notifId));
        if (notif) notif.read = true;
    }
    if (typeof updateNotificationsBadge === 'function') updateNotificationsBadge();
    if (typeof renderNotifications === 'function') renderNotifications();
};

window.rejectRequest = function(notifId, userId) {
    if (userId && window.declineFriendRequest) {
        window.declineFriendRequest(userId);
    }
    if (state.notifications) {
        const notif = state.notifications.find(n => String(n.id) === String(notifId));
        if (notif) notif.read = true;
    }
    if (typeof updateNotificationsBadge === 'function') updateNotificationsBadge();
    if (typeof renderNotifications === 'function') renderNotifications();
};
