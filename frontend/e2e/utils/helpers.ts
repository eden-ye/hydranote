import { Page } from '@playwright/test';

export async function createBullet(page: Page, text: string): Promise<void> {
  await page.click('[data-testid="add-bullet-button"]');
  await page.keyboard.type(text);
}

export async function createChildBullet(page: Page, text: string): Promise<void> {
  await page.keyboard.press('Enter');
  await page.keyboard.type(text);
  await page.keyboard.press('Tab');
}

export async function getBulletTexts(page: Page): Promise<string[]> {
  return page.locator('[data-block-type="bullet"]').allTextContents();
}
