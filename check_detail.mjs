
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE_ERR: ' + m.text()); });

// Helper: click a task → TaskDetail must NOT crash
await page.goto('http://localhost:5173/helper', { waitUntil: 'networkidle' });
console.log('Helper loaded, errors:', JSON.stringify(errors));

// Click the piano lesson task (has notes, needs_help)
const pianoTask = page.locator('.task-card').filter({ hasText: 'piano' }).first();
await pianoTask.click();
await page.waitForLoadState('networkidle');
const detailTitle = await page.locator('text=Piano').first().isVisible();
const backBtn = await page.locator('.back-btn').isVisible();
const completeBtn = await page.locator('.complete-btn').isVisible();
const noteInput = await page.locator('input[placeholder*="Ask a question"]').isVisible();
console.log('TaskDetail rendered:', detailTitle, '| back btn:', backBtn, '| complete btn:', completeBtn, '| note input:', noteInput);
console.log('TaskDetail errors:', JSON.stringify(errors));

// Navigate back
await page.locator('.back-btn').click();
await page.waitForLoadState('networkidle');
console.log('Back to dashboard, errors:', JSON.stringify(errors));

// Commander: click a task → TaskDetail
await page.goto('http://localhost:5173/commander', { waitUntil: 'networkidle' });
const taskCard = page.locator('.task-card').filter({ hasText: 'basketball' }).first();
await taskCard.click();
await page.waitForLoadState('networkidle');
const errorsAfterCommanderDetail = [...errors];
console.log('Commander TaskDetail errors:', JSON.stringify(errorsAfterCommanderDetail));

// Observer: click a task → TaskDetail (observer should see, no complete button)
await page.goto('http://localhost:5173/observer', { waitUntil: 'networkidle' });
const obsTask = page.locator('.task-card').first();
await obsTask.click();
await page.waitForLoadState('networkidle');
const obsCompleteBtn = await page.locator('.complete-btn').count();
console.log('Observer detail - complete btn count (should be 0):', obsCompleteBtn);
console.log('All errors:', JSON.stringify(errors));

await browser.close();
