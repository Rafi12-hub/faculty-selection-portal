/**
 * Faculty–Student Selection Portal (FSSP)
 * Administrator Management Engine (9 Full Sections)
 */

let ADMIN_DATA = {
  stats: null,
  faculty: [],
  subjects: [],
  mappings: [],
  students: [],
  rounds: [],
  selections: [],
  auditLogs: [],
  openElectives: null,
  oeReports: null,
  emailLogs: [],
  emailStats: null,
  emailFilter: 'ALL',
  emailSearch: ''
};

// Switch between Admin Tabs (including Open Electives & Email Notifications)
function switchAdminTab(tabName) {
  STATE.activeAdminTab = tabName;

  // Update nav buttons
  const navButtons = document.querySelectorAll('#admin-nav-bar button');
  navButtons.forEach(btn => {
    btn.className = 'px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 text-slate-600 hover:bg-slate-100';
  });

  const activeBtn = document.getElementById(`adm-nav-${tabName}`);
  if (activeBtn) {
    activeBtn.className = 'px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 bg-blue-600 text-white shadow-sm';
  }

  // Clear live poll if leaving live selections tab
  if (STATE.liveInterval && tabName !== 'live') {
    clearInterval(STATE.liveInterval);
    STATE.liveInterval = null;
  }

  // Route to corresponding tab loader
  switch (tabName) {
    case 'dashboard': loadAdminDashboard(); break;
    case 'open-electives':
    case 'mappings':
      loadAdminMappings();
      break;
    case 'students': loadAdminStudents(); break;
    case 'faculty': loadAdminFaculty(); break;
    case 'subjects': loadAdminSubjects(); break;
    case 'rounds': loadAdminRounds(); break;
    case 'live': loadAdminLiveSelections(); break;
    case 'reports': loadAdminReports(); break;
    case 'audit': loadAdminAudit(); break;
    case 'emails': loadAdminEmails(); break;
  }
}
window.switchAdminTab = switchAdminTab;

// =========================================================================
// 1. DASHBOARD
// =========================================================================
async function loadAdminDashboard() {
  const container = document.getElementById('admin-tab-content');
  container.innerHTML = `<div class="py-12 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>`;

  try {
    const res = await api.get('/api/reports/dashboard-stats');
    if (!res || !res.success) throw new Error('Could not load dashboard statistics.');

    const stats = res.stats;
    ADMIN_DATA.stats = stats;

    const cards = [
      { label: 'Total Students', value: stats.total_students, icon: 'fa-users', color: 'blue', desc: 'Registered students' },
      { label: 'Total Faculty', value: stats.total_faculty, icon: 'fa-chalkboard-user', color: 'indigo', desc: 'Active records only' },
      { label: 'Total Subjects', value: stats.total_subjects, icon: 'fa-book', color: 'violet', desc: 'Academic courses' },
      { label: 'Total Mappings', value: stats.total_mappings, icon: 'fa-diagram-project', color: 'cyan', desc: 'Faculty–Subject pairs' },
      { label: 'Total Available Seats', value: stats.total_available_seats, icon: 'fa-chair', color: 'emerald', desc: 'Open capacity' },
      { label: 'Total Allocated Seats', value: stats.total_allocated_seats, icon: 'fa-user-check', color: 'amber', desc: 'Claimed by students' },
      { label: 'Confirmed Selections', value: stats.confirmed_selections, icon: 'fa-circle-check', color: 'green', desc: 'Active allocations' },
      { label: 'Cancelled Selections', value: stats.cancelled_selections, icon: 'fa-circle-xmark', color: 'rose', desc: 'Historical cancellations' }
    ];

    const occupancyRate = stats.total_capacity > 0 ? Math.round((stats.total_allocated_seats / stats.total_capacity) * 100) : 0;

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Top Stats Grid (8 Required Stat Cards) -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${cards.map(c => `
            <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover-lift">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">${c.label}</span>
                <div class="w-8 h-8 rounded-xl bg-${c.color}-50 text-${c.color}-600 flex items-center justify-center text-sm">
                  <i class="fa-solid ${c.icon}"></i>
                </div>
              </div>
              <div class="mt-3">
                <div class="text-2xl font-black text-slate-900 tracking-tight">${c.value}</div>
                <div class="text-[11px] text-slate-400 mt-0.5">${c.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Middle Row: Capacity Meter & Quick Actions -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h4 class="text-sm font-bold text-slate-900">Total Seat Allocation Status</h4>
                <p class="text-xs text-slate-500">Live First-Come First-Served seat occupancy across all subjects</p>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-bold ${occupancyRate > 90 ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}">
                ${occupancyRate}% Occupied
              </span>
            </div>

            <div class="w-full bg-slate-100 rounded-full h-4 overflow-hidden p-0.5 border border-slate-200">
              <div class="h-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-700" style="width: ${occupancyRate}%"></div>
            </div>

            <div class="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100 text-center">
              <div>
                <div class="text-xs text-slate-500">Total Mapped Capacity</div>
                <div class="text-lg font-bold text-slate-900 mt-0.5">${stats.total_capacity} seats</div>
              </div>
              <div>
                <div class="text-xs text-slate-500">Allocated Seats</div>
                <div class="text-lg font-bold text-blue-600 mt-0.5">${stats.total_allocated_seats} seats</div>
              </div>
              <div>
                <div class="text-xs text-slate-500">Remaining Available</div>
                <div class="text-lg font-bold text-emerald-600 mt-0.5">${stats.total_available_seats} seats</div>
              </div>
            </div>
          </div>

          <!-- Quick Navigation Panel -->
          <div class="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <div class="text-xs uppercase tracking-wider text-blue-400 font-bold mb-1">Administrative Shortcuts</div>
              <h4 class="text-base font-bold text-white">Manual Dataset Builder</h4>
              <p class="text-xs text-slate-300 mt-1 leading-relaxed">
                Add faculty members manually, assign them to subjects with individual capacities, and manage student datasets.
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-6">
              <button onclick="openAddFacultyModal()" class="py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors">
                <i class="fa-solid fa-user-plus text-blue-300"></i>
                <span>Add Faculty</span>
              </button>
              <button onclick="openAddSubjectModal()" class="py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors">
                <i class="fa-solid fa-plus text-indigo-300"></i>
                <span>Add Subject</span>
              </button>
              <button onclick="openAddMappingModal()" class="py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors">
                <i class="fa-solid fa-diagram-project text-cyan-300"></i>
                <span>New Mapping</span>
              </button>
              <button onclick="openAddStudentModal()" class="py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors">
                <i class="fa-solid fa-user-graduate text-emerald-300"></i>
                <span>Add Student</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="p-6 bg-rose-50 text-rose-700 rounded-2xl text-xs">${err.message}</div>`;
  }
}

// =========================================================================
// 2. FACULTY MANAGEMENT (Manual addition, strictly no logins/dashboards)
// =========================================================================
async function loadAdminFaculty() {
  const container = document.getElementById('admin-tab-content');
  container.innerHTML = `<div class="py-12 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>`;

  try {
    const res = await api.get('/api/faculty');
    ADMIN_DATA.faculty = res ? res.faculty : [];
    renderFacultyList();
  } catch (err) {
    container.innerHTML = `<div class="p-6 bg-rose-50 text-rose-700 rounded-2xl text-xs">${err.message}</div>`;
  }
}

function renderFacultyList() {
  const container = document.getElementById('admin-tab-content');
  const faculty = ADMIN_DATA.faculty || [];
  faculty.sort((a, b) => {
    const na = parseInt((a.faculty_code || '').replace(/\D/g, ''), 10) || 999999;
    const nb = parseInt((b.faculty_code || '').replace(/\D/g, ''), 10) || 999999;
    return na - nb;
  });

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header with Action & Search -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-900">Faculty Records Management</h3>
          <p class="text-xs text-slate-500">Faculty members are administrative database records only. They do not have login access or accounts.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">
              <i class="fa-solid fa-magnifying-glass"></i>
            </span>
            <input type="text" id="faculty-search-input" oninput="filterFacultyLocal()" placeholder="Search code, name, dept..." class="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 w-48 sm:w-64">
          </div>
          <button onclick="openAddFacultyModal()" class="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all">
            <i class="fa-solid fa-user-plus"></i>
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      <!-- Faculty List Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs" id="faculty-table">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3.5 px-6">Faculty Member</th>
                <th class="py-3.5 px-6">Designation & Qualification</th>
                <th class="py-3.5 px-6">Specialization</th>
                <th class="py-3.5 px-6">Assigned Subjects</th>
                <th class="py-3.5 px-6">Total Capacity</th>
                <th class="py-3.5 px-6">Status</th>
                <th class="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100" id="faculty-table-body">
              ${faculty.length === 0 ? `
                <tr>
                  <td colspan="7" class="py-16 text-center text-slate-400">
                    <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-lg mb-2">
                      <i class="fa-solid fa-chalkboard-user"></i>
                    </div>
                    <div class="font-bold text-slate-700">No Faculty Records in Database</div>
                    <div class="text-xs text-slate-400 mt-0.5">Click "Add Faculty" above to manually add faculty members.</div>
                  </td>
                </tr>
              ` : faculty.map(f => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-6">
                    <div class="font-bold text-slate-900">${f.name}</div>
                    <div class="mono-font text-[11px] text-blue-600 font-semibold">${f.faculty_code}</div>
                  </td>
                  <td class="py-3.5 px-6">
                    <div class="font-medium text-slate-800">${f.designation}</div>
                    <div class="text-[11px] text-slate-500">${f.qualification}</div>
                  </td>
                  <td class="py-3.5 px-6">
                    <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">${f.specialization}</span>
                  </td>
                  <td class="py-3.5 px-6 font-semibold text-slate-800">
                    ${f.assigned_subjects_count} Subject(s)
                  </td>
                  <td class="py-3.5 px-6">
                    <div class="font-bold text-slate-900">${f.total_allocated} / ${f.total_capacity} seats</div>
                    <div class="text-[11px] text-emerald-600 font-medium">${f.remaining_capacity} available</div>
                  </td>
                  <td class="py-3.5 px-6">
                    <button onclick="toggleFacultyStatus(${f.id}, '${f.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}')" class="px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${f.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}">
                      ${f.status}
                    </button>
                  </td>
                  <td class="py-3.5 px-6 text-right space-x-2">
                    <button onclick="viewFacultyDetails(${f.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View Assigned Subjects">
                      <i class="fa-solid fa-eye"></i>
                    </button>
                    <button onclick="openEditFacultyModal(${f.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit Faculty">
                      <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deleteFacultyRecord(${f.id}, '${escapeQuote(f.name)}')" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete Faculty">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function filterFacultyLocal() {
  const q = document.getElementById('faculty-search-input').value.toLowerCase().trim();
  const rows = document.querySelectorAll('#faculty-table-body tr');
  rows.forEach(r => {
    const text = r.textContent.toLowerCase();
    r.style.display = text.includes(q) ? '' : 'none';
  });
}

// Add Faculty Modal
function openAddFacultyModal() {
  openModal({
    title: 'Add New Faculty Member',
    maxWidth: 'max-w-xl',
    body: `
      <form id="form-add-faculty" onsubmit="submitAddFaculty(event)" class="space-y-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Faculty Name <span class="text-rose-500">*</span></label>
            <input type="text" id="fac-name" required placeholder="e.g. Dr. Ravi Kumar" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Faculty Code (Unique) <span class="text-rose-500">*</span></label>
            <input type="text" id="fac-code" required placeholder="e.g. FAC101" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl uppercase mono-font focus:ring-2 focus:ring-blue-500">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Designation <span class="text-rose-500">*</span></label>
            <select id="fac-designation" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500">
              <option value="Professor">Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Assistant Professor" selected>Assistant Professor</option>
              <option value="Adjunct Faculty">Adjunct Faculty</option>
              <option value="Visiting Professor">Visiting Professor</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Qualification <span class="text-rose-500">*</span></label>
            <input type="text" id="fac-qual" required placeholder="e.g. Ph.D (IIT Madras), M.Tech" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500">
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Specialization <span class="text-rose-500">*</span></label>
          <input type="text" id="fac-spec" required placeholder="e.g. Computer Networks, Cloud Computing" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500">
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Email (Optional)</label>
            <input type="email" id="fac-email" placeholder="faculty@university.edu" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
            <input type="text" id="fac-phone" placeholder="+91 9876543210" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Profile Image URL (Optional)</label>
          <input type="url" id="fac-img" placeholder="https://..." class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Description / Bio (Optional)</label>
          <textarea id="fac-desc" rows="2" placeholder="Brief academic profile or research areas..." class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"></textarea>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <input type="checkbox" id="fac-active" checked class="rounded border-slate-300 text-blue-600 focus:ring-blue-500">
          <label for="fac-active" class="font-semibold text-slate-700">Set Faculty Status as Active</label>
        </div>

        <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold">Cancel</button>
          <button type="submit" id="btn-save-faculty" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20">Save Faculty Record</button>
        </div>
      </form>
    `
  });
}

async function submitAddFaculty(e) {
  e.preventDefault();
  const body = {
    name: document.getElementById('fac-name').value.trim(),
    faculty_code: document.getElementById('fac-code').value.trim(),
    designation: document.getElementById('fac-designation').value,
    qualification: document.getElementById('fac-qual').value.trim(),
    specialization: document.getElementById('fac-spec').value.trim(),
    email: document.getElementById('fac-email').value.trim(),
    phone: document.getElementById('fac-phone').value.trim(),
    profile_image: document.getElementById('fac-img').value.trim(),
    description: document.getElementById('fac-desc').value.trim(),
    status: document.getElementById('fac-active').checked ? 'ACTIVE' : 'INACTIVE'
  };

  try {
    const res = await api.post('/api/faculty', body);
    if (res && res.success) {
      closeModal();
      showToast('Faculty member added successfully!', 'success');
      loadAdminFaculty();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Edit Faculty Modal
async function openEditFacultyModal(id) {
  try {
    const res = await api.get(`/api/faculty/${id}`);
    if (!res || !res.success) throw new Error('Faculty details not found.');
    const f = res.faculty;

    openModal({
      title: `Edit Faculty: ${f.name}`,
      maxWidth: 'max-w-xl',
      body: `
        <form id="form-edit-faculty" onsubmit="submitEditFaculty(event, ${f.id})" class="space-y-4 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Faculty Name <span class="text-rose-500">*</span></label>
              <input type="text" id="edit-fac-name" value="${f.name}" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Faculty Code <span class="text-rose-500">*</span></label>
              <input type="text" id="edit-fac-code" value="${f.faculty_code}" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl uppercase mono-font">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Designation <span class="text-rose-500">*</span></label>
              <select id="edit-fac-designation" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <option value="Professor" ${f.designation === 'Professor' ? 'selected' : ''}>Professor</option>
                <option value="Associate Professor" ${f.designation === 'Associate Professor' ? 'selected' : ''}>Associate Professor</option>
                <option value="Assistant Professor" ${f.designation === 'Assistant Professor' ? 'selected' : ''}>Assistant Professor</option>
                <option value="Adjunct Faculty" ${f.designation === 'Adjunct Faculty' ? 'selected' : ''}>Adjunct Faculty</option>
                <option value="Visiting Professor" ${f.designation === 'Visiting Professor' ? 'selected' : ''}>Visiting Professor</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Qualification <span class="text-rose-500">*</span></label>
              <input type="text" id="edit-fac-qual" value="${f.qualification}" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Specialization <span class="text-rose-500">*</span></label>
            <input type="text" id="edit-fac-spec" value="${f.specialization}" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Email</label>
              <input type="email" id="edit-fac-email" value="${f.email || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input type="text" id="edit-fac-phone" value="${f.phone || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Profile Image URL</label>
            <input type="url" id="edit-fac-img" value="${f.profile_image || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Description / Bio</label>
            <textarea id="edit-fac-desc" rows="2" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">${f.description || ''}</textarea>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <input type="checkbox" id="edit-fac-active" ${f.status === 'ACTIVE' ? 'checked' : ''} class="rounded border-slate-300 text-blue-600">
            <label for="edit-fac-active" class="font-semibold text-slate-700">Active Status</label>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold">Cancel</button>
            <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md">Update Details</button>
          </div>
        </form>
      `
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function submitEditFaculty(e, id) {
  e.preventDefault();
  const body = {
    name: document.getElementById('edit-fac-name').value.trim(),
    faculty_code: document.getElementById('edit-fac-code').value.trim(),
    designation: document.getElementById('edit-fac-designation').value,
    qualification: document.getElementById('edit-fac-qual').value.trim(),
    specialization: document.getElementById('edit-fac-spec').value.trim(),
    email: document.getElementById('edit-fac-email').value.trim(),
    phone: document.getElementById('edit-fac-phone').value.trim(),
    profile_image: document.getElementById('edit-fac-img').value.trim(),
    description: document.getElementById('edit-fac-desc').value.trim(),
    status: document.getElementById('edit-fac-active').checked ? 'ACTIVE' : 'INACTIVE'
  };

  try {
    const res = await api.put(`/api/faculty/${id}`, body);
    if (res && res.success) {
      closeModal();
      showToast('Faculty updated successfully!', 'success');
      loadAdminFaculty();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleFacultyStatus(id, newStatus) {
  try {
    const res = await api.patch(`/api/faculty/${id}/status`, { status: newStatus });
    if (res && res.success) {
      showToast(res.message, 'success');
      loadAdminFaculty();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function viewFacultyDetails(id) {
  try {
    const res = await api.get(`/api/faculty/${id}`);
    if (!res || !res.success) throw new Error('Could not load faculty details.');
    const f = res.faculty;
    const subjects = f.assigned_subjects || [];

    openModal({
      title: `Faculty Profile: ${f.name} (${f.faculty_code})`,
      maxWidth: 'max-w-2xl',
      body: `
        <div class="space-y-5 text-xs">
          <!-- Profile Card -->
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-4">
            <div class="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xl flex-shrink-0 overflow-hidden shadow-sm">
              ${f.profile_image ? `<img src="${f.profile_image}" class="w-full h-full object-cover">` : `<i class="fa-solid fa-chalkboard-user"></i>`}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h4 class="text-base font-bold text-slate-900">${f.name}</h4>
                <span class="px-2 py-0.5 rounded text-[11px] font-bold ${f.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">${f.status}</span>
              </div>
              <div class="text-xs text-blue-600 font-semibold mt-0.5">${f.designation} &bull; ${f.qualification}</div>
              <div class="text-xs text-slate-600 mt-1">Specialization: <strong>${f.specialization}</strong></div>
              ${f.email ? `<div class="text-[11px] text-slate-500 mt-1"><i class="fa-solid fa-envelope mr-1"></i> ${f.email} ${f.phone ? `&bull; <i class="fa-solid fa-phone mr-1"></i> ${f.phone}` : ''}</div>` : ''}
              ${f.description ? `<p class="text-xs text-slate-600 mt-2 bg-white p-2.5 rounded-xl border border-slate-100">${f.description}</p>` : ''}
            </div>
          </div>

          <!-- Total Capacity Summary Box -->
          <div class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-blue-50 border border-blue-100 p-3 rounded-xl">
              <div class="text-[11px] text-blue-600 font-semibold">Total Capacity</div>
              <div class="text-lg font-black text-blue-950 mt-0.5">${f.total_capacity} seats</div>
            </div>
            <div class="bg-amber-50 border border-amber-100 p-3 rounded-xl">
              <div class="text-[11px] text-amber-700 font-semibold">Allocated Seats</div>
              <div class="text-lg font-black text-amber-950 mt-0.5">${f.total_allocated} seats</div>
            </div>
            <div class="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
              <div class="text-[11px] text-emerald-700 font-semibold">Remaining Available</div>
              <div class="text-lg font-black text-emerald-950 mt-0.5">${f.remaining_capacity} seats</div>
            </div>
          </div>

          <!-- Assigned Subjects Breakdown -->
          <div>
            <h5 class="font-bold text-slate-900 mb-2">Assigned Teaching Subjects (${subjects.length})</h5>
            ${subjects.length === 0 ? `
              <div class="p-6 text-center bg-slate-50 rounded-xl text-slate-400">
                No subjects mapped to this faculty member yet.
              </div>
            ` : `
              <div class="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                ${subjects.map(s => `
                  <div class="p-3.5 bg-white flex items-center justify-between gap-4">
                    <div>
                      <div class="font-bold text-slate-900">${s.subject_name}</div>
                      <div class="mono-font text-[11px] text-slate-500">${s.subject_code} &bull; Year ${s.academic_year}, Sem ${s.semester}</div>
                    </div>
                    <div class="text-right">
                      <div class="font-bold text-slate-900">${s.allocated_seats} / ${s.capacity} seats</div>
                      <div class="text-[11px] text-emerald-600">${s.available_seats} remaining</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      `,
      footer: `<button onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl text-xs">Close</button>`
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteFacultyRecord(id, name) {
  if (!confirm(`Are you sure you want to delete faculty member "${name}"?\nThis is only permitted if no active mappings or selections exist.`)) {
    return;
  }

  try {
    const res = await api.delete(`/api/faculty/${id}`);
    if (res && res.success) {
      showToast(res.message, 'success');
      loadAdminFaculty();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// =========================================================================
// 3. SUBJECT MANAGEMENT
// =========================================================================
async function loadAdminSubjects() {
  const container = document.getElementById('admin-tab-content');
  container.innerHTML = `<div class="py-12 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>`;

  try {
    const res = await api.get('/api/subjects');
    ADMIN_DATA.subjects = res ? res.subjects : [];
    renderSubjectsList();
  } catch (err) {
    container.innerHTML = `<div class="p-6 bg-rose-50 text-rose-700 rounded-2xl text-xs">${err.message}</div>`;
  }
}

function renderSubjectsList() {
  const container = document.getElementById('admin-tab-content');
  const subjects = ADMIN_DATA.subjects;

  container.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-900">Academic Subjects</h3>
          <p class="text-xs text-slate-500">Curriculum subjects mapped to specific academic years and semesters.</p>
        </div>
        <button onclick="openAddSubjectModal()" class="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto">
          <i class="fa-solid fa-plus"></i>
          <span>Add Subject</span>
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3.5 px-6">Subject Code & Name</th>
                <th class="py-3.5 px-6">Academic Year & Sem</th>
                <th class="py-3.5 px-6">Department</th>
                <th class="py-3.5 px-6">Assigned Faculty</th>
                <th class="py-3.5 px-6">Allocated / Capacity</th>
                <th class="py-3.5 px-6">Status</th>
                <th class="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${subjects.length === 0 ? `
                <tr>
                  <td colspan="7" class="py-16 text-center text-slate-400">
                    <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-lg mb-2">
                      <i class="fa-solid fa-book"></i>
                    </div>
                    <div class="font-bold text-slate-700">No Subjects Added Yet</div>
                    <div class="text-xs text-slate-400 mt-0.5">Click "Add Subject" above to build your curriculum dataset.</div>
                  </td>
                </tr>
              ` : subjects.map(s => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-6">
                    <div class="font-bold text-slate-900 flex items-center gap-2">
                      <span>${s.name}</span>
                      ${s.elective_group === 'OE1' ? '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">Professional Elective – I</span>' : (s.elective_group === 'OE2' ? '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">Professional Elective – II</span>' : '<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">Core</span>')}
                    </div>
                    <div class="mono-font text-[11px] text-blue-600 font-semibold">${s.code} &bull; ${s.credits} Credits</div>
                  </td>
                  <td class="py-3.5 px-6">
                    <span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">Year ${s.academic_year} &bull; Sem ${s.semester}</span>
                  </td>
                  <td class="py-3.5 px-6 text-slate-700">${s.department}</td>
                  <td class="py-3.5 px-6 font-semibold text-slate-800">${s.assigned_faculty_count} Professor(s)</td>
                  <td class="py-3.5 px-6">
                    <div class="font-bold text-slate-900">${s.total_allocated} / ${s.total_capacity} seats</div>
                    <div class="text-[11px] text-emerald-600">${s.remaining_seats} available</div>
                  </td>
                  <td class="py-3.5 px-6">
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}">
                      ${s.status}
                    </span>
                  </td>
                  <td class="py-3.5 px-6 text-right space-x-2">
                    <button onclick="openEditSubjectModal(${s.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit Subject">
                      <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deleteSubjectRecord(${s.id}, '${escapeQuote(s.name)}')" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete Subject">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function openAddSubjectModal() {
  openModal({
    title: 'Add Academic Subject',
    maxWidth: 'max-w-md',
    body: `
      <form id="form-add-subject" onsubmit="submitAddSubject(event)" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Subject Code <span class="text-rose-500">*</span></label>
          <input type="text" id="sub-code" required placeholder="e.g. CS501" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl uppercase mono-font">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Subject Name <span class="text-rose-500">*</span></label>
          <input type="text" id="sub-name" required placeholder="e.g. Computer Networks" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Academic Year <span class="text-rose-500">*</span></label>
            <select id="sub-year" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3" selected>Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Semester <span class="text-rose-500">*</span></label>
            <select id="sub-sem" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5" selected>Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Department</label>
            <input type="text" id="sub-dept" value="Computer Science & Engineering" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Credits</label>
            <input type="number" id="sub-credits" value="3" min="1" max="10" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          </div>
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Subject Type / Elective Classification</label>
          <select id="sub-elective-group" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
            <option value="">Core Curriculum Subject</option>
            <option value="OE1">Professional Elective – I (PE1)</option>
            <option value="OE2">Professional Elective – II (PE2)</option>
          </select>
        </div>
        <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold">Cancel</button>
          <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md">Create Subject</button>
        </div>
      </form>
    `
  });
}

async function submitAddSubject(e) {
  e.preventDefault();
  const body = {
    code: document.getElementById('sub-code').value.trim(),
    name: document.getElementById('sub-name').value.trim(),
    academic_year: parseInt(document.getElementById('sub-year').value, 10),
    semester: parseInt(document.getElementById('sub-sem').value, 10),
    department: document.getElementById('sub-dept').value.trim(),
    credits: parseInt(document.getElementById('sub-credits').value, 10),
    elective_group: document.getElementById('sub-elective-group') ? (document.getElementById('sub-elective-group').value || null) : null,
    status: 'ACTIVE'
  };

  try {
    const res = await api.post('/api/subjects', body);
    if (res && res.success) {
      closeModal();
      showToast('Subject created successfully!', 'success');
      loadAdminSubjects();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openEditSubjectModal(id) {
  const s = ADMIN_DATA.subjects.find(sub => sub.id === id);
  if (!s) return;

  openModal({
    title: `Edit Subject: ${s.code}`,
    maxWidth: 'max-w-md',
    body: `
      <form id="form-edit-subject" onsubmit="submitEditSubject(event, ${s.id})" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Subject Code <span class="text-rose-500">*</span></label>
          <input type="text" id="edit-sub-code" value="${s.code}" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl uppercase mono-font">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Subject Name <span class="text-rose-500">*</span></label>
          <input type="text" id="edit-sub-name" value="${s.name}" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Academic Year</label>
            <select id="edit-sub-year" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              ${[1, 2, 3, 4].map(y => `<option value="${y}" ${s.academic_year === y ? 'selected' : ''}>Year ${y}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Semester</label>
            <select id="edit-sub-sem" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              ${[1, 2, 3, 4, 5, 6, 7, 8].map(sem => `<option value="${sem}" ${s.semester === sem ? 'selected' : ''}>Sem ${sem}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Department</label>
            <input type="text" id="edit-sub-dept" value="${s.department}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Credits</label>
            <input type="number" id="edit-sub-credits" value="${s.credits}" min="1" max="10" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          </div>
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Subject Type / Elective Classification</label>
          <select id="edit-sub-elective-group" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
            <option value="" ${!s.elective_group ? 'selected' : ''}>Core Curriculum Subject</option>
            <option value="OE1" ${s.elective_group === 'OE1' ? 'selected' : ''}>Professional Elective – I (PE1)</option>
            <option value="OE2" ${s.elective_group === 'OE2' ? 'selected' : ''}>Professional Elective – II (PE2)</option>
          </select>
        </div>
        <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold">Cancel</button>
          <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md">Update Subject</button>
        </div>
      </form>
    `
  });
}

async function submitEditSubject(e, id) {
  e.preventDefault();
  const body = {
    code: document.getElementById('edit-sub-code').value.trim(),
    name: document.getElementById('edit-sub-name').value.trim(),
    academic_year: parseInt(document.getElementById('edit-sub-year').value, 10),
    semester: parseInt(document.getElementById('edit-sub-sem').value, 10),
    department: document.getElementById('edit-sub-dept').value.trim(),
    credits: parseInt(document.getElementById('edit-sub-credits').value, 10),
    elective_group: document.getElementById('edit-sub-elective-group') ? (document.getElementById('edit-sub-elective-group').value || null) : null,
    status: 'ACTIVE'
  };

  try {
    const res = await api.put(`/api/subjects/${id}`, body);
    if (res && res.success) {
      closeModal();
      showToast('Subject updated successfully!', 'success');
      loadAdminSubjects();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteSubjectRecord(id, name) {
  if (!confirm(`Are you sure you want to delete subject "${name}"?\nThis is only permitted if no active mappings or selections exist.`)) {
    return;
  }

  try {
    const res = await api.delete(`/api/subjects/${id}`);
    if (res && res.success) {
      showToast(res.message, 'success');
      loadAdminSubjects();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// =========================================================================
// 4. FACULTY–SUBJECT MAPPING (Requirement 3: Separate section, independent capacities)
// =========================================================================
// 5. FACULTY - SUBJECT MAPPINGS (Unified for Core & Open Electives)
// =========================================================================
async function loadAdminMappings() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;
  container.innerHTML = `<div class="py-16 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-3xl text-blue-600"></i><div class="mt-2 text-xs font-semibold text-slate-600">Loading Faculty–Subject Mappings...</div></div>`;

  try {
    const [mapRes, facRes, subRes] = await Promise.all([
      api.get('/api/mappings'),
      (ADMIN_DATA.faculty && ADMIN_DATA.faculty.length > 0) ? Promise.resolve({ faculty: ADMIN_DATA.faculty }) : api.get('/api/faculty'),
      api.get('/api/subjects')
    ]);

    ADMIN_DATA.mappings = mapRes ? mapRes.mappings : [];
    ADMIN_DATA.faculty = (facRes && facRes.faculty) ? facRes.faculty : (ADMIN_DATA.faculty || []);
    ADMIN_DATA.subjects = subRes ? subRes.subjects : [];

    renderMappingsList();
  } catch (err) {
    container.innerHTML = `<div class="p-6 bg-rose-50 text-rose-700 rounded-2xl text-xs">${err.message}</div>`;
  }
}

function renderMappingsList() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  const mappings = ADMIN_DATA.mappings || [];
  const subjects = ADMIN_DATA.subjects || [];

  // Group mappings by subject
  const subjectMap = {};
  subjects.forEach(s => {
    subjectMap[s.id] = {
      subject: s,
      mappings: []
    };
  });

  mappings.forEach(m => {
    if (!subjectMap[m.subject_id]) {
      subjectMap[m.subject_id] = {
        subject: { id: m.subject_id, code: m.subject_code, name: m.subject_name, academic_year: m.academic_year, semester: m.semester, elective_group: m.elective_group },
        mappings: []
      };
    }
    subjectMap[m.subject_id].mappings.push(m);
  });

  ADMIN_DATA.mappingFilter = ADMIN_DATA.mappingFilter || 'ALL';
  const filter = ADMIN_DATA.mappingFilter;

  const subjectGroups = Object.values(subjectMap).filter(g => {
    if (!g.subject) return false;
    if (filter === 'CORE') return !g.subject.elective_group || g.subject.elective_group === 'NONE';
    if (filter === 'OE1') return g.subject.elective_group === 'OE1';
    if (filter === 'OE2') return g.subject.elective_group === 'OE2';
    if (filter === '2') return g.subject.academic_year === 2;
    if (filter === '3') return g.subject.academic_year === 3;
    return true;
  });

  const totalSubjects = subjects.length;
  const totalMappings = mappings.length;
  const totalCapacity = mappings.reduce((sum, m) => sum + (m.capacity || 0), 0);
  const totalAllocated = mappings.reduce((sum, m) => sum + (m.allocated_seats || 0), 0);

  container.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-900">Faculty–Subject Mapping (1 Subject → N Faculties)</h3>
          <p class="text-xs text-slate-500">Curriculum core subjects and open electives mapped to N faculty members with independent seat capacities for Group 1 (Group A) and Group 2 (Group B).</p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button onclick="openAddMappingModal()" class="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all">
            <i class="fa-solid fa-plus"></i>
            <span>Map Subject to N Faculties</span>
          </button>
          <button onclick="clearYear3Mappings()" class="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer" title="Clear all mappings for 3rd Year">
            <i class="fa-solid fa-trash-can"></i>
            <span>Clear 3rd Year Mappings</span>
          </button>
          <button onclick="loadAdminMappings()" class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer" title="Refresh Mappings">
            <i class="fa-solid fa-rotate text-xs"></i>
          </button>
        </div>
      </div>

      <!-- Overview Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            <i class="fa-solid fa-book"></i>
          </div>
          <div>
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Subjects</div>
            <div class="text-lg font-black text-slate-900">${totalSubjects} Courses</div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            <i class="fa-solid fa-chalkboard-user"></i>
          </div>
          <div>
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Faculty Mappings</div>
            <div class="text-lg font-black text-indigo-900">${totalMappings} Offerings</div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            <i class="fa-solid fa-chair"></i>
          </div>
          <div>
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Seats</div>
            <div class="text-lg font-black text-emerald-900">${totalCapacity} Seats</div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
            <i class="fa-solid fa-user-check"></i>
          </div>
          <div>
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Seats Filled</div>
            <div class="text-lg font-black text-purple-900">${totalAllocated} Allocated</div>
          </div>
        </div>
      </div>

      <!-- Category & Year Filter Tabs -->
      <div class="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-xl w-fit">
        <button onclick="ADMIN_DATA.mappingFilter = 'ALL'; renderMappingsList();" class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'ALL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
          All Courses (${subjects.length})
        </button>
        <button onclick="ADMIN_DATA.mappingFilter = 'CORE'; renderMappingsList();" class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'CORE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
          Core Subjects (${subjects.filter(s => !s.elective_group || s.elective_group === 'NONE').length})
        </button>
        <button onclick="ADMIN_DATA.mappingFilter = 'OE1'; renderMappingsList();" class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'OE1' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
          Professional Elective – I (${subjects.filter(s => s.elective_group === 'OE1').length})
        </button>
        <button onclick="ADMIN_DATA.mappingFilter = 'OE2'; renderMappingsList();" class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'OE2' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
          Professional Elective – II (${subjects.filter(s => s.elective_group === 'OE2').length})
        </button>
        <button onclick="ADMIN_DATA.mappingFilter = '2'; renderMappingsList();" class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === '2' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
          2nd Year II-II (${subjects.filter(s => s.academic_year === 2).length})
        </button>
        <button onclick="ADMIN_DATA.mappingFilter = '3'; renderMappingsList();" class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === '3' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
          3rd Year III-II (${subjects.filter(s => s.academic_year === 3).length})
        </button>
      </div>

      <!-- Subject Mappings Grouped Cards -->
      <div class="space-y-6">
        ${subjectGroups.length === 0 ? `
          <div class="py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-lg mb-2">
              <i class="fa-solid fa-diagram-project"></i>
            </div>
            <div class="font-bold text-slate-700">No Courses or Mappings Configured</div>
            <div class="text-xs text-slate-400 mt-0.5">Click "Map Subject to N Faculties" to assign faculty members to courses.</div>
          </div>
        ` : subjectGroups.map(group => {
    const sub = group.subject;
    const mapList = group.mappings || [];
    mapList.sort((a, b) => {
      const na = parseInt((a.faculty_code || '').replace(/\D/g, ''), 10) || 999999;
      const nb = parseInt((b.faculty_code || '').replace(/\D/g, ''), 10) || 999999;
      return na - nb;
    });
    const subCapacity = mapList.reduce((sum, m) => sum + (m.capacity || 0), 0);
    const subAllocated = mapList.reduce((sum, m) => sum + (m.allocated_seats || 0), 0);

    return `
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="mono-font text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/20">
                    ${sub.code}
                  </span>
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="text-base font-bold text-white tracking-tight">${sub.name}</h4>
                      ${sub.elective_group === 'OE1' ? '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/30 text-purple-200 border border-purple-400/30">Professional Elective – I</span>' : (sub.elective_group === 'OE2' ? '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">Professional Elective – II</span>' : '')}
                    </div>
                    <p class="text-xs text-blue-200 mt-0.5">
                      Year ${sub.academic_year} &bull; Semester ${sub.semester} &bull; <strong class="text-white">${mapList.length} Faculties Mapped</strong>
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3 self-end sm:self-auto">
                  <div class="text-right hidden sm:block">
                    <div class="text-[11px] text-slate-400">Capacity / Filled</div>
                    <div class="text-xs font-bold text-white">${subCapacity} Total Seats &bull; <span class="text-emerald-400">${subAllocated} Selected</span></div>
                  </div>
                  <button onclick="openAddMappingModal(${sub.id})" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm">
                    <i class="fa-solid fa-user-plus"></i>
                    <span>Map More Faculty</span>
                  </button>
                </div>
              </div>

              <!-- Mapped Faculties List -->
              <div class="divide-y divide-slate-100">
                ${mapList.length === 0 ? `
                  <div class="p-6 text-center text-xs text-slate-400">
                    No faculty members mapped to this course yet. Click "Map More Faculty" to add one.
                  </div>
                ` : mapList.map(m => {
      const rem = m.remaining_seats !== undefined ? m.remaining_seats : (m.capacity - m.allocated_seats);
      const isFull = rem <= 0;
      const pct = m.capacity > 0 ? Math.round((m.allocated_seats / m.capacity) * 100) : 0;

      return `
                    <div class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div class="flex items-center gap-3.5">
                        <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs flex-shrink-0">
                          ${m.faculty_code || 'FAC'}
                        </div>
                        <div>
                          <div class="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                            <span>${m.faculty_name}</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${m.target_group === 'Group 1' ? 'bg-blue-100 text-blue-800 border border-blue-200' : (m.target_group === 'Group 2' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700')}">
                              ${(m.target_group === 'Group 1' || m.target_group === 'A' || m.target_group === 'Group A') ? 'GROUP A' : ((m.target_group === 'Group 2' || m.target_group === 'B' || m.target_group === 'Group B') ? 'GROUP B' : 'All Cohorts')}
                            </span>
                          </div>
                          <div class="text-xs text-slate-500 mt-0.5">
                            ${m.department || 'CSE'} &bull; ${m.faculty_designation || 'Faculty Member'}
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-4 self-end sm:self-auto">
                        <div class="text-right">
                          <div class="flex items-center gap-2 justify-end">
                            <span class="text-xs font-bold text-slate-700">${m.allocated_seats} / ${m.capacity} Seats</span>
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isFull ? 'bg-rose-100 text-rose-800' : (pct > 40 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}">
                              <span class="w-1.5 h-1.5 rounded-full ${isFull ? 'bg-rose-500' : (pct > 40 ? 'bg-amber-500' : 'bg-emerald-500')}"></span>
                              ${isFull ? 'Full' : (pct > 40 ? 'Filling Fast' : 'Available')}
                            </span>
                          </div>
                          <div class="w-32 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden ml-auto">
                            <div class="h-full ${isFull ? 'bg-rose-500' : (pct > 40 ? 'bg-amber-500' : 'bg-emerald-500')}" style="width: ${Math.min(100, pct)}%"></div>
                          </div>
                        </div>

                        <div class="flex items-center gap-1.5">
                          <button onclick="openEditCapacityModal(${m.id}, ${m.capacity}, ${m.allocated_seats})" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit Capacity">
                            <i class="fa-solid fa-pen text-xs"></i>
                          </button>
                          <button onclick="deleteMappingRecord(${m.id}, '${encodeURIComponent(m.faculty_name)}', '${encodeURIComponent(m.subject_name)}')" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete Mapping">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
    }).join('')}
              </div>
            </div>
          `;
  }).join('')}
      </div>
    </div>
  `;
}

function openAddMappingModal(preselectedSubjectId = null) {
  if (ADMIN_DATA.faculty.length === 0 || ADMIN_DATA.subjects.length === 0) {
    showToast('You must add at least one Faculty member and one Subject before creating a mapping.', 'warning');
    return;
  }

  const activeSubjects = ADMIN_DATA.subjects.filter(s => s.status === 'ACTIVE');
  const activeFaculty = ADMIN_DATA.faculty.filter(f => f.status === 'ACTIVE');
  activeFaculty.sort((a, b) => {
    const na = parseInt((a.faculty_code || '').replace(/\D/g, ''), 10) || 999999;
    const nb = parseInt((b.faculty_code || '').replace(/\D/g, ''), 10) || 999999;
    return na - nb;
  });

  const defaultSub = preselectedSubjectId
    ? activeSubjects.find(s => s.id === preselectedSubjectId) || activeSubjects[0]
    : activeSubjects[0];

  openModal({
    title: 'Map Subject to N Faculties',
    maxWidth: 'max-w-2xl',
    body: `
      <form id="form-add-mapping" onsubmit="submitAddMapping(event)" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Select Subject <span class="text-rose-500">*</span></label>
          <select id="map-subject" onchange="autoFillYearSem()" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
            ${activeSubjects.map(s => `
              <option value="${s.id}" data-year="${s.academic_year}" data-sem="${s.semester}" ${(defaultSub && s.id === defaultSub.id) ? 'selected' : ''}>
                ${s.code} - ${s.name} (Year ${s.academic_year}, Sem ${s.semester})
              </option>
            `).join('')}
          </select>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Target Student Cohort <span class="text-rose-500">*</span></label>
          <select id="map-target-group" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
            <option value="Group 1">GROUP A</option>
            <option value="Group 2">GROUP B</option>
            <option value="ALL">All Groups (Shared)</option>
          </select>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Academic Year</label>
            <input type="number" id="map-year" value="${defaultSub ? defaultSub.academic_year : 3}" min="1" max="4" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Semester</label>
            <input type="number" id="map-sem" value="${defaultSub ? defaultSub.semester : 6}" min="1" max="8" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Default Seats per Faculty <span class="text-rose-500">*</span></label>
            <input type="number" id="map-capacity" min="1" max="500" value="70" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600">
          </div>
        </div>

        <!-- Multi-Faculty Selection (Map to N Faculties) -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="font-semibold text-slate-800">
              Select Faculty Members to Map (N Faculties) <span class="text-rose-500">*</span>
            </label>
            <div class="flex items-center gap-2">
              <button type="button" onclick="toggleAllMappingFaculty(true)" class="text-blue-600 hover:underline text-[11px] font-semibold">Select All</button>
              <span class="text-slate-300">|</span>
              <button type="button" onclick="toggleAllMappingFaculty(false)" class="text-slate-500 hover:underline text-[11px]">Clear All</button>
            </div>
          </div>

          <!-- Quick Faculty Search Box -->
          <div class="relative">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input type="text" id="map-faculty-search" oninput="filterMappingFacultyChecklist()" placeholder="Quick filter faculty by name or code..." class="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          </div>

          <!-- Checkbox List of Faculties -->
          <div class="border border-slate-200 rounded-xl p-2 max-h-56 overflow-y-auto space-y-1 bg-slate-50/50" id="map-faculties-checklist">
            ${activeFaculty.map(f => `
              <label class="flex items-center justify-between p-2 rounded-lg hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200 fac-check-item" data-search="${f.name.toUpperCase()} ${f.faculty_code.toUpperCase()}">
                <div class="flex items-center gap-2.5">
                  <input type="checkbox" name="map-faculty-id" value="${f.id}" onchange="updateSelectedFacCount()" class="rounded text-blue-600 focus:ring-blue-500 w-4 h-4">
                  <div>
                    <div class="font-bold text-slate-900">${f.name}</div>
                    <div class="text-[11px] text-slate-500">${f.faculty_code} &bull; ${f.designation}</div>
                  </div>
                </div>
                <span class="text-[10px] mono-font text-slate-400">${f.specialization || ''}</span>
              </label>
            `).join('')}
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span id="map-selected-count" class="font-bold text-indigo-600">0 faculties selected</span>
            <span>Independent seat capacity assigned to each selected faculty member.</span>
          </div>
        </div>
      </form>
    `,
    footer: `
      <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        <span id="map-footer-selected-count" class="text-xs font-semibold text-slate-500">0 faculties selected</span>
        <div class="flex items-center gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-xs transition-colors">Cancel</button>
          <button type="button" onclick="document.getElementById('form-add-mapping').requestSubmit()" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-check"></i>
            <span>OK - Confirm Selected Faculty</span>
          </button>
        </div>
      </div>
    `
  });
}

function autoFillYearSem() {
  const select = document.getElementById('map-subject');
  if (!select) return;
  const opt = select.options[select.selectedIndex];
  if (opt && opt.dataset.year) {
    document.getElementById('map-year').value = opt.dataset.year;
    document.getElementById('map-sem').value = opt.dataset.sem;
  }
}

function toggleAllMappingFaculty(selectAll) {
  const checkboxes = document.querySelectorAll('input[name="map-faculty-id"]');
  checkboxes.forEach(cb => {
    // Only check visible items if filter is active
    const parent = cb.closest('.fac-check-item');
    if (!parent || parent.style.display !== 'none') {
      cb.checked = selectAll;
    }
  });
  updateSelectedFacCount();
}

function filterMappingFacultyChecklist() {
  const q = document.getElementById('map-faculty-search').value.trim().toUpperCase();
  const items = document.querySelectorAll('.fac-check-item');
  items.forEach(it => {
    const s = it.getAttribute('data-search') || '';
    if (!q || s.includes(q)) {
      it.style.display = '';
    } else {
      it.style.display = 'none';
    }
  });
}

function updateSelectedFacCount() {
  const checked = document.querySelectorAll('input[name="map-faculty-id"]:checked');
  const countEl = document.getElementById('map-selected-count');
  const footerCountEl = document.getElementById('map-footer-selected-count');
  const text = `${checked.length} facult${checked.length === 1 ? 'y' : 'ies'} selected`;
  if (countEl) {
    countEl.textContent = text;
  }
  if (footerCountEl) {
    footerCountEl.textContent = `${checked.length} facult${checked.length === 1 ? 'y' : 'ies'} selected for mapping`;
  }
}

async function submitAddMapping(e) {
  e.preventDefault();
  const checkedBoxes = Array.from(document.querySelectorAll('input[name="map-faculty-id"]:checked'));
  if (checkedBoxes.length === 0) {
    showToast('Please select at least one faculty member to map to this subject.', 'warning');
    return;
  }

  const facultyIds = checkedBoxes.map(cb => parseInt(cb.value, 10));
  const capacity = parseInt(document.getElementById('map-capacity').value, 10);
  const subjectId = parseInt(document.getElementById('map-subject').value, 10);
  const year = parseInt(document.getElementById('map-year').value, 10);
  const sem = parseInt(document.getElementById('map-sem').value, 10);
  const targetGroup = document.getElementById('map-target-group') ? document.getElementById('map-target-group').value : 'ALL';

  const body = {
    faculty_ids: facultyIds,
    subject_id: subjectId,
    academic_year: year,
    semester: sem,
    capacity: capacity,
    target_group: targetGroup,
    status: 'ACTIVE'
  };

  try {
    const res = await api.post('/api/mappings', body);
    if (res && res.success) {
      closeModal();
      showToast(res.message || 'Faculty–Subject mappings created successfully!', 'success');
      loadAdminMappings();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openEditCapacityModal(id, currentCapacity, allocatedSeats, facultyName, subjectName) {
  openModal({
    title: 'Edit Seat Capacity',
    maxWidth: 'max-w-sm',
    body: `
      <form id="form-edit-capacity" onsubmit="submitEditCapacity(event, ${id}, ${allocatedSeats})" class="space-y-4 text-xs">
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div class="font-bold text-slate-900">${facultyName}</div>
          <div class="text-slate-600 mt-0.5">${subjectName}</div>
          <div class="text-blue-600 font-semibold mt-1">Currently Allocated Seats: ${allocatedSeats}</div>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">New Maximum Seat Capacity <span class="text-rose-500">*</span></label>
          <input type="number" id="edit-capacity-val" value="${currentCapacity}" min="${allocatedSeats}" required class="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900">
          <p class="text-[11px] text-slate-500 mt-1">
            <strong>Rule:</strong> Capacity cannot be reduced below current allocations (${allocatedSeats}).
          </p>
        </div>

        <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold">Cancel</button>
          <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md">Update Capacity</button>
        </div>
      </form>
    `
  });
}

async function submitEditCapacity(e, id, allocatedSeats) {
  e.preventDefault();
  const newCapacity = parseInt(document.getElementById('edit-capacity-val').value, 10);

  if (newCapacity < allocatedSeats) {
    showToast(`Capacity cannot be lower than ${allocatedSeats} (the number of currently allocated seats).`, 'error');
    return;
  }

  try {
    const res = await api.put(`/api/mappings/${id}`, { capacity: newCapacity, status: 'ACTIVE' });
    if (res && res.success) {
      closeModal();
      showToast('Capacity updated successfully!', 'success');
      loadAdminMappings();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteMappingRecord(id, facultyName, subjectName) {
  if (!confirm(`Are you sure you want to remove the mapping of ${facultyName} for ${subjectName}?\nThis is only allowed if no students have selected this faculty.`)) {
    return;
  }

  try {
    const res = await api.delete(`/api/mappings/${id}`);
    if (res && res.success) {
      showToast(res.message, 'success');
      loadAdminMappings();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function clearYear3Mappings() {
  if (!confirm('Are you sure you want to CLEAR ALL 3rd Year faculty mappings? You will be able to map all faculty members manually according to your choice.')) {
    return;
  }

  try {
    const res = await api.delete('/api/mappings/clear-year/3');
    if (res && res.success) {
      showToast(res.message || 'All 3rd Year mappings have been cleared successfully.', 'success');
      loadAdminMappings();
    } else {
      showToast(res.message || 'Failed to clear mappings.', 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.clearYear3Mappings = clearYear3Mappings;

// =========================================================================
// 5. STUDENT MANAGEMENT (Dataset managed by Administrator)
// =========================================================================
async function loadAdminStudents() {
  const container = document.getElementById('admin-tab-content');
  container.innerHTML = `<div class="py-12 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>`;

  try {
    const res = await api.get('/api/students');
    ADMIN_DATA.students = res ? res.students : [];
    renderStudentsList();
  } catch (err) {
    container.innerHTML = `<div class="p-6 bg-rose-50 text-rose-700 rounded-2xl text-xs">${err.message}</div>`;
  }
}

// Module state for student dataset filtering
let CURRENT_STUDENT_FILTERS = {
  search: '',
  year: 'ALL',
  group: 'ALL'
};

function setStudentYearFilter(year) {
  CURRENT_STUDENT_FILTERS.year = String(year);
  const yearSelect = document.getElementById('admin-stu-year-filter');
  if (yearSelect) yearSelect.value = String(year);
  filterAdminStudents();
}

function setStudentGroupFilter(group) {
  CURRENT_STUDENT_FILTERS.group = group;
  const groupSelect = document.getElementById('admin-stu-group-filter');
  if (groupSelect) groupSelect.value = group;
  filterAdminStudents();
}

function exportStudentsToCSV() {
  const students = ADMIN_DATA.students || [];
  if (students.length === 0) {
    showToast('No students available to export.', 'warning');
    return;
  }

  const term = (CURRENT_STUDENT_FILTERS.search || '').toUpperCase();
  const year = CURRENT_STUDENT_FILTERS.year;
  const group = CURRENT_STUDENT_FILTERS.group;

  const filtered = students.filter(s => {
    const matchesSearch = !term || s.reg_no.toUpperCase().includes(term) || s.name.toUpperCase().includes(term);
    const matchesYear = year === 'ALL' || String(s.academic_year) === year;
    const matchesGroup = group === 'ALL' || (s.section && s.section === group);
    return matchesSearch && matchesYear && matchesGroup;
  });

  if (filtered.length === 0) {
    showToast('No matching students for the selected filters.', 'warning');
    return;
  }

  let csv = '\uFEFF';
  csv += 'Registration Number,Student Name,Academic Year,Semester,Group,Confirmed Courses,Status\n';

  filtered.forEach(s => {
    const yearStr = s.academic_year === 2 ? '2nd Year (II-II)' : (s.academic_year === 3 ? '3rd Year (III-II)' : `Year ${s.academic_year}`);
    const row = [
      `"${s.reg_no}"`,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${yearStr}"`,
      `"${s.semester}"`,
      `"${s.section || 'Group 1'}"`,
      `"${s.confirmed_selections_count || 0}"`,
      `"${s.status || 'ACTIVE'}"`
    ];
    csv += row.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filterDesc = `${year === 'ALL' ? 'all-years' : `year-${year}`}_${group === 'ALL' ? 'all-groups' : group.replace(/\s+/g, '-').toLowerCase()}`;
  a.download = `students_${filterDesc}_${Date.now()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`Exported ${filtered.length} students to Excel CSV successfully!`, 'success');
}

function renderStudentsList() {
  const container = document.getElementById('admin-tab-content');
  const students = ADMIN_DATA.students || [];

  const totalCount = students.length;

  // Year 2 Breakdown (II-II: Sem 4)
  const y2Students = students.filter(s => s.academic_year === 2);
  const y2Total = y2Students.length;
  const y2G1 = y2Students.filter(s => s.section === 'Group 1').length;
  const y2G2 = y2Students.filter(s => s.section === 'Group 2').length;

  // Year 3 Breakdown (III-II: Sem 6 or 5)
  const y3Students = students.filter(s => s.academic_year === 3);
  const y3Total = y3Students.length;
  const y3G1 = y3Students.filter(s => s.section === 'Group 1').length;
  const y3G2 = y3Students.filter(s => s.section === 'Group 2').length;

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-blue-600"></span>
            <h3 class="text-base font-bold text-slate-900">Student Dataset Management (Year-wise & Group-wise)</h3>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            Browse, filter, and manage both <strong>2nd Year (II-II)</strong> and <strong>3rd Year (III-II)</strong> cohorts partitioned by <strong>GROUP A</strong> and <strong>GROUP B</strong>.
          </p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button onclick="exportStudentsToCSV()" class="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors" title="Download Excel Compatible CSV">
            <i class="fa-solid fa-file-excel"></i>
            <span>Export to Excel</span>
          </button>
          <button onclick="openBulkStudentsModal()" class="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <i class="fa-solid fa-file-import"></i>
            <span>Bulk / Sample Add</span>
          </button>
          <button onclick="openAddStudentModal()" class="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all">
            <i class="fa-solid fa-user-plus"></i>
            <span>Add Student</span>
          </button>
        </div>
      </div>

      <!-- Year & Group Metric Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- All Enrolled -->
        <div onclick="setStudentYearFilter('ALL'); setStudentGroupFilter('ALL');" class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-400 cursor-pointer transition-all">
          <div class="flex items-center justify-between">
            <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</div>
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 text-sm">
              <i class="fa-solid fa-users"></i>
            </div>
          </div>
          <div class="text-2xl font-black text-slate-900 mt-2">${totalCount} Students</div>
          <div class="mt-2 text-[11px] text-slate-500 flex items-center gap-2">
            <span>Click to view all cohorts</span>
          </div>
        </div>

        <!-- 2nd Year (II-II) -->
        <div class="bg-gradient-to-br from-teal-50/60 to-emerald-50/40 p-4 rounded-2xl border border-teal-200 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="text-[11px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-teal-500"></span>
              <span>2nd Year (II-II &bull; Sem 4)</span>
            </div>
            <button onclick="setStudentYearFilter(2); setStudentGroupFilter('ALL');" class="text-[10px] font-bold text-teal-700 hover:underline">
              View All Year 2
            </button>
          </div>
          <div class="text-2xl font-black text-teal-950 mt-1">${y2Total} <span class="text-xs font-semibold text-teal-700">Students</span></div>
          <div class="mt-2.5 pt-2 border-t border-teal-200/60 flex items-center justify-between text-xs gap-2">
            <button onclick="setStudentYearFilter(2); setStudentGroupFilter('Group 1');" class="px-2 py-1 bg-white hover:bg-teal-100/70 border border-teal-200 rounded-lg text-[11px] font-bold text-teal-900 transition flex items-center gap-1">
              <span>Group 1:</span>
              <span class="mono-font text-teal-700">${y2G1}</span>
            </button>
            <button onclick="setStudentYearFilter(2); setStudentGroupFilter('Group 2');" class="px-2 py-1 bg-white hover:bg-teal-100/70 border border-teal-200 rounded-lg text-[11px] font-bold text-teal-900 transition flex items-center gap-1">
              <span>Group 2:</span>
              <span class="mono-font text-teal-700">${y2G2}</span>
            </button>
          </div>
        </div>

        <!-- 3rd Year (III-II) -->
        <div class="bg-gradient-to-br from-indigo-50/60 to-blue-50/40 p-4 rounded-2xl border border-indigo-200 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="text-[11px] font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>3rd Year (III-II &bull; Sem 6)</span>
            </div>
            <button onclick="setStudentYearFilter(3); setStudentGroupFilter('ALL');" class="text-[10px] font-bold text-indigo-700 hover:underline">
              View All Year 3
            </button>
          </div>
          <div class="text-2xl font-black text-indigo-950 mt-1">${y3Total} <span class="text-xs font-semibold text-indigo-700">Students</span></div>
          <div class="mt-2.5 pt-2 border-t border-indigo-200/60 flex items-center justify-between text-xs gap-2">
            <button onclick="setStudentYearFilter(3); setStudentGroupFilter('Group 1');" class="px-2 py-1 bg-white hover:bg-indigo-100/70 border border-indigo-200 rounded-lg text-[11px] font-bold text-indigo-900 transition flex items-center gap-1">
              <span>Group 1:</span>
              <span class="mono-font text-indigo-700">${y3G1}</span>
            </button>
            <button onclick="setStudentYearFilter(3); setStudentGroupFilter('Group 2');" class="px-2 py-1 bg-white hover:bg-indigo-100/70 border border-indigo-200 rounded-lg text-[11px] font-bold text-indigo-900 transition flex items-center gap-1">
              <span>Group 2:</span>
              <span class="mono-font text-indigo-700">${y3G2}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Search & Multi-Filter Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3 justify-between">
        <div class="relative w-full md:w-80">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input type="text" id="admin-stu-search" placeholder="Search by name or registration number..." oninput="filterAdminStudents()" class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition">
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <!-- Year Filter -->
          <div class="flex items-center gap-1.5 text-xs">
            <span class="text-slate-500 font-semibold whitespace-nowrap">Cohort Year:</span>
            <select id="admin-stu-year-filter" onchange="filterAdminStudents()" class="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white">
              <option value="ALL">All Cohorts (${totalCount})</option>
              <option value="2">2nd Year (II-II &bull; Sem 4 - ${y2Total})</option>
              <option value="3">3rd Year (III-II &bull; Sem 6 - ${y3Total})</option>
            </select>
          </div>

          <!-- Group Filter -->
          <div class="flex items-center gap-1.5 text-xs">
            <span class="text-slate-500 font-semibold whitespace-nowrap">Group / Section:</span>
            <select id="admin-stu-group-filter" onchange="filterAdminStudents()" class="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white">
              <option value="ALL">All Groups</option>
              <option value="Group 1">GROUP A</option>
              <option value="Group 2">GROUP B</option>
            </select>
          </div>

          <!-- Visible Counter Pill -->
          <span class="px-2.5 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200">
            <span id="admin-stu-visible-count">${totalCount}</span> / ${totalCount} Shown
          </span>
        </div>
      </div>

      <!-- Students Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs" id="admin-students-table">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3.5 px-6">Reg Number & Name</th>
                <th class="py-3.5 px-6">Academic Cohort</th>
                <th class="py-3.5 px-6">Assigned Group</th>
                <th class="py-3.5 px-6">Confirmed Courses</th>
                <th class="py-3.5 px-6">Account Status</th>
                <th class="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${students.length === 0 ? `
                <tr>
                  <td colspan="6" class="py-16 text-center text-slate-400">
                    <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-lg mb-2">
                      <i class="fa-solid fa-users"></i>
                    </div>
                    <div class="font-bold text-slate-700">No Students in Dataset</div>
                    <div class="text-xs text-slate-400 mt-0.5">Click "Add Student" or "Bulk / Sample Add" to create student accounts.</div>
                  </td>
                </tr>
              ` : students.map(s => `
                <tr class="hover:bg-slate-50/80 transition-colors stu-row" data-reg="${s.reg_no.toUpperCase()}" data-name="${s.name.toUpperCase()}" data-year="${s.academic_year}" data-sem="${s.semester}" data-group="${s.section}">
                  <td class="py-3.5 px-6">
                    <div class="font-bold text-slate-900">${s.name}</div>
                    <div class="mono-font text-[11px] text-blue-600 font-semibold">${s.reg_no}</div>
                  </td>
                  <td class="py-3.5 px-6">
                    ${s.academic_year === 2 ? `
                      <span class="px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 bg-teal-50 text-teal-800 border border-teal-200">
                        <span class="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                        2nd Year &bull; Sem ${s.semester}
                      </span>
                    ` : (s.academic_year === 3 ? `
                      <span class="px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-800 border border-indigo-200">
                        <span class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        3rd Year &bull; Sem ${s.semester}
                      </span>
                    ` : `
                      <span class="px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200">
                        Year ${s.academic_year} &bull; Sem ${s.semester}
                      </span>
                    `)}
                  </td>
                  <td class="py-3.5 px-6 font-bold text-slate-800">
                    <span class="px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${s.section === 'Group 1' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-purple-100 text-purple-800 border border-purple-200'}">
                      <span class="w-1.5 h-1.5 rounded-full ${s.section === 'Group 1' ? 'bg-blue-600' : 'bg-purple-600'}"></span>
                      ${(s.section === 'Group 1' || s.section === 'A' || s.section === 'Group A') ? 'GROUP A' : ((s.section === 'Group 2' || s.section === 'B' || s.section === 'Group B') ? 'GROUP B' : s.section)}
                    </span>
                  </td>
                  <td class="py-3.5 px-6">
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${s.confirmed_selections_count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}">
                      ${s.confirmed_selections_count || 0} Confirmed
                    </span>
                  </td>
                  <td class="py-3.5 px-6">
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                      ${s.status}
                    </span>
                  </td>
                  <td class="py-3.5 px-6 text-right space-x-2">
                    <button onclick="viewStudentDetails(${s.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View Selections">
                      <i class="fa-solid fa-eye"></i>
                    </button>
                    <button onclick="openEditStudentModal(${s.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit Student">
                      <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onclick="deleteStudentRecord(${s.id}, '${escapeQuote(s.name)}', '${escapeQuote(s.reg_no)}')" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete Student">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function filterAdminStudents() {
  const searchInput = document.getElementById('admin-stu-search');
  const yearFilter = document.getElementById('admin-stu-year-filter');
  const groupFilter = document.getElementById('admin-stu-group-filter');
  const counterSpan = document.getElementById('admin-stu-visible-count');

  const term = searchInput ? searchInput.value.trim().toUpperCase() : '';
  const selectedYear = yearFilter ? yearFilter.value : 'ALL';
  const selectedGroup = groupFilter ? groupFilter.value : 'ALL';

  CURRENT_STUDENT_FILTERS.search = term;
  CURRENT_STUDENT_FILTERS.year = selectedYear;
  CURRENT_STUDENT_FILTERS.group = selectedGroup;

  const rows = document.querySelectorAll('.stu-row');
  let visibleCount = 0;

  rows.forEach(r => {
    const reg = r.getAttribute('data-reg') || '';
    const name = r.getAttribute('data-name') || '';
    const year = r.getAttribute('data-year') || '';
    const group = r.getAttribute('data-group') || '';

    const matchesSearch = !term || reg.includes(term) || name.includes(term);
    const matchesYear = selectedYear === 'ALL' || year === selectedYear;
    const matchesGroup = selectedGroup === 'ALL' || group === selectedGroup;

    if (matchesSearch && matchesYear && matchesGroup) {
      r.style.display = '';
      visibleCount++;
    } else {
      r.style.display = 'none';
    }
  });

  if (counterSpan) {
    counterSpan.textContent = visibleCount;
  }
}

function updateAddStudentSemesters(year) {
  const semSelect = document.getElementById('stu-sem-input');
  if (!semSelect) return;
  const y = parseInt(year, 10);
  if (y === 2) {
    semSelect.innerHTML = `
      <option value="4" selected>Sem 4 (II-II)</option>
      <option value="3">Sem 3 (II-I)</option>
    `;
  } else if (y === 3) {
    semSelect.innerHTML = `
      <option value="6" selected>Sem 6 (III-II)</option>
      <option value="5">Sem 5 (III-I)</option>
    `;
  } else {
    semSelect.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8].map(s => `<option value="${s}">Sem ${s}</option>`).join('');
  }
}

function openAddStudentModal() {
  openModal({
    title: 'Add New Student Record',
    maxWidth: 'max-w-md',
    body: `
      <form id="form-add-student" onsubmit="submitAddStudent(event)" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Registration Number <span class="text-rose-500">*</span></label>
          <input type="text" id="stu-reg" required placeholder="e.g. 23091A0501" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl uppercase mono-font">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Student Full Name <span class="text-rose-500">*</span></label>
          <input type="text" id="stu-name-input" required placeholder="e.g. Rahul Sharma" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Cohort Year</label>
            <select id="stu-year-input" onchange="updateAddStudentSemesters(this.value)" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
              <option value="2">2nd Year (II-II)</option>
              <option value="3" selected>3rd Year (III-II)</option>
              <option value="1">1st Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Semester</label>
            <select id="stu-sem-input" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
              <option value="6" selected>Sem 6 (III-II)</option>
              <option value="5">Sem 5 (III-I)</option>
              <option value="4">Sem 4 (II-II)</option>
              <option value="3">Sem 3</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Group</label>
            <select id="stu-sec-input" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
              <option value="Group 1">GROUP A</option>
              <option value="Group 2">GROUP B</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Password (Leave blank to use Registration Number as password)</label>
          <input type="password" id="stu-pwd-input" placeholder="Default: Same as Registration Number" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        </div>
        <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold">Cancel</button>
          <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md">Save Student</button>
        </div>
      </form>
    `
  });
}

async function submitAddStudent(e) {
  e.preventDefault();
  const regNo = document.getElementById('stu-reg').value.trim().toUpperCase();
  const pwd = document.getElementById('stu-pwd-input').value.trim();

  const body = {
    reg_no: regNo,
    name: document.getElementById('stu-name-input').value.trim(),
    academic_year: parseInt(document.getElementById('stu-year-input').value, 10),
    semester: parseInt(document.getElementById('stu-sem-input').value, 10),
    section: document.getElementById('stu-sec-input').value.trim(),
    password: pwd || regNo,
    status: 'ACTIVE'
  };

  try {
    const res = await api.post('/api/students', body);
    if (res && res.success) {
      closeModal();
      showToast('Student account created successfully!', 'success');
      loadAdminStudents();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openBulkStudentsModal() {
  openModal({
    title: 'Bulk / Sample Student Dataset',
    maxWidth: 'max-w-lg',
    body: `
      <div class="space-y-4 text-xs">
        <p class="text-slate-600">Quickly populate student accounts for testing and verification. You can also populate standard sample university students (Year 3, Sem 5, Sec A).</p>

        <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
          <strong>Default Sample Batch:</strong>
          <ul class="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
            <li>2024CS101 – Rahul Sharma (Year 3, Sem 5, Sec A)</li>
            <li>2024CS102 – Ananya Patel (Year 3, Sem 5, Sec A)</li>
            <li>2024CS103 – Vikram Singh (Year 3, Sem 5, Sec A)</li>
            <li>2024CS104 – Sneha Reddy (Year 3, Sem 5, Sec B)</li>
            <li>2024CS105 – Arjun Mehta (Year 3, Sem 5, Sec B)</li>
          </ul>
          <div class="mt-2 text-[11px] text-blue-700">Passwords are set identical to their registration numbers (e.g. 2024CS101).</div>
        </div>

        <button onclick="populateSampleStudents()" class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
          <i class="fa-solid fa-users-gear"></i>
          <span>Import 5 Sample Students</span>
        </button>
      </div>
    `,
    footer: `<button onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl text-xs">Close</button>`
  });
}

async function populateSampleStudents() {
  const sampleBatch = [
    { reg_no: '2024CS101', name: 'Rahul Sharma', academic_year: 3, semester: 5, section: 'A' },
    { reg_no: '2024CS102', name: 'Ananya Patel', academic_year: 3, semester: 5, section: 'A' },
    { reg_no: '2024CS103', name: 'Vikram Singh', academic_year: 3, semester: 5, section: 'A' },
    { reg_no: '2024CS104', name: 'Sneha Reddy', academic_year: 3, semester: 5, section: 'B' },
    { reg_no: '2024CS105', name: 'Arjun Mehta', academic_year: 3, semester: 5, section: 'B' }
  ];

  try {
    const res = await api.post('/api/students/bulk', { students: sampleBatch });
    if (res && res.success) {
      closeModal();
      showToast(res.message, 'success');
      loadAdminStudents();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function viewStudentDetails(id) {
  try {
    const res = await api.get(`/api/students/${id}`);
    if (!res || !res.success) throw new Error('Could not load student details.');
    const s = res.student;
    const selections = s.selections || [];

    openModal({
      title: `Student Profile: ${s.name} (${s.reg_no})`,
      maxWidth: 'max-w-xl',
      body: `
        <div class="space-y-4 text-xs">
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <h4 class="text-base font-bold text-slate-900">${s.name}</h4>
              <div class="mono-font text-blue-600 font-semibold mt-0.5">${s.reg_no}</div>
              <div class="text-slate-500 mt-1">Year ${s.academic_year} &bull; Semester ${s.semester} &bull; Section ${s.section}</div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-bold ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">${s.status}</span>
          </div>

          <div>
            <h5 class="font-bold text-slate-900 mb-2">Student Course Selections (${selections.length})</h5>
            ${selections.length === 0 ? `
              <div class="p-6 text-center bg-slate-50 rounded-xl text-slate-400">
                This student has not made any selections yet.
              </div>
            ` : `
              <div class="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                ${selections.map(sel => `
                  <div class="p-3.5 bg-white flex items-center justify-between gap-4">
                    <div>
                      <div class="font-bold text-slate-900">${sel.subject_name} (${sel.subject_code})</div>
                      <div class="text-slate-600 text-[11px]">Faculty: <strong>${sel.faculty_name}</strong> &bull; ${sel.designation}</div>
                      <div class="mono-font text-[10px] text-slate-400 mt-1">Reserved at: ${new Date(sel.reserved_at).toLocaleString()}</div>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${sel.selection_status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                      ${sel.selection_status}
                    </span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      `,
      footer: `<button onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl text-xs">Close</button>`
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openEditStudentModal(id) {
  const s = ADMIN_DATA.students.find(stu => stu.id === id);
  if (!s) return;

  openModal({
    title: `Edit Student: ${s.reg_no}`,
    maxWidth: 'max-w-md',
    body: `
      <form id="form-edit-student" onsubmit="submitEditStudent(event, ${s.id})" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Registration Number <span class="text-rose-500">*</span></label>
          <input type="text" id="edit-stu-reg" value="${s.reg_no}" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl uppercase mono-font">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Student Name <span class="text-rose-500">*</span></label>
          <input type="text" id="edit-stu-name" value="${s.name}" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Year</label>
            <select id="edit-stu-year" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              ${[1, 2, 3, 4].map(y => `<option value="${y}" ${s.academic_year === y ? 'selected' : ''}>Year ${y}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Semester</label>
            <select id="edit-stu-sem" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              ${[1, 2, 3, 4, 5, 6, 7, 8].map(sem => `<option value="${sem}" ${s.semester === sem ? 'selected' : ''}>Sem ${sem}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Group</label>
            <select id="edit-stu-sec" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="Group 1" ${s.section === 'Group 1' ? 'selected' : ''}>GROUP A</option>
              <option value="Group 2" ${s.section === 'Group 2' ? 'selected' : ''}>GROUP B</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Reset Password (leave blank to keep current)</label>
          <input type="password" id="edit-stu-pwd" placeholder="New password" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        </div>
        <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold">Cancel</button>
          <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md">Update Student</button>
        </div>
      </form>
    `
  });
}

async function submitEditStudent(e, id) {
  e.preventDefault();
  const body = {
    reg_no: document.getElementById('edit-stu-reg').value.trim().toUpperCase(),
    name: document.getElementById('edit-stu-name').value.trim(),
    academic_year: parseInt(document.getElementById('edit-stu-year').value, 10),
    semester: parseInt(document.getElementById('edit-stu-sem').value, 10),
    section: document.getElementById('edit-stu-sec').value.trim(),
    password: document.getElementById('edit-stu-pwd').value.trim() || undefined,
    status: 'ACTIVE'
  };

  try {
    const res = await api.put(`/api/students/${id}`, body);
    if (res && res.success) {
      closeModal();
      showToast('Student updated successfully!', 'success');
      loadAdminStudents();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteStudentRecord(id, name, regNo) {
  if (!confirm(`Are you sure you want to delete student "${name} (${regNo})"?\nThis is only permitted if the student has no confirmed selections.`)) {
    return;
  }

  try {
    const res = await api.delete(`/api/students/${id}`);
    if (res && res.success) {
      showToast(res.message, 'success');
      loadAdminStudents();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// =========================================================================
// 6. SELECTION ROUNDS
// =========================================================================
async function loadAdminRounds() {
  const container = document.getElementById('admin-tab-content');
  container.innerHTML = `<div class="py-12 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>`;

  try {
    const res = await api.get('/api/rounds');
    ADMIN_DATA.rounds = res ? res.rounds : [];
    renderRoundsList();
  } catch (err) {
    container.innerHTML = `<div class="p-6 bg-rose-50 text-rose-700 rounded-2xl text-xs">${err.message}</div>`;
  }
}

function renderRoundsList() {
  const container = document.getElementById('admin-tab-content');
  const rounds = ADMIN_DATA.rounds;

  container.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-900">Selection Rounds</h3>
          <p class="text-xs text-slate-500">Manage time windows and active periods during which students can select faculty.</p>
        </div>
        <button onclick="openAddRoundModal()" class="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto">
          <i class="fa-solid fa-plus"></i>
          <span>Create Round</span>
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3.5 px-6">Round Name</th>
                <th class="py-3.5 px-6">Target Cohort</th>
                <th class="py-3.5 px-6">Year & Sem</th>
                <th class="py-3.5 px-6">Window Start</th>
                <th class="py-3.5 px-6">Window End</th>
                <th class="py-3.5 px-6">Confirmed</th>
                <th class="py-3.5 px-6">Status</th>
                <th class="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${rounds.length === 0 ? `
                <tr>
                  <td colspan="8" class="py-16 text-center text-slate-400">
                    <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-lg mb-2">
                      <i class="fa-solid fa-stopwatch"></i>
                    </div>
                    <div class="font-bold text-slate-700">No Selection Rounds Created</div>
                    <div class="text-xs text-slate-400 mt-0.5">Click "Create Round" to define an active student selection window.</div>
                  </td>
                </tr>
              ` : rounds.map(r => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-6 font-bold text-slate-900">${r.name}</td>
                  <td class="py-3.5 px-6">
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${r.target_group === 'Group 1' ? 'bg-blue-100 text-blue-800 border border-blue-200' : (r.target_group === 'Group 2' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-700')}">
                      ${(r.target_group === 'Group 1' || r.target_group === 'A' || r.target_group === 'Group A') ? 'GROUP A' : ((r.target_group === 'Group 2' || r.target_group === 'B' || r.target_group === 'Group B') ? 'GROUP B' : 'All Students')}
                    </span>
                  </td>
                  <td class="py-3.5 px-6 font-semibold text-slate-700">Year ${r.academic_year} &bull; Sem ${r.semester}</td>
                  <td class="py-3.5 px-6 mono-font text-[11px] text-slate-600">${new Date(r.start_time).toLocaleString()}</td>
                  <td class="py-3.5 px-6 mono-font text-[11px] text-slate-600">${new Date(r.end_time).toLocaleString()}</td>
                  <td class="py-3.5 px-6 font-bold text-blue-600">${r.total_confirmed_selections}</td>
                  <td class="py-3.5 px-6">
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${r.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : r.status === 'PAUSED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}">
                      ${r.status}
                    </span>
                  </td>
                  <td class="py-3.5 px-6 text-right space-x-2">
                    <button onclick="toggleRoundStatus(${r.id}, '${r.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'}')" class="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                      ${r.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </button>
                    <button onclick="deleteRoundRecord(${r.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete Round">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function openAddRoundModal() {
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const startVal = now.toISOString().slice(0, 16);
  const endVal = nextMonth.toISOString().slice(0, 16);

  openModal({
    title: 'Create Selection Round',
    maxWidth: 'max-w-md',
    body: `
      <form id="form-add-round" onsubmit="submitAddRound(event)" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Round Name <span class="text-rose-500">*</span></label>
          <input type="text" id="round-name" value="III-II Faculty Selection" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Target Student Cohort <span class="text-rose-500">*</span></label>
          <select id="round-target-group" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
            <option value="Group 1">GROUP A</option>
            <option value="Group 2">GROUP B</option>
            <option value="ALL">All Students (Combined)</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Academic Year</label>
            <select id="round-year" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3" selected>Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Semester</label>
            <select id="round-sem" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="1">Sem 1</option>
              <option value="2">Sem 2</option>
              <option value="3">Sem 3</option>
              <option value="4">Sem 4</option>
              <option value="5">Sem 5</option>
              <option value="6" selected>Sem 6</option>
              <option value="7">Sem 7</option>
              <option value="8">Sem 8</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Start Time (Local)</label>
          <input type="datetime-local" id="round-start" value="${startVal}" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">End Time (Local)</label>
          <input type="datetime-local" id="round-end" value="${endVal}" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        </div>
        <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold">Cancel</button>
          <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md">Create Round</button>
        </div>
      </form>
    `
  });
}

async function submitAddRound(e) {
  e.preventDefault();
  const body = {
    name: document.getElementById('round-name').value.trim(),
    target_group: document.getElementById('round-target-group').value,
    academic_year: parseInt(document.getElementById('round-year').value, 10),
    semester: parseInt(document.getElementById('round-sem').value, 10),
    start_time: new Date(document.getElementById('round-start').value).toISOString(),
    end_time: new Date(document.getElementById('round-end').value).toISOString(),
    status: 'ACTIVE'
  };

  try {
    const res = await api.post('/api/rounds', body);
    if (res && res.success) {
      closeModal();
      showToast('Selection round created successfully!', 'success');
      loadAdminRounds();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleRoundStatus(id, newStatus) {
  try {
    const r = ADMIN_DATA.rounds.find(round => round.id === id);
    if (!r) return;

    const res = await api.put(`/api/rounds/${id}`, {
      ...r,
      status: newStatus
    });

    if (res && res.success) {
      showToast(`Round status updated to ${newStatus}.`, 'success');
      loadAdminRounds();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteRoundRecord(id) {
  if (!confirm('Are you sure you want to delete this round?')) return;
  try {
    const res = await api.delete(`/api/rounds/${id}`);
    if (res && res.success) {
      showToast(res.message, 'success');
      loadAdminRounds();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Defensive quote escaper for admin inline event handlers
function escapeQuote(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// =========================================================================
// 7. LIVE SELECTIONS (Master Live Control Center & Real-Time Monitoring)
// =========================================================================
async function loadAdminLiveSelections() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;
  container.innerHTML = `<div class="py-12 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>`;

  try {
    await fetchLiveSelections();
    // Auto-refresh every 3.5 seconds for live monitor
    if (!STATE.liveInterval) {
      STATE.liveInterval = setInterval(fetchLiveSelections, 3500);
    }
  } catch (err) {
    console.error('Failed to load live selections:', err);
    container.innerHTML = `
      <div class="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs space-y-2">
        <div class="font-bold text-sm">Failed to load Live Selections</div>
        <div>${err.message || 'An unexpected error occurred while contacting the server.'}</div>
        <button onclick="loadAdminLiveSelections()" class="mt-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer transition-all">
          <i class="fa-solid fa-rotate-right mr-1"></i> Try Again
        </button>
      </div>
    `;
  }
}

async function fetchLiveSelections() {
  try {
    const [selRes, roundsRes] = await Promise.all([
      api.get('/api/selections/live'),
      api.get('/api/rounds')
    ]);
    ADMIN_DATA.selections = (selRes && selRes.selections) ? selRes.selections : [];
    if (roundsRes && roundsRes.rounds) {
      ADMIN_DATA.rounds = roundsRes.rounds;
    }
    renderLiveSelectionsList();
  } catch (err) {
    console.error('Error fetching live selections:', err);
    const container = document.getElementById('admin-tab-content');
    if (container && container.innerHTML.includes('fa-circle-notch')) {
      container.innerHTML = `
        <div class="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs space-y-2">
          <div class="font-bold text-sm">Failed to load Live Selections</div>
          <div>${err.message || 'An unexpected error occurred while contacting the server.'}</div>
          <button onclick="loadAdminLiveSelections()" class="mt-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer transition-all">
            <i class="fa-solid fa-rotate-right mr-1"></i> Try Again
          </button>
        </div>
      `;
    }
  }
}

function filterLiveGroup(grp) {
  ADMIN_DATA.liveGroupFilter = grp;
  renderLiveSelectionsList();
}

function renderLiveSelectionsList() {
  try {
    const container = document.getElementById('admin-tab-content');
    if (!container) return;

    const selections = ADMIN_DATA.selections || [];
    const rounds = ADMIN_DATA.rounds || [];

    ADMIN_DATA.liveYearFilter = ADMIN_DATA.liveYearFilter || 3;
    const curYear = parseInt(ADMIN_DATA.liveYearFilter, 10);

    // Distinct rounds for Group 1 and Group 2 for the active year
    const yearRounds = rounds.filter(r => r.academic_year === curYear);
    const roundG1 = yearRounds.find(r => r.target_group === 'Group 1') || null;
    const roundG2 = yearRounds.find(r => r.target_group === 'Group 2') || null;

    const isG1Active = roundG1 && roundG1.status === 'ACTIVE';
    const isG1Paused = roundG1 && roundG1.status === 'PAUSED';
    const g1Selections = selections.filter(s => s.student_section === 'Group 1' && (!roundG1 || s.selection_round_id === roundG1.id || true));
    const g1Confirmed = g1Selections.filter(s => s.status === 'CONFIRMED').length;

    const isG2Active = roundG2 && roundG2.status === 'ACTIVE';
    const isG2Paused = roundG2 && roundG2.status === 'PAUSED';
    const g2Selections = selections.filter(s => s.student_section === 'Group 2' && (!roundG2 || s.selection_round_id === roundG2.id || true));
    const g2Confirmed = g2Selections.filter(s => s.status === 'CONFIRMED').length;

    const g1RollText = curYear === 2
      ? '25091A0501 to 25091A05CT (501 to 5CT)'
      : '24091A0501 to 24091A05DB (501 to 5DB & LE 501–525)';
    const g1CohortText = curYear === 2 ? '190 Students' : '216 Students';
    const g2RollText = curYear === 2
      ? '25091A05CU to 25091A05JN (5CU to 5JN & LE 501–544)'
      : '24091A05DC to 24091A05KN (5DC to 5KN & LE 526–549)';
    const g2CohortText = curYear === 2 ? '231 Students' : '215 Students';

    const activeFilter = ADMIN_DATA.liveGroupFilter || 'ALL';
    const displayedSelections = selections.filter(s => {
      if (activeFilter === 'Group 1') return s.student_section === 'Group 1';
      if (activeFilter === 'Group 2') return s.student_section === 'Group 2';
      return true;
    });

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Year Switcher for Live Control -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-graduation-cap text-blue-600"></i>
              <span>Live Selection Target Academic Year:</span>
            </div>
            <div class="text-xs text-slate-500 mt-0.5">Toggle live round gateway between 2nd Year (II-II) and 3rd Year (III-II).</div>
          </div>
          <div class="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button onclick="ADMIN_DATA.liveYearFilter = 3; renderLiveSelectionsList();" class="px-4 py-2 text-xs font-bold rounded-lg transition-all ${curYear === 3 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
              3rd Year (III-II)
            </button>
            <button onclick="ADMIN_DATA.liveYearFilter = 2; renderLiveSelectionsList();" class="px-4 py-2 text-xs font-bold rounded-lg transition-all ${curYear === 2 ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
              2nd Year (II-II)
            </button>
          </div>
        </div>

        <!-- Dual Group Master Live Control Centers -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- Card 1: Group 1 -->
          <div class="bg-gradient-to-br ${isG1Active ? 'from-emerald-950 via-slate-900 to-emerald-950 border-emerald-500/40 shadow-emerald-900/20' : (isG1Paused ? 'from-amber-950 via-slate-900 to-amber-950 border-amber-500/40 shadow-amber-900/20' : 'from-slate-900 via-indigo-950 to-slate-900 border-slate-700')} p-6 rounded-3xl border shadow-xl text-white flex flex-col justify-between space-y-5">
            <div>
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2.5">
                  <span class="w-3.5 h-3.5 rounded-full ${isG1Active ? 'bg-emerald-400 animate-ping' : (isG1Paused ? 'bg-amber-400 animate-pulse' : 'bg-slate-500')}"></span>
                  <h3 class="text-base font-black tracking-tight text-white uppercase">
                    Year ${curYear} &bull; GROUP A
                  </h3>
                </div>
                <span class="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${isG1Active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : (isG1Paused ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' : 'bg-slate-700 text-slate-300 border border-slate-600')}">
                  ${roundG1 ? roundG1.status : 'NOT CONFIGURED'}
                </span>
              </div>
              <div class="text-xs text-blue-300 font-semibold mt-1">
                Roll Nos: <strong>${g1RollText}</strong> &bull; Total Cohort: <strong>${g1CohortText}</strong>
              </div>
              <p class="text-xs ${isG1Active ? 'text-emerald-200' : 'text-slate-300'} mt-2 leading-relaxed">
                ${isG1Active
        ? '🟢 LIVE ACTIVE: GROUP A students can submit choices right now in real time.'
        : (isG1Paused
          ? '⏸️ PAUSED: GROUP A selection is temporarily frozen by administrator.'
          : '⏹️ NOT STARTED: Click below to unlock the portal for GROUP A.')}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
              <div class="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <div class="text-slate-400 text-[11px] font-semibold">Confirmed Claims</div>
                <div class="font-bold text-emerald-400 text-sm mt-0.5">${g1Confirmed} Selections</div>
              </div>
              <div class="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <div class="text-slate-400 text-[11px] font-semibold">Portal Gateway</div>
                <div class="font-bold ${isG1Active ? 'text-emerald-300' : 'text-amber-300'} text-sm mt-0.5">
                  ${isG1Active ? 'OPEN' : 'LOCKED'}
                </div>
              </div>
            </div>

            <div class="pt-2">
              ${roundG1 ? (
        !isG1Active ? (
          isG1Paused ? `
                    <div class="flex items-center gap-2">
                      <button onclick="toggleLiveSelection(${roundG1.id}, 'ACTIVE')" class="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all">
                        <i class="fa-solid fa-play"></i>
                        <span>RESUME GROUP A</span>
                      </button>
                      <button onclick="toggleLiveSelection(${roundG1.id}, 'CLOSED')" class="py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                        <i class="fa-solid fa-stop"></i>
                        <span>Close</span>
                      </button>
                    </div>
                  ` : `
                    <button onclick="toggleLiveSelection(${roundG1.id}, 'ACTIVE')" class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                      <i class="fa-solid fa-play text-sm"></i>
                      <span>START LIVE SELECTION (GROUP A)</span>
                    </button>
                  `
        ) : `
                  <div class="flex items-center gap-2">
                    <button onclick="toggleLiveSelection(${roundG1.id}, 'PAUSED')" class="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                      <i class="fa-solid fa-pause"></i>
                      <span>Pause GROUP A</span>
                    </button>
                    <button onclick="toggleLiveSelection(${roundG1.id}, 'CLOSED')" class="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                      <i class="fa-solid fa-stop"></i>
                      <span>Close Round</span>
                    </button>
                  </div>
                `
      ) : `
                <button onclick="switchAdminTab('rounds')" class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                  <i class="fa-solid fa-plus"></i>
                  <span>Configure GROUP A Round</span>
                </button>
              `}
            </div>
          </div>

          <!-- Card 2: Group 2 -->
          <div class="bg-gradient-to-br ${isG2Active ? 'from-emerald-950 via-slate-900 to-emerald-950 border-emerald-500/40 shadow-emerald-900/20' : (isG2Paused ? 'from-amber-950 via-slate-900 to-amber-950 border-amber-500/40 shadow-amber-900/20' : 'from-slate-900 via-indigo-950 to-slate-900 border-slate-700')} p-6 rounded-3xl border shadow-xl text-white flex flex-col justify-between space-y-5">
            <div>
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2.5">
                  <span class="w-3.5 h-3.5 rounded-full ${isG2Active ? 'bg-emerald-400 animate-ping' : (isG2Paused ? 'bg-amber-400 animate-pulse' : 'bg-slate-500')}"></span>
                  <h3 class="text-base font-black tracking-tight text-white uppercase">
                    Year ${curYear} &bull; GROUP B
                  </h3>
                </div>
                <span class="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${isG2Active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : (isG2Paused ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' : 'bg-slate-700 text-slate-300 border border-slate-600')}">
                  ${roundG2 ? roundG2.status : 'NOT CONFIGURED'}
                </span>
              </div>
              <div class="text-xs text-purple-300 font-semibold mt-1">
                Roll Nos: <strong>${g2RollText}</strong> &bull; Total Cohort: <strong>${g2CohortText}</strong>
              </div>
              <p class="text-xs ${isG2Active ? 'text-emerald-200' : 'text-slate-300'} mt-2 leading-relaxed">
                ${isG2Active
        ? '🟢 LIVE ACTIVE: GROUP B students can submit choices right now in real time.'
        : (isG2Paused
          ? '⏸️ PAUSED: GROUP B selection is temporarily frozen by administrator.'
          : '⏹️ NOT STARTED: Click below to unlock the portal for GROUP B.')}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
              <div class="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <div class="text-slate-400 text-[11px] font-semibold">Confirmed Claims</div>
                <div class="font-bold text-emerald-400 text-sm mt-0.5">${g2Confirmed} Selections</div>
              </div>
              <div class="bg-white/5 rounded-xl p-2.5 border border-white/10">
                <div class="text-slate-400 text-[11px] font-semibold">Portal Gateway</div>
                <div class="font-bold ${isG2Active ? 'text-emerald-300' : 'text-amber-300'} text-sm mt-0.5">
                  ${isG2Active ? 'OPEN' : 'LOCKED'}
                </div>
              </div>
            </div>

            <div class="pt-2">
              ${roundG2 ? (
        !isG2Active ? (
          isG2Paused ? `
                    <div class="flex items-center gap-2">
                      <button onclick="toggleLiveSelection(${roundG2.id}, 'ACTIVE')" class="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all">
                        <i class="fa-solid fa-play"></i>
                        <span>RESUME GROUP B</span>
                      </button>
                      <button onclick="toggleLiveSelection(${roundG2.id}, 'CLOSED')" class="py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                        <i class="fa-solid fa-stop"></i>
                        <span>Close</span>
                      </button>
                    </div>
                  ` : `
                    <button onclick="toggleLiveSelection(${roundG2.id}, 'ACTIVE')" class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                      <i class="fa-solid fa-play text-sm"></i>
                      <span>START LIVE SELECTION (GROUP B)</span>
                    </button>
                  `
        ) : `
                  <div class="flex items-center gap-2">
                    <button onclick="toggleLiveSelection(${roundG2.id}, 'PAUSED')" class="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                      <i class="fa-solid fa-pause"></i>
                      <span>Pause GROUP B</span>
                    </button>
                    <button onclick="toggleLiveSelection(${roundG2.id}, 'CLOSED')" class="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                      <i class="fa-solid fa-stop"></i>
                      <span>Close Round</span>
                    </button>
                  </div>
                `
      ) : `
                <button onclick="switchAdminTab('rounds')" class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                  <i class="fa-solid fa-plus"></i>
                  <span>Configure GROUP B Round</span>
                </button>
              `}
            </div>
          </div>

        </div>

        <!-- Live Stream Header with Group Filter Tabs -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full ${(isG1Active || isG2Active) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}"></span>
              <h3 class="text-base font-bold text-slate-900">Live Selections Incoming Stream</h3>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Real-time server-side FCFS course allocations. Auto-refreshes every 3.5 seconds.</p>
          </div>

          <!-- Group Filter Pills & Excel Export -->
          <div class="flex items-center gap-2">
            <button onclick="filterLiveGroup('ALL')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              All Cohorts (${selections.length})
            </button>
            <button onclick="filterLiveGroup('Group 1')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeFilter === 'Group 1' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}">
              GROUP A (${g1Confirmed})
            </button>
            <button onclick="filterLiveGroup('Group 2')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeFilter === 'Group 2' ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}">
              GROUP B (${g2Confirmed})
            </button>
            <button onclick="downloadReportExcel('selections')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer">
              <i class="fa-solid fa-file-excel"></i>
              <span>Export Excel</span>
            </button>
            <button onclick="downloadReportExcel('unselected')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer" title="Download Excel sheet of students who have not selected faculty or incomplete selections">
              <i class="fa-solid fa-user-xmark"></i>
              <span>Export Pending Students</span>
            </button>
            <button onclick="openClearSelectionsModal()" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer" title="Reset and clear selections for a new trial run">
              <i class="fa-solid fa-rotate-left"></i>
              <span>Clear Selections</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th class="py-3.5 px-6">Student</th>
                  <th class="py-3.5 px-6">Cohort</th>
                  <th class="py-3.5 px-6">Subject</th>
                  <th class="py-3.5 px-6">Assigned Faculty</th>
                  <th class="py-3.5 px-6">Server Timestamp</th>
                  <th class="py-3.5 px-6">Status</th>
                  <th class="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${displayedSelections.length === 0 ? `
                  <tr>
                    <td colspan="7" class="py-16 text-center text-slate-400">
                      <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-lg mb-2">
                        <i class="fa-solid fa-satellite-dish"></i>
                      </div>
                      <div class="font-bold text-slate-700">No Selections Recorded Yet for ${activeFilter === 'ALL' ? 'Any Group' : (activeFilter === 'Group 1' ? 'GROUP A' : (activeFilter === 'Group 2' ? 'GROUP B' : activeFilter))}</div>
                      <div class="text-xs text-slate-400 mt-0.5">As students confirm faculty selections, they will appear here in real time.</div>
                    </td>
                  </tr>
                ` : displayedSelections.map(s => `
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3.5 px-6">
                      <div class="font-bold text-slate-900">${s.student_name}</div>
                      <div class="mono-font text-[11px] text-blue-600 font-semibold">${s.student_reg_no}</div>
                    </td>
                    <td class="py-3.5 px-6">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${s.student_section === 'Group 1' ? 'bg-blue-100 text-blue-800 border border-blue-200' : (s.student_section === 'Group 2' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-700')}">
                        ${(s.student_section === 'Group 1' || s.student_section === 'A' || s.student_section === 'Group A') ? 'GROUP A' : ((s.student_section === 'Group 2' || s.student_section === 'B' || s.student_section === 'Group B') ? 'GROUP B' : s.student_section)}
                      </span>
                    </td>
                    <td class="py-3.5 px-6">
                      <div class="font-bold text-slate-900">${s.subject_name}</div>
                      <div class="mono-font text-[11px] text-slate-500">${s.subject_code}</div>
                    </td>
                    <td class="py-3.5 px-6">
                      <div class="font-bold text-slate-900">${s.faculty_name}</div>
                      <div class="text-[11px] text-slate-500">${s.faculty_designation}</div>
                    </td>
                    <td class="py-3.5 px-6 mono-font text-[11px] text-slate-600">
                      ${new Date(s.reserved_at).toLocaleString()}
                    </td>
                    <td class="py-3.5 px-6">
                      ${s.status === 'CONFIRMED' ? `
                        <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          CONFIRMED
                        </span>
                      ` : `
                        <div>
                          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            CANCELLED
                          </span>
                          <div class="text-[10px] text-slate-500 mt-1 max-w-xs truncate" title="${s.cancellation_reason}">
                            Reason: "${s.cancellation_reason}"
                          </div>
                        </div>
                      `}
                    </td>
                    <td class="py-3.5 px-6 text-right">
                      ${s.status === 'CONFIRMED' ? `
                        <button onclick="openCancelSelectionModal(${s.id}, '${escapeQuote(s.student_name)}', '${escapeQuote(s.student_reg_no)}', '${escapeQuote(s.faculty_name)}', '${escapeQuote(s.subject_code)}')" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors">
                          Cancel Selection
                        </button>
                      ` : `
                        <span class="text-slate-400 text-xs italic">Cancelled</span>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (renderErr) {
    console.error('Error rendering live selections:', renderErr);
    const container = document.getElementById('admin-tab-content');
    if (container) {
      container.innerHTML = `
        <div class="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs space-y-2">
          <div class="font-bold text-sm">Rendering Error in Live Selections</div>
          <div>${renderErr.message}</div>
          <button onclick="loadAdminLiveSelections()" class="mt-2 px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold">Retry</button>
        </div>
      `;
    }
  }
}

function changeLiveRound(roundId) {
  ADMIN_DATA.selectedLiveRoundId = parseInt(roundId, 10);
  renderLiveSelectionsList();
}

async function toggleLiveSelection(roundId, newStatus) {
  if (newStatus === 'CLOSED' && !confirm('Are you sure you want to CLOSE this selection round? Students will no longer be able to submit choices.')) {
    return;
  }
  try {
    const res = await api.patch(`/api/rounds/${roundId}/status`, { status: newStatus });
    if (res && res.success) {
      showToast(newStatus === 'ACTIVE'
        ? '🟢 Live Selection has been STARTED! Students can now submit their faculty choices.'
        : `Selection round status changed to ${newStatus}.`, 'success');
      await fetchLiveSelections();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Mandatory Reason Cancellation Modal
function openCancelSelectionModal(selectionId, studentName, regNo, facultyName, subjectCode) {
  openModal({
    title: 'Administrator Cancel Selection',
    maxWidth: 'max-w-md',
    body: `
      <form id="form-cancel-selection" onsubmit="submitCancelSelection(event, ${selectionId})" class="space-y-4 text-xs">
        <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950">
          <div class="font-bold text-sm">Cancel Confirmed Selection #${selectionId}</div>
          <div class="mt-1">
            Student: <strong>${studentName}</strong> (${regNo})<br>
            Course: <strong>${subjectCode}</strong> &bull; Faculty: <strong>${facultyName}</strong>
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-900 mb-1">
            Mandatory Cancellation Reason <span class="text-rose-500">*</span>
          </label>
          <textarea id="cancel-reason-input" rows="3" required placeholder="State official administrative reason for cancellation (e.g. Ineligible semester status, section change, academic exemption)..." class="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 text-xs"></textarea>
          <p class="text-[11px] text-slate-500 mt-1">This cancellation reason is strictly recorded into the permanent audit log and historical selection ledger.</p>
        </div>

        <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold">Keep Selection</button>
          <button type="submit" id="btn-submit-cancel" class="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all">
            Confirm Cancellation
          </button>
        </div>
      </form>
    `
  });
}

async function submitCancelSelection(e, selectionId) {
  e.preventDefault();
  const reason = document.getElementById('cancel-reason-input').value.trim();
  const btn = document.getElementById('btn-submit-cancel');

  if (!reason) {
    showToast('A mandatory cancellation reason is required.', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i><span>Cancelling...</span>`;

  try {
    const res = await api.post(`/api/selections/${selectionId}/cancel`, { reason });
    if (res && res.success) {
      closeModal();
      showToast(res.message, 'success');
      fetchLiveSelections();
    }
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = `Confirm Cancellation`;
    showToast(err.message, 'error');
  }
}

// =========================================================================
// 8. REPORTS
// =========================================================================
async function loadAdminReports() {
  const container = document.getElementById('admin-tab-content');
  container.innerHTML = `<div class="py-12 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>`;

  try {
    const [allocRes, demandRes] = await Promise.all([
      api.get('/api/reports/faculty-allocations'),
      api.get('/api/reports/subject-demand')
    ]);

    const allocations = allocRes ? allocRes.allocations : [];
    const subjects = demandRes ? demandRes.subjects : [];

    container.innerHTML = `
      <div class="space-y-8">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 class="text-base font-bold text-slate-900">Official Allocation & Demand Reports</h3>
            <p class="text-xs text-slate-500">Comprehensive capacity audits, occupancy percentages, and course demand metrics.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2 no-print">
            <select id="report-excel-year" class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="ALL">All Academic Years</option>
              <option value="2">2nd Year Only</option>
              <option value="3">3rd Year Only</option>
            </select>
            <button onclick="downloadReportExcel('selections')" class="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all">
              <i class="fa-solid fa-file-excel"></i>
              <span>Export Selections</span>
            </button>
            <button onclick="downloadReportExcel('unselected')" class="py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all" title="Download Excel sheet of students who have not selected faculty">
              <i class="fa-solid fa-user-xmark"></i>
              <span>Export Pending Students</span>
            </button>
            <button onclick="downloadReportExcel('faculty')" class="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all">
              <i class="fa-solid fa-chalkboard-user"></i>
              <span>Export Faculty Allocations</span>
            </button>
            <button onclick="window.print()" class="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all">
              <i class="fa-solid fa-print"></i>
              <span>Print</span>
            </button>
          </div>
        </div>

        <!-- Faculty Allocation Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden printable-area">
          <div class="p-5 border-b border-slate-100 bg-slate-50/50">
            <h4 class="text-sm font-bold text-slate-900">1. Faculty Teaching Allocation & Occupancy Report</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th class="py-3 px-6">Faculty Member</th>
                  <th class="py-3 px-6">Subject</th>
                  <th class="py-3 px-6">Year & Sem</th>
                  <th class="py-3 px-6">Capacity</th>
                  <th class="py-3 px-6">Allocated</th>
                  <th class="py-3 px-6">Available</th>
                  <th class="py-3 px-6">Occupancy Rate</th>
                  <th class="py-3 px-6">Availability Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${allocations.length === 0 ? `
                  <tr><td colspan="8" class="py-8 text-center text-slate-400">No mappings to report.</td></tr>
                ` : allocations.map(a => `
                  <tr>
                    <td class="py-3 px-6 font-bold text-slate-900">${a.faculty_name} (${a.faculty_code})</td>
                    <td class="py-3 px-6">${a.subject_name} (${a.subject_code})</td>
                    <td class="py-3 px-6">Y${a.academic_year} S${a.semester}</td>
                    <td class="py-3 px-6 font-bold">${a.capacity}</td>
                    <td class="py-3 px-6 font-bold text-blue-600">${a.allocated_seats}</td>
                    <td class="py-3 px-6 font-bold text-emerald-600">${a.available_seats}</td>
                    <td class="py-3 px-6 font-bold">${a.occupancy_pct}%</td>
                    <td class="py-3 px-6">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${a.available_seats === 0 ? 'bg-rose-100 text-rose-700 border border-rose-200' : ((a.occupancy_pct > 40) ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200')}">
                        <span class="w-2 h-2 rounded-full ${a.available_seats === 0 ? 'bg-rose-500' : ((a.occupancy_pct > 40) ? 'bg-amber-400' : 'bg-emerald-500')}"></span>
                        ${a.availability_label || (a.available_seats === 0 ? 'Full' : (a.occupancy_pct > 40 ? 'Filling Fast' : 'Available'))}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Subject Demand Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden printable-area">
          <div class="p-5 border-b border-slate-100 bg-slate-50/50">
            <h4 class="text-sm font-bold text-slate-900">2. Subject Capacity & Student Demand Analysis</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th class="py-3 px-6">Subject Code & Name</th>
                  <th class="py-3 px-6">Year & Sem</th>
                  <th class="py-3 px-6">Faculty Count</th>
                  <th class="py-3 px-6">Total Seats</th>
                  <th class="py-3 px-6">Allocated</th>
                  <th class="py-3 px-6">Eligible Students</th>
                  <th class="py-3 px-6">Fill Rate</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${subjects.length === 0 ? `
                  <tr><td colspan="7" class="py-8 text-center text-slate-400">No subjects to report.</td></tr>
                ` : subjects.map(s => `
                  <tr>
                    <td class="py-3 px-6 font-bold text-slate-900">${s.name} (${s.code})</td>
                    <td class="py-3 px-6">Y${s.academic_year} S${s.semester}</td>
                    <td class="py-3 px-6">${s.faculty_count}</td>
                    <td class="py-3 px-6 font-bold">${s.total_capacity}</td>
                    <td class="py-3 px-6 font-bold text-blue-600">${s.total_allocated}</td>
                    <td class="py-3 px-6 text-slate-600">${s.eligible_students}</td>
                    <td class="py-3 px-6 font-bold">${s.fill_rate}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="p-6 bg-rose-50 text-rose-700 rounded-2xl text-xs">${err.message}</div>`;
  }
}

// =========================================================================
// 9. AUDIT LOGS
// =========================================================================
async function loadAdminAudit() {
  const container = document.getElementById('admin-tab-content');
  container.innerHTML = `<div class="py-12 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>`;

  try {
    const res = await api.get('/api/audit');
    ADMIN_DATA.auditLogs = res ? res.logs : [];
    renderAuditLogsList();
  } catch (err) {
    container.innerHTML = `<div class="p-6 bg-rose-50 text-rose-700 rounded-2xl text-xs">${err.message}</div>`;
  }
}

function renderAuditLogsList() {
  const container = document.getElementById('admin-tab-content');
  const logs = ADMIN_DATA.auditLogs;

  container.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-900">System Audit Trail</h3>
          <p class="text-xs text-slate-500">Immutable chronological log of all administrative actions, logins, and student reservations.</p>
        </div>
        <div class="text-xs text-slate-500 font-semibold">
          Total Logs: ${logs.length}
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3 px-6">Timestamp</th>
                <th class="py-3 px-6">Action</th>
                <th class="py-3 px-6">Entity</th>
                <th class="py-3 px-6">Operator / User</th>
                <th class="py-3 px-6">Details</th>
                <th class="py-3 px-6">IP Address</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${logs.length === 0 ? `
                <tr><td colspan="6" class="py-12 text-center text-slate-400">No audit logs recorded yet.</td></tr>
              ` : logs.map(l => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-6 mono-font text-[11px] text-slate-600 whitespace-nowrap">${new Date(l.timestamp).toLocaleString()}</td>
                  <td class="py-3 px-6">
                    <span class="mono-font px-2 py-0.5 rounded text-[10px] font-bold ${l.action.includes('CANCEL') ? 'bg-rose-100 text-rose-800' : l.action.includes('CREATE') || l.action.includes('CONFIRMED') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">
                      ${l.action}
                    </span>
                  </td>
                  <td class="py-3 px-6 font-semibold text-slate-700">${l.entity}</td>
                  <td class="py-3 px-6 font-medium text-slate-900">${l.operator_username || 'System'}</td>
                  <td class="py-3 px-6 text-slate-600 max-w-md break-words">${l.details}</td>
                  <td class="py-3 px-6 mono-font text-[11px] text-slate-400">${l.ip_address}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// Download Excel report handler
function downloadReportExcel(type) {
  const yearSelect = document.getElementById('report-excel-year') ? document.getElementById('report-excel-year').value : (ADMIN_DATA.liveYearFilter || 'ALL');
  let url = '';
  if (type === 'selections') {
    url = `/api/reports/export-selections-excel?academic_year=${encodeURIComponent(yearSelect)}&token=${encodeURIComponent(STATE.token || '')}`;
  } else if (type === 'unselected') {
    url = `/api/reports/export-unselected-students-excel?academic_year=${encodeURIComponent(yearSelect)}&token=${encodeURIComponent(STATE.token || '')}`;
  } else if (type === 'faculty') {
    url = `/api/reports/export-faculty-summary-excel?academic_year=${encodeURIComponent(yearSelect)}&token=${encodeURIComponent(STATE.token || '')}`;
  } else if (type === 'students') {
    url = `/api/reports/export-students-excel?academic_year=${encodeURIComponent(yearSelect)}&token=${encodeURIComponent(STATE.token || '')}`;
  }

  if (url) {
    window.open(url, '_blank');
    showToast('Excel report download initiated.', 'success');
  }
}

// Clear / Reset selections handler
function openClearSelectionsModal() {
  const currentYear = ADMIN_DATA.liveYearFilter || 2;
  const currentGroup = ADMIN_DATA.liveGroupFilter || 'ALL';

  openModal({
    title: 'Clear / Reset Selection List',
    maxWidth: 'max-w-md',
    body: `
      <div class="space-y-4">
        <div class="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <i class="fa-solid fa-triangle-exclamation text-rose-600 text-lg mt-0.5"></i>
          <div class="text-xs text-rose-950 leading-relaxed">
            <strong class="font-bold">Attention Administrator:</strong> Clearing the selection list permanently removes recorded student choices and restores all faculty available seats to their original capacities. Use this to reset the portal for a fresh trial run.
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Select Scope to Clear:</label>
          <select id="clear-scope-year" class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500">
            <option value="2" ${currentYear === 2 ? 'selected' : ''}>2nd Year (II-II) Selections Only</option>
            <option value="3" ${currentYear === 3 ? 'selected' : ''}>3rd Year (III-II) Selections Only</option>
            <option value="ALL">All Selections (Both Years)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Target Cohort Group:</label>
          <select id="clear-scope-group" class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500">
            <option value="ALL" ${currentGroup === 'ALL' ? 'selected' : ''}>All Groups (Group 1 + Group 2)</option>
            <option value="Group 1" ${currentGroup === 'Group 1' ? 'selected' : ''}>Group 1 Only</option>
            <option value="Group 2" ${currentGroup === 'Group 2' ? 'selected' : ''}>Group 2 Only</option>
          </select>
        </div>
      </div>
    `,
    footer: `
      <button onclick="closeModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors">
        Cancel
      </button>
      <button onclick="submitClearSelections()" id="btn-confirm-clear" class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all cursor-pointer">
        <i class="fa-solid fa-trash-can"></i>
        <span>Confirm Clear Selections</span>
      </button>
    `
  });
}

async function submitClearSelections() {
  const year = document.getElementById('clear-scope-year') ? document.getElementById('clear-scope-year').value : 'ALL';
  const group = document.getElementById('clear-scope-group') ? document.getElementById('clear-scope-group').value : 'ALL';
  const btn = document.getElementById('btn-confirm-clear');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Clearing...</span>';
  }

  try {
    const res = await api.post('/api/selections/clear-all', {
      academic_year: year,
      target_group: group
    });

    closeModal();
    showToast(res.message || 'Selection list cleared successfully!', 'success');
    await loadAdminLiveSelections();
  } catch (err) {
    showToast(err.message || 'Failed to clear selections.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-trash-can"></i><span>Confirm Clear Selections</span>';
    }
  }
}


// =========================================================================
// 10. OPEN ELECTIVES MANAGEMENT (3RD YEAR B.TECH)
// =========================================================================

let CURRENT_OE_SUBTAB = 'config'; // 'config' | 'reports' | 'incomplete' | 'demand'
let CURRENT_OE_REPORT_FILTERS = {
  search: '',
  electiveId: 'ALL',
  subjectId: 'ALL',
  facultyId: 'ALL'
};
let CURRENT_OE_INCOMPLETE_SEARCH = '';

async function loadAdminOpenElectives(subTab = CURRENT_OE_SUBTAB) {
  CURRENT_OE_SUBTAB = subTab;
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  container.innerHTML = `
    <div class="flex items-center justify-center p-16 text-slate-400">
      <i class="fa-solid fa-circle-notch fa-spin text-3xl text-indigo-600"></i>
      <span class="ml-3 text-sm font-semibold text-slate-600">Loading Open Elective Management Engine...</span>
    </div>
  `;

  try {
    const [oeRes, repRes, facRes] = await Promise.all([
      api.get('/api/open-electives'),
      api.get('/api/open-electives/reports'),
      (ADMIN_DATA.faculty && ADMIN_DATA.faculty.length > 0) ? Promise.resolve({ success: true, faculty: ADMIN_DATA.faculty }) : api.get('/api/faculty')
    ]);

    ADMIN_DATA.openElectives = (oeRes && oeRes.success) ? oeRes.electives : [];
    ADMIN_DATA.oeReports = (repRes && repRes.success) ? repRes : { stats: {}, registrations: [], faculty_allocations: [], subject_allocations: [], incomplete_students: [] };
    if (facRes && facRes.faculty) {
      ADMIN_DATA.faculty = facRes.faculty;
    }

    renderAdminOpenElectives();
  } catch (err) {
    console.error('Error loading Open Elective admin:', err);
    container.innerHTML = `
      <div class="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl">
        <h4 class="font-bold text-sm">Failed to load Open Elective Management</h4>
        <p class="text-xs mt-1">${err.message || 'Server error occurred'}</p>
        <button onclick="loadAdminOpenElectives('${subTab}')" class="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold">Try Again</button>
      </div>
    `;
  }
}

function switchOESubTab(tab) {
  CURRENT_OE_SUBTAB = tab;
  renderAdminOpenElectives();
}

function renderAdminOpenElectivesHTML() {
  const electives = ADMIN_DATA.openElectives || [];
  const rep = ADMIN_DATA.oeReports || { stats: {}, registrations: [], faculty_allocations: [], subject_allocations: [], incomplete_students: [] };
  const stats = rep.stats || {};

  // Summary Metrics
  const totalElectives = electives.length;
  let totalSubjects = 0;
  let totalAssignments = 0;
  let totalCapacity = 0;
  electives.forEach(e => {
    (e.subjects || []).forEach(s => {
      totalSubjects++;
      (s.faculty_assignments || []).forEach(fa => {
        totalAssignments++;
        totalCapacity += (fa.max_capacity || 0);
      });
    });
  });

  const total3rdYear = stats.total_3rd_year || 0;
  const completedCount = stats.completed_count || 0;
  const partialCount = stats.partially_completed_count || 0;
  const notStartedCount = stats.not_started_count || 0;
  const totalRegs = (rep.registrations || []).length;

  return `
    <div class="space-y-6">
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-indigo-600"></span>
            <h3 class="text-base font-bold text-slate-900">Open Elective Subject &amp; Faculty Mapping (3rd Year)</h3>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              B.Tech III-II (Sem 6)
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            Configure Open Elective I &amp; II courses, map faculty with independent seat capacities, and monitor student allocations.
          </p>
        </div>
      </div>

      <!-- Overview Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div class="text-xs font-medium text-slate-500">Active Electives</div>
          <div class="text-xl font-bold text-slate-900 mt-1">${totalElectives}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">OE-I &amp; OE-II</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div class="text-xs font-medium text-slate-500">Subjects / Faculty</div>
          <div class="text-xl font-bold text-indigo-600 mt-1">${totalSubjects} <span class="text-sm font-normal text-slate-400">/ ${totalAssignments}</span></div>
          <div class="text-[11px] text-slate-400 mt-0.5">${totalCapacity} Total Seats</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div class="text-xs font-medium text-slate-500">Total 3rd Year</div>
          <div class="text-xl font-bold text-slate-900 mt-1">${total3rdYear}</div>
          <div class="text-[11px] text-slate-400 mt-0.5">Eligible Cohort</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <div class="text-xs font-medium text-emerald-700">Both Completed</div>
          <div class="text-xl font-bold text-emerald-600 mt-1">${completedCount}</div>
          <div class="text-[11px] text-emerald-600 mt-0.5">${total3rdYear ? Math.round((completedCount / total3rdYear) * 100) : 0}% Registered</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
          <div class="text-xs font-medium text-amber-700">Pending / Incomplete</div>
          <div class="text-xl font-bold text-amber-600 mt-1">${partialCount + notStartedCount}</div>
          <div class="text-[11px] text-amber-600 mt-0.5">${partialCount} partial, ${notStartedCount} unstarted</div>
        </div>
      </div>

      <!-- Sub-Tabs Navigation Pills -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-1.5 flex items-center gap-1 overflow-x-auto">
        <button onclick="switchOESubTab('config')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${CURRENT_OE_SUBTAB === 'config' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
          <i class="fa-solid fa-sitemap"></i>
          <span>Electives &amp; Subject Mapping</span>
          <span class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${CURRENT_OE_SUBTAB === 'config' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}">${totalSubjects}</span>
        </button>
        <button onclick="switchOESubTab('reports')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${CURRENT_OE_SUBTAB === 'reports' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
          <i class="fa-solid fa-file-invoice"></i>
          <span>Registration Reports</span>
          <span class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${CURRENT_OE_SUBTAB === 'reports' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}">${totalRegs}</span>
        </button>
        <button onclick="switchOESubTab('incomplete')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${CURRENT_OE_SUBTAB === 'incomplete' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
          <i class="fa-solid fa-user-clock text-amber-500"></i>
          <span>Incomplete Students</span>
          <span class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${CURRENT_OE_SUBTAB === 'incomplete' ? 'bg-indigo-700 text-white' : 'bg-amber-100 text-amber-800'}">${partialCount + notStartedCount}</span>
        </button>
        <button onclick="switchOESubTab('demand')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${CURRENT_OE_SUBTAB === 'demand' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
          <i class="fa-solid fa-chart-column"></i>
          <span>Capacity &amp; Demand Analysis</span>
        </button>
      </div>

      <!-- Tab Content Mount -->
      <div id="oe-subtab-container">
        ${renderOECurrentSubView()}
      </div>
    </div>
  `;
}

function renderAdminOpenElectives() {
  ADMIN_DATA.mappingMode = 'oe';
  renderMappingsList();
}

function renderOECurrentSubView() {
  switch (CURRENT_OE_SUBTAB) {
    case 'config': return renderOEConfigView();
    case 'reports': return renderOEReportsView();
    case 'incomplete': return renderOEIncompleteView();
    case 'demand': return renderOEDemandView();
    default: return renderOEConfigView();
  }
}

// -------------------------------------------------------------------------
// Sub-view 1: Electives & Subject Mapping
// -------------------------------------------------------------------------
function renderOEConfigView() {
  const electives = ADMIN_DATA.openElectives || [];
  if (electives.length === 0) {
    return `
      <div class="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
        <i class="fa-solid fa-shapes text-4xl text-slate-300 mb-3"></i>
        <h4 class="text-sm font-bold text-slate-800">No Open Electives Configured</h4>
        <p class="text-xs text-slate-500 mt-1">Initialize Open Elective I & II to start offering courses to 3rd year students.</p>
        <button onclick="openAddOEElectiveModal()" class="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm">
          + Create Open Elective
        </button>
      </div>
    `;
  }

  let html = '<div class="space-y-6">';

  electives.forEach((el, elIdx) => {
    const subjects = el.subjects || [];
    let elTotalAllocated = 0;
    let elTotalCap = 0;
    subjects.forEach(s => {
      (s.faculty_assignments || []).forEach(fa => {
        elTotalAllocated += (fa.allocated_count || 0);
        elTotalCap += (fa.max_capacity || 0);
      });
    });

    html += `
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <!-- Elective Group Header -->
        <div class="p-5 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              OE${elIdx + 1}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-base font-bold text-slate-900">${el.name}</h4>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${el.is_active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-600'}">
                  ${el.is_active ? 'ACTIVE & OPEN' : 'INACTIVE'}
                </span>
                <span class="text-xs text-slate-400">&bull;</span>
                <span class="text-xs text-slate-600 font-medium">Branch: ${el.branch || 'CSE'} | Academic Year: ${el.academic_year === 3 ? '3rd Year (III-II)' : 'Year ' + el.academic_year}</span>
              </div>
              <div class="text-xs text-slate-500 mt-0.5">
                ${subjects.length} Subjects Offered &bull; ${elTotalAllocated} / ${elTotalCap} Seats Allocated
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="toggleOEElectiveStatus(${el.id}, ${el.is_active})" class="px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${el.is_active ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100' : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}">
              <i class="fa-solid ${el.is_active ? 'fa-pause' : 'fa-play'} mr-1"></i>
              ${el.is_active ? 'Pause Elective' : 'Activate Elective'}
            </button>
            <button onclick="openAddOESubjectModal(${el.id})" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all">
              <i class="fa-solid fa-plus"></i>
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        <!-- Subjects Under this Elective -->
        <div class="p-5 space-y-4">
    `;

    if (subjects.length === 0) {
      html += `
        <div class="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <p class="text-xs text-slate-400">No subjects currently mapped under ${el.name}.</p>
          <button onclick="openAddOESubjectModal(${el.id})" class="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-bold">
            + Add First Subject
          </button>
        </div>
      `;
    } else {
      subjects.forEach(sub => {
        const assignments = sub.faculty_assignments || [];
        let subAllocated = 0;
        let subCap = 0;
        assignments.forEach(fa => {
          subAllocated += (fa.allocated_count || 0);
          subCap += (fa.max_capacity || 0);
        });

        html += `
          <div class="border border-slate-200 rounded-xl p-4 bg-white hover:border-indigo-200 transition-all shadow-xs">
            <!-- Subject Row Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 mono-font text-[11px] font-semibold">
                    ${sub.subject_code || 'OE-SUB'}
                  </span>
                  <h5 class="font-bold text-sm text-slate-900">${sub.subject_name}</h5>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${sub.is_active ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}">
                    ${sub.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                ${sub.description ? `<p class="text-xs text-slate-500 mt-1">${sub.description}</p>` : ''}
              </div>

              <!-- Subject Actions -->
              <div class="flex items-center gap-1.5 self-end sm:self-auto">
                <span class="text-xs font-semibold text-slate-600 mr-2">
                  Total Allocated: <strong class="text-slate-900">${subAllocated}</strong> / ${subCap}
                </span>
                <button onclick="openAssignOEFacultyModal(${sub.id}, '${encodeURIComponent(sub.subject_name)}')" class="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all" title="Assign Faculty">
                  <i class="fa-solid fa-user-plus text-[11px]"></i>
                  <span>Assign Faculty</span>
                </button>
                <button onclick="openEditOESubjectModal(${sub.id})" class="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all" title="Edit Subject">
                  <i class="fa-solid fa-pen text-xs"></i>
                </button>
                <button onclick="deleteOESubject(${sub.id}, '${encodeURIComponent(sub.subject_name)}')" class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all" title="Delete Subject">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>

            <!-- Assigned Faculties List -->
            <div class="mt-3">
              <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Assigned Faculties & Capacities:</div>
        `;

        if (assignments.length === 0) {
          html += `
            <div class="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center justify-between">
              <span><i class="fa-solid fa-circle-exclamation mr-1"></i> No faculty assigned to this subject yet. Students will not be able to choose this subject until at least one faculty is assigned.</span>
              <button onclick="openAssignOEFacultyModal(${sub.id}, '${encodeURIComponent(sub.subject_name)}')" class="text-xs font-bold text-amber-800 underline ml-2">Assign Now</button>
            </div>
          `;
        } else {
          html += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">';
          assignments.forEach(fa => {
            const occ = fa.occupancy_rate || 0;
            const isFull = fa.color === 'red' || fa.available_seats === 0;
            const isYellow = fa.color === 'yellow';

            let indicatorBg = 'bg-emerald-500';
            let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            if (isFull) {
              indicatorBg = 'bg-rose-500';
              badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
            } else if (isYellow) {
              indicatorBg = 'bg-amber-500';
              badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
            }

            html += `
              <div class="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2.5">
                <div>
                  <div class="flex items-start justify-between gap-1">
                    <div class="font-bold text-xs text-slate-900">${fa.faculty_name}</div>
                    <div class="flex items-center gap-1">
                      <button onclick="openEditOECapacityModal(${fa.assignment_id}, ${fa.max_capacity}, ${fa.allocated_count})" class="p-1 text-slate-400 hover:text-blue-600 rounded" title="Edit Capacity">
                        <i class="fa-solid fa-pen-to-square text-[11px]"></i>
                      </button>
                      <button onclick="deleteOEAssignment(${fa.assignment_id}, '${encodeURIComponent(fa.faculty_name)}')" class="p-1 text-slate-400 hover:text-rose-600 rounded" title="Remove Assignment">
                        <i class="fa-solid fa-trash-can text-[11px]"></i>
                      </button>
                    </div>
                  </div>
                  <div class="text-[11px] text-slate-500">${fa.department || 'CSE'} &bull; ${fa.faculty_code || 'FAC'}</div>
                </div>

                <div>
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}">
                      <span class="w-2 h-2 rounded-full ${indicatorBg}"></span>
                      ${fa.status_label || (isFull ? 'Full' : (isYellow ? 'Filling Fast' : 'Available'))}
                    </span>
                    <span class="font-bold text-slate-700 text-xs">
                      ${fa.allocated_count} / ${fa.max_capacity} <span class="text-[10px] text-slate-400 font-normal">(${fa.available_seats} left)</span>
                    </span>
                  </div>

                  <!-- Mini progress bar -->
                  <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div class="h-full ${indicatorBg} transition-all duration-300" style="width: ${Math.min(100, occ)}%"></div>
                  </div>
                </div>
              </div>
            `;
          });
          html += '</div>';
        }

        html += `
            </div>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;
  });

  html += '</div>';
  return html;
}

// -------------------------------------------------------------------------
// Sub-view 2: Registration Reports
// -------------------------------------------------------------------------
function renderOEReportsView() {
  const rep = ADMIN_DATA.oeReports || {};
  const registrations = rep.registrations || [];
  const electives = ADMIN_DATA.openElectives || [];

  return `
    <div class="space-y-4">
      <!-- Filter & Search Toolbar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex items-center gap-2 flex-1 flex-wrap">
          <div class="relative flex-1 min-w-[200px]">
            <i class="fa-solid fa-search absolute left-3 top-2.5 text-slate-400 text-xs"></i>
            <input type="text" id="oe-report-search" oninput="filterOEReports()" placeholder="Search student name or registration number..." value="${CURRENT_OE_REPORT_FILTERS.search}" class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          </div>
          <select id="oe-report-filter-elective" onchange="filterOEReports()" class="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
            <option value="ALL">All Electives</option>
            ${electives.map(e => `<option value="${e.name}" ${CURRENT_OE_REPORT_FILTERS.electiveId === e.name ? 'selected' : ''}>${e.name}</option>`).join('')}
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="exportOEReportsToCSV()" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all">
            <i class="fa-solid fa-file-excel"></i>
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      <!-- Registrations Data Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div class="text-xs font-bold text-slate-700">
            Total Confirmed Selections: <span id="oe-report-count" class="text-indigo-600 font-extrabold">${registrations.length}</span>
          </div>
          <div class="text-[11px] text-slate-400">Strict Server-side First-Come First-Served Records</div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3 px-4">Reg No</th>
                <th class="py-3 px-4">Student Name</th>
                <th class="py-3 px-4">Group</th>
                <th class="py-3 px-4">Elective</th>
                <th class="py-3 px-4">Subject</th>
                <th class="py-3 px-4">Allocated Faculty</th>
                <th class="py-3 px-4">Selection Date & Time</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="oe-report-tbody" class="divide-y divide-slate-100">
              ${renderOEReportRows(registrations)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderOEReportRows(registrations) {
  if (registrations.length === 0) {
    return `
      <tr>
        <td colspan="9" class="p-8 text-center text-slate-400">
          <i class="fa-solid fa-inbox text-3xl mb-2 text-slate-300"></i>
          <div>No open elective student registrations found.</div>
        </td>
      </tr>
    `;
  }

  return registrations.map(r => {
    const dt = r.registered_at ? new Date(r.registered_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';
    return `
      <tr class="oe-report-row hover:bg-slate-50/70 transition-colors" data-search="${(r.reg_no + ' ' + (r.student_name || '')).toUpperCase()}" data-elective="${r.elective_name || ''}">
        <td class="py-3 px-4 font-mono font-bold text-indigo-700">${r.reg_no}</td>
        <td class="py-3 px-4 font-medium text-slate-900">${r.student_name || 'N/A'}</td>
        <td class="py-3 px-4 text-slate-600">${r.student_section || 'Group 1'}</td>
        <td class="py-3 px-4"><span class="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-50 text-indigo-700">${r.elective_name}</span></td>
        <td class="py-3 px-4 font-semibold text-slate-800">${r.subject_name}</td>
        <td class="py-3 px-4 font-semibold text-blue-700">${r.faculty_name}</td>
        <td class="py-3 px-4 text-slate-500 text-[11px]">${dt}</td>
        <td class="py-3 px-4">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            ${r.status || 'CONFIRMED'}
          </span>
        </td>
        <td class="py-3 px-4 text-right">
          <button onclick="cancelOERegistration(${r.id}, '${encodeURIComponent(r.student_name || r.reg_no)}', '${encodeURIComponent(r.elective_name)}')" class="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-semibold transition-all" title="Reset this selection">
            <i class="fa-solid fa-rotate-left mr-1"></i>Cancel
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterOEReports() {
  const searchInput = document.getElementById('oe-report-search');
  const electiveSelect = document.getElementById('oe-report-filter-elective');
  const term = (searchInput ? searchInput.value : '').toUpperCase().trim();
  const elective = electiveSelect ? electiveSelect.value : 'ALL';

  CURRENT_OE_REPORT_FILTERS.search = term;
  CURRENT_OE_REPORT_FILTERS.electiveId = elective;

  const rows = document.querySelectorAll('.oe-report-row');
  let visibleCount = 0;
  rows.forEach(row => {
    const rowSearch = row.getAttribute('data-search') || '';
    const rowElective = row.getAttribute('data-elective') || '';

    const matchesSearch = !term || rowSearch.includes(term);
    const matchesElective = elective === 'ALL' || rowElective === elective;

    if (matchesSearch && matchesElective) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  const countSpan = document.getElementById('oe-report-count');
  if (countSpan) countSpan.textContent = visibleCount;
}

function exportOEReportsToCSV() {
  const rep = ADMIN_DATA.oeReports || {};
  const registrations = rep.registrations || [];
  if (registrations.length === 0) {
    showToast('No open elective registrations to export.', 'warning');
    return;
  }

  const term = CURRENT_OE_REPORT_FILTERS.search;
  const elective = CURRENT_OE_REPORT_FILTERS.electiveId;

  const filtered = registrations.filter(r => {
    const rowSearch = (r.reg_no + ' ' + (r.student_name || '')).toUpperCase();
    const matchesSearch = !term || rowSearch.includes(term);
    const matchesElective = elective === 'ALL' || r.elective_name === elective;
    return matchesSearch && matchesElective;
  });

  let csv = '﻿';
  csv += 'Reg No,Student Name,Group,Elective,Subject Code,Subject Name,Allocated Faculty,Faculty Code,Timestamp,Status\n';

  filtered.forEach(r => {
    const dt = r.registered_at ? new Date(r.registered_at).toISOString() : '';
    const row = [
      `"${r.reg_no}"`,
      `"${(r.student_name || '').replace(/"/g, '""')}"`,
      `"${r.student_section || 'Group 1'}"`,
      `"${r.elective_name}"`,
      `"${r.subject_code || ''}"`,
      `"${(r.subject_name || '').replace(/"/g, '""')}"`,
      `"${(r.faculty_name || '').replace(/"/g, '""')}"`,
      `"${r.faculty_code || ''}"`,
      `"${dt}"`,
      `"${r.status || 'CONFIRMED'}"`
    ];
    csv += row.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `open_elective_registrations_${Date.now()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`Exported ${filtered.length} open elective registrations to CSV!`, 'success');
}

// -------------------------------------------------------------------------
// Sub-view 3: Incomplete Students
// -------------------------------------------------------------------------
function renderOEIncompleteView() {
  const rep = ADMIN_DATA.oeReports || {};
  const incomplete = rep.incomplete_students || [];

  return `
    <div class="space-y-4">
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex-1">
          <div class="relative">
            <i class="fa-solid fa-search absolute left-3 top-2.5 text-slate-400 text-xs"></i>
            <input type="text" id="oe-incomplete-search" oninput="filterOEIncomplete()" placeholder="Search incomplete students by name or registration number..." value="${CURRENT_OE_INCOMPLETE_SEARCH}" class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="exportOEIncompleteToCSV()" class="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all">
            <i class="fa-solid fa-file-excel"></i>
            <span>Export Incomplete List</span>
          </button>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-amber-50/50">
          <div class="text-xs font-bold text-amber-900">
            Pending Students: <span id="oe-incomplete-count" class="font-extrabold">${incomplete.length}</span> students have not completed both Open Electives
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3 px-4">Reg No</th>
                <th class="py-3 px-4">Student Name</th>
                <th class="py-3 px-4">Cohort</th>
                <th class="py-3 px-4">Group</th>
                <th class="py-3 px-4">Completed Selections</th>
                <th class="py-3 px-4">Missing Requirements</th>
                <th class="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody id="oe-incomplete-tbody" class="divide-y divide-slate-100">
              ${renderOEIncompleteRows(incomplete)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderOEIncompleteRows(incomplete) {
  if (incomplete.length === 0) {
    return `
      <tr>
        <td colspan="7" class="p-8 text-center text-emerald-600 font-semibold">
          <i class="fa-solid fa-circle-check text-3xl mb-2 text-emerald-500"></i>
          <div>All eligible 3rd year students have completed both Open Electives!</div>
        </td>
      </tr>
    `;
  }

  return incomplete.map(s => {
    const isPartial = s.completed_count > 0;
    return `
      <tr class="oe-incomplete-row hover:bg-slate-50/70 transition-colors" data-search="${(s.reg_no + ' ' + (s.name || '')).toUpperCase()}">
        <td class="py-3 px-4 font-mono font-bold text-slate-900">${s.reg_no}</td>
        <td class="py-3 px-4 font-medium text-slate-900">${s.name || 'N/A'}</td>
        <td class="py-3 px-4 text-slate-500">3rd Year (Sem 6)</td>
        <td class="py-3 px-4 text-slate-600">${s.section || 'Group 1'}</td>
        <td class="py-3 px-4">
          <span class="font-bold text-slate-700">${s.completed_count || 0}</span> of ${s.required_count || 2}
        </td>
        <td class="py-3 px-4 text-rose-600 font-medium">
          ${isPartial ? 'Requires 1 more elective selection' : 'Requires both Open Elective I & II'}
        </td>
        <td class="py-3 px-4">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isPartial ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}">
            ${isPartial ? 'Partially Completed' : 'Not Started'}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function filterOEIncomplete() {
  const input = document.getElementById('oe-incomplete-search');
  const term = (input ? input.value : '').toUpperCase().trim();
  CURRENT_OE_INCOMPLETE_SEARCH = term;

  const rows = document.querySelectorAll('.oe-incomplete-row');
  let count = 0;
  rows.forEach(r => {
    const s = r.getAttribute('data-search') || '';
    if (!term || s.includes(term)) {
      r.style.display = '';
      count++;
    } else {
      r.style.display = 'none';
    }
  });

  const countSpan = document.getElementById('oe-incomplete-count');
  if (countSpan) countSpan.textContent = count;
}

function exportOEIncompleteToCSV() {
  const rep = ADMIN_DATA.oeReports || {};
  const incomplete = rep.incomplete_students || [];
  if (incomplete.length === 0) {
    showToast('No incomplete students to export.', 'info');
    return;
  }

  const term = CURRENT_OE_INCOMPLETE_SEARCH;
  const filtered = incomplete.filter(s => {
    const str = (s.reg_no + ' ' + (s.name || '')).toUpperCase();
    return !term || str.includes(term);
  });

  let csv = '﻿';
  csv += 'Reg No,Student Name,Academic Year,Semester,Group,Completed Selections,Required Selections,Status\n';

  filtered.forEach(s => {
    const row = [
      `"${s.reg_no}"`,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"3rd Year"`,
      `"Sem 6"`,
      `"${s.section || 'Group 1'}"`,
      `"${s.completed_count || 0}"`,
      `"${s.required_count || 2}"`,
      `"${(s.completed_count > 0 ? 'Partially Completed' : 'Not Started')}"`
    ];
    csv += row.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `incomplete_open_electives_${Date.now()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`Exported ${filtered.length} pending students to CSV!`, 'success');
}

// -------------------------------------------------------------------------
// Sub-view 4: Capacity & Demand Analysis
// -------------------------------------------------------------------------
function renderOEDemandView() {
  const rep = ADMIN_DATA.oeReports || {};
  const subjectAllocs = rep.subject_allocations || [];
  const facultyAllocs = rep.faculty_allocations || [];

  return `
    <div class="space-y-6">
      <!-- Subject-wise Demand Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-200 bg-slate-50">
          <h4 class="font-bold text-sm text-slate-800">Subject-wise Student Demand</h4>
          <p class="text-xs text-slate-500">Total number of students who have enrolled in each subject</p>
        </div>
        <div class="p-5">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${subjectAllocs.map(sa => `
              <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-100 text-indigo-700">${sa.elective_name}</span>
                  <span class="mono-font text-[11px] text-slate-500">${sa.subject_code || ''}</span>
                </div>
                <div class="font-bold text-sm text-slate-900 mt-1">${sa.subject_name}</div>
                <div class="mt-3 flex items-baseline justify-between">
                  <span class="text-xs text-slate-500">Allocated Students:</span>
                  <span class="text-base font-extrabold text-indigo-600">${sa.allocated_count}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Faculty-wise Capacity & Fill Rate Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h4 class="font-bold text-sm text-slate-800">Faculty-wise Capacity & Allocation Fill Rate</h4>
            <p class="text-xs text-slate-500">Occupancy status per assigned faculty member</p>
          </div>
          <!-- Admin Legend -->
          <div class="flex items-center gap-3 text-xs">
            <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available (&le;40%)</span>
            <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Filling Fast (&gt;40%)</span>
            <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Full (100%)</span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3 px-4">Elective</th>
                <th class="py-3 px-4">Subject</th>
                <th class="py-3 px-4">Faculty Member</th>
                <th class="py-3 px-4">Capacity</th>
                <th class="py-3 px-4">Occupied Seats</th>
                <th class="py-3 px-4">Remaining Seats</th>
                <th class="py-3 px-4">Occupancy Fill Rate</th>
                <th class="py-3 px-4">Live Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${facultyAllocs.map(fa => {
    const max = fa.max_capacity || 70;
    const occ = fa.allocated_count || 0;
    const pct = max > 0 ? Math.round((occ / max) * 100) : 0;
    let colorClass = 'bg-emerald-500';
    let statusLabel = 'Available';
    if (pct >= 100) {
      colorClass = 'bg-rose-500';
      statusLabel = 'Full';
    } else if (pct > 40) {
      colorClass = 'bg-amber-500';
      statusLabel = 'Filling Fast';
    }

    return `
                  <tr class="hover:bg-slate-50/70 transition-colors">
                    <td class="py-3 px-4 font-semibold text-indigo-700">${fa.elective_name}</td>
                    <td class="py-3 px-4 font-medium text-slate-800">${fa.subject_name}</td>
                    <td class="py-3 px-4 font-bold text-slate-900">${fa.faculty_name}</td>
                    <td class="py-3 px-4 font-semibold text-slate-700">${max}</td>
                    <td class="py-3 px-4 font-bold text-blue-600">${occ}</td>
                    <td class="py-3 px-4 font-bold ${fa.available_seats === 0 ? 'text-rose-600' : 'text-slate-700'}">${fa.available_seats}</td>
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-2">
                        <div class="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div class="h-full ${colorClass}" style="width: ${Math.min(100, pct)}%"></div>
                        </div>
                        <span class="font-bold text-slate-700">${pct}%</span>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${pct >= 100 ? 'bg-rose-100 text-rose-800' : (pct > 40 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')}">
                        <span class="w-2 h-2 rounded-full ${colorClass}"></span>
                        ${statusLabel}
                      </span>
                    </td>
                  </tr>
                `;
  }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------------------
// Action Modals & Handlers
// -------------------------------------------------------------------------

async function toggleOEElectiveStatus(electiveId, currentStatus) {
  try {
    const res = await api.put(`/api/open-electives/electives/${electiveId}`, {
      is_active: currentStatus ? 0 : 1
    });
    showToast(res.message || 'Elective status updated', 'success');
    await loadAdminOpenElectives('config');
  } catch (err) {
    showToast(err.message || 'Failed to update elective status', 'error');
  }
}

function openAddOEElectiveModal() {
  openModal({
    title: 'Create Open Elective',
    body: `
      <form id="form-add-oe-elective" onsubmit="submitAddOEElective(event)" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Elective Name <span class="text-rose-500">*</span></label>
          <input type="text" id="oe-el-name" required placeholder="e.g. Open Elective – I" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Academic Year</label>
            <input type="number" id="oe-el-year" value="3" readonly class="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Branch</label>
            <input type="text" id="oe-el-branch" value="CSE" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl uppercase">
          </div>
        </div>
        <div>
          <label class="flex items-center gap-2 cursor-pointer mt-2">
            <input type="checkbox" id="oe-el-active" checked class="w-4 h-4 rounded text-indigo-600">
            <span class="font-semibold text-slate-700">Set as Active immediately</span>
          </label>
        </div>
        <div class="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
          <button type="submit" id="btn-submit-add-elective" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm">Create Elective</button>
        </div>
      </form>
    `
  });
}

async function submitAddOEElective(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-add-elective');
  if (btn) btn.disabled = true;

  try {
    const name = document.getElementById('oe-el-name').value.trim();
    const branch = document.getElementById('oe-el-branch').value.trim();
    const is_active = document.getElementById('oe-el-active').checked ? 1 : 0;

    const res = await api.post('/api/open-electives/electives', {
      name,
      academic_year: 3,
      branch,
      is_active
    });

    closeModal();
    showToast(res.message || 'Elective created successfully', 'success');
    await loadAdminOpenElectives('config');
  } catch (err) {
    showToast(err.message || 'Failed to create elective', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function openAddOESubjectModal(preferredElectiveId = null) {
  const electives = ADMIN_DATA.openElectives || [];
  if (electives.length === 0) {
    showToast('Please create an elective first.', 'warning');
    return;
  }

  openModal({
    title: 'Add Subject to Open Elective',
    body: `
      <form id="form-add-oe-subject" onsubmit="submitAddOESubject(event)" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Target Elective <span class="text-rose-500">*</span></label>
          <select id="oe-sub-elective" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
            ${electives.map(e => `<option value="${e.id}" ${preferredElectiveId && preferredElectiveId === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Subject Name <span class="text-rose-500">*</span></label>
          <input type="text" id="oe-sub-name" required placeholder="e.g. DevOps / Cloud Computing" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Subject Code</label>
          <input type="text" id="oe-sub-code" placeholder="e.g. 20A05601" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl uppercase mono-font">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Description / Syllabus Overview</label>
          <textarea id="oe-sub-desc" rows="2" placeholder="Brief outline of the course..." class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"></textarea>
        </div>
        <div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="oe-sub-active" checked class="w-4 h-4 rounded text-indigo-600">
            <span class="font-semibold text-slate-700">Active (Visible to Students)</span>
          </label>
        </div>
        <div class="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
          <button type="submit" id="btn-submit-add-subject" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm">Save Subject</button>
        </div>
      </form>
    `
  });
}

async function submitAddOESubject(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-add-subject');
  if (btn) btn.disabled = true;

  try {
    const elective_id = parseInt(document.getElementById('oe-sub-elective').value, 10);
    const subject_name = document.getElementById('oe-sub-name').value.trim();
    const subject_code = document.getElementById('oe-sub-code').value.trim();
    const description = document.getElementById('oe-sub-desc').value.trim();
    const is_active = document.getElementById('oe-sub-active').checked ? 1 : 0;

    const res = await api.post('/api/open-electives/subjects', {
      elective_id,
      subject_name,
      subject_code,
      description,
      is_active
    });

    closeModal();
    showToast(res.message || 'Subject added successfully', 'success');
    await loadAdminOpenElectives('config');
  } catch (err) {
    showToast(err.message || 'Failed to add subject', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function openEditOESubjectModal(subjectId) {
  let foundSub = null;
  (ADMIN_DATA.openElectives || []).forEach(e => {
    (e.subjects || []).forEach(s => {
      if (s.id === subjectId) foundSub = s;
    });
  });

  if (!foundSub) {
    showToast('Subject not found', 'error');
    return;
  }

  openModal({
    title: 'Edit Open Elective Subject',
    body: `
      <form id="form-edit-oe-subject" onsubmit="submitEditOESubject(event, ${subjectId})" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Subject Name <span class="text-rose-500">*</span></label>
          <input type="text" id="oe-edit-sub-name" required value="${(foundSub.subject_name || '').replace(/"/g, '&quot;')}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Subject Code</label>
          <input type="text" id="oe-edit-sub-code" value="${foundSub.subject_code || ''}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl uppercase mono-font">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Description</label>
          <textarea id="oe-edit-sub-desc" rows="2" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">${foundSub.description || ''}</textarea>
        </div>
        <div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="oe-edit-sub-active" ${foundSub.is_active ? 'checked' : ''} class="w-4 h-4 rounded text-indigo-600">
            <span class="font-semibold text-slate-700">Active</span>
          </label>
        </div>
        <div class="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
          <button type="submit" id="btn-submit-edit-subject" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm">Save Changes</button>
        </div>
      </form>
    `
  });
}

async function submitEditOESubject(e, subjectId) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-edit-subject');
  if (btn) btn.disabled = true;

  try {
    const subject_name = document.getElementById('oe-edit-sub-name').value.trim();
    const subject_code = document.getElementById('oe-edit-sub-code').value.trim();
    const description = document.getElementById('oe-edit-sub-desc').value.trim();
    const is_active = document.getElementById('oe-edit-sub-active').checked ? 1 : 0;

    const res = await api.put(`/api/open-electives/subjects/${subjectId}`, {
      subject_name,
      subject_code,
      description,
      is_active
    });

    closeModal();
    showToast(res.message || 'Subject updated successfully', 'success');
    await loadAdminOpenElectives('config');
  } catch (err) {
    showToast(err.message || 'Failed to update subject', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function deleteOESubject(subjectId, encodedName) {
  const name = decodeURIComponent(encodedName);
  if (!confirm(`Are you sure you want to delete the subject "${name}"?\n\nNote: Deletion will be blocked if students have already registered for this subject to protect student records.`)) {
    return;
  }

  try {
    const res = await api.delete(`/api/open-electives/subjects/${subjectId}`);
    showToast(res.message || 'Subject deleted successfully', 'success');
    await loadAdminOpenElectives('config');
  } catch (err) {
    showToast(err.message || 'Cannot delete subject', 'error');
  }
}

function openAssignOEFacultyModal(preferredSubjectId = null, encodedSubjectName = '') {
  const electives = ADMIN_DATA.openElectives || [];
  const allFaculty = (ADMIN_DATA.faculty || []).slice();
  allFaculty.sort((a, b) => {
    const na = parseInt((a.faculty_code || '').replace(/\D/g, ''), 10) || 999999;
    const nb = parseInt((b.faculty_code || '').replace(/\D/g, ''), 10) || 999999;
    return na - nb;
  });

  if (allFaculty.length === 0) {
    showToast('No faculty members found in database.', 'warning');
    return;
  }

  // Collect all subjects across electives
  const allSubjects = [];
  electives.forEach(e => {
    (e.subjects || []).forEach(s => {
      allSubjects.push({ id: s.id, name: `[${e.name}] ${s.subject_name}` });
    });
  });

  if (allSubjects.length === 0) {
    showToast('Please add at least one subject first.', 'warning');
    return;
  }

  openModal({
    title: 'Assign Faculty to Open Elective Subject',
    body: `
      <form id="form-assign-oe-faculty" onsubmit="submitAssignOEFaculty(event)" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Target Subject <span class="text-rose-500">*</span></label>
          <select id="oe-assign-subject" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
            ${allSubjects.map(s => `<option value="${s.id}" ${preferredSubjectId && preferredSubjectId === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Select Faculty Member <span class="text-rose-500">*</span></label>
          <select id="oe-assign-faculty" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
            <option value="">-- Choose Faculty --</option>
            ${allFaculty.map(f => `<option value="${f.id}">${f.name} (${f.faculty_code || 'FAC'} - ${f.department || 'CSE'})</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Maximum Student Capacity <span class="text-rose-500">*</span></label>
          <input type="number" id="oe-assign-capacity" min="1" max="500" value="70" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold">
          <p class="text-[11px] text-slate-500 mt-1">Default is 70 students per faculty. The system strictly blocks allocation once this capacity is reached.</p>
        </div>
        <div class="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
          <button type="submit" id="btn-submit-assign-faculty" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm">Assign Faculty</button>
        </div>
      </form>
    `
  });
}

async function submitAssignOEFaculty(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-assign-faculty');
  if (btn) btn.disabled = true;

  try {
    const subject_id = parseInt(document.getElementById('oe-assign-subject').value, 10);
    const faculty_id = parseInt(document.getElementById('oe-assign-faculty').value, 10);
    const max_capacity = parseInt(document.getElementById('oe-assign-capacity').value, 10);

    if (!faculty_id) {
      showToast('Please select a faculty member.', 'warning');
      return;
    }

    const res = await api.post('/api/open-electives/assignments', {
      subject_id,
      faculty_id,
      max_capacity
    });

    closeModal();
    showToast(res.message || 'Faculty assigned successfully', 'success');
    await loadAdminOpenElectives('config');
  } catch (err) {
    showToast(err.message || 'Failed to assign faculty', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function openEditOECapacityModal(assignmentId, currentCapacity, allocatedCount) {
  openModal({
    title: 'Update Faculty Capacity',
    body: `
      <form id="form-edit-oe-cap" onsubmit="submitEditOECapacity(event, ${assignmentId})" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Configured Maximum Capacity <span class="text-rose-500">*</span></label>
          <input type="number" id="oe-edit-capacity-input" min="${allocatedCount || 1}" max="500" value="${currentCapacity}" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm">
        </div>
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div class="text-[11px] text-slate-500">Currently Allocated Students: <strong class="text-slate-900">${allocatedCount}</strong></div>
          <p class="text-[11px] text-slate-500 mt-0.5">Capacity cannot be set lower than currently confirmed allocations (${allocatedCount}).</p>
        </div>
        <div class="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
          <button type="submit" id="btn-submit-edit-cap" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm">Save Capacity</button>
        </div>
      </form>
    `
  });
}

async function submitEditOECapacity(e, assignmentId) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-edit-cap');
  if (btn) btn.disabled = true;

  try {
    const max_capacity = parseInt(document.getElementById('oe-edit-capacity-input').value, 10);
    const res = await api.put(`/api/open-electives/assignments/${assignmentId}`, {
      max_capacity
    });

    closeModal();
    showToast(res.message || 'Capacity updated successfully', 'success');
    await loadAdminOpenElectives('config');
  } catch (err) {
    showToast(err.message || 'Failed to update capacity', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function deleteOEAssignment(assignmentId, encodedName) {
  const name = decodeURIComponent(encodedName);
  if (!confirm(`Remove faculty assignment for "${name}"?\n\nIf students have already enrolled with this faculty, removal will be prevented to avoid data loss.`)) {
    return;
  }

  try {
    const res = await api.delete(`/api/open-electives/assignments/${assignmentId}`);
    showToast(res.message || 'Faculty assignment removed', 'success');
    await loadAdminOpenElectives('config');
  } catch (err) {
    showToast(err.message || 'Cannot remove assignment', 'error');
  }
}

async function cancelOERegistration(registrationId, encodedStudent, encodedElective) {
  const student = decodeURIComponent(encodedStudent);
  const elective = decodeURIComponent(encodedElective);

  if (!confirm(`Reset elective selection for ${student} in ${elective}?\n\nThis will release 1 seat back to the faculty capacity and allow the student to select again.`)) {
    return;
  }

  try {
    const res = await api.post(`/api/open-electives/registrations/${registrationId}/cancel`);
    showToast(res.message || 'Registration cancelled successfully', 'success');
    await loadAdminOpenElectives('reports');
  } catch (err) {
    showToast(err.message || 'Failed to cancel registration', 'error');
  }
}

// Explicit global exposure to guarantee zero undefined errors
window.loadAdminOpenElectives = loadAdminOpenElectives;
window.switchOESubTab = switchOESubTab;
window.renderAdminOpenElectives = renderAdminOpenElectives;
window.toggleOEElectiveStatus = toggleOEElectiveStatus;
window.openAddOEElectiveModal = openAddOEElectiveModal;
window.submitAddOEElective = submitAddOEElective;
window.openAddOESubjectModal = openAddOESubjectModal;
window.submitAddOESubject = submitAddOESubject;
window.openEditOESubjectModal = openEditOESubjectModal;
window.submitEditOESubject = submitEditOESubject;
window.deleteOESubject = deleteOESubject;
window.openAssignOEFacultyModal = openAssignOEFacultyModal;
window.submitAssignOEFaculty = submitAssignOEFaculty;
window.openEditOECapacityModal = openEditOECapacityModal;
window.submitEditOECapacity = submitEditOECapacity;
window.deleteOEAssignment = deleteOEAssignment;
window.cancelOERegistration = cancelOERegistration;
window.filterOEReports = filterOEReports;
window.exportOEReportsToCSV = exportOEReportsToCSV;
window.filterOEIncomplete = filterOEIncomplete;
window.exportOEIncompleteToCSV = exportOEIncompleteToCSV;

// =========================================================================
// 11. AUTOMATIC EMAIL NOTIFICATIONS & DELIVERY MANAGEMENT
// =========================================================================
async function loadAdminEmails(filter = null) {
  if (filter) ADMIN_DATA.emailFilter = filter;
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  container.innerHTML = `
    <div class="py-20 text-center">
      <div class="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-3"></div>
      <p class="text-xs font-semibold text-slate-500">Loading Confirmation Email Logs & Delivery Status...</p>
    </div>
  `;

  try {
    const curFilter = ADMIN_DATA.emailFilter || 'ALL';
    const curSearch = ADMIN_DATA.emailSearch || '';
    const [res, configRes] = await Promise.all([
      api.get(`/api/emails/logs?status=${curFilter}&search=${encodeURIComponent(curSearch)}`),
      api.get('/api/emails/config')
    ]);

    if (!res || !res.success) throw new Error('Could not fetch email delivery records.');

    ADMIN_DATA.emailLogs = res.logs || [];
    ADMIN_DATA.emailStats = res.stats || { total: 0, sent: 0, failed: 0, pending: 0 };
    ADMIN_DATA.smtpConfig = configRes && configRes.config ? configRes.config : { isConfigured: false };
    renderAdminEmailsList();
  } catch (err) {
    container.innerHTML = `
      <div class="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-800 space-y-3">
        <i class="fa-solid fa-triangle-exclamation text-3xl text-rose-500"></i>
        <h4 class="font-bold text-sm">Failed to Load Email Delivery Records</h4>
        <p class="text-xs text-rose-600 max-w-md mx-auto">${err.message}</p>
        <button onclick="loadAdminEmails()" class="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition">
          Retry Loading
        </button>
      </div>
    `;
  }
}

function renderAdminEmailsList() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  const logs = ADMIN_DATA.emailLogs || [];
  const stats = ADMIN_DATA.emailStats || { total: 0, sent: 0, failed: 0, pending: 0 };
  const filter = ADMIN_DATA.emailFilter || 'ALL';
  const searchTerm = ADMIN_DATA.emailSearch || '';
  const smtp = ADMIN_DATA.smtpConfig || { isConfigured: false };

  const html = `
    <div class="space-y-6">
      <!-- Section Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-blue-600"></span>
            <h3 class="text-lg font-bold text-slate-900">Faculty Selection Confirmation Emails</h3>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            Real-time audit trail and delivery tracking for automatic confirmation emails sent to students upon finalizing course and faculty choices.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button onclick="openSmtpSettingsModal()" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer">
            <i class="fa-solid fa-gear"></i>
            <span>SMTP Settings</span>
          </button>
          <button onclick="openSendTestEmailModal()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer">
            <i class="fa-solid fa-paper-plane"></i>
            <span>Send Test Email</span>
          </button>
          ${stats.failed > 0 ? `
            <button onclick="retryAllFailedEmails()" id="btn-retry-all-emails" class="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition">
              <i class="fa-solid fa-rotate-right"></i>
              <span>Retry All Failed (${stats.failed})</span>
            </button>
          ` : ''}
          <button onclick="loadAdminEmails()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition">
            <i class="fa-solid fa-arrows-rotate"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Live SMTP Status Strip -->
      ${smtp.isConfigured ? `
        <div class="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-200 text-emerald-800 flex items-center justify-center text-lg flex-shrink-0">
              <i class="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <div class="font-bold text-emerald-950 flex items-center gap-2">
                <span>Live SMTP Connected &amp; Active</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-200/80 text-emerald-900">${smtp.host}:${smtp.port} (${smtp.user})</span>
              </div>
              <p class="text-emerald-800 mt-0.5 text-[11px]">
                Confirmation emails are actively delivered to each student's official college inbox (<strong>&lt;reg_no&gt;@rgmcet.edu.in</strong>) when course selection is completed.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="openSendTestEmailModal()" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition whitespace-nowrap cursor-pointer">
              Test Connection
            </button>
          </div>
        </div>
      ` : `
        <div class="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center text-lg flex-shrink-0">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
              <div class="font-bold text-amber-950">
                Action Required: SMTP Server Not Configured Yet (Currently in Safe Simulation Mode)
              </div>
              <p class="text-amber-800 mt-0.5 text-[11px]">
                The server is logging confirmation records in the database, but <strong>real emails cannot be delivered across the internet without your SMTP credentials</strong>. Connect your Gmail (with App Password) or college mail server below to start delivering live emails!
              </p>
            </div>
          </div>
          <button onclick="openSmtpSettingsModal()" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md transition whitespace-nowrap cursor-pointer flex items-center gap-1.5">
            <i class="fa-solid fa-key"></i>
            <span>Connect SMTP Mail Server</span>
          </button>
        </div>
      `}

      <!-- 4 Stat Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Triggered</span>
            <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-envelope"></i>
            </div>
          </div>
          <div class="text-2xl font-black text-slate-900 mt-2">${stats.total}</div>
          <div class="text-[11px] text-slate-400 mt-1">Automated student notifications</div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-emerald-700 uppercase tracking-wider">Delivered / Sent</span>
            <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-circle-check"></i>
            </div>
          </div>
          <div class="text-2xl font-black text-emerald-700 mt-2">${stats.sent}</div>
          <div class="text-[11px] text-emerald-600 mt-1">Confirmed student inboxes</div>
        </div>

        <div class="bg-white p-5 rounded-2xl border ${stats.failed > 0 ? 'border-rose-300 ring-2 ring-rose-400/20' : 'border-slate-200'} shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-rose-700 uppercase tracking-wider">Failed Deliveries</span>
            <div class="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>
          <div class="text-2xl font-black text-rose-700 mt-2">${stats.failed}</div>
          <div class="text-[11px] text-rose-500 mt-1">Requires retry or verification</div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Delivery</span>
            <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-clock"></i>
            </div>
          </div>
          <div class="text-2xl font-black text-amber-700 mt-2">${stats.pending}</div>
          <div class="text-[11px] text-amber-600 mt-1">In dispatch queue</div>
        </div>
      </div>

      <!-- Controls & Filter Strip -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Status Filter Tabs -->
        <div class="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button onclick="loadAdminEmails('ALL')" class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'ALL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
            All (${stats.total})
          </button>
          <button onclick="loadAdminEmails('SENT')" class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'SENT' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
            Sent (${stats.sent})
          </button>
          <button onclick="loadAdminEmails('FAILED')" class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'FAILED' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
            Failed (${stats.failed})
          </button>
          <button onclick="loadAdminEmails('PENDING')" class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'PENDING' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
            Pending (${stats.pending})
          </button>
        </div>

        <!-- Search Bar -->
        <div class="relative w-full md:w-80">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input 
            type="text" 
            id="input-email-search" 
            placeholder="Search student, roll no, or email..." 
            value="${escapeQuote(searchTerm)}"
            oninput="handleEmailSearchInput(event)"
            class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
        </div>
      </div>

      <!-- Email Logs Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3.5 px-6">Student Information</th>
                <th class="py-3.5 px-6">Recipient Email</th>
                <th class="py-3.5 px-6">Notification Type</th>
                <th class="py-3.5 px-6 text-center">Status</th>
                <th class="py-3.5 px-6">Dispatch Timestamp</th>
                <th class="py-3.5 px-6 text-center">Attempts</th>
                <th class="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${logs.length === 0 ? `
                <tr>
                  <td colspan="7" class="py-12 text-center text-slate-400">
                    <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-xl mb-2">
                      <i class="fa-solid fa-inbox"></i>
                    </div>
                    <div class="font-bold text-slate-700 text-sm">No email notification records found</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">Confirmation emails are logged automatically when students confirm their faculty choices.</div>
                  </td>
                </tr>
              ` : logs.map(l => {
    const isSent = l.status === 'SENT';
    const isFailed = l.status === 'FAILED';
    const isPending = l.status === 'PENDING';

    return `
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3.5 px-6">
                      <div class="font-bold text-slate-900">${l.student_name}</div>
                      <div class="flex items-center gap-1.5 mt-0.5">
                        <span class="mono-font text-[11px] font-semibold text-blue-600">${l.student_reg_no}</span>
                        <span class="text-slate-300">&bull;</span>
                        <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">Year ${l.student_academic_year}</span>
                      </div>
                    </td>

                    <td class="py-3.5 px-6">
                      <div class="font-semibold text-slate-800">${l.recipient_email}</div>
                      <div class="text-[10px] text-slate-400">Institutional Mail</div>
                    </td>

                    <td class="py-3.5 px-6">
                      <div class="font-bold text-slate-700 text-xs">Faculty Selection Confirmation</div>
                      <div class="text-[10px] text-slate-400 truncate max-w-xs">${l.subject}</div>
                    </td>

                    <td class="py-3.5 px-6 text-center">
                      ${isSent ? `
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>SENT</span>
                        </span>
                      ` : (isFailed ? `
                        <button onclick="viewEmailError('${escapeQuote(l.error_message || 'SMTP connection failed')}', '${escapeQuote(l.student_name)}', '${escapeQuote(l.recipient_email)}')" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 transition cursor-pointer" title="Click to view failure reason">
                          <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>FAILED</span>
                          <i class="fa-solid fa-circle-info text-[10px] ml-0.5"></i>
                        </button>
                      ` : `
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>PENDING</span>
                        </span>
                      `)}
                    </td>

                    <td class="py-3.5 px-6">
                      <div class="text-xs text-slate-700 font-medium">
                        ${l.sent_at ? new Date(l.sent_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : new Date(l.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div class="text-[10px] text-slate-400">
                        ${l.sent_at ? new Date(l.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td class="py-3.5 px-6 text-center">
                      <span class="inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${l.attempt_count > 1 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}">
                        ${l.attempt_count}
                      </span>
                    </td>

                    <td class="py-3.5 px-6 text-right">
                      <button 
                        id="btn-resend-${l.id}" 
                        onclick="resendEmailLog(${l.id})" 
                        class="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto border border-indigo-200 cursor-pointer shadow-sm">
                        <i class="fa-solid fa-paper-plane text-[10px]"></i>
                        <span>Resend Email</span>
                      </button>
                    </td>
                  </tr>
                `;
  }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

let emailSearchTimeout = null;
function handleEmailSearchInput(e) {
  ADMIN_DATA.emailSearch = e.target.value;
  clearTimeout(emailSearchTimeout);
  emailSearchTimeout = setTimeout(() => {
    loadAdminEmails();
  }, 350);
}

async function resendEmailLog(logId) {
  const btn = document.getElementById(`btn-resend-${logId}`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-[10px]"></i> <span>Sending...</span>`;
  }

  try {
    const res = await api.post(`/api/emails/resend/${logId}`);
    showToast(res.message || 'Confirmation email resent successfully!', 'success');
    await loadAdminEmails();
  } catch (err) {
    showToast(err.message || 'Failed to resend confirmation email.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-paper-plane text-[10px]"></i> <span>Resend Email</span>`;
    }
  }
}

async function resendStudentConfirmationEmail(studentId) {
  try {
    const res = await api.post(`/api/emails/send-student/${studentId}`);
    showToast(res.message || 'Confirmation email dispatched to student!', 'success');
    if (STATE.activeAdminTab === 'emails') {
      await loadAdminEmails();
    }
  } catch (err) {
    showToast(err.message || 'Failed to dispatch confirmation email.', 'error');
  }
}

async function retryAllFailedEmails() {
  const btn = document.getElementById('btn-retry-all-emails');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Retrying All...</span>`;
  }

  try {
    const res = await api.post('/api/emails/retry-all-failed');
    showToast(res.message || 'Retry batch processed successfully!', 'success');
    await loadAdminEmails();
  } catch (err) {
    showToast(err.message || 'Failed to retry emails.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-rotate-right"></i> <span>Retry All Failed</span>`;
    }
  }
}

function viewEmailError(errMsg, studentName, email) {
  openModal({
    title: 'Email Delivery Failure Details',
    maxWidth: 'max-w-md',
    body: `
      <div class="space-y-4 py-2 text-xs">
        <div class="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
          <div class="font-bold text-rose-900 flex items-center gap-2">
            <i class="fa-solid fa-triangle-exclamation text-rose-600"></i>
            <span>Delivery Error Log</span>
          </div>
          <div class="text-rose-700 font-mono text-[11px] break-words bg-white p-3 rounded-lg border border-rose-200">
            ${escapeQuote(errMsg)}
          </div>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
          <div><strong>Candidate:</strong> ${studentName}</div>
          <div><strong>Recipient Email:</strong> ${email}</div>
          <div><strong>Recommendation:</strong> Verify that SMTP server credentials in environment settings are valid and that the recipient mailbox exists.</div>
        </div>
      </div>
    `,
    footer: `
      <button onclick="closeModal()" class="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition">
        Close
      </button>
    `
  });
}

function openSmtpSettingsModal() {
  const cfg = ADMIN_DATA.smtpConfig || {};

  openModal({
    title: 'SMTP Mail Server Configuration',
    maxWidth: 'max-w-xl',
    body: `
      <form id="form-smtp-settings" onsubmit="submitSmtpSettings(event)" class="space-y-4 py-1 text-xs">
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
          <strong>Instant Live Delivery:</strong> Enter your SMTP server details to deliver official confirmation emails directly to students' college inboxes (<code>&lt;reg_no&gt;@rgmcet.edu.in</code>).
        </div>

        <!-- Quick Presets -->
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-slate-500 font-semibold text-[11px]">Cloud Presets:</span>
          <button type="button" onclick="applySmtpPreset('brevo')" class="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] transition cursor-pointer" title="Recommended for Railway: Sends to ANY student email via Port 443 with 0 domain blocks">
            <i class="fa-solid fa-bolt"></i> Brevo API (Port 443 - All Students)
          </button>
          <button type="button" onclick="applySmtpPreset('webhook')" class="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[10px] transition cursor-pointer" title="Google Apps Script Relay: Free Gmail sender over Port 443">
            <i class="fa-brands fa-google"></i> Google Webhook (Port 443)
          </button>
          <button type="button" onclick="applySmtpPreset('resend')" class="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-[10px] transition cursor-pointer">
            Resend API (Port 443)
          </button>
          <button type="button" onclick="applySmtpPreset('gmail')" class="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-[10px] transition cursor-pointer">
            Gmail SMTP (Port 587)
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="sm:col-span-2">
            <label class="block font-bold text-slate-700 mb-1">SMTP Host / Server *</label>
            <input type="text" id="smtp-host" required placeholder="e.g. smtp.gmail.com" value="${escapeQuote(cfg.host || '')}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Port *</label>
            <input type="number" id="smtp-port" required placeholder="587" value="${cfg.port || 587}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">SMTP Username / Email *</label>
            <input type="text" id="smtp-user" required placeholder="e.g. cse.office@rgmcet.edu.in" value="${escapeQuote(cfg.user || '')}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">
              SMTP Password / App Password *
              ${cfg.hasPass ? '<span class="text-emerald-600 font-semibold text-[10px] ml-1">(Password Saved)</span>' : ''}
            </label>
            <input type="password" id="smtp-pass" ${cfg.hasPass ? '' : 'required'} placeholder="${cfg.hasPass ? '•••••••••••••••• (Leave blank to keep saved)' : 'Enter 16-character App Password'}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">From Sender Address</label>
          <input type="text" id="smtp-from" placeholder='"RGMCET Faculty Selection" &lt;no-reply@rgmcet.edu.in&gt;' value="${escapeQuote(cfg.from || '"RGMCET Faculty Selection Portal" <no-reply@rgmcet.edu.in>')}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
        </div>

        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
          <input type="checkbox" id="smtp-secure" ${cfg.secure ? 'checked' : ''} class="w-4 h-4 rounded text-blue-600">
          <label for="smtp-secure" class="text-xs text-slate-700 font-semibold cursor-pointer">
            Use SSL/TLS (Check for Port 465; leave unchecked for STARTTLS Port 587)
          </label>
        </div>

        <div class="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
          <strong>Tip for Gmail:</strong> Regular Google account passwords are not accepted by Google SMTP. You must create an <strong>App Password</strong> in your Google Account:
          <span class="block text-slate-600 mt-1">1. Open Google Account &rarr; Security &rarr; 2-Step Verification.</span>
          <span class="block text-slate-600">2. Go to "App Passwords", generate one for "FSSP", and paste the 16 characters into the password field above.</span>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold transition">
            Cancel
          </button>
          <button type="submit" id="btn-save-smtp" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/25 transition flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-floppy-disk"></i>
            <span>Save &amp; Activate SMTP</span>
          </button>
        </div>
      </form>
    `
  });
}

function applySmtpPreset(type) {
  const hostEl = document.getElementById('smtp-host');
  const portEl = document.getElementById('smtp-port');
  const secureEl = document.getElementById('smtp-secure');
  const userEl = document.getElementById('smtp-user');
  const passEl = document.getElementById('smtp-pass');

  if (type === 'brevo') {
    if (hostEl) hostEl.value = 'api.brevo.com';
    if (portEl) portEl.value = '443';
    if (secureEl) secureEl.checked = true;
    if (userEl) userEl.placeholder = 'Your Brevo verified email (e.g. rafibudathala893@gmail.com)';
    if (passEl) passEl.placeholder = 'Paste Brevo API Key (xkeysib-...)';
  } else if (type === 'webhook') {
    if (hostEl) hostEl.value = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
    if (portEl) portEl.value = '443';
    if (secureEl) secureEl.checked = true;
    if (userEl) userEl.value = 'webhook';
  } else if (type === 'resend') {
    if (hostEl) hostEl.value = 'api.resend.com';
    if (portEl) portEl.value = '443';
    if (secureEl) secureEl.checked = true;
    if (userEl) userEl.value = 'resend';
    if (passEl) passEl.placeholder = 'Paste Resend API Key (re_...)';
  } else if (type === 'gmail' || type === 'rgmcet') {
    if (hostEl) hostEl.value = 'smtp.gmail.com';
    if (portEl) portEl.value = '587';
    if (secureEl) secureEl.checked = false;
  } else if (type === 'outlook') {
    if (hostEl) hostEl.value = 'smtp.office365.com';
    if (portEl) portEl.value = '587';
    if (secureEl) secureEl.checked = false;
  }
}

async function submitSmtpSettings(e) {
  e.preventDefault();
  const host = document.getElementById('smtp-host').value.trim();
  const port = parseInt(document.getElementById('smtp-port').value, 10);
  const user = document.getElementById('smtp-user').value.trim();
  const pass = document.getElementById('smtp-pass').value.trim();
  const from = document.getElementById('smtp-from').value.trim();
  const secure = document.getElementById('smtp-secure').checked;

  const btn = document.getElementById('btn-save-smtp');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Saving...</span>`;
  }

  try {
    const res = await api.post('/api/emails/config', {
      host,
      port,
      user,
      pass,
      from,
      secure
    });

    closeModal();
    showToast(res.message || 'SMTP settings activated successfully!', 'success');
    await loadAdminEmails();
  } catch (err) {
    showToast(err.message || 'Failed to save SMTP settings.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>Save & Activate SMTP</span>`;
    }
  }
}

function openSendTestEmailModal() {
  const cfg = ADMIN_DATA.smtpConfig || {};

  openModal({
    title: 'Send Live Test Confirmation Email',
    maxWidth: 'max-w-md',
    body: `
      <form id="form-send-test-email" onsubmit="submitSendTestEmail(event)" class="space-y-4 py-2 text-xs">
        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] leading-relaxed">
          <strong>Immediate Inbox Test:</strong> Enter any valid email address (e.g. your personal Gmail or college email). A test message will be sent through your active SMTP mail server immediately.
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Target Test Recipient Email *</label>
          <input type="email" id="test-email-target" required value="24091a05c6@rgmcet.edu.in" placeholder="24091a05c6@rgmcet.edu.in" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
          <p class="text-[10px] text-slate-400 mt-1">Check your inbox or spam folder right after clicking Send.</p>
        </div>

        <div id="test-email-status-container" class="hidden"></div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold transition">
            Close
          </button>
          <button type="submit" id="btn-submit-test-mail" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-500/25 transition flex items-center gap-2 cursor-pointer">
            <i class="fa-solid fa-paper-plane"></i>
            <span>Send Test Email Now</span>
          </button>
        </div>
      </form>
    `
  });
}

async function submitSendTestEmail(e) {
  e.preventDefault();
  const targetEmail = document.getElementById('test-email-target').value.trim();
  const btn = document.getElementById('btn-submit-test-mail');
  const statusContainer = document.getElementById('test-email-status-container');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Connecting &amp; Sending...</span>`;
  }
  if (statusContainer) {
    statusContainer.classList.add('hidden');
    statusContainer.innerHTML = '';
  }

  try {
    const res = await api.post('/api/emails/test', { target_email: targetEmail });
    if (statusContainer) {
      statusContainer.classList.remove('hidden');
      statusContainer.innerHTML = `
        <div class="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 font-bold text-xs flex items-center gap-2">
          <i class="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
          <span>${res.message || 'Test email delivered successfully! Please check your inbox.'}</span>
        </div>
      `;
    }
    showToast(res.message || 'Test email delivered!', 'success');
  } catch (err) {
    if (statusContainer) {
      statusContainer.classList.remove('hidden');
      statusContainer.innerHTML = `
        <div class="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-[11px] space-y-1">
          <div class="font-bold flex items-center gap-1.5 text-rose-700">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>SMTP Delivery Error</span>
          </div>
          <div class="font-mono text-[10px] break-words text-rose-800 bg-white p-2 rounded border border-rose-200">
            ${escapeQuote(err.message || 'Connection failed')}
          </div>
        </div>
      `;
    }
    showToast(err.message || 'Failed to deliver test email.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span>Send Test Email Now</span>`;
    }
  }
}

// Global window exposure
window.loadAdminEmails = loadAdminEmails;
window.renderAdminEmailsList = renderAdminEmailsList;
window.handleEmailSearchInput = handleEmailSearchInput;
window.resendEmailLog = resendEmailLog;
window.resendStudentConfirmationEmail = resendStudentConfirmationEmail;
window.retryAllFailedEmails = retryAllFailedEmails;
window.viewEmailError = viewEmailError;
window.openSmtpSettingsModal = openSmtpSettingsModal;
window.applySmtpPreset = applySmtpPreset;
window.submitSmtpSettings = submitSmtpSettings;
window.openSendTestEmailModal = openSendTestEmailModal;
window.submitSendTestEmail = submitSendTestEmail;
