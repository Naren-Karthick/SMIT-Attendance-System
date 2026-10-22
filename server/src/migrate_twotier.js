const { getDb } = require('./db');
const db = getDb();

try {
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('BEGIN TRANSACTION;');

  // 1. od_requests rebuild
  db.exec(`
    CREATE TABLE IF NOT EXISTS od_requests_new (
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
      status TEXT NOT NULL DEFAULT 'PENDING_CLASS_IN_CHARGE' CHECK(status IN ('PENDING_CLASS_IN_CHARGE', 'PENDING_HOD', 'APPROVED', 'REJECTED_BY_IN_CHARGE', 'REJECTED_BY_HOD', 'REJECTED', 'PENDING', 'CLARIFICATION_REQUESTED')),
      hod_remarks TEXT,
      reviewed_by INTEGER REFERENCES users(id),
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      in_charge_remarks TEXT,
      in_charge_reviewed_by INTEGER REFERENCES users(id),
      in_charge_reviewed_at TEXT
    );

    INSERT INTO od_requests_new SELECT id, request_number, student_id, od_type, event_name, venue, from_date, to_date, from_period, to_period, description, remarks, evidence_url, evidence_name, evidence_type, evidence_size, status, hod_remarks, reviewed_by, reviewed_at, created_at, updated_at, in_charge_remarks, in_charge_reviewed_by, in_charge_reviewed_at FROM od_requests;

    DROP TABLE od_requests;
    ALTER TABLE od_requests_new RENAME TO od_requests;
    CREATE INDEX IF NOT EXISTS idx_od_student ON od_requests(student_id, status);
    CREATE INDEX IF NOT EXISTS idx_od_dates ON od_requests(from_date, to_date, status);
  `);

  // 2. leave_requests rebuild
  db.exec(`
    CREATE TABLE IF NOT EXISTS leave_requests_new (
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
      status TEXT NOT NULL DEFAULT 'PENDING_CLASS_IN_CHARGE' CHECK(status IN ('PENDING_CLASS_IN_CHARGE', 'PENDING_HOD', 'APPROVED', 'REJECTED_BY_IN_CHARGE', 'REJECTED_BY_HOD', 'REJECTED', 'PENDING', 'CLARIFICATION_REQUESTED')),
      hod_remarks TEXT,
      reviewed_by INTEGER REFERENCES users(id),
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      in_charge_remarks TEXT,
      in_charge_reviewed_by INTEGER REFERENCES users(id),
      in_charge_reviewed_at TEXT
    );

    INSERT INTO leave_requests_new SELECT id, request_number, student_id, leave_type, from_date, to_date, reason, remarks, document_url, document_name, document_type, document_size, status, hod_remarks, reviewed_by, reviewed_at, created_at, updated_at, in_charge_remarks, in_charge_reviewed_by, in_charge_reviewed_at FROM leave_requests;

    DROP TABLE leave_requests;
    ALTER TABLE leave_requests_new RENAME TO leave_requests;
    CREATE INDEX IF NOT EXISTS idx_leave_student ON leave_requests(student_id, status);
  `);

  // Update existing pending to PENDING_CLASS_IN_CHARGE
  db.exec("UPDATE od_requests SET status = 'PENDING_CLASS_IN_CHARGE' WHERE status = 'PENDING';");
  db.exec("UPDATE leave_requests SET status = 'PENDING_CLASS_IN_CHARGE' WHERE status = 'PENDING';");

  db.exec('COMMIT;');
  db.exec('PRAGMA foreign_keys = ON;');
  console.log('Migration successfully completed!');
} catch (err) {
  db.exec('ROLLBACK;');
  console.error('Migration failed:', err);
}
