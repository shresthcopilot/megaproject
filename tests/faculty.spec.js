import { expect, test, goto, withMockedApp } from './support/fixtures.js';

const facultyStorage = {
  token: 'token-admin',
  authToken: 'token-admin',
};

test.describe('Faculty directory management', () => {
  test('faculty page loads, filters by search, and performs CRUD actions', async ({ page, appUrl, mockState }) => {
    await withMockedApp(page, appUrl, mockState, facultyStorage);
    await goto(page, appUrl, '/faculty.html');

    await expect(page.locator('#facultyContainer table')).toHaveCount(3);

    await page.locator('#searchInput').fill('Raj');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('#facultyContainer')).toContainText('Dr. Raj Verma');
    await expect(page.locator('#facultyContainer')).not.toContainText('Dr. Meera Sharma');

    await page.getByRole('button', { name: /\+ Add Faculty/i }).click();
    await page.locator('#addName').fill('Prof. Isha Rao');
    await page.locator('#addDesignation').fill('Assistant Professor');
    await page.locator('#addDepartment').fill('Commerce');
    await page.locator('#addQualification').fill('MBA');
    await page.getByRole('button', { name: 'Add Faculty', exact: true }).click();

    await page.locator('#searchInput').fill('');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.locator('#facultyContainer')).toContainText('Prof. Isha Rao');

    await page.getByRole('button', { name: 'Edit' }).nth(0).click();
    await page.locator('#editDesignation').fill('Senior Professor');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.locator('#facultyContainer')).toContainText('Senior Professor');

    await page.locator('tr', { hasText: 'Prof. Isha Rao' }).getByRole('button', { name: 'Delete' }).click();
    await expect(page.locator('#facultyContainer')).not.toContainText('Prof. Isha Rao');
  });
});
