import { test, expect, type Page } from '@playwright/test';

const enterRegex = /进入魔典|Enter Grimoire|以玩家身份进入|Enter as Player/i;
const sandboxModeRegex = /沙盒模式|Sandbox Mode/i;
const controlPanelRegex = /沙盒控制台|Sandbox Control Panel/i;
const scriptSelectionRegex = /剧本选择|Script Selection/i;
const phaseNightButtonRegex = /^夜晚$|^Night$/i;
const phaseDayButtonRegex = /^白天$|^Day$/i;

const gotoHome = async (page: Page) => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await expect(page.locator('#root')).toBeVisible({ timeout: 10000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await page.waitForTimeout(800);
      }
    }
  }
  throw lastError;
};

const openSandbox = async (page: Page) => {
  await gotoHome(page);
  await page.locator('input[type="text"]').first().fill('Sandbox Tester');
  await page.getByRole('button', { name: enterRegex }).click();

  // Wait until room selection view is ready.
  await expect(page.getByRole('heading', { name: /Choose Your Destiny|选择|命运/i })).toBeVisible();

  const sandboxButton = page.getByRole('button', { name: sandboxModeRegex }).first();
  const sandboxVisible = await sandboxButton.isVisible({ timeout: 2000 }).catch(() => false);
  if (!sandboxVisible) {
    const optionsHeader = page.getByText(/More Options|更多选项|Sandbox & Offline|lobby\.moreOptions/i).first();
    await optionsHeader.scrollIntoViewIfNeeded().catch(() => undefined);

    const toggleOptions = page.getByRole('button', { name: /展开|Expand|收起|Collapse|lobby\.expand|lobby\.collapse/i }).first();
    await expect(toggleOptions).toBeVisible();
    await toggleOptions.click();
  }

  await expect(sandboxButton).toBeVisible();
  await sandboxButton.click();
  await expect(page.getByText(sandboxModeRegex).first()).toBeVisible();
};

test.describe('沙盒模式', () => {
  test.beforeEach(async ({ page }) => {
    await openSandbox(page);
  });

  test('应显示沙盒控制台与剧本选择', async ({ page }) => {
    await expect(page.getByText(controlPanelRegex)).toBeVisible();
    await expect(page.getByText(scriptSelectionRegex)).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('应可切换夜晚与白天阶段', async ({ page }) => {
    await page.getByRole('button', { name: phaseNightButtonRegex }).click();
    await expect(page.getByRole('button', { name: phaseNightButtonRegex })).toBeVisible();

    await page.getByRole('button', { name: phaseDayButtonRegex }).click();
    await expect(page.getByRole('button', { name: phaseDayButtonRegex })).toBeVisible();
  });
});
