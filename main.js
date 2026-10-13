const body = document.body;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Reduced motion softens the effects instead of removing them.
const AMP = reduceMotion ? 0.35 : 1;
const finePointer = matchMedia("(pointer: fine)").matches;
const isMobile = () => matchMedia("(max-width: 768px)").matches;

/* ---------- Springs ---------- */

// Damped harmonic oscillator. Interrupting a spring mid-flight keeps its
// velocity, which is what makes the motion feel physical rather than tweened.
class Spring {
  constructor(value = 0, stiffness = 170, damping = 26) {
    this.x = value;
    this.target = value;
    this.v = 0;
    this.k = stiffness;
    this.c = damping;
  }
  step(dt) {
    const a = -this.k * (this.x - this.target) - this.c * this.v;
    this.v += a * dt;
    this.x += this.v * dt;
  }
}

const springs = [];
const spring = (...args) => {
  const s = new Spring(...args);
  springs.push(s);
  return s;
};

/* ---------- Stagger indices ---------- */

const setIndex = (els) => els.forEach((el, i) => el.style.setProperty("--i", i));
setIndex(document.querySelectorAll(".manifesto .line > span"));
setIndex(document.querySelectorAll(".menu a"));

/* ---------- Elements ---------- */

const hero = document.querySelector(".hero");
// hero, roles, manifesto and burger only exist on the home page; other pages reuse this file
const heroImg = hero?.querySelector(".hero__bg img");
const canvas = hero?.querySelector(".hero__gl");
const rolesEl = document.querySelector(".roles");
const manifesto = document.querySelector(".manifesto");
const burger = document.querySelector(".burger");
const burgerLines = burger?.querySelector(".burger__lines");
const logo = document.querySelector(".logo");
const menu = document.getElementById("menu");


/* ---------- Pointer ---------- */

const pointer = { x: innerWidth / 2, y: innerHeight / 2, moved: false };

addEventListener("pointermove", (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.moved = true;
}, { passive: true });

/* ---------- Parallax (soft, slightly underdamped) ---------- */

const par = { x: spring(0, 38, 10), y: spring(0, 38, 10) };

/* ---------- WebGL hero ---------- */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;      // canvas size (px)
uniform vec2 uImg;      // image size (px)
uniform vec2 uFocus;    // object-position equivalent
uniform float uReveal;
uniform float uTime;
uniform float uAmp;     // overall motion strength
uniform float uFlip;    // 1 = mirrored for right-to-left languages
varying vec2 vUv;

vec2 cover(vec2 uv) {
  float rs = uRes.x / uRes.y;
  float ri = uImg.x / uImg.y;
  vec2 s = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
  return uv * s + (1.0 - s) * uFocus;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // intro dolly; the image never follows the pointer
  float zoom = mix(1.035 + 0.125 * uAmp, 1.035, uReveal);
  vec2 uv = (vUv - 0.5) / zoom + 0.5;

  vec2 tuv = cover(uv);
  if (uFlip > 0.5) tuv.x = 1.0 - tuv.x;
  vec3 col = texture2D(uTex, tuv).rgb;

  // slow breathing on the moon's highlights
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col += col * smoothstep(0.55, 1.0, lum) * 0.035 * sin(uTime * 0.5);

  // exposure ramp for the intro
  col *= smoothstep(0.0, 1.0, uReveal);

  // fine animated film grain
  float n = hash(vUv * uRes + fract(uTime) * 917.0);
  col += (n - 0.5) * 0.045;

  gl_FragColor = vec4(col, 1.0);
}`;

function createGL() {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) return null;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, heroImg);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const u = {};
  for (const name of ["uTex", "uRes", "uImg", "uFocus", "uReveal", "uTime", "uAmp", "uFlip"]) {
    u[name] = gl.getUniformLocation(prog, name);
  }
  gl.uniform1i(u.uTex, 0);
  gl.uniform1f(u.uAmp, AMP);
  gl.uniform2f(u.uImg, heroImg.naturalWidth, heroImg.naturalHeight);

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(u.uRes, w, h);
    gl.uniform2f(u.uFocus, isMobile() ? 0.5 : 0.62, 0.5);
  };
  resize();
  addEventListener("resize", resize);

  return {
    draw(s) {
      gl.uniform1f(u.uReveal, s.reveal);
      gl.uniform1f(u.uTime, s.time);
      gl.uniform1f(u.uFlip, i18n.dir === "rtl" ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

let glView = null;
let heroVisible = true;
if (hero) new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);

/* ---------- Roles: per-item springs ---------- */

const roles = [...document.querySelectorAll(".role")].map((el) => ({
  el,
  x: spring(0, 160, 15),
  y: spring(0, 160, 15),
  o: spring(1, 90, 19),
  d: spring(0, 180, 16),
}));
let hoveredRole = -1;

roles.forEach((r, i) => {
  r.el.addEventListener("pointerenter", () => { hoveredRole = i; });
  r.el.addEventListener("pointerleave", () => { if (hoveredRole === i) hoveredRole = -1; });
});

function updateRoleTargets() {
  roles.forEach((r, i) => {
    const active = i === hoveredRole;
    r.o.target = hoveredRole === -1 ? 1 : active ? 1 : 0.26;
    r.d.target = active ? 1 : 0;
    if (active) {
      // magnetic pull toward the pointer, measured from the un-transformed box
      const b = r.el.getBoundingClientRect();
      const cx = b.left + b.width / 2 - r.x.x;
      const cy = b.top + b.height / 2 - r.y.x;
      // shift toward the page centre: left in LTR, right in RTL
      const inward = i18n.dir === "rtl" ? 1 : -1;
      r.x.target = inward * 18 + (pointer.x - cx) * 0.06;
      r.y.target = Math.max(-8, Math.min(8, (pointer.y - cy) * 0.35));
    } else {
      r.x.target = 0;
      r.y.target = 0;
    }
  });
}

/* ---------- Roles cycle: two at a time, looping ---------- */

const roleItems = rolesEl ? [...rolesEl.children] : [];
const pairs = [];
for (let i = 0; i < roleItems.length; i += 2) pairs.push(roleItems.slice(i, i + 2));
pairs.forEach((pair) => pair.forEach((li, j) => li.style.setProperty("--pair-i", j)));

const HOLD = 3400;    // time a pair stays on screen
const EXIT = 1300;    // exit transition + stagger
let pairIndex = -1;
let cycleTimer = 0;

function showPair(next) {
  if (!pairs.length) return;
  const prev = pairs[pairIndex];
  if (prev) {
    prev.forEach((li) => { li.classList.remove("is-in"); li.classList.add("is-out"); });
    // once it has left, drop it back under the mask without animating
    setTimeout(() => prev.forEach((li) => li.classList.remove("is-out")), EXIT);
  }
  pairIndex = next;
  pairs[pairIndex].forEach((li) => li.classList.add("is-in"));
}

function scheduleCycle(delay = HOLD) {
  if (!pairs.length) return;
  clearTimeout(cycleTimer);
  cycleTimer = setTimeout(() => {
    const paused = hoveredRole !== -1 || body.classList.contains("menu-open") || document.hidden;
    if (paused) return scheduleCycle(600);
    showPair((pairIndex + 1) % pairs.length);
    scheduleCycle();
  }, delay);
}

/* ---------- Magnetic logo + burger ---------- */

const magnets = [
  { el: burger, inner: burgerLines, radius: 110, pull: 0.4 },
  { el: logo, inner: null, radius: 120, pull: 0.22 },
  ...[...document.querySelectorAll("[data-magnet]")].map((el) => ({
    el,
    inner: el.querySelector("[data-magnet-inner]"),
    radius: Number(el.dataset.magnetRadius) || 90,
    pull: Number(el.dataset.magnetPull) || 0.25,
  })),
].filter((m) => m.el).map((m) => ({ ...m, x: spring(0, 150, 13), y: spring(0, 150, 13) }));

function updateMagnets() {
  if (!finePointer) return;
  for (const m of magnets) {
    const b = m.el.getBoundingClientRect();
    if (b.bottom < -200 || b.top > innerHeight + 200) { m.x.target = m.y.target = 0; continue; }
    const cx = b.left + b.width / 2 - m.x.x;
    const cy = b.top + b.height / 2 - m.y.x;
    const dx = pointer.x - cx;
    const dy = pointer.y - cy;
    const near = Math.hypot(dx, dy) < m.radius;
    m.x.target = near ? dx * m.pull : 0;
    m.y.target = near ? dy * m.pull : 0;
  }
}

/* ---------- Spring cursor ---------- */

const cursor = { el: document.querySelector(".cursor") };
if (finePointer) {
  body.classList.add("has-cursor");
  cursor.dot = cursor.el.querySelector(".cursor__dot");
  cursor.ring = cursor.el.querySelector(".cursor__ring");
  cursor.dx = spring(pointer.x, 900, 60);
  cursor.dy = spring(pointer.y, 900, 60);
  cursor.rx = spring(pointer.x, 170, 19);
  cursor.ry = spring(pointer.y, 170, 19);
  cursor.scale = spring(1, 220, 18);
  cursor.alpha = spring(0, 120, 22);
  cursor.press = false;

  addEventListener("pointerdown", () => { cursor.press = true; });
  addEventListener("pointerup", () => { cursor.press = false; });
  document.documentElement.addEventListener("pointerleave", () => { pointer.moved = false; });
}

function updateCursorTargets() {
  if (!cursor.dx) return;
  cursor.dx.target = cursor.rx.target = pointer.x;
  cursor.dy.target = cursor.ry.target = pointer.y;
  const hit = document.elementFromPoint(pointer.x, pointer.y);
  const interactive = hit && hit.closest("a, button, .role");
  cursor.scale.target = cursor.press ? 0.6 : interactive ? 1.9 : 1;
  cursor.alpha.target = pointer.moved ? 1 : 0;
}

/* ---------- About: word split, reveals, counters, card tilt ---------- */

function splitWords(el) {
  const text = el.textContent.trim();
  el.setAttribute("aria-label", text);
  el.innerHTML = text
    .split(/\s+/)
    .map((w, i) => `<span class="word" aria-hidden="true"><span style="--w:${i}">${w.replace(/[&<>]/g, (c) => `&#${c.charCodeAt(0)};`)}</span></span>`)
    .join(" ");
}

const splitEls = [...document.querySelectorAll("[data-split]")];
splitEls.forEach(splitWords);
i18n.onChange(() => splitEls.forEach(splitWords));

const stats = [...document.querySelectorAll(".stat")];
stats.forEach((el, i) => el.style.setProperty("--i", i));
document.querySelectorAll(".post").forEach((el, i) => el.style.setProperty("--i", i));
[".result", ".index__row", ".channels > li", ".essay"].forEach((sel) => setIndex(document.querySelectorAll(sel)));

const fmtCount = (el, n) => {
  const pad = Number(el.dataset.pad || 0);
  const dec = Number(el.dataset.decimals || 0);
  return n.toFixed(dec).padStart(pad + (dec ? dec + 1 : 0), "0");
};

function countUp(el) {
  const to = Number(el.dataset.count);
  if (reduceMotion) { el.textContent = fmtCount(el, to); return; }
  const start = performance.now();
  const duration = 1800 + to * 12;
  const tick = (now) => {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = fmtCount(el, t >= 1 ? to : to * (1 - Math.pow(2, -10 * t)));
    if (t < 1) requestAnimationFrame(tick);
  };
  el.textContent = fmtCount(el, 0);
  requestAnimationFrame(tick);
}

const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const el = entry.target;
    el.classList.add("is-visible");
    revealObserver.unobserve(el);
    const counter = el.querySelector("[data-count]");
    if (counter) setTimeout(() => countUp(counter), 250 + Number(el.style.getPropertyValue("--i") || 0) * 120);
  }
}, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });

document.querySelectorAll("[data-reveal]").forEach((el) => revealObserver.observe(el));
// counters start at zero so the count-up never flashes the final number first
document.querySelectorAll("[data-count]").forEach((el) => { el.textContent = fmtCount(el, 0); });

/* ---------- Inventions: pointer-following light on the dark cards ---------- */

if (finePointer) {
  document.querySelectorAll("[data-spotlight]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const b = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${((e.clientX - b.left) / b.width) * 100}%`);
      card.style.setProperty("--my", `${((e.clientY - b.top) / b.height) * 100}%`);
    });
  });
}

/* ---------- Footer ---------- */

document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = String(new Date().getFullYear()); });

document.querySelector("[data-totop]")?.addEventListener("click", (e) => {
  e.preventDefault();
  scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
});

/* ---------- Main loop ---------- */

const reveal = { value: 0, start: 0, duration: reduceMotion ? 600 : 1500 };
const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
let last = performance.now();

function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;

  // targets
  par.x.target = (pointer.x / innerWidth) * 2 - 1;
  par.y.target = (pointer.y / innerHeight) * 2 - 1;

  updateRoleTargets();
  updateMagnets();
  updateCursorTargets();

  // integrate with fixed sub-steps for stability
  const steps = Math.ceil(dt / (1 / 240));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) for (const s of springs) s.step(h);

  // apply
  const px = par.x.x * AMP, py = par.y.x * AMP;
  if (rolesEl) rolesEl.style.transform = `translate3d(${px * 8}px, ${py * 5}px, 0)`;
  if (manifesto) manifesto.style.transform = `translate3d(${px * 5}px, ${py * 3}px, 0)`;

  for (const r of roles) {
    r.el.style.transform = `translate3d(${r.x.x.toFixed(2)}px, ${r.y.x.toFixed(2)}px, 0)`;
    r.el.style.opacity = r.o.x.toFixed(3);
    r.el.style.setProperty("--dash", Math.max(0, r.d.x).toFixed(3));
  }

  for (const m of magnets) {
    m.el.style.transform = `translate3d(${m.x.x.toFixed(2)}px, ${m.y.x.toFixed(2)}px, 0)`;
    if (m.inner) m.inner.style.transform = `translate3d(${(m.x.x * 0.35).toFixed(2)}px, ${(m.y.x * 0.35).toFixed(2)}px, 0)`;
  }

  if (cursor.dx) {
    const s = cursor.scale.x;
    cursor.dot.style.transform = `translate3d(${cursor.dx.x}px, ${cursor.dy.x}px, 0)`;
    cursor.ring.style.transform = `translate3d(${cursor.rx.x}px, ${cursor.ry.x}px, 0) scale(${s})`;
    cursor.el.style.opacity = Math.max(0, Math.min(1, cursor.alpha.x)).toFixed(3);
  }

  if (reveal.start) reveal.value = expoOut((now - reveal.start) / reveal.duration);

  if (glView && heroVisible && !document.hidden) {
    glView.draw({
      reveal: reveal.value,
      time: now / 1000,
    });
  }

  requestAnimationFrame(frame);
}

/* ---------- Intro ---------- */

const imgReady = !heroImg || (heroImg.complete && heroImg.naturalWidth)
  ? Promise.resolve()
  : new Promise((r) => {
      heroImg.addEventListener("load", r, { once: true });
      heroImg.addEventListener("error", r, { once: true });
    });
const timeout = new Promise((r) => setTimeout(r, 900));

Promise.race([imgReady, timeout]).then(() => {
  if (heroImg?.naturalWidth) {
    try {
      glView = createGL();
      if (glView) body.classList.add("has-gl");
    } catch (err) {
      console.warn("WebGL hero disabled:", err);
      glView = null;
    }
  }

  requestAnimationFrame(() => {
    body.classList.remove("is-loading");
    setTimeout(() => { showPair(0); scheduleCycle(); }, reduceMotion ? 100 : 450);
    reveal.start = window.__introStart || performance.now();
  });

  requestAnimationFrame(frame);
});

/* ---------- Menu ---------- */

function setMenu(open) {
  if (!burger || !menu) return;
  if (open) {
    const b = burger.getBoundingClientRect();
    menu.style.setProperty("--ox", `${b.left + b.width / 2}px`);
    menu.style.setProperty("--oy", `${b.top + b.height / 2}px`);
  }
  body.classList.toggle("menu-open", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", i18n.t(open ? "nav.close" : "nav.open"));
  menu.setAttribute("aria-hidden", String(!open));
  menu.inert = !open;
}

burger?.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
menu?.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
burger?.setAttribute("aria-label", i18n.t("nav.open"));
i18n.onChange(() => setMenu(body.classList.contains("menu-open")));
addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

/* ---------- page change fallback: a short fade where view transitions are missing ---------- */
if (!("onpagereveal" in window)) {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
    e.preventDefault();
    document.documentElement.classList.add("is-leaving");
    setTimeout(() => { location.href = url.href; }, 170);
  });
  addEventListener("pageshow", () => document.documentElement.classList.remove("is-leaving"));
}

/* ---------- Research desk: PDF reader (PDF.js, loaded on approach) ---------- */

(() => {
  const reader = document.querySelector(".reader[data-pdf]");
  if (!reader) return;
  const canvas = reader.querySelector(".reader__canvas");
  const stage = reader.querySelector(".reader__stage");
  const thumbs = reader.querySelector(".reader__thumbs");
  const pageEl = reader.querySelector("[data-page]");
  const totalEl = reader.querySelector("[data-total]");
  const prevBtn = reader.querySelector('[data-act="prev"]');
  const nextBtn = reader.querySelector('[data-act="next"]');
  const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
  let doc = null, page = 1, busy = false, queued = null;

  const loadScript = (src) => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });

  async function draw(n, dir = 1) {
    if (!doc) return;
    if (busy) { queued = [n, dir]; return; }
    busy = true;
    n = Math.max(1, Math.min(doc.numPages, n));
    const turning = n !== page && reader.classList.contains("is-ready");
    if (turning) {
      reader.style.setProperty("--dir", dir);
      reader.classList.add("is-turning");
      await new Promise((r) => setTimeout(r, 160));
    }
    page = n;
    const p = await doc.getPage(n);
    const base = p.getViewport({ scale: 1 });
    const box = stage.getBoundingClientRect();
    const fit = Math.min((box.width - 24) / base.width, (box.height - 24) / base.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const vp = p.getViewport({ scale: fit * dpr });
    const off = document.createElement("canvas");
    off.width = Math.floor(vp.width); off.height = Math.floor(vp.height);
    await p.render({ canvasContext: off.getContext("2d"), viewport: vp }).promise;
    canvas.width = off.width; canvas.height = off.height;
    canvas.style.width = `${Math.floor(vp.width / dpr)}px`;
    canvas.style.height = `${Math.floor(vp.height / dpr)}px`;
    canvas.getContext("2d").drawImage(off, 0, 0);
    pageEl.textContent = n;
    prevBtn.disabled = n <= 1; nextBtn.disabled = n >= doc.numPages;
    thumbs.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-current", String(i + 1 === n)));
    reader.classList.add("is-ready");
    reader.classList.remove("is-turning");
    busy = false;
    if (queued) { const q = queued; queued = null; draw(...q); }
  }

  async function makeThumbs() {
    for (let i = 1; i <= doc.numPages; i++) {
      const p = await doc.getPage(i);
      const vp = p.getViewport({ scale: 80 / p.getViewport({ scale: 1 }).width });
      const c = document.createElement("canvas");
      c.width = vp.width; c.height = vp.height;
      await p.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
      const li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", `Page ${i}`); b.appendChild(c);
      b.addEventListener("click", () => draw(i, i > page ? 1 : -1));
      li.appendChild(b); thumbs.appendChild(li);
    }
    thumbs.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-current", String(i + 1 === page)));
  }

  async function boot() {
    try {
      if (!window.pdfjsLib) await loadScript(PDFJS + "pdf.min.js");
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js";
      doc = await window.pdfjsLib.getDocument(reader.dataset.pdf).promise;
      totalEl.textContent = doc.numPages;
      await draw(1);
      makeThumbs();
    } catch (err) {
      console.warn("PDF reader unavailable:", err);
      reader.classList.add("is-failed");
    }
  }

  new IntersectionObserver((entries, o) => {
    if (entries.some((e) => e.isIntersecting)) { o.disconnect(); boot(); }
  }, { rootMargin: "600px 0px" }).observe(reader);

  prevBtn.addEventListener("click", () => draw(page - 1, -1));
  nextBtn.addEventListener("click", () => draw(page + 1, 1));
  reader.querySelectorAll("[data-goto]").forEach((b) => b.addEventListener("click", () => { const n = +b.dataset.goto; draw(n, n > page ? 1 : -1); }));
  reader.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); draw(page + 1, 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); draw(page - 1, -1); }
  });
  reader.querySelector('[data-act="full"]').addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen(); else reader.requestFullscreen?.();
  });
  let rt = 0;
  const redraw = () => { clearTimeout(rt); rt = setTimeout(() => doc && draw(page), 150); };
  addEventListener("resize", redraw);
  document.addEventListener("fullscreenchange", redraw);
})();

/* ---------- Research desk: live SAS model (equations 1–5 of the paper) ---------- */

(() => {
  const lab = document.querySelector(".lab");
  if (!lab) return;
  const inputs = Object.fromEntries([...lab.querySelectorAll("[data-in]")].map((el) => [el.dataset.in, el]));
  const outs = (k) => lab.querySelector(`[data-out="${k}"]`);
  const PRESETS = {
    cafe:   { theta: 12, mis: 0.08, fin: 0,    dist: 0.15, time: 0.1,  rho: 0.95, sig: 0.9 },
    bar:    { theta: 18, mis: 0.82, fin: 0.1,  dist: 0.2,  time: 0.1,  rho: 0.9,  sig: 0.95 },
    far:    { theta: 8,  mis: 0.06, fin: 0.6,  dist: 1.5,  time: 0.6,  rho: 0.95, sig: 0.9 },
    unsafe: { theta: 10, mis: 0.1,  fin: 0.05, dist: 0.2,  time: 0.1,  rho: 0.14, sig: 0.7 },
  };
  const val = (k) => parseFloat(inputs[k].value);
  const shown = { sas: 0, avg: 0 };
  let target = { sas: 0, avg: 0 }, raf = 0;

  const model = (x) => {
    const v = Math.cos((x.theta * Math.PI) / 180), i = 1 - x.mis, f = Math.exp(-(x.fin + x.dist + x.time));
    const rs = x.rho * x.sig, s = rs / (1 + Math.abs(1 - rs));
    return { v, i, f, s, sas: v * i * f * s };
  };
  const signals = () => Object.fromEntries(Object.keys(inputs).map((k) => [k, val(k)]));

  // the "voice" of the model: verdict, strongest and weakest signal, and a fix it has actually tested
  const FIX = { v: { theta: 10 }, i: { mis: 0.08 }, f: { fin: 0.1, dist: 0.1, time: 0.1 }, s: { rho: 0.95, sig: 0.85 } };
  let vt = 0, typing = 0;
  function scheduleVerdict({ terms, sas, weak }) {
    clearTimeout(vt); clearInterval(typing);
    lab.classList.add("is-thinking");
    outs("state").textContent = i18n.t("desk.verdict.thinking");
    outs("state").className = "verdict__state";
    vt = setTimeout(() => {
      const x = signals();
      const strong = Object.entries(terms).sort((a, b) => b[1] - a[1])[0][0];
      const state = x.rho < 0.3 ? "hold" : sas >= 0.45 ? "go" : sas >= 0.2 ? "tweak" : "hold";
      const fixed = model({ ...x, ...FIX[weak] }).sas;
      const parts = [
        i18n.t(`desk.verdict.${state}`),
        i18n.t(`desk.why.strong.${strong}`).replace("{value}", terms[strong].toFixed(2)),
      ];
      if (weak !== strong) {
        const key = state === "go" ? "desk.why.soft" : `desk.why.weak.${weak}`;
        parts.push(i18n.t(key).replace("{name}", i18n.t(`desk.term.${weak}`).toLowerCase()).replace("{value}", terms[weak].toFixed(2)));
      }
      if (x.rho < 0.3) parts.push(i18n.t("desk.why.gate"));
      else if (state !== "go" && fixed > sas + 0.02) parts.push(i18n.t(`desk.why.fix.${weak}`).replace("{to}", fixed.toFixed(2)));
      else parts.push(i18n.t("desk.why.fine"));
      const text = parts.join(" ");
      lab.classList.remove("is-thinking");
      outs("state").textContent = i18n.t(`desk.verdict.state.${state}`);
      outs("state").className = `verdict__state is-${state}`;
      const el = outs("verdict");
      if (reduceMotion) { el.textContent = text; return; }
      let n = 0; el.textContent = "";
      typing = setInterval(() => { n += 2; el.textContent = text.slice(0, n); if (n >= text.length) clearInterval(typing); }, 14);
    }, reduceMotion ? 0 : 420);
  }

  function compute() {
    const t0 = performance.now();
    const v = Math.cos((val("theta") * Math.PI) / 180);                 // Eq. 2, from the angle between U_ab and V_v
    const i = 1 - val("mis");                                            // Eq. 3
    const f = Math.exp(-(val("fin") + val("dist") + val("time")));       // Eq. 4 with α = β = γ = 1
    const rs = val("rho") * val("sig");
    const s = rs / (1 + Math.abs(1 - rs));                               // Eq. 5
    const terms = { v, i, f, s };
    const sas = v * i * f * s;                                           // Eq. 1
    const avg = (v + i + f + s) / 4;
    outs("ms").textContent = Math.max(0.01, performance.now() - t0).toFixed(2);
    const weak = Object.entries(terms).sort((a, b) => a[1] - b[1])[0][0];
    for (const [k, x] of Object.entries(terms)) {
      const row = lab.querySelector(`[data-term-row="${k}"]`);
      row.querySelector("i").style.setProperty("--v", x.toFixed(4));
      row.classList.toggle("is-weak", k === weak);
      outs(k).textContent = x.toFixed(2);
      lab.querySelector(`[data-term="${k}"]`).classList.toggle("is-weak", k === weak);
    }
    for (const [k, el] of Object.entries(inputs)) {
      const o = lab.querySelector(`[data-val="${k}"]`);
      o.textContent = k === "theta" ? `${el.value}°` : (+el.value).toFixed(2);
    }
    scheduleVerdict({ terms, sas, weak });
    target = { sas, avg };
    if (!raf) raf = requestAnimationFrame(tick);
  }

  // numbers ease toward the new value instead of jumping
  function tick() {
    let moving = false;
    for (const k of ["sas", "avg"]) {
      const d = target[k] - shown[k];
      if (Math.abs(d) > 0.0005) { shown[k] += d * 0.18; moving = true; } else shown[k] = target[k];
      outs(k).textContent = shown[k].toFixed(2);
    }
    raf = moving ? requestAnimationFrame(tick) : 0;
  }

  // presets glide the sliders to their values
  function applyPreset(name) {
    const to = PRESETS[name], from = Object.fromEntries(Object.keys(to).map((k) => [k, val(k)]));
    const t0 = performance.now(), dur = reduceMotion ? 0 : 700;
    lab.querySelectorAll("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.preset === name)));
    const step = (now) => {
      const t = dur ? Math.min(1, (now - t0) / dur) : 1;
      const e = 1 - Math.pow(1 - t, 3);
      for (const k in to) inputs[k].value = (from[k] + (to[k] - from[k]) * e).toFixed(3);
      compute();
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  Object.values(inputs).forEach((el) => el.addEventListener("input", () => {
    lab.querySelectorAll("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", "false"));
    compute();
  }));
  lab.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => applyPreset(b.dataset.preset)));
  i18n.onChange(compute);
  applyPreset("cafe");
})();

/* ---------- Contact popup ---------- */

(() => {
  const dlg = document.getElementById("contact-form");
  if (!dlg) return;
  const form = dlg.querySelector(".cf__form");
  const done = dlg.querySelector(".cf__done");
  const sendBtn = form.querySelector(".cf__send");
  const sendLabel = form.querySelector(".cf__send-label");
  const serverErr = form.querySelector(".cf__server-err");
  const count = form.querySelector(".cf-count b");
  const ENDPOINT = "https://formsubmit.co/ajax/hamzades7@gmail.com";
  const t = (k) => i18n.t(k);
  let attempted = false, closing = 0;

  const field = (k) => form.querySelector(`[data-field="${k}"]`);
  const value = (k) => k === "topic" ? (form.querySelector('input[name="topic"]:checked')?.value || "") : form.elements[k].value.trim();
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  function check(k) {
    const v = value(k);
    if (k === "name" && !v) return t("cf.err.name");
    if (k === "email" && !v) return t("cf.err.email");
    if (k === "email" && !isEmail(v)) return t("cf.err.emailBad");
    if (k === "topic" && !v) return t("cf.err.topic");
    if (k === "message" && v.length < 10) return t("cf.err.message");
    return "";
  }
  function show(k, msg) {
    const f = field(k);
    f.classList.toggle("is-error", !!msg);
    f.querySelector(".cf-field__err").textContent = msg;
    const input = f.querySelector("input:not([type=radio]), textarea");
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
  }
  const KEYS = ["name", "email", "topic", "message"];

  // while typing: an error disappears as soon as you edit that field
  // after a failed send: a field is re-checked when you leave it, never mid-word
  ["name", "email", "message"].forEach((k) => {
    const el = form.elements[k];
    el.addEventListener("input", () => { if (field(k).classList.contains("is-error")) show(k, ""); serverErr.hidden = true; });
    el.addEventListener("blur", () => { if (attempted && el.value.trim()) show(k, check(k)); });
  });
  // the message hint follows the topic, so each kind of sender knows what to include
  const hint = (k) => {
    const ta = form.elements.message;
    ta.dataset.i18nAttr = `placeholder:cf.hint.${k}`;
    ta.placeholder = t(`cf.hint.${k}`);
  };
  form.querySelectorAll('input[name="topic"]').forEach((r) => r.addEventListener("change", () => { show("topic", ""); hint(r.dataset.hint); }));

  const msg = form.elements.message;
  const grow = () => { msg.style.height = "auto"; msg.style.height = `${Math.min(msg.scrollHeight, 360)}px`; count.textContent = msg.value.length; };
  msg.addEventListener("input", grow);

  function open(from) {
    const b = from?.getBoundingClientRect();
    if (b) { dlg.style.setProperty("--ox", `${b.left + b.width / 2 - 24}px`); dlg.style.setProperty("--oy", `${b.top + b.height / 2 - 24}px`); }
    clearTimeout(closing);
    // a button can preselect the topic, e.g. "request the other papers" opens on Research
    const pick = from?.dataset.topic && form.querySelector(`input[name="topic"][data-hint="${from.dataset.topic}"]`);
    if (pick && !dlg.classList.contains("is-done")) { pick.checked = true; pick.dispatchEvent(new Event("change", { bubbles: true })); }
    dlg.showModal();
    document.documentElement.classList.add("cf-lock");
    body.classList.remove("has-cursor");
    requestAnimationFrame(() => requestAnimationFrame(() => dlg.classList.add("is-open")));
    setTimeout(() => (done.hidden ? form.elements.name : done.querySelector("[data-cf-close]")).focus({ preventScroll: true }), reduceMotion ? 0 : 520);
  }
  function close() {
    if (!dlg.open) return;
    dlg.classList.remove("is-open");
    closing = setTimeout(() => {
      dlg.close();
      document.documentElement.classList.remove("cf-lock");
      if (finePointer) body.classList.add("has-cursor");
      if (dlg.classList.contains("is-done")) reset();
    }, reduceMotion ? 0 : 720);
  }
  function reset() {
    form.reset(); grow(); attempted = false; hint("default");
    KEYS.forEach((k) => show(k, ""));
    serverErr.hidden = true;
    dlg.classList.remove("is-done", "is-sending");
    done.hidden = true; form.hidden = false;
  }

  document.querySelectorAll("[data-contact-open]").forEach((a) => a.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault(); open(a);
  }));
  dlg.querySelectorAll("[data-cf-close]").forEach((b) => b.addEventListener("click", close));
  dlg.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
  dlg.querySelector("[data-cf-again]").addEventListener("click", () => { reset(); form.elements.name.focus(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (dlg.classList.contains("is-sending")) return;
    attempted = true;
    const errors = KEYS.map((k) => [k, check(k)]);
    errors.forEach(([k, m]) => show(k, m));
    const first = errors.find(([, m]) => m);
    if (first) {
      const f = field(first[0]);
      (f.querySelector("input:not([type=radio]), textarea") || f.querySelector("input")).focus();
      f.classList.remove("is-shake"); void f.offsetWidth; f.classList.add("is-shake");
      return;
    }
    if (form.elements._honey.value) return;   // bots fill the hidden field; people never see it

    const ref = "HL-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const data = { name: value("name"), email: value("email"), topic: value("topic"), message: value("message") };
    dlg.classList.add("is-sending");
    sendBtn.disabled = true;
    sendLabel.textContent = t("cf.sending");
    serverErr.hidden = true;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...data, reference: ref, page: location.href,
          _subject: `intelotfi · ${data.topic} · ${data.name}`,
          _replyto: data.email, _template: "table", _captcha: "false",
        }),
        signal: ctrl.signal,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || String(json.success) !== "true") throw new Error(json.message || `HTTP ${res.status}`);
      dlg.querySelector('[data-out="cf-done-title"]').textContent = t("cf.done.title").replace("{name}", data.name.split(/\s+/)[0]);
      dlg.querySelector('[data-out="cf-done-text"]').textContent = t("cf.done.text").replace("{email}", data.email);
      dlg.querySelector('[data-out="cf-ref"]').textContent = ref;
      form.hidden = true; done.hidden = false;
      dlg.classList.add("is-done");
      dlg.querySelector(".cf__main").scrollTop = 0;
      done.querySelector("[data-cf-close]").focus({ preventScroll: true });
    } catch (err) {
      console.warn("contact form:", err);
      const offline = !navigator.onLine || err.name === "AbortError" || err instanceof TypeError;
      serverErr.innerHTML = `${t(offline ? "cf.err.network" : "cf.err.server")} <a href="mailto:hamzades7@gmail.com?subject=${encodeURIComponent("intelotfi · " + data.topic)}&body=${encodeURIComponent(data.message)}">hamzades7@gmail.com</a>`;
      serverErr.hidden = false;
    } finally {
      clearTimeout(timer);
      dlg.classList.remove("is-sending");
      sendBtn.disabled = false;
      sendLabel.textContent = t("cf.send");
    }
  });

  i18n.onChange(() => { if (attempted) KEYS.forEach((k) => { if (field(k).classList.contains("is-error")) show(k, check(k)); }); });
})();

/* ---------- Loupe: round glass magnifier for text fields ----------
   Press and hold inside a field (or drag to select) and a glass shows the
   text under the pointer, enlarged. iOS draws its own, so it is skipped there. */

(() => {
  const loupe = document.querySelector(".loupe");
  if (!loupe) return;
  const content = loupe.querySelector(".loupe__content");
  const isIOS = /iP(hone|ad|od)/.test(navigator.platform) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) return;
  const SIZE = 118, ZOOM = 1.7;
  const COPY = ["fontFamily", "fontSize", "fontWeight", "letterSpacing", "lineHeight", "textAlign", "direction", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "color"];

  function build(el) {
    const cs = getComputedStyle(el);
    COPY.forEach((p) => { content.style[p] = cs[p]; });
    content.style.width = `${el.clientWidth}px`;
    content.style.height = `${el.clientHeight}px`;
    content.style.background = getComputedStyle(el.closest(".cf__main") || document.body).backgroundColor || "#fff";
    const single = el.tagName === "INPUT";
    content.style.whiteSpace = single ? "pre" : "pre-wrap";
    if (single) content.style.lineHeight = `${el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)}px`;
    content.textContent = el.value || el.placeholder || " ";
    content.dataset.sx = el.scrollLeft; content.dataset.sy = el.scrollTop;
  }
  function move(el, x, y) {
    const r = el.getBoundingClientRect();
    const px = x - r.left + (+content.dataset.sx || 0), py = y - r.top + (+content.dataset.sy || 0);
    content.style.transform = `translate(${SIZE / 2 - px * ZOOM}px, ${SIZE / 2 - py * ZOOM}px) scale(${ZOOM})`;
    let lx = x - SIZE / 2, ly = y - SIZE - 34;
    if (ly < 8) ly = y + 34;
    lx = Math.max(8, Math.min(innerWidth - SIZE - 8, lx));
    loupe.style.setProperty("--lx", `${lx}px`);
    loupe.style.setProperty("--ly", `${ly}px`);
  }

  document.querySelectorAll("[data-loupe]").forEach((el) => {
    let timer = 0, on = false, start = null;
    const end = () => { clearTimeout(timer); timer = 0; start = null; if (on) { on = false; loupe.classList.remove("is-on"); } };
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      timer = setTimeout(() => {
        on = true; build(el); move(el, start.lastX ?? start.x, start.lastY ?? start.y);
        // an open <dialog> sits in the top layer, so the glass has to live inside it to show
        const host = el.closest("dialog") || document.body;
        if (loupe.parentNode !== host) host.appendChild(loupe);
        loupe.classList.add("is-on");
        try { el.setPointerCapture(start.id); } catch {}
      }, e.pointerType === "mouse" ? 280 : 380);
    });
    el.addEventListener("pointermove", (e) => {
      if (!start) return;
      start.lastX = e.clientX; start.lastY = e.clientY;
      if (on) { build(el); move(el, e.clientX, e.clientY); return; }
      // a touch that moves before the hold completes is a scroll, not a hold
      if (e.pointerType !== "mouse" && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) end();
    });
    ["pointerup", "pointercancel", "blur"].forEach((n) => el.addEventListener(n, end));
    el.addEventListener("input", () => { if (on) build(el); });
  });
})();

/* ---------- Build ledger + proof lines ----------
   Numbers count up once they're on screen; the chart is drawn from the
   weekly commit counts embedded in the page (read from git, not estimated). */

(() => {
  const fmt = (n) => new Intl.NumberFormat(i18n.lang === "ar" ? "en-US" : i18n.lang).format(n);
  const counters = [...document.querySelectorAll(".ledger [data-to], .proof [data-to]")];
  const run = (el) => {
    const to = Number(el.dataset.to);
    el.dataset.done = "1";
    if (reduceMotion) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 1600 + Math.min(to, 400) * 2;
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = fmt(p >= 1 ? to : Math.round(to * (1 - Math.pow(2, -10 * p))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  counters.forEach((el) => { el.textContent = fmt(0); });
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      e.target.querySelectorAll("[data-to]").forEach((el, i) => setTimeout(() => run(el), 200 + i * 140));
    }
  }, { threshold: 0.35 });
  document.querySelectorAll(".ledger__stats, .proof").forEach((el) => io.observe(el));
  i18n.onChange(() => counters.forEach((el) => { if (el.dataset.done) el.textContent = fmt(Number(el.dataset.to)); }));

  const plot = document.querySelector(".ledger__plot");
  const src = document.getElementById("ledger-data");
  if (!plot || !src) return;
  const { start, weeks, marks } = JSON.parse(src.textContent);
  const readout = document.querySelector(".ledger__readout");
  const day0 = new Date(start + "T00:00:00");
  const max = Math.max(...weeks.map(([a, s]) => a + s));
  const weekDate = (i) => new Date(day0.getTime() + i * 7 * 864e5);

  const cols = weeks.map(([a, s], i) => {
    const col = document.createElement("div");
    col.className = "ledger__col" + (a + s ? "" : " is-empty");
    col.style.setProperty("--i", i);
    for (const [n, kind] of [[a, "app"], [s, "site"]]) {
      if (!n) continue;
      const bar = document.createElement("i");
      bar.className = `ledger__bar ledger__bar--${kind}`;
      bar.style.height = `${(n / max) * 100}%`;
      bar.style.setProperty("--i", i);
      col.appendChild(bar);
    }
    plot.appendChild(col);
    return col;
  });

  const markEls = marks.map(([d, key, flip], k) => {
    const i = Math.floor((new Date(d + "T00:00:00") - day0) / (7 * 864e5));
    const m = document.createElement("span");
    m.className = "ledger__mark" + (flip ? " is-end" : "") + (k > 0 && k < marks.length - 1 ? " is-mid" : "");
    m.style.insetInlineStart = `${((i + 0.5) / weeks.length) * 100}%`;
    m.innerHTML = "<span></span>";
    m.firstChild.dataset.i18n = key;
    m.firstChild.textContent = i18n.t(key);
    plot.appendChild(m);
    return m;
  });
  // direction: the chart reads in time order, so it flips with the page in Arabic
  i18n.onChange(() => { markEls.forEach((m) => { m.firstChild.textContent = i18n.t(m.firstChild.dataset.i18n); }); if (cur >= 0) show(cur); });

  let cur = -1;
  const show = (i) => {
    cur = i;
    cols.forEach((c, k) => c.classList.toggle("is-on", k === i));
    plot.classList.add("is-scrub");
    const [a, s] = weeks[i];
    const date = weekDate(i).toLocaleDateString(i18n.lang, { day: "numeric", month: "short", year: "numeric" });
    readout.textContent = `${i18n.t("ledger.week").replace("{date}", date)} · ` +
      (a + s ? i18n.t("ledger.tip").replace("{app}", a).replace("{site}", s) : i18n.t("ledger.quiet"));
  };
  const clear = () => { cur = -1; cols.forEach((c) => c.classList.remove("is-on")); plot.classList.remove("is-scrub"); readout.textContent = ""; };
  const at = (x) => {
    const r = plot.getBoundingClientRect();
    let f = (x - r.left) / r.width;
    if (i18n.dir === "rtl") f = 1 - f;
    return Math.max(0, Math.min(weeks.length - 1, Math.floor(f * weeks.length)));
  };
  plot.tabIndex = 0;
  plot.addEventListener("pointermove", (e) => show(at(e.clientX)));
  plot.addEventListener("pointerdown", (e) => show(at(e.clientX)));
  plot.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") clear(); });
  plot.addEventListener("blur", clear);
  plot.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const d = i18n.dir === "rtl" ? -step : step;
    show(Math.max(0, Math.min(weeks.length - 1, (cur < 0 ? (d > 0 ? -1 : weeks.length) : cur) + d)));
  });
})();

/* ---------- Quiet parallax ----------
   Layers drift a few pixels at slightly different speeds as the page scrolls,
   enough to feel depth, too little to notice. Uses the `translate` property so it
   never fights the reveal transforms. The hero is left still on purpose. */

(() => {
  if (reduceMotion) return;
  const LAYERS = [
    [".eyebrow, .work__eyebrow, .ledger__k", 0.07, 22],
    [".sec__title, .work__title, .about__title, .contact__title, .ledger__title, .paper__title", 0.04, 16],
    [".sec__lede, .work__lede, .about__lede, .contact__lede, .essays-block__lede", 0.02, 10],
    [".stat__value, .result__value, .ledger__stat dd", 0.03, 12],
    [".subject__icon, .essay__motif", -0.035, 14],
    [".post__img", -0.05, 14],
  ];
  const items = [];
  for (const [sel, f, max] of LAYERS) {
    document.querySelectorAll(sel).forEach((el) => {
      if (el.closest(".hero, dialog")) return;
      items.push({ el, f, max, y: 0, img: el.classList.contains("post__img") });
    });
  }
  // images get a touch of headroom so their edges never show while drifting
  items.forEach((it) => { if (it.img) it.el.style.scale = "1.06"; });

  let queued = false;
  const update = () => {
    queued = false;
    const mid = innerHeight / 2;
    for (const it of items) {
      const r = it.el.getBoundingClientRect();
      const top = r.top - it.y;   // undo our own offset so the measure stays stable
      if (top > innerHeight * 1.4 || top + r.height < -innerHeight * 0.4) continue;
      const d = top + r.height / 2 - mid;
      const y = Math.max(-it.max, Math.min(it.max, d * it.f));
      if (Math.abs(y - it.y) < 0.1) continue;
      it.y = y;
      it.el.style.translate = `0 ${y.toFixed(2)}px`;
    }
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  queue();
})();
