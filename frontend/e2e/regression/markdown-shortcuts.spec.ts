import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';
import { waitForEditor } from '../utils/helpers';

test.describe('Markdown Shortcuts (EDITOR-3510)', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForEditor(page);
  });

  test('REGRESSION: "[] " should create checkbox', async ({ page }) => {
    // Click on first bullet and type at the beginning
    const firstBullet = page.locator('hydra-bullet-block rich-text').first();
    await firstBullet.click();
    await page.keyboard.press('Home'); // Go to start of line
    await page.keyboard.type('[] ');

    // CRITICAL: Checkbox must appear - it's rendered as div with role="checkbox"
    await expect(page.locator('hydra-bullet-block .block-prefix.checkbox')).toBeVisible();

    expect(monitor.hasErrors()).toBe(false);
  });

  test('REGRESSION: "# " should create heading', async ({ page }) => {
    // Click on first bullet and type at the beginning
    const firstBullet = page.locator('hydra-bullet-block rich-text').first();
    await firstBullet.click();
    await page.keyboard.press('Home');
    await page.keyboard.type('# ');

    // Heading block renders with class "heading1" - wait a bit for the conversion
    await page.waitForTimeout(500);

    // Check for heading class or the large text styling
    const hasHeading = await page.locator('hydra-bullet-block.heading1').count() > 0;
    const hasHeadingText = await page.locator('hydra-bullet-block .inline-editor').first().evaluate(el => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.fontSize) >= 24; // Heading should be larger
    }).catch(() => false);

    expect(hasHeading || hasHeadingText).toBe(true);
    expect(monitor.hasErrors()).toBe(false);
  });

  test('should NOT convert without space', async ({ page }) => {
    // Click on first bullet and type at the beginning (no trailing space)
    const firstBullet = page.locator('hydra-bullet-block rich-text').first();
    await firstBullet.click();
    await page.keyboard.press('Home');
    await page.keyboard.type('[]');

    // Should remain as text, not convert to checkbox
    await expect(page.locator('hydra-bullet-block', { hasText: '[]' })).toBeVisible();
    await expect(page.locator('hydra-bullet-block .block-prefix.checkbox')).not.toBeVisible();
  });
});
