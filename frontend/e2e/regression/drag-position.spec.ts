import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';
import { waitForEditor } from '../utils/helpers';

test.describe('Drag Position (EDITOR-3701)', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForEditor(page);
  });

  test('REGRESSION: drag operation should not crash', async ({ page }) => {
    // Create two bullets
    await page.locator('hydra-bullet-block rich-text').first().click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('DragItem');
    await page.keyboard.press('Enter');
    await page.keyboard.type('DropTarget');

    // Wait for bullets to be created
    await page.waitForTimeout(300);

    // Get the drag item
    const dragItem = page.locator('hydra-bullet-block', { hasText: 'DragItem' }).first();
    const dropTarget = page.locator('hydra-bullet-block', { hasText: 'DropTarget' }).first();

    // Hover and drag
    await dragItem.hover();
    await dragItem.locator('.bullet-grip').dragTo(dropTarget);

    // Wait for any reorder
    await page.waitForTimeout(500);

    // CRITICAL: Drag operation should not cause console errors
    expect(monitor.hasErrors()).toBe(false);

    // Both items should still exist (no data loss)
    await expect(page.locator('hydra-bullet-block', { hasText: 'DragItem' })).toBeVisible();
    await expect(page.locator('hydra-bullet-block', { hasText: 'DropTarget' })).toBeVisible();
  });
});
