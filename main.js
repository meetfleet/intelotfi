let clicks = 0;
const count = document.getElementById("count");

document.getElementById("btn").addEventListener("click", () => {
  clicks++;
  count.textContent = `Clicked ${clicks} time${clicks === 1 ? "" : "s"}`;
});
