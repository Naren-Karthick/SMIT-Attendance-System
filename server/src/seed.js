const bcrypt = require('bcryptjs');
const { getDb, initSchema } = require('./db');

const SECOND_YEAR_STUDENTS = [
  { reg: '212625205001', name: 'Aishwarya A' },
  { reg: '212625205002', name: 'Aishwarya J' },
  { reg: '212625205003', name: 'Anu Sri K' },
  { reg: '212625205004', name: 'Aravind M' },
  { reg: '212625205005', name: 'Aswin Kumar M' },
  { reg: '212625205006', name: 'Balaji E' },
  { reg: '212625205007', name: 'Barath S G' },
  { reg: '212625205009', name: 'Gayathri M (H)' },
  { reg: '212625205010', name: 'Grascy Jennifer J R' },
  { reg: '212625205011', name: 'Gunal S' },
  { reg: '212625205012', name: 'Hema Sathana M S' },
  { reg: '212625205013', name: 'Ilakiya B' },
  { reg: '212625205014', name: 'Ilakkiya M' },
  { reg: '212625205015', name: 'Jagan S' },
  { reg: '212625205016', name: 'Janavi M' },
  { reg: '212625205017', name: 'Jawahar M' },
  { reg: '212625205018', name: 'Karthik A' },
  { reg: '212625205019', name: 'Kaviya D' },
  { reg: '212625205020', name: 'Kaviya Priya V' },
  { reg: '212625205021', name: 'Keerthika B' },
  { reg: '212625205023', name: 'Mohammed Aashik Ali S' },
  { reg: '212625205024', name: 'Mohammed Nayeemudeen N' },
  { reg: '212625205025', name: 'Mohd Arif Z' },
  { reg: '212625205026', name: 'Mukesh Kumar K' },
  { reg: '212625205027', name: 'Muthu Kumaran R' },
  { reg: '212625205028', name: 'Nandimandalam Balaji' },
  { reg: '212625205029', name: 'Naren Karthick G' },
  { reg: '212625205030', name: 'Neethin K' },
  { reg: '212625205031', name: 'Nishanth S' },
  { reg: '212625205032', name: 'Nithishgiri S' },
  { reg: '212625205033', name: 'Nithish Raj R' },
  { reg: '212625205034', name: 'Pandiselvi R' },
  { reg: '212625205035', name: 'Pavithra T' },
  { reg: '212625205036', name: 'Ponmozhi D' },
  { reg: '212625205037', name: 'Prakash M' },
  { reg: '212625205038', name: 'Prakash R (H)' },
  { reg: '212625205039', name: 'Praveen S' },
  { reg: '212625205040', name: 'Praveena M' },
  { reg: '212625205041', name: 'Premkumar M' },
  { reg: '212625205044', name: 'Priyadharshini A (H)' },
  { reg: '212625205045', name: 'Priyadharshini P' },
  { reg: '212625205046', name: 'Priyanka S' },
  { reg: '212625205047', name: 'Ranjan S' },
  { reg: '212625205048', name: 'Reshma Parveen J' },
  { reg: '212625205049', name: 'Sakthi K' },
  { reg: '212625205050', name: 'Sathish A' },
  { reg: '212625205051', name: 'Srigar K' },
  { reg: '212625205052', name: 'Sundar S' },
  { reg: '212625205053', name: 'Thasif Yahiya T' },
  { reg: '212625205054', name: 'Vasantha Krishnan V' },
  { reg: '212625205055', name: 'Vasanth Kumar S' },
  { reg: '212625205056', name: 'Vetriganesh G' },
  { reg: '212625205057', name: 'Vishal K' },
  { reg: '212625205058', name: 'Roobini Dj' },
  { reg: '212625205302', name: 'Madhan Kumar Y' }
];

const THIRD_YEAR_STUDENTS = [
  { reg: '212624205001', name: 'Ashwinmaran S' },
  { reg: '212624205002', name: 'Bharanikumar S' },
  { reg: '212624205003', name: 'Deepika D' },
  { reg: '212624205004', name: 'Divya Priya K' },
  { reg: '212624205005', name: 'Elavarasan A' },
  { reg: '212624205006', name: 'Ellammal P' },
  { reg: '212624205007', name: 'Gokulraja M' },
  { reg: '212624205008', name: 'Harithra A' },
  { reg: '212624205009', name: 'Jayashree' },
  { reg: '212624205010', name: 'Jetson G' },
  { reg: '212624205011', name: 'Kaarki Che P S' },
  { reg: '212624205012', name: 'Madhusri J V' },
  { reg: '212624205013', name: 'Manikandan R' },
  { reg: '212624205014', name: 'Mohan Raj P' },
  { reg: '212624205015', name: 'Nethra R' },
  { reg: '212624205016', name: 'Senthil Arasu A' },
  { reg: '212624205017', name: 'Santhosh Selvam G' },
  { reg: '212624205018', name: 'Shyam Sundar' },
  { reg: '212624205019', name: 'Suriyadharan R' },
  { reg: '212624205020', name: 'Velan V S' },
  { reg: '212624205021', name: 'Vimal Raj G' },
  { reg: '212624205022', name: 'Vinoth A' },
  { reg: '212624205301', name: 'Manikandan S' },
  { reg: '212624205302', name: 'Manoj Kumar B' },
  { reg: '212624205303', name: 'Shalini V' },
  { reg: '212624205701', name: 'Kavi Priya S' }
];

const FOURTH_YEAR_STUDENTS = [
  { reg: '212623205001', name: 'Abinaya K' },
  { reg: '212623205002', name: 'Amsavarthini A' },
  { reg: '212623205003', name: 'Arikrishnan R' },
  { reg: '212623205004', name: 'Balamurugan S' },
  { reg: '212623205005', name: 'Bhuvaneshkumar M' },
  { reg: '212623205006', name: 'Blessi V' },
  { reg: '212623205008', name: 'Cibichozhan L' },
  { reg: '212623205009', name: 'Dharshini M V' },
  { reg: '212623205010', name: 'Dinesh A' },
  { reg: '212623205011', name: 'Dravid Kumar R' },
  { reg: '212623205012', name: 'Ebenezer Issac I' },
  { reg: '212623205013', name: 'Gopi P' },
  { reg: '212623205014', name: 'Haakesh R V' },
  { reg: '212623205015', name: 'Hari Prasanth S' },
  { reg: '212623205016', name: 'Helen Sharon A' },
  { reg: '212623205017', name: 'Janani B' },
  { reg: '212623205018', name: 'Kayalvizhi P' },
  { reg: '212623205019', name: 'Kirubakaran M' },
  { reg: '212623205020', name: 'Lokesh B' },
  { reg: '212623205021', name: 'Madhan Kumar B' },
  { reg: '212623205022', name: 'Madhumitha S' },
  { reg: '212623205023', name: 'Nadesan S' },
  { reg: '212623205024', name: 'Nandhini P' },
  { reg: '212623205025', name: 'Nandhini S' },
  { reg: '212623205026', name: 'Pooja K' },
  { reg: '212623205027', name: 'Preethi S' },
  { reg: '212623205028', name: 'Raghuraj R' },
  { reg: '212623205029', name: 'Rajavikram V' },
  { reg: '212623205030', name: 'Rajeswari R' },
  { reg: '212623205031', name: 'Ruban V' },
  { reg: '212623205032', name: 'Sagithan K' },
  { reg: '212623205033', name: 'Sanjay R' },
  { reg: '212623205034', name: 'Sathiyamoorthi S' },
  { reg: '212623205035', name: 'Tamilarasan M' },
  { reg: '212623205036', name: 'Thiruselvam J' },
  { reg: '212623205037', name: 'Vanishree E' },
  { reg: '212623205038', name: 'Vanjinathan L' },
  { reg: '212623205039', name: 'Vinotha K' },
  { reg: '212623205301', name: 'Jeeva A' }
];

function seedDatabase() {
  initSchema();
  const db = getDb();

  const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log(`Database already has ${userCount} users. Skipping seed.`);
    return;
  }

  console.log('Seeding SMIT Smart Attendance Database...');
  const salt = bcrypt.genSaltSync(8);
  const defaultPasswordHash = bcrypt.hashSync('smit@2026', salt);

  db.exec('BEGIN TRANSACTION;');

  try {
    // 1. Department
    db.prepare(`
      INSERT INTO departments (code, name, institution)
      VALUES (?, ?, ?)
    `).run('IT', 'Information Technology', 'Sri Muthukumaran Institute of Technology');
    const deptId = 1;

    // 2. Academic Year
    db.prepare(`
      INSERT INTO academic_years (name, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?)
    `).run('2026-2027', '2026-07-01', '2027-05-31', 1);
    const ayId = 1;

    // 3. Batches (2nd, 3rd, 4th Year)
    const insBatch = db.prepare(`
      INSERT INTO batches (name, year_level, semester, academic_year_id, department_id, regulation)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insBatch.run('2025-2029', 2, 3, ayId, deptId, 'R2021'); // id 1: 2nd Year
    insBatch.run('2024-2028', 3, 5, ayId, deptId, 'R2021'); // id 2: 3rd Year
    insBatch.run('2023-2027', 4, 7, ayId, deptId, 'R2021'); // id 3: 4th Year

    // Sections
    const insSection = db.prepare(`INSERT INTO sections (batch_id, name) VALUES (?, ?)`);
    insSection.run(1, 'A');
    insSection.run(2, 'A');
    insSection.run(3, 'A');

    // 4. Attendance Policy
    db.prepare(`
      INSERT INTO attendance_policies (
        min_attendance_pct, warning_threshold_pct, od_treatment, permission_treatment,
        leave_treatment, faculty_edit_window_hours, allowed_evidence_formats,
        max_upload_size_mb, active_academic_year, active_semester
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(75.0, 85.0, 'attended', 'attended', 'excluded', 24, 'PDF,JPG,JPEG,PNG', 5, '2026-2027', 'Odd');

    // 5. Users & Faculty
    const insUser = db.prepare(`
      INSERT INTO users (username, password_hash, role, full_name, email, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insFaculty = db.prepare(`
      INSERT INTO faculty (user_id, faculty_id, full_name, designation, department, email, phone, room_no, is_hod)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // HOD
    const hodUser = insUser.run('hod_it', defaultPasswordHash, 'hod', 'Dr. S. Anitha', 'hod.it@smit.edu.in', '9840123456');
    insFaculty.run(hodUser.lastInsertRowid, 'SMIT-IT-HOD', 'Dr. S. Anitha', 'Professor & Head of Department', 'Information Technology', 'hod.it@smit.edu.in', '9840123456', 'IT-Cabin-01', 1);
    const hodFacultyId = 1;

    // Faculty members
    const facultyList = [
      { id: 'SMIT-IT-001', username: 'fac_kavitha', name: 'Prof. R. Kavitha', desig: 'Associate Professor', email: 'kavitha.r@smit.edu.in', phone: '9840111222', room: 'IT-Staff-01' },
      { id: 'SMIT-IT-002', username: 'fac_suresh', name: 'Prof. K. Suresh', desig: 'Assistant Professor (Sr. Gr)', email: 'suresh.k@smit.edu.in', phone: '9840222333', room: 'IT-Staff-02' },
      { id: 'SMIT-IT-003', username: 'fac_rajesh', name: 'Dr. M. Rajesh', desig: 'Professor', email: 'rajesh.m@smit.edu.in', phone: '9840333444', room: 'IT-Staff-03' },
      { id: 'SMIT-IT-004', username: 'fac_divya', name: 'Prof. N. Divya', desig: 'Assistant Professor', email: 'divya.n@smit.edu.in', phone: '9840444555', room: 'IT-Staff-04' },
      { id: 'SMIT-IT-005', username: 'fac_vignesh', name: 'Prof. P. Vignesh', desig: 'Assistant Professor', email: 'vignesh.p@smit.edu.in', phone: '9840555666', room: 'IT-Staff-05' }
    ];

    const facultyDbIds = {};
    for (const f of facultyList) {
      const uRes = insUser.run(f.username, defaultPasswordHash, 'faculty', f.name, f.email, f.phone);
      const fRes = insFaculty.run(uRes.lastInsertRowid, f.id, f.name, f.desig, 'Information Technology', f.email, f.phone, f.room, 0);
      facultyDbIds[f.username] = Number(fRes.lastInsertRowid);
    }

    // 6. Subjects
    const insSubject = db.prepare(`
      INSERT INTO subjects (code, name, type, credits, weekly_hours, year_level, semester, department_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 2nd Year Subjects (Sem 3)
    const s201 = Number(insSubject.run('CS25C01', 'Data Structures and Algorithms', 'theory', 3, 4, 2, 3, deptId).lastInsertRowid);
    const s202 = Number(insSubject.run('CS25C02', 'Object Oriented Programming with Java', 'theory', 3, 4, 2, 3, deptId).lastInsertRowid);
    const s203 = Number(insSubject.run('CS25C03', 'Digital Principles & Computer Organization', 'theory', 3, 3, 2, 3, deptId).lastInsertRowid);
    const s204 = Number(insSubject.run('MA25C01', 'Discrete Mathematics & Graph Theory', 'theory', 4, 4, 2, 3, deptId).lastInsertRowid);
    const s205 = Number(insSubject.run('CS25C08', 'Data Structures & Java Programming Lab', 'lab', 2, 3, 2, 3, deptId).lastInsertRowid);

    // 3rd Year Subjects (Sem 5)
    const s301 = Number(insSubject.run('IT24C01', 'Database Management Systems', 'theory', 3, 4, 3, 5, deptId).lastInsertRowid);
    const s302 = Number(insSubject.run('IT24C02', 'Computer Networks & Internet Protocols', 'theory', 3, 4, 3, 5, deptId).lastInsertRowid);
    const s303 = Number(insSubject.run('IT24C03', 'Web Technologies & Cloud Computing', 'theory', 3, 4, 3, 5, deptId).lastInsertRowid);
    const s304 = Number(insSubject.run('IT24C04', 'Design and Analysis of Algorithms', 'theory', 3, 4, 3, 5, deptId).lastInsertRowid);
    const s305 = Number(insSubject.run('IT24C08', 'DBMS & Web Technologies Laboratory', 'lab', 2, 3, 3, 5, deptId).lastInsertRowid);

    // 4th Year Subjects (Sem 7)
    const s401 = Number(insSubject.run('IT23C01', 'Artificial Intelligence & Machine Learning', 'theory', 3, 4, 4, 7, deptId).lastInsertRowid);
    const s402 = Number(insSubject.run('IT23C02', 'Information & Network Cyber Security', 'theory', 3, 4, 4, 7, deptId).lastInsertRowid);
    const s403 = Number(insSubject.run('IT23C03', 'Distributed Systems & Big Data Analytics', 'theory', 3, 4, 4, 7, deptId).lastInsertRowid);
    const s404 = Number(insSubject.run('IT23C04', 'DevOps & Full Stack Engineering', 'theory', 3, 4, 4, 7, deptId).lastInsertRowid);
    const s405 = Number(insSubject.run('IT23C08', 'Project Work Phase I & Security Lab', 'lab', 4, 6, 4, 7, deptId).lastInsertRowid);

    // 7. Subject Assignments
    const insAssign = db.prepare(`
      INSERT INTO subject_assignments (subject_id, faculty_id, batch_id, section_id, academic_year_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    // 2nd Year
    insAssign.run(s201, facultyDbIds['fac_kavitha'], 1, 1, ayId);
    insAssign.run(s202, facultyDbIds['fac_suresh'], 1, 1, ayId);
    insAssign.run(s203, facultyDbIds['fac_divya'], 1, 1, ayId);
    insAssign.run(s204, facultyDbIds['fac_rajesh'], 1, 1, ayId);
    insAssign.run(s205, facultyDbIds['fac_kavitha'], 1, 1, ayId);

    // 3rd Year
    insAssign.run(s301, facultyDbIds['fac_suresh'], 2, 2, ayId);
    insAssign.run(s302, facultyDbIds['fac_vignesh'], 2, 2, ayId);
    insAssign.run(s303, facultyDbIds['fac_kavitha'], 2, 2, ayId);
    insAssign.run(s304, hodFacultyId, 2, 2, ayId);
    insAssign.run(s305, facultyDbIds['fac_vignesh'], 2, 2, ayId);

    // 4th Year
    insAssign.run(s401, hodFacultyId, 3, 3, ayId);
    insAssign.run(s402, facultyDbIds['fac_rajesh'], 3, 3, ayId);
    insAssign.run(s403, facultyDbIds['fac_divya'], 3, 3, ayId);
    insAssign.run(s404, facultyDbIds['fac_vignesh'], 3, 3, ayId);
    insAssign.run(s405, hodFacultyId, 3, 3, ayId);

    // 8. Timetable
    const insTimetable = db.prepare(`
      INSERT INTO timetables (batch_id, section_id, day_of_week, period_number, start_time, end_time, subject_id, faculty_id, room)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const periodTimes = [
      { p: 1, start: '08:45', end: '09:40' },
      { p: 2, start: '09:40', end: '10:35' },
      { p: 3, start: '10:50', end: '11:45' },
      { p: 4, start: '11:45', end: '12:40' },
      { p: 5, start: '13:25', end: '14:15' },
      { p: 6, start: '14:15', end: '15:05' },
      { p: 7, start: '15:05', end: '16:00' }
    ];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Map timetable for Batch 1 (2nd Year)
    const t2Schedule = {
      Monday: [s201, s202, s203, s204, s201, s205, s205],
      Tuesday: [s202, s201, s204, s203, s202, s204, s201],
      Wednesday: [s203, s204, s201, s202, s205, s205, s203],
      Thursday: [s204, s203, s202, s201, s204, s202, s201],
      Friday: [s201, s202, s204, s203, s201, s202, s204]
    };

    // Map timetable for Batch 2 (3rd Year)
    const t3Schedule = {
      Monday: [s301, s302, s303, s304, s301, s305, s305],
      Tuesday: [s303, s304, s301, s302, s303, s304, s301],
      Wednesday: [s302, s301, s304, s303, s305, s305, s302],
      Thursday: [s304, s303, s302, s301, s304, s303, s302],
      Friday: [s301, s303, s302, s304, s301, s302, s304]
    };

    // Map timetable for Batch 3 (4th Year)
    const t4Schedule = {
      Monday: [s401, s402, s403, s404, s401, s405, s405],
      Tuesday: [s402, s401, s404, s403, s402, s404, s401],
      Wednesday: [s403, s404, s401, s402, s405, s405, s403],
      Thursday: [s404, s403, s402, s401, s404, s402, s403],
      Friday: [s401, s402, s403, s404, s401, s403, s402]
    };

    const subjFacultyMap = {
      [s201]: facultyDbIds['fac_kavitha'],
      [s202]: facultyDbIds['fac_suresh'],
      [s203]: facultyDbIds['fac_divya'],
      [s204]: facultyDbIds['fac_rajesh'],
      [s205]: facultyDbIds['fac_kavitha'],

      [s301]: facultyDbIds['fac_suresh'],
      [s302]: facultyDbIds['fac_vignesh'],
      [s303]: facultyDbIds['fac_kavitha'],
      [s304]: hodFacultyId,
      [s305]: facultyDbIds['fac_vignesh'],

      [s401]: hodFacultyId,
      [s402]: facultyDbIds['fac_rajesh'],
      [s403]: facultyDbIds['fac_divya'],
      [s404]: facultyDbIds['fac_vignesh'],
      [s405]: hodFacultyId
    };

    for (const d of days) {
      // 2nd Year
      for (let i = 0; i < 7; i++) {
        const p = periodTimes[i];
        const sId = t2Schedule[d][i];
        insTimetable.run(1, 1, d, p.p, p.start, p.end, sId, subjFacultyMap[sId], sId === s205 ? 'Lab-IT-01' : 'Room-302');
      }
      // 3rd Year
      for (let i = 0; i < 7; i++) {
        const p = periodTimes[i];
        const sId = t3Schedule[d][i];
        insTimetable.run(2, 2, d, p.p, p.start, p.end, sId, subjFacultyMap[sId], sId === s305 ? 'Lab-IT-02' : 'Room-303');
      }
      // 4th Year
      for (let i = 0; i < 7; i++) {
        const p = periodTimes[i];
        const sId = t4Schedule[d][i];
        insTimetable.run(3, 3, d, p.p, p.start, p.end, sId, subjFacultyMap[sId], sId === s405 ? 'Project-Lab' : 'Room-304');
      }
    }

    // 9. Insert Exact Students
    const insStudent = db.prepare(`
      INSERT INTO students (user_id, register_number, full_name, batch_id, section_id, year_level, semester, email, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const studentDbRecords = [];

    // Helper to insert student batch
    const insertStudentList = (list, batchId, yearLevel, semester) => {
      for (const s of list) {
        const email = `${s.reg}@smit.edu.in`;
        const phone = '987654' + s.reg.slice(-4);
        const uRes = insUser.run(s.reg, defaultPasswordHash, 'student', s.name, email, phone);
        const sRes = insStudent.run(uRes.lastInsertRowid, s.reg, s.name, batchId, batchId, yearLevel, semester, email, phone);
        studentDbRecords.push({
          id: Number(sRes.lastInsertRowid),
          userId: Number(uRes.lastInsertRowid),
          reg: s.reg,
          name: s.name,
          batchId,
          yearLevel,
          semester
        });
      }
    };

    insertStudentList(SECOND_YEAR_STUDENTS, 1, 2, 3);
    insertStudentList(THIRD_YEAR_STUDENTS, 2, 3, 5);
    insertStudentList(FOURTH_YEAR_STUDENTS, 3, 4, 7);

    console.log(`Successfully seeded ${studentDbRecords.length} students.`);

    // 10. Pre-generate Attendance Sessions and Atomic Records for realism
    // We generate sessions for the past 10 working days:
    // E.g., from 2026-09-21 to 2026-10-02 (Monday to Friday)
    const insSession = db.prepare(`
      INSERT INTO attendance_sessions (batch_id, section_id, subject_id, faculty_id, session_date, period_number, start_time, end_time, room, topic, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)
    `);
    const insRecord = db.prepare(`
      INSERT INTO attendance_records (session_id, student_id, status, auto_applied, source_request_type, source_request_id, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const pastDates = [
      { date: '2026-09-21', day: 'Monday' },
      { date: '2026-09-22', day: 'Tuesday' },
      { date: '2026-09-23', day: 'Wednesday' },
      { date: '2026-09-24', day: 'Thursday' },
      { date: '2026-09-25', day: 'Friday' },
      { date: '2026-09-28', day: 'Monday' },
      { date: '2026-09-29', day: 'Tuesday' },
      { date: '2026-09-30', day: 'Wednesday' },
      { date: '2026-10-01', day: 'Thursday' },
      { date: '2026-10-02', day: 'Friday' }
    ];

    // Seed 4-5 periods per day for Batch 1 (2nd year) and Batch 2 (3rd year)
    for (const dt of pastDates) {
      const daySched2 = t2Schedule[dt.day];
      for (let pIdx = 0; pIdx < 4; pIdx++) { // 4 periods per day
        const pNum = pIdx + 1;
        const subjId = daySched2[pIdx];
        const facId = subjFacultyMap[subjId];
        const pTime = periodTimes[pIdx];

        const sesRes = insSession.run(
          1, 1, subjId, facId, dt.date, pNum, pTime.start, pTime.end, 'Room-302',
          `Unit ${pIdx + 1} Lecture & Discussion`, 2
        );
        const sesId = Number(sesRes.lastInsertRowid);

        // Populate records for all 2nd year students
        const y2Students = studentDbRecords.filter(s => s.batchId === 1);
        for (const st of y2Students) {
          // Provide realistic distribution:
          // A few students have lower attendance (e.g. Aravind M reg 212625205004, Ilakiya B 212625205013)
          let status = 'PRESENT';
          const regEnd = parseInt(st.reg.slice(-2), 10) || 1;

          if (st.reg === '212625205004') { // Aravind M - OD student
            if (dt.date === '2026-09-28' || dt.date === '2026-09-29') {
              status = 'OD';
            } else if (regEnd % 3 === 0 && pNum === 4) {
              status = 'ABSENT';
            }
          } else if (st.reg === '212625205013') { // Ilakiya B - critical attendance ~68%
            if (pNum === 2 || pNum === 4 || dt.date === '2026-09-24' || dt.date === '2026-09-30') {
              status = 'ABSENT';
            }
          } else if (st.reg === '212625205045') { // Priyadharshini P - leave
            if (dt.date === '2026-09-25') {
              status = 'LEAVE';
            }
          } else {
            // General high attendance (85% - 95%)
            if (regEnd % 7 === 0 && pNum === 3 && dt.date === '2026-09-23') {
              status = 'ABSENT';
            } else if (regEnd % 11 === 0 && pNum === 1 && dt.date === '2026-09-30') {
              status = 'PERMISSION';
            }
          }

          insRecord.run(sesId, st.id, status, status === 'OD' || status === 'LEAVE' ? 1 : 0, null, null, null);
        }
      }
    }

    // Seed 4-5 periods for 3rd Year as well
    for (const dt of pastDates) {
      const daySched3 = t3Schedule[dt.day];
      for (let pIdx = 0; pIdx < 3; pIdx++) {
        const pNum = pIdx + 1;
        const subjId = daySched3[pIdx];
        const facId = subjFacultyMap[subjId];
        const pTime = periodTimes[pIdx];

        const sesRes = insSession.run(
          2, 2, subjId, facId, dt.date, pNum, pTime.start, pTime.end, 'Room-303',
          `Lecture on Modules & System Design`, 2
        );
        const sesId = Number(sesRes.lastInsertRowid);

        const y3Students = studentDbRecords.filter(s => s.batchId === 2);
        for (const st of y3Students) {
          let status = 'PRESENT';
          if (st.reg === '212624205001') { // Ashwinmaran S
            if (dt.date === '2026-09-24') status = 'OD';
          } else if (st.reg === '212624205005') { // Elavarasan A - warning threshold
            if (dt.date === '2026-09-22' || dt.date === '2026-09-28') status = 'ABSENT';
          }
          insRecord.run(sesId, st.id, status, status === 'OD' ? 1 : 0, null, null, null);
        }
      }
    }

    // 11. Seed Sample OD Requests
    const insOD = db.prepare(`
      INSERT INTO od_requests (
        request_number, student_id, od_type, event_name, venue, from_date, to_date,
        from_period, to_period, description, remarks, evidence_url, evidence_name,
        evidence_type, evidence_size, status, hod_remarks, reviewed_by, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Student 4: Aravind M (Pending OD for upcoming National Hackathon)
    const aravindStudent = studentDbRecords.find(s => s.reg === '212625205004');
    if (aravindStudent) {
      insOD.run(
        'OD-2026-0001',
        aravindStudent.id,
        'Hackathon / Project Expo',
        'National Smart India Hackathon Prelims 2026',
        'IIT Madras Research Park, Chennai',
        '2026-10-06',
        '2026-10-07',
        1,
        7,
        'Selected for 36-hour National Hackathon in AI for Healthcare track.',
        'Team of 4 representing SMIT IT department. Team Leader: Aravind M.',
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><rect width="600" height="300" fill="%23f1f5f9"/><rect x="20" y="20" width="560" height="260" rx="8" fill="white" stroke="%23cbd5e1" stroke-width="2"/><text x="50" y="70" font-family="sans-serif" font-size="20" font-weight="bold" fill="%231e3a8a">IIT MADRAS - HACKATHON SELECTION CERTIFICATE</text><text x="50" y="110" font-family="sans-serif" font-size="14" fill="%23334155">This is to certify that Aravind M (Reg: 212625205004) has been shortlisted</text><text x="50" y="140" font-family="sans-serif" font-size="14" fill="%23334155">for the Grand Finale on 06-10-2026 and 07-10-2026.</text><circle cx="500" cy="210" r="35" fill="%232563eb" opacity="0.2"/><text x="475" y="215" font-family="sans-serif" font-size="11" font-weight="bold" fill="%231d4ed8">VERIFIED</text></svg>',
        'iitm_hackathon_selection_letter.png',
        'image/png',
        142850,
        'PENDING',
        null,
        null,
        null
      );
    }

    // Student: Janavi M (Pending OD for Technical Symposium)
    const janaviStudent = studentDbRecords.find(s => s.reg === '212625205016');
    if (janaviStudent) {
      insOD.run(
        'OD-2026-0002',
        janaviStudent.id,
        'Paper Presentation',
        'National Conference on NextGen AI & Quantum Computing',
        'College of Engineering Guindy (CEG), Anna University',
        '2026-10-08',
        '2026-10-08',
        1,
        7,
        'Accepted research paper titled "Optimized Routing Protocols using Graph Neural Networks".',
        'Oral presentation slot allocated at 11:30 AM.',
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><rect width="600" height="300" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="260" rx="8" fill="white" stroke="%23cbd5e1" stroke-width="2"/><text x="50" y="70" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23047857">ANNA UNIVERSITY - CEG GUINDY</text><text x="50" y="110" font-family="sans-serif" font-size="14" fill="%23334155">Paper Acceptance Letter: Janavi M (Reg: 212625205016)</text><text x="50" y="140" font-family="sans-serif" font-size="14" fill="%23334155">Date of Presentation: 08-Oct-2026. Hall: Ada Lovelace Auditorium.</text><circle cx="500" cy="210" r="35" fill="%2310b981" opacity="0.2"/><text x="475" y="215" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23047857">ACCEPTED</text></svg>',
        'ceg_paper_acceptance.png',
        'image/png',
        98240,
        'PENDING',
        null,
        null,
        null
      );
    }

    // Student: Ashwinmaran S (Approved OD)
    const ashwinStudent = studentDbRecords.find(s => s.reg === '212624205001');
    if (ashwinStudent) {
      insOD.run(
        'OD-2026-0003',
        ashwinStudent.id,
        'Technical Symposium',
        'KURIOS 2026 - National Tech Fest',
        'SSN College of Engineering, Chennai',
        '2026-09-24',
        '2026-09-24',
        1,
        7,
        'Won 1st prize in Web Development & Competitive Coding Hack.',
        'Accompanied by faculty recommendation.',
        null,
        'ssn_kurios_invitation.pdf',
        'application/pdf',
        210400,
        'APPROVED',
        'Approved. Keep it up and ensure lab assignments are submitted.',
        1,
        '2026-09-23 16:30:00'
      );
    }

    // 12. Seed Sample Leave Requests
    const insLeave = db.prepare(`
      INSERT INTO leave_requests (
        request_number, student_id, leave_type, from_date, to_date, reason, remarks,
        document_url, document_name, document_type, document_size, status,
        hod_remarks, reviewed_by, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Priyadharshini P (Approved Leave)
    const priyaStudent = studentDbRecords.find(s => s.reg === '212625205045');
    if (priyaStudent) {
      insLeave.run(
        'LV-2026-0001',
        priyaStudent.id,
        'Medical Leave',
        '2026-09-25',
        '2026-09-25',
        'Suffering from acute migraine and consulted campus doctor.',
        'Medical prescription submitted to class advisor.',
        null,
        'medical_fitness_cert.pdf',
        'application/pdf',
        185000,
        'APPROVED',
        'Medical leave granted as per doctor certificate.',
        1,
        '2026-09-25 09:15:00'
      );
    }

    // Madhan Kumar Y (Pending Leave)
    const madhanStudent = studentDbRecords.find(s => s.reg === '212625205302');
    if (madhanStudent) {
      insLeave.run(
        'LV-2026-0002',
        madhanStudent.id,
        'Family Emergency',
        '2026-10-09',
        '2026-10-09',
        'Need to travel to hometown for family ceremony.',
        'Parent consent letter attached.',
        null,
        'parent_permission_letter.pdf',
        'application/pdf',
        140000,
        'PENDING',
        null,
        null,
        null
      );
    }

    // 13. Notifications
    const insNotif = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, is_read, link_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // HOD Notifications
    insNotif.run(1, 'New OD Request from Aravind M', 'Aravind M (212625205004) has applied for OD: National Smart India Hackathon Prelims 2026.', 'request', 0, '/hod/od-requests');
    insNotif.run(1, 'New OD Request from Janavi M', 'Janavi M (212625205016) has applied for OD: National Conference at CEG Guindy.', 'request', 0, '/hod/od-requests');
    insNotif.run(1, 'New Leave Application', 'Madhan Kumar Y (212625205302) has applied for Family Emergency leave.', 'request', 0, '/hod/leave-requests');

    // Student Notifications
    if (aravindStudent) {
      insNotif.run(aravindStudent.userId, 'OD Application Submitted', 'Your OD request OD-2026-0001 has been submitted and is under HOD review.', 'request', 1, '/student/od-requests');
    }
    if (ashwinStudent) {
      insNotif.run(ashwinStudent.userId, 'OD Request Approved!', 'Your OD request OD-2026-0003 has been approved by HOD Dr. S. Anitha.', 'request', 0, '/student/od-requests');
    }

    // 14. Initial Audit Logs
    const insAudit = db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, role, action, entity, entity_id, previous_value, new_value, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insAudit.run(1, 'Dr. S. Anitha', 'hod', 'SYSTEM_INITIALIZATION', 'system', 'AY-2026-2027', null, 'ACTIVE', 'Academic year 2026-2027 initialized with Anna University R2021 curriculum.');
    insAudit.run(1, 'Dr. S. Anitha', 'hod', 'OD_APPROVAL', 'od_request', 'OD-2026-0003', 'PENDING', 'APPROVED', 'Approved for SSN Tech Fest representation.');
    insAudit.run(1, 'Dr. S. Anitha', 'hod', 'POLICY_UPDATE', 'attendance_policy', '1', '75% / 85%', '75% / 85%', 'Department attendance thresholds configured.');

    db.exec('COMMIT;');
    console.log('SMIT Smart Attendance Database successfully seeded with 120 exact students, faculty, subjects, timetables, and demo data!');
  } catch (error) {
    db.exec('ROLLBACK;');
    console.error('Error seeding database:', error);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase
};
