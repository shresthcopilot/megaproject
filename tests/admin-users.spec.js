import { expect, test, goto, withMockedApp } from './support/fixtures.js';

const adminStorage = {
  token: 'token-admin',
  userRole: 'admin',
  username: 'admin@prestigegwl.org',
};

test.describe('Admin and user management', () => {
  test('admin dashboard renders live user counts and navigates to add-user flow', async ({ page, appUrl, mockState }) => {
    await withMockedApp(page, appUrl, mockState, adminStorage);
    await goto(page, appUrl, '/admindashboard.html');

    await expect(page.locator('#facultyCountDisplay')).toHaveText('1');
    await expect(page.locator('#activeUsersCountDisplay')).toHaveText('4');

    await page.getByRole('button', { name: '+ Add User' }).click();
    await expect(page).toHaveURL(/adduser\.html$/);
  });

  test('add user form validates password strength and redirects after successful registration', async ({ page, appUrl, mockState }) => {
    await withMockedApp(page, appUrl, mockState, adminStorage);
    await goto(page, appUrl, '/adduser.html');

    await page.locator('#username').fill('erp_coordinator');
    await page.locator('#password').fill('StrongPass1@');
    await page.locator('#confirmPassword').fill('StrongPass1@');
    await page.locator('#customSelect .selected').click();
    await page.locator('#customSelect .options li[data-value="pc"]').click();
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL(/admindashboard\.html$/);
  });

  test('active users management supports create, edit, and delete without backend dependencies', async ({ page, appUrl, mockState }) => {
    await withMockedApp(page, appUrl, mockState, adminStorage);
    await goto(page, appUrl, '/activeUsers.html');

    await expect(page.locator('tbody tr')).toHaveCount(4);

    await page.getByRole('button', { name: /Add User/i }).click();
    await page.locator('#addUsername').fill('fresh_user');
    await page.locator('#addRole').selectOption('library');
    await page.locator('#addPassword').fill('FreshUser1@');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.locator('tbody tr')).toHaveCount(5);
    await expect(page.locator('tbody')).toContainText('fresh_user');

    await page.getByRole('button', { name: /Edit/i }).nth(0).click();
    await page.locator('#addUsername').fill('admin.updated');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('tbody')).toContainText('admin.updated');

    await page.getByRole('button', { name: /Delete/i }).last().click();
    await expect(page.locator('tbody tr')).toHaveCount(4);
  });
});
