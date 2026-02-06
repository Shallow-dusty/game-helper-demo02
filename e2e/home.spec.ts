import { test, expect, type Page } from '@playwright/test';

const enterRegex = /进入魔典|Enter Grimoire|以玩家身份进入|Enter as Player/i;
const createRoomRegex = /创建仪式|Create Ritual/i;
const sandboxModeRegex = /沙盒模式|Sandbox Mode/i;

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

const loginToRoomSelection = async (page: Page) => {
  await gotoHome(page);
  const nicknameInput = page.locator('input[type="text"]').first();
  await nicknameInput.fill('E2E Tester');
  const enterButton = page.getByRole('button', { name: enterRegex });
  const createButton = page.getByRole('button', { name: createRoomRegex });

  await enterButton.click();
  const firstTry = await createButton.isVisible({ timeout: 10000 }).catch(() => false);
  if (!firstTry) {
    const stillInLobby = await enterButton.isVisible({ timeout: 1000 }).catch(() => false);
    if (stillInLobby) {
      await enterButton.click();
    }
    await expect(createButton).toBeVisible({ timeout: 12000 });
  }
};

test.describe('大厅与房间选择', () => {
  test.describe.configure({ timeout: 60_000 });

  test('首页应显示标题与进入按钮', async ({ page }) => {
    await gotoHome(page);
    await expect(page).toHaveTitle(/血染钟楼|Grimoire/i);
    await expect(page.getByRole('button', { name: enterRegex })).toBeVisible();
  });

  test('昵称为空时进入按钮禁用，输入后可用', async ({ page }) => {
    await gotoHome(page);
    const nicknameInput = page.locator('input[type="text"]').first();
    const enterButton = page.getByRole('button', { name: enterRegex });

    await expect(enterButton).toBeDisabled();
    await nicknameInput.fill('Tester');
    await expect(enterButton).toBeEnabled();
  });

  test('提交昵称后应进入房间选择页', async ({ page }) => {
    await loginToRoomSelection(page);
    await expect(page.getByRole('button', { name: createRoomRegex })).toBeVisible();
    await expect(page.getByPlaceholder('8888')).toBeVisible();
  });

  test('房间选择页应可进入沙盒模式', async ({ page }) => {
    await loginToRoomSelection(page);

    await page.getByRole('button', { name: /展开|Expand|收起|Collapse/i }).click();
    await page.getByRole('button', { name: sandboxModeRegex }).click();

    await expect(page.getByText(sandboxModeRegex).first()).toBeVisible();
  });
});
