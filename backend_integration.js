/**
 * U-Link Backend Integration
 *
 * Single place where the SPA talks to the PHP API. Everything here is built
 * around one rule: the session cookie is the only source of truth for "who am
 * I". The server never accepts a user id from the client, so the frontend must
 * not invent one either.
 *
 * Responsibilities:
 *   - ULinkAPI          typed wrappers over every api/*.php endpoint
 *   - ULink.data        the live stores the render functions read from
 *   - ActivityLogger    fire-and-forget audit trail
 *   - session bootstrap on load, plus the login/logout handoff
 *
 * Loading order matters: index.html pulls in utilities.js, ulink_script.js and
 * then this file, so `state`, `updateUI()` and friends already exist by the time
 * the DOMContentLoaded handler below runs.
 */

'use strict';

/* -------------------------------------------------------------------------- */
/* API client                                                                  */
/* -------------------------------------------------------------------------- */

// Absolute so it does not depend on the current document path.
const API_BASE = '/api';

/**
 * One JSON round trip. Never throws: transport problems come back as
 * `{ status: 'error', offline: true }` so callers can fall back to their
 * offline data instead of tearing down the page.
 *
 * `body` may be a plain object (sent as JSON) or a FormData instance. FormData
 * is sent untouched: only the browser can set the multipart Content-Type
 * correctly, because only it knows the boundary - setting the header here
 * produces a body the server cannot parse. Multipart is also the only sane way
 * to upload a file; base64 inside JSON costs a third in size and buffers the
 * bytes twice.
 */
async function apiRequest(path, { method = 'GET', body = null, query = null, signal = null } = {}) {
    const url = new URL(API_BASE + path, window.location.origin);
    if (query) {
        Object.entries(query).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                url.searchParams.set(key, value);
            }
        });
    }

    const options = {
        method,
        // Session cookies must ride along on every call.
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal
    };

    if (body instanceof FormData) {
        options.body = body;
    } else if (body !== null) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);

        // A download endpoint answers with bytes rather than JSON. Returning the
        // blob lets the caller build an object URL instead of navigating the
        // window away from the SPA.
        const type = (response.headers.get('Content-Type') || '').toLowerCase();
        if (!type.includes('application/json')) {
            if (!response.ok) {
                return {
                    status: 'error',
                    message: 'The server could not return that file (' + response.status + ').'
                };
            }

            return {
                status: 'success',
                blob: await response.blob(),
                filename: ulinkFilenameFromDisposition(response.headers.get('Content-Disposition'))
            };
        }

        const text = await response.text();

        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            data = { status: 'error', message: 'Malformed response from the server.' };
        }

        // A 401 means the session expired: let the shell drop back to the
        // login screen instead of rendering an empty feed.
        if (response.status === 401 && data.status === 'error') {
            ULink.sessionExpired();
        }

        return data;
    } catch (error) {
        // An aborted request is a user action, not a failure.
        if (error && error.name === 'AbortError') {
            return { status: 'error', aborted: true, message: 'Request cancelled.' };
        }

        return {
            status: 'error',
            offline: true,
            message: 'Could not reach the server. Is it running?',
            detail: String(error)
        };
    }
}

/**
 * Pull the filename out of a Content-Disposition header.
 *
 * RFC 5987 puts the real (UTF-8) name in filename*; the plain filename= is
 * ASCII-sanitised, so it is only the fallback. Returns null when neither is
 * present.
 */
function ulinkFilenameFromDisposition(header) {
    if (!header) {
        return null;
    }

    const utf8 = /filename\*\s*=\s*[^']*''([^;]+)/i.exec(header);
    if (utf8) {
        try {
            return decodeURIComponent(utf8[1].trim().replace(/^"|"$/g, ''));
        } catch (e) {
            // Malformed percent-encoding: fall through to the ASCII form.
        }
    }

    const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
    return plain ? plain[1].trim() : null;
}

const ULinkAPI = {
    /* auth ---------------------------------------------------------------- */
    login: (email, password) => apiRequest('/auth/login.php', { method: 'POST', body: { email, password } }),
    register: (payload) => apiRequest('/auth/register.php', { method: 'POST', body: payload }),
    logout: () => apiRequest('/auth/logout.php', { method: 'POST' }),
    session: () => apiRequest('/auth/session.php'),
    bootstrap: () => apiRequest('/bootstrap.php'),

    /* posts --------------------------------------------------------------- */
    fetchPosts: (params = {}) => apiRequest('/posts/fetch.php', { query: params }),
    createPost: (payload) => apiRequest('/posts/create.php', { method: 'POST', body: payload }),
    likePost: (postId) => apiRequest('/posts/like.php', { method: 'POST', body: { postId } }),
    commentPost: (postId, text) => apiRequest('/posts/comment.php', { method: 'POST', body: { postId, text } }),
    deletePost: (postId) => apiRequest('/posts/delete.php', { method: 'POST', body: { postId } }),
    editPost: (postId, text) => apiRequest('/posts/edit.php', { method: 'POST', body: { postId, text } }),
    savePost: (postId) => apiRequest('/posts/save.php', { method: 'POST', body: { postId } }),
    reportPost: (postId, reason, details) =>
        apiRequest('/posts/report.php', { method: 'POST', body: { postId, reason, details } }),
    savedPosts: () => apiRequest('/posts/fetch.php', { query: { scope: 'saved' } }),

    /* users --------------------------------------------------------------- */
    profile: (userId) => apiRequest('/users/profile.php', { query: userId ? { id: userId } : {} }),
    updateProfile: (payload) => apiRequest('/users/update.php', { method: 'POST', body: payload }),
    searchUsers: (query, limit = 10) => apiRequest('/users/search.php', { query: { q: query, limit } }),
    changePassword: (currentPassword, newPassword) =>
        apiRequest('/users/password.php', {
            method: 'POST',
            body: { current_password: currentPassword, new_password: newPassword }
        }),
    deactivateAccount: (password) =>
        apiRequest('/users/deactivate.php', { method: 'POST', body: { password } }),

    /* settings ------------------------------------------------------------ */
    settings: () => apiRequest('/settings/get.php'),
    updateSettings: (payload) => apiRequest('/settings/update.php', { method: 'POST', body: payload }),

    /* friends ------------------------------------------------------------- */
    friends: () => apiRequest('/friends/list.php'),
    suggestions: () => apiRequest('/friends/suggestions.php'),
    friendAction: (action, userId) =>
        apiRequest('/friends/action.php', { method: 'POST', body: { action, userId } }),

    /* notifications ------------------------------------------------------- */
    notifications: (tab = 'all') => apiRequest('/notifications/list.php', { query: { tab } }),
    markNotificationRead: (id) => apiRequest('/notifications/read.php', { method: 'POST', body: { id } }),
    markAllNotificationsRead: () => apiRequest('/notifications/read.php', { method: 'POST', body: { all: 1 } }),
    readNotifications: (payload = { all: true }) =>
        apiRequest('/notifications/read.php', { method: 'POST', body: payload }),

    /* communities --------------------------------------------------------- */
    communities: () => apiRequest('/communities/list.php'),
    community: (id, withFeed = false) =>
        apiRequest('/communities/detail.php', { query: { id, feed: withFeed ? 1 : 0 } }),
    communityAction: (action, communityId) =>
        apiRequest('/communities/action.php', { method: 'POST', body: { action, communityId } }),
    createCommunity: (payload) =>
        apiRequest('/communities/create.php', { method: 'POST', body: payload }),

    /* messages ------------------------------------------------------------ */
    conversations: () => apiRequest('/messages/conversations.php'),
    thread: (userId, markRead = true) =>
        apiRequest('/messages/fetch.php', { query: { userId, markRead: markRead ? 1 : 0 } }),

    /**
     * Send a message, optionally with a picture or document attached.
     *
     * `file` is a File from an <input type="file"> or a Blob. When it is null
     * this takes the plain JSON path, so the common case is unchanged.
     */
    sendMessage: (userId, text, file = null) => {
        if (!file) {
            return apiRequest('/messages/send.php', { method: 'POST', body: { userId, text } });
        }

        const form = new FormData();
        form.append('userId', String(userId));
        form.append('text', text || '');
        form.append('attachment', file, file.name || 'attachment');

        return apiRequest('/messages/send.php', { method: 'POST', body: form });
    },

    /**
     * Fetch an attachment as a blob. The bytes are released on this origin,
     * which is why images are not simply pointed at the endpoint URL: the
     * cookie has to ride along for the participant check to pass.
     *
     * Returns { status, blob, filename } or an error object.
     */
    getAttachment: (messageId, signal = null) =>
        apiRequest('/messages/attachment.php', { query: { id: messageId }, signal }),

    /* events -------------------------------------------------------------- */
    events: (scope = 'upcoming') => apiRequest('/events/list.php', { query: { scope } }),
    rsvp: (eventId, interested, action) =>
        apiRequest('/events/rsvp.php', { method: 'POST', body: { eventId, interested, action } }),
    createEvent: (payload) =>
        apiRequest('/events/create.php', { method: 'POST', body: payload }),

    /* explore hub --------------------------------------------------------- */
    explore: () => apiRequest('/explore.php'),

    /* activities ---------------------------------------------------------- */
    activities: (limit = 50) => apiRequest('/activities/get.php', { query: { limit } }),

    /* raw helper used by the search box ----------------------------------- */
    raw: apiRequest
};

/* -------------------------------------------------------------------------- */
/* Live data stores                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The events API sends `date` as a full Y-m-d string plus separate `day` and
 * `month` fields, while the cards read `date` as the day number and `month` as
 * an uppercase 3-letter label. Normalise to the shape the renderer wants.
 */
function normaliseEvent(event) {
    return {
        ...event,
        id: String(event.id),
        date: event.day || (event.date ? String(event.date).split('-')[2] : ''),
        month: (event.month || '').toUpperCase(),
        img: event.img || event.image || '',
        desc: event.desc || event.description || ''
    };
}

/**
 * `isLive` flips to true once a bootstrap call succeeds. Every render function
 * prefers the live store and only falls back to the bundled mock arrays while
 * `isLive` is false, so a stopped backend degrades instead of breaking.
 */
const ULink = {
    API: ULinkAPI,
    isLive: false,
    lastError: null,

    data: {
        user: null,
        friends: [],
        requests: [],
        sent: [],
        suggestions: [],
        notifications: [],
        communities: [],
        events: [],
        conversations: [],
        // Preferences from the settings endpoint / bootstrap payload.
        settings: null,
        // userId -> message array
        threads: {}
    },

    /** True when a response failed because the server could not be reached. */
    isOffline(result) {
        return !!(result && result.offline);
    },

    /** Copy the server's user object into the shape updateUI() expects. */
    applyUser(user) {
        if (!user) return null;

        // `dept`, `studentId` and `postsCount` are read by name in
        // updateUI(); without them the shell rendered the string "undefined".
        const shaped = {
            id: user.id,
            name: user.name || user.full_name || 'Student',
            full_name: user.full_name || user.name,
            email: user.email || null,
            studentId: user.studentId || user.student_id || null,
            dept: user.dept || user.department || '',
            department: user.department || user.dept || '',
            batch: user.batch || '',
            role: user.role || 'student',
            pic: user.pic || user.profile_pic || '',
            profile_pic: user.profile_pic || user.pic || '',
            cover_pic: user.cover_pic || null,
            bio: user.bio || '',
            headline: user.headline || '',
            location: user.location || '',
            website: user.website || '',
            interests: user.interests || '',
            joined: user.joined || user.created_at || null,
            postsCount: Number(user.postsCount ?? user.posts_count ?? 0),
            friendsCount: Number(user.friendsCount ?? user.friends_count ?? 0)
        };

        this.data.user = shaped;
        state.user = shaped;
        return shaped;
    },

    /** Pull the whole client state down in one request. */
    async hydrate() {
        const data = await this.API.bootstrap();

        if (data.status !== 'success') {
            this.lastError = data.message || 'Could not load your data.';
            return false;
        }

        this.isLive = true;
        this.lastError = null;

        this.applyUser(data.user);

        this.data.friends = data.friends || [];
        this.data.requests = data.requests || [];
        this.data.sent = data.sent || [];
        this.data.suggestions = data.suggestions || [];
        this.data.notifications = data.notifications || [];
        this.data.communities = data.communities || [];
        this.data.events = (data.events || []).map(normaliseEvent);
        this.data.counts = data.counts || {};
        this.data.settings = data.settings || null;

        // Apply appearance preferences (compact feed / reduce motion) before the
        // first feed render. ULinkSettings lives in ulink_script.js; the guard
        // keeps this safe if the load order ever changes.
        if (typeof ULinkSettings !== 'undefined') {
            ULinkSettings.apply(this.data.settings);
        }

        // Mirror the ids into the plain arrays the older render code reads so
        // `state.friends.includes(id)` keeps working.
        state.friends = this.data.friends.map(u => String(u.id));
        state.friendRequests = this.data.requests.map(u => String(u.id));
        state.notifications = this.data.notifications;
        state.joinedCommunities = this.data.communities.filter(c => c.joined).map(c => c.id);

        return true;
    },

    /** Refresh just the notifications, e.g. after posting or a friend action. */
    async refreshNotifications(tab = 'all') {
        const data = await this.API.notifications(tab);
        if (data.status === 'success') {
            this.data.notifications = data.notifications || [];
            if (tab === 'all') {
                state.notifications = this.data.notifications;
            }
        }
        return data;
    },

    /**
     * Re-read the friend graph.
     *
     * Needed after every friend action: accepting a request moves somebody
     * between `requests` and `friends`, and leaving that stale made the Friends
     * > Requests tab keep offering somebody who had already been accepted.
     */
    async refreshFriends() {
        const data = await this.API.friends();
        if (data.status !== 'success') {
            return data;
        }

        this.data.friends = data.friends || [];
        this.data.requests = data.requests || [];
        this.data.sent = data.sent || [];

        // The sidebar badges and the nav counters read from here.
        this.data.counts = Object.assign({}, this.data.counts, {
            friends: this.data.friends.length,
            requests: this.data.requests.length
        });

        if (state) {
            state.friends = this.data.friends.map(u => String(u.id));
            state.friendRequests = this.data.requests.map(u => String(u.id));
        }

        return data;
    },

    /**
     * Look a person up in whichever store holds them. Ids arrive as numbers from
     * the API and as strings from the bundled mocks, so every comparison goes
     * through String().
     */
    findUser(id) {
        const key = String(id);

        if (this.data.user && String(this.data.user.id) === key) {
            return this.data.user;
        }

        const pools = [
            this.data.friends,
            this.data.requests,
            this.data.sent,
            this.data.suggestions,
            this.data.conversations
        ];

        for (const pool of pools) {
            const hit = (pool || []).find(u => u && String(u.id) === key);
            if (hit) return hit;
        }

        // Community and event rows carry a pic and sometimes a name too.
        if (typeof state !== 'undefined' && Array.isArray(state.posts)) {
            const fromPost = state.posts.find(p => String(p.userId) === key);
            if (fromPost) {
                return { id: key, name: fromPost.name, pic: fromPost.pic };
            }
        }

        return MOCK_USERS.find(u => String(u.id) === key) || null;
    },

    /** Empty every store and drop back to the signed-out state. */
    reset() {
        this.isLive = false;
        this.lastError = null;

        Object.keys(this.data).forEach(key => {
            this.data[key] = Array.isArray(this.data[key]) ? [] : (key === 'threads' ? {} : null);
        });

        if (typeof state !== 'undefined' && state) {
            state.user = null;
            state.posts = [];
            state.chatHistory = {};
            state.friends = [];
            state.friendRequests = [];
            state.notifications = [];
            state.joinedCommunities = [];
            state.pendingCommunities = [];
            state.myPosts = [];
        }
    },

    /** Called by apiRequest when the server reports the session is gone. */
    sessionExpired() {
        if (!this._expiryHandled) {
            this._expiryHandled = true;
            console.warn('Session expired, returning to the sign-in screen.');
            this.isLive = false;
            if (typeof showToast === 'function') {
                showToast('Your session expired. Please sign in again.', 'error');
            }
        }
        setTimeout(() => { this._expiryHandled = false; }, 1000);
    }
};

/* -------------------------------------------------------------------------- */
/* Activity logger                                                             */
/* -------------------------------------------------------------------------- */

// Never blocks the UI: every call is fire-and-forget and failures are swallowed.
class ActivityLogger {
    static async log(activity_type, details = {}) {
        try {
            if (!state.user || !state.user.id) return;

            await fetch(`${API_BASE}/activities/log.php`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                // No user_id: the server attributes the row to the session.
                body: JSON.stringify({ activity_type, details })
            }).catch(() => {});
        } catch (e) {
            /* telemetry must never break a feature */
        }
    }

    static logPageView(page) { return this.log('page_view', { page }); }
    static logLogin(email) { return this.log('user_login', { email }); }
    static logLogout() { return this.log('user_logout', {}); }
    static logProfileUpdated(changes) { return this.log('profile_updated', changes); }
    static logPostCreated(postId, contentLength) {
        return this.log('post_created', { post_id: postId, content_length: contentLength });
    }
    static logPostLiked(postId) { return this.log('post_liked', { post_id: postId }); }
    static logCommentAdded(postId, commentId, contentLength) {
        return this.log('comment_added', { post_id: postId, comment_id: commentId, content_length: contentLength });
    }
    static logFriendRequestSent(toUserId) { return this.log('friend_request_sent', { to_user_id: toUserId }); }
    static logMessageSent(toUserId, messageLength) {
        return this.log('message_sent', { to_user_id: toUserId, message_length: messageLength });
    }
}

/* -------------------------------------------------------------------------- */
/* Session bootstrap                                                            */
/* -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', async function () {
    // Theme first so there is no flash of the wrong palette.
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
    }

    const authView = document.getElementById('auth-view');
    const mainApp = document.getElementById('main-app');

    const showAuth = () => {
        if (authView) authView.classList.remove('hidden');
        if (mainApp) mainApp.classList.add('hidden');
    };

    const result = await ULinkAPI.session();

    if (result.status !== 'success' || !result.user) {
        ULink.isLive = false;
        showAuth();
        return;
    }

    // Seed state.user from the session so the first paint is correct even if the
    // heavier bootstrap call below fails.
    ULink.applyUser(result.user);

    const hydrated = await ULink.hydrate();
    if (!hydrated) {
        // Session is good but bootstrap failed: still let them in with what we
        // have, and let the render functions use their offline fallbacks.
        ULink.applyUser(result.user);
    }

    if (authView) authView.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');

    updateUI();
    loadHiddenPosts();
    switchTab('home');
    await renderFeed();
    await handlePostDeepLink();

    // Everything below is cosmetic; one failure must not abort the rest.
    try { updateNotificationsBadge(); } catch (e) {}
    try { renderRightSidebar(); } catch (e) {}

    ActivityLogger.logPageView('home');
});

/* -------------------------------------------------------------------------- */
/* Login / logout handoff                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The shell calls window.login(userData) straight after auth/login.php succeeds,
 * but userData is the *form* object (it holds the raw password and no user id),
 * which is why the old wrapper never logged a login. Prefer the server's answer
 * and fall back to the form data only if it is missing.
 */
const originalLogin = window.login;
window.login = function (userData, customPic = null) {
    const server = ULink.data.user;

    if (server && server.id) {
        originalLogin.call(window, { ...server, pic: customPic || server.pic });
        ActivityLogger.logLogin(server.email || '');
        return;
    }

    originalLogin.call(window, userData, customPic);
};

// logout() lives in ulink_script.js and now calls the API itself, so there is
// nothing to wrap here. Exposing the reference keeps window.logout intact for
// any inline onclick handler that calls it.
window.logout = typeof window.logout === 'function'
    ? window.logout
    : async () => { await ULinkAPI.logout(); ULink.reset(); };

/* -------------------------------------------------------------------------- */
/* Exports                                                                      */
/* -------------------------------------------------------------------------- */

window.ULink = ULink;
window.ULinkAPI = ULinkAPI;
window.apiRequest = apiRequest;
window.ActivityLogger = ActivityLogger;

// Kept for compatibility with any code that still asks for it.
window.SessionManager = {
    checkSession: async () => {
        const result = await ULinkAPI.session();
        return result.status === 'success' ? result.user : null;
    },
    getUser: async (userId) => {
        const result = await ULinkAPI.profile(userId);
        return result.status === 'success' ? result.user : null;
    }
};