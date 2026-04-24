import { expect, test, goto, withMockedApp } from './support/fixtures.js';

const storage = {
  token: 'token-pc',
  userRole: 'pc',
  username: 'pc.user',
  authToken: 'token-pc',
};

test.describe('VAC workflows, dashboards, and reports', () => {
  test('vac link generation creates a registration link and vac form accepts uploads', async ({ page, appUrl, mockState }) => {
    await withMockedApp(page, appUrl, mockState, storage);

    await goto(page, appUrl, '/VAC-Link.html');
    await page.locator('#courseName1').fill('Data Analytics');
    await page.locator('#courseCode1').fill('VAC220');
    await page.locator('#duration1').fill('20');
    await page.locator('#timesOffered1').fill('2');
    await page.locator('#coordinator1').fill('Dr. Raj Verma');
    await page.getByRole('button', { name: /Link Generate/i }).click();
    await expect(page.locator('#successSection')).toHaveClass(/show/);
    await expect(page.locator('#studentFormLink')).toContainText('Student-Registration-form.html?vacId=');

    await goto(page, appUrl, '/vac-form.html');
    await page.locator('#courseName1').fill('Advanced Excel');
    await page.locator('#courseCode1').fill('VAC300');
    await page.locator('#programId1').fill('PROG-101');
    await page.locator('#programmecode').fill('BCA');
    await page.locator('#duration1').fill('15');
    await page.locator('#timesOffered1').fill('3');
    await page.locator('#studentsEnrolled1').fill('50');
    await page.locator('#studentsCompleted1').fill('46');
    await page.locator('#brochureLink1').fill('https://example.test/vac300');
    await page.locator('#coordinator1').fill('Dr. Kavita');
    await page.locator('input[type="file"]#certificateUpload').setInputFiles({
      buffer: Buffer.from('vac brochure'),
      mimeType: 'application/pdf',
      name: 'vac-brochure.pdf',
    });
    await page.getByRole('button', { name: /Send Data/i }).click();
    await expect(page.locator('#popup')).toHaveClass(/open-popup/);
  });

  test('vac dashboard loads submissions and supports local clear action', async ({ page, appUrl, mockState }) => {
    await withMockedApp(page, appUrl, mockState, storage);
    await goto(page, appUrl, '/VAC-Dashboard.html');

    await expect(page.locator('#tableBody')).toContainText('Aman Singh');
    await expect(page.locator('#tableBody')).toContainText('BCA');

    await page.getByRole('button', { name: /Clear Dashboard/i }).click();
    await expect(page.locator('#tableBody')).toContainText('Dashboard cleared locally');
  });

  test('pc dashboard opens modal views for PC and VAC submissions', async ({ page, appUrl, mockState }) => {
    await withMockedApp(page, appUrl, mockState, storage);
    await goto(page, appUrl, '/pcdashboard.html?programId=PROG-101&code=BCA');

    await page.getByRole('button', { name: 'View Details' }).nth(0).click();
    const pcModal = page.locator('.vac-modal');
    await expect(pcModal).toContainText('My Programme Submissions');
    await pcModal.getByRole('button', { name: 'View' }).click();
    await expect(page.locator('.entry-details-pc')).toContainText('Programme: BCA');
    await page.locator('#pcClose').click();

    await page.getByRole('button', { name: 'View Details' }).nth(1).click();
    const vacModal = page.locator('.vac-modal');
    await expect(vacModal).toContainText('VAC Entries');
    await vacModal.getByRole('button', { name: 'View' }).click();
    await expect(page.locator('.entry-details')).toContainText('Web Development');
  });

  test('consolidated report renders data, filters it, and triggers downloads', async ({ page, appUrl, mockState }) => {
    await withMockedApp(page, appUrl, mockState, storage);
    await goto(page, appUrl, '/consolidated-report.html');

    await expect(page.locator('#summary-text')).toContainText('Total Submissions');
    await expect(page.locator('#forms-container')).toContainText('VAC Forms');
    await expect(page.locator('#forms-container')).toContainText('Library Forms');

    await page.locator('#filterFormType').selectOption('Library');
    await page.getByRole('button', { name: /Apply Filters/i }).click();
    await expect(page.locator('#forms-container')).toContainText('Library Forms');
    await expect(page.locator('#forms-container')).not.toContainText('VAC Forms');

    const [pdfRequest] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('/api/consolidated-report/download-pdf') && request.method() === 'POST'),
      page.getByRole('button', { name: /Download PDF/i }).click(),
    ]);
    expect(pdfRequest.url()).toContain('formType=Library');

    const [excelRequest] = await Promise.all([
      page.waitForRequest((request) => request.url().includes('/api/consolidated-report/download-excel') && request.method() === 'GET'),
      page.getByRole('button', { name: /Download Excel/i }).click(),
    ]);
    expect(excelRequest.url()).toContain('formType=Library');
  });
});
