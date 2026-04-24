function jsonResponse(route, body, status = 200, headers = {}) {
  return route.fulfill({
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function textResponse(route, body, status = 200, headers = {}) {
  return route.fulfill({
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...headers,
    },
    body,
  });
}

function blobResponse(route, body, contentType, filename) {
  return route.fulfill({
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': contentType,
    },
    body,
  });
}

function readRequestJson(route) {
  try {
    return route.request().postDataJSON();
  } catch {
    return {};
  }
}

function buildSummary(data) {
  return {
    totalVac: data.vac.length,
    totalLibrary: data.library.length,
    totalEcontent: data.econtent.length,
    totalCapacity: data.capacity.length,
    totalTeaching: data.teaching.length,
    totalExperiential: data.experiential.length,
    totalLearnerSupport: data.learnerSupport.length,
    totalPc: data.pc.length,
    grandTotal:
      data.vac.length +
      data.library.length +
      data.econtent.length +
      data.capacity.length +
      data.teaching.length +
      data.experiential.length +
      data.learnerSupport.length +
      data.pc.length,
  };
}

export function createMockState() {
  return {
    users: [
      { _id: 'user-admin', username: 'admin@prestigegwl.org', role: 'admin' },
      { _id: 'user-faculty', username: 'faculty.user', role: 'faculty' },
      { _id: 'user-pc', username: 'pc.user', role: 'pc' },
      { _id: 'user-library', username: 'library.user', role: 'library' },
    ],
    faculty: [
      { _id: 'fac-1', name: 'Dr. Meera Sharma', designation: 'Professor', department: 'Management', qualification: 'PhD' },
      { _id: 'fac-2', name: 'Dr. Raj Verma', designation: 'Associate Professor', department: 'IT', qualification: 'PhD' },
      { _id: 'fac-3', name: 'Dr. Nisha Jain', designation: 'Dean', department: 'Academic Leaders', qualification: 'PhD', isLeader: true },
    ],
    vacEntries: [
      {
        _id: 'vac-entry-1',
        id: 'vac-entry-1',
        formType: 'VAC',
        program_Id: 'PROG-101',
        createdAt: '2026-04-10T10:00:00.000Z',
        sentToCoordinator: true,
        courses: [
          {
            courseName: 'Web Development',
            courseCode: 'VAC101',
            duration: 30,
            timesOffered: 2,
            studentsEnrolled: '45',
            studentsCompleted: '42',
            brochureLink: 'https://example.test/vac101',
            coordinator: 'Dr. Raj Verma',
          },
        ],
      },
    ],
    vacSubmissions: [
      {
        studentName: 'Aman Singh',
        enrollmentNumber: 'ENR001',
        phoneNumber: '9876543210',
        courseCompleted: 'Yes',
        department: 'IT',
        level: 'UG',
        semester: '2',
        courseSelect: 'BCA',
        createdAt: '2026-04-12T09:30:00.000Z',
      },
    ],
    pcEntries: [
      {
        _id: 'pc-entry-1',
        id: 'pc-entry-1',
        programmeCode: 'BCA',
        programmeName: 'Bachelor of Computer Applications',
        academicYear: '2025-26',
        linkedCoursesCount: 3,
        program_Id: 'PROG-101',
        createdAt: '2026-04-08T08:00:00.000Z',
      },
    ],
    reportData: {
      vac: [
        {
          formType: 'VAC',
          program_Id: 'PROG-101',
          createdAt: '2026-04-10T10:00:00.000Z',
          courses: [
            {
              courseName: 'Web Development',
              courseCode: 'VAC101',
              duration: 30,
              timesOffered: 2,
              studentsEnrolled: '45',
              studentsCompleted: '42',
              brochureLink: 'https://example.test/vac101',
              coordinator: 'Dr. Raj Verma',
            },
          ],
        },
      ],
      library: [
        {
          formType: 'Library',
          booksRecommended: 'Clean Code',
          newBooksAdded: 12,
          eResources: 'IEEE Xplore',
          recommendationLink: 'https://example.test/library',
          program_Id: 'PROG-101',
          department: 'IT',
          semester: '2',
        },
      ],
      econtent: [
        {
          formType: 'E-Content',
          faculty: 'Dr. Meera Sharma',
          moduleName: 'ERP Basics',
          platform: 'YouTube',
          dateOfLaunch: '2026-04-01',
          link: 'https://example.test/econtent',
          program_Id: 'PROG-101',
          department: 'Management',
          semester: '4',
        },
      ],
      capacity: [],
      teaching: [],
      experiential: [],
      learnerSupport: [],
      pc: [
        {
          formType: 'PC',
          programmeCode: 'BCA',
          programmeName: 'Bachelor of Computer Applications',
          department: 'IT',
          semester: '2',
          coordinatorName: 'Dr. Raj Verma',
          program_Id: 'PROG-101',
        },
      ],
    },
  };
}

export async function installExternalAssetMocks(page, appUrl) {
  const appOrigin = new URL(appUrl).origin;

  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith(appOrigin) || url.startsWith('data:')) {
      await route.continue();
      return;
    }

    if (url.endsWith('.css') || url.includes('fonts.googleapis.com')) {
      await route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: '' });
      return;
    }

    if (url.endsWith('.js')) {
      await route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body: '' });
      return;
    }

    if (/\.(png|jpg|jpeg|gif|svg|woff2?|ttf)$/i.test(url) || url.includes('fonts.gstatic.com')) {
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    await route.abort();
  });
}

export async function seedLocalStorage(page, values = {}) {
  await page.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries)) {
      window.localStorage.setItem(key, value);
    }
  }, values);
}

export async function installMockApi(page, state = createMockState()) {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === '/api/auth/login' && method === 'POST') {
      const body = readRequestJson(route);
      return jsonResponse(route, {
        message: 'Login successful',
        token: `token-${body.role || 'user'}`,
        role: body.role || 'admin',
        user: body.username || 'test.user',
      });
    }

    if ((path === '/api/auth/register' || path === '/api/register') && method === 'POST') {
      const body = readRequestJson(route);
      const newUser = {
        _id: `user-${state.users.length + 1}`,
        username: body.username,
        role: (body.role || '').toLowerCase(),
      };
      state.users.push(newUser);
      return jsonResponse(route, { success: true, message: 'User registered successfully', data: newUser });
    }

    if (path === '/api/auth/users' && method === 'GET') {
      return jsonResponse(route, { success: true, data: state.users });
    }

    if (path.startsWith('/api/auth/users/') && method === 'PUT') {
      const userId = path.split('/').pop();
      const body = readRequestJson(route);
      const target = state.users.find((user) => user._id === userId);
      Object.assign(target, { username: body.username, role: body.role });
      return jsonResponse(route, { success: true, message: 'User updated successfully', data: target });
    }

    if (path.startsWith('/api/auth/users/') && method === 'DELETE') {
      const userId = path.split('/').pop();
      state.users = state.users.filter((user) => user._id !== userId);
      return jsonResponse(route, { success: true, message: 'User deleted successfully' });
    }

    if (path === '/api/faculty' && method === 'GET') {
      return jsonResponse(route, state.faculty);
    }

    if (path === '/api/faculty' && method === 'POST') {
      const body = readRequestJson(route);
      const newFaculty = { _id: `fac-${state.faculty.length + 1}`, ...body };
      state.faculty.push(newFaculty);
      return jsonResponse(route, { success: true, data: newFaculty });
    }

    if (path.startsWith('/api/faculty/') && method === 'PUT') {
      const facultyId = path.split('/').pop();
      const body = readRequestJson(route);
      const target = state.faculty.find((item) => item._id === facultyId);
      Object.assign(target, body);
      return jsonResponse(route, { success: true, data: target });
    }

    if (path.startsWith('/api/faculty/') && method === 'DELETE') {
      const facultyId = path.split('/').pop();
      state.faculty = state.faculty.filter((item) => item._id !== facultyId);
      return jsonResponse(route, { success: true });
    }

    if (path === '/api/vac/entries' && method === 'POST') {
      const contentType = request.headers()['content-type'] || '';
      const nextId = `vac-entry-${state.vacEntries.length + 1}`;

      if (contentType.includes('application/json')) {
        const body = readRequestJson(route);
        const entry = {
          _id: nextId,
          id: nextId,
          formType: 'VAC',
          createdAt: '2026-04-24T10:00:00.000Z',
          ...body,
        };
        state.vacEntries.push(entry);
        state.reportData.vac.push(entry);
        return jsonResponse(route, { success: true, id: nextId });
      }

      const fallbackEntry = {
        _id: nextId,
        id: nextId,
        formType: 'VAC',
        program_Id: 'PROG-UPLOADED',
        createdAt: '2026-04-24T10:00:00.000Z',
        courses: [
          {
            courseName: 'Uploaded VAC Course',
            courseCode: 'VAC-UP',
            duration: 10,
            timesOffered: 1,
            studentsEnrolled: '20',
            studentsCompleted: '18',
            brochureLink: 'https://example.test/uploaded',
            coordinator: 'Coordinator',
          },
        ],
      };
      state.vacEntries.push(fallbackEntry);
      state.reportData.vac.push(fallbackEntry);
      return jsonResponse(route, { success: true, message: 'VAC entry submitted', id: nextId });
    }

    if (path === '/api/vac/entries' && method === 'GET') {
      return jsonResponse(route, state.vacEntries);
    }

    if (path.startsWith('/api/vac/entries/') && path.endsWith('/download')) {
      return blobResponse(route, 'vac-entry-pdf', 'application/pdf', 'vac-entry.pdf');
    }

    if (path === '/api/vac/entries/download') {
      return blobResponse(route, 'all-vac-entries', 'application/pdf', 'vac-entries.pdf');
    }

    if (path.startsWith('/api/vac/entries/') && method === 'GET') {
      const entryId = path.split('/').at(-1);
      const entry = state.vacEntries.find((item) => (item._id || item.id) === entryId);
      return jsonResponse(route, entry || state.vacEntries[0]);
    }

    if (path === '/api/vac/submissions' && method === 'POST') {
      state.vacSubmissions.push({
        studentName: 'Submitted Student',
        enrollmentNumber: 'ENR002',
        phoneNumber: '9123456780',
        courseCompleted: 'Yes',
        department: 'IT',
        level: 'UG',
        semester: '3',
        courseSelect: 'BCA',
        createdAt: '2026-04-24T11:00:00.000Z',
      });
      return jsonResponse(route, { success: true });
    }

    if (path === '/api/vac/submissions' && method === 'GET') {
      return jsonResponse(route, state.vacSubmissions);
    }

    if (path === '/api/vac/download') {
      return blobResponse(route, 'vac-dashboard-pdf', 'application/pdf', 'vac-dashboard.pdf');
    }

    if (path === '/api/pc/submit' && method === 'POST') {
      const entry = {
        _id: `pc-entry-${state.pcEntries.length + 1}`,
        id: `pc-entry-${state.pcEntries.length + 1}`,
        programmeCode: 'MBA',
        programmeName: 'Master of Business Administration',
        academicYear: '2025-26',
        linkedCoursesCount: 1,
        program_Id: 'PROG-PC',
        createdAt: '2026-04-24T12:00:00.000Z',
      };
      state.pcEntries.push(entry);
      state.reportData.pc.push({
        formType: 'PC',
        programmeCode: entry.programmeCode,
        programmeName: entry.programmeName,
        department: 'Management',
        semester: '2',
        coordinatorName: 'Dr. Kavita',
        program_Id: entry.program_Id,
      });
      return jsonResponse(route, {
        success: true,
        message: 'Programme details submitted successfully',
        redirect: 'pcdashboard.html?programId=PROG-PC',
      });
    }

    if (path === '/api/pc/entries' && method === 'GET') {
      const programId = url.searchParams.get('programId');
      const data = programId ? state.pcEntries.filter((entry) => entry.program_Id === programId) : state.pcEntries;
      return jsonResponse(route, data);
    }

    if (path.startsWith('/api/econtent/entries') || path.startsWith('/api/capacity/entries') || path.startsWith('/api/teaching/entries')) {
      if (method === 'GET') {
        return jsonResponse(route, [
          {
            _id: 'entry-1',
            id: 'entry-1',
            createdAt: '2026-04-24T12:00:00.000Z',
            program_Id: 'PROG-101',
            uploadedFile: 'evidence.pdf',
          },
        ]);
      }
    }

    if ((path === '/api/econtent/submit' || path === '/api/capacity/submit' || path === '/api/teaching/submit' || path === '/api/experiential/submit' || path === '/api/learner-support/submit' || path === '/api/library/submit') && method === 'POST') {
      return jsonResponse(route, { success: true, message: 'Submitted successfully' });
    }

    if (path === '/api/consolidated-report/all' && method === 'GET') {
      const data = {
        ...state.reportData,
        summary: buildSummary(state.reportData),
      };
      return jsonResponse(route, data);
    }

    if (path === '/api/consolidated-report/download-pdf' && method === 'POST') {
      return blobResponse(route, '%PDF-1.4 fake', 'application/pdf', 'consolidated-report.pdf');
    }

    if (path === '/api/consolidated-report/download-excel' && method === 'GET') {
      return blobResponse(
        route,
        'PK\x03\x04 fake excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'consolidated-report.xlsx',
      );
    }

    return jsonResponse(route, { success: true, message: 'Mocked API response' });
  });

  return state;
}
