import { expect, test, goto, withMockedApp } from './support/fixtures.js';

const smokePages = [
  ['/Academics.html', 'Academic Reports'],
  ['/admindashboard.html', 'WELCOME, ADMIN'],
  ['/attendancedashboard.html', 'Attendance'],
  ['/collaboration.html', 'Collaboration'],
  ['/events.html', 'Events'],
  ['/feedback.html', 'Feedback'],
  ['/governing.html', 'Governing'],
  ['/navbar.html', 'Logout'],
  ['/navbar-component.html', 'Logout'],
];

test.describe('Static page smoke coverage', () => {
  for (const [pathname, marker] of smokePages) {
    test(`loads ${pathname}`, async ({ page, appUrl, mockState }) => {
      await withMockedApp(page, appUrl, mockState, {
        token: 'token-smoke',
        userRole: 'admin',
        username: 'smoke.user',
        authToken: 'token-smoke',
      });

      await goto(page, appUrl, pathname);
      await expect(page.locator('body')).toContainText(marker);
    });
  }
});
