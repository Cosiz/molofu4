
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
const pages = ['/', '/commander', '/helper', '/observer'];
for (const p of pages) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://localhost:5173' + p, { waitUntil: 'networkidle' });
  const title = await page.title();
  console.log('PAGE:', p, '| title:', title, '| errors:', JSON.stringify(errors));
  await page.close();
}
await browser.close();
