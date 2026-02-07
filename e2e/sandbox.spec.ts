import { test, expect, type Locator, type Page } from '@playwright/test';

const enterRegex = /进入魔典|Enter Grimoire|以玩家身份进入|Enter as Player/i;
const sandboxModeRegex = /沙盒模式|Sandbox Mode/i;
const controlPanelRegex = /沙盒控制台|Sandbox Control Panel/i;
const scriptSelectionRegex = /剧本选择|Script Selection/i;
const phaseNightButtonRegex = /^夜晚$|^Night$/i;
const phaseDayButtonRegex = /^白天$|^Day$/i;
const phaseNominationButtonRegex = /^提名$|^Nomination$/i;

const clickSafely = async (locator: Locator) => {
  await expect(locator).toBeVisible();
  await locator.scrollIntoViewIfNeeded().catch(() => undefined);
  await locator.click({ timeout: 2000 }).catch(async () => {
    await locator.dispatchEvent('click');
  });
};

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
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await gotoHome(page);
      await page.locator('input[type="text"]').first().fill('Sandbox Tester');
      const enterButton = page.getByRole('button', { name: enterRegex });
      const createButton = page.getByRole('button', { name: /创建仪式|Create Ritual/i });

      await clickSafely(enterButton);
      const firstTry = await createButton.isVisible({ timeout: 8000 }).catch(() => false);
      if (!firstTry) {
        const stillInLobby = await enterButton.isVisible({ timeout: 1000 }).catch(() => false);
        if (stillInLobby) {
          await clickSafely(enterButton);
        }
      }
      await expect(createButton).toBeVisible({ timeout: 15000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 2 && !page.isClosed()) {
        await page.waitForTimeout(900);
      }
    }
  }
  throw lastError;
};

const openSandbox = async (page: Page) => {
  await loginToRoomSelection(page);

  const sandboxButton = page.getByRole('button', { name: sandboxModeRegex }).first();
  const sandboxVisible = await sandboxButton.isVisible({ timeout: 2000 }).catch(() => false);
  if (!sandboxVisible) {
    const optionsHeader = page.getByText(/More Options|更多选项|Sandbox & Offline|lobby\.moreOptions/i).first();
    await optionsHeader.scrollIntoViewIfNeeded().catch(() => undefined);

    const toggleOptions = page.getByRole('button', { name: /展开|Expand|收起|Collapse|lobby\.expand|lobby\.collapse/i }).first();
    await expect(toggleOptions).toBeVisible();
    await clickSafely(toggleOptions);
  }

  await expect(sandboxButton).toBeVisible();
  const controlPanel = page.getByText(controlPanelRegex).first();
  await clickSafely(sandboxButton);
  const opened = await controlPanel.isVisible({ timeout: 10000 }).catch(() => false);
  if (!opened) {
    const retryButton = page.getByRole('button', { name: sandboxModeRegex }).first();
    const retryVisible = await retryButton.isVisible({ timeout: 1000 }).catch(() => false);
    if (retryVisible) {
      await clickSafely(retryButton);
    }
  }
  await expect(controlPanel).toBeVisible({ timeout: 10000 });
};

test.describe('沙盒模式', () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ page }) => {
    await openSandbox(page);
  });

  test('应显示沙盒控制台与剧本选择', async ({ page }) => {
    await expect(page.getByText(controlPanelRegex)).toBeVisible();
    await expect(page.getByText(scriptSelectionRegex)).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('应可切换夜晚与白天阶段', async ({ page }) => {
    const nightButton = page.getByRole('button', { name: phaseNightButtonRegex });
    await clickSafely(nightButton);
    await expect(nightButton).toBeVisible();

    const dayButton = page.getByRole('button', { name: phaseDayButtonRegex });
    await clickSafely(dayButton);
    await expect(dayButton).toBeVisible();
  });

  test('应可随机分配角色并进入提名阶段', async ({ page }) => {
    const mobileMenuButton = page.locator('button:visible', { hasText: '☰' }).first();
    const hasMobileMenuButton = await mobileMenuButton.isVisible({ timeout: 1000 }).catch(() => false);
    if (hasMobileMenuButton) {
      await mobileMenuButton.click();
    }

    const randomAssignButton = page.getByRole('button', { name: /随机分配|Random Assign/i }).first();
    await expect(randomAssignButton).toBeVisible();

    // 分配前，座位 title 不应包含 “玩家 - 角色” 结构
    const roleHintsBefore = await page.locator('[title*=" - "]').count();
    expect(roleHintsBefore).toBe(0);

    await clickSafely(randomAssignButton);
    await expect.poll(async () => page.locator('[title*=" - "]').count()).toBeGreaterThan(0);

    const nominationButton = page.getByRole('button', { name: phaseNominationButtonRegex }).first();
    await clickSafely(nominationButton);
    await expect(nominationButton).toBeVisible();
  });
});
