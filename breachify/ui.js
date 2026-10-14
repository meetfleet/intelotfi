/* ---------- Breachify UI kit: helpers ----------
   Shared by the console on /breachify/ and the demos in the chapters.
   Everything here is presentation: the data in the demos is made up, on
   reserved example domains (RFC 2606) and documentation IP ranges (RFC 5737). */

window.BFUI = (() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Icons: 24px outline set, drawn like the product's ---------- */

  const ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/>',
    cookie: '<path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5h.01M16 15.5h.01M12 12h.01M11 17h.01M7 14h.01"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    app: '<rect x="2" y="6" width="14" height="14" rx="2"/><path d="M8 2h12a2 2 0 0 1 2 2v12M9 10v3.5M9 16.5h.01"/>',
    admin: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    files: '<path d="M15 2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M15 2v5h5M4 8v12a2 2 0 0 0 2 2h10"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    fileSearch: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h5M14 2v6h6v3"/><circle cx="16.5" cy="16.5" r="3"/><path d="m21 21-2.4-2.4"/>',
    bars: '<path d="M5 21V9M12 21V3M19 21v-7"/>',
    thirdParty: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/><path d="M7 11v3a3 3 0 0 0 3 3h3"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    chevronLeft: '<path d="m15 6-6 6 6 6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    idCard: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 10h4M14 14h4"/>',
    bug: '<rect x="7" y="6" width="10" height="14" rx="5"/><path d="M9 3.5 10.5 6M15 3.5 13.5 6M12 11v9M7 13H3M21 13h-4M7.5 9 4 7M16.5 9 20 7M7.5 17 4 19M16.5 17 20 19"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    network: '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3M12 12V8"/>',
    folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.75-1.4"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    zip: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M10 4h1M10 7h1M10 10h1M10 13h1"/><rect x="9" y="15" width="3" height="4" rx="1"/>',
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
    archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
    radio: '<path d="M4.9 19.1a10 10 0 0 1 0-14.2M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4M19.1 4.9a10 10 0 0 1 0 14.2"/><circle cx="12" cy="12" r="2"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6C3.7 8.5 2 12 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6M2 2l20 20M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    terminal: '<path d="m4 17 6-6-6-6M12 19h8"/>',
    smartphone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  };

  const icon = (name, cls = "") =>
    `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ""}</svg>`;

  // the Breachify mark: an outline shield whose right side turns into the tick
  const logo = (cls = "") =>
    `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 48 56" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5.4 29.1V35c0 8 7.6 14.5 18.6 17.5C35 49.5 41.9 43 41.9 35V14.6L23.9 32.8l-7.4-7.6"/><path d="M5.4 21.9v-9.4l19-8 11.7 4.4"/></svg>`;

  /* ---------- Text and numbers ---------- */

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = new Intl.NumberFormat("en-US");
  const fmt = (n) => nf.format(Math.round(n));
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  // 2026-09-14 08:21, in UTC so every visitor sees the same sample data
  const stamp = (d, withTime = true) => {
    const x = d instanceof Date ? d : new Date(d);
    const s = `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
    return withTime ? `${s} ${pad(x.getUTCHours())}:${pad(x.getUTCMinutes())}` : s;
  };

  /* ---------- Seeded randomness: the same query always gives the same sample ---------- */

  const hash = (str) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const rng = (seed) => {
    let a = typeof seed === "number" ? seed >>> 0 : hash(String(seed));
    const next = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    next.pick = (arr) => arr[Math.floor(next() * arr.length)];
    next.chars = (n, set = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789") => Array.from({ length: n }, () => set[Math.floor(next() * set.length)]).join("");
    return next;
  };

  /* ---------- Motion ---------- */

  const countUp = (el, to, { dur = 1100, from = 0, format = fmt } = {}) => {
    if (!el) return;
    if (reduceMotion || dur <= 0) { el.textContent = format(to); return; }
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(2, -10 * p);
      el.textContent = format(p >= 1 ? to : from + (to - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // run once, the first time an element comes near the screen
  const inView = (el, cb, { margin = "160px 0px", threshold = 0 } = {}) => {
    if (!("IntersectionObserver" in window)) { cb(el); return; }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { io.disconnect(); cb(el); break; }
    }, { rootMargin: margin, threshold });
    io.observe(el);
  };

  // position a sliding indicator (--x, --w) under the active item of a container
  const ink = (container, active, inkEl) => {
    if (!container || !active || !inkEl) return;
    const c = container.getBoundingClientRect(), r = active.getBoundingClientRect();
    inkEl.style.setProperty("--x", `${r.left - c.left - container.clientLeft + container.scrollLeft}px`);
    inkEl.style.setProperty("--w", `${r.width}px`);
  };

  // One observer for all widgets; removed demo bodies release their entries.
  const resizeCallbacks = new Map();
  const widgetResize = "ResizeObserver" in window ? new ResizeObserver(entries => {
    entries.forEach(entry => resizeCallbacks.get(entry.target)?.());
  }) : null;
  const observeResize = (element, callback) => {
    if (!widgetResize) return;
    resizeCallbacks.set(element, callback);
    widgetResize.observe(element);
  };
  new MutationObserver(records => {
    if (!records.some(record => record.removedNodes.length)) return;
    resizeCallbacks.forEach((_, element) => {
      if (!element.isConnected) {
        widgetResize.unobserve(element);
        resizeCallbacks.delete(element);
      }
    });
  }).observe(document.body, { childList: true, subtree: true });

  /* ---------- Widgets ---------- */

  // tabs: role=tab buttons inside a .bf-tabs; arrows/Home/End move, the ink follows
  const tabs = (list, { onChange } = {}) => {
    const items = [...list.querySelectorAll('[role="tab"]')];
    let inkEl = list.querySelector(".bf-tabs__ink");
    if (!inkEl) { inkEl = document.createElement("span"); inkEl.className = "bf-tabs__ink"; inkEl.setAttribute("aria-hidden", "true"); list.prepend(inkEl); }
    let cur = Math.max(0, items.findIndex((t) => t.getAttribute("aria-selected") === "true"));
    const select = (i, { focus = false, silent = false } = {}) => {
      cur = (i + items.length) % items.length;
      items.forEach((t, k) => {
        t.setAttribute("aria-selected", String(k === cur));
        t.tabIndex = k === cur ? 0 : -1;
        const panel = t.getAttribute("aria-controls") && document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = k !== cur;
      });
      ink(list, items[cur], inkEl);
      if (focus) items[cur].focus({ preventScroll: true });
      // a tab half hidden in an overflowing bar slides into view; the page never scrolls
      const t = items[cur], l = t.offsetLeft, r = l + t.offsetWidth;
      if (l < list.scrollLeft + 8) list.scrollTo({ left: Math.max(0, l - 24), behavior: reduceMotion || focus ? "auto" : "smooth" });
      else if (r > list.scrollLeft + list.clientWidth - 8) list.scrollTo({ left: r - list.clientWidth + 24, behavior: reduceMotion || focus ? "auto" : "smooth" });
      if (!silent) onChange?.(cur, items[cur]);
    };
    items.forEach((t, i) => t.addEventListener("click", () => select(i)));
    list.addEventListener("keydown", (e) => {
      const k = { ArrowRight: 1, ArrowLeft: -1, Home: "home", End: "end" }[e.key];
      if (k === undefined) return;
      e.preventDefault();
      select(k === "home" ? 0 : k === "end" ? items.length - 1 : cur + k, { focus: true });
    });
    const relayout = () => ink(list, items[cur], inkEl);
    observeResize(list, relayout);
    list.addEventListener("scroll", relayout, { passive: true });
    select(cur, { silent: true });
    return { select, get index() { return cur; }, relayout };
  };

  // segmented control: aria-pressed buttons, one on at a time
  const seg = (root, { onChange } = {}) => {
    const items = [...root.querySelectorAll("button")];
    let inkEl = root.querySelector(".bf-seg__ink");
    if (!inkEl) { inkEl = document.createElement("span"); inkEl.className = "bf-seg__ink"; inkEl.setAttribute("aria-hidden", "true"); root.prepend(inkEl); }
    let cur = Math.max(0, items.findIndex((b) => b.getAttribute("aria-pressed") === "true"));
    const select = (i, { silent = false } = {}) => {
      cur = i;
      items.forEach((b, k) => b.setAttribute("aria-pressed", String(k === cur)));
      ink(root, items[cur], inkEl);
      if (!silent) onChange?.(cur, items[cur]);
    };
    items.forEach((b, i) => b.addEventListener("click", () => select(i)));
    observeResize(root, () => ink(root, items[cur], inkEl));
    select(cur, { silent: true });
    return { select, get index() { return cur; }, relayout: () => ink(root, items[cur], inkEl) };
  };

  // a role=switch button: <button class="bf-switch" role="switch" aria-checked="false">
  const toggle = (btn, onToggle) => {
    btn.addEventListener("click", () => {
      const on = btn.getAttribute("aria-checked") !== "true";
      btn.setAttribute("aria-checked", String(on));
      onToggle?.(on, btn);
    });
  };
  const switchHTML = (on, label = "", extraAttrs = "") =>
    `<button type="button" class="bf-switch" role="switch" aria-checked="${on ? "true" : "false"}" ${extraAttrs}><span class="bf-switch__track" aria-hidden="true"></span><span class="bf-switch__label">${esc(label)}</span></button>`;

  // a toast inside a .bf-toasts host; returns a function that dismisses it
  const toast = (host, { title, body = "", tone = "", ico = "check", action = "", onAction, timeout = 4200 } = {}) => {
    if (!host) return () => {};
    const t = document.createElement("div");
    t.className = `bf-toast${tone ? ` bf-toast--${tone}` : ""}`;
    t.setAttribute("role", "status");
    t.innerHTML = `<span class="bf-toast__icon">${icon(ico)}</span><span><span class="bf-toast__t" style="display:block">${esc(title)}</span>${body ? `<span class="bf-toast__b" style="display:block">${esc(body)}</span>` : ""}</span>${action ? `<button type="button" class="bf-toast__a">${esc(action)}</button>` : "<span></span>"}`;
    let gone = false, timer = 0;
    const dismiss = () => {
      if (gone) return; gone = true; clearTimeout(timer);
      t.classList.add("is-leaving");
      setTimeout(() => t.remove(), reduceMotion ? 0 : 340);
    };
    if (action) t.querySelector(".bf-toast__a").addEventListener("click", () => { onAction?.(); dismiss(); });
    host.appendChild(t);
    // at most three on screen
    while (host.children.length > 3) host.firstElementChild.remove();
    if (timeout) timer = setTimeout(dismiss, timeout);
    return dismiss;
  };

  /* ---------- Files and clipboard ---------- */

  const csv = (rows) => rows.map((r) => r.map((v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");

  const download = (filename, text, type = "text/csv;charset=utf-8") => {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.rel = "noopener"; a.style.display = "none";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (__) { ok = false; }
      ta.remove(); return ok;
    }
  };

  return { reduceMotion, ICONS, icon, logo, esc, fmt, pad, stamp, hash, rng, countUp, inView, ink, tabs, seg, toggle, switchHTML, toast, csv, download, copy };
})();
