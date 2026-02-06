import { test, expect, type Page } from '@playwright/test';

const enterRegex = /进入魔典|Enter Grimoire|以玩家身份进入|Enter as Player/i;
const sandboxModeRegex = /沙盒模式|Sandbox Mode/i;
const controlPanelRegex = /沙盒控制台|Sandbox Control Panel/i;
const scriptSelectionRegex = /剧本选择|Script Selection/i;
const phaseNightButtonRegex = /^夜晚$|^Night$/i;
const phaseDayButtonRegex = /^白天$|^Day$/i;

const openSandbox = async (page: Page) => {
  await page.goto('/');
  await page.locator('input[type="text"]').first().fill('Sandbox Tester');
  await page.getByRole('button', { name: enterRegex }).click();
  const toggleOptions = page.getByRole('button', { name: /展开|Expand|收起|Collapse/i });
  await expect(toggleOptions).toBeVisible();
  await toggleOptions.click();
  await page.getByRole('button', { name: sandboxModeRegex }).click();
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
