/* ===========================================================================
   Portfolio · the Option Wheel, the project previews and the case-study media
   =========================================================================== */

/* ---------- Option Wheel ----------
   A vanilla port of React Bits' OptionWheel (JS-CSS): options sit on a curve and
   spin with scroll, drag or the arrow keys, tilting, fading and blurring away
   from the middle. Same maths and smoothing as the original, with three changes
   for a page that scrolls and has no React:
   - at either end the wheel hands the scroll back to the page instead of trapping it;
   - the row height follows the items' CSS font size, so the wheel is responsive;
   - Enter, or a click on the option already in the middle, activates it. */

class OptionWheel {
  constructor(root, opts = {}) {
    this.root = root;
    this.items = [...root.querySelectorAll(".option-wheel__item")];
    this.n = this.items.length;
    this.o = {
      selected: 0, side: "left", spacing: 1.4, curve: 1, tilt: 6, blur: 2, fade: 0.25, minOpacity: 0.05,
      smoothing: 200, loop: false, draggable: true, onChange: null, onActivate: null, ...opts,
    };
    this.pos = this.target = this.selected = this.o.selected;
    this.raf = 0;
    this.last = 0;
    this.drag = null;
    this.moved = false;
    this.wheelTimer = 0;

    root.classList.toggle("option-wheel--right", this.o.side === "right");
    this.measure();
    this.mark();

    root.addEventListener("wheel", this.onWheel, { passive: false });
    root.addEventListener("pointerdown", this.onDown);
    root.addEventListener("pointermove", this.onMove);
    root.addEventListener("pointerup", this.onUp);
    root.addEventListener("pointercancel", this.onUp);
    root.addEventListener("keydown", this.onKey);
    this.items.forEach((el, i) => el.addEventListener("click", () => this.onItem(i)));
    addEventListener("resize", () => { this.measure(); this.layout(); });
    document.fonts?.ready.then(() => { this.measure(); this.layout(); });

    this.layout();
  }

  setSide(side) {
    this.o.side = side;
    this.root.classList.toggle("option-wheel--right", side === "right");
    this.layout();
  }

  // one row is the option's font size times the spacing, read from CSS
  measure() {
    const fs = parseFloat(getComputedStyle(this.items[0]).fontSize) || 48;
    this.rowH = Math.max(fs * this.o.spacing, 1);
  }

  // eases the position toward its target with frame-rate independent smoothing
  frame = (now) => {
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    const k = 1 - Math.exp(-dt / (Math.max(this.o.smoothing, 1) / 1000));
    let next = this.pos + (this.target - this.pos) * k;
    const settled = Math.abs(this.target - next) < 0.001;
    if (settled) next = this.target;
    this.pos = next;
    this.layout();
    this.raf = settled ? 0 : requestAnimationFrame(this.frame);
  };

  start() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  // options sit on a circle whose radius keeps the arc between two neighbours equal
  // to one row, so the tilt sets how tightly it curls
  layout() {
    const o = this.o;
    const n = this.n;
    const mirror = o.side === "right" ? -1 : 1;
    const tiltRad = (o.tilt * Math.PI) / 180;
    const R = tiltRad > 0.0005 ? this.rowH / tiltRad : 0;
    this.items.forEach((el, i) => {
      let d = i - this.pos;
      if (o.loop && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }
      const dist = Math.abs(d);
      let x = 0;
      let y = d * this.rowH;
      let rot = 0;
      if (R > 0) {
        const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
        y = R * Math.sin(ang);
        x = -mirror * R * (1 - Math.cos(ang)) * o.curve;
        rot = (mirror * ang * 180) / Math.PI;
      }
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
      el.style.opacity = String(Math.max(o.minOpacity, 1 - dist * o.fade));
      el.style.filter = o.blur > 0 ? `blur(${(dist * o.blur).toFixed(2)}px)` : "none";
      el.style.setProperty("--ow-p", Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
    });
  }

  mark() {
    this.items.forEach((el, i) => {
      const on = i === this.selected;
      el.classList.toggle("option-wheel__item--selected", on);
      el.setAttribute("aria-selected", String(on));
    });
    this.root.setAttribute("aria-activedescendant", this.items[this.selected].id);
  }

  set(value, snap) {
    let v = value;
    if (!this.o.loop) v = Math.min(Math.max(v, 0), Math.max(this.n - 1, 0));
    if (snap) v = Math.round(v);
    this.target = v;
    const idx = ((Math.round(v) % this.n) + this.n) % this.n;
    if (idx !== this.selected) {
      this.selected = idx;
      this.mark();
      this.o.onChange?.(idx, this.items[idx]);
    }
    this.start();
  }

  onWheel = (e) => {
    const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
    // at either end, let the page scroll on rather than trapping the visitor
    if (!this.o.loop && ((delta < 0 && this.target <= 0) || (delta > 0 && this.target >= this.n - 1))) return;
    e.preventDefault();
    // one option per notch on a mouse wheel, continuous on a touchpad
    const step = Math.max(-1, Math.min(1, delta / this.rowH));
    this.set(this.target + step, false);
    clearTimeout(this.wheelTimer);
    this.wheelTimer = setTimeout(() => this.set(this.target, true), 140);
  };

  onDown = (e) => {
    if (!this.o.draggable) return;
    this.drag = { y: e.clientY, start: this.target, id: e.pointerId };
    this.moved = false;
    this.root.classList.add("option-wheel--dragging");
  };

  onMove = (e) => {
    const drag = this.drag;
    if (!drag) return;
    const dy = e.clientY - drag.y;
    if (!this.moved && Math.abs(dy) > 4) {
      this.moved = true;
      // capture only once a real drag starts, so plain clicks still reach the options
      this.root.setPointerCapture(drag.id);
    }
    if (this.moved) this.set(drag.start - dy / this.rowH, false);
  };

  onUp = () => {
    if (!this.drag) return;
    this.drag = null;
    this.root.classList.remove("option-wheel--dragging");
    if (this.moved) this.set(this.target, true);
  };

  onItem(i) {
    if (this.moved) return;
    if (i === this.selected && Math.round(this.target) === i) {
      this.o.onActivate?.(i, this.items[i]);
      return;
    }
    let d = i - (((this.target % this.n) + this.n) % this.n);
    if (this.o.loop && this.n > 1) {
      if (d > this.n / 2) d -= this.n;
      else if (d < -this.n / 2) d += this.n;
    }
    this.set(this.target + d, true);
  }

  onKey = (e) => {
    let delta = null;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") delta = -1;
    else if (e.key === "ArrowDown" || e.key === "ArrowRight") delta = 1;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.o.onActivate?.(this.selected, this.items[this.selected]);
      return;
    }
    if (delta == null) return;
    e.preventDefault();
    this.set(Math.round(this.target) + delta, true);
  };
}

/* ---------- /portfolio: the wheel picks the project, the preview follows ---------- */

(() => {
  const wheel = document.querySelector(".pf__wheel");
  if (!wheel) return;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cards = [...document.querySelectorAll(".pf-card")];
  const count = document.querySelector("[data-pf-index]");
  const slugs = [...wheel.querySelectorAll(".option-wheel__item")].map((el) => el.dataset.slug);
  // a link like /portfolio/?p=turo opens the wheel on that project
  const asked = slugs.indexOf(new URLSearchParams(location.search).get("p"));

  const show = (slug) => {
    for (const card of cards) {
      const on = card.dataset.slug === slug;
      card.classList.toggle("is-active", on);
      card.inert = !on;
      card.setAttribute("aria-hidden", String(!on));
      const video = card.querySelector("video");
      if (video && !reduceMotion) on ? video.play().catch(() => {}) : video.pause();
    }
  };

  const sideFor = (dir) => (dir === "rtl" ? "right" : "left");
  const ow = new OptionWheel(wheel, {
    selected: Math.max(0, asked),
    side: sideFor(document.documentElement.dir),
    tilt: 9,
    spacing: 1.25,
    fade: 0.32,
    smoothing: reduceMotion ? 60 : 220,
    onChange: (i, el) => {
      show(el.dataset.slug);
      if (count) count.textContent = String(i + 1).padStart(2, "0");
      history.replaceState(null, "", i ? `?p=${el.dataset.slug}` : location.pathname);
    },
    onActivate: (i, el) => { if (el.dataset.href) location.href = el.dataset.href; },
  });
  show(slugs[ow.selected]);
  if (count) count.textContent = String(ow.selected + 1).padStart(2, "0");
  // switching to or from Arabic in the menu mirrors the wheel
  if (typeof i18n !== "undefined") i18n.onChange(() => ow.setSide(sideFor(i18n.dir)));
})();

/* ---------- Case studies: each video plays while it is on screen ----------
   Videos carry preload="none" and a poster, so nothing downloads until a clip
   scrolls into view. With reduced motion they wait for a press of play. */

(() => {
  const videos = document.querySelectorAll("video[data-inview]");
  if (!videos.length) return;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    videos.forEach((v) => { v.controls = true; });
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) e.target.play().catch(() => {});
      else e.target.pause();
    }
  }, { threshold: 0.2 });
  videos.forEach((v) => io.observe(v));
})();
