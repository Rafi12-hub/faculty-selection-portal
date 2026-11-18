/**
 * Faculty–Student Selection Portal (FSSP)
 * Core Application Engine & State Manager
 */

const STATE = {
  token: localStorage.getItem('fssp_token') || null,
  user: null,
  student: null,
  activeAdminTab: 'dashboard',
  activeStudentTab: 'subjects',
  liveInterval: null
};

// --- Toast Notifications ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const icons = {
    success: 'fa-circle-check text-emerald-500',
    error: 'fa-circle-exclamation text-rose-500',
    warning: 'fa-triangle-exclamation text-amber-500',
    info: 'fa-circle-info text-blue-500'
  };

  const borders = {
    success: 'border-emerald-200 bg-emerald-50/90 text-emerald-950',
    error: 'border-rose-200 bg-rose-50/90 text-rose-950',
    warning: 'border-amber-200 bg-amber-50/90 text-amber-950',
    info: 'border-blue-200 bg-blue-50/90 text-blue-950'
  };

  toast.className = `p-4 rounded-xl border shadow-lg backdrop-blur-sm flex items-start gap-3 transition-all duration-300 pointer-events-auto transform translate-y-2 opacity-0 ${borders[type] || borders.info}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} text-lg mt-0.5"></i>
    <div class="flex-1 text-sm font-medium leading-relaxed">${message}</div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600 transition-colors">
      <i class="fa-solid fa-xmark text-xs"></i>
    </button>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// --- Global Modal Engine ---
function openModal({ title, body, footer = '', maxWidth = 'max-w-2xl' }) {
  const container = document.getElementById('modal-container');
  const content = document.getElementById('modal-content');
  if (!container || !content) return;

  content.className = `bg-white rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[90vh] flex flex-col overflow-hidden modal-content`;

  content.innerHTML = `
    <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
      <h3 class="text-base font-bold text-slate-900">${title}</h3>
      <button onclick="closeModal()" class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center transition-colors">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="p-6 overflow-y-auto flex-1 space-y-4">
      ${body}
    </div>
    ${footer ? `<div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">${footer}</div>` : ''}
  `;

  container.classList.remove('hidden');
}

function closeModal() {
  const container = document.getElementById('modal-container');
  if (container) {
    container.classList.add('hidden');
  }
}

// Close modal when clicking backdrop
window.addEventListener('click', (e) => {
  const container = document.getElementById('modal-container');
  if (e.target === container) {
    closeModal();
  }
});

// Escape key closes modal
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// --- API Client ---
async function apiRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (STATE.token) {
    headers['Authorization'] = `Bearer ${STATE.token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(endpoint, options);
    const data = await res.json();

    if (res.status === 401) {
      handleLogout(false);
      showToast('Session expired. Please log in again.', 'warning');
      return null;
    }

    if (!res.ok) {
      throw new Error(data.message || 'Server returned an error.');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
}

const api = {
  get: (url) => apiRequest(url, 'GET'),
  post: (url, body) => apiRequest(url, 'POST', body),
  put: (url, body) => apiRequest(url, 'PUT', body),
  patch: (url, body) => apiRequest(url, 'PATCH', body),
  delete: (url) => apiRequest(url, 'DELETE')
};

// --- View Navigation & Auth State ---
function setView(viewName) {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('view-student').classList.add('hidden');
  document.getElementById('view-admin').classList.add('hidden');

  const target = document.getElementById(`view-${viewName}`);
  if (target) {
    target.classList.remove('hidden');
  }

  renderHeaderUserSection();
}

function renderHeaderUserSection() {
  const header = document.getElementById('header-user-section');
  if (!header) return;

  if (!STATE.user) {
    header.innerHTML = `
      <div class="text-xs text-slate-400 flex items-center gap-2">
        <i class="fa-solid fa-lock text-slate-500"></i>
        <span>Authentication Required</span>
      </div>
    `;
    return;
  }

  if (STATE.user.role === 'ADMIN') {
    header.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="text-right hidden sm:block">
          <div class="text-xs font-bold text-white flex items-center justify-end gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Administrator</span>
          </div>
          <div class="text-[11px] text-slate-400 mono-font">${STATE.user.username}</div>
        </div>
        <button onclick="handleLogout()" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Sign Out</span>
        </button>
      </div>
    `;
  } else if (STATE.user.role === 'STUDENT') {
    const student = STATE.student;
    header.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="text-right hidden sm:block">
          <div class="text-xs font-bold text-white">${student ? student.name : STATE.user.username}</div>
          <div class="text-[11px] text-blue-300 mono-font">${student ? student.reg_no : ''}</div>
        </div>
        <button onclick="handleLogout()" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Sign Out</span>
        </button>
      </div>
    `;
  }
}

// --- Login Handlers ---
function switchLoginRole(role) {
  const tabStudent = document.getElementById('tab-student');
  const tabAdmin = document.getElementById('tab-admin');
  const roleInput = document.getElementById('login-role');
  const labelUsername = document.getElementById('label-username');
  const inputUsername = document.getElementById('login-username');
  const iconUsername = document.getElementById('icon-username');
  const helpText = document.getElementById('student-help-text');

  roleInput.value = role;

  if (role === 'STUDENT') {
    tabStudent.className = 'py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 bg-white text-blue-600 shadow-sm';
    tabAdmin.className = 'py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900';
    labelUsername.textContent = 'Registration Number';
    inputUsername.placeholder = 'e.g. 2024CS101';
    iconUsername.className = 'fa-solid fa-id-card';
    helpText.textContent = 'Students log in with their university registration number and assigned password.';
  } else {
    tabAdmin.className = 'py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 bg-white text-blue-600 shadow-sm';
    tabStudent.className = 'py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900';
    labelUsername.textContent = 'Admin Username';
    inputUsername.placeholder = 'e.g. admin';
    iconUsername.className = 'fa-solid fa-user-shield';
    helpText.textContent = 'Administrator account manages all faculty, courses, students, and seating capacities.';
  }
}

function fillAdminCredentials() {
  switchLoginRole('ADMIN');
  document.getElementById('login-username').value = 'admin';
  document.getElementById('login-password').value = 'admin123';
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const role = document.getElementById('login-role').value;
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('btn-login-submit');

  if (!username || !password) {
    showToast('Please enter both username/registration number and password.', 'error');
    return;
  }

  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i><span>Verifying...</span>`;

  try {
    const res = await api.post('/api/auth/login', { username, password, role });
    if (res && res.success) {
      STATE.token = res.token;
      STATE.user = res.user;
      STATE.student = res.student || null;
      localStorage.setItem('fssp_token', res.token);

      showToast(`Welcome, ${res.student ? res.student.name : res.user.username}!`, 'success');

      if (res.user.role === 'ADMIN') {
        setView('admin');
        switchAdminTab('dashboard');
      } else {
        setView('student');
        initStudentPortal();
      }
    }
  } catch (err) {
    showToast(err.message || 'Login failed. Please check your credentials.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

function handleLogout(notify = true) {
  STATE.token = null;
  STATE.user = null;
  STATE.student = null;
  localStorage.removeItem('fssp_token');
  if (STATE.liveInterval) {
    clearInterval(STATE.liveInterval);
    STATE.liveInterval = null;
  }
  setView('login');
  if (notify) {
    showToast('You have signed out successfully.', 'info');
  }
}

async function checkSession() {
  if (!STATE.token) {
    setView('login');
    return;
  }

  try {
    const res = await api.get('/api/auth/me');
    if (res && res.success) {
      STATE.user = res.user;
      STATE.student = res.student || null;

      if (res.user.role === 'ADMIN') {
        setView('admin');
        switchAdminTab('dashboard');
      } else if (res.user.role === 'STUDENT') {
        setView('student');
        initStudentPortal();
      }
    } else {
      handleLogout(false);
    }
  } catch (err) {
    handleLogout(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
});
