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

function resolveActiveRound(roundsList, userGroup) {
  if (!roundsList || roundsList.length === 0) return null;
  // 1. First look for ACTIVE round matching this student's section/group
  const activeMatched = roundsList.find(r => r.status === 'ACTIVE' && (r.target_group === userGroup || r.target_group === 'ALL' || !r.target_group));
  if (activeMatched) return activeMatched;

  // 2. Look for any ACTIVE round in the list
  const anyActive = roundsList.find(r => r.status === 'ACTIVE');
  if (anyActive) return anyActive;

  // 3. Look for PAUSED round matching userGroup or ALL
  const pausedMatched = roundsList.find(r => r.status === 'PAUSED' && (r.target_group === userGroup || r.target_group === 'ALL' || !r.target_group));
  if (pausedMatched) return pausedMatched;

  // 4. Default to matching group round or first round
  return roundsList.find(r => r.target_group === userGroup) || roundsList.find(r => r.target_group === 'ALL') || roundsList[0];
}

let PENDING_OE_INTERNAL = {
  'OE1': { subjectId: null, mappingId: null },
  'OE2': { subjectId: null, mappingId: null }
};

function selectInternalOESubject(oeKey, subjectId) {
  if (!PENDING_OE_INTERNAL[oeKey]) {
    PENDING_OE_INTERNAL[oeKey] = { subjectId: null, mappingId: null };
  }
  PENDING_OE_INTERNAL[oeKey].subjectId = subjectId;
  PENDING_OE_INTERNAL[oeKey].mappingId = null;
  renderStudentSubjects();
}

function selectInternalOEMapping(oeKey, mappingId) {
  if (!PENDING_OE_INTERNAL[oeKey]) {
    PENDING_OE_INTERNAL[oeKey] = { subjectId: null, mappingId: null };
  }
  PENDING_OE_INTERNAL[oeKey].mappingId = mappingId;
  renderStudentSubjects();
}

function confirmInternalOESelection(oeKey) {
  if (!ACTIVE_ROUND || ACTIVE_ROUND.status !== 'ACTIVE') {
    showToast('Selection round is not currently active. Please wait for the administrator to start live selection.', 'warning');
    return;
  }
  const pending = PENDING_OE_INTERNAL[oeKey];
  if (!pending || !pending.mappingId) {
    showToast('Please select a subject and choose an available faculty member first.', 'warning');
    return;
  }
  const mapping = STUDENT_MAPPINGS.find(m => m.id === pending.mappingId);
  const subject = STUDENT_SUBJECTS.find(s => s.id === pending.subjectId);
  if (!mapping || !subject) return;

  confirmFacultyReservation(
    mapping.id,
    mapping.faculty_name,
    subject.name,
    subject.code
  );
}

window.selectInternalOESubject = selectInternalOESubject;
window.selectInternalOEMapping = selectInternalOEMapping;
window.confirmInternalOESelection = confirmInternalOESelection;

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

// Background poller that updates availability status live without disrupting student clicks
async function refreshStudentLiveSeats() {
  if (!STATE.student || STATE.activeStudentTab !== 'subjects') return;
  try {
    const [mapRes, roundsRes] = await Promise.all([
      api.get('/api/mappings'),
      api.get('/api/rounds')
    ]);

    const prevRoundStatus = ACTIVE_ROUND ? ACTIVE_ROUND.status : null;
    const userGroup = STATE.student ? STATE.student.section : null;
    const latestRound = resolveActiveRound(roundsRes ? roundsRes.rounds : [], userGroup);

    let needsRerender = false;

    if (mapRes && mapRes.mappings) {
      const previousStatuses = new Map(STUDENT_MAPPINGS.map(m => [m.id, m.availability_status]));
      STUDENT_MAPPINGS = mapRes.mappings;

      STUDENT_MAPPINGS.forEach(m => {
        const isFull = m.availability_status === 'FULL';
        const hasConfirmed = STUDENT_SELECTIONS.some(s => s.mapping_id === m.id && s.status === 'CONFIRMED');
        if (previousStatuses.get(m.id) !== m.availability_status) {
          needsRerender = true;
        }

        // If seats filled while student had it marked as pending, auto-clear and prompt to select another
        if (isFull && !hasConfirmed && PENDING_SELECTIONS[m.subject_id] === m.id) {
          delete PENDING_SELECTIONS[m.subject_id];
          needsRerender = true;
          showToast(`Seat capacity for ${m.faculty_name} just filled up! Please select an available faculty.`, 'warning');
        }
      });
    }

    // Refresh Open Elective availability live for 3rd Year
    if (is3rdYear && oeRes && oeRes.success && oeRes.electives) {
      STUDENT_OE_DATA = oeRes.electives;
    }

    if (latestRound) {
      ACTIVE_ROUND = latestRound;
      // If round status transitioned (e.g. from NOT STARTED/PAUSED to ACTIVE), re-render to unlock UI!
      if (prevRoundStatus !== ACTIVE_ROUND.status) {
        needsRerender = true;
        if (ACTIVE_ROUND.status === 'ACTIVE') {
          showToast('🟢 Live Selection is now LIVE! You can select your faculty.', 'success');
        } else if (ACTIVE_ROUND.status === 'PAUSED') {
          showToast('⏸️ Live Selection has been PAUSED by the administrator.', 'warning');
        }
      }
    }

    if (needsRerender) {
      renderStudentSubjects();
    }
  } catch (e) {
    console.error('Failed to refresh student faculty availability:', e);
  }
}

function switchStudentTab(tab) {
  STATE.activeStudentTab = tab === 'selections' ? 'selections' : 'subjects';
  const tabSubjects = document.getElementById('stu-tab-subjects');
  const tabSelections = document.getElementById('stu-tab-selections');
  const contentSubjects = document.getElementById('stu-content-subjects');
  const contentSelections = document.getElementById('stu-content-selections');

  const defaultTabClass = 'px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-all whitespace-nowrap';
  const activeBlueClass = 'px-5 py-3 text-sm font-semibold border-b-2 border-blue-600 text-blue-600 flex items-center gap-2 transition-all whitespace-nowrap';

  if (tabSubjects) tabSubjects.className = defaultTabClass;
  if (tabSelections) tabSelections.className = defaultTabClass;

  if (contentSubjects) contentSubjects.classList.add('hidden');
  if (contentSelections) contentSelections.classList.add('hidden');

  if (STATE.activeStudentTab === 'selections') {
    if (tabSelections) tabSelections.className = activeBlueClass;
    if (contentSelections) contentSelections.classList.remove('hidden');
    renderStudentSelections();
  } else {
    if (tabSubjects) tabSubjects.className = activeBlueClass;
    if (contentSubjects) contentSubjects.classList.remove('hidden');
    renderStudentSubjects();
  }
}

async function loadStudentData() {
  try {
    const is3rdYear = STATE.student && STATE.student.academic_year === 3;

    // 1. Fetch Rounds
    const roundsRes = await api.get('/api/rounds');
    const userGroup = STATE.student ? STATE.student.section : null;
    ACTIVE_ROUND = resolveActiveRound(roundsRes ? roundsRes.rounds : [], userGroup);

    const roundBadge = document.getElementById('stu-round-badge');
    const roundName = document.getElementById('stu-round-name');
    if (ACTIVE_ROUND) {
      roundName.textContent = ACTIVE_ROUND.name;
      roundBadge.classList.remove('hidden');
    } else {
      roundBadge.classList.add('hidden');
    }

    // 2. Fetch My Selections, Subjects, Mappings
    const [selRes, subRes, mapRes] = await Promise.all([
      api.get('/api/selections/my'),
      api.get('/api/subjects'),
      api.get('/api/mappings')
    ]);

    STUDENT_SELECTIONS = selRes ? selRes.selections : [];
    STUDENT_SUBJECTS = subRes ? subRes.subjects : [];
    STUDENT_MAPPINGS = mapRes ? mapRes.mappings : [];

    // Update count badge across all confirmed courses
    const confirmedCount = STUDENT_SELECTIONS.filter(s => s.status === 'CONFIRMED').length;
    const badgeEl = document.getElementById('stu-confirmed-badge');
    if (badgeEl) {
      badgeEl.textContent = confirmedCount;
    }

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
  );
}

function renderStudentSubjects() {
  const container = document.getElementById('stu-subjects-list');
  if (!container) return;

  const is3rdYear = STATE.student && STATE.student.academic_year === 3;
  const coreSubjects = STUDENT_SUBJECTS.filter(s => (!s.elective_group || s.elective_group === 'NONE') && s.status === 'ACTIVE');
  const oe1Subjects = is3rdYear ? STUDENT_SUBJECTS.filter(s => s.elective_group === 'OE1' && s.status === 'ACTIVE') : [];
  const oe2Subjects = is3rdYear ? STUDENT_SUBJECTS.filter(s => s.elective_group === 'OE2' && s.status === 'ACTIVE') : [];

  if (coreSubjects.length === 0 && oe1Subjects.length === 0 && oe2Subjects.length === 0) {
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
    <!-- Questionnaire Header Card -->
    <div class="bg-white rounded-2xl border-t-8 ${isLiveActive ? 'border-t-emerald-600' : 'border-t-amber-500'} border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight">
            ${ACTIVE_ROUND ? ACTIVE_ROUND.name : `Year ${STATE.student ? STATE.student.academic_year : ''} Faculty Selection`}
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
          <strong>Instructions:</strong> Choose your preferred faculty member for each course below. Seats are allocated strictly on a First-Come, First-Served basis and reservations are permanent once confirmed.
        </div>
      </div>
    </div>
  `;

  // 1. Regular Core Subjects Cards
  const regularSubjectsHtml = coreSubjects.map((subject, idx) => {
    const confirmedSelection = STUDENT_SELECTIONS.find(
      s => s.subject_id === subject.id && s.status === 'CONFIRMED'
    );
    const hasSelection = !!confirmedSelection;
    const subjectMappings = STUDENT_MAPPINGS.filter(m => m.subject_id === subject.id && m.status === 'ACTIVE');
    const hasFullFaculty = subjectMappings.some(m => m.availability_status === 'FULL');

    return `
      <div id="subject-card-${subject.id}" class="bg-white rounded-2xl border ${hasSelection ? 'border-emerald-300 ring-2 ring-emerald-500/10' : (hasFullFaculty && !PENDING_SELECTIONS[subject.id] ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200')} shadow-sm p-6 space-y-4 transition-all">
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

        ${(!hasSelection && hasFullFaculty && !PENDING_SELECTIONS[subject.id]) ? `
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-triangle-exclamation text-amber-600"></i>
              <span>One or more faculty members are full. <strong>Please select from the remaining available faculty members below.</strong></span>
            </div>
            <span class="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold rounded text-[10px] uppercase flex-shrink-0">Action Needed</span>
          </div>
        ` : ''}

        <!-- Faculty Radio Ovals List -->
        <div class="space-y-2.5 pt-1">
          ${subjectMappings.length === 0 ? `
            <div class="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              No faculty assigned to this subject for your section yet.
            </div>
          ` : subjectMappings.map(m => {
            const isConfirmedForThis = hasSelection && confirmedSelection.mapping_id === m.id;
            const isFull = (m.availability_status === 'FULL' || m.is_full) && !isConfirmedForThis;
            const isFillingFast = m.availability_status === 'FILLING_FAST';

            if (isFull && PENDING_SELECTIONS[subject.id] === m.id) {
              delete PENDING_SELECTIONS[subject.id];
            }

            const isSelected = isConfirmedForThis || (PENDING_SELECTIONS[subject.id] === m.id);
            const alias = FACULTY_ALIASES[m.faculty_code];

            return `
              <div 
                onclick="${(isLiveActive && !hasSelection && !isFull) ? `setPendingSelection(${subject.id}, ${m.id})` : ''}"
                class="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all ${isSelected
                  ? (hasSelection ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-400' : 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/25')
                  : (isFull ? 'border-rose-200 bg-rose-50/40 opacity-75 cursor-not-allowed' : (isLiveActive ? 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50 cursor-pointer shadow-sm hover:shadow' : 'border-slate-200 bg-slate-50/50 cursor-not-allowed opacity-80'))
                }">
                
                <div class="flex items-center gap-3.5 min-w-0">
                  <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isSelected
                    ? (hasSelection ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-indigo-600 bg-indigo-600 text-white')
                    : (isFull ? 'border-rose-300 bg-rose-100 text-rose-500' : 'border-slate-400 bg-white hover:border-indigo-500')
                  }">
                    ${isSelected ? '<i class="fa-solid fa-check text-[10px]"></i>' : (isFull ? '<i class="fa-solid fa-xmark text-[10px]"></i>' : '')}
                  </div>

                  <div class="min-w-0">
                    <div class="text-sm font-bold ${isFull ? 'text-slate-500' : 'text-slate-900'} truncate flex items-center gap-2">
                      <span>${alias ? `<span class="capitalize text-indigo-900">${alias}</span> <span class="text-slate-500 font-normal text-xs">(${m.faculty_name})</span>` : m.faculty_name}</span>
                      <span class="w-2.5 h-2.5 rounded-full ${isFull ? 'bg-rose-500' : (isFillingFast ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500')} flex-shrink-0"></span>
                    </div>
                    <div class="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold ${isFull ? 'text-rose-700' : (isFillingFast ? 'text-amber-800' : 'text-emerald-700')}">
                      <span class="w-2 h-2 rounded-full ${isFull ? 'bg-rose-500' : (isFillingFast ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500')}"></span>
                      <span>${isFull ? 'Full (Faculty Capacity Reached)' : (isFillingFast ? 'Filling Fast' : 'Available')}</span>
                    </div>
                    <div class="text-[11px] text-slate-500 truncate mt-0.5">
                      ${m.faculty_designation} &bull; ${m.faculty_qualification}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0 pl-2">
                  ${isFull ? `
                    <div class="text-right">
                      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-300">
                        <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span>Faculty Capacity Reached</span>
                      </span>
                    </div>
                  ` : (isFillingFast ? `
                    <div class="text-right">
                      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span>Filling Fast</span>
                      </span>
                    </div>
                  ` : `
                    <div class="text-right">
                      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Available</span>
                      </span>
                    </div>
                  `)}
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
            <div class="text-xs text-amber-700 font-medium flex items-center gap-1.5">
              <i class="fa-solid fa-lock text-amber-600"></i>
              <span>Waiting for administrator to start live selection.</span>
            </div>
          ` : `
            <div class="text-xs ${PENDING_SELECTIONS[subject.id] ? 'text-indigo-700 font-bold' : 'text-slate-500'} flex items-center gap-1.5">
              ${PENDING_SELECTIONS[subject.id]
                ? '<i class="fa-solid fa-circle-check text-emerald-600 mr-1"></i><span>Faculty choice marked. Submit all selections below.</span>'
                : '<i class="fa-regular fa-circle text-slate-400 mr-1"></i><span>Click an oval above to mark your preferred faculty.</span>'}
            </div>
          `)}
        </div>
      </div>
    `;
  }).join('');

  // 2. Open Electives Cards (Subject in Subject for Group A & Group B)
  function buildOECardHtml(oeKey, oeTitle, oeSubList, cardIndex) {
    if (!oeSubList || oeSubList.length === 0) return '';
    const confirmedSel = STUDENT_SELECTIONS.find(sel => {
      const sub = STUDENT_SUBJECTS.find(s => s.id === sel.subject_id);
      return sub && sub.elective_group === oeKey && sel.status === 'CONFIRMED';
    });
    const hasSelection = !!confirmedSel;

    let pending = PENDING_OE_INTERNAL[oeKey];
    if (!pending) {
      pending = { subjectId: oeSubList[0].id, mappingId: null };
      PENDING_OE_INTERNAL[oeKey] = pending;
    }
    if (!pending.subjectId) {
      pending.subjectId = oeSubList[0].id;
    }

    const currentSubId = pending.subjectId;
    const currentSubject = oeSubList.find(s => s.id === currentSubId) || oeSubList[0];
    const mappingsForThisGroup = STUDENT_MAPPINGS.filter(m => m.subject_id === currentSubId && m.status === 'ACTIVE');

    return `
      <div id="oe-card-${oeKey}" class="bg-white rounded-2xl border ${hasSelection ? 'border-emerald-300 ring-2 ring-emerald-500/10' : 'border-indigo-200 ring-2 ring-indigo-500/10'} shadow-sm p-6 space-y-4 transition-all">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold text-[10px]">OPEN ELECTIVE</span>
              <h3 class="text-base sm:text-lg font-bold text-slate-900">${cardIndex}. Subject: ${oeTitle}</h3>
            </div>
            <p class="text-xs text-slate-500 italic mt-0.5 font-medium">Select 1 Subject from the options below and mark 1 faculty member.</p>
          </div>
          ${hasSelection ? `
            <span class="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-sm">
              <i class="fa-solid fa-circle-check text-emerald-600"></i> Confirmed
            </span>
          ` : `
            <span class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              Required
            </span>
          `}
        </div>

        ${hasSelection ? `
          <div class="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="text-[10px] font-bold text-emerald-700 uppercase">Confirmed Course &amp; Faculty</div>
              <div class="text-sm font-bold text-slate-900 mt-0.5">${confirmedSel.subject_name}</div>
              <div class="text-xs text-indigo-700 font-semibold mt-0.5">Faculty: ${confirmedSel.faculty_name}</div>
            </div>
            <div class="text-[11px] text-slate-500 text-right">
              Confirmed on ${new Date(confirmedSel.reserved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ` : `
          <!-- Step 1: Choose Subject in Subject -->
          <div class="space-y-2">
            <div class="text-xs font-bold text-slate-700 flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
              <span>Choose Subject:</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              ${oeSubList.map(s => {
                const isSelected = s.id === currentSubId;
                return `
                  <div onclick="selectInternalOESubject('${oeKey}', ${s.id})" class="p-3 rounded-xl border text-xs cursor-pointer transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50/70 font-bold text-indigo-900 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700'}">
                    <div class="flex items-center justify-between">
                      <span class="truncate">${s.name}</span>
                      ${isSelected ? '<i class="fa-solid fa-circle-check text-indigo-600 text-xs"></i>' : ''}
                    </div>
                    <div class="mono-font text-[10px] text-slate-400 mt-0.5">${s.code}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Step 2: Choose Faculty Mapped to this Subject for student's group (Group A or Group B) -->
          <div class="space-y-2 pt-2 border-t border-slate-100">
            <div class="text-xs font-bold text-slate-700 flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
              <span>Choose Faculty for ${currentSubject ? currentSubject.name : 'Selected Subject'} (${STATE.student.section === 'Group 1' ? 'Group A: 501–5E2' : (STATE.student.section === 'Group 2' ? 'Group B: 5E3–5KP' : STATE.student.section)}):</span>
            </div>
            <div class="space-y-2.5">
              ${mappingsForThisGroup.length === 0 ? `
                <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  No faculty mapped to this subject for your section yet.
                </div>
              ` : mappingsForThisGroup.map(m => {
                const isFull = m.availability_status === 'FULL';
                const isFillingFast = m.availability_status === 'FILLING_FAST';
                const isSelected = pending.mappingId === m.id;

                let indicatorBg = 'bg-emerald-500';
                let statusText = 'Available';
                if (isFull) {
                  indicatorBg = 'bg-rose-500';
                  statusText = 'Faculty Capacity Reached';
                } else if (isFillingFast) {
                  indicatorBg = 'bg-amber-500 animate-pulse';
                  statusText = 'Filling Fast';
                }

                return `
                  <div onclick="${(isLiveActive && !isFull) ? `selectInternalOEMapping('${oeKey}', ${m.id})` : ''}" class="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/25' : (isFull ? 'border-rose-200 bg-rose-50/40 opacity-75 cursor-not-allowed' : (isLiveActive ? 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50 cursor-pointer shadow-sm' : 'border-slate-200 bg-slate-50/50 cursor-not-allowed opacity-80'))}">
                    <div class="flex items-center gap-3.5 min-w-0">
                      <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : (isFull ? 'border-rose-300 bg-rose-100 text-rose-500' : 'border-slate-400 bg-white hover:border-indigo-500')}">
                        ${isSelected ? '<i class="fa-solid fa-check text-[10px]"></i>' : (isFull ? '<i class="fa-solid fa-xmark text-[10px]"></i>' : '')}
                      </div>
                      <div class="min-w-0">
                        <div class="text-sm font-bold ${isFull ? 'text-slate-500' : 'text-slate-900'} truncate flex items-center gap-2">
                          <span>${m.faculty_name}</span>
                          <span class="w-2.5 h-2.5 rounded-full ${indicatorBg} flex-shrink-0"></span>
                        </div>
                        <div class="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold ${isFull ? 'text-rose-700' : (isFillingFast ? 'text-amber-800' : 'text-emerald-700')}">
                          <span class="w-2 h-2 rounded-full ${indicatorBg}"></span>
                          <span>${statusText}</span>
                        </div>
                        <div class="text-[11px] text-slate-500 truncate mt-0.5">
                          ${m.faculty_designation || 'Department Faculty'} &bull; ${m.faculty_qualification || 'M.Tech / Ph.D'}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 flex-shrink-0 pl-2">
                      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isFull ? 'bg-rose-100 text-rose-700 border border-rose-300' : (isFillingFast ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300')}">
                        <span class="w-2 h-2 rounded-full ${indicatorBg}"></span>
                        <span>${statusText}</span>
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Step 3: Status Footer -->
          <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            ${!isLiveActive ? `
              <div class="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                <i class="fa-solid fa-lock text-amber-600"></i>
                <span>Waiting for administrator to start live selection.</span>
              </div>
            ` : `
              <div class="text-xs ${pending.mappingId ? 'text-indigo-700 font-bold' : 'text-slate-500'} flex items-center gap-1.5">
                ${pending.mappingId 
                  ? '<i class="fa-solid fa-circle-check text-emerald-600 mr-1"></i><span>Elective marked. Submit all selections below.</span>'
                  : '<i class="fa-regular fa-circle text-slate-400 mr-1"></i><span>Choose a subject and an available faculty above.</span>'}
              </div>
            `}
          </div>
        `}
      </div>
    `;
  }

  const oeCardsHtml = buildOECardHtml('OE1', 'Open Elective – I', oe1Subjects, coreSubjects.length + 1) +
                      buildOECardHtml('OE2', 'Open Elective – II', oe2Subjects, coreSubjects.length + 2);

  // Calculate combined progress
  const totalAllCourses = coreSubjects.length + (oe1Subjects.length > 0 ? 1 : 0) + (oe2Subjects.length > 0 ? 1 : 0);
  const confirmedCoreCount = coreSubjects.filter(sub => 
    STUDENT_SELECTIONS.some(s => s.subject_id === sub.id && s.status === 'CONFIRMED')
  ).length;
  const confirmedOe1 = oe1Subjects.some(sub => STUDENT_SELECTIONS.some(s => s.subject_id === sub.id && s.status === 'CONFIRMED'));
  const confirmedOe2 = oe2Subjects.some(sub => STUDENT_SELECTIONS.some(s => s.subject_id === sub.id && s.status === 'CONFIRMED'));
  const totalConfirmed = confirmedCoreCount + (confirmedOe1 ? 1 : 0) + (confirmedOe2 ? 1 : 0);

  const pendingCoreCount = coreSubjects.filter(sub => {
    const hasConf = STUDENT_SELECTIONS.some(s => s.subject_id === sub.id && s.status === 'CONFIRMED');
    return !hasConf && PENDING_SELECTIONS[sub.id];
  }).length;
  const pendingOe1Count = (!confirmedOe1 && PENDING_OE_INTERNAL['OE1'] && PENDING_OE_INTERNAL['OE1'].mappingId) ? 1 : 0;
  const pendingOe2Count = (!confirmedOe2 && PENDING_OE_INTERNAL['OE2'] && PENDING_OE_INTERNAL['OE2'].mappingId) ? 1 : 0;

  const totalFilled = totalConfirmed + pendingCoreCount + pendingOe1Count + pendingOe2Count;
  const isAllFilled = totalFilled >= totalAllCourses && totalAllCourses > 0;
  const remaining = totalAllCourses - totalFilled;

  // Single Master Confirmation Card at the bottom of the form
  const bottomSubmitBar = `
    <div class="sticky bottom-4 z-20 mt-8 bg-white/95 backdrop-blur-md rounded-2xl border-2 ${isAllFilled ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20' : 'border-slate-300 shadow-xl'} p-5 sm:p-6 transition-all">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-3 h-3 rounded-full ${isAllFilled ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}"></span>
            <h4 class="text-base font-black text-slate-900">
              Course Selection Summary (${totalFilled} / ${totalAllCourses} Chosen)
            </h4>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            ${isAllFilled 
              ? '🎉 All courses have a selected faculty! Confirm your choices above or download your confirmation slip.' 
              : `Please mark your faculty choice for all courses before submitting (${remaining} course${remaining > 1 ? 's' : ''} remaining).`}
          </p>
        </div>

        <div class="flex items-center gap-3">
          ${(pendingCoreCount + pendingOe1Count + pendingOe2Count > 0 && isLiveActive) ? `
            <button 
              onclick="openBatchConfirmationModal()"
              class="w-full md:w-auto px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 cursor-pointer">
              <i class="fa-solid fa-lock text-sm"></i>
              <span>Confirm All Selected (${pendingCoreCount + pendingOe1Count + pendingOe2Count})</span>
            </button>
          ` : (isAllFilled ? `
            <button 
              onclick="switchStudentTab('selections')"
              class="w-full md:w-auto px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 cursor-pointer">
              <i class="fa-solid fa-circle-check text-sm"></i>
              <span>View Confirmed Courses</span>
            </button>
          ` : `
            <span class="text-xs font-semibold text-slate-500">${remaining} courses to choose</span>
          `)}
        </div>
      </div>
    </div>
  `;

  container.innerHTML = formHeaderHtml + regularSubjectsHtml + oeCardsHtml + bottomSubmitBar;
}

// Master Confirmation Modal reviewing all chosen faculties
function openBatchConfirmationModal() {
  const chosenMappings = [];
  const subjectsToConfirm = [];

  // 1. Regular Core Subjects
  const coreSubjects = STUDENT_SUBJECTS.filter(s => (!s.elective_group || s.elective_group === 'NONE') && s.status === 'ACTIVE');
  for (const subject of coreSubjects) {
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

  // 2. Open Elective – I
  const confirmedOe1 = STUDENT_SELECTIONS.some(s => {
    const sub = STUDENT_SUBJECTS.find(sub => sub.id === s.subject_id);
    return sub && sub.elective_group === 'OE1' && s.status === 'CONFIRMED';
  });
  if (!confirmedOe1 && PENDING_OE_INTERNAL['OE1'] && PENDING_OE_INTERNAL['OE1'].mappingId) {
    const p = PENDING_OE_INTERNAL['OE1'];
    const mapping = STUDENT_MAPPINGS.find(m => m.id === p.mappingId);
    const subject = STUDENT_SUBJECTS.find(s => s.id === p.subjectId);
    if (mapping && subject) {
      chosenMappings.push(mapping.id);
      subjectsToConfirm.push({
        subjectName: `[Open Elective – I] ${subject.name}`,
        subjectCode: subject.code,
        facultyName: mapping.faculty_name,
        facultyDesignation: mapping.faculty_designation || mapping.designation
      });
    }
  }

  // 3. Open Elective – II
  const confirmedOe2 = STUDENT_SELECTIONS.some(s => {
    const sub = STUDENT_SUBJECTS.find(sub => sub.id === s.subject_id);
    return sub && sub.elective_group === 'OE2' && s.status === 'CONFIRMED';
  });
  if (!confirmedOe2 && PENDING_OE_INTERNAL['OE2'] && PENDING_OE_INTERNAL['OE2'].mappingId) {
    const p = PENDING_OE_INTERNAL['OE2'];
    const mapping = STUDENT_MAPPINGS.find(m => m.id === p.mappingId);
    const subject = STUDENT_SUBJECTS.find(s => s.id === p.subjectId);
    if (mapping && subject) {
      chosenMappings.push(mapping.id);
      subjectsToConfirm.push({
        subjectName: `[Open Elective – II] ${subject.name}`,
        subjectCode: subject.code,
        facultyName: mapping.faculty_name,
        facultyDesignation: mapping.faculty_designation || mapping.designation
      });
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
  const coreSubjects = STUDENT_SUBJECTS.filter(s => (!s.elective_group || s.elective_group === 'NONE') && s.status === 'ACTIVE');
  for (const subject of coreSubjects) {
    const isAlreadyConfirmed = STUDENT_SELECTIONS.find(s => s.subject_id === subject.id && s.status === 'CONFIRMED');
    if (!isAlreadyConfirmed && PENDING_SELECTIONS[subject.id]) {
      mappingIds.push(PENDING_SELECTIONS[subject.id]);
    }
  }

  const confirmedOe1 = STUDENT_SELECTIONS.some(s => {
    const sub = STUDENT_SUBJECTS.find(sub => sub.id === s.subject_id);
    return sub && sub.elective_group === 'OE1' && s.status === 'CONFIRMED';
  });
  if (!confirmedOe1 && PENDING_OE_INTERNAL['OE1'] && PENDING_OE_INTERNAL['OE1'].mappingId) {
    mappingIds.push(PENDING_OE_INTERNAL['OE1'].mappingId);
  }

  const confirmedOe2 = STUDENT_SELECTIONS.some(s => {
    const sub = STUDENT_SUBJECTS.find(sub => sub.id === s.subject_id);
    return sub && sub.elective_group === 'OE2' && s.status === 'CONFIRMED';
  });
  if (!confirmedOe2 && PENDING_OE_INTERNAL['OE2'] && PENDING_OE_INTERNAL['OE2'].mappingId) {
    mappingIds.push(PENDING_OE_INTERNAL['OE2'].mappingId);
  }

  try {
    const res = await api.post('/api/selections/reserve-batch', { mapping_ids: mappingIds });

    if (res && res.success) {
      closeModal();
      showToast(res.message || 'All faculty choices confirmed successfully!', 'success');
      // Clear pending
      PENDING_SELECTIONS = {};
      PENDING_OE_INTERNAL = {
        'OE1': { subjectId: null, mappingId: null },
        'OE2': { subjectId: null, mappingId: null }
      };
      await loadStudentData();
      switchStudentTab('selections');
    }
  } catch (err) {
    closeModal();
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-check-double"></i><span>Try Again</span>`;
    }

    // Refresh live seat counts from server so student sees current vacancies immediately
    await loadStudentData();

    const fullSubId = err.full_subject_id;
    const fullFacName = err.full_faculty_name;
    const fullSubName = err.full_subject_name;

    // Clear that full faculty choice from pending selections
    if (fullSubId && PENDING_SELECTIONS[fullSubId]) {
      delete PENDING_SELECTIONS[fullSubId];
    }
    renderStudentSubjects();

    // High-visibility dialog prompting the student to choose another faculty
    openModal({
      title: 'Faculty Seat Capacity Reached',
      maxWidth: 'max-w-md',
      body: `
        <div class="text-center space-y-4 py-2">
          <div class="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl shadow-inner border border-rose-100">
            <i class="fa-solid fa-user-xmark"></i>
          </div>
          <div>
            <h4 class="text-base font-black text-slate-900">Seat Capacity Filled!</h4>
            <p class="text-xs text-rose-700 font-semibold mt-1">
              ${err.message || 'All seats for this faculty were just claimed by other students.'}
            </p>
          </div>
          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-left space-y-2">
            <div class="font-bold text-slate-800 flex items-center gap-1.5">
              <i class="fa-solid fa-circle-info text-blue-600"></i>
              <span>Next Steps:</span>
            </div>
            <p>Another student claimed the last available seat before your submission arrived. Please select one of the other available teachers for <strong>${fullSubName || 'this subject'}</strong> to proceed.</p>
          </div>
        </div>
      `,
      footer: `
        <button onclick="closeModalAndHighlightSubject(${fullSubId || 'null'})" class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01]">
          <span>Select Another Faculty for This Course</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      `
    });
  }
}

function closeModalAndHighlightSubject(subId) {
  closeModal();
  if (subId) {
    setTimeout(() => {
      const el = document.getElementById(`subject-card-${subId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-amber-400');
        setTimeout(() => el.classList.remove('ring-4', 'ring-amber-400'), 3500);
      }
    }, 150);
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
      const isFull = m.availability_status === 'FULL';
      const availabilityColor = isFull ? 'bg-rose-500' : (m.availability_status === 'FILLING_FAST' ? 'bg-amber-400' : 'bg-emerald-500');
      const availabilityTextColor = isFull ? 'text-rose-700' : (m.availability_status === 'FILLING_FAST' ? 'text-amber-700' : 'text-emerald-700');

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
              
              <div class="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold ${availabilityTextColor}" aria-label="Faculty availability: ${m.availability_label}">
                <span class="w-2.5 h-2.5 rounded-full ${availabilityColor}" aria-hidden="true"></span>
                <span>${m.availability_label}</span>
                ${isFull ? '<span>· Faculty Capacity Reached</span>' : ''}
              </div>

              <!-- Selection Button -->
              <div class="mt-4 flex justify-end">
                ${isFull ? `
                  <button type="button" disabled aria-disabled="true" class="px-4 py-2 bg-slate-200 text-slate-400 font-bold rounded-xl text-xs cursor-not-allowed flex items-center gap-1.5">
                    <i class="fa-solid fa-ban"></i>
                    <span>Faculty Capacity Reached</span>
                  </button>
                ` : `
                  <button onclick="confirmFacultyReservation(${m.mapping_id}, '${escapeQuote(m.faculty_name)}', '${escapeQuote(subject.name)}', '${escapeQuote(subject.code)}')" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/25 transition-all flex items-center gap-2">
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
function confirmFacultyReservation(mappingId, facultyName, subjectName, subjectCode) {
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
    closeModal();
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-check-double"></i><span>Try Again</span>`;
    }
    showToast(err.message || 'Seat is full! Please choose another faculty.', 'error');
    await loadStudentData();
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
    <div id="master-registration-slip" class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 class="text-base font-bold text-slate-900">Official Course & Faculty Registration Slip</h4>
          <p class="text-xs text-slate-500">Student: <strong>${STATE.student.name}</strong> (${STATE.student.reg_no}) &bull; Year ${STATE.student.academic_year}, Sem ${STATE.student.semester}, Sec ${STATE.student.section}</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="downloadMasterSlipScreenshot()" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition">
            <i class="fa-solid fa-download"></i>
            <span>Download Complete Slip</span>
          </button>
          <div class="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <i class="fa-solid fa-check-circle mr-1"></i> ${confirmed.length} Course(s) Confirmed
          </div>
        </div>
      </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5 sm:p-6 bg-slate-50/60">
      ${confirmed.map(s => `
        <section class="space-y-3">
          <article id="selection-confirmation-${s.id}" class="selection-confirmation-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 text-white">
              <div class="flex items-center gap-3">
                <img src="/college_logo.jpg" alt="RGMCET logo" class="h-12 w-12 rounded-lg bg-white object-contain p-1">
                <div class="min-w-0">
                  <div class="text-[11px] font-black uppercase tracking-wide">Rajeev Gandhi Memorial College of Engineering &amp; Technology</div>
                  <div class="mt-1 text-[10px] font-semibold text-blue-200">Department of Computer Science and Engineering</div>
                </div>
                <img src="/cse_logo.png" alt="Department of CSE logo" class="ml-auto hidden h-12 w-12 rounded-lg bg-white object-contain p-1 sm:block">
              </div>
              <h4 class="mt-5 text-base font-black uppercase tracking-wider">Faculty Selection Confirmation</h4>
            </div>
            <div class="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
              <div class="rounded-xl bg-slate-50 p-3">
                <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registration Number</div>
                <div class="mono-font mt-1 break-words text-sm font-bold text-slate-900">${STATE.student.reg_no}</div>
              </div>
              <div class="rounded-xl bg-slate-50 p-3">
                <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Student Name</div>
                <div class="mt-1 break-words text-sm font-bold text-slate-900">${STATE.student.name}</div>
              </div>
              <div class="rounded-xl bg-slate-50 p-3">
                <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Selected Subject</div>
                <div class="mt-1 break-words text-sm font-bold text-slate-900">${s.subject_elective_group ? `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-700 mr-1.5">${s.subject_elective_group === 'OE1' ? 'Open Elective – I' : 'Open Elective – II'}</span>` : ''}${s.subject_name}</div>
                <div class="mono-font mt-0.5 text-[11px] text-slate-500">${s.subject_code}</div>
              </div>
              <div class="rounded-xl bg-slate-50 p-3">
                <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Selected Faculty</div>
                <div class="mt-1 break-words text-sm font-bold text-slate-900">${s.faculty_name}</div>
              </div>
              <div class="rounded-xl bg-emerald-50 p-3">
                <div class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Selection Status</div>
                <div class="mt-1 inline-flex items-center gap-2 text-sm font-black text-emerald-800">
                  <span class="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true"></span>Confirmed
                </div>
              </div>
              <div class="rounded-xl bg-slate-50 p-3">
                <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Selection Date &amp; Time</div>
                <div class="mt-1 break-words text-sm font-bold text-slate-900">${new Date(s.reserved_at).toLocaleString()}</div>
              </div>
            </div>
          </article>
          <div class="flex justify-end no-print">
            <button onclick="downloadSelectionScreenshot('${s.id}')" class="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800">
              <i class="fa-solid fa-download" aria-hidden="true"></i>
              <span>Download Screenshot</span>
            </button>
          </div>
        </section>
      `).join('')}
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
                <div class="mono-font text-[11px] text-blue-600">${s.subject_code} &bull; 3 Credits</div>
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
    </div>
  `;
}

async function downloadMasterSlipScreenshot() {
  const slipEl = document.getElementById('master-registration-slip');
  if (!slipEl || !STATE.student) {
    showToast('Registration slip element not found.', 'error');
    return;
  }
  const safeName = `${STATE.student.reg_no}-registration-slip`.replace(/[^a-z0-9_-]/gi, '-');
  try {
    if (typeof html2canvas === 'function') {
      const canvas = await html2canvas(slipEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `${safeName}.png`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        showToast('Registration slip screenshot downloaded successfully!', 'success');
        return;
      }
    }
    window.print();
  } catch (err) {
    console.error('Failed to capture master slip:', err);
    window.print();
  }
}

async function downloadSelectionScreenshot(selectionId) {
  try {
    const isOe = String(selectionId).startsWith('oe-');
    let subjectCode = 'COURSE';
    if (isOe) {
      const oeId = parseInt(String(selectionId).replace('oe-', ''), 10);
      const oeReg = (STUDENT_OE_MY && STUDENT_OE_MY.registrations) ? STUDENT_OE_MY.registrations.find(r => r.id === oeId) : null;
      if (oeReg) subjectCode = oeReg.subject_code || 'OE';
    } else {
      const selection = STUDENT_SELECTIONS.find(s => s.id === selectionId && s.status === 'CONFIRMED');
      if (selection) subjectCode = selection.subject_code;
    }

    const cardEl = document.getElementById(`selection-confirmation-${selectionId}`);
    if (!cardEl || !STATE.student) {
      throw new Error('The confirmed selection could not be found.');
    }
    const safeName = `${STATE.student.reg_no}-${subjectCode}-confirmation`.replace(/[^a-z0-9_-]/gi, '-');

    // 1. Try html2canvas DOM capture first (high-resolution capture of exact card element)
    if (typeof html2canvas === 'function' && cardEl) {
      try {
        const capturedCanvas = await html2canvas(cardEl, {
          scale: 2.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        const blob = await new Promise(resolve => capturedCanvas.toBlob(resolve, 'image/png'));
        if (blob) {
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = `${safeName}.png`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
          showToast('Confirmation screenshot downloaded successfully!', 'success');
          return;
        }
      } catch (domErr) {
        console.warn('html2canvas capture fallback to 2D canvas engine:', domErr);
      }
    }

    // 2. High-resolution standalone 2D canvas fallback
    const [collegeLogo, departmentLogo] = await Promise.all([
      loadScreenshotImage('/college_logo.jpg'),
      loadScreenshotImage('/cse_logo.png')
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1260;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('PNG image generation is not supported by this browser.');

    context.fillStyle = '#f1f5f9';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawScreenshotRoundedRect(context, 56, 48, 1488, 1164, 34, '#ffffff');
    context.strokeStyle = '#dbe3ee';
    context.lineWidth = 2;
    context.stroke();

    context.save();
    context.beginPath();
    context.roundRect(56, 48, 1488, 292, 34);
    context.clip();
    const headerGradient = context.createLinearGradient(56, 48, 1544, 340);
    headerGradient.addColorStop(0, '#0f172a');
    headerGradient.addColorStop(0.5, '#172554');
    headerGradient.addColorStop(1, '#0f172a');
    context.fillStyle = headerGradient;
    context.fillRect(56, 48, 1488, 292);
    context.restore();

    drawScreenshotRoundedRect(context, 104, 100, 144, 144, 18, '#ffffff');
    drawScreenshotRoundedRect(context, 1352, 100, 144, 144, 18, '#ffffff');
    context.drawImage(collegeLogo, 118, 114, 116, 116);
    context.drawImage(departmentLogo, 1366, 114, 116, 116);

    context.textAlign = 'center';
    context.fillStyle = '#ffffff';
    context.font = '800 25px Arial, sans-serif';
    context.fillText('RAJEEV GANDHI MEMORIAL COLLEGE OF', 800, 124);
    context.fillText('ENGINEERING & TECHNOLOGY', 800, 160);
    context.fillStyle = '#bfdbfe';
    context.font = '600 19px Arial, sans-serif';
    context.fillText('Department of Computer Science and Engineering', 800, 198);
    context.fillStyle = '#ffffff';
    context.font = '800 27px Arial, sans-serif';
    context.fillText('FACULTY SELECTION CONFIRMATION', 800, 278);

    const dateTime = new Date(selection.reserved_at).toLocaleString();
    const fields = [
      { label: 'REGISTRATION NUMBER', value: STATE.student.reg_no, x: 112, y: 402 },
      { label: 'STUDENT NAME', value: STATE.student.name, x: 832, y: 402 },
      { label: 'SELECTED SUBJECT', value: `${selection.subject_name} (${selection.subject_code})`, x: 112, y: 584 },
      { label: 'SELECTED FACULTY', value: selection.faculty_name, x: 832, y: 584 },
      { label: 'SELECTION STATUS', value: 'CONFIRMED', x: 112, y: 766, confirmed: true },
      { label: 'SELECTION DATE & TIME', value: dateTime, x: 832, y: 766 }
    ];

    fields.forEach(field => {
      drawScreenshotRoundedRect(context, field.x, field.y, 656, 142, 18, field.confirmed ? '#ecfdf5' : '#f8fafc');
      context.textAlign = 'left';
      context.fillStyle = field.confirmed ? '#047857' : '#64748b';
      context.font = '700 17px Arial, sans-serif';
      context.fillText(field.label, field.x + 26, field.y + 42);
      context.fillStyle = field.confirmed ? '#065f46' : '#0f172a';
      context.font = '700 25px Arial, sans-serif';
      drawScreenshotWrappedText(context, field.value, field.x + 26, field.y + 88, 600, 32);
    });

    context.fillStyle = '#64748b';
    context.textAlign = 'center';
    context.font = '500 16px Arial, sans-serif';
    context.fillText('Official selection confirmation • RGMCET', 800, 1064);

    const png = await new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('The confirmation image could not be generated.'));
      }, 'image/png');
    });
    const objectUrl = URL.createObjectURL(png);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${safeName}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (error) {
    console.error('Failed to generate selection confirmation screenshot:', error);
    showToast(error.message || 'Could not download the selection screenshot.', 'error');
  }
}

function loadScreenshotImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('College branding image could not be loaded.'));
    image.src = src;
  });
}

function drawScreenshotRoundedRect(context, x, y, width, height, radius, fill) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
}

function drawScreenshotWrappedText(context, value, x, y, maxWidth, lineHeight) {
  const words = String(value).split(/\s+/);
  let line = '';
  let lineY = y;

  words.forEach(word => {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width > maxWidth && line) {
      context.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = nextLine;
    }
  });
  if (line) context.fillText(line, x, lineY);
}

function escapeQuote(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// =========================================================================
// OPEN ELECTIVE SELECTION SYSTEM (3rd Year B.Tech)
// =========================================================================
let STUDENT_OE_DATA = null;
let STUDENT_OE_MY = null;
let PENDING_OE_SELECTIONS = {}; // { [electiveId]: { subjectId, assignmentId } }

async function loadStudentOpenElectives() {
  // Legacy stub: Open electives are integrated directly into Eligible Subjects & Faculty Selection
  return;
}

function renderStudentOpenElectives() {
  const container = document.getElementById('stu-oe-container');
  if (!container) return;

  // 1. Eligibility Check (3rd Year Only)
  if (!STATE.student || STATE.student.academic_year !== 3) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl p-10 border border-slate-200 text-center max-w-xl mx-auto shadow-sm space-y-4">
        <div class="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl shadow-inner border border-amber-100">
          <i class="fa-solid fa-graduation-cap"></i>
        </div>
        <div>
          <h3 class="text-base font-black text-slate-900">Open Elective Selection is Exclusively for 3rd Year Students</h3>
          <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Your candidate account is registered under <strong>Year ${STATE.student ? STATE.student.academic_year : 'N/A'}</strong>. Only 3rd Year (B.Tech) students are eligible to participate in Open Elective I & II registrations.
          </p>
        </div>
        <div class="pt-2">
          <button onclick="switchStudentTab('subjects')" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 transition">
            <i class="fa-solid fa-arrow-left mr-1.5"></i> Go to Core Subjects
          </button>
        </div>
      </div>
    `;
    return;
  }

  const electives = STUDENT_OE_DATA || [];
  const myData = STUDENT_OE_MY || { registrations: [], overall_status: 'NOT_STARTED', status_label: 'Not Started' };
  const registrations = myData.registrations || [];
  const isCompleted = myData.overall_status === 'REGISTRATION_COMPLETED' || registrations.length >= electives.length;

  // 2. Progression Stepper Header
  const statusColors = {
    'NOT_STARTED': 'bg-slate-100 text-slate-700 border-slate-200',
    'OE_1_COMPLETED': 'bg-amber-100 text-amber-800 border-amber-200',
    'OE_2_COMPLETED': 'bg-amber-100 text-amber-800 border-amber-200',
    'PARTIALLY_COMPLETED': 'bg-amber-100 text-amber-800 border-amber-200',
    'REGISTRATION_COMPLETED': 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };

  const statusIcons = {
    'NOT_STARTED': 'fa-hourglass-start',
    'OE_1_COMPLETED': 'fa-circle-half-stroke text-amber-600',
    'OE_2_COMPLETED': 'fa-circle-half-stroke text-amber-600',
    'PARTIALLY_COMPLETED': 'fa-circle-half-stroke text-amber-600',
    'REGISTRATION_COMPLETED': 'fa-circle-check text-emerald-600'
  };

  let headerHtml = `
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-indigo-600"></span>
            <h3 class="text-base font-bold text-slate-900">3rd Year Open Elective Subject & Faculty Selection</h3>
          </div>
          <p class="text-xs text-slate-500 mt-1">
            Every 3rd-year student must select exactly <strong>one subject and one faculty from Open Elective – I</strong> and <strong>one subject and one faculty from Open Elective – II</strong>.
          </p>
        </div>
        <div class="flex items-center gap-2 self-start md:self-auto">
          <span class="px-3 py-1.5 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${statusColors[myData.overall_status] || statusColors.NOT_STARTED}">
            <i class="fa-solid ${statusIcons[myData.overall_status] || statusIcons.NOT_STARTED}"></i>
            <span>${myData.status_label || 'Not Started'}</span>
          </span>
          <button onclick="loadStudentOpenElectives()" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition" title="Refresh">
            <i class="fa-solid fa-rotate text-xs"></i>
          </button>
        </div>
      </div>

      <!-- Candidate Meta Strip -->
      <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div>
          Candidate: <strong class="text-slate-900">${STATE.student.name}</strong> (<span class="mono-font">${STATE.student.reg_no}</span>) &bull; <span class="px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Year 3 &bull; Sem 6</span>
        </div>
        <div class="font-medium text-slate-700">
          Strict First-Come, First-Served Allocation
        </div>
      </div>
    </div>
  `;

  // 3. If Both Electives are Confirmed -> Display Official Confirmation Slip Card
  if (isCompleted) {
    const oe1Reg = registrations.find(r => r.elective_code === 'OE-1' || r.elective_name.includes('I')) || registrations[0];
    const oe2Reg = registrations.find(r => r.elective_code === 'OE-2' || r.elective_name.includes('II')) || registrations[1];

    let confirmationHtml = `
      <div class="space-y-4 max-w-3xl mx-auto">
        <article id="open-elective-confirmation-card" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <!-- College Branding Header -->
          <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <img src="/college_logo.jpg" alt="RGMCET logo" class="h-12 w-12 rounded-lg bg-white object-contain p-1">
                <div>
                  <div class="text-[11px] font-black uppercase tracking-wide">Rajeev Gandhi Memorial College of Engineering &amp; Technology</div>
                  <div class="mt-0.5 text-[10px] font-semibold text-blue-200">Department of Computer Science and Engineering</div>
                </div>
              </div>
              <img src="/cse_logo.png" alt="CSE logo" class="ml-auto hidden h-12 w-12 rounded-lg bg-white object-contain p-1 sm:block">
            </div>
            <div class="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
              <h4 class="text-sm font-black uppercase tracking-widest text-indigo-200">Official Open Elective Registration Slip</h4>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                CONFIRMED
              </span>
            </div>
          </div>

          <!-- Student Info Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-5 bg-slate-50/70 border-b border-slate-200 text-xs">
            <div class="rounded-xl bg-white p-3 border border-slate-200/80">
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registration Number</div>
              <div class="mono-font mt-1 font-bold text-slate-900">${STATE.student.reg_no}</div>
            </div>
            <div class="rounded-xl bg-white p-3 border border-slate-200/80">
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Student Name</div>
              <div class="mt-1 font-bold text-slate-900 truncate">${STATE.student.name}</div>
            </div>
            <div class="rounded-xl bg-white p-3 border border-slate-200/80">
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic Cohort</div>
              <div class="mt-1 font-bold text-slate-900">Year 3 &bull; Sem 6</div>
            </div>
            <div class="rounded-xl bg-white p-3 border border-slate-200/80">
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Section / Group</div>
              <div class="mt-1 font-bold text-slate-900">${STATE.student.section || 'Group 1'}</div>
            </div>
          </div>

          <!-- Confirmed Elective Allocations -->
          <div class="p-6 space-y-5">
            <!-- Open Elective I -->
            ${oe1Reg ? `
              <div class="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40">
                <div class="flex items-center justify-between">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                    ${oe1Reg.elective_name}
                  </span>
                  <span class="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <i class="fa-solid fa-circle-check"></i> Confirmed
                  </span>
                </div>
                <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <div class="text-[10px] uppercase font-bold text-slate-400">Selected Subject</div>
                    <div class="text-sm font-bold text-slate-900 mt-0.5">${oe1Reg.subject_name}</div>
                    <div class="mono-font text-[11px] text-blue-600">${oe1Reg.subject_code}</div>
                  </div>
                  <div>
                    <div class="text-[10px] uppercase font-bold text-slate-400">Allocated Faculty</div>
                    <div class="text-sm font-bold text-indigo-900 mt-0.5">${oe1Reg.faculty_name}</div>
                    <div class="text-[11px] text-slate-500">${oe1Reg.faculty_designation || 'Faculty Member'}</div>
                  </div>
                </div>
                <div class="mt-3 pt-2 border-t border-indigo-100 text-[10px] text-slate-400 mono-font">
                  Allocated Timestamp: ${new Date(oe1Reg.registration_timestamp).toLocaleString()}
                </div>
              </div>
            ` : ''}

            <!-- Open Elective II -->
            ${oe2Reg ? `
              <div class="p-4 rounded-xl border border-purple-200 bg-purple-50/40">
                <div class="flex items-center justify-between">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 uppercase tracking-wider">
                    ${oe2Reg.elective_name}
                  </span>
                  <span class="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <i class="fa-solid fa-circle-check"></i> Confirmed
                  </span>
                </div>
                <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <div class="text-[10px] uppercase font-bold text-slate-400">Selected Subject</div>
                    <div class="text-sm font-bold text-slate-900 mt-0.5">${oe2Reg.subject_name}</div>
                    <div class="mono-font text-[11px] text-blue-600">${oe2Reg.subject_code}</div>
                  </div>
                  <div>
                    <div class="text-[10px] uppercase font-bold text-slate-400">Allocated Faculty</div>
                    <div class="text-sm font-bold text-purple-900 mt-0.5">${oe2Reg.faculty_name}</div>
                    <div class="text-[11px] text-slate-500">${oe2Reg.faculty_designation || 'Faculty Member'}</div>
                  </div>
                </div>
                <div class="mt-3 pt-2 border-t border-purple-100 text-[10px] text-slate-400 mono-font">
                  Allocated Timestamp: ${new Date(oe2Reg.registration_timestamp).toLocaleString()}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Card Footer -->
          <div class="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-lock text-slate-400"></i>
              <span>Permanent Registration. Contact Department Administrator for modifications.</span>
            </div>
            <div class="mono-font text-[11px] text-slate-400">
              Verification ID: OE-${STATE.student.reg_no}-${Date.now().toString(36).toUpperCase()}
            </div>
          </div>
        </article>

        <!-- Actions -->
        <div class="flex flex-wrap items-center justify-end gap-3 no-print">
          <button onclick="window.print()" class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition">
            <i class="fa-solid fa-print"></i>
            <span>Print Slip</span>
          </button>
          <button onclick="downloadOpenElectiveScreenshot()" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center gap-2 transition">
            <i class="fa-solid fa-download"></i>
            <span>Download Screenshot (PNG)</span>
          </button>
        </div>
      </div>
    `;

    container.innerHTML = headerHtml + confirmationHtml;
    return;
  }

  // 4. Selection Interface: Render Selection Card 1 and Selection Card 2
  const cardsHtml = electives.map((elective, eIdx) => {
    const isConfirmed = registrations.find(r => r.elective_id === elective.id);
    const pending = PENDING_OE_SELECTIONS[elective.id] || { subjectId: null, assignmentId: null };
    const subjects = elective.subjects || [];

    // Find selected subject's assigned faculties
    const chosenSubject = subjects.find(s => s.id === pending.subjectId);
    const assignedFaculties = chosenSubject ? (chosenSubject.faculty_assignments || []) : [];

    return `
      <section class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6 transition-all">
        <!-- Card Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg ${isConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'} flex items-center justify-center font-black text-xs">
                ${eIdx + 1}
              </span>
              <h4 class="text-base font-black text-slate-900">${elective.name}</h4>
            </div>
            <p class="text-xs text-slate-500 mt-1">Select one subject, then choose one available faculty member.</p>
          </div>
          <div>
            ${isConfirmed ? `
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
                <i class="fa-solid fa-circle-check"></i> Confirmed & Locked
              </span>
            ` : `
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5">
                <i class="fa-solid fa-hourglass-start text-amber-600"></i> Selection Pending
              </span>
            `}
          </div>
        </div>

        ${isConfirmed ? `
          <!-- Confirmed View for this elective -->
          <div class="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-500">Selected Subject</span>
                <div class="text-sm font-bold text-slate-900 mt-0.5">${isConfirmed.subject_name}</div>
                <div class="mono-font text-[11px] text-blue-600">${isConfirmed.subject_code}</div>
              </div>
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-500">Allocated Faculty</span>
                <div class="text-sm font-bold text-emerald-900 mt-0.5">${isConfirmed.faculty_name}</div>
                <div class="text-[11px] text-slate-500">${isConfirmed.faculty_designation || 'Faculty Member'}</div>
              </div>
            </div>
            <div class="pt-2 border-t border-emerald-200/60 text-[10px] text-slate-400">
              Permanently confirmed on ${new Date(isConfirmed.registration_timestamp).toLocaleString()}
            </div>
          </div>
        ` : `
          <!-- Active Interactive Selection Steps -->
          <div class="space-y-5">
            <!-- Step 1: Select Subject -->
            <div>
              <div class="flex items-center gap-2 mb-2.5">
                <span class="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px]">1</span>
                <label class="text-xs font-bold text-slate-800 uppercase tracking-wider">Step 1: Choose Elective Subject</label>
              </div>

              ${subjects.length === 0 ? `
                <div class="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No subjects configured for this open elective yet.
                </div>
              ` : `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  ${subjects.map(sub => {
                    const isSubSelected = pending.subjectId === sub.id;
                    return `
                      <div 
                        onclick="selectOESubject(${elective.id}, ${sub.id})"
                        class="p-4 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${isSubSelected 
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/25 shadow-sm' 
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/80'}">
                        <div>
                          <div class="flex items-center justify-between gap-2">
                            <span class="mono-font text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">${sub.subject_code || 'OE'}</span>
                            <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSubSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}">
                              ${isSubSelected ? '<i class="fa-solid fa-check text-[9px]"></i>' : ''}
                            </div>
                          </div>
                          <h5 class="text-xs font-bold text-slate-900 mt-2 line-clamp-2">${sub.subject_name}</h5>
                          ${sub.description ? `<p class="text-[11px] text-slate-500 mt-1 line-clamp-2">${sub.description}</p>` : ''}
                        </div>
                        <div class="mt-3 pt-2 border-t border-slate-100 text-[10px] text-indigo-700 font-semibold flex items-center gap-1">
                          <span>${sub.faculty_assignments ? sub.faculty_assignments.length : 0} faculties available</span>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>

            <!-- Step 2: Select Faculty for Selected Subject -->
            ${pending.subjectId ? `
              <div class="pt-2 border-t border-slate-100">
                <div class="flex items-center justify-between gap-2 mb-2.5">
                  <div class="flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px]">2</span>
                    <label class="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Step 2: Choose Faculty for <span class="text-indigo-600 font-black">${chosenSubject ? chosenSubject.subject_name : 'Selected Subject'}</span>
                    </label>
                  </div>
                  <span class="text-[11px] text-slate-400 font-medium">Click oval to pick</span>
                </div>

                ${assignedFaculties.length === 0 ? `
                  <div class="p-4 text-center text-xs text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
                    No faculty assigned to this subject yet. Please contact the administrator or select another subject.
                  </div>
                ` : `
                  <div class="space-y-2.5">
                    ${assignedFaculties.map(fa => {
                      const isFull = fa.availability_status === 'FULL' || fa.is_full;
                      const isFillingFast = fa.availability_status === 'FILLING_FAST';
                      const isFacSelected = pending.assignmentId === fa.assignment_id;

                      return `
                        <div 
                          onclick="${!isFull ? `selectOEFaculty(${elective.id}, ${fa.assignment_id})` : ''}"
                          class="p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${isFacSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/25 cursor-pointer'
                            : (isFull ? 'border-rose-200 bg-rose-50/40 opacity-70 cursor-not-allowed' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 cursor-pointer shadow-sm')}">
                          
                          <div class="flex items-center gap-3 min-w-0">
                            <!-- Radio Oval -->
                            <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isFacSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : (isFull ? 'border-rose-300 bg-rose-100 text-rose-500' : 'border-slate-400 bg-white hover:border-indigo-500')}">
                              ${isFacSelected ? '<i class="fa-solid fa-check text-[10px]"></i>' : (isFull ? '<i class="fa-solid fa-xmark text-[10px]"></i>' : '')}
                            </div>

                            <div class="min-w-0">
                              <div class="text-xs font-bold ${isFull ? 'text-slate-500' : 'text-slate-900'} truncate flex items-center gap-2">
                                <span>${fa.faculty_name}</span>
                                <span class="w-2 h-2 rounded-full ${isFull ? 'bg-rose-500' : (isFillingFast ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500')} flex-shrink-0"></span>
                              </div>
                              <div class="text-[11px] text-slate-500 truncate mt-0.5">
                                ${fa.designation || 'Faculty'} &bull; ${fa.qualification || 'B.Tech / M.Tech / Ph.D'}
                              </div>
                            </div>
                          </div>

                          <!-- Availability Indicator Badge (No numeric seats exposed) -->
                          <div class="flex items-center gap-2 flex-shrink-0">
                            ${isFull ? `
                              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                                <span>Faculty Capacity Reached</span>
                              </span>
                            ` : (isFillingFast ? `
                              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>Filling Fast</span>
                              </span>
                            ` : `
                              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span>Available</span>
                              </span>
                            `)}
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                `}
              </div>
            ` : `
              <div class="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                <i class="fa-solid fa-arrow-up text-indigo-500 mr-1.5"></i> Please select a subject above to reveal the available faculty members.
              </div>
            `}

            <!-- Step 3: Confirm Button for this Elective -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div class="text-xs text-slate-500">
                ${pending.assignmentId 
                  ? '<span class="text-indigo-700 font-bold"><i class="fa-solid fa-circle-check mr-1 text-emerald-600"></i> Faculty selected. Ready to confirm.</span>'
                  : 'Complete both Step 1 and Step 2 to confirm this elective.'}
              </div>
              <button 
                ${!pending.assignmentId ? 'disabled' : ''}
                onclick="confirmOESelection(${elective.id})"
                class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${pending.assignmentId 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}">
                <i class="fa-solid fa-lock"></i>
                <span>Confirm ${elective.name}</span>
              </button>
            </div>
          </div>
        `}
      </section>
    `;
  }).join('');

  // Sticky bottom batch bar if user has choices marked across electives
  const unconfirmedElectives = electives.filter(e => !registrations.some(r => r.elective_id === e.id));
  const readyToConfirmCount = unconfirmedElectives.filter(e => PENDING_OE_SELECTIONS[e.id] && PENDING_OE_SELECTIONS[e.id].assignmentId).length;
  const isAllReady = unconfirmedElectives.length > 0 && readyToConfirmCount === unconfirmedElectives.length;

  let bottomBarHtml = '';
  if (unconfirmedElectives.length > 1) {
    bottomBarHtml = `
      <div class="sticky bottom-4 z-20 mt-6 bg-white/95 backdrop-blur-md rounded-2xl border-2 ${isAllReady ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20' : 'border-slate-300 shadow-xl'} p-5 transition-all">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 class="text-sm font-black text-slate-900 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full ${isAllReady ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-600'}"></span>
              <span>Open Elective Registration Summary (${readyToConfirmCount} of ${unconfirmedElectives.length} Marked)</span>
            </h4>
            <p class="text-xs text-slate-500 mt-0.5">
              ${isAllReady ? '🎉 Both Open Electives are marked! Click to lock and finalize both registrations.' : 'Mark your preferred subject and faculty for both Open Elective I & II.'}
            </p>
          </div>
          <button 
            ${!isAllReady ? 'disabled' : ''}
            onclick="confirmAllOESelectionsBatch()"
            class="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${isAllReady 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 cursor-pointer' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'}">
            <i class="fa-solid fa-check-double"></i>
            <span>Submit & Confirm Both Electives</span>
          </button>
        </div>
      </div>
    `;
  }

  container.innerHTML = headerHtml + `<div class="space-y-6">${cardsHtml}</div>` + bottomBarHtml;
}

function selectOESubject(electiveId, subjectId) {
  if (!PENDING_OE_SELECTIONS[electiveId]) {
    PENDING_OE_SELECTIONS[electiveId] = { subjectId: null, assignmentId: null };
  }
  PENDING_OE_SELECTIONS[electiveId].subjectId = subjectId;
  PENDING_OE_SELECTIONS[electiveId].assignmentId = null; // reset faculty choice if subject changed
  renderStudentSubjects();
}

function selectOEFaculty(electiveId, assignmentId) {
  if (!PENDING_OE_SELECTIONS[electiveId]) {
    PENDING_OE_SELECTIONS[electiveId] = { subjectId: null, assignmentId: null };
  }
  PENDING_OE_SELECTIONS[electiveId].assignmentId = assignmentId;
  renderStudentSubjects();
}

async function confirmOESelection(electiveId) {
  if (!ACTIVE_ROUND || ACTIVE_ROUND.status !== 'ACTIVE') {
    showToast('Live selection has not been started yet. Please wait for the administrator to start live selection.', 'warning');
    return;
  }

  const pending = PENDING_OE_SELECTIONS[electiveId];
  if (!pending || !pending.subjectId || !pending.assignmentId) {
    showToast('Please select both a subject and an available faculty first.', 'warning');
    return;
  }

  try {
    const res = await api.post('/api/open-electives/reserve', {
      elective_id: electiveId,
      subject_id: pending.subjectId,
      faculty_assignment_id: pending.assignmentId
    });

    if (res && res.success) {
      showToast(res.message || 'Open elective selection confirmed successfully!', 'success');
      delete PENDING_OE_SELECTIONS[electiveId];
      await loadStudentData();
    }
  } catch (err) {
    showToast(err.message || 'Could not confirm selection.', 'error');
    await loadStudentData(); // refresh live status
  }
}

async function confirmAllOESelectionsBatch() {
  if (!ACTIVE_ROUND || ACTIVE_ROUND.status !== 'ACTIVE') {
    showToast('Live selection has not been started yet. Please wait for the administrator to start live selection.', 'warning');
    return;
  }

  const electives = STUDENT_OE_DATA || [];
  const myData = STUDENT_OE_MY || { registrations: [] };
  const registrations = myData.registrations || [];
  const unconfirmed = electives.filter(e => !registrations.some(r => r.elective_id === e.id));

  const selectionsToSubmit = [];
  for (const e of unconfirmed) {
    const pending = PENDING_OE_SELECTIONS[e.id];
    if (pending && pending.subjectId && pending.assignmentId) {
      selectionsToSubmit.push({
        elective_id: e.id,
        subject_id: pending.subjectId,
        faculty_assignment_id: pending.assignmentId
      });
    }
  }

  if (selectionsToSubmit.length === 0) {
    showToast('Please select both subjects and faculties before submitting.', 'warning');
    return;
  }

  try {
    const res = await api.post('/api/open-electives/reserve-batch', { selections: selectionsToSubmit });
    if (res && res.success) {
      showToast('All open elective selections confirmed successfully!', 'success');
      PENDING_OE_SELECTIONS = {};
      await loadStudentOpenElectives();
    }
  } catch (err) {
    showToast(err.message || 'Could not confirm open electives.', 'error');
    await loadStudentOpenElectives();
  }
}

async function downloadOpenElectiveScreenshot() {
  const cardEl = document.getElementById('open-elective-confirmation-card');
  if (!cardEl || !STATE.student) {
    showToast('Confirmation card element not found.', 'error');
    return;
  }

  const safeName = `${STATE.student.reg_no}-open-electives-confirmation`.replace(/[^a-z0-9_-]/gi, '-');

  // 1. Try html2canvas DOM capture
  if (typeof html2canvas === 'function') {
    try {
      const capturedCanvas = await html2canvas(cardEl, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const blob = await new Promise(resolve => capturedCanvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `${safeName}.png`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        showToast('Open Elective confirmation screenshot downloaded!', 'success');
        return;
      }
    } catch (domErr) {
      console.warn('html2canvas capture fallback to 2D canvas:', domErr);
    }
  }

  // 2. High-resolution standalone 2D canvas fallback
  try {
    const [collegeLogo, departmentLogo] = await Promise.all([
      loadScreenshotImage('/college_logo.jpg'),
      loadScreenshotImage('/cse_logo.png')
    ]);

    const myData = STUDENT_OE_MY || { registrations: [] };
    const regs = myData.registrations || [];

    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1260;
    const context = canvas.getContext('2d');

    context.fillStyle = '#f8fafc';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawScreenshotRoundedRect(context, 56, 48, 1488, 1164, 34, '#ffffff');
    context.strokeStyle = '#dbe3ee';
    context.lineWidth = 2;
    context.stroke();

    context.save();
    context.beginPath();
    context.roundRect(56, 48, 1488, 292, 34);
    context.clip();
    const grad = context.createLinearGradient(56, 48, 1544, 340);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#0f172a');
    context.fillStyle = grad;
    context.fillRect(56, 48, 1488, 292);
    context.restore();

    drawScreenshotRoundedRect(context, 104, 100, 144, 144, 18, '#ffffff');
    drawScreenshotRoundedRect(context, 1352, 100, 144, 144, 18, '#ffffff');
    context.drawImage(collegeLogo, 118, 114, 116, 116);
    context.drawImage(departmentLogo, 1366, 114, 116, 116);

    context.textAlign = 'center';
    context.fillStyle = '#ffffff';
    context.font = '800 25px Arial, sans-serif';
    context.fillText('RAJEEV GANDHI MEMORIAL COLLEGE OF', 800, 124);
    context.fillText('ENGINEERING & TECHNOLOGY', 800, 160);
    context.fillStyle = '#c7d2fe';
    context.font = '600 19px Arial, sans-serif';
    context.fillText('Department of Computer Science and Engineering', 800, 198);
    context.fillStyle = '#ffffff';
    context.font = '800 27px Arial, sans-serif';
    context.fillText('OPEN ELECTIVE SELECTION CONFIRMATION SLIP', 800, 278);

    const fields = [
      { label: 'REGISTRATION NUMBER', value: STATE.student.reg_no, x: 112, y: 390 },
      { label: 'STUDENT NAME', value: STATE.student.name, x: 832, y: 390 },
      { label: 'OPEN ELECTIVE – I', value: regs[0] ? `${regs[0].subject_name} (${regs[0].subject_code})\nFaculty: ${regs[0].faculty_name}` : 'Not Selected', x: 112, y: 560 },
      { label: 'OPEN ELECTIVE – II', value: regs[1] ? `${regs[1].subject_name} (${regs[1].subject_code})\nFaculty: ${regs[1].faculty_name}` : 'Not Selected', x: 832, y: 560 },
      { label: 'REGISTRATION STATUS', value: 'CONFIRMED & LOCKED', x: 112, y: 770, confirmed: true },
      { label: 'ACADEMIC COHORT', value: '3rd Year B.Tech • Semester 6', x: 832, y: 770 }
    ];

    fields.forEach(field => {
      drawScreenshotRoundedRect(context, field.x, field.y, 656, 150, 18, field.confirmed ? '#ecfdf5' : '#f8fafc');
      context.textAlign = 'left';
      context.fillStyle = field.confirmed ? '#047857' : '#64748b';
      context.font = '700 17px Arial, sans-serif';
      context.fillText(field.label, field.x + 26, field.y + 40);
      context.fillStyle = field.confirmed ? '#065f46' : '#0f172a';
      context.font = '700 23px Arial, sans-serif';
      drawScreenshotWrappedText(context, field.value, field.x + 26, field.y + 80, 600, 30);
    });

    context.fillStyle = '#64748b';
    context.textAlign = 'center';
    context.font = '500 16px Arial, sans-serif';
    context.fillText('Official selection confirmation • RGMCET CSE Open Electives', 800, 1064);

    const png = await new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Image generation failed.'));
      }, 'image/png');
    });

    const objectUrl = URL.createObjectURL(png);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${safeName}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (canvasErr) {
    console.error('Canvas screenshot error:', canvasErr);
    window.print();
  }
}

// Global window exposure to guarantee instant handler availability
window.initStudentPortal = initStudentPortal;
window.switchStudentTab = switchStudentTab;
window.loadStudentData = loadStudentData;
window.renderStudentSubjects = renderStudentSubjects;
window.renderStudentSelections = renderStudentSelections;
window.selectOESubject = selectOESubject;
window.selectOEFaculty = selectOEFaculty;
window.confirmOESelection = confirmOESelection;
window.downloadSelectionScreenshot = downloadSelectionScreenshot;
window.downloadMasterSlipScreenshot = downloadMasterSlipScreenshot;
window.setPendingSelection = setPendingSelection;
window.submitSubjectSelection = submitSubjectSelection;
window.confirmFacultyReservation = confirmFacultyReservation;
window.executeReservation = executeReservation;
window.openBatchConfirmationModal = openBatchConfirmationModal;
window.executeBatchReservation = executeBatchReservation;


