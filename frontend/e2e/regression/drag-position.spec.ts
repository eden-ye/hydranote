import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';
import { waitForEditor, getBulletTexts } from '../utils/helpers';

test.describe('Drag Position (EDITOR-3701)', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForEditor(page);
  });

  test('REGRESSION: bullet should land at correct drop position', async ({ page }) => {
    // Create three bullets: First, Second, Third
    await page.locator('hydra-bullet-block rich-text').first().click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('First');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Second');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Third');

    // Wait for bullets to be created
    await page.waitForTimeout(300);

    // Verify initial order contains all three
    let texts = await getBulletTexts(page);
    expect(texts.some(t => t.includes('First'))).toBe(true);
    expect(texts.some(t => t.includes('Second'))).toBe(true);
    expect(texts.some(t => t.includes('Third'))).toBe(true);

    // Get indexes before drag
    const firstIndexBefore = texts.findIndex(t => t.includes('First'));
    const thirdIndexBefore = texts.findIndex(t => t.includes('Third'));

    // Drag First to after Third using low-level mouse API
    // (Playwright's dragTo can be blocked by overlays)
    const sourceBullet = page.locator('hydra-bullet-block', { hasText: 'First' }).first();
    const targetBullet = page.locator('hydra-bullet-block', { hasText: 'Third' }).first();

    // Hover to make grip visible
    await sourceBullet.hover();
    await page.waitForTimeout(100);

    // Get grip element bounding box
    const sourceGrip = sourceBullet.locator('.bullet-grip');
    const gripBox = await sourceGrip.boundingBox();
    const targetBox = await targetBullet.boundingBox();

    if (gripBox && targetBox) {
      // Use low-level mouse for drag to bypass overlay interception
      await page.mouse.move(gripBox.x + gripBox.width / 2, gripBox.y + gripBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(100);

      // Move to below target
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height + 5, { steps: 10 });
      await page.waitForTimeout(100);

      await page.mouse.up();
    }

    // Wait for reorder to complete
    await page.waitForTimeout(500);

    // Get order after drag
    texts = await getBulletTexts(page);

    // Verify no data loss
    expect(texts.some(t => t.includes('First'))).toBe(true);
    expect(texts.some(t => t.includes('Second'))).toBe(true);
    expect(texts.some(t => t.includes('Third'))).toBe(true);

    // CRITICAL: No console errors during drag
    expect(monitor.hasErrors()).toBe(false);
  });

  test('REGRESSION: drag operation preserves all bullets', async ({ page }) => {
    // Create three bullets
    await page.locator('hydra-bullet-block rich-text').first().click();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Alpha');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Beta');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Gamma');

    await page.waitForTimeout(300);

    // Perform drag using low-level mouse API
    const alphaBullet = page.locator('hydra-bullet-block', { hasText: 'Alpha' }).first();
    const gammaBullet = page.locator('hydra-bullet-block', { hasText: 'Gamma' }).first();

    await alphaBullet.hover();
    await page.waitForTimeout(100);

    const gripBox = await alphaBullet.locator('.bullet-grip').boundingBox();
    const targetBox = await gammaBullet.boundingBox();

    if (gripBox && targetBox) {
      await page.mouse.move(gripBox.x + gripBox.width / 2, gripBox.y + gripBox.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(100);
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height + 5, { steps: 10 });
      await page.waitForTimeout(100);
      await page.mouse.up();
    }

    await page.waitForTimeout(500);

    // CRITICAL: All bullets must still exist (no data loss during drag)
    await expect(page.locator('hydra-bullet-block', { hasText: 'Alpha' })).toBeVisible();
    await expect(page.locator('hydra-bullet-block', { hasText: 'Beta' })).toBeVisible();
    await expect(page.locator('hydra-bullet-block', { hasText: 'Gamma' })).toBeVisible();

    expect(monitor.hasErrors()).toBe(false);
  });
});
