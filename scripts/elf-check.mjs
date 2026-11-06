// Smoke test for the elf sidekick: drives the game in your installed Chrome and saves screenshots.
// Usage: start the dev server (npm run dev), then run: npm run check:elf
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000/';
const OUT = new URL('../playwright-shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));

await page.goto(BASE_URL);
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + '1-home.png' });

await page.getByText('START LEVEL').click();
await page.waitForTimeout(2500);
await page.screenshot({ path: OUT + '2-game-start.png' });

const bubble = page.locator('.elf-bubble-pop');
let sawWarning = false;
const t0 = Date.now();
while (Date.now() - t0 < 40000) {
  if (await bubble.count()) {
    sawWarning = true;
    break;
  }
  // If nearest monster is on-screen, turn away from it
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(250);
  await page.keyboard.up('ArrowLeft');
  await page.waitForTimeout(250);
}
console.log('warning shown:', sawWarning, 'after', Date.now() - t0, 'ms');
if (sawWarning) {
  await page.waitForTimeout(400);
  console.log('warning text:', (await bubble.innerText()).replace(/\n/g, ' / '));
  await page.screenshot({ path: OUT + '3-elf-warning.png' });

  // Snap to face nearest threat -> elf should cheer
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(450);
  const txt = (await bubble.count()) ? (await bubble.innerText()).replace(/\n/g, ' / ') : '(no bubble)';
  console.log('after facing:', txt);
  await page.screenshot({ path: OUT + '4-elf-happy.png' });
  await page.waitForTimeout(1800);
  console.log('bubble after happy period:', await bubble.count());
  await page.screenshot({ path: OUT + '5-elf-gone.png' });

  // The elf asks Gemini for fresh lines in the background. Wait for them, then catch him using one.
  const elf = page.locator('[data-elf-source]');
  try {
    await page.waitForSelector('[data-elf-source="gemini"]', { timeout: 45000 });
    console.log('gemini lines: received');
    const t1 = Date.now();
    while (!(await bubble.count()) && Date.now() - t1 < 30000) {
      await page.keyboard.down('ArrowLeft');
      await page.waitForTimeout(250);
      await page.keyboard.up('ArrowLeft');
      await page.waitForTimeout(250);
    }
    if (await bubble.count()) {
      await page.waitForTimeout(400);
      console.log('gemini-written warning:', (await bubble.innerText()).replace(/\n/g, ' / '));
      await page.screenshot({ path: OUT + '6-elf-gemini.png' });
    }
  } catch {
    console.log('gemini lines: not received (source =', await elf.getAttribute('data-elf-source'), ') - elf is using built-in lines');
  }
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
if (!sawWarning) {
  console.error('FAIL: elf never appeared');
  process.exitCode = 1;
}
