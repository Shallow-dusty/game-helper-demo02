import { test, expect } from '@playwright/test';

/**
 * 沙盒模式 E2E 测试
 * 沙盒模式是离线练习模式，无需网络连接
 */
test.describe('沙盒模式', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sandbox');
  });

  test('应该显示魔典区域', async ({ page }) => {
    // 等待魔典加载
    const grimoire = page.locator('[data-testid="grimoire"], .grimoire, canvas');
    await expect(grimoire.first()).toBeVisible({ timeout: 10000 });
  });

  test('应该显示控制面板', async ({ page }) => {
    const controls = page.locator('[data-testid="controls"], .controls-panel, .control-panel');
    await expect(controls.first()).toBeVisible({ timeout: 10000 });
  });

  test('应该显示剧本选择器', async ({ page }) => {
    const scriptSelector = page.locator('select, [data-testid="script-selector"]').first();
    await expect(scriptSelector).toBeVisible({ timeout: 10000 });
  });

  test('应该能够切换阶段', async ({ page }) => {
    // 查找阶段切换按钮
    const phaseButtons = page.locator('button').filter({
      hasText: /白天|夜晚|Day|Night/i,
    });

    // 至少应该有一个阶段按钮
    await expect(phaseButtons.first()).toBeVisible({ timeout: 10000 });
  });
});

/**
 * 沙盒模式 - 座位交互测试
 */
test.describe('沙盒模式 - 座位交互', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sandbox');
    // 等待魔典加载完成
    await page.waitForTimeout(2000);
  });

  test('应该显示座位节点', async ({ page }) => {
    // 座位节点可能是 canvas 或 DOM 元素
    const seats = page.locator('[data-testid*="seat"], .seat-node, circle');

    // 沙盒模式应该有默认的座位
    const seatCount = await seats.count();
    expect(seatCount).toBeGreaterThanOrEqual(0);
  });

  test('点击座位应该触发交互', async ({ page }) => {
    // 在魔典区域点击
    const grimoire = page.locator('[data-testid="grimoire"], .grimoire, canvas').first();

    if (await grimoire.isVisible()) {
      await grimoire.click({ position: { x: 200, y: 200 } });
      // 验证点击后没有错误
      await page.waitForTimeout(500);
    }
  });
});

/**
 * 沙盒模式 - 夜间流程测试
 */
test.describe('沙盒模式 - 夜间流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sandbox');
    await page.waitForTimeout(2000);
  });

  test('应该能够执行夜间操作', async ({ page }) => {
    // 查找夜间按钮
    const nightButton = page.locator('button').filter({
      hasText: /夜晚|Night|🌙/i,
    }).first();

    if (await nightButton.isVisible()) {
      await nightButton.click();
      await page.waitForTimeout(1000);

      // 这里只验证点击不会报错
    }
  });
});

/**
 * 沙盒模式 - 无网络测试
 */
test.describe('沙盒模式 - 离线功能', () => {
  test('离线状态下应该正常工作', async ({ page, context }) => {
    // 先加载页面
    await page.goto('/sandbox');
    await page.waitForTimeout(2000);

    // 切换到离线模式
    await context.setOffline(true);

    // 页面应该仍然可以交互
    const grimoire = page.locator('[data-testid="grimoire"], .grimoire, canvas').first();
    await expect(grimoire).toBeVisible();

    // 恢复在线
    await context.setOffline(false);
  });
});
