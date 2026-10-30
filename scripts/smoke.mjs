import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

// Run against a separately started dev or preview server.
const url = process.env.SMOKE_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL ?? 'chrome',
  headless: true,
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  const response = await page.goto(url);
  if (!response?.ok()) throw new Error(`Page returned ${response?.status()}`);
  await page.locator('#status:not([data-state="loading"])').waitFor();
  if (await page.locator('#status').getAttribute('data-state') !== 'ready') {
    throw new Error(`${await page.locator('#status').textContent()}\n${errors.join('\n')}`);
  }
  const canvas = page.locator('canvas');
  if (await canvas.count() !== 1) throw new Error('Expected one WebGL canvas');
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/movement-menu.png', fullPage: true });
  const state = () => page.locator('#position').evaluate(el => ({
    x: Number(el.dataset.x), y: Number(el.dataset.y), z: Number(el.dataset.z),
    yaw: Number(el.dataset.yaw), active: el.dataset.active,
  }));
  // Browser-native mouse lock, not synthetic DOM key/mouse events.
  await page.locator('#enter').click();
  await page.waitForFunction(() => document.pointerLockElement?.tagName === 'CANVAS');
  await page.waitForFunction(() => document.querySelector('#position').dataset.active === 'true');
  const origin = await state();
  await page.mouse.move(640, 450);
  await page.mouse.move(720, 470);
  await page.waitForFunction(yaw => Math.abs(Number(document.querySelector('#position').dataset.yaw) - yaw) > 0.01, origin.yaw);
  await page.keyboard.down('w');
  await page.waitForFunction(x => Math.abs(Number(document.querySelector('#position').dataset.x) - x) > 0.2, origin.x);
  await page.keyboard.up('w');
  await page.waitForFunction(() => document.querySelector('#speed').textContent.includes('0.00'));
  const stopped = await state();
  await page.waitForTimeout(150);
  const afterStop = await state();
  if (Math.hypot(afterStop.x - stopped.x, afterStop.z - stopped.z) > 0.001) throw new Error('Movement continues after key release');
  await page.keyboard.down('Space');
  await page.waitForFunction(() => Number(document.querySelector('#position').dataset.y) > 0.1);
  const inAir = await state();
  await page.mouse.move(780, 450);
  await page.waitForFunction(yaw => Math.abs(Number(document.querySelector('#position').dataset.yaw) - yaw) > 0.01, inAir.yaw);
  await page.keyboard.up('Space');
  await page.screenshot({ path: 'artifacts/movement-arena.png' });
  await page.keyboard.press('Escape');
  await page.locator('#overlay').waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.pointerLockElement && document.querySelector('#position').dataset.active === 'false');
  const paused = await state();
  await page.waitForTimeout(150);
  if (Math.abs((await state()).y - paused.y) > 0.001) throw new Error('Simulation continues while paused');
  await page.locator('#reset').click();
  await page.waitForFunction(() => Number(document.querySelector('#position').dataset.x) === -9);
  await page.locator('#fallback').click();
  await page.keyboard.down('ShiftRight');
  await page.keyboard.down('w');
  await page.waitForFunction(() => document.querySelector('#speed').textContent.includes('7.28'));
  await page.keyboard.up('w');
  await page.keyboard.up('ShiftRight');
  // Losing focus clears a held key, preventing movement on resume.
  await page.keyboard.down('w');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.locator('#overlay').waitFor({ state: 'visible' });
  await page.keyboard.up('w');
  await page.locator('#fallback').click();
  await page.waitForFunction(() => document.querySelector('#speed').textContent.includes('0.00'));
  await page.keyboard.press('Escape');
  await page.locator('#enter').click();
  await page.waitForFunction(() => document.pointerLockElement?.tagName === 'CANVAS');
  await page.waitForFunction(() => document.querySelector('#position').dataset.active === 'true');
  await page.keyboard.press('Escape');
  await page.locator('#overlay').waitFor({ state: 'visible' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/movement-narrow.png', fullPage: true });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
    throw new Error('Narrow layout overflows');
  }
  // Simulate a browser policy rejection to exercise the offered fallback.
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.requestPointerLock = () => Promise.reject(new Error('Policy denied'));
  });
  await page.reload();
  await page.locator('#enter').click();
  await page.waitForFunction(() => document.querySelector('#hint').textContent.includes('被拒绝'));
  if (!await page.locator('#overlay').isVisible()) throw new Error('Denied lock hides recovery menu');
  await page.locator('#fallback').click();
  await page.waitForFunction(() => document.querySelector('#position').dataset.active === 'true');
  await page.keyboard.press('Escape');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`PASS ${url}: WebGL, pointer lock, ground/air mouse look, movement/stop, jump, pause/reset, right Shift, fallback, blur key clearing, desktop/narrow layout; no browser errors`);
} finally {
  await browser.close();
}
