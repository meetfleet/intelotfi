/* Run npm test. Install Chromium with npx playwright install chromium,
   or set BROWSER_EXECUTABLE to a local Chromium-based browser. */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";
const root = resolve(import.meta.dirname, "..");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  try {
    let file = resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (file !== root && !file.startsWith(root + "/"))
      throw Error("outside root");
    if ((await stat(file)).isDirectory()) file += "/index.html";
    res.setHeader(
      "Content-Type",
      mime[extname(file)] || "application/octet-stream",
    );
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;
const brave = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.BROWSER_EXECUTABLE || (existsSync(brave) ? brave : undefined),
});
let assertions = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  assertions++;
};
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
  acceptDownloads: true,
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "warning" && m.text().includes("demo"))
    errors.push(m.text());
});
page.on("response", (r) => {
  if (r.url().startsWith(base) && r.status() >= 400)
    errors.push(`${r.status()} ${r.url()}`);
});
const visit = async (path) => {
  await page.goto(base + path);
  await page.waitForTimeout(150);
};
const demo = async (name) => {
  const d = page.locator(`[data-demo="${name}"]`);
  await d.scrollIntoViewIfNeeded();
  await d.locator(".demo__body").waitFor();
  await page.waitForFunction(
    (n) =>
      document
        .querySelector(`[data-demo="${n}"]`)
        ?.classList.contains("is-ready"),
    name,
  );
  return d;
};
const reset = async (d) => {
  await d.locator(".demo__reset").click();
  await page.waitForTimeout(30);
};
const range = async (loc, value) =>
  loc.evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
const text = (loc) => loc.textContent();
const download = async (button) => {
  const wait = page.waitForEvent("download");
  await button.click();
  const d = await wait;
  const path = await d.path();
  const data = await readFile(path, "utf8");
  check(
    data.startsWith("# Sample data"),
    "download identifies fictional sample",
  );
  check(
    !data.includes("cegid.com"),
    "no real company appears in a demo download",
  );
  return data;
};
try {
  await visit("breachify/");
  await page.locator("[data-console]").scrollIntoViewIfNeeded();
  await page.locator("#console-query").waitFor();
  for (const invalid of [
    "intelotfi.com",
    "example.com",
    "kestrel.example.evil.com",
    "<img src=x onerror=alert(1)>",
    "https://kestrel.example",
    "bad .example",
  ]) {
    await page.locator("#console-query").fill(invalid);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    check(
      (await text(page.locator(".con-message"))).includes(
        "only knows sample companies",
      ),
      "rejects non-sample query " + invalid,
    );
    check(
      (await page.locator(".con-main [role=tab]").count()) === 0,
      "invalid search never creates results",
    );
  }
  await page.locator("#console-query").fill("kestrel.example");
  await page.locator("#console-query").press("Enter");
  await page.locator("#con-tab-0").waitFor();
  check(
    (await text(page.locator(".con-populations"))).includes("188"),
    "Kestrel keeps specified sample counts",
  );
  await page.locator('[data-month="2"]').click();
  check(
    (await text(page.locator("[data-chart-readout]"))).includes("Mar 2026"),
    "chart month works",
  );
  await page.locator("#con-tab-1").click();
  const firstId = await text(page.locator(".dm-drill-open b").first());
  await page.locator(".dm-drill-open").first().click();
  check(
    (await page
      .locator(".dm-drill-open")
      .first()
      .getAttribute("aria-expanded")) === "true",
    "record disclosure expands",
  );
  await page
    .getByRole("tab", { name: "Corporate credentials", exact: true })
    .click();
  check(
    (await text(page.locator(".dm-drill-credential"))).includes(
      "sso.kestrel.example",
    ),
    "corporate evidence renders",
  );
  await page
    .getByRole("tab", { name: "Domains with sensitive cookies" })
    .click();
  await page.locator('[data-domain="0"]').click();
  check(
    (await page
      .locator(".dm-drill-cookies:visible .dm-drill-cookie")
      .count()) === 12,
    "nested cookie count matches records",
  );
  await page.locator('[data-domain="0"]').press("Escape");
  check(
    (await page.locator(".dm-drill-cookies:visible").count()) === 0,
    "Escape closes cookie level",
  );
  await page.locator('[data-domain="0"]').click();
  await page.locator("[data-resolve]").first().click();
  check(
    (await page.locator(".dm-drill-device").count()) === 5,
    "resolve removes row from unresolved",
  );
  check(
    await page.evaluate(() => document.activeElement.tagName !== "BODY"),
    "resolve keeps keyboard focus",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  check(
    (await page.locator(".dm-drill-device").count()) === 6,
    "undo restores device",
  );
  await page.locator('[data-export="credentials"]').click();
  await page.getByRole("button", { name: "Download", exact: true }).waitFor();
  const credentials = await download(
    page.getByRole("button", { name: "Download", exact: true }),
  );
  check(
    credentials.includes("family,ip,compromised"),
    "credential export has proper schema",
  );
  check(
    (await page.locator("[data-quest] .is-done").count()) === 6,
    "whole quest completes",
  );
  await page.locator("[data-all]").click();
  check(
    (await text(page.locator(".dm-drill-list"))).includes("Nothing unresolved"),
    "resolve all empties visible queue",
  );
  await page.locator('[data-filter="1"]').click();
  check(
    (await page.locator(".dm-drill-device").count()) === 6,
    "resolved filter shows records",
  );
  await page.locator('[data-filter="0"]').click();
  await page.locator('[data-page="2"]').click();
  check(
    (await page.locator(".dm-drill-device").count()) === 6,
    "second page populated",
  );
  await page.locator('[data-page="1"]').click();
  check(
    (await page.locator(".dm-drill-device").count()) === 0,
    "resolution persists across pagination",
  );
  await page.locator('[data-filter="1"]').click();
  await page.locator("[data-resolve]").first().click();
  await page.locator('[data-filter="0"]').click();
  check(
    (await text(page.locator(".dm-drill-open b").first())) === firstId,
    "seeded first page survives pagination",
  );
  await page.locator("[data-refresh]").click();
  check(
    (await text(page.locator(".dm-drill-open b").first())) === firstId,
    "refresh deterministic",
  );
  for (const i of [2, 3]) {
    await page.locator(`#con-tab-${i}`).click();
    check(
      (await page.locator(".con-table:visible tbody tr").count()) === 6,
      "credential tab " + i,
    );
    await page.locator("[data-table-export]:visible").click();
    await page.getByRole("button", { name: "Download", exact: true }).waitFor();
    await download(page.getByRole("button", { name: "Download", exact: true }));
  }
  await page.locator("#con-tab-4").click();
  check(
    (await page.locator(".con-external").count()) === 5,
    "external domains tab",
  );
  await page.locator("#con-tab-5").click();
  await page.locator("[data-expand-assets]").click();
  check(await page.locator("#con-resources").isVisible(), "asset group opens");
  await page.locator('[data-assets="users"]').click();
  check(
    (await text(page.locator(".con-assets-banner"))).includes("147"),
    "asset population changes",
  );
  await page.locator("[data-assets-export]").click();
  await page.getByRole("button", { name: "Download", exact: true }).waitFor();
  const assets = await download(
    page.getByRole("button", { name: "Download", exact: true }),
  );
  check(assets.includes("users"), "asset export follows selected population");
  await page.locator("#con-tab-0").click();
  await page.locator("#con-tab-0").focus();
  await page.keyboard.press("ArrowRight");
  check(
    (await page.locator("#con-tab-1").getAttribute("aria-selected")) === "true",
    "keyboard changes console tabs",
  );
  await page.locator('[data-nav="7"]').click();
  check(
    (await text(page.locator(".con-toasts"))).includes("not drawn yet"),
    "Documents explains unfinished design",
  );
  await page.locator("[data-back]").click();
  await page.locator('[data-query="com.kestrel.mobile"]').click();
  await page.locator("#con-tab-1").click();
  await page.locator(".dm-drill-open").first().click();
  await page
    .getByRole("tab", { name: "Corporate credentials", exact: true })
    .click();
  check(
    (await text(page.locator(".dm-drill-credential"))).includes(
      "@kestrel.example",
    ),
    "Android sample maps to reserved domain",
  );
  console.log(
    "Console: search boundaries, tabs, hierarchy, resolve/undo, pages, exports and quest passed.",
  );
  await visit("blog/outside-in.html");
  let d = await demo("two-clocks");
  await d.locator(".dm-clock-row").first().click();
  check(
    (await text(d.locator("[role=status]"))).includes("41-day gap"),
    "clock readout",
  );
  await d.getByRole("button", { name: "Last time added", exact: true }).click();
  check(
    (await d.locator(".dm-clock-row").first().getAttribute("data-id")) ===
      "KS-7Q2M9X4D",
    "clock sort orders dates",
  );
  await reset(d);
  d = await demo("drilldown");
  await d.locator(".dm-drill-open").first().click();
  await d.getByRole("tab", { name: "Domains with sensitive cookies" }).click();
  await d.locator('[data-domain="1"]').click();
  check(
    (await text(d.locator(".dm-drill-domain").nth(1))).includes("EXPIRED"),
    "expired cookie domain",
  );
  await reset(d);
  check((await d.locator(".dm-drill-device").count()) === 3, "drill reset");
  const flow = page.locator("[data-flow]").first();
  await flow.scrollIntoViewIfNeeded();
  await flow.getByRole("tab").first().focus();
  await page.keyboard.press("ArrowRight");
  check(
    (await flow.getByRole("tab").nth(1).getAttribute("aria-selected")) ===
      "true",
    "chapter flow keyboard",
  );
  check(
    page.url().endsWith("outside-in.html"),
    "arrow key does not navigate chapter",
  );
  const dot = page.locator("#shot-shell .spot__dot").first();
  await dot.click();
  check(
    (await dot.getAttribute("aria-expanded")) === "true",
    "annotation opens",
  );
  await page.keyboard.press("Escape");
  check(
    (await dot.getAttribute("aria-expanded")) === "false",
    "annotation escapes",
  );
  check(
    (await page.locator("[data-scrolly].is-on").count()) === 0,
    "reduced motion disables pinned scroll",
  );
  await visit("blog/beyond-the-password.html");
  d = await demo("cookie-life");
  await range(d.locator("input"), 18);
  check((await text(d.locator("[data-state]"))) === "EXPIRED", "cookie expiry");
  await range(d.locator("input"), -1);
  check(
    (await text(d.locator("[data-state]"))) === "NOT STOLEN YET",
    "pre-theft state",
  );
  await range(d.locator("input"), 5);
  await d.locator("[data-revoke]").click();
  check(
    (await text(d.locator("[data-state]"))) === "REVOKED",
    "cookie revocation",
  );
  await d.getByRole("button", { name: "sso_token", exact: true }).click();
  check(
    (await text(d.locator("[data-scale]"))).includes("hours"),
    "short cookie uses hours",
  );
  await reset(d);
  check(
    (await text(d.locator("[data-state]"))) === "UNEXPIRED",
    "cookie reset",
  );
  d = await demo("android-origin");
  await d.locator('[data-part="1"]').click();
  check(
    (await text(d.locator("[role=status]"))).includes("signing"),
    "Android fingerprint explanation",
  );
  await d.locator("[data-next]").click();
  check(
    (await text(d.locator(".dm-origin"))).includes("com.lumen.health"),
    "Android next example",
  );
  await reset(d);
  d = await demo("log-anatomy");
  await d.getByRole("button", { name: "4xx", exact: true }).click();
  check((await d.locator(".dm-log-line").count()) === 3, "4xx filter");
  await d.locator("input").fill("/api/login");
  check((await d.locator(".dm-log-line").count()) === 1, "combined log search");
  await d.locator('[data-field="3"]').click();
  check(
    (await text(d.locator("[role=status]"))).includes("response status"),
    "log status explanation",
  );
  await d.locator("[data-copy]").click();
  await page.waitForFunction(() =>
    document.querySelector("[data-copy]").textContent.includes("Copied"),
  );
  check((await text(d.locator("[data-copy]"))).includes("Copied"), "copy log");
  await d.locator("input").fill("no-such-record");
  check(
    (await text(d.locator(".dm-log-lines"))).includes("No matching"),
    "empty log state",
  );
  await reset(d);
  check((await d.locator(".dm-log-line").count()) === 8, "log reset");
  d = await demo("evidence-pipeline");
  check(
    (await d.locator(".dm-ai-pipeline-metrics b").allTextContents()).join(
      ",",
    ) === "8,6,3,3",
    "pipeline distinguishes observations, artefacts, devices and accounts",
  );
  await d.getByRole("tab", { name: /Deduplicate/ }).click();
  check(
    (await d.locator("[role=tabpanel]:visible tbody tr").count()) === 6,
    "pipeline merges two exact duplicate sightings",
  );
  check(
    (await text(d.locator("[role=tabpanel]:visible"))).includes(
      "Feed A + Mirror B",
    ),
    "deduplication preserves source lineage",
  );
  await d.locator("[data-pipeline-dedup]").uncheck();
  check(
    (await d.locator("[role=tabpanel]:visible tbody tr").count()) === 8,
    "observation mode preserves all rows",
  );
  check(
    (await d.locator(".dm-ai-pipeline-metrics b").allTextContents())[3] === "3",
    "duplicate rows never inflate distinct accounts",
  );
  await d.locator("[data-pipeline-dedup]").check();
  await d.getByRole("tab", { name: /Aggregate/ }).click();
  check(
    (await text(d.locator(".dm-ai-histogram"))).includes("Unknown"),
    "unknown event date has an explicit bin",
  );
  await d.locator("[data-pipeline-time]").selectOption("6");
  check(
    !(await text(d.locator(".dm-ai-histogram"))).includes("Unknown"),
    "ingestion time uses known collection dates",
  );
  await d.locator("[data-pipeline-org]").selectOption("lumen.example");
  check(
    (await d.locator(".dm-ai-pipeline-metrics b").allTextContents()).join(
      ",",
    ) === "2,2,1,1",
    "organisation scope filters all metrics",
  );
  await reset(d);
  await visit("blog/outside-in.html");
  d = await demo("risk-assessment");
  check(
    (await text(d.locator(".dm-ai-score"))).startsWith("82"),
    "risk baseline matches independently computed fixture",
  );
  await d.locator('[data-risk-action="revoke"]').click();
  check(
    (await text(d.locator(".dm-ai-score"))).startsWith("55"),
    "confirmed revocation removes session contribution",
  );
  await d
    .getByRole("tab", { name: "Possible attack path", exact: true })
    .click();
  check(
    (await text(d.locator("[data-risk-path]"))).includes(
      "Session path blocked",
    ),
    "revocation changes the session path",
  );
  await d.locator('[data-risk-action="unknown"]').click();
  check(
    (await text(d.locator("[data-risk-summary]"))).includes("Needs evidence"),
    "missing session evidence does not become zero risk",
  );
  await d.getByRole("tab", { name: "Analyst brief", exact: true }).click();
  check(
    (await text(d.locator("[data-risk-brief]"))).includes(
      "Abstain from a precise rank",
    ),
    "brief abstains when evidence is incomplete",
  );
  check(
    (await text(d.locator("[data-risk-brief]"))).includes(
      "[E2] Session evidence withheld",
    ),
    "brief cites the missing source field",
  );
  for (const name of ["credential", "asset"])
    await d.locator(`[data-risk-input="${name}"]`).selectOption("-1");
  await d.locator('[data-risk-input="ageUnknown"]').check();
  check(
    (await text(d.locator(".dm-ai-score"))).startsWith("0–100"),
    "all-unknown evidence spans the full interval",
  );
  check(
    (await text(d.locator(".dm-ai-coverage"))).includes("0 / 4"),
    "coverage is not invented confidence",
  );
  await reset(d);
  await range(d.locator('[data-risk-input="age"]'), 180);
  check(
    (await text(d.locator(".dm-ai-score"))).startsWith("56"),
    "old evidence retains a nonzero priority floor",
  );
  await reset(d);
  await visit("blog/machinery.html");
  d = await demo("export");
  await d.getByRole("button", { name: "All time", exact: true }).click();
  check(
    (await text(d.locator("[data-estimate]"))).includes("300,000 of 1,284,903"),
    "export cap",
  );
  await d.getByRole("button", { name: "Cookies", exact: true }).click();
  await d.locator("[data-request-button]").click();
  await d.locator("[data-download]").waitFor();
  const sample = await download(d.locator("[data-download]"));
  check(
    sample.split("\n").length === 7 && sample.includes("cookies"),
    "sample export exactly five data rows",
  );
  await reset(d);
  check(await d.locator("[data-request-button]").isVisible(), "export reset");
  d = await demo("admin-map");
  for (let i = 0; i < 7; i++) {
    await d.locator(`[data-node="${i}"]`).click();
    await d.locator("img").evaluate((el) => el.decode());
    check(
      (await d.locator(`[data-node="${i}"]`).getAttribute("aria-pressed")) ===
        "true",
      "admin node " + i,
    );
    check(
      await d
        .locator("img")
        .evaluate((el) => el.complete && el.naturalWidth > 0),
      "admin image " + i,
    );
  }
  await reset(d);
  d = await demo("tier-change");
  await range(d.locator("input"), 249);
  check(
    (await text(d.locator("[data-new]"))) === "$249.00",
    "new price changes",
  );
  check(
    (await d.locator(".dm-tier-row b").allTextContents()).filter(
      (s) => s === "$199.00",
    ).length === 3,
    "existing contracts retain price",
  );
  await d.locator("[data-archive]").click();
  check(
    (await text(d.locator("[data-new]"))).includes("Not available"),
    "archive blocks new purchases",
  );
  check(
    (await text(d)).includes("Past due"),
    "archive preserves past-due state",
  );
  await reset(d);
  d = await demo("passkey");
  await d.locator("[data-limit]").selectOption("1");
  await d.locator("[data-generate]").click();
  await d.locator("[data-stored]").waitFor();
  const key = await text(d.locator(".dm-key-reveal b"));
  check(key.startsWith("PK_KES_"), "key revealed once");
  await d.locator("[data-copy-key]").click();
  await page.waitForFunction(
    () => document.querySelector("[data-copy-key]").textContent === "Copied",
  );
  check((await text(d.locator("[data-copy-key]"))) === "Copied", "key copy");
  await d.locator("[data-stored]").click();
  check(!(await text(d)).includes(key), "full key removed after storing");
  await d.locator('[data-download-key="2"]').click();
  check(
    await d.locator('[data-download-key="2"]').isDisabled(),
    "download limit expires key",
  );
  await d.locator('[data-revoke-key="0"]').click();
  check(
    (await text(d.locator("[data-summary]"))).includes("1 revoked"),
    "revocation updates count",
  );
  check(
    await d.locator('[data-download-key="0"]').isDisabled(),
    "revoked download disabled",
  );
  await reset(d);
  check((await d.locator(".dm-key-row").count()) === 2, "key reset");
  // Auto-mask and reset timers under an accelerated clock.
  await page.clock.install();
  await d.locator("[data-generate]").click();
  await page.clock.runFor(100);
  await d.locator("[data-stored]").waitFor();
  await page.clock.runFor(21000);
  check(
    await d.locator("[data-reveal-key]").isHidden(),
    "key auto-masks after 20 seconds",
  );
  await reset(d);
  await d.locator("[data-generate]").click();
  await page.clock.runFor(100);
  await reset(d);
  await page.clock.runFor(22000);
  check(
    (await d.locator(".dm-key-row").count()) === 2,
    "reset cancels pending key timers",
  );
  await page.clock.resume();
  console.log(
    "Eleven demos: interactions, states, reset, downloads and timers passed.",
  );
  // Real layout checks at the specified lower bound and typical phone/tablet widths.
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "breachify/",
      "blog/outside-in.html",
      "blog/beyond-the-password.html",
      "blog/machinery.html",
    ]) {
      await visit(path);
      for (const el of await page.locator("[data-demo]").all()) {
        await el.scrollIntoViewIfNeeded();
        await page.waitForFunction(
          (node) => node.classList.contains("is-ready"),
          await el.elementHandle(),
        );
      }
      const geometry = await page.evaluate(() => ({
        width: innerWidth,
        extent: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll("body *")]
          .filter(
            (el) =>
              el.getBoundingClientRect().right > innerWidth + 2 &&
              getComputedStyle(el).visibility !== "hidden",
          )
          .slice(0, 8)
          .map((el) => el.className),
      }));
      check(
        geometry.extent <= width + 1,
        `${path} has no page overflow at ${width}: ${JSON.stringify(geometry)}`,
      );
      check(
        (await page.locator(".demo:not(.is-ready)").count()) === 0,
        `${path} boots all demos at ${width}`,
      );
      const broken = await page
        .locator("img")
        .evaluateAll((els) =>
          els
            .filter(
              (el) => el.getAttribute("src") && el.complete && !el.naturalWidth,
            )
            .map((el) => el.src),
        );
      check(!broken.length, `${path} has no broken images at ${width}`);
    }
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await visit("breachify/");
  await page.locator("[data-console]").scrollIntoViewIfNeeded();
  await page.locator('[data-query="kestrel.example"]').click();
  await page.locator("#con-tab-1").click();
  await page.locator(".dm-drill-open").first().click();
  await page
    .getByRole("tab", { name: "Domains with sensitive cookies" })
    .click();
  await page.locator('[data-domain="0"]').click();
  check(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "expanded console fits 320px",
  );
  // All chapter links must resolve, including generated dock/continue navigation.
  for (const path of [
    "breachify/",
    "blog/outside-in.html",
    "blog/beyond-the-password.html",
    "blog/machinery.html",
  ]) {
    await visit(path);
    for (const href of await page
      .locator("a[href]")
      .evaluateAll((els) => [
        ...new Set(
          els.map((el) => el.href).filter((h) => h.startsWith(location.origin)),
        ),
      ])) {
      const url = new URL(href),
        res = await page.request.get(url.href);
      check(res.ok(), `local link ${url.pathname}`);
      if (url.hash && url.pathname === new URL(page.url()).pathname)
        check(
          (await page
            .locator(`[id="${decodeURIComponent(url.hash.slice(1))}"]`)
            .count()) > 0,
          "local fragment " + url.hash,
        );
    }
    check(
      !(await text(page.locator("body"))).includes("0 min read"),
      "no zero reading-time placeholder",
    );
  }
  check(
    errors.length === 0,
    "no browser or missing-resource errors: " + errors.join("\n"),
  );
  await mkdir(resolve(root, "test-results"), { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit("breachify/");
  await page.screenshot({
    path: resolve(root, "test-results/breachify-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: resolve(root, "test-results/breachify-mobile.png"),
    fullPage: true,
  });
  console.log(
    `PASS: ${assertions} assertions. Desktop/mobile screenshots in test-results/.`,
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
