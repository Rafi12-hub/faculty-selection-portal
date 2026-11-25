# Faculty–Student Selection Portal (FSSP)

A robust, enterprise-grade course and faculty allocation platform featuring **First-Come, First-Served (FCFS)** atomic seat reservations.

---

## Architecture & Mandatory Structural Specifications

### 1. Exactly Two User Roles
The application strictly enforces **two user roles**:
1. **`ADMIN`** — Full administrative management authority over faculties, subjects, mappings, capacities, selection windows, live monitoring, cancellations, reports, and audit logs.
2. **`STUDENT`** — Student access to view eligible curriculum courses, inspect faculty member profiles, and reserve seats in active courses.

> **Faculty members are database records only.** Faculty members do NOT have accounts, passwords, login access, permissions, or dashboards. All faculty records are managed exclusively by the Administrator.

---

## Key System Features

### 1. Administrator Portal – Manual Faculty Management
- **Manual Entry Required:** The database starts with zero faculty records. No fake or dummy records are pre-seeded.
- **"Add Faculty" Form:**
  - Faculty Name (required)
  - Faculty Code (required and unique)
  - Designation (Professor, Associate Professor, Assistant Professor, etc.)
  - Qualification (e.g. Ph.D, M.Tech)
  - Specialization (e.g. AI/ML, Cloud Computing, Computer Networks)
  - Email (optional)
  - Phone Number (optional)
  - Profile Image URL (optional)
  - Description / Bio (optional)
  - Active/Inactive Status toggle
- **Capabilities:**
  - Create, view, search, filter, and edit faculty members.
  - View individual faculty details including all assigned subjects, total allocated seats, and remaining capacities.
  - Safe deletion safeguards: Deletion is blocked if dependent mappings or confirmed selections exist.

### 2. Faculty–Subject Assignment & Independent Capacities
- Dedicated **Faculty–Subject Mapping** administrative section.
- Administrator defines:
  - Faculty Member
  - Subject
  - Academic Year (1–4)
  - Semester (1–8)
  - Maximum Seat Capacity (e.g. 25)
- **Rules:**
  - Each mapping maintains its own **independent capacity**.
  - A faculty member can teach multiple subjects; multiple faculty members can teach the same subject.
  - Duplicate active mappings for the same faculty, subject, year, and semester are prohibited.
  - **Capacity Protection:** Capacity can never be reduced below the number of currently allocated seats.

### 3. Student Portal & Atomic FCFS Allocation
- **Dataset Management:** Students cannot self-register; all accounts are managed by the Administrator.
- **Login:** Registration Number and configured password.
- **Profile Display:** Upon login, displays Student Name, Registration Number, Academic Year, Semester, and Section.
- **Eligibility Filter:** Students only see subjects and faculty mappings matching their academic year and semester.
- **Atomic FCFS Reservation Engine:**
  - Database transactions guarantee that simultaneous requests never exceed the configured capacity.
  - Server-generated timestamps (`ISO 8601`) record the exact instant of reservation.
  - One faculty member per subject per selection round.
  - Students cannot modify or cancel confirmed selections themselves.
  - Instant live feedback when seats are fully booked.
- Faculty availability is shown to students only as accessible green/yellow/red status indicators; exact capacity and allocation metrics remain admin-only.
- Each confirmed selection has a branded confirmation card that can be downloaded as a PNG generated in the browser.

### 4. Administrator Live Selections & Cancellation Authority
- Real-time live monitor of all course allocations.
- **Mandatory Cancellation Reason:** Only administrators can cancel confirmed selections. A reason is strictly required, recorded in the audit log, and the seat is returned to available capacity immediately.

### 5. Administrator Navigation Sections
1. **Dashboard** — 8 stats cards (Total Students, Total Faculty, Total Subjects, Total Mappings, Total Available Seats, Total Allocated Seats, Confirmed Selections, Cancelled Selections) + live occupancy meter.
2. **Student Management** — Dataset manager, bulk/sample import, edit, delete, password reset.
3. **Faculty Management** — Manual addition, code uniqueness check, details modal with assigned subjects.
4. **Subject Management** — Curriculum subjects, credit hours, department filtering.
5. **Faculty–Subject Mapping** — Seat capacity control, duplication prevention.
6. **Selection Rounds** — Active selection windows and time-locked selection periods.
7. **Live Selections** — Auto-refreshing feed with mandatory cancellation workflow.
8. **Reports** — Faculty allocation breakdowns, subject demand analyses, printable slips.
9. **Audit Logs** — Comprehensive chronological ledger of all system operations.

---

## Getting Started

### Prerequisites
- Node.js (v20+ or v22+)

### Running the Server
```bash
# Start the production server
npm start

# Or with automatic reload during development
npm run dev
```

The server starts at `http://localhost:5000`.

### Default Credentials
- **Administrator Portal:**
  - Role: `Administrator`
  - Username: `cse@rgmcet.edu.in`
  - Password: `deptcse`

---

## Test Verification
Run the automated test suite covering all 17 specification categories:
```bash
node test/test_suite.js
```
