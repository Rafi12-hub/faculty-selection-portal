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
  auditLogs: []
};

// Switch between the 9 Admin Tabs
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
    case 'students': loadAdminStudents(); break;
    case 'faculty': loadAdminFaculty(); break;
    case 'subjects': loadAdminSubjects(); break;
    case 'mappings': loadAdminMappings(); break;
    case 'rounds': loadAdminRounds(); break;
    case 'live': loadAdminLiveSelections(); break;
    case 'reports': loadAdminReports(); break;
    case 'audit': loadAdminAudit(); break;
  }
}

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
  const faculty = ADMIN_DATA.faculty;

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
                    <div class="font-bold text-slate-900">${s.name}</div>
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
async function loadAdminMappings() {
  const container = document.getElementById('admin-tab-content');
  container.innerHTML = `<div class="py-12 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>`;

  try {
    const [mapRes, facRes, subRes] = await Promise.all([
      api.get('/api/mappings'),
      api.get('/api/faculty'),
      api.get('/api/subjects')
    ]);

    ADMIN_DATA.mappings = mapRes ? mapRes.mappings : [];
    ADMIN_DATA.faculty = facRes ? facRes.faculty : [];
    ADMIN_DATA.subjects = subRes ? subRes.subjects : [];

    renderMappingsList();
  } catch (err) {
    container.innerHTML = `<div class="p-6 bg-rose-50 text-rose-700 rounded-2xl text-xs">${err.message}</div>`;
  }
}

function renderMappingsList() {
  const container = document.getElementById('admin-tab-content');
  const mappings = ADMIN_DATA.mappings;

  container.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-900">Faculty–Subject Mappings & Capacities</h3>
          <p class="text-xs text-slate-500">Assign faculty members to specific subjects. Each mapping possesses an independent seat capacity.</p>
        </div>
        <button onclick="openAddMappingModal()" class="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto">
          <i class="fa-solid fa-diagram-project"></i>
          <span>Create New Mapping</span>
        </button>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3.5 px-6">Faculty Member</th>
                <th class="py-3.5 px-6">Assigned Subject</th>
                <th class="py-3.5 px-6">Year & Sem</th>
                <th class="py-3.5 px-6">Seat Capacity</th>
                <th class="py-3.5 px-6">Allocated</th>
                <th class="py-3.5 px-6">Remaining</th>
                <th class="py-3.5 px-6">Status</th>
                <th class="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${mappings.length === 0 ? `
                <tr>
                  <td colspan="8" class="py-16 text-center text-slate-400">
                    <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-lg mb-2">
                      <i class="fa-solid fa-diagram-project"></i>
                    </div>
                    <div class="font-bold text-slate-700">No Mappings Configured</div>
                    <div class="text-xs text-slate-400 mt-0.5">Click "Create New Mapping" above to assign faculty members to courses with individual seat capacities.</div>
                  </td>
                </tr>
              ` : mappings.map(m => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-6">
                    <div class="font-bold text-slate-900">${m.faculty_name}</div>
                    <div class="mono-font text-[11px] text-blue-600 font-semibold">${m.faculty_code} &bull; ${m.faculty_designation}</div>
                  </td>
                  <td class="py-3.5 px-6">
                    <div class="font-bold text-slate-900">${m.subject_name}</div>
                    <div class="mono-font text-[11px] text-slate-500">${m.subject_code}</div>
                  </td>
                  <td class="py-3.5 px-6 font-semibold text-slate-700">
                    Year ${m.academic_year} &bull; Sem ${m.semester}
                  </td>
                  <td class="py-3.5 px-6">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-900 text-sm">${m.capacity}</span>
                      <button onclick="openEditCapacityModal(${m.id}, ${m.capacity}, ${m.allocated_seats}, '${escapeQuote(m.faculty_name)}', '${escapeQuote(m.subject_name)}')" class="text-blue-600 hover:text-blue-800 text-[11px] underline">
                        Edit
                      </button>
                    </div>
                  </td>
                  <td class="py-3.5 px-6 font-bold text-blue-600">${m.allocated_seats}</td>
                  <td class="py-3.5 px-6">
                    <span class="font-bold ${m.available_seats === 0 ? 'text-rose-600' : 'text-emerald-600'}">
                      ${m.available_seats === 0 ? 'FULL' : `${m.available_seats} seats`}
                    </span>
                  </td>
                  <td class="py-3.5 px-6">
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${m.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}">
                      ${m.status}
                    </span>
                  </td>
                  <td class="py-3.5 px-6 text-right space-x-2">
                    <button onclick="deleteMappingRecord(${m.id}, '${escapeQuote(m.faculty_name)}', '${escapeQuote(m.subject_name)}')" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete Mapping">
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

function openAddMappingModal() {
  if (ADMIN_DATA.faculty.length === 0 || ADMIN_DATA.subjects.length === 0) {
    showToast('You must add at least one Faculty member and one Subject before creating a mapping.', 'warning');
    return;
  }

  openModal({
    title: 'Create Faculty–Subject Mapping',
    maxWidth: 'max-w-md',
    body: `
      <form id="form-add-mapping" onsubmit="submitAddMapping(event)" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Select Faculty Member <span class="text-rose-500">*</span></label>
          <select id="map-faculty" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <option value="">-- Choose Faculty --</option>
            ${ADMIN_DATA.faculty.filter(f => f.status === 'ACTIVE').map(f => `
              <option value="${f.id}">${f.name} (${f.faculty_code} - ${f.designation})</option>
            `).join('')}
          </select>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Select Subject <span class="text-rose-500">*</span></label>
          <select id="map-subject" onchange="autoFillYearSem()" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <option value="">-- Choose Subject --</option>
            ${ADMIN_DATA.subjects.filter(s => s.status === 'ACTIVE').map(s => `
              <option value="${s.id}" data-year="${s.academic_year}" data-sem="${s.semester}">${s.code} - ${s.name} (Year ${s.academic_year}, Sem ${s.semester})</option>
            `).join('')}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Academic Year <span class="text-rose-500">*</span></label>
            <input type="number" id="map-year" min="1" max="4" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Semester <span class="text-rose-500">*</span></label>
            <input type="number" id="map-sem" min="1" max="8" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Maximum Seat Capacity <span class="text-rose-500">*</span></label>
          <input type="number" id="map-capacity" min="1" max="500" value="25" required placeholder="e.g. 25" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
          <p class="text-[11px] text-slate-400 mt-1">This sets the independent seat limit for this specific faculty-subject offering.</p>
        </div>

        <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold">Cancel</button>
          <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md">Create Mapping</button>
        </div>
      </form>
    `
  });
}

function autoFillYearSem() {
  const select = document.getElementById('map-subject');
  const opt = select.options[select.selectedIndex];
  if (opt && opt.dataset.year) {
    document.getElementById('map-year').value = opt.dataset.year;
    document.getElementById('map-sem').value = opt.dataset.sem;
  }
}

async function submitAddMapping(e) {
  e.preventDefault();
  const body = {
    faculty_id: parseInt(document.getElementById('map-faculty').value, 10),
    subject_id: parseInt(document.getElementById('map-subject').value, 10),
    academic_year: parseInt(document.getElementById('map-year').value, 10),
    semester: parseInt(document.getElementById('map-sem').value, 10),
    capacity: parseInt(document.getElementById('map-capacity').value, 10),
    status: 'ACTIVE'
  };

  try {
    const res = await api.post('/api/mappings', body);
    if (res && res.success) {
      closeModal();
      showToast('Faculty–Subject mapping created successfully!', 'success');
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

function renderStudentsList() {
  const container = document.getElementById('admin-tab-content');
  const students = ADMIN_DATA.students;

  const totalCount = students.length;
  const g1Count = students.filter(s => (s.section && s.section.includes('1')) || (s.reg_no <= '24091A05E2')).length;
  const g2Count = students.filter(s => (s.section && s.section.includes('2')) || (s.reg_no > '24091A05E2')).length;

  container.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-bold text-slate-900">3rd Year Student Dataset Management</h3>
          <p class="text-xs text-slate-500">Students divided into 2 groups: Group 1 (501 to 5E2) and Group 2 / Group B (5E3 to 5KP).</p>
        </div>
        <div class="flex items-center gap-3">
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

      <!-- Group Summary Banner -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
            <i class="fa-solid fa-user-graduate"></i>
          </div>
          <div>
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">3rd Year Total</div>
            <div class="text-lg font-black text-slate-900">${totalCount} Students</div>
          </div>
        </div>

        <div class="bg-blue-50/50 p-4 rounded-2xl border border-blue-200 shadow-sm flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <div class="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Group 1 (501 to 5E2)</div>
            <div class="text-lg font-black text-blue-900">${g1Count} Students</div>
          </div>
        </div>

        <div class="bg-purple-50/50 p-4 rounded-2xl border border-purple-200 shadow-sm flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <div class="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Group 2 / Group B (Remaining)</div>
            <div class="text-lg font-black text-purple-900">${g2Count} Students</div>
          </div>
        </div>
      </div>

      <!-- Search & Group Filter Bar -->
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div class="relative w-full sm:w-72">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input type="text" id="admin-stu-search" placeholder="Search name or reg no..." oninput="filterAdminStudents()" class="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <span class="text-xs text-slate-500 font-semibold whitespace-nowrap">Filter Group:</span>
          <select id="admin-stu-group-filter" onchange="filterAdminStudents()" class="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
            <option value="ALL">All Groups (${totalCount})</option>
            <option value="Group 1">Group 1 (501 to 5E2 - ${g1Count})</option>
            <option value="Group 2">Group 2 / Group B (${g2Count})</option>
          </select>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs" id="admin-students-table">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3.5 px-6">Reg Number & Name</th>
                <th class="py-3.5 px-6">Academic Year & Sem</th>
                <th class="py-3.5 px-6">Group</th>
                <th class="py-3.5 px-6">Confirmed Courses</th>
                <th class="py-3.5 px-6">Status</th>
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
                <tr class="hover:bg-slate-50/80 transition-colors stu-row" data-reg="${s.reg_no.toUpperCase()}" data-name="${s.name.toUpperCase()}" data-group="${s.section}">
                  <td class="py-3.5 px-6">
                    <div class="font-bold text-slate-900">${s.name}</div>
                    <div class="mono-font text-[11px] text-blue-600 font-semibold">${s.reg_no}</div>
                  </td>
                  <td class="py-3.5 px-6 font-semibold text-slate-700">
                    Year ${s.academic_year} &bull; Sem ${s.semester}
                  </td>
                  <td class="py-3.5 px-6 font-bold text-slate-800">
                    <span class="px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${s.section && s.section.includes('1') ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-purple-100 text-purple-800 border border-purple-200'}">
                      <span class="w-1.5 h-1.5 rounded-full ${s.section && s.section.includes('1') ? 'bg-blue-600' : 'bg-purple-600'}"></span>
                      ${s.section.startsWith('Group') ? s.section : `Group ${s.section}`}
                    </span>
                  </td>
                  <td class="py-3.5 px-6">
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${s.confirmed_selections_count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}">
                      ${s.confirmed_selections_count} Confirmed
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
  const groupFilter = document.getElementById('admin-stu-group-filter');
  if (!searchInput || !groupFilter) return;

  const term = searchInput.value.trim().toUpperCase();
  const selectedGroup = groupFilter.value;

  const rows = document.querySelectorAll('.stu-row');
  rows.forEach(r => {
    const reg = r.getAttribute('data-reg') || '';
    const name = r.getAttribute('data-name') || '';
    const group = r.getAttribute('data-group') || '';

    const matchesSearch = !term || reg.includes(term) || name.includes(term);
    const matchesGroup = selectedGroup === 'ALL' || group === selectedGroup;

    if (matchesSearch && matchesGroup) {
      r.style.display = '';
    } else {
      r.style.display = 'none';
    }
  });
}

function openAddStudentModal() {
  openModal({
    title: 'Add New Student Record',
    maxWidth: 'max-w-md',
    body: `
      <form id="form-add-student" onsubmit="submitAddStudent(event)" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Registration Number <span class="text-rose-500">*</span></label>
          <input type="text" id="stu-reg" required placeholder="e.g. 2024CS101" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl uppercase mono-font">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Student Full Name <span class="text-rose-500">*</span></label>
          <input type="text" id="stu-name-input" required placeholder="e.g. Rahul Sharma" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Year</label>
            <select id="stu-year-input" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3" selected>Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Semester</label>
            <select id="stu-sem-input" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="1">Sem 1</option>
              <option value="2">Sem 2</option>
              <option value="3">Sem 3</option>
              <option value="4">Sem 4</option>
              <option value="5" selected>Sem 5</option>
              <option value="6">Sem 6</option>
              <option value="7">Sem 7</option>
              <option value="8">Sem 8</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Group</label>
            <select id="stu-sec-input" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="Group 1">Group 1 (501 to 5E2)</option>
              <option value="Group 2">Group 2 / Group B (5E3 to 5KP)</option>
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
              <option value="Group 1" ${s.section === 'Group 1' ? 'selected' : ''}>Group 1 (501 to 5E2)</option>
              <option value="Group 2" ${s.section === 'Group 2' ? 'selected' : ''}>Group 2 / Group B (5E3 to 5KP)</option>
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
                <th class="py-3.5 px-6">Year & Sem</th>
                <th class="py-3.5 px-6">Window Start</th>
                <th class="py-3.5 px-6">Window End</th>
                <th class="py-3.5 px-6">Confirmed Selections</th>
                <th class="py-3.5 px-6">Status</th>
                <th class="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${rounds.length === 0 ? `
                <tr>
                  <td colspan="7" class="py-16 text-center text-slate-400">
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
          <input type="text" id="round-name" value="Fall 2026 Phase 1" required class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
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
              <option value="5" selected>Sem 5</option>
              <option value="6">Sem 6</option>
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

// =========================================================================
// 7. LIVE SELECTIONS (Requirement 5: Only admin can cancel with mandatory reason)
// =========================================================================
async function loadAdminLiveSelections() {
  const container = document.getElementById('admin-tab-content');
  container.innerHTML = `<div class="py-12 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>`;

  try {
    await fetchLiveSelections();
    // Auto-refresh every 5 seconds for live monitor
    if (!STATE.liveInterval) {
      STATE.liveInterval = setInterval(fetchLiveSelections, 5000);
    }
  } catch (err) {
    container.innerHTML = `<div class="p-6 bg-rose-50 text-rose-700 rounded-2xl text-xs">${err.message}</div>`;
  }
}

async function fetchLiveSelections() {
  const res = await api.get('/api/selections/live');
  ADMIN_DATA.selections = res ? res.selections : [];
  renderLiveSelectionsList();
}

function renderLiveSelectionsList() {
  const container = document.getElementById('admin-tab-content');
  const selections = ADMIN_DATA.selections;

  container.innerHTML = `
    <div class="space-y-6">
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 class="text-base font-bold text-slate-900">Live Selections Monitor</h3>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">Real-time server-side FCFS course allocations. Auto-refreshes every 5 seconds.</p>
        </div>
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <i class="fa-solid fa-clock-rotate-left"></i>
          <span>Last sync: ${new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3.5 px-6">Student</th>
                <th class="py-3.5 px-6">Subject</th>
                <th class="py-3.5 px-6">Assigned Faculty</th>
                <th class="py-3.5 px-6">Server Timestamp</th>
                <th class="py-3.5 px-6">Status</th>
                <th class="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${selections.length === 0 ? `
                <tr>
                  <td colspan="6" class="py-16 text-center text-slate-400">
                    <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-lg mb-2">
                      <i class="fa-solid fa-satellite-dish"></i>
                    </div>
                    <div class="font-bold text-slate-700">No Selections Recorded Yet</div>
                    <div class="text-xs text-slate-400 mt-0.5">As students confirm faculty selections, they will appear here in real time.</div>
                  </td>
                </tr>
              ` : selections.map(s => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-6">
                    <div class="font-bold text-slate-900">${s.student_name}</div>
                    <div class="mono-font text-[11px] text-blue-600 font-semibold">${s.student_reg_no} &bull; Sec ${s.student_section}</div>
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
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 class="text-base font-bold text-slate-900">Official Allocation & Demand Reports</h3>
            <p class="text-xs text-slate-500">Comprehensive capacity audits, occupancy percentages, and course demand metrics.</p>
          </div>
          <button onclick="window.print()" class="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all self-start sm:self-auto no-print">
            <i class="fa-solid fa-print"></i>
            <span>Print Report</span>
          </button>
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
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${allocations.length === 0 ? `
                  <tr><td colspan="7" class="py-8 text-center text-slate-400">No mappings to report.</td></tr>
                ` : allocations.map(a => `
                  <tr>
                    <td class="py-3 px-6 font-bold text-slate-900">${a.faculty_name} (${a.faculty_code})</td>
                    <td class="py-3 px-6">${a.subject_name} (${a.subject_code})</td>
                    <td class="py-3 px-6">Y${a.academic_year} S${a.semester}</td>
                    <td class="py-3 px-6 font-bold">${a.capacity}</td>
                    <td class="py-3 px-6 font-bold text-blue-600">${a.allocated_seats}</td>
                    <td class="py-3 px-6 font-bold text-emerald-600">${a.available_seats}</td>
                    <td class="py-3 px-6 font-bold">${a.occupancy_pct}%</td>
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
