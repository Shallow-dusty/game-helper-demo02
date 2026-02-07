import { test, expect, type Page } from '@playwright/test';

const enterRegex = /进入魔典|Enter Grimoire|以玩家身份进入|Enter as Player/i;
const storytellerModeRegex = /说书人模式|Storyteller Mode/i;
const createRoomRegex = /创建仪式|Create Ritual/i;

const gotoHome = async (page: Page) => {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(page.locator('#root')).toBeVisible({ timeout: 10_000 });
};

const loginAsStoryteller = async (page: Page, name: string) => {
  await gotoHome(page);
  await page.locator('input[type="text"]').first().fill(name);

  const modeToggle = page.getByText(storytellerModeRegex).first();
  await expect(modeToggle).toBeVisible({ timeout: 10_000 });
  await modeToggle.click();

  await page.getByRole('button', { name: enterRegex }).click();
  await expect(page.getByRole('button', { name: createRoomRegex })).toBeVisible({ timeout: 15_000 });
};

const setSeatCountToFive = async (page: Page) => {
  const slider = page.locator('input[type="range"]').first();
  await slider.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = '5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect.poll(async () => slider.inputValue()).toBe('5');
};

const runStoreAction = async (page: Page, action: string, ...args: unknown[]): Promise<unknown> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await page.evaluate(
        async ({ actionName, actionArgs }) => {
          const modulePath = '/src/store.ts';
          const { useStore } = await import(/* @vite-ignore */ modulePath);
          const fn = (useStore.getState() as Record<string, unknown>)[actionName];
          if (typeof fn !== 'function') {
            throw new Error(`Action not found: ${actionName}`);
          }
          return await (fn as (...fnArgs: unknown[]) => unknown)(...actionArgs);
        },
        { actionName: action, actionArgs: args }
      );
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('Execution context was destroyed') || attempt === 3) {
        throw error;
      }
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('#root')).toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(200);
    }
  }
  throw lastError;
};

const getCurrentRoomId = async (page: Page): Promise<string | null> =>
  page.evaluate(async () => {
    const modulePath = '/src/store.ts';
    const { useStore } = await import(/* @vite-ignore */ modulePath);
    return useStore.getState().gameState?.roomId ?? null;
  });

const getLatestVoteNominee = async (page: Page): Promise<number | null> =>
  page.evaluate(async () => {
    const modulePath = '/src/store.ts';
    const { useStore } = await import(/* @vite-ignore */ modulePath);
    const history = useStore.getState().gameState?.voteHistory ?? [];
    if (history.length === 0) return null;
    return history[history.length - 1]?.nomineeSeatId ?? null;
  });

const getCurrentPhase = async (page: Page): Promise<string | null> =>
  page.evaluate(async () => {
    const modulePath = '/src/store.ts';
    const { useStore } = await import(/* @vite-ignore */ modulePath);
    return useStore.getState().gameState?.phase ?? null;
  });

const isGameOver = async (page: Page): Promise<boolean> =>
  page.evaluate(async () => {
    const modulePath = '/src/store.ts';
    const { useStore } = await import(/* @vite-ignore */ modulePath);
    return useStore.getState().gameState?.gameOver?.isOver ?? false;
  });

const getWinner = async (page: Page): Promise<string | null> =>
  page.evaluate(async () => {
    const modulePath = '/src/store.ts';
    const { useStore } = await import(/* @vite-ignore */ modulePath);
    return useStore.getState().gameState?.gameOver?.winner ?? null;
  });

const setVotingResultForExecution = async (page: Page): Promise<void> => {
  await page.evaluate(async () => {
    const modulePath = '/src/store.ts';
    const { useStore } = await import(/* @vite-ignore */ modulePath);
    useStore.setState((state) => {
      const voting = state.gameState?.voting;
      if (!voting) return;
      voting.votes = [0, 1, 2];
    });
  });
};

test.describe('多座位真实流程仿真', () => {
  test.describe.configure({ timeout: 120_000 });

  test('create -> assign -> night -> vote -> end', async ({ page }) => {
    await loginAsStoryteller(page, 'Host-ST');
    await setSeatCountToFive(page);
    await page.getByRole('button', { name: createRoomRegex }).click();

    await expect.poll(async () => getCurrentRoomId(page), { timeout: 12_000 }).not.toBeNull();
    const roomCode = await getCurrentRoomId(page);
    expect(roomCode).toMatch(/^[A-Z0-9]{4}$/);

    await runStoreAction(page, 'joinSeat', 0);
    await runStoreAction(page, 'addVirtualPlayer');
    await runStoreAction(page, 'addVirtualPlayer');

    await runStoreAction(page, 'assignRoles');
    await runStoreAction(page, 'startGame');
    await runStoreAction(page, 'setPhase', 'DAY');

    await runStoreAction(page, 'startVote', 2, 1);
    await setVotingResultForExecution(page);
    await runStoreAction(page, 'closeVote');
    await runStoreAction(page, 'setPhase', 'NIGHT');

    await expect.poll(async () => getLatestVoteNominee(page), { timeout: 10_000 }).toBe(2);
    await expect.poll(async () => getCurrentPhase(page), { timeout: 10_000 }).toBe('NIGHT');

    await runStoreAction(page, 'endGame', 'GOOD', 'E2E simulated finish');

    await expect.poll(async () => isGameOver(page), { timeout: 10_000 }).toBe(true);
    expect(await getWinner(page)).toBe('GOOD');
  });
});
