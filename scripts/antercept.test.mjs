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
 assert.equal(await page.locator('.ac-gallery').count(),0);
 assert.equal(await page.locator('.ac-chapter').count(),3);
 const lab=page.locator('[data-target-lab]');
 const action=name=>lab.locator(`[data-action="${name}"]`);
 const localRequests=[];
 page.on('request',r=>localRequests.push(r.url()));
 await lab.getByRole('button',{name:'Israel +972'}).click();
 assert.match(await lab.locator('[data-number]').innerText(),/972/);
 await lab.locator('#tl-scenario').selectOption('workspace');
 await action('deliver').click();
 await action('deliver').click();
 await lab.locator('.tl-notification').waitFor();
 await action('read').click();
 await action('visit').click();
 await action('submit').click();
 await lab.getByRole('tab',{name:'AI insight'}).click();
 assert.ok(await lab.getByText('Review recommended',{exact:true}).isVisible());
 assert.ok(await lab.getByText('Unknown',{exact:true}).isVisible());
 await action('resolve').click();
 assert.equal(await lab.locator('[data-session-status]').innerText(),'Resolved');
 await lab.getByRole('tab',{name:'Activity',exact:true}).click();
 assert.equal(await lab.locator('.tl-timeline li').count(),6);
 await action('reset').click();
 assert.equal(await lab.locator('.tl-timeline li').count(),0);
 await lab.getByRole('button',{name:'Morocco +212'}).click();
 await action('deliver').click();
 await action('deliver').click();
 await lab.locator('.tl-notification').waitFor();
 await action('read').click();
 await action('report').click();
 assert.ok(await lab.getByText('Good catch.',{exact:true}).isVisible());
 await lab.getByRole('tab',{name:'Device',exact:true}).click();
 assert.ok(await lab.locator('.tl-location-art').getByText('Casablanca',{exact:true}).isVisible());
 await action('resolve').click();
 await action('reset').click();
 // Reset cancels delivery instead of leaking a notification into the next exercise.
 await action('deliver').click(); await action('deliver').click(); await action('reset').click();
 await page.waitForTimeout(650);
 assert.equal(await lab.locator('.tl-notification').count(),0);
 await lab.locator('.tl-search').fill('972');
 assert.equal(await lab.locator('.tl-country').count(),1);
 await lab.locator('.tl-search').fill('no match');
 assert.ok(await lab.getByText('No matching countries.',{exact:true}).isVisible());
 await lab.locator('.tl-search').fill('');
 assert.equal(await lab.locator('.tl-country').count(),8);
 assert.ok(localRequests.every(url=>url.startsWith(base)), 'phone must not contact external services');
 await lab.getByRole('tab',{name:'Activity',exact:true}).click();
 await page.keyboard.press('ArrowRight');
 assert.equal(await lab.getByRole('tab',{name:'Device',exact:true}).getAttribute('aria-selected'),'true');
 await lab.getByRole('tab',{name:'Activity',exact:true}).click();
 await lab.screenshot({path:'/tmp/antercept-phone-desktop.png'});
 for(const width of [320,390,768,1024]) {
  await page.setViewportSize({width,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`phone overflow at ${width}`);
 }
 await page.setViewportSize({width:390,height:900});
 await action('deliver').click(); await action('deliver').click();
 await lab.locator('.tl-notification').waitFor();
 await action('read').click(); await action('visit').click(); await action('submit').click();
 await lab.screenshot({path:'/tmp/antercept-phone-mobile.png'});
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('.ac-cohort summary').click();
 const run=page.getByRole('button',{name:'Run campaign',exact:true});
 await run.click();
 assert.equal(await page.locator('.ac-chip:disabled').count(),3);
 await page.getByRole('button',{name:'Replay campaign',exact:true}).waitFor();
 assert.ok(await page.locator('tbody .ac-pill--clicked').count()>0);
 const target=page.locator('tbody tr').first();
 const initial=await target.locator('.ac-pill').innerText();
 await target.getByRole('button').click();
 await page.getByRole('button',{name:'Mark test resolved'}).click();
 assert.equal(await page.locator('tbody tr').first().locator('.ac-pill').innerText(),initial);
 assert.ok(await page.getByText('Test resolved · evidence retained').isVisible());
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await page.getByRole('button',{name:'Replay campaign',exact:true}).click();
 await page.getByRole('button',{name:'Replay campaign',exact:true}).waitFor();
 await page.locator('.ac-chip').nth(1).click();
 assert.equal(await page.locator('tbody tr').count(),14);
 await page.getByRole('button',{name:'Run campaign',exact:true}).click();
 await page.getByRole('button',{name:'Replay campaign',exact:true}).waitFor();
 await page.evaluate(()=>document.activeElement?.blur());
 await page.screenshot({path:'/tmp/antercept-desktop.png',fullPage:true});
 for(const width of [390,768]){
  await page.setViewportSize({width,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
 }
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'/tmp/antercept-mobile.png',fullPage:true});
 for(const name of ['the-lure','the-catch','the-map']){
  await page.goto(`${base}blog/${name}.html`);
  assert.equal(await page.locator('.ac-concept-note').count(),1);
  assert.ok(await page.locator('[data-sim] button').count()>0);
  assert.ok(await page.evaluate(()=>[...document.images].filter(i=>i.complete && i.getAttribute("src")).every(i=>i.naturalWidth>0)));
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: phone journey, 8 countries, SMS delivery, report branch, AI insight, reset cancellation, keyboard tabs, no network calls, chapter layout, run, replay, campaign isolation, evidence, resolution, responsive widths, blog simulators and assets.');
} finally {await browser.close(); server.close();}
