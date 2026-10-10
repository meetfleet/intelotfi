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
