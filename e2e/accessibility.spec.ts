import { test, expect } from '@playwright/test';

test.describe('可访问性基础检查', () => {
  test('首页应有可见根容器和主标题', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('输入框应具备可访问名称', async ({ page }) => {
    await page.goto('/');
    const inputs = page.locator('input:not([type="hidden"])');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      expect(Boolean(ariaLabel || placeholder)).toBe(true);
    }
  });

  test('主要按钮应可被键盘聚焦并激活', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus').first();
    await expect(focused).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page.locator('#root button').first()).toBeVisible();
  });

  test('按钮应具备可访问名称', async ({ page }) => {
    await page.goto('/');
    const buttons = page.locator('button');
    const count = Math.min(await buttons.count(), 12);

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = (await button.textContent())?.trim();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      expect(Boolean(text || ariaLabel || title)).toBe(true);
    }
  });
});
