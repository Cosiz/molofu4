
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE_ERR: ' + m.text()); });

// Commander: week strip interaction
await page.goto('http://localhost:5173/commander', { waitUntil: 'networkidle' });
console.log('Commander loaded');

// Click Monday (should exist in week strip)
const monBtn = page.getByText('Mon').first();
if (await monBtn.isVisible()) {
  await monBtn.click();
  await page.waitForTimeout(300);
  console.log('Clicked Mon - errors:', JSON.stringify(errors));
}

// Click next week
const nextBtn = page.getByText('›');
if (await nextBtn.isVisible()) {
  await nextBtn.click();
  await page.waitForTimeout(300);
  console.log('Clicked next week - errors:', JSON.stringify(errors));
}

// Click back to today
const todayBtn = page.getByText(new RegExp(String(new Date().getDate()))).first();
if (await todayBtn.isVisible()) {
  await todayBtn.click();
  await page.waitForTimeout(300);
  console.log('Clicked today num - errors:', JSON.stringify(errors));
}

// Open create task modal
const fab = page.locator('.fab');
if (await fab.isVisible()) {
  await fab.click();
  await page.waitForTimeout(300);
  console.log('Opened create modal - errors:', JSON.stringify(errors));
}

// Helper page
await page.goto('http://localhost:5173/helper', { waitUntil: 'networkidle' });
console.log('Helper loaded - errors:', JSON.stringify(errors));

// Observer page
await page.goto('http://localhost:5173/observer', { waitUntil: 'networkidle' });
console.log('Observer loaded - errors:', JSON.stringify(errors));

console.log('ALL ERRORS:', JSON.stringify(errors));
await browser.close();
