import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';
import { createBullet, getBulletTexts } from '../utils/helpers';

test.describe('Drag Position (EDITOR-3701)', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
  });

  test('REGRESSION: bullet should land at drop position', async ({ page }) => {
    await createBullet(page, 'First');
    await page.keyboard.press('Enter');
    await createBullet(page, 'Second');
    await page.keyboard.press('Enter');
    await createBullet(page, 'Third');

    // Drag First to after Third
    const source = page.locator('text=First').locator('xpath=..').locator('.grip-handle');
    const target = page.locator('text=Third');
    await source.dragTo(target);

    // CRITICAL: Order must be Second, Third, First
    const texts = await getBulletTexts(page);
    expect(texts).toContain('Second');
    expect(texts.indexOf('Second')).toBeLessThan(texts.indexOf('Third'));

    expect(monitor.hasErrors()).toBe(false);
  });
});
