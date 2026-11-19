/**
* Faculty–Student Selection Portal (FSSP)
* Student Experience & Atomic FCFS Reservation Engine
*/

let STUDENT_SUBJECTS = [];
let STUDENT_MAPPINGS = [];
let STUDENT_SELECTIONS = [];
let ACTIVE_ROUND = null;
let PENDING_SELECTIONS = {}; // { subjectId: mappingId }

// Friendly alias mappings matching the department's student selection form
const FACULTY_ALIASES = {
  'FAC026': 'bhanu',
  'FAC052': 'rupa',
  'FAC021': 'hari',
  'FAC009': 'nagarjuna',
  'FAC013': 'ram'
};

async function initStudentPortal() {
  if (!STATE.student) return;

  // Populate Student Header Info
  document.getElementById('stu-disp-name').textContent = STATE.student.name;
  document.getElementById('stu-disp-reg').textContent = STATE.student.reg_no;
  document.getElementById('stu-disp-year').textContent = `Year ${STATE.student.academic_year}`;
  document.getElementById('stu-disp-sem').textContent = `Sem ${STATE.student.semester}`;
  const sec = STATE.student.section || '';
  document.getElementById('stu-disp-sec').textContent = sec.startsWith('Group') ? sec : `Group ${sec}`;

  await loadStudentData();

  // Start real-time live seat auto-refresh every 3.5 seconds
  if (STATE.liveInterval) clearInterval(STATE.liveInterval);
  STATE.liveInterval = setInterval(refreshStudentLiveSeats, 3500);
}

// Background poller that updates seat counts live without disrupting student clicks
async function refreshStudentLiveSeats() {
  if (!STATE.student || STATE.activeStudentTab !== 'subjects') return;
  try {
    const [mapRes, roundsRes] = await Promise.all([
      api.get('/api/mappings'),
      api.get('/api/rounds')
    ]);

    const prevRoundStatus = ACTIVE_ROUND ? ACTIVE_ROUND.status : null;
    const userGroup = STATE.student ? STATE.student.section : null;
    const latestRound = (roundsRes && roundsRes.rounds && roundsRes.rounds.length > 0)
      ? (roundsRes.rounds.find(r => r.target_group === userGroup) || roundsRes.rounds.find(r => r.target_group === 'ALL') || roundsRes.rounds[0])
      : null;

    if (mapRes && mapRes.mappings) {
      STUDENT_MAPPINGS = mapRes.mappings;
      STUDENT_MAPPINGS.forEach(m => {
        const badge = document.getElementById(`seat-badge-${m.id}`);
        if (badge) {
          const isFull = m.available_seats <= 0;
          if (isFull) {
            badge.className = 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700';
            badge.textContent = 'FULL';
          } else {
            badge.className = 'text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700';
            badge.textContent = `${m.available_seats} / ${m.capacity} seats`;
          }
        }
      });
    }

    if (latestRound) {
      ACTIVE_ROUND = latestRound;
      // If round status transitioned (e.g. from NOT STARTED/PAUSED to ACTIVE), re-render to unlock UI!
      if (prevRoundStatus !== ACTIVE_ROUND.status) {
        renderStudentSubjects();
        if (ACTIVE_ROUND.status === 'ACTIVE') {
          showToast('🟢 Live Selection is now LIVE! You can select your faculty.', 'success');
        } else if (ACTIVE_ROUND.status === 'PAUSED') {
          showToast('⏸️ Live Selection has been PAUSED by the administrator.', 'warning');
        }
      }
    }
  } catch (e) {
    // Silent background handling
  }
}

function switchStudentTab(tab) {
  STATE.activeStudentTab = tab;
  const tabSubjects = document.getElementById('stu-tab-subjects');
  const tabSelections = document.getElementById('stu-tab-selections');
  const contentSubjects = document.getElementById('stu-content-subjects');
  const contentSelections = document.getElementById('stu-content-selections');

  if (tab === 'subjects') {
    tabSubjects.className = 'px-5 py-3 text-sm font-semibold border-b-2 border-blue-600 text-blue-600 flex items-center gap-2 transition-all';
    tabSelections.className = 'px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-all';
    contentSubjects.classList.remove('hidden');
    contentSelections.classList.add('hidden');
  } else {
    tabSelections.className = 'px-5 py-3 text-sm font-semibold border-b-2 border-blue-600 text-blue-600 flex items-center gap-2 transition-all';
    tabSubjects.className = 'px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-all';
    contentSelections.classList.remove('hidden');
    contentSubjects.classList.add('hidden');
    renderStudentSelections();
  }
}

async function loadStudentData() {
  try {
    // 1. Fetch Rounds
    const roundsRes = await api.get('/api/rounds');
    const userGroup = STATE.student ? STATE.student.section : null;
    ACTIVE_ROUND = (roundsRes && roundsRes.rounds && roundsRes.rounds.length > 0)
      ? (roundsRes.rounds.find(r => r.target_group === userGroup) || roundsRes.rounds.find(r => r.target_group === 'ALL') || roundsRes.rounds[0])
      : null;

    const roundBadge = document.getElementById('stu-round-badge');
    const roundName = document.getElementById('stu-round-name');
    if (ACTIVE_ROUND) {
      roundName.textContent = ACTIVE_ROUND.name;
      roundBadge.classList.remove('hidden');
    } else {
      roundBadge.classList.add('hidden');
    }

    // 2. Fetch My Selections
    const selRes = await api.get('/api/selections/my');
    STUDENT_SELECTIONS = selRes ? selRes.selections : [];

    // Update count badge
    const confirmedCount = STUDENT_SELECTIONS.filter(s => s.status === 'CONFIRMED').length;
    document.getElementById('stu-confirmed-badge').textContent = confirmedCount;

    // 3. Fetch Eligible Subjects
    const subRes = await api.get('/api/subjects');
    STUDENT_SUBJECTS = subRes ? subRes.subjects : [];

    // 4. Fetch Eligible Mappings for this student
    const mapRes = await api.get('/api/mappings');
    STUDENT_MAPPINGS = mapRes ? mapRes.mappings : [];

    renderStudentSubjects();
    if (STATE.activeStudentTab === 'selections') {
      renderStudentSelections();
    }
  } catch (err) {
    showToast(err.message || 'Failed to load eligible subjects.', 'error');
  }
}

function setPendingSelection(subjectId, mappingId) {
  PENDING_SELECTIONS[subjectId] = mappingId;
  renderStudentSubjects();
}

function submitSubjectSelection(subjectId) {
  const mappingId = PENDING_SELECTIONS[subjectId];
  if (!mappingId) return;

  const mapping = STUDENT_MAPPINGS.find(m => m.id === mappingId);
  const subject = STUDENT_SUBJECTS.find(s => s.id === subjectId);
  if (!mapping || !subject) return;

  confirmFacultyReservation(
    mapping.id,
    mapping.faculty_name,
    subject.name,
    subject.code,
    mapping.available_seats,
    mapping.capacity
  );
}

function renderStudentSubjects() {
  const container = document.getElementById('stu-subjects-list');
  if (!container) return;

  if (STUDENT_SUBJECTS.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center bg-white rounded-2xl border border-slate-200">
        <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-2xl mb-3">
          <i class="fa-solid fa-book-open"></i>
        </div>
        <h4 class="text-base font-bold text-slate-800">No Eligible Subjects Found</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">There are currently no active subjects configured for Year ${STATE.student.academic_year}, Semester ${STATE.student.semester}. Contact your administrator.</p>
      </div>
    `;
    return;
  }

  const isLiveActive = ACTIVE_ROUND && ACTIVE_ROUND.status === 'ACTIVE';
  const isPaused = ACTIVE_ROUND && ACTIVE_ROUND.status === 'PAUSED';

  const formHeaderHtml = `
    <!-- Google Form Questionnaire Header Card -->
    <div class="bg-white rounded-2xl border-t-8 ${isLiveActive ? 'border-t-emerald-600' : 'border-t-amber-500'} border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">
            ${ACTIVE_ROUND ? ACTIVE_ROUND.name : '3rd Year Faculty Selection'}
          </h2>
          <p class="text-xs font-semibold ${isLiveActive ? 'text-emerald-700' : 'text-amber-700'} mt-1 uppercase tracking-wider">
            Department of Computer Science and Engineering
          </p>
        </div>
        <div class="flex items-center gap-2">
          ${isLiveActive ? `
            <span class="text-xs px-3 py-1 font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1.5 shadow-sm">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Selection Active</span>
            </span>
          ` : (isPaused ? `
            <span class="text-xs px-3 py-1 font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1.5 shadow-sm">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Selection Paused</span>
            </span>
          ` : `
            <span class="text-xs px-3 py-1 font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1.5 shadow-sm">
              <span class="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Waiting for Admin to Start</span>
            </span>
          `)}
        </div>
      </div>

      <div class="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div>
          Candidate: <strong class="text-slate-900">${STATE.student.name}</strong> (<span class="mono-font">${STATE.student.reg_no}</span>) &bull; <span class="px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">${STATE.student.section === 'Group 1' ? 'Group 1 (Group A: 501–5E2)' : (STATE.student.section === 'Group 2' ? 'Group 2 (Group B: 5E3–5KP)' : STATE.student.section)}</span>
        </div>
        <div class="font-medium text-slate-700">
          Academic Year ${STATE.student.academic_year} &bull; Semester ${STATE.student.semester}
        </div>
      </div>

      ${!isLiveActive ? `
        <div class="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-xl flex items-center gap-3.5 text-amber-900 shadow-sm animate-pulse">
          <div class="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center text-amber-800 text-lg flex-shrink-0">
            <i class="fa-solid fa-hourglass-half"></i>
          </div>
          <div>
            <div class="font-bold text-xs uppercase tracking-wider text-amber-900">
              ${isPaused ? `Selection Temporarily Paused for ${STATE.student.section}` : `Selection Window Not Started Yet for ${STATE.student.section}`}
            </div>
            <p class="text-[11px] text-amber-800 mt-0.5">
              ${isPaused ? 'The administrator has temporarily paused selections for your group. Submissions will resume shortly.' : `Please wait for the administrator to click <strong>"START LIVE SELECTION FOR ${STATE.student.section.toUpperCase()}"</strong> in the admin portal. This questionnaire will automatically unlock in real time!`}
            </p>
          </div>
        </div>
      ` : `
        <div class="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <strong>Selection Window Open:</strong> Mark your preferred faculty below and click Confirm Selection.
          </div>
          <span class="font-bold text-emerald-700">Strict FCFS</span>
        </div>
      `}

      <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <i class="fa-solid fa-circle-info text-indigo-600 text-sm mt-0.5"></i>
        <div>
          <strong>Instructions:</strong> Mark only one oval for each subject below and click <strong>Confirm Selection</strong>. Seats are allocated strictly on a First-Come, First-Served basis and reservations are permanent once confirmed.
        </div>
      </div>
    </div>
  `;

  const subjectsHtml = STUDENT_SUBJECTS.map((subject, idx) => {
    // Check if student already selected faculty for this subject
    const confirmedSelection = STUDENT_SELECTIONS.find(
      s => s.subject_id === subject.id && s.status === 'CONFIRMED'
    );
    const hasSelection = !!confirmedSelection;

    // Get active mappings for this subject
    const subjectMappings = STUDENT_MAPPINGS.filter(m => m.subject_id === subject.id && m.status === 'ACTIVE');

    return `
      <div class="bg-white rounded-2xl border ${hasSelection ? 'border-emerald-300 ring-2 ring-emerald-500/10' : 'border-slate-200'} shadow-sm p-6 space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900">
              ${idx + 1}. Subject: ${subject.name}
            </h3>
            <p class="text-xs text-slate-500 italic mt-0.5 font-medium">Mark only one oval.</p>
          </div>
          ${hasSelection ? `
            <span class="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-sm">
              <i class="fa-solid fa-circle-check text-emerald-600"></i> Confirmed
            </span>
          ` : `
            <span class="mono-font text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
              ${subject.code}
            </span>
          `}
        </div>

        <!-- Faculty Radio Ovals List -->
        <div class="space-y-2.5 pt-1">
          ${subjectMappings.length === 0 ? `
            <div class="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              No faculty assigned to this subject yet.
            </div>
          ` : subjectMappings.map(m => {
      const isSelected = hasSelection
        ? (confirmedSelection.mapping_id === m.id)
        : (PENDING_SELECTIONS[subject.id] === m.id);
      const isFull = m.available_seats <= 0 && !isSelected;
      const alias = FACULTY_ALIASES[m.faculty_code];

      return `
              <div 
                onclick="${(isLiveActive && !hasSelection && !isFull) ? `setPendingSelection(${subject.id}, ${m.id})` : ''}"
                class="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all ${isSelected
          ? (hasSelection ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-400' : 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/25')
          : (isFull ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed' : (isLiveActive ? 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80 cursor-pointer' : 'border-slate-200 bg-slate-50/50 cursor-not-allowed opacity-80'))
        }">
                
                <div class="flex items-center gap-3.5 min-w-0">
                  <!-- Radio Oval -->
                  <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isSelected
          ? (hasSelection ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-indigo-600 bg-indigo-600')
          : (isFull ? 'border-slate-300 bg-slate-100' : 'border-slate-400 bg-white')
        }">
                    ${isSelected
          ? (hasSelection ? '<i class="fa-solid fa-check text-[10px]"></i>' : '<div class="w-2 h-2 rounded-full bg-white"></div>')
          : ''
        }
                  </div>

                  <!-- Faculty Name & Alias -->
                  <div class="min-w-0">
                    <div class="text-sm font-bold text-slate-900 truncate">
                      ${alias ? `<span class="capitalize text-indigo-900">${alias}</span> <span class="text-slate-500 font-normal text-xs">(${m.faculty_name})</span>` : m.faculty_name}
                    </div>
                    <div class="text-[11px] text-slate-500 truncate mt-0.5">
                      ${m.faculty_designation} &bull; ${m.faculty_qualification}
                    </div>
                  </div>
                </div>

                <!-- Seat Availability Badge -->
                <div class="flex items-center gap-2 flex-shrink-0 pl-2">
                  ${isFull ? `
                    <span id="seat-badge-${m.id}" class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      FULL
                    </span>
                  ` : `
                    <span id="seat-badge-${m.id}" class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${isSelected && hasSelection ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">
                      ${m.available_seats} / ${m.capacity} seats
                    </span>
                  `}
                </div>
              </div>
            `;
    }).join('')}
        </div>

        <!-- Action / Status Footer -->
        <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          ${hasSelection ? `
            <div class="text-xs text-emerald-700 flex items-center gap-2 font-medium">
              <i class="fa-solid fa-circle-check text-emerald-600"></i>
              <span>Selection permanently locked with <strong>${confirmedSelection.faculty_name}</strong></span>
            </div>
            <div class="text-[11px] font-semibold text-slate-500">
              Confirmed on ${new Date(confirmedSelection.reserved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          ` : (!isLiveActive ? `
            <div class="text-xs text-amber-700 font-medium">
              <i class="fa-solid fa-lock mr-1"></i> Waiting for administrator to start live selection.
            </div>
          ` : `
            <div class="text-xs ${PENDING_SELECTIONS[subject.id] ? 'text-indigo-700 font-semibold' : 'text-slate-500'}">
              ${PENDING_SELECTIONS[subject.id]
                ? '<i class="fa-solid fa-check text-indigo-600 mr-1.5"></i>Faculty choice marked. Proceed to complete other subjects below.'
                : 'Click an oval above to select your preferred faculty for this course.'}
            </div>
          `)}
        </div>
      </div>
    `;
  }).join('');

  // Calculate batch progress
  const totalSubjects = STUDENT_SUBJECTS.length;
  const confirmedCount = STUDENT_SUBJECTS.filter(sub => 
    STUDENT_SELECTIONS.some(s => s.subject_id === sub.id && s.status === 'CONFIRMED')
  ).length;

  const newlySelectedCount = STUDENT_SUBJECTS.filter(sub => {
    const hasConf = STUDENT_SELECTIONS.some(s => s.subject_id === sub.id && s.status === 'CONFIRMED');
    return !hasConf && PENDING_SELECTIONS[sub.id];
  }).length;

  const totalFilled = confirmedCount + newlySelectedCount;
  const isAllFilled = totalFilled >= totalSubjects && totalSubjects > 0;
  const remaining = totalSubjects - totalFilled;

  // Single Master Confirmation Card at the bottom of the form
  const bottomSubmitBar = `
    <div class="sticky bottom-4 z-20 mt-8 bg-white/95 backdrop-blur-md rounded-2xl border-2 ${isAllFilled ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20' : 'border-slate-300 shadow-xl'} p-5 sm:p-6 transition-all">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-3 h-3 rounded-full ${isAllFilled ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}"></span>
            <h4 class="text-base font-black text-slate-900">
              Faculty Selection Summary (${totalFilled} / ${totalSubjects} Chosen)
            </h4>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            ${isAllFilled 
              ? '🎉 All subjects have a selected faculty! Click the confirm button to finalize and lock your choices.' 
              : `Please mark your faculty choice for all courses before submitting (${remaining} course${remaining > 1 ? 's' : ''} remaining).`}
          </p>
        </div>

        <div class="flex items-center gap-3">
          ${isLiveActive ? `
            <button 
              ${!isAllFilled ? 'disabled' : ''}
              onclick="openBatchConfirmationModal()"
              class="w-full md:w-auto px-7 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 ${isAllFilled 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'}">
              <i class="fa-solid fa-check-double text-sm"></i>
              <span>${isAllFilled ? 'Submit & Confirm All Faculties' : `Select All Courses (${remaining} left)`}</span>
            </button>
          ` : `
            <button disabled class="px-6 py-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200">
              <i class="fa-solid fa-lock mr-1.5"></i> Selection Not Active
            </button>
          `}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = formHeaderHtml + subjectsHtml + bottomSubmitBar;
}

// Master Confirmation Modal reviewing all chosen faculties
function openBatchConfirmationModal() {
  const chosenMappings = [];
  const subjectsToConfirm = [];

  for (const subject of STUDENT_SUBJECTS) {
    const isAlreadyConfirmed = STUDENT_SELECTIONS.find(s => s.subject_id === subject.id && s.status === 'CONFIRMED');
    if (!isAlreadyConfirmed) {
      const mappingId = PENDING_SELECTIONS[subject.id];
      if (mappingId) {
        const mapping = STUDENT_MAPPINGS.find(m => m.id === mappingId);
        if (mapping) {
          chosenMappings.push(mapping.id);
          subjectsToConfirm.push({
            subjectName: subject.name,
            subjectCode: subject.code,
            facultyName: mapping.faculty_name,
            facultyDesignation: mapping.faculty_designation || mapping.designation
          });
        }
      }
    }
  }

  if (chosenMappings.length === 0) {
    showToast('No new faculty selections to confirm.', 'info');
    return;
  }

  openModal({
    title: 'Confirm Complete Faculty Selection',
    maxWidth: 'max-w-2xl',
    body: `
      <div class="space-y-4 py-2">
        <div class="text-center space-y-1">
          <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
            <i class="fa-solid fa-clipboard-check"></i>
          </div>
          <h4 class="text-base font-black text-slate-900 mt-2">Final Review of Your Faculty Choices</h4>
          <p class="text-xs text-slate-500">Please verify your preferred faculty for each subject before submitting.</p>
        </div>

        <div class="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50 text-xs">
          ${subjectsToConfirm.map((item, idx) => `
            <div class="p-3.5 flex items-center justify-between gap-3 bg-white">
              <div class="min-w-0">
                <span class="mono-font text-[10px] font-bold text-slate-400 uppercase">${item.subjectCode}</span>
                <div class="font-bold text-slate-900 truncate">${idx + 1}. ${item.subjectName}</div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="font-bold text-indigo-700">${item.facultyName}</div>
                <div class="text-[10px] text-slate-400">${item.facultyDesignation || 'Department Faculty'}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <i class="fa-solid fa-triangle-exclamation text-amber-600 mt-0.5"></i>
          <div>
            <strong>Strict FCFS Allocation:</strong> Once confirmed, your seat with each selected faculty is permanent and cannot be modified.
          </div>
        </div>
      </div>
    `,
    footer: `
      <button onclick="closeModal()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-colors">
        Go Back & Edit
      </button>
      <button id="btn-batch-confirm" onclick="executeBatchReservation()" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2">
        <i class="fa-solid fa-check-double"></i>
        <span>Yes, Lock & Confirm Selections</span>
      </button>
    `
  });
}

// Execute batch reservation for all chosen faculties
async function executeBatchReservation() {
  const btn = document.getElementById('btn-batch-confirm');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i><span>Locking All Seats...</span>`;
  }

  const mappingIds = [];
  for (const subject of STUDENT_SUBJECTS) {
    const isAlreadyConfirmed = STUDENT_SELECTIONS.find(s => s.subject_id === subject.id && s.status === 'CONFIRMED');
    if (!isAlreadyConfirmed && PENDING_SELECTIONS[subject.id]) {
      mappingIds.push(PENDING_SELECTIONS[subject.id]);
    }
  }

  try {
    const res = await api.post('/api/selections/reserve-batch', { mapping_ids: mappingIds });

    if (res && res.success) {
      closeModal();
      showToast(res.message || 'All faculty choices confirmed successfully!', 'success');
      // Clear pending
      PENDING_SELECTIONS = {};
      await loadStudentData();
      switchStudentTab('selections');
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-check-double"></i><span>Try Again</span>`;
    }
    showToast(err.message || 'Could not complete selection.', 'error');
    loadStudentData();
  }
}

// Open modal to view and select faculty for a specific subject
async function openFacultySelectionModal(subjectId) {
  try {
    const res = await api.get(`/api/subjects/${subjectId}`);
    if (!res || !res.success) throw new Error('Could not load subject details.');

    const subject = res.subject;
    const mappings = subject.faculty_mappings || [];

    if (mappings.length === 0) {
      openModal({
        title: `${subject.code} - ${subject.name}`,
        body: `
          <div class="text-center py-10">
            <div class="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto text-xl mb-3">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h4 class="text-sm font-bold text-slate-800">No Faculty Assigned Yet</h4>
            <p class="text-xs text-slate-500 max-w-xs mx-auto mt-1">The administrator has not yet assigned any faculty members to this subject for Year ${subject.academic_year}, Semester ${subject.semester}.</p>
          </div>
        `,
        footer: `<button onclick="closeModal()" class="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs">Close</button>`
      });
      return;
    }

    const cardsHtml = mappings.map(m => {
      const isFull = m.available_seats <= 0;
      const fillPercentage = m.capacity > 0 ? Math.min(100, Math.round(((m.capacity - m.available_seats) / m.capacity) * 100)) : 100;

      return `
        <div class="border ${isFull ? 'border-slate-200 bg-slate-50 opacity-80' : 'border-slate-200 bg-white hover:border-blue-400'} rounded-2xl p-5 transition-all">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg flex-shrink-0 overflow-hidden shadow-inner">
              ${m.profile_image ? `<img src="${m.profile_image}" class="w-full h-full object-cover">` : `<i class="fa-solid fa-user-tie"></i>`}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <h5 class="text-base font-bold text-slate-900 truncate">${m.faculty_name}</h5>
                <span class="mono-font text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">${m.faculty_code}</span>
              </div>
              <div class="text-xs font-semibold text-blue-600 mt-0.5">${m.designation} &bull; ${m.qualification}</div>
              <div class="text-xs text-slate-500 mt-1"><strong class="text-slate-700">Specialization:</strong> ${m.specialization}</div>
              ${m.description ? `<p class="text-xs text-slate-600 mt-1 line-clamp-2">${m.description}</p>` : ''}
              
              <!-- Seat Capacity Meter -->
              <div class="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div class="flex items-center justify-between text-xs mb-1.5">
                  <span class="font-medium text-slate-600">Seat Occupancy:</span>
                  <span class="font-bold ${isFull ? 'text-rose-600' : 'text-slate-900'}">
                    ${isFull ? 'FULL' : `${m.available_seats} of ${m.capacity} seats remaining`}
                  </span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div class="h-2 rounded-full transition-all duration-500 ${isFull ? 'bg-rose-500' : fillPercentage > 80 ? 'bg-amber-500' : 'bg-blue-600'}" style="width: ${fillPercentage}%"></div>
                </div>
              </div>

              <!-- Selection Button -->
              <div class="mt-4 flex justify-end">
                ${isFull ? `
                  <button disabled class="px-4 py-2 bg-slate-200 text-slate-400 font-bold rounded-xl text-xs cursor-not-allowed flex items-center gap-1.5">
                    <i class="fa-solid fa-ban"></i>
                    <span>Seats Fully Booked</span>
                  </button>
                ` : `
                  <button onclick="confirmFacultyReservation(${m.mapping_id}, '${escapeQuote(m.faculty_name)}', '${escapeQuote(subject.name)}', '${escapeQuote(subject.code)}', ${m.available_seats}, ${m.capacity})" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-2">
                    <i class="fa-solid fa-check"></i>
                    <span>Select This Faculty</span>
                  </button>
                `}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    openModal({
      title: `Select Faculty for ${subject.code} - ${subject.name}`,
      maxWidth: 'max-w-3xl',
      body: `
        <div class="space-y-4">
          <div class="bg-blue-50/80 border border-blue-200/60 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <i class="fa-solid fa-circle-info text-blue-600 text-sm mt-0.5"></i>
            <div>
              <strong>First-Come, First-Served Policy:</strong>
              Seats are reserved atomically upon your confirmation. Once confirmed, your seat is permanently reserved and cannot be cancelled or altered.
            </div>
          </div>
          <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            ${cardsHtml}
          </div>
        </div>
      `,
      footer: `
        <button onclick="closeModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors">
          Cancel
        </button>
      `
    });
  } catch (err) {
    showToast(err.message || 'Error loading faculty mappings.', 'error');
  }
}

// Confirmation Dialog before executing atomic server reservation
function confirmFacultyReservation(mappingId, facultyName, subjectName, subjectCode, availableSeats, capacity) {
  openModal({
    title: 'Confirm Faculty Selection',
    maxWidth: 'max-w-md',
    body: `
      <div class="text-center space-y-4 py-2">
        <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl shadow-inner">
          <i class="fa-solid fa-shield-check"></i>
        </div>
        <div>
          <h4 class="text-lg font-bold text-slate-900">Are you sure?</h4>
          <p class="text-xs text-slate-500 mt-1">Review your course selection carefully before confirming.</p>
        </div>

        <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2 text-xs">
          <div>
            <span class="text-slate-500">Subject:</span>
            <div class="font-bold text-slate-900">${subjectCode} – ${subjectName}</div>
          </div>
          <div>
            <span class="text-slate-500">Selected Faculty:</span>
            <div class="font-bold text-blue-600">${facultyName}</div>
          </div>
          <div>
            <span class="text-slate-500">Current Remaining Seats:</span>
            <div class="font-bold text-slate-900">${availableSeats} / ${capacity}</div>
          </div>
        </div>

        <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 text-left flex items-start gap-2">
          <i class="fa-solid fa-triangle-exclamation text-amber-600 mt-0.5"></i>
          <span>
            <strong>Irreversible Action:</strong> Students cannot modify or cancel confirmed selections. Only the administrator has the authority to cancel a confirmed seat.
          </span>
        </div>
      </div>
    `,
    footer: `
      <button onclick="closeModal()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-colors">
        Go Back
      </button>
      <button id="btn-confirm-reserve" onclick="executeReservation(${mappingId})" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2">
        <i class="fa-solid fa-check-double"></i>
        <span>Confirm & Reserve Seat</span>
      </button>
    `
  });
}

// Execute server-side atomic FCFS reservation
async function executeReservation(mappingId) {
  const btn = document.getElementById('btn-confirm-reserve');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i><span>Securing Seat...</span>`;
  }

  try {
    const res = await api.post('/api/selections/reserve', { mapping_id: mappingId });

    if (res && res.success) {
      closeModal();
      showToast(res.message, 'success');
      await loadStudentData();
      switchStudentTab('selections');
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-check-double"></i><span>Try Again</span>`;
    }
    showToast(err.message || 'Seat could not be reserved. It may have just been claimed by another student.', 'error');
    // Refresh live data in background so student sees up-to-date capacity
    loadStudentData();
  }
}

function renderStudentSelections() {
  const container = document.getElementById('stu-selections-list');
  if (!container) return;

  const confirmed = STUDENT_SELECTIONS.filter(s => s.status === 'CONFIRMED');

  if (confirmed.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center">
        <div class="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl mb-3">
          <i class="fa-solid fa-inbox"></i>
        </div>
        <h4 class="text-sm font-bold text-slate-800">No Confirmed Selections Yet</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">Switch to the "Eligible Subjects" tab to choose faculty members for your courses.</p>
        <button onclick="switchStudentTab('subjects')" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors">
          Browse Eligible Subjects
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h4 class="text-base font-bold text-slate-900">Official Course & Faculty Registration Slip</h4>
        <p class="text-xs text-slate-500">Student: <strong>${STATE.student.name}</strong> (${STATE.student.reg_no}) &bull; Year ${STATE.student.academic_year}, Sem ${STATE.student.semester}, Sec ${STATE.student.section}</p>
      </div>
      <div class="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
        <i class="fa-solid fa-check-circle mr-1"></i> ${confirmed.length} Course(s) Confirmed
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
          <tr>
            <th class="py-3.5 px-6">Subject</th>
            <th class="py-3.5 px-6">Selected Faculty Member</th>
            <th class="py-3.5 px-6">Designation & Specialization</th>
            <th class="py-3.5 px-6">Server Timestamp</th>
            <th class="py-3.5 px-6">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${confirmed.map(s => `
            <tr class="hover:bg-slate-50/80 transition-colors">
              <td class="py-4 px-6">
                <div class="font-bold text-slate-900">${s.subject_name}</div>
                <div class="mono-font text-[11px] text-blue-600">${s.subject_code} &bull; ${s.subject_credits || 3} Credits</div>
              </td>
              <td class="py-4 px-6">
                <div class="font-bold text-slate-900">${s.faculty_name}</div>
                <div class="mono-font text-[11px] text-slate-500">${s.faculty_code}</div>
              </td>
              <td class="py-4 px-6">
                <div class="font-medium text-slate-700">${s.faculty_designation}</div>
                <div class="text-[11px] text-slate-500">${s.faculty_specialization}</div>
              </td>
              <td class="py-4 px-6 mono-font text-[11px] text-slate-600">
                ${new Date(s.reserved_at).toLocaleString()}
              </td>
              <td class="py-4 px-6">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  CONFIRMED
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-lock text-slate-400"></i>
        <span>Selections are locked. To request changes, contact the academic administrator.</span>
      </div>
      <div class="mono-font text-[11px] text-slate-400">
        System Verification ID: ${STATE.student.reg_no}-${Date.now().toString(36).toUpperCase()}
      </div>
    </div>
  `;
}

function escapeQuote(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
