import { expect, test, goto, withMockedApp } from './support/fixtures.js';

const loggedInStorage = {
  token: 'token-faculty',
  userRole: 'faculty',
  username: 'faculty.user',
  authToken: 'token-faculty',
};

test.describe('Academic form submissions', () => {
  test('submits e-content, capacity, teaching, experiential, learner support, and library forms', async ({ page, appUrl, mockState }) => {
    await withMockedApp(page, appUrl, mockState, loggedInStorage);

    await goto(page, appUrl, '/E-content-form.html');
    await page.locator('input[name="faculty"]').fill('Dr. Meera Sharma');
    await page.locator('input[name="moduleName"]').fill('ERP Concepts');
    await page.locator('input[name="platform"]').fill('YouTube');
    await page.locator('input[name="dateOfLaunch"]').fill('2026-04-01');
    await page.locator('input[name="link"]').fill('https://example.test/econtent');
    await page.getByRole('button', { name: /Submit Programme Details/i }).click();
    await expect(page.locator('#popup')).toHaveClass(/open-popup/);

    await goto(page, appUrl, '/E-capacity_dev-form.html');
    await page.locator('#activityName').fill('Communication Workshop');
    await page.locator('#activityType').fill('Workshop');
    await page.locator('#year').fill('2026');
    await page.locator('#students').fill('60');
    await page.locator('#resourcePerson').fill('Mr. S. Patel');
    await page.locator('#documentLink').fill('https://example.test/capacity');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.locator('#popup')).toHaveClass(/open-popup/);

    await goto(page, appUrl, '/Teaching_learning-form.html');
    await page.locator('input[name="pedagogy"]').fill('Case Study Method');
    await page.locator('input[name="mapping"]').fill('BCA Semester 2');
    await page.locator('input[name="evidenceLink"]').fill('https://example.test/teaching');
    await page.getByRole('button', { name: /Submit Pedagogy Details/i }).click();
    await expect(page.locator('#popup')).toHaveClass(/open-popup/);

    await goto(page, appUrl, '/Experiential-form.html');
    await page.locator('input[name="componentType"]').fill('Lab Simulation');
    await page.locator('input[name="objective"]').fill('Hands-on ERP practice');
    await page.locator('input[name="coMapped"]').fill('CO-2');
    await page.locator('input[name="rubrics"]').fill('Checklist');
    await page.locator('input[name="evidenceLink"]').fill('https://example.test/experiential');
    await page.locator('input[name="reportSubmitted"]').fill('Yes');
    await page.getByRole('button', { name: /Submit Component Details/i }).click();
    await expect(page.locator('#popup')).toHaveClass(/open-popup/);

    await goto(page, appUrl, '/Learner_support-form.html');
    await page.locator('#criteriaUsed').fill('Internal assessment');
    await page.locator('#slowLearnersCount').fill('8');
    await page.locator('#advancedLearnersCount').fill('12');
    await page.locator('#outcome').fill('Performance improved');
    await page.locator('#measuresTaken').fill('Mentoring sessions');
    await page.locator('#evidenceLink').fill('https://example.test/support');
    await page.getByRole('button', { name: /Submit Support Details/i }).click();
    await expect(page.locator('#popup')).toHaveClass(/open-popup/);

    await goto(page, appUrl, '/Library-form.html');
    await page.locator('#booksRecommended').fill('Clean Code, Refactoring');
    await page.locator('#newBooksAdded').fill('10');
    await page.locator('#eResources').fill('JSTOR');
    await page.locator('#recommendationLink').fill('https://example.test/library');
    await page.getByRole('button', { name: /Submit Library Details/i }).click();
    await expect(page.locator('#popup')).toHaveClass(/open-popup/);
  });

  test('submits programme coordinator and student registration forms with file uploads', async ({ page, appUrl, mockState }) => {
    await withMockedApp(page, appUrl, mockState, loggedInStorage);

    await goto(page, appUrl, '/PC-form.html');
    await page.locator('input[name="academicYear"]').fill('2025-26');
    await page.locator('input[name="programmeCode"]').fill('MBA');
    await page.locator('#department').selectOption('Management');
    await page.locator('input[name="yearOfIntroduction"]').fill('2014');
    await page.locator('input[name="schoolName"]').fill('PIMR');
    await page.locator('input[name="coordinatorName"]').fill('Dr. Kavita');
    await page.locator('#semesterSelect').selectOption('2');
    await page.locator('input[name="coordinatorEmail"]').fill('kavita@example.test');
    await page.locator('input[name="programmeName"]').fill('Master of Business Administration');
    await page.locator('input[name="coordinatorContact"]').fill('9876543210');
    await page.locator('#PCdocument').setInputFiles({
      buffer: Buffer.from('pc document'),
      mimeType: 'application/pdf',
      name: 'pc-document.pdf',
    });
    await page.getByRole('button', { name: /Submit Programme Details/i }).click();
    await expect(page).toHaveURL(/pcdashboard\.html\?programId=PROG-PC$/);

    await goto(page, appUrl, '/Student-Registration-form.html?vacId=507f1f77bcf86cd799439011&programId=PROG-101');
    await page.locator('input[name="studentName"]').fill('Ananya Gupta');
    await page.locator('#dept').selectOption('IT');
    await page.locator('#level').selectOption('UG');
    await expect(page.locator('#course')).toHaveValue('BCA');
    await page.locator('#semester').selectOption('3');
    await page.locator('input[name="enrollmentNumber"]').fill('ENR103');
    await page.locator('input[name="phoneNumber"]').fill('9876543210');
    await page.locator('input[type="radio"][value="Yes"]').check();
    await page.locator('input[name="certificateUpload"]').setInputFiles({
      buffer: Buffer.from('certificate'),
      mimeType: 'application/pdf',
      name: 'certificate.pdf',
    });
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.locator('#popup')).toHaveClass(/open/);
  });
});
