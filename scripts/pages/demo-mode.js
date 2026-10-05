/**
 * U-Link offline demo adapter
 *
 * Injected only by .github/workflows/pages.yml into the published GitHub Pages
 * build. It is never served by the PHP application: the workflow copies it to
 * _site/js/demo-mode.js, and the copy that runs on the real site is this file,
 * which the root .htaccess answers with 403 because it lives under scripts/.
 *
 * GitHub Pages serves static files only - it cannot run api/*.php and it has no
 * database. The SPA is written to survive that (`ULink.isLive` starts false and
 * every render function falls back to the bundled mock data), but two things stop
 * a Pages build from being usable, and this file supplies both.
 *
 * 1. There is no way in.
 *    backend_integration.js calls auth/session.php on load and shows the sign-in
 *    screen when it does not get a user. The login form posts to auth/login.php
 *    too, so a visitor would face a login form that can never succeed. So the
 *    session, login and logout calls are answered locally.
 *
 * 2. Two views render empty even though the app ships the data for them.
 *    - renderFeed() reads posts *only* from api/posts/fetch.php. It has no offline
 *      branch, and it assigns the result straight back to state.posts, so with no
 *      server it overwrites the seeded mock posts with an empty page. The
 *      profile list then reads the same emptied state and shows "No posts yet".
 *    - renderEventsGrid() picks its list with `ULink.data.events || MOCK_EVENTS`.
 *      ULink.data.events starts as [], and an empty array is truthy, so the || never
 *      reaches MOCK_EVENTS and Events shows "No upcoming events right now".
 *
 * Rather than invent content, this adapter hands back the app's own seeded data:
 * the posts that ship in state.posts and the MOCK_EVENTS array. Nothing new is
 * written, so the demo shows exactly the content the author wrote, and it is
 * replaced by the real API the moment one is present.
 *
 * isLive stays false on purpose. That is the flag every render function consults
 * before choosing live data over mocks, and leaving it false keeps the whole UI
 * on the demo path. The real application never loads this file.
 */
(function () {
    'use strict';

    var api = window.ULinkAPI;
    var store = window.ULink;

    // backend_integration.js has not run yet, so there is nothing to adapt.
    if (!api || !store || typeof state === 'undefined') {
        console.warn('[demo] ULinkAPI or state missing; the offline demo adapter did nothing.');
        return;
    }

    /* ------------------------------------------------------------------ seed */

    // state.posts ships with a set of fully-written demo posts (text, likes and a
    // commentsList each) and renderFeed is about to overwrite it, so take the
    // snapshot now, while it is still populated.
    var SEED_POSTS = clone(state.posts);

    // loadEvents() already assigns MOCK_EVENTS wholesale when offline, and
    // findEvent() falls back to the same array, so hand out shallow copies and
    // leave the shape alone. Note normaliseEvent() must NOT be used here: it
    // splits a Y-m-d string, and these rows carry a bare day number in `date`
    // plus a separate `month` label already.
    var SEED_EVENTS = (typeof MOCK_EVENTS !== 'undefined' ? MOCK_EVENTS : []).slice();

    // The demo persona is MOCK_USERS[0] from ulink_script.js, so the shell shows
    // an account that already appears in the seeded feed rather than a stranger.
    //
    // DEMO_USER_ID is separate because byDemoUser() below is called while the
    // DEMO_USER literal is still being evaluated - at that point DEMO_USER is
    // still undefined, so reading DEMO_USER.id would throw.
    var DEMO_USER_ID = '101';

    var DEMO_USER = {
        id: DEMO_USER_ID,
        name: 'Sadika Rahman',
        full_name: 'Sadika Rahman',
        email: 'sadika.rahman@uiu.ac.bd',
        studentId: '2110011',
        dept: 'CSE',
        department: 'Computer Science & Engineering',
        batch: '211',
        role: 'Student',
        pic: 'Asserts/sadika_Rahman.jpeg',
        profile_pic: 'Asserts/sadika_Rahman.jpeg',
        cover_pic: null,
        bio: 'Static demo build. On a real deployment this is your own profile.',
        headline: '',
        location: 'Dhaka, Bangladesh',
        website: '',
        interests: '',
        postsCount: SEED_POSTS.filter(byDemoUser).length,
        friendsCount: 10
    };

    function byDemoUser(p) {
        return !!p && String(p.userId) === DEMO_USER_ID;
    }

    function clone(value) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            return Array.isArray(value) ? value.slice() : [];
        }
    }

    function ok(payload) {
        return Promise.resolve(Object.assign({ status: 'success' }, payload || {}));
    }

    /* -------------------------------------------------------------- transport */

    // No API on Pages. Return the same shape the real apiRequest() produces when
    // the server is unreachable - a resolved value, never a rejection - so every
    // caller takes the fallback path it already has. `message` is deliberately
    // empty: renderFeed() and loadEvents() both raise an error toast for a failed
    // response that carries one, and a stream of toasts about the hosting platform
    // would read as a broken site rather than as a demo.
    window.apiRequest = function () {
        return Promise.resolve({
            status: 'error',
            offline: true,
            message: ''
        });
    };

    /* ------------------------------------------------------------------- auth */

    // The session check is what lets the shell into #main-app instead of the
    // sign-in screen. hydrate() then fails against the stub above, and that is
    // already handled: backend_integration.js admits the visitor when the session
    // is good but bootstrap failed, and the render functions use their mocks.
    api.session = function () {
        store.applyUser(DEMO_USER);
        return ok({ user: DEMO_USER });
    };

    // Login and logout, so signing out and back in does not dead-end on a form
    // that posts to an endpoint that does not exist. applyUser() runs first
    // because the window.login() wrapper prefers ULink.data.user over the form
    // payload, and hydrate() has just cleared it.
    api.login = function () {
        store.applyUser(DEMO_USER);
        return ok({ user: DEMO_USER });
    };

    api.logout = function () {
        return ok({});
    };

    /* ------------------------------------------------------------------ posts */

    // Stands in for api/posts/fetch.php. renderFeed() pages with {scope, limit,
    // offset} and the profile asks for {mine:1, scope:'all'}; honour both plus the
    // single-post and per-community lookups the post menu uses.
    api.fetchPosts = function (params) {
        var q = params || {};

        var list = SEED_POSTS.slice();

        if (q.id != null && q.id !== '') {
            list = list.filter(function (p) { return String(p.id) === String(q.id); });
        }

        if (q.mine != null && q.mine !== '') {
            list = list.filter(byDemoUser);
        }

        if (q.user_id != null && q.user_id !== '') {
            list = list.filter(function (p) { return String(p.userId) === String(q.user_id); });
        }

        if (q.community_id != null && q.community_id !== '') {
            list = list.filter(function (p) { return String(p.communityId) === String(q.community_id); });
        }

        // scope=feed is the newsfeed, which excludes community posts; scope=all
        // is every post, which is what a profile lists because its post count
        // includes both. scope=saved is the viewer's bookmarks.
        if (q.scope === 'feed') {
            list = list.filter(function (p) { return !p.communityId; });
        } else if (q.scope === 'saved') {
            list = list.filter(function (p) { return Boolean(p.saved); });
        }

        var offset = toInt(q.offset, 0);
        var limit = toInt(q.limit, 10);
        var page = list.slice(offset, offset + limit);

        return ok({
            data: clone(page),
            hasMore: (offset + page.length) < list.length,
            total: list.length
        });
    };

    function toInt(value, fallback) {
        var n = parseInt(value, 10);
        return isNaN(n) || n < 0 ? fallback : n;
    }

    /* -------------------------------------------------------------- mutations */

    // Liking, commenting, posting and saving are the first things anyone tries,
    // and none of these handlers has an offline branch: each one requires a
    // successful response and then repaints from the payload. They are answered
    // from the same in-memory store fetchPosts() reads, so a session behaves like
    // a real one for as long as the tab is open. Nothing is persisted - a reload
    // restores the seeded campus, which the toast on load says out loud.
    //
    // Handlers that already branch on ULink.isLive (community join/leave, event
    // RSVP) are deliberately left alone: they mutate state themselves and never
    // reach the API offline.

    var nextPostId = SEED_POSTS.reduce(function (max, p) {
        return Math.max(max, Number(p.id) || 0);
    }, 0) + 1;
    var nextCommentId = 1;

    function findSeedPost(id) {
        var key = String(id);
        for (var i = 0; i < SEED_POSTS.length; i++) {
            if (String(SEED_POSTS[i].id) === key) return SEED_POSTS[i];
        }
        return null;
    }

    // Mirrors what apiRequest() returns for a request that cannot be made, for
    // the case where the caller asks about a post this store does not have.
    function offline() {
        return Promise.resolve({ status: 'error', offline: true, message: '' });
    }

    // toggleLike() trusts the server's totals over a local increment, so both the
    // flag and the number have to move together here or the button drifts.
    api.likePost = function (postId) {
        var post = findSeedPost(postId);
        if (!post) return offline();

        post.liked = !post.liked;
        post.likes = Math.max(0, Number(post.likes || 0) + (post.liked ? 1 : -1));

        return ok({ action: post.liked ? 'liked' : 'unliked', likes: post.likes });
    };

    api.commentPost = function (postId, text) {
        var post = findSeedPost(postId);
        if (!post) return offline();

        var comment = {
            id: nextCommentId++,
            userId: DEMO_USER_ID,
            name: DEMO_USER.name,
            pic: DEMO_USER.pic,
            text: String(text == null ? '' : text)
        };

        if (!Array.isArray(post.commentsList)) post.commentsList = [];
        post.commentsList.push(comment);
        post.comments = post.commentsList.length;

        return ok({ comment: comment, comments: post.comments });
    };

    api.createPost = function (payload) {
        var p = payload || {};

        var post = {
            id: nextPostId++,
            userId: DEMO_USER_ID,
            name: DEMO_USER.name,
            pic: DEMO_USER.pic,
            dept: DEMO_USER.dept,
            batch: DEMO_USER.batch,
            role: DEMO_USER.role,
            text: String(p.text == null ? '' : p.text),
            image: p.image || '',
            communityId: p.community_id != null && p.community_id !== '' ? String(p.community_id) : null,
            communityName: null,
            likes: 0,
            comments: 0,
            liked: false,
            saved: false,
            created_at: new Date().toISOString(),
            commentsList: []
        };

        // scope=feed is the newsfeed and excludes community posts, so a community
        // post is appended rather than pushed to the top where the feed would
        // never show it.
        if (post.communityId) SEED_POSTS.push(post);
        else SEED_POSTS.unshift(post);

        return ok({ post: post });
    };

    api.editPost = function (postId, text) {
        var post = findSeedPost(postId);
        if (!post) return offline();

        post.text = String(text == null ? '' : text);

        return ok({ post: post });
    };

    api.deletePost = function (postId) {
        var key = String(postId);
        for (var i = 0; i < SEED_POSTS.length; i++) {
            if (String(SEED_POSTS[i].id) === key) {
                SEED_POSTS.splice(i, 1);
                return ok({});
            }
        }
        return offline();
    };

    api.savePost = function (postId) {
        var post = findSeedPost(postId);
        if (!post) return offline();

        post.saved = !post.saved;

        // This is what makes the Saved feed filter show the post afterwards.
        return ok({ saved: post.saved });
    };

    api.reportPost = function () {
        // The report dialog only needs the call to succeed; nothing reads it back.
        return ok({});
    };

    // The friend handlers update state.friends / state.friendRequests themselves
    // once the call succeeds, so only the acknowledgement is needed here.
    api.friendAction = function (action) {
        return ok({ action: action });
    };

    /* ----------------------------------------------------------------- events */

    // loadEvents() has already handled the offline case, but renderEventsGrid()
    // ignores state.events until eventsLoaded is true and reads
    // `ULink.data.events || MOCK_EVENTS` - where the default [] is truthy and
    // wins. Filling the store with the same rows restores the intended view.
    store.data.events = SEED_EVENTS;

    /* -------------------------------------------------------------- telemetry */

    // ActivityLogger posts to api/activities/log.php, which does not exist here.
    // It is already fire-and-forget, but each call left a 404 in the console.
    // Every helper (logPageView, logLogin, ...) routes through this one method.
    if (window.ActivityLogger) {
        window.ActivityLogger.log = function () {
            return Promise.resolve();
        };
    }

    /* ------------------------------------------------------------------ state */

    // Stay offline on purpose: this is the flag every render function checks
    // before choosing live data over the bundled mocks.
    store.isLive = false;
    store.lastError = null;

    // Say so, once. window.load rather than DOMContentLoaded: the shell registers
    // its own DOMContentLoaded handler first, and load fires after it, so the
    // toast has a mounted app to appear in.
    window.addEventListener('load', function () {
        if (typeof showToast === 'function') {
            showToast('Static demo on GitHub Pages - nothing is saved.', 'info');
        }
    });
})();
