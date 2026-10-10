// Reading time: prose at ~200 wpm plus one minute per figure, since the
// figures carry worked numbers that need reading too.
(() => {
  const essay = document.getElementById("essay");
  const words = (essay.innerText || essay.textContent).trim().split(/\s+/).length;
  const figures = essay.querySelectorAll("figure").length;
  const min = Math.max(1, Math.round(words / 200 + figures));
  document.querySelectorAll("[data-read]").forEach((el) => { el.textContent = min; });
})();

// Reading progress along the top edge.
const bar = document.querySelector(".progress span");
const essay = document.getElementById("essay");
const updateProgress = () => {
  const top = essay.getBoundingClientRect().top + scrollY;
  const span = essay.offsetHeight - innerHeight;
  const p = span > 0 ? (scrollY - top) / span : 1;
  bar.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(4));
};
addEventListener("scroll", updateProgress, { passive: true });
addEventListener("resize", updateProgress);
updateProgress();

// Highlight the section being read in the guide.
const links = [...document.querySelectorAll(".guide__list a")];
const spy = new IntersectionObserver((entries) => {
  const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
  if (hit) links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${hit.target.id}`));
}, { rootMargin: "-20% 0px -65% 0px" });
document.querySelectorAll(".es").forEach((s) => spy.observe(s));
