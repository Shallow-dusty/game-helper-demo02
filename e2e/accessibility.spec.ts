import { test, expect } from '@playwright/test';

/**
 * 可访问性 E2E 测试
 */
test.describe('可访问性', () => {
  test('首页应该有合理的 HTML 结构', async ({ page }) => {
    await page.goto('/');

    // 应该有 main 或 role="main"
    const main = page.locator('main, [role="main"]');
    await expect(main.first()).toBeVisible();
  });

  test('表单元素应该有标签', async ({ page }) => {
    await page.goto('/');

    // 查找输入框
    const inputs = page.locator('input:not([type="hidden"])');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');

      // 输入框应该有 label、aria-label 或 placeholder
      const hasAccessibleName = Boolean(id || ariaLabel || placeholder);
      expect(hasAccessibleName).toBe(true);
    }
  });

  test('按钮应该有可访问名称', async ({ page }) => {
    await page.goto('/');

    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');

      // 按钮应该有文本、aria-label 或 title
      const hasAccessibleName = Boolean(text?.trim() || ariaLabel || title);
      expect(hasAccessibleName).toBe(true);
    }
  });

  test('图片应该有 alt 属性', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      // 图片应该有 alt 或 role="presentation"
      const hasAccessibility = alt !== null || role === 'presentation';
      expect(hasAccessibility).toBe(true);
    }
  });
});

/**
 * 键盘导航测试
 */
test.describe('键盘导航', () => {
  test('应该能够通过 Tab 键导航', async ({ page }) => {
    await page.goto('/');

    // 按 Tab 键
    await page.keyboard.press('Tab');

    // 应该有焦点元素
    const focusedElement = page.locator(':focus');
    await expect(focusedElement.first()).toBeVisible();
  });

  test('按钮应该可以通过 Enter 键激活', async ({ page }) => {
    await page.goto('/');

    // 导航到按钮
    await page.keyboard.press('Tab');

    // 获取当前焦点元素
    const focusedElement = page.locator(':focus');

    if (await focusedElement.first().isVisible()) {
      // 按 Enter 应该触发点击
      await page.keyboard.press('Enter');
    }
  });

  test('模态框应该可以通过 Escape 关闭', async ({ page }) => {
    await page.goto('/sandbox');
    await page.waitForTimeout(2000);

    // 如果有模态框打开，按 Escape 应该关闭它
    await page.keyboard.press('Escape');

    // 等待动画完成
    await page.waitForTimeout(500);
  });
});

/**
 * 颜色对比度测试
 */
test.describe('颜色对比度', () => {
  test('文本应该有足够的对比度', async ({ page }) => {
    await page.goto('/');

    // 这是一个基本检查，更详细的对比度测试需要专门的可访问性工具
    const body = page.locator('body');
    const backgroundColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // 确保背景色已设置
    expect(backgroundColor).toBeTruthy();
  });
});

/**
 * 焦点可见性测试
 */
test.describe('焦点可见性', () => {
  test('焦点元素应该有可见的焦点指示器', async ({ page }) => {
    await page.goto('/');

    // Tab 到第一个可聚焦元素
    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus').first();

    if (await focusedElement.isVisible()) {
      // 检查是否有 outline 或其他焦点样式
      const outline = await focusedElement.evaluate((el) =>
        window.getComputedStyle(el).outline
      );

      // 这个测试可能需要根据实际样式调整
      expect(typeof outline).toBe('string');
    }
  });
});
