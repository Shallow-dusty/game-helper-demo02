import { test, expect, type Page } from '@playwright/test';

const enterRegex = /进入魔典|Enter Grimoire|以玩家身份进入|Enter as Player/i;
const createRoomRegex = /创建仪式|Create Ritual/i;
const confirmAudioSetupRegex = /confirmsetup|confirm setup|确认|完成/i;
const onlineAudioModeRegex = /onlinemode|online mode|在线/i;
const enterGrimoireRegex = /entergrimoire|enter grimoire|进入魔典|开始|→/i;

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

const loginToRoomSelection = async (page: Page, name: string) => {
  await gotoHome(page);
  const nicknameInput = page.locator('input[type="text"]').first();
  await nicknameInput.fill(name);
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

const dismissAudioSetupIfNeeded = async (page: Page) => {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const overlay = page.locator('div.fixed.inset-0.z-\\[100\\]').first();
    const hasOverlay = await overlay.isVisible({ timeout: 1200 }).catch(() => false);
    if (!hasOverlay) return;

    const onlineModeButton = page.getByRole('button', { name: onlineAudioModeRegex }).first();
    const confirmSetupButton = page.getByRole('button', { name: confirmAudioSetupRegex }).first();
    const enterGrimoireButton = page.getByRole('button', { name: enterGrimoireRegex }).first();

    if (await confirmSetupButton.isVisible({ timeout: 800 }).catch(() => false)) {
      if (await onlineModeButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await onlineModeButton.click();
      }
      await confirmSetupButton.click();
      continue;
    }

    if (await enterGrimoireButton.isVisible({ timeout: 800 }).catch(() => false)) {
      await enterGrimoireButton.click();
      continue;
    }

    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(300);
  }
};

test.describe('真实开局流程', () => {
  test.describe.configure({ timeout: 75_000 });

  test('应支持创建房间并进入开局等待区', async ({ page }) => {
    await loginToRoomSelection(page, 'FlowTester');

    await page.getByRole('button', { name: createRoomRegex }).click();
    await expect.poll(async () => {
      return page.evaluate(() => localStorage.getItem('grimoire_last_room'));
    }).toMatch(/^[A-Z0-9]{4}$/);
    const roomCode = await page.evaluate(() => localStorage.getItem('grimoire_last_room'));

    await dismissAudioSetupIfNeeded(page);

    const seatButton = page.locator('button').filter({ hasText: /OPEN|座位|Seat/i }).first();
    await expect(seatButton).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('heading', { name: /[A-Z0-9]{4}/ })).toBeVisible();
    await expect(page.getByText(/FlowTester/i)).toBeVisible({ timeout: 10000 });
    expect(roomCode).toBeTruthy();
  });
});
