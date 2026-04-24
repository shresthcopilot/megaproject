import { expect, test, goto, withMockedApp } from './support/fixtures.js';

test.describe('Authentication flows', () => {
  test('admin login redirects to the admin dashboard and stores auth state', async ({ page, appUrl, mockState }) => {
    await withMockedApp(page, appUrl, mockState);
    await goto(page, appUrl, '/');

    await page.locator('#username').fill('admin@prestigegwl.org');
    await page.locator('#password').fill('Admin@123');
    await page.getByRole('button', { name: 'login' }).click();

    await expect(page).toHaveURL(/admindashboard\.html$/);
    await expect(page.evaluate(() => localStorage.getItem('token'))).resolves.toBe('token-admin');
    await expect(page.evaluate(() => localStorage.getItem('userRole'))).resolves.toBe('admin');
  });

  test('faculty login requires selecting a role and routes to the faculty page', async ({ page, appUrl, mockState }) => {
    await withMockedApp(page, appUrl, mockState);
    await goto(page, appUrl, '/');

    await page.locator('#facultyBtn').click();
    await page.locator('#username').fill('faculty.user');
    await page.locator('#password').fill('Faculty@123');
    await page.locator('#customSelect .selected').click();
    await page.locator('#customSelect .options li[data-value="faculty"]').click();
    await page.getByRole('button', { name: 'login' }).click();

    await expect(page).toHaveURL(/faculty\.html$/);
    await expect(page.evaluate(() => localStorage.getItem('userRole'))).resolves.toBe('faculty');
  });

  test('login blocks submission when required inputs are missing', async ({ page, appUrl, mockState }) => {
    await withMockedApp(page, appUrl, mockState);
    await goto(page, appUrl, '/');

    await page.getByRole('button', { name: 'login' }).click();

    await expect(page).toHaveURL(`${appUrl}/`);
  });
});
