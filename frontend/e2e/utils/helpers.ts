import { Page } from '@playwright/test';

/**
 * Creates a new bullet by clicking on the first bullet block and pressing Enter.
 * The app always has at least one bullet block.
 */
export async function createBullet(page: Page, text: string): Promise<void> {
  // Click on the first bullet block's rich-text to focus it
  await page.locator('hydra-bullet-block rich-text').first().click();
  await page.keyboard.press('End'); // Go to end of text
  await page.keyboard.press('Enter'); // Create new bullet
  await page.keyboard.type(text);
}

/**
 * Creates a child bullet (indented under current).
 * Assumes cursor is already in a bullet block.
 */
export async function createChildBullet(page: Page, text: string): Promise<void> {
  await page.keyboard.press('Enter');
  await page.keyboard.type(text);
  await page.keyboard.press('Tab');
}

/**
 * Gets all bullet text contents.
 */
export async function getBulletTexts(page: Page): Promise<string[]> {
  return page.locator('hydra-bullet-block').allTextContents();
}

/**
 * Clicks on a bullet's grip to enter focus mode.
 * Note: The grip element is `.bullet-grip`
 */
export async function enterFocusMode(page: Page, bulletText: string): Promise<void> {
  const bullet = page.locator('hydra-bullet-block', { hasText: bulletText });
  // Hover first to make grip visible, then click
  await bullet.hover();
  await bullet.locator('.bullet-grip').click();
}

/**
 * Waits for the editor to be ready.
 */
export async function waitForEditor(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="editor-container"]');
  await page.waitForSelector('hydra-bullet-block');
}
