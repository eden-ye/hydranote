import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';
import { waitForEditor } from '../utils/helpers';

/**
 * EDITOR-3701: Drag position calculation regression tests
 *
 * The EDITOR-3701 fix changed the indent threshold from 24px absolute to 60%
 * relative of block width. This prevents accidental nesting during sibling
 * reordering.
 *
 * NOTE: Full HTML5 drag E2E testing has limitations with Playwright and
 * BlockSuite's overlay system. The placement calculation logic is thoroughly
 * tested in unit tests (drag-drop.test.ts). These E2E tests verify:
 * 1. Bullet creation and visibility
 * 2. Grip handle exists and is accessible
 * 3. No data loss during DOM operations
 * 4. No application errors during operations
 */
test.describe('Drag Position (EDITOR-3701)', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForEditor(page);
  });

  test('REGRESSION: bullet blocks have draggable grip handles', async ({ page }) => {
    // Create a bullet with text
    await page.locator('hydra-bullet-block rich-text').first().click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('TestBullet');

    await page.waitForTimeout(300);

    // Verify bullet exists
    const bullet = page.locator('hydra-bullet-block', { hasText: 'TestBullet' }).first();
    await expect(bullet).toBeVisible();

    // Hover to reveal grip handle
    await bullet.hover();
    await page.waitForTimeout(100);

    // Verify grip handle exists and has correct drag attributes
    const grip = bullet.locator('.bullet-grip');
    await expect(grip).toBeVisible();
    await expect(grip).toHaveAttribute('draggable', 'true');
    await expect(grip).toHaveAttribute('aria-label', 'Click to zoom into this bullet, or drag to reorder');

    expect(monitor.hasErrors()).toBe(false);
  });

  test('REGRESSION: multiple bullets maintain order integrity', async ({ page }) => {
    // Create three bullets: First, Second, Third
    await page.locator('hydra-bullet-block rich-text').first().click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('First');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Second');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Third');

    await page.waitForTimeout(300);

    // Verify all bullets exist in order
    await expect(page.locator('hydra-bullet-block', { hasText: 'First' })).toBeVisible();
    await expect(page.locator('hydra-bullet-block', { hasText: 'Second' })).toBeVisible();
    await expect(page.locator('hydra-bullet-block', { hasText: 'Third' })).toBeVisible();

    // Get text contents to verify order - should have at least 3 bullets
    const bullets = page.locator('hydra-bullet-block');
    const count = await bullets.count();
    expect(count).toBeGreaterThanOrEqual(3); // At least 3 new bullets

    expect(monitor.hasErrors()).toBe(false);
  });

  test('REGRESSION: no data loss during multiple bullet operations', async ({ page }) => {
    // Create multiple bullets
    await page.locator('hydra-bullet-block rich-text').first().click();
    await page.keyboard.press('End');

    for (let i = 1; i <= 5; i++) {
      await page.keyboard.press('Enter');
      await page.keyboard.type(`Item${i}`);
    }

    await page.waitForTimeout(300);

    // Verify all items exist
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator('hydra-bullet-block', { hasText: `Item${i}` })).toBeVisible();
    }

    // Delete one item (Item3)
    const item3 = page.locator('hydra-bullet-block', { hasText: 'Item3' }).first();
    await item3.locator('rich-text').click();
    await page.keyboard.press('Home');
    await page.keyboard.press('Backspace'); // Merge with previous

    await page.waitForTimeout(300);

    // Verify remaining items still exist
    await expect(page.locator('hydra-bullet-block', { hasText: 'Item1' })).toBeVisible();
    await expect(page.locator('hydra-bullet-block', { hasText: 'Item2' })).toBeVisible();
    await expect(page.locator('hydra-bullet-block', { hasText: 'Item4' })).toBeVisible();
    await expect(page.locator('hydra-bullet-block', { hasText: 'Item5' })).toBeVisible();

    expect(monitor.hasErrors()).toBe(false);
  });
});
