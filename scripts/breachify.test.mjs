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
  const guide = page.locator('[data-breach-guide]');
  const action = name => guide.locator(`[data-guide-action="${name}"]`);
  check(await guide.locator('[data-guide-step="1"]').isDisabled(), 'later steps unavailable before choosing');
  check(await guide.locator('[data-audience="personal"]').getAttribute('aria-pressed') === 'true', 'personal plan is visible by default');
  await action('show').click();
  check((await guide.locator('[data-finding]').count()) === 2, 'personal sample has two findings');
  check((await text(guide)).includes('dark-web listing'), 'personal dark-web finding is explained');
  await guide.locator('.bg-source summary').click();
  check((await text(guide.locator('.bg-source'))).includes('DW-DEMO-01'), 'personal source is explicitly fictional');
  await guide.locator('[data-finding="1"]').click();
  check((await text(guide.locator('.bg-explanation'))).includes('Personal password exposed'), 'personal password uses individual language');
  await action('plan').click();
  const personalReport = await download(action('download'));
  check(personalReport.includes('maya@personal.example') && personalReport.includes('Suggested owner: You'), 'personal export is addressed to the individual');
  check(personalReport.includes('Illustrative dark-web listing'), 'personal report preserves source type');
  check(!personalReport.includes('kestrel.example'), 'personal data remains separate from company example');
  await action('another').click();
  await guide.locator('[data-audience="company"]').click();
  check((await guide.locator('[data-company]').count()) === 3, 'three fixed fictional company examples');
  const requests = [];
  const trackRequest = r => requests.push(r.url());
  page.on('request', trackRequest);
  await action('show').click();
  check((await guide.locator('[data-finding]').count()) === 3, 'sample results include three findings');
  check((await text(guide)).includes('2 employees affected'), 'related findings count people correctly');
  await guide.locator('.bg-source summary').click();
  check((await text(guide.locator('.bg-source'))).includes('maya@kestrel.example'), 'source supports the selected finding');
  await guide.locator('[data-finding="1"]').click();
  check((await text(guide.locator('.bg-explanation'))).includes('Jules Morgan'), 'selecting finding updates explanation');
  await guide.locator('[data-finding="2"]').click();
  check((await text(guide.locator('.bg-unknown'))).includes('does not prove'), 'device finding preserves uncertainty');
  await guide.locator('[data-finding="0"]').click();
  await guide.screenshot({path:'/tmp/breachify-guided-results.png'});
  await action('plan').click();
  check((await guide.locator('input:checked').count()) === 3, 'response plan starts with all proposed actions');
  await guide.locator('[data-include="KW-02"]').uncheck();
  const report = await download(action('download'));
  check(report.includes('maya@kestrel.example') && !report.includes('jules@kestrel.example'), 'download respects selected actions');
  check(report.includes('Status: proposed, not completed'), 'report does not claim real remediation');
  check(report.includes('Unknown:'), 'report preserves evidence limits');
  await action('results').click();
  await action('plan').click();
  check((await guide.locator('input:checked').count()) === 2, 'plan selection survives review and return');
  await guide.locator('[data-include="KW-01"]').uncheck();
  await guide.locator('[data-include="KW-03"]').uncheck();
  check(await action('download').isDisabled(), 'empty plan cannot be downloaded');
  await action('another').click();
  await guide.locator('[data-company="harbor"]').click();
  await action('show').click();
  check((await text(guide)).includes('1 employee affected'), 'second company has its own findings');
  await action('plan').click();
  const harbor = await download(action('download'));
  check(harbor.includes('harbor.example') && !harbor.includes('kestrel.example'), 'no previous company data leaks into export');
  await action('another').click();
  await guide.locator('[data-company="northstar"]').click();
  await action('show').click();
  check((await text(guide)).includes('No matches in this sample.'), 'empty sample has a useful explanation');
  check((await text(guide)).includes('does not guarantee'), 'no-match result does not imply safety');
  check(await guide.locator('[data-guide-step="2"]').isDisabled(), 'empty sample cannot create a finding plan');
  await action('restart').click();
  check((await guide.locator('[data-company="personal"]').getAttribute('aria-pressed')) === 'true', 'reset restores initial personal sample');
  check(await guide.locator('[data-guide-step="1"]').isDisabled(), 'reset clears progress');
  await guide.locator('[data-audience="company"]').click();
  await guide.locator('[data-company="harbor"]').focus();
  await page.keyboard.press('Enter');
  check((await guide.locator('[data-company="harbor"]').getAttribute('aria-pressed')) === 'true', 'company selection works with keyboard');
  await action('show').focus();
  await page.keyboard.press('Enter');
  check(await guide.locator('.bg-heading').evaluate(el => el === document.activeElement), 'step change places keyboard focus at heading');
  check(requests.every(url=>url.startsWith(base)||url.startsWith('blob:')), 'guided interaction makes no external requests');
  page.off('request',trackRequest);
  console.log('Guided overview: sample choices, explanations, evidence, plan selection, exports, reset, empty state and keyboard passed.');
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
  await page.locator('[data-guide-action="show"]').click();
  await page.locator('.bg-source summary').click();
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'expanded finding fits 320px');
  await page.locator('[data-guide-action="plan"]').click();
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'response plan fits 320px');
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
  await page.locator('img').evaluateAll(async images => {
    images.forEach(image => { image.loading = 'eager'; });
    await Promise.all(images.map(image => image.decode()));
  });
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
