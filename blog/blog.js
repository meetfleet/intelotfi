const body = document.body;

/* ---------- Title word split ---------- */

document.querySelectorAll("[data-split]").forEach((el) => {
  const text = el.textContent.trim();
  el.setAttribute("aria-label", text);
  el.innerHTML = text
    .split(/\s+/)
    .map((w, i) => `<span class="word" aria-hidden="true"><span style="--w:${i}">${w.replace(/[&<>]/g, (c) => `&#${c.charCodeAt(0)};`)}</span></span>`)
    .join(" ");
});

/* ---------- Reading time ---------- */

const words = document.getElementById("article").textContent.trim().split(/\s+/).length;
document.getElementById("reading-time").textContent = `${Math.max(1, Math.round(words / 220))} min`;

/* ---------- Intro: stagger, then release ---------- */

document.querySelectorAll(".intro [data-reveal]").forEach((el, i) => el.style.setProperty("--delay", `${i * 120}ms`));

const ready = document.fonts ? document.fonts.ready : Promise.resolve();
Promise.race([ready, new Promise((r) => setTimeout(r, 1500))]).then(() => {
  requestAnimationFrame(() => {
    body.classList.remove("is-loading");
    document.querySelectorAll(".intro [data-reveal], .cover[data-reveal]").forEach((el) => el.classList.add("is-visible"));
  });
});

/* ---------- Scroll reveals for everything below the fold ---------- */

const revealObserver = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add("is-visible");
    revealObserver.unobserve(e.target);
  }
}, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

document.querySelectorAll(".article [data-reveal]").forEach((el) => revealObserver.observe(el));

/* ---------- Reading progress ---------- */

const progress = document.querySelector(".progress span");
const article = document.getElementById("article");

function updateProgress() {
  const top = article.getBoundingClientRect().top + scrollY;
  const span = article.offsetHeight - innerHeight;
  const p = span > 0 ? (scrollY - top) / span : 1;
  progress.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(4));
}

addEventListener("scroll", updateProgress, { passive: true });
addEventListener("resize", updateProgress);
updateProgress();

/* ---------- Contents: highlight the section being read ---------- */

const tocLinks = [...document.querySelectorAll(".toc__list a")];
const sections = tocLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);

function setActive(id) {
  tocLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
}

const spy = new IntersectionObserver((entries) => {
  // the topmost section that crosses the reading line wins
  const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
  if (visible.length) setActive(visible[0].target.id);
}, { rootMargin: "-20% 0px -65% 0px", threshold: 0 });

sections.forEach((s) => spy.observe(s));

/* ---------- Devices: WebGL zoom ---------- */

document.querySelectorAll(".device").forEach((el, i) => el.style.setProperty("--i", i));

// damped spring; interrupting it keeps its velocity, which is what makes the
// fly-out feel physical
class Spring {
  constructor(v, k, c) { this.x = v; this.target = v; this.v = 0; this.k = k; this.c = c; }
  step(dt) { const a = -this.k * (this.x - this.target) - this.c * this.v; this.v += a * dt; this.x += this.v * dt; }
  get settled() { return Math.abs(this.x - this.target) < 0.05 && Math.abs(this.v) < 0.5; }
}

const zoom = (() => {
  const root = document.getElementById("zoom");
  if (!root) return null;
  const canvas = root.querySelector(".zoom__gl");
  const fallback = root.querySelector(".zoom__fallback");
  const nameEl = root.querySelector(".zoom__name");
  const indexEl = root.querySelector(".zoom__index");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
  const FRAG = `
    precision highp float;
    uniform sampler2D uTex;
    uniform vec2 uRes;      // canvas px
    uniform vec4 uRect;     // image rect in canvas px: x, y (from top), w, h
    uniform float uBlur;    // zoom-blur strength, 0..1
    uniform float uDim;     // backdrop alpha
    uniform float uRadius;  // corner radius in px

    float roundedBox(vec2 p, vec2 b, float r) {
      vec2 q = abs(p) - b + r;
      return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    }

    void main() {
      vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
      vec2 uv = (frag - uRect.xy) / uRect.zw;
      vec3 bg = vec3(0.03, 0.03, 0.04);

      // rounded-corner mask, anti-aliased
      vec2 p = frag - (uRect.xy + uRect.zw * 0.5);
      float d = roundedBox(p, uRect.zw * 0.5, uRadius);
      float mask = 1.0 - smoothstep(-1.0, 1.0, d);

      // zoom blur: samples streak toward the image centre while it flies
      vec4 col;
      if (uBlur < 0.002) {
        // at rest: a single tap, so panning and zooming stay cheap
        col = texture2D(uTex, clamp(uv, 0.0, 1.0));
      } else {
        vec2 dir = (uv - 0.5) * uBlur * 0.18;
        col = vec4(0.0);
        const int N = 12;
        for (int i = 0; i < N; i++) {
          float t = float(i) / float(N - 1);
          col += texture2D(uTex, clamp(uv - dir * t, 0.0, 1.0));
        }
        col /= float(N);
      }

      float a = col.a * mask;
      vec3 rgb = mix(bg * uDim + (1.0 - uDim) * vec3(1.0), col.rgb, a);
      float alpha = max(uDim, a);
      gl_FragColor = vec4(rgb, alpha);
    }`;

  let gl, prog, u = {}, tex;
  function initGL() {
    gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) return false;
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    for (const n of ["uTex", "uRes", "uRect", "uBlur", "uDim", "uRadius"]) u[n] = gl.getUniformLocation(prog, n);
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(u.uTex, 0);
    return true;
  }

  let hasGL = false;
  try { hasGL = !reduceMotion && initGL(); } catch (e) { console.warn("zoom: WebGL disabled", e); }
  if (!hasGL) root.classList.add("no-gl");

  const dpr = () => Math.min(devicePixelRatio || 1, 2);
  function resize() {
    const w = Math.round(innerWidth * dpr()), h = Math.round(innerHeight * dpr());
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl && gl.viewport(0, 0, w, h); }
  }

  // state: the image rect, in CSS px, on springs
  const K = reduceMotion ? 900 : 150, C = reduceMotion ? 60 : 20;
  const rx = new Spring(0, K, C), ry = new Spring(0, K, C), rw = new Spring(0, K, C), rh = new Spring(0, K, C);
  const dim = new Spring(0, 90, 18);
  let open = false, closing = false, raf = 0, current = null, scale = 1, dragging = null, last = performance.now();

  let aspect = 1;
  const fitRect = (s = 1) => {
    const m = Math.min(innerWidth, innerHeight) * 0.06;
    const maxW = innerWidth - m * 2, maxH = innerHeight - m * 2;
    let w = maxW, h = w / aspect;
    if (h > maxH) { h = maxH; w = h * aspect; }
    return { x: (innerWidth - w * s) / 2, y: (innerHeight - h * s) / 2, w: w * s, h: h * s };
  };
  const thumbRect = () => { const b = current.img.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
  const setTarget = (r) => { rx.target = r.x; ry.target = r.y; rw.target = r.w; rh.target = r.h; };
  const jumpTo = (r) => { rx.x = r.x; ry.x = r.y; rw.x = r.w; rh.x = r.h; rx.v = ry.v = rw.v = rh.v = 0; };

  function draw() {
    if (!gl) return;
    resize();
    const s = dpr();
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    gl.uniform4f(u.uRect, rx.x * s, ry.x * s, rw.x * s, rh.x * s);
    // blur follows how fast the rect is growing or shrinking
    const speed = Math.abs(rw.v) / Math.max(innerWidth, innerHeight);
    gl.uniform1f(u.uBlur, Math.min(1, speed * 1.4));
    gl.uniform1f(u.uDim, Math.max(0, Math.min(1, dim.x)));
    gl.uniform1f(u.uRadius, 0.0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
    const steps = Math.ceil(dt / (1 / 240)), h = dt / steps;
    for (let i = 0; i < steps; i++) for (const sp of [rx, ry, rw, rh, dim]) sp.step(h);
    draw();
    const settled = [rx, ry, rw, rh].every((sp) => sp.settled) && Math.abs(dim.x - dim.target) < 0.01;
    if (closing && settled) { finishClose(); return; }
    raf = requestAnimationFrame(frame);
  }

  function show(btn, index) {
    const img = btn.querySelector("img");
    current = { btn, img, index };
    aspect = (img.naturalWidth || img.width) / (img.naturalHeight || img.height) || 1;
    const label = btn.closest(".device")?.querySelector(".device__label");
    nameEl.textContent = label ? label.lastChild.textContent.trim() : (btn.getAttribute("aria-label") || "").replace(/^Zoom:\s*/, "");
    indexEl.textContent = String(index + 1).padStart(2, "0");
    root.setAttribute("aria-hidden", "false"); root.inert = false;
    root.classList.add("is-open");
    document.body.style.overflow = "hidden";
    open = true; closing = false; scale = 1;

    if (!hasGL) { fallback.src = img.currentSrc || img.src; root.querySelector(".zoom__close").focus(); return; }

    // upload the full image, then fly from the thumbnail to the fitted rect
    const full = new Image();
    full.src = img.currentSrc || img.src;
    const start = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, full);
      jumpTo(thumbRect()); dim.x = 0; dim.v = 0;
      setTarget(fitRect()); dim.target = 1;
      last = performance.now();
      cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
      root.querySelector(".zoom__close").focus();
    };
    (full.decode ? full.decode().catch(() => {}) : Promise.resolve()).then(start);
  }

  function hide() {
    if (!open || closing) return;
    closing = true;
    if (!hasGL) { finishClose(); return; }
    setTarget(thumbRect()); dim.target = 0;
  }

  function finishClose() {
    cancelAnimationFrame(raf); raf = 0;
    open = false; closing = false;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true"); root.inert = true;
    document.body.style.overflow = "";
    current?.btn.focus({ preventScroll: true });
    if (gl) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
  }

  // zoom about a point: keep the pixel under the pointer where it is
  function zoomAt(px, py, next) {
    next = Math.max(1, Math.min(4, next));
    const base = fitRect();
    const cur = { x: rx.target, y: ry.target, w: rw.target, h: rh.target };
    const fx = (px - cur.x) / cur.w, fy = (py - cur.y) / cur.h;
    const w = base.w * next, h = base.h * next;
    scale = next;
    setTarget(clampRect({ x: px - fx * w, y: py - fy * h, w, h }));
  }

  // keep the image covering the viewport once it is larger than it
  function clampRect(r) {
    const base = fitRect();
    if (r.w <= base.w + 1) return base;
    r.x = Math.min(0 + Math.max(0, (innerWidth - r.w)), Math.max(innerWidth - r.w, r.x));
    r.y = Math.min(0 + Math.max(0, (innerHeight - r.h)), Math.max(innerHeight - r.h, r.y));
    if (r.w < innerWidth) r.x = (innerWidth - r.w) / 2;
    if (r.h < innerHeight) r.y = (innerHeight - r.h) / 2;
    return r;
  }

  document.querySelectorAll("[data-zoom]").forEach((btn, i) => btn.addEventListener("click", () => show(btn, i)));
  root.querySelector(".zoom__close").addEventListener("click", (e) => { e.stopPropagation(); hide(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); });
  addEventListener("resize", () => { if (open && !closing) setTarget(clampRect({ ...fitRect(scale), x: rx.target, y: ry.target })); });

  root.addEventListener("wheel", (e) => {
    if (!open || closing || !hasGL) return;
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, scale * Math.exp(-e.deltaY * 0.0022));
  }, { passive: false });

  root.addEventListener("dblclick", (e) => {
    if (!open || closing || !hasGL) return;
    zoomAt(e.clientX, e.clientY, scale > 1.2 ? 1 : 2.5);
  });

  root.addEventListener("pointerdown", (e) => {
    if (!open || closing || e.button !== 0 || !hasGL) return;
    dragging = { x: e.clientX, y: e.clientY, moved: false, rx: rx.target, ry: ry.target };
    root.setPointerCapture(e.pointerId);
  });
  root.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.x, dy = e.clientY - dragging.y;
    if (Math.hypot(dx, dy) > 4) { dragging.moved = true; root.classList.add("is-dragging"); }
    if (dragging.moved && scale > 1) setTarget(clampRect({ x: dragging.rx + dx, y: dragging.ry + dy, w: rw.target, h: rh.target }));
  });
  root.addEventListener("pointerup", (e) => {
    const d = dragging; dragging = null; root.classList.remove("is-dragging");
    if (!d) return;
    // a plain click on the backdrop (not a drag) closes
    const inside = e.clientX >= rx.target && e.clientX <= rx.target + rw.target && e.clientY >= ry.target && e.clientY <= ry.target + rh.target;
    if (!d.moved && !inside) hide();
  });
  // the fallback has no springs: any click closes
  root.addEventListener("click", (e) => { if (!hasGL && e.target === root) hide(); });

  // pinch on touch screens
  let pinch = null;
  root.addEventListener("touchstart", (e) => { if (e.touches.length === 2) pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), s: scale }; }, { passive: true });
  root.addEventListener("touchmove", (e) => {
    if (!pinch || e.touches.length !== 2 || !hasGL) return;
    e.preventDefault();
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    zoomAt((e.touches[0].clientX + e.touches[1].clientX) / 2, (e.touches[0].clientY + e.touches[1].clientY) / 2, pinch.s * d / pinch.d);
  }, { passive: false });
  root.addEventListener("touchend", () => { pinch = null; }, { passive: true });

  return { show, hide };
})();

/* ---------- Tier videos: play, hold the last frame for 2s, replay ---------- */
// The poster is the last frame, so the first thing seen is the finished
// reveal; playback starts only once the grid is on screen, and pauses off it.

(() => {
  const videos = [...document.querySelectorAll(".tier__video, video[data-loop]")];
  if (!videos.length) return;
  document.querySelectorAll(".tier, .pair li, .phones li").forEach((el, i) => el.style.setProperty("--i", i % 4));
  const HOLD = 2000;
  const timers = new Map();
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const replay = (v) => { v.currentTime = 0; v.play().catch(() => {}); };

  videos.forEach((v) => {
    v.addEventListener("ended", () => {
      clearTimeout(timers.get(v));
      timers.set(v, setTimeout(() => { if (v.dataset.onScreen === "1") replay(v); }, HOLD));
    });
  });

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      v.dataset.onScreen = e.isIntersecting ? "1" : "0";
      if (reduceMotion) continue;                      // leave the last-frame poster in place
      if (e.isIntersecting) {
        if (v.ended) { clearTimeout(timers.get(v)); timers.set(v, setTimeout(() => replay(v), HOLD)); }
        else v.play().catch(() => {});
      } else {
        v.pause();
        clearTimeout(timers.get(v));
      }
    }
  }, { threshold: 0.35 });

  videos.forEach((v) => io.observe(v));
})();
