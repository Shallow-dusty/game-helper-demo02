import { test, expect } from '@playwright/test';

/**
 * 首页 E2E 测试
 */
test.describe('首页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('应该显示标题', async ({ page }) => {
    await expect(page).toHaveTitle(/血染钟楼|Grimoire/i);
  });

  test('应该显示创建房间按钮', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /创建|新建|Create/i });
    await expect(createButton).toBeVisible();
  });

  test('应该显示加入房间输入框', async ({ page }) => {
    const joinInput = page.getByPlaceholder(/房间号|Room/i);
    await expect(joinInput).toBeVisible();
  });

  test('应该显示沙盒模式入口', async ({ page }) => {
    const sandboxButton = page.getByRole('button', { name: /沙盒|Sandbox|练习/i });
    await expect(sandboxButton).toBeVisible();
  });
});

/**
 * 导航测试
 */
test.describe('导航', () => {
  test('点击创建房间应进入说书人房间', async ({ page }) => {
    await page.goto('/');

    const createButton = page.getByRole('button', { name: /创建|新建|Create/i });
    await createButton.click();

    // 应该导航到游戏页面
    await expect(page).toHaveURL(/\/room\/|\/game\//);
  });

  test('输入房间号并加入应进入玩家房间', async ({ page }) => {
    await page.goto('/');

    const joinInput = page.getByPlaceholder(/房间号|Room/i);
    await joinInput.fill('TEST123');

    const joinButton = page.getByRole('button', { name: /加入|Join/i });
    await joinButton.click();

    // 应该尝试导航到房间（可能显示错误如果房间不存在）
    await expect(page).toHaveURL(/\/room\/|\/game\//);
  });

  test('点击沙盒模式应进入沙盒页面', async ({ page }) => {
    await page.goto('/');

    const sandboxButton = page.getByRole('button', { name: /沙盒|Sandbox|练习/i });
    await sandboxButton.click();

    await expect(page).toHaveURL(/sandbox/);
  });
});

/**
 * 响应式测试
 */
test.describe('响应式布局', () => {
  test('移动端应该正确显示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 应该显示移动端友好的布局
    const mainContent = page.locator('main, [role="main"], .app, #root');
    await expect(mainContent).toBeVisible();
  });

  test('平板端应该正确显示', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const mainContent = page.locator('main, [role="main"], .app, #root');
    await expect(mainContent).toBeVisible();
  });

  test('桌面端应该正确显示', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    const mainContent = page.locator('main, [role="main"], .app, #root');
    await expect(mainContent).toBeVisible();
  });
});
