const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'smit_attendance.db')
  : path.resolve(__dirname, '../../smit_attendance.db');

let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    // In serverless environments, DELETE journal mode keeps all data in a single file without separate WAL files
    if (process.env.VERCEL) {
      dbInstance.exec('PRAGMA journal_mode = DELETE;');
    } else {
      dbInstance.exec('PRAGMA journal_mode = WAL;');
    }
  }
  return dbInstance;
}

function checkpointDb() {
  try {
    if (dbInstance) {
      dbInstance.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    }
  } catch (e) {
    // Ignore checkpoint errors if not in WAL mode
  }
}

function closeDb() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (e) {
      // Ignore close errors
    }
    dbInstance = null;
  }
}

function initSchema() {
  const db = getDb();

  db.exec(`
    -- Departments
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      institution TEXT NOT NULL DEFAULT 'Sri Muthukumaran Institute of Technology'
    );

    -- Academic Years
    CREATE TABLE IF NOT EXISTS academic_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      start_date TEXT,
      end_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    -- Batches
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      year_level INTEGER NOT NULL, -- 2, 3, 4
      semester INTEGER NOT NULL,   -- 3, 5, 7
      academic_year_id INTEGER REFERENCES academic_years(id),
      department_id INTEGER REFERENCES departments(id),
      regulation TEXT DEFAULT 'R2021'
    );

    -- Sections
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER REFERENCES batches(id),
      name TEXT NOT NULL,
      UNIQUE(batch_id, name)
    );

    -- Users (Unified authentication)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'faculty', 'hod')),
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      avatar_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Faculty
    CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      faculty_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      designation TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT 'Information Technology',
      email TEXT NOT NULL,
      phone TEXT,
      room_no TEXT,
      is_hod INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Students
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      register_number TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      batch_id INTEGER REFERENCES batches(id),
      section_id INTEGER REFERENCES sections(id),
      year_level INTEGER NOT NULL,
      semester INTEGER NOT NULL,
      email TEXT,
      phone TEXT,
      mentor_faculty_id INTEGER REFERENCES faculty(id),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Subjects
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('theory', 'lab', 'elective')),
      credits INTEGER NOT NULL DEFAULT 3,
      weekly_hours INTEGER NOT NULL DEFAULT 4,
      year_level INTEGER NOT NULL,
      semester INTEGER NOT NULL,
      department_id INTEGER REFERENCES departments(id),
      syllabus_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Faculty Subject Assignments
    CREATE TABLE IF NOT EXISTS subject_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      faculty_id INTEGER REFERENCES faculty(id) ON DELETE CASCADE,
      batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
      section_id INTEGER REFERENCES sections(id),
      academic_year_id INTEGER REFERENCES academic_years(id),
      UNIQUE(subject_id, faculty_id, batch_id, section_id)
    );

    -- Timetables
    CREATE TABLE IF NOT EXISTS timetables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
      section_id INTEGER REFERENCES sections(id),
      day_of_week TEXT NOT NULL CHECK(day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
      period_number INTEGER NOT NULL CHECK(period_number BETWEEN 1 AND 7),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      faculty_id INTEGER REFERENCES faculty(id) ON DELETE CASCADE,
      room TEXT DEFAULT 'IT-301',
      UNIQUE(batch_id, day_of_week, period_number)
    );

    -- Attendance Sessions
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
      section_id INTEGER REFERENCES sections(id),
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      faculty_id INTEGER REFERENCES faculty(id) ON DELETE CASCADE,
      session_date TEXT NOT NULL, -- YYYY-MM-DD
      period_number INTEGER NOT NULL CHECK(period_number BETWEEN 1 AND 7),
      start_time TEXT,
      end_time TEXT,
      room TEXT,
      topic TEXT,
      status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'edited', 'cancelled')),
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(batch_id, subject_id, session_date, period_number)
    );

    -- Attendance Records (Atomic, raw attendance per student per session)
    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER REFERENCES attendance_sessions(id) ON DELETE CASCADE,
      student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK(status IN ('PRESENT', 'ABSENT', 'OD', 'PERMISSION', 'LEAVE')),
      auto_applied INTEGER DEFAULT 0, -- 1 if auto-populated from approved OD/permission/leave
      source_request_type TEXT CHECK(source_request_type IN ('OD', 'LEAVE', 'PERMISSION', NULL)),
      source_request_id INTEGER,
      remarks TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(session_id, student_id)
    );

    -- On-Duty (OD) Requests
    CREATE TABLE IF NOT EXISTS od_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_number TEXT UNIQUE NOT NULL,
      student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
      od_type TEXT NOT NULL,
      event_name TEXT NOT NULL,
      venue TEXT NOT NULL,
      from_date TEXT NOT NULL,
      to_date TEXT NOT NULL,
      from_period INTEGER DEFAULT 1,
      to_period INTEGER DEFAULT 7,
      description TEXT NOT NULL,
      remarks TEXT,
      evidence_url TEXT,
      evidence_name TEXT,
      evidence_type TEXT,
      evidence_size INTEGER,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'CLARIFICATION_REQUESTED')),
      hod_remarks TEXT,
      reviewed_by INTEGER REFERENCES users(id),
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Leave Requests
    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_number TEXT UNIQUE NOT NULL,
      student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
      leave_type TEXT NOT NULL,
      from_date TEXT NOT NULL,
      to_date TEXT NOT NULL,
      reason TEXT NOT NULL,
      remarks TEXT,
      document_url TEXT,
      document_name TEXT,
      document_type TEXT,
      document_size INTEGER,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'CLARIFICATION_REQUESTED')),
      hod_remarks TEXT,
      reviewed_by INTEGER REFERENCES users(id),
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Permission Requests (Period-level permission)
    CREATE TABLE IF NOT EXISTS permission_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_number TEXT UNIQUE NOT NULL,
      student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
      permission_date TEXT NOT NULL,
      period_number INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
      hod_remarks TEXT,
      reviewed_by INTEGER REFERENCES users(id),
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Attendance Policies & Config
    CREATE TABLE IF NOT EXISTS attendance_policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      min_attendance_pct REAL NOT NULL DEFAULT 75.0,
      warning_threshold_pct REAL NOT NULL DEFAULT 85.0,
      od_treatment TEXT NOT NULL DEFAULT 'attended' CHECK(od_treatment IN ('attended', 'excluded', 'not_attended')),
      permission_treatment TEXT NOT NULL DEFAULT 'attended' CHECK(permission_treatment IN ('attended', 'excluded', 'not_attended')),
      leave_treatment TEXT NOT NULL DEFAULT 'excluded' CHECK(leave_treatment IN ('excluded', 'not_attended', 'attended')),
      faculty_edit_window_hours INTEGER NOT NULL DEFAULT 24,
      allowed_evidence_formats TEXT NOT NULL DEFAULT 'PDF,JPG,JPEG,PNG',
      max_upload_size_mb INTEGER NOT NULL DEFAULT 5,
      active_academic_year TEXT NOT NULL DEFAULT '2026-2027',
      active_semester TEXT NOT NULL DEFAULT 'Odd'
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('request', 'attendance', 'system', 'alert')),
      is_read INTEGER NOT NULL DEFAULT 0,
      link_url TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Immutable Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT NOT NULL,
      role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      previous_value TEXT,
      new_value TEXT,
      reason TEXT,
      ip_address TEXT DEFAULT '127.0.0.1',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Indexes for high-speed queries
    CREATE INDEX IF NOT EXISTS idx_sessions_batch_date ON attendance_sessions(batch_id, session_date);
    CREATE INDEX IF NOT EXISTS idx_records_session ON attendance_records(session_id);
    CREATE INDEX IF NOT EXISTS idx_records_student ON attendance_records(student_id);
    CREATE INDEX IF NOT EXISTS idx_od_student ON od_requests(student_id, status);
    CREATE INDEX IF NOT EXISTS idx_od_dates ON od_requests(from_date, to_date, status);
    CREATE INDEX IF NOT EXISTS idx_leave_student ON leave_requests(student_id, status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);
}

function getDbPath() {
  return DB_PATH;
}

module.exports = {
  getDb,
  initSchema,
  getDbPath,
  checkpointDb,
  closeDb
};
