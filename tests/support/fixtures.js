import { test as base, expect } from '@playwright/test';
import { createStaticServer } from './static-server.js';
import { createMockState, installExternalAssetMocks, installMockApi, seedLocalStorage } from './mock-api.js';

const serverPromise = createStaticServer();

export const test = base.extend({
  appUrl: async ({}, use) => {
    const server = await serverPromise;
    await use(server.origin);
  },

  mockState: async ({}, use) => {
    await use(createMockState());
  },

  page: async ({ page, appUrl }, use) => {
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await installExternalAssetMocks(page, appUrl);
    await use(page);
  },
});

export { expect };

export async function withMockedApp(page, appUrl, mockState, storage = {}) {
  await installMockApi(page, mockState);
  if (Object.keys(storage).length) {
    await seedLocalStorage(page, storage);
  }
}

export async function goto(page, appUrl, pathname) {
  await page.goto(`${appUrl}${pathname}`);
}
