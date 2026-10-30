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
  await page.screenshot({ path: 'artifacts/startup-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/startup-narrow.png', fullPage: true });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
    throw new Error('Narrow layout overflows');
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`PASS ${url}: startup ready, WebGL canvas, no browser errors, desktop/narrow layout`);
} finally {
  await browser.close();
}
