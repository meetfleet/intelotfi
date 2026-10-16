import { chromium } from 'playwright';
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
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
const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
page.setDefaultTimeout(10000);
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.url().startsWith(base) && r.status()>=400)errors.push(r.url());});
try {
 await page.goto(base + 'antercept/');
 assert.equal(await page.locator('.bf-story-list li').count(),3);
 assert.equal(await page.locator('[data-console]').count(),0);
 assert.equal(await page.locator('.bf-logo').count(),2);
 for(const logo of await page.locator('.bf-logo').all()) {
  assert.equal((await logo.innerText()).trim(),'intelotfi');
  assert.equal(await logo.getAttribute('href'),'../');
 }
 const lab=page.locator('[data-target-lab]');
 const action=name=>lab.locator(`[data-action="${name}"]`);
 const localRequests=[];
 page.on('request',r=>localRequests.push(r.url()));
 assert.equal(await lab.getAttribute('data-stage'),'0');
 assert.ok(await lab.locator('.tl-device-stage').isHidden());
 await lab.locator('.tg-country summary').click();
 await lab.getByRole('button',{name:'Israel +972'}).click();
 assert.match(await lab.locator('[data-number]').innerText(),/972/);
 await lab.locator('#tl-scenario').selectOption('workspace');
 await action('deliver').click();
 await lab.locator('.tl-notification').waitFor();
 assert.equal(await lab.getAttribute('data-stage'),'1');
 assert.ok(await lab.locator('.tl-setup').isHidden());
 assert.ok(await action('result').isDisabled());
 await action('read').click();
 await action('visit').click();
 await action('submit').click();
 await action('result').click();
 assert.equal(await lab.getAttribute('data-stage'),'2');
 assert.match(await lab.locator('[data-session-status]').innerText(),/continued/);
 assert.ok(await lab.getByText('What this means',{exact:true}).isVisible());
 await lab.locator('.tg-history summary').click();
 assert.equal(await lab.locator('.tl-timeline li').count(),4);
 await action('resolve').click();
 assert.equal(await lab.locator('[data-session-status]').innerText(),'Exercise finished');
 assert.ok(await action('resolve').isDisabled());
 await lab.screenshot({path:'/tmp/antercept-guide-result.png'});
 await action('reset').click();
 await lab.getByRole('button',{name:'Morocco +212'}).click();
 await action('deliver').click();
 await lab.locator('.tl-notification').waitFor();
 await action('read').click();
 await action('report').click();
 await action('result').click();
 assert.match(await lab.locator('[data-session-status]').innerText(),/reported/);
 assert.match(await lab.locator('.tg-result-copy').innerText(),/instead of following/);
 await action('return').click();
 assert.equal(await lab.getAttribute('data-stage'),'1');
 await action('reset').click();
 await action('deliver').click();
 await lab.locator('.tl-notification').waitFor();
 await action('read').click(); await action('visit').click(); await action('report').click();
 await action('result').click();
 assert.match(await lab.locator('.tg-result-copy').innerText(),/followed the link, then reported/);
 await action('reset').click();
 await action('deliver').click(); await action('reset').click();
 await page.waitForTimeout(500);
 assert.equal(await lab.getAttribute('data-stage'),'0');
 assert.equal(await lab.locator('.tl-notification').count(),0);
 await lab.locator('.tl-search').fill('972');
 assert.equal(await lab.locator('.tl-country').count(),1);
 await lab.locator('.tl-search').fill('no match');
 assert.ok(await lab.getByText('No matching countries.',{exact:true}).isVisible());
 await lab.locator('.tl-search').fill('');
 assert.equal(await lab.locator('.tl-country').count(),8);
 assert.ok(localRequests.every(url=>url.startsWith(base)), 'no external demo requests');
 await lab.locator('.tg-country summary').click();
 for(const width of [320,390,768,1440]) {
  await page.setViewportSize({width,height:900});
  await action('reset').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`setup overflow at ${width}`);
  await action('deliver').focus(); await page.keyboard.press('Enter');
  await lab.locator('.tl-notification').waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`phone overflow at ${width}`);
  if(width===1440)await lab.screenshot({path:'/tmp/antercept-guide-phone.png'});
  await action('read').click(); await action('report').click(); await action('result').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`result overflow at ${width}`);
 }
 await action('reset').click();
 await page.locator('img').evaluateAll(async imgs=>{imgs.forEach(i=>i.loading='eager');await Promise.all(imgs.map(i=>i.decode()));});
 await page.screenshot({path:'/tmp/antercept-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'/tmp/antercept-mobile.png',fullPage:true});
 for(const name of ['the-lure','the-catch','the-map']){
  await page.goto(`${base}blog/${name}.html`);
  assert.equal(await page.locator('.ac-concept-note').count(),1);
  assert.ok(await page.locator('[data-sim] button').count()>0);
  assert.ok(await page.evaluate(()=>[...document.images].filter(i=>i.complete && i.getAttribute("src")).every(i=>i.naturalWidth>0)));
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: intelotfi branding, guided steps, both phone paths, combined click/report history, cancellation, eight countries, keyboard, four widths, blogs, assets and no external requests.');
} finally {await browser.close(); server.close();}
