/**
 * scripts/audit-contrast.js
 *
 * Paste-and-run contrast audit for the U-Link views. Drives both themes over
 * every tab plus the two profile overlays and reports any element whose text
 * falls below 3:1 against its real backdrop.
 *
 * Run it from the browser console with the app logged in:
 *
 *     fetch('/scripts/audit-contrast.js').then(r => r.text())
 *         .then(src => eval(src))().then(console.log)
 *
 * Why it is not a static analysis pass:
 *
 *   * Gradients report `background-color: rgba(0,0,0,0)`, so anything that only
 *     reads background-color silently measures the card *behind* the button.
 *     The signature CTA (`from-primary to-orange-500`) was 2.8:1 on its bright
 *     end and 1.9:1 in dark mode, and a backgroundColor-only scanner saw none
 *     of it. Every gradient stop is sampled and the worst one wins.
 *
 *   * Translucent fills have to be composited, not skipped. A `bg-black/55`
 *     scrim over a cover photo is 4.7:1; skipping the scrim and walking up to
 *     the next opaque ancestor reported the card colour instead, which flagged
 *     a correct element as a failure.
 *
 *   * Text sitting over an <img> is reported with `onPhoto: true` so it can be
 *     told apart from a real theme regression - no class list can fix those.
 *
 *   * Layers composite outside-in. Walking up the tree gives them inside-out,
 *     and feeding that order straight into a composite makes an opaque card
 *     further up overwrite the button's own fill. The result is a backdrop
 *     that is not the backdrop, which fails correct markup and can pass broken
 *     markup by accident.
 *
 * The static companion is scripts/lint-theme.py, which catches the same class
 * of mistake in source without a browser.
 */
(async () => {
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // Do not scan the un-hydrated shell.
  //
  // `index.html` ships a static home composer and the Tailwind CDN recompiles
  // its stylesheet as the DOM changes, so a scan fired in the first moments
  // after a reload can read a half-built page: once it reported three home
  // failures - white `text-on-cta` on the CTA gradient and a `text-green-600`
  // photo icon - that were gone by the time the app finished. The markup is
  // correct; that window is not the app a user ends up looking at.
  //
  // `ULink.isLive` flips true only after the bootstrap call succeeds, so gating
  // on it puts the scan after hydration. The timeout keeps a logged-out or
  // backendless page from hanging the audit.
  if (typeof ULink !== 'undefined' && ULink && ULink.isLive !== true) {
    for (let waited = 0; waited < 15000 && ULink.isLive !== true; waited += 250) {
      await wait(250);
    }
    await wait(400);
  }

  // ---- colour ------------------------------------------------------------
  const lum = (rgb) => {
    const [r, g, b] = rgb.map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const parse = (s) => {
    const m = String(s).match(/[\d.]+/g);
    return m ? m.slice(0, 3).map(Number) : null;
  };
  const alphaOf = (s) => {
    const m = String(s).match(/[\d.]+/g);
    return m && m.length > 3 ? Number(m[3]) : 1;
  };
  const over = (fg, bg, a) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));
  const key = (c) => c.join(',');

  // Every colour a computed background-image can contain, flattened. Percentages
  // between them are position hints and are skipped.
  const gradientStops = (image) => {
    if (!image || image === 'none') return [];
    const out = [];
    const re = /(rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*[\d.]+\s*)?\))|(#[0-9a-f]{3,8})\b/gi;
    let m;
    while ((m = re.exec(image)) !== null) {
      const c = parse(m[1] || m[2]);
      if (c) out.push({ rgb: c, alpha: m[1] ? alphaOf(m[1]) : 1 });
    }
    return out;
  };

  // ---- compositing -------------------------------------------------------
  const MAX = 16; // candidate backdrops per element

  const composited = (el) => {
    // Collected innermost first, because that is the order a DOM walk produces
    // them in. The loop below then walks the list *backwards*, outermost to
    // innermost, and that direction is the whole point: a layer can only be
    // painted on top of the layers outside it.
    //
    // Applying them the other way round - which is what this did - let an
    // opaque card further up the tree overwrite the button's own fill, so
    // every CTA reported the page background as its backdrop. That flagged
    // correct markup as a failure and, worse, could pass a genuinely broken
    // pair by accident.
    const stack = [];
    let n = el;
    while (n) {
      const cs = getComputedStyle(n);
      const stops = gradientStops(cs.backgroundImage);
      if (stops.length >= 2) stack.push({ kind: 'gradient', stops });
      const bg = parse(cs.backgroundColor);
      const a = alphaOf(cs.backgroundColor);
      if (bg && a > 0.004) stack.push({ kind: 'solid', rgb: bg, alpha: a });
      if (n === document.documentElement) break;
      n = n.parentElement;
    }

    let base = parse(getComputedStyle(document.body).backgroundColor);
    if (!base || alphaOf(getComputedStyle(document.body).backgroundColor) < 0.5) {
      base = document.documentElement.classList.contains('dark') ? [11, 15, 20] : [255, 255, 255];
    }

    let current = [base];
    for (let i = stack.length - 1; i >= 0; i--) {
      const layer = stack[i];
      const next = [];
      const seen = new Set();
      const push = (c) => {
        const k = key(c);
        if (seen.has(k)) return;          // the same colour is already a candidate
        if (next.length >= MAX) return;  // keep the candidate set bounded
        seen.add(k);
        next.push(c);
      };
      for (const c of current) {
        if (layer.kind === 'solid') {
          push(layer.alpha >= 1 ? layer.rgb : over(layer.rgb, c, layer.alpha));
        } else {
          for (const s of layer.stops) {
            push(s.alpha >= 1 ? s.rgb : over(s.rgb, c, s.alpha));
          }
        }
      }
      if (!next.length) break;
      current = next;
    }
    return current;
  };

  // ---- traversal ---------------------------------------------------------
  const visible = (el) => {
    if (!el.getClientRects().length) return false;
    let n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      n = n.parentElement;
    }
    return true;
  };

  const ownText = (el) => Array.from(el.childNodes)
    .filter(n => n.nodeType === 3)
    .map(n => n.textContent.trim()).join('').trim();

  // An <img> between the element and the measured backdrop means the real
  // backdrop is a photograph. Nothing in the class list can fix that, so the
  // element is reported separately instead of as a theme failure.
  const overPhoto = (el, root) => {
    let n = el.parentElement;
    while (n && n !== root) {
      if (n.tagName === 'IMG') return true;
      n = n.parentElement;
    }
    return false;
  };

  const scan = (rootSel) => {
    const bad = [], seen = new Set();
    const root = document.querySelector(rootSel);
    if (!root) return bad;
    for (const el of root.querySelectorAll('*')) {
      if (!visible(el)) continue;
      const text = ownText(el);
      if (!text) continue;
      const cs = getComputedStyle(el);
      if (/url\(/.test(cs.backgroundImage)) continue;  // its own fill is an image
      const fg = parse(cs.color);
      if (!fg) continue;

      // What the reader actually sees. A colour alpha and an `opacity-` utility
      // fade the glyph the same amount, and reading `cs.color` alone measures
      // text the page never renders: `text-white opacity-60` on an orange
      // bubble is 2.8:1, not the 5.2:1 that white on orange reports.
      const propAlpha = parseFloat(cs.opacity);
      const alpha = alphaOf(cs.color)
        * (Number.isFinite(propAlpha) ? Math.min(1, Math.max(0, propAlpha)) : 1);

      if (alpha < 0.02) continue;   // fully faded - nothing to measure

      let lo = Infinity, backdrop = null;
      for (const c of composited(el)) {
        const eff = alpha >= 0.999 ? fg : over(fg, c, alpha);
        const r = ratio(eff, c);
        if (r < lo) { lo = r; backdrop = c; }
      }
      if (lo >= 3) continue;
      const k = (el.className || '') + '|' + cs.color + '|' + alpha + '|' + key(backdrop);
      if (seen.has(k)) continue;
      seen.add(k);
      bad.push({
        cls: String(el.className || '').slice(0, 64),
        fg: cs.color,
        alpha: Math.round(alpha * 100) / 100,
        backdrop: 'rgb(' + backdrop.join(',') + ')',
        ratio: Math.round(lo * 100) / 100,
        onPhoto: overPhoto(el, root),
        text: text.slice(0, 30),
      });
    }
    bad.sort((a, b) => a.ratio - b.ratio);
    return bad;
  };

  // ---- drive -------------------------------------------------------------
  //
  // Fixed sleeps are not good enough here, and guessing wrong is worse than
  // not measuring at all. Two things move the paint under a fixed delay:
  //
  //   * the Tailwind CDN JIT writes a utility's rule only once it has seen the
  //     class in the DOM, so a freshly rendered view has real elements whose
  //     `color` is still inherited from the parent;
  //   * this app puts `transition-colors` / `transition-all` on almost
  //     everything, so flipping `.dark` makes `getComputedStyle` return
  //     interpolated colours for the length of the transition.
  //
  // Both produce confident nonsense: a real 5.2:1 pairing measured at 1.7:1
  // against the outgoing theme's colours. So instead of a delay, wait until a
  // full-document paint signature stops changing.
  const paintSignature = () => {
    const parts = [];
    for (const el of document.querySelectorAll('body, body *')) {
      const cs = getComputedStyle(el);
      parts.push(cs.color, cs.backgroundColor, cs.backgroundImage, cs.opacity);
    }
    return parts.join('|');
  };

  // Resolves to true once two consecutive samples agree.
  const settle = async (maxMs = 6000) => {
    let prev = paintSignature();
    for (let waited = 0; waited < maxMs; waited += 120) {
      await wait(120);
      const now = paintSignature();
      if (now === prev) return true;
      prev = now;
    }
    return false;
  };

  const settleAndScan = async (rootSel) => {
    const settled = await settle();
    return { settled, bad: scan(rootSel) };
  };

  const out = { unstable: [] };
  for (const theme of ['dark', 'light']) {
    toggleDarkMode(theme === 'dark');
    await wait(400);
    const per = {
      verified: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      bodyBg: getComputedStyle(document.body).backgroundColor,
      views: {},
    };
    for (const v of ['home', 'friends', 'communities', 'events', 'explore', 'messages', 'profile', 'settings']) {
      switchTab(v);
      await wait(400);
      if (v === 'settings') {
        // Each settings panel is display:none until its tab is active, so scan
        // them one at a time rather than only measuring the default panel.
        for (const panel of ['account', 'preferences', 'privacy', 'notifications', 'security']) {
          switchSettingsTab(panel);
          await wait(250);
          const rp = await settleAndScan('#settings-view');
          if (!rp.settled) out.unstable.push(theme + '/settings-' + panel);
          per.views['settings-' + panel] = rp.bad;
        }
        continue;
      }
      const r = await settleAndScan('#' + v + '-view');
      if (!r.settled) out.unstable.push(theme + '/' + v);
      per.views[v] = r.bad;

      if (v === 'explore') {
        // Explore is five sub-portals, and only one is on screen at a time.
        // Scan each so a washed-out card cannot hide behind the default view.
        for (const sub of ['programming', 'research', 'gaming', 'career']) {
          switchExploreTab(sub);
          await wait(350);
          const rs = await settleAndScan('#explore-' + sub + '-view');
          if (!rs.settled) out.unstable.push(theme + '/explore-' + sub);
          per.views['explore-' + sub] = rs.bad;
        }
        switchExploreTab('main');
        await wait(250);
      }

      if (v === 'home') {
        // The post popover, the report dialog and the profile editor are
        // transient overlay UI, so no `#<view>-view` scan ever reaches them.
        // Open each on the live feed, measure it, then close it again.
        const firstPost = (state.posts || [])[0];
        if (firstPost) {
          togglePostMenu({ stopPropagation() {} }, firstPost.id);
          const rm = await settleAndScan('#post-menu-' + firstPost.id);
          if (!rm.settled) out.unstable.push(theme + '/postMenu');
          per.views.postMenu = rm.bad;
          closeAllPostMenus();
        }
        const foreign = (state.posts || []).find(p => String(p.userId) !== String((state.user || {}).id));
        if (foreign) {
          openReportModal(foreign.id);
          const rr = await settleAndScan('#report-overlay');
          if (!rr.settled) out.unstable.push(theme + '/reportModal');
          per.views.reportModal = rr.bad;
          closeReportModal();
        }
        openProfileEditor();
        const rp = await settleAndScan('#profile-edit-overlay');
        if (!rp.settled) out.unstable.push(theme + '/profileEditor');
        per.views.profileEditor = rp.bad;
        closeProfileEditor();

        // The two creation dialogs are overlays too, so they need their own pass.
        openCreateCommunityModal();
        const rcc = await settleAndScan('#create-community-overlay');
        if (!rcc.settled) out.unstable.push(theme + '/createCommunity');
        per.views.createCommunity = rcc.bad;
        closeCreateCommunityModal();

        openCreateEventModal();
        const rce = await settleAndScan('#create-event-overlay');
        if (!rce.settled) out.unstable.push(theme + '/createEvent');
        per.views.createEvent = rce.bad;
        closeCreateEventModal();
      }
    }
    await openPublicProfile(2); await wait(400);
    let r = await settleAndScan('#other-profile-view');
    if (!r.settled) out.unstable.push(theme + '/otherProfile');
    per.views.otherProfile = r.bad;
    await openCommunityProfile('1'); await wait(400);
    r = await settleAndScan('#community-profile-view');
    if (!r.settled) out.unstable.push(theme + '/communityProfile');
    per.views.communityProfile = r.bad;
    out[theme] = per;
  }
  return JSON.stringify(out);
})()
