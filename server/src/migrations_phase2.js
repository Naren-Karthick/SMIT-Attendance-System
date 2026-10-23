const { getDb } = require('./db');

function runPhase2Migrations() {
  const db = getDb();
  const run = (sql) => { try { db.exec(sql); } catch(e){} };

  run(`CREATE TABLE IF NOT EXISTS institutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );`);

  run(`CREATE TABLE IF NOT EXISTS campuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    is_active INTEGER DEFAULT 1,
    UNIQUE(institution_id, code)
  );`);

  run(`CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    degree TEXT NOT NULL DEFAULT 'B.Tech',
    duration_years INTEGER NOT NULL DEFAULT 4,
    total_semesters INTEGER NOT NULL DEFAULT 8,
    is_active INTEGER DEFAULT 1,
    UNIQUE(department_id, code)
  );`);

  run(`CREATE TABLE IF NOT EXISTS regulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    effective_year INTEGER NOT NULL DEFAULT 2021,
    min_attendance_pct REAL NOT NULL DEFAULT 75.0,
    condonation_min_pct REAL NOT NULL DEFAULT 65.0,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );`);

  run(`CREATE TABLE IF NOT EXISTS attendance_policy_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    policy_code TEXT NOT NULL,
    name TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    regulation_id INTEGER REFERENCES regulations(id),
    min_attendance_pct REAL NOT NULL DEFAULT 75.0,
    warning_threshold_pct REAL NOT NULL DEFAULT 85.0,
    condonation_min_pct REAL NOT NULL DEFAULT 65.0,
    od_treatment TEXT NOT NULL DEFAULT 'attended',
    permission_treatment TEXT NOT NULL DEFAULT 'attended',
    leave_treatment TEXT NOT NULL DEFAULT 'excluded',
    effective_from TEXT NOT NULL DEFAULT '2026-01-01',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );`);

  run(`CREATE TABLE IF NOT EXISTS mentor_interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    mentor_faculty_id INTEGER REFERENCES faculty(id) ON DELETE CASCADE,
    risk_level TEXT NOT NULL CHECK(risk_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    reason_code TEXT NOT NULL,
    trigger_attendance_pct REAL,
    contact_attempts INTEGER DEFAULT 1,
    counseling_notes TEXT NOT NULL,
    action_plan TEXT NOT NULL,
    follow_up_date TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED')),
    student_acknowledged INTEGER DEFAULT 0,
    student_remarks TEXT,
    outcome_metrics TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );`);

  run(`CREATE TABLE IF NOT EXISTS attendance_appeals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appeal_number TEXT UNIQUE NOT NULL,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    original_status TEXT NOT NULL,
    requested_status TEXT NOT NULL,
    reason TEXT NOT NULL,
    evidence_url TEXT,
    evidence_name TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING_FACULTY' CHECK(status IN ('PENDING_FACULTY', 'PENDING_HOD', 'PENDING_COE', 'APPROVED', 'REJECTED', 'CLARIFICATION_REQUESTED')),
    faculty_remarks TEXT,
    hod_remarks TEXT,
    decision_by INTEGER REFERENCES users(id),
    decision_at TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );`);

  run(`CREATE TABLE IF NOT EXISTS digital_passports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    passport_token TEXT UNIQUE NOT NULL,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    academic_year TEXT NOT NULL,
    overall_percentage REAL NOT NULL,
    total_conducted INTEGER NOT NULL,
    total_attended INTEGER NOT NULL,
    od_count INTEGER DEFAULT 0,
    leave_count INTEGER DEFAULT 0,
    eligibility_status TEXT NOT NULL CHECK(eligibility_status IN ('ELIGIBLE', 'CONDONATION_REQUIRED', 'DETAINED')),
    policy_version TEXT NOT NULL,
    signature_hash TEXT NOT NULL,
    issued_by INTEGER REFERENCES users(id),
    issued_at TEXT DEFAULT (datetime('now', 'localtime'))
  );`);

  // Seed baseline institutions & regulations if empty
  const instCount = db.prepare('SELECT count(*) as c FROM institutions').get().c;
  if (instCount === 0) {
    db.prepare(`INSERT INTO institutions (code, name, city, state) VALUES ('SMIT', 'Sri Muthukumaran Institute of Technology', 'Chennai', 'Tamil Nadu')`).run();
  }

  const regCount = db.prepare('SELECT count(*) as c FROM regulations').get().c;
  if (regCount === 0) {
    db.prepare(`INSERT INTO regulations (code, name, effective_year, min_attendance_pct, condonation_min_pct) VALUES ('R2021', 'Anna University Regulation 2021', 2021, 75.0, 65.0)`).run();
  }

  const polVerCount = db.prepare('SELECT count(*) as c FROM attendance_policy_versions').get().c;
  if (polVerCount === 0) {
    db.prepare(`INSERT INTO attendance_policy_versions (policy_code, name, version, min_attendance_pct, warning_threshold_pct, condonation_min_pct, od_treatment, permission_treatment, leave_treatment) VALUES ('ANNA_R2021_V1', 'Standard Anna University 75% Rulebook', 1, 75.0, 85.0, 65.0, 'attended', 'attended', 'excluded')`).run();
  }
}

module.exports = { runPhase2Migrations };