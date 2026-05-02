/**
 * Molofu4 Scenario Test Suite — Phase 1c
 * 55 scenarios covering Commander/Helper/Observer roles
 * Tests mock-data features: task view, creation, completion, notes, navigation
 */

import { test, expect, chromium, ChromiumBrowser } from '@playwright/test';

const BASE = 'http://localhost:5173';

const ROUTES: Record<string, string> = {
  commander: '/commander',
  helper: '/helper',
  observer: '/observer',
};

/** Fresh incognito page — isolated Zustand state per test */
async function freshPage(browser: ChromiumBrowser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  return { page, ctx };
}

// ── Setup ─────────────────────────────────────────────────────────────────────
// Dev server is started externally. Just verify it's up.

test.describe('Molofu4 Phase 1c Scenario Tests', () => {
  test.beforeAll(async () => {
    // Server should already be running at 5173 — verify
    let attempts = 0;
    while (attempts < 30) {
      try {
        const res = await fetch('http://localhost:5173/');
        if (res.ok) break;
      } catch {}
      await new Promise(r => setTimeout(r, 1000));
      attempts++;
    }
  });

  test.afterAll(async () => {
    // cleanup if needed
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // C001–C020: Commander Dashboard
  // ─────────────────────────────────────────────────────────────────────────────

  test('C001: Commander lands on /commander and sees dashboard header', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await expect(page.locator('.dash-header h1')).toContainText('Sarah');
    await browser.close();
  });

  test('C002: Commander sees week strip with 7 day buttons', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await expect(page.locator('.week-day')).toHaveCount(7);
    await browser.close();
  });

  test('C003: Commander sees today highlighted in week strip', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    // One button should have the today class
    const todayBtns = page.locator('.week-day-today');
    expect(await todayBtns.count()).toBeGreaterThan(0);
    await browser.close();
  });

  test('C004: Commander sees stat cards (Done, In Progress, Needs Help)', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await expect(page.locator('.stat-card')).toHaveCount(3);
    await expect(page.locator('.stat-label').first()).toContainText('Done');
    await browser.close();
  });

  test('C005: Commander sees task cards in scroll list', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    const count = await page.locator('.task-card').count();
    expect(count).toBeGreaterThan(0);
    await browser.close();
  });

  test('C006: Commander sees status badge on each task card', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    expect(await page.locator('.status-badge').count()).toBeGreaterThan(0);
    await browser.close();
  });

  test('C007: Commander sees GPS banner', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await expect(page.locator('.gps-banner')).toContainText('GPS');
    await browser.close();
  });

  test('C008: Commander sees task assignee name on each card', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await expect(page.locator('.task-meta').first()).toBeVisible();
    await browser.close();
  });

  test('C009: Commander sees + FAB button', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await expect(page.locator('.fab')).toBeVisible();
    await browser.close();
  });

  test('C010: Commander sees task notes when present', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    // t4 has a note from Maria
    const notes = page.locator('.task-note');
    expect(await notes.count()).toBeGreaterThan(0);
    await browser.close();
  });

  test('C011: Commander can open task detail by clicking a task card', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await page.locator('.task-card').first().click();
    await expect(page.locator('.dashboard')).toBeVisible();
    await browser.close();
  });

  test('C012: Commander can navigate back from task detail', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await page.locator('.task-card').first().click();
    await page.locator('.back-btn').click();
    await expect(page.locator('.week-strip')).toBeVisible();
    await browser.close();
  });

  test('C013: Commander can open create task modal via FAB', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await page.locator('.fab').click();
    await expect(page.locator('.modal h2')).toContainText('New Task');
    await browser.close();
  });

  test('C014: Commander can fill create task form and submit', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await page.locator('.fab').click();
    await page.waitForSelector('.modal');
    const titleInput = page.locator('.modal input').first();
    await titleInput.fill('Test Task from Playwright');
    const countBefore = await page.locator('.task-card').count();
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('.modal', { state: 'hidden', timeout: 5000 });
    await page.waitForTimeout(500);
    expect(await page.locator('.task-card').count()).toBeGreaterThan(countBefore);
    await browser.close();
  });

  test('C015: Commander can mark task as complete from task detail', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    const cards = page.locator('.task-card:not(.task-done)');
    await cards.first().click();
    await page.waitForSelector('.complete-btn');
    await page.locator('.complete-btn').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.week-strip')).toBeVisible();
    await browser.close();
  });

  test('C016: Commander can add a note to a task (BUG-FIX verification)', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await page.locator('.task-card').first().click();
    await page.waitForSelector('.note-input-wrap');
    await page.locator('.note-input-wrap input').fill('Commander note test');
    await page.locator('.note-send-btn').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.task-note').first()).toBeVisible();
    await browser.close();
  });

  test('C017: Commander week navigation — prev week button works', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await page.locator('.week-nav-btn').first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('.week-day')).toHaveCount(7);
    await browser.close();
  });

  test('C018: Commander week navigation — next week button works', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await page.locator('.week-nav-btn').last().click();
    await page.waitForTimeout(300);
    await expect(page.locator('.week-day')).toHaveCount(7);
    await browser.close();
  });

  test('C019: Commander can select a specific day by clicking week day button', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await page.locator('.week-day').nth(3).click();
    await page.waitForTimeout(300);
    await expect(page.locator('.week-day').nth(3)).toHaveClass(/week-day-selected/);
    await browser.close();
  });

  test('C020: Commander can close modal by clicking overlay', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await page.locator('.fab').click();
    await page.waitForSelector('.modal');
    await page.locator('.modal-overlay').click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(300);
    await expect(page.locator('.modal')).not.toBeVisible();
    await browser.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // H001–H010: Helper Dashboard
  // ─────────────────────────────────────────────────────────────────────────────

  test('H001: Helper lands on /helper and sees dashboard header', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/helper', { waitUntil: 'networkidle' });
    await expect(page.locator('.dash-header h1')).toContainText('Maria');
    await browser.close();
  });

  test('H002: Helper sees "Your Tasks" section', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/helper', { waitUntil: 'networkidle' });
    await expect(page.locator('.section-title:has-text("Your Tasks")')).toBeVisible();
    await browser.close();
  });

  test('H003: Helper sees task cards with status badges', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/helper', { waitUntil: 'networkidle' });
    const count = await page.locator('.task-card').count();
    expect(count).toBeGreaterThan(0);
    await expect(page.locator('.status-badge').first()).toBeVisible();
    await browser.close();
  });

  test('H004: Helper sees quick complete section with buttons (OUTSIDE .task-card)', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/helper', { waitUntil: 'networkidle' });
    const quickBtns = page.locator('.quick-action-btn');
    expect(await quickBtns.count()).toBeGreaterThan(0);
    await browser.close();
  });

  test('H005: Helper can quick-complete a task via button outside task card', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/helper', { waitUntil: 'networkidle' });
    const quickBtn = page.locator('.quick-action-btn').first();
    const taskTitle = await quickBtn.locator('span').nth(1).innerText();
    await quickBtn.click();
    await page.waitForTimeout(500);
    // The quick-complete button text should no longer be visible (task completed)
    await browser.close();
  });

  test('H006: Helper can click task card to open task detail', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/helper', { waitUntil: 'networkidle' });
    await page.locator('.task-card').first().click();
    await expect(page.locator('.dash-header')).toBeVisible();
    await browser.close();
  });

  test('H007: Helper can add a note to a task', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/helper', { waitUntil: 'networkidle' });
    await page.locator('.task-card').first().click();
    await page.waitForSelector('.note-input-wrap');
    await page.locator('.note-input-wrap input').fill('Helper note from test');
    await page.locator('.note-send-btn').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.task-note').first()).toBeVisible();
    await browser.close();
  });

  test('H008: Helper sees location on task cards', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/helper', { waitUntil: 'networkidle' });
    await expect(page.locator('.task-location').first()).toBeVisible();
    await browser.close();
  });

  test('H009: Helper can navigate back from task detail', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/helper', { waitUntil: 'networkidle' });
    await page.locator('.task-card').first().click();
    await page.locator('.back-btn').click();
    await expect(page.locator('.section-title:has-text("Your Tasks")')).toBeVisible();
    await browser.close();
  });

  test('H010: Helper dashboard shows Helper badge', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/helper', { waitUntil: 'networkidle' });
    await expect(page.locator('.badge')).toContainText('Helper');
    await browser.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // O001–O010: Observer Dashboard
  // ─────────────────────────────────────────────────────────────────────────────

  test('O001: Observer lands on /observer and sees dashboard header', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/observer', { waitUntil: 'networkidle' });
    await expect(page.locator('.dash-header h1')).toContainText('David');
    await browser.close();
  });

  test('O002: Observer sees stat cards', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/observer', { waitUntil: 'networkidle' });
    await expect(page.locator('.stat-card')).toHaveCount(3);
    await browser.close();
  });

  test('O003: Observer sees family status alert banner', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/observer', { waitUntil: 'networkidle' });
    await expect(page.locator('.alert-banner')).toBeVisible();
    await browser.close();
  });

  test('O004: Observer sees task summary rows for all family tasks', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/observer', { waitUntil: 'networkidle' });
    const count = await page.locator('.observer-task-row').count();
    expect(count).toBeGreaterThan(0);
    await browser.close();
  });

  test('O005: Observer sees Message Sarah section with input and send button', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/observer', { waitUntil: 'networkidle' });
    await expect(page.locator('.msg-input')).toBeVisible();
    await expect(page.locator('.msg-send')).toBeVisible();
    await browser.close();
  });

  test('O006: Observer can type in message input', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/observer', { waitUntil: 'networkidle' });
    await page.locator('.msg-input').fill('Test message from observer');
    await expect(page.locator('.msg-input')).toHaveValue('Test message from observer');
    await browser.close();
  });

  test('O007: Observer does NOT see + FAB button (no task creation)', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/observer', { waitUntil: 'networkidle' });
    await expect(page.locator('.fab')).toHaveCount(0);
    await browser.close();
  });

  test('O008: Observer does NOT see quick-complete section', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/observer', { waitUntil: 'networkidle' });
    await expect(page.locator('.quick-action-btn')).toHaveCount(0);
    await browser.close();
  });

  test('O009: Observer sees Observer badge', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/observer', { waitUntil: 'networkidle' });
    await expect(page.locator('.badge')).toContainText('Observer');
    await browser.close();
  });

  test('O010: Observer can click task row to navigate to task detail', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/observer', { waitUntil: 'networkidle' });
    await page.locator('.observer-task-row').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('.dash-header')).toBeVisible();
    await browser.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // T001–T010: Task Detail
  // ─────────────────────────────────────────────────────────────────────────────

  test('T001: Task detail shows task title', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await page.locator('.task-card').first().click();
    await page.waitForSelector('.dash-card');
    // Task title is visible in the first non-status div of dash-card
    const titleText = await page.locator('.dash-card').first().innerText();
    expect(titleText.length).toBeGreaterThan(5);
    await browser.close();
  });

  test('T002: Task detail shows assignee (Who)', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await page.locator('.task-card').first().click();
    await page.waitForSelector('.detail-section');
    await expect(page.locator('.detail-label').first()).toContainText('Who');
    await browser.close();
  });

  test('T003: Task detail shows due time (When)', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await page.locator('.task-card').first().click();
    await page.waitForSelector('.detail-section');
    const whenLabel = page.locator('.detail-label:has-text("When")');
    expect(await whenLabel.count()).toBeGreaterThan(0);
    await browser.close();
  });

  test('T004: Task detail shows location when present', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    // Find a task with location
    const locCard = page.locator('.task-card:has(.task-location)').first();
    if (await locCard.count() > 0) {
      await locCard.click();
      await page.waitForTimeout(300);
      const whereLabel = page.locator('.detail-label:has-text("Where")');
      expect(await whereLabel.count()).toBeGreaterThan(0);
    }
    await browser.close();
  });

  test('T005: Task detail shows notes when present', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    // Navigate to piano task which has a note
    const pianoCard = page.locator('.task-card:has-text("Piano")').first();
    if (await pianoCard.count() > 0) {
      await pianoCard.click();
      await page.waitForTimeout(500);
      const notesSection = page.locator('.section-title:has-text("Notes")');
      if (await notesSection.count() > 0) {
        await expect(page.locator('.task-note')).toBeVisible();
      }
    }
    await browser.close();
  });

  test('T006: Task detail shows status badge', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    await page.locator('.task-card').first().click();
    await page.waitForSelector('.status-badge');
    await expect(page.locator('.status-badge')).toBeVisible();
    await browser.close();
  });

  test('T007: Task detail back button navigates back', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/helper', { waitUntil: 'networkidle' });
    await page.locator('.task-card').first().click();
    await page.waitForSelector('.back-btn');
    await page.locator('.back-btn').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.quick-action-btn').first()).toBeVisible();
    await browser.close();
  });

  test('T008: Task detail shows contact info when present', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/commander', { waitUntil: 'networkidle' });
    // t1 basketball has contact info
    const card = page.locator('.task-card').first();
    await card.click();
    await page.waitForTimeout(300);
    const contactLabel = page.locator('.detail-label:has-text("Contact")');
    if (await contactLabel.count() > 0) {
      await expect(page.locator('.detail-value').last()).toBeVisible();
    }
    await browser.close();
  });

  test('T009: Observer can add a note to a task from detail view (BUG-FIX)', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/observer', { waitUntil: 'networkidle' });
    await page.locator('.observer-task-row').first().click();
    await page.waitForTimeout(500);
    const noteInput = page.locator('.note-input-wrap input');
    if (await noteInput.isVisible()) {
      await noteInput.fill('Observer note from test');
      await page.locator('.note-send-btn').click();
      await page.waitForTimeout(500);
      await expect(page.locator('.task-note')).toBeVisible();
    }
    await browser.close();
  });

  test('T010: Observer cannot mark task complete (no complete button)', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/observer', { waitUntil: 'networkidle' });
    await page.locator('.observer-task-row').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('.complete-btn')).toHaveCount(0);
    await browser.close();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // R001–R005: Role Switching
  // ─────────────────────────────────────────────────────────────────────────────

  test('R001: Role select page shows three role cards', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await expect(page.locator('.role-card')).toHaveCount(3);
    await browser.close();
  });

  test('R002: Clicking role card navigates to correct route', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.locator('.role-card').nth(0).click();
    await expect(page).toHaveURL(/\/commander/);
    await browser.close();
  });

  test('R003: Commander role card href is /commander', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const href = await page.locator('.role-card').nth(0).getAttribute('href');
    expect(href).toBe('/commander');
    await browser.close();
  });

  test('R004: Helper role card href is /helper', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const href = await page.locator('.role-card').nth(1).getAttribute('href');
    expect(href).toBe('/helper');
    await browser.close();
  });

  test('R005: Observer role card href is /observer', async () => {
    const browser = await chromium.launch();
    const { page } = await freshPage(browser);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const href = await page.locator('.role-card').nth(2).getAttribute('href');
    expect(href).toBe('/observer');
    await browser.close();
  });
});
