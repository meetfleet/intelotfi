/* ---------- Breachify chapters: annotated screens, flows, the scroller, live demos ----------
   Loaded after blog.js on the three Breachify chapters, with ../breachify/ui.js
   before it. Demos register with BF.demo(name, init) anywhere in this file or
   in later scripts; they boot once the page has parsed, each the first time it
   comes near the screen. */

window.BF = (() => {
  const U = window.BFUI;
  const reduce = U.reduceMotion;
  const registry = new Map();

  /* ---------- Annotated screens ---------- */

  const spots = [...document.querySelectorAll(".spot")];
  const closeSpots = (except) => spots.forEach((s) => {
    if (s === except) return;
    s.classList.remove("is-open");
    s.querySelector(".spot__dot")?.setAttribute("aria-expanded", "false");
  });

  spots.forEach((spot, i) => {
    const x = parseFloat(spot.style.getPropertyValue("--x"));
    const y = parseFloat(spot.style.getPropertyValue("--y"));
    // tips open away from the nearest edges of the screen
    if (y < 24) spot.classList.add("is-below");
    if (x < 24) spot.classList.add("is-start");
    else if (x > 76) spot.classList.add("is-end");
    spot.style.setProperty("--n", spot.dataset.n ? Number(spot.dataset.n) - 1 : i);
    const dot = spot.querySelector(".spot__dot");
    if (!dot) return;
    dot.setAttribute("aria-expanded", "false");
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = !spot.classList.contains("is-open");
      closeSpots(spot);
      spot.classList.toggle("is-open", open);
      dot.setAttribute("aria-expanded", String(open));
    });
  });
  if (spots.length) {
    document.addEventListener("click", (e) => { if (!e.target.closest(".spot")) closeSpots(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") closeSpots(); });
  }

  // <button class="ref" data-for="shot-id" data-n="2"> in the prose answers to callout 2
  document.querySelectorAll(".ref[data-for][data-n]").forEach((ref) => {
    const spot = document.querySelector(`#${CSS.escape(ref.dataset.for)} .spot[data-n="${ref.dataset.n}"]`);
    if (!spot) return;
    ref.setAttribute("aria-label", `Show callout ${ref.dataset.n} on the screen`);
    const on = () => spot.classList.add("is-flash");
    const off = () => spot.classList.remove("is-flash");
    ref.addEventListener("pointerenter", on);
    ref.addEventListener("pointerleave", off);
    ref.addEventListener("focus", on);
    ref.addEventListener("blur", off);
    ref.addEventListener("click", (e) => {
      e.stopPropagation();
      const r = spot.getBoundingClientRect();
      if (r.top < 80 || r.bottom > innerHeight - 80) spot.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      closeSpots(spot);
      spot.classList.add("is-open");
      spot.querySelector(".spot__dot")?.setAttribute("aria-expanded", "true");
    });
  });

  /* ---------- Flows: tabs over a stage of screens ---------- */

  document.querySelectorAll("[data-flow]").forEach((flow) => {
    const tabs = [...flow.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
    const stage = flow.querySelector(".flow__stage");
    if (!stage || panels.some((p) => !p)) return;
    let cur = Math.max(0, tabs.findIndex((t) => t.getAttribute("aria-selected") === "true"));
    let timer = 0, prev = null;

    const settle = () => {
      clearTimeout(timer);
      if (prev) { prev.hidden = true; prev.classList.remove("is-out"); prev = null; }
      stage.style.height = "";
    };

    const select = (i, focus) => {
      if (i === cur) { if (focus) tabs[i].focus(); return; }
      settle();
      const from = panels[cur], to = panels[i];
      stage.style.setProperty("--dir", i > cur ? 1 : -1);
      tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      if (focus) tabs[i].focus();
      cur = i;
      if (reduce) { from.hidden = true; to.hidden = false; return; }
      stage.style.height = `${from.offsetHeight}px`;
      to.hidden = false;
      to.classList.add("is-in-start");
      from.classList.add("is-out");
      prev = from;
      void to.offsetWidth;                       // commit the start state
      to.classList.remove("is-in-start");
      stage.style.height = `${to.offsetHeight}px`;
      timer = setTimeout(settle, 760);
    };

    tabs.forEach((t, i) => {
      t.tabIndex = i === cur ? 0 : -1;
      t.addEventListener("click", () => select(i, false));
    });
    flow.querySelector('[role="tablist"]')?.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (e.key === "Home" || e.key === "End") { e.preventDefault(); select(e.key === "Home" ? 0 : tabs.length - 1, true); return; }
      if (!step) return;
      e.preventDefault();
      select((cur + step + tabs.length) % tabs.length, true);
    });
    panels.forEach((p, k) => { p.hidden = k !== cur; });
  });

  /* ---------- Scroller: the long dashboard slides through a pinned frame ---------- */

  document.querySelectorAll("[data-scrolly]").forEach((box) => {
    const win = box.querySelector(".scrolly__window");
    const img = box.querySelector(".scrolly__img");
    const steps = [...box.querySelectorAll(".scrolly__step")];
    const thumb = box.querySelector(".scrolly__thumb");
    const count = box.querySelector(".scrolly__count");
    if (!win || !img || !steps.length) return;
    const ratio = Number(img.getAttribute("height")) / Number(img.getAttribute("width"));
    const at = steps.map((s) => Math.max(0, Math.min(1, Number(s.dataset.at) || 0)));
    box.style.setProperty("--steps", steps.length);
    box.classList.add("is-on");

    let winH = 0, imgH = 0, active = -1, queued = false;
    const measure = () => {
      const w = win.clientWidth || box.clientWidth;
      imgH = w * ratio;
      winH = Math.round(Math.min(imgH, Math.max(260, Math.min(innerHeight * (innerWidth < 769 ? 0.52 : 0.62), 640))));
      box.style.setProperty("--win-h", `${winH}px`);
    };
    const offsetFor = (k) => Math.min(Math.max(0, at[k] * imgH), Math.max(0, imgH - winH));
    const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));

    const update = () => {
      queued = false;
      const r = box.getBoundingClientRect();
      const pin = box.querySelector(".scrolly__pin");
      const stickTop = parseFloat(getComputedStyle(pin).top) || 0;
      const travel = Math.max(1, box.offsetHeight - pin.offsetHeight);
      const p = Math.max(0, Math.min(1, (stickTop - r.top) / travel));
      // each step owns an equal stretch of the scroll: the frame moves in the
      // first third of it, then holds so the step can be read
      const n = steps.length;
      const f = p * n;
      const k = Math.min(n - 1, Math.floor(f));
      const local = f - k;
      const fromY = offsetFor(Math.max(0, k - (local < 0.34 ? 1 : 0)));
      const y = k === 0 ? offsetFor(0) : local < 0.34 ? fromY + (offsetFor(k) - fromY) * ease(local / 0.34) : offsetFor(k);
      img.style.setProperty("--ty", `${(-y).toFixed(1)}px`);
      if (thumb) {
        const rail = thumb.parentElement.clientHeight;
        thumb.style.setProperty("--th", `${Math.max(8, (winH / imgH) * 100)}%`);
        thumb.style.setProperty("--tt", `${((y / imgH) * rail).toFixed(1)}px`);
      }
      if (k !== active) {
        active = k;
        steps.forEach((s, i) => s.classList.toggle("is-active", i === k));
        if (count) count.innerHTML = `<b>${U.pad(k + 1)}</b> / ${U.pad(n)}`;
      }
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    measure();
    update();
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", () => { measure(); queue(); });
    if (!img.complete) img.addEventListener("load", () => { measure(); queue(); }, { once: true });
  });

  /* ---------- Demos ---------- */

  // each demo gets a body to render into and a context whose timers die on reset
  const mount = (fig, init) => {
    const old = fig.querySelector(".demo__body");
    const body = old.cloneNode(false);           // a fresh node drops every old listener
    old.replaceWith(body);
    const timers = new Set();
    const ctx = {
      fig,
      body,
      alive: () => body.isConnected,
      later(fn, ms) { const id = setTimeout(() => { timers.delete(id); if (body.isConnected) fn(); }, ms); timers.add(id); return id; },
      every(fn, ms) { const id = setInterval(() => { if (body.isConnected) fn(); else clearInterval(id); }, ms); timers.add(id); return id; },
      stop() { timers.forEach((id) => { clearTimeout(id); clearInterval(id); }); timers.clear(); },
    };
    try {
      init(body, ctx);
      fig.classList.add("is-ready");
    } catch (err) {
      console.warn(`demo "${fig.dataset.demo}" failed`, err);
      body.innerHTML = '<p class="demo__fallback">This demo could not start in this browser.</p>';
    }
    return ctx;
  };

  const boot = () => {
    document.querySelectorAll("[data-demo]").forEach((fig) => {
      const init = registry.get(fig.dataset.demo);
      if (!init || !fig.querySelector(".demo__body")) return;
      let ctx = null;
      U.inView(fig, () => { ctx = mount(fig, init); }, { margin: "320px 0px" });
      fig.querySelector(".demo__reset")?.addEventListener("click", () => {
        if (!ctx) return;
        ctx.stop();
        ctx = mount(fig, init);
      });
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else setTimeout(boot, 0);

  return { demo: (name, init) => registry.set(name, init) };
})();
