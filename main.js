const root = document.documentElement;
const body = document.body;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(pointer: fine)").matches;

/* ---------- Stagger indices ---------- */

const setIndex = (els) => els.forEach((el, i) => el.style.setProperty("--i", i));
setIndex(document.querySelectorAll(".roles li"));
setIndex(document.querySelectorAll(".manifesto .line > span"));
setIndex(document.querySelectorAll(".menu a"));

/* ---------- Intro: wait for hero image + fonts ---------- */

const heroImg = document.querySelector(".hero__bg img");
const imgReady = heroImg.complete
  ? Promise.resolve()
  : new Promise((r) => heroImg.addEventListener("load", r, { once: true }));
const timeout = new Promise((r) => setTimeout(r, 2500));

Promise.race([Promise.all([imgReady, document.fonts.ready]), timeout]).then(() => {
  requestAnimationFrame(() => body.classList.remove("is-loading"));
  setTimeout(() => scramble(document.querySelector(".logo__text")), 600);
});

/* ---------- Text scramble ---------- */

const GLYPHS = "abcdefghijklmnopqrstuvwxyz!<>-_/[]{}=+*^?#01";

function scramble(el, duration = 600) {
  if (reduceMotion || el._scrambling) return;
  el._scrambling = true;
  const original = el.dataset.text ?? (el.dataset.text = el.textContent);
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const revealed = Math.floor(progress * original.length);
    let out = "";
    for (let i = 0; i < original.length; i++) {
      const ch = original[i];
      out += i < revealed || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (progress < 1) requestAnimationFrame(tick);
    else {
      el.textContent = original;
      el._scrambling = false;
    }
  };
  requestAnimationFrame(tick);
}

document.querySelectorAll("[data-scramble]").forEach((el) => {
  // lock width so scrambling glyphs don't make the line jitter
  const target = el.closest(".logo") ?? el;
  target.addEventListener("mouseenter", () => {
    el.style.minWidth = `${el.offsetWidth}px`;
    scramble(el, el.classList.contains("role") ? 420 : 600);
  });
});

/* ---------- Pointer parallax (eased) ---------- */

if (finePointer && !reduceMotion) {
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;

  const loop = () => {
    x += (tx - x) * 0.06;
    y += (ty - y) * 0.06;
    root.style.setProperty("--mx", x.toFixed(4));
    root.style.setProperty("--my", y.toFixed(4));
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.0005 ? requestAnimationFrame(loop) : 0;
  };

  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  addEventListener("pointermove", (e) => {
    tx = (e.clientX / innerWidth) * 2 - 1;
    ty = (e.clientY / innerHeight) * 2 - 1;
    kick();
  });

  document.addEventListener("pointerleave", () => { tx = 0; ty = 0; kick(); });
}

/* ---------- Menu ---------- */

const burger = document.querySelector(".burger");
const menu = document.getElementById("menu");

function setMenu(open) {
  body.classList.toggle("menu-open", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  menu.setAttribute("aria-hidden", String(!open));
  menu.inert = !open;
}

burger.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
