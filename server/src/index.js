const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const { initSchema, getDbPath, getDb } = require('./db');
const { seedDatabase } = require('./seed');
const { restoreDatabaseFromVercel, backupDatabaseToVercel } = require('./storage');

// Immediately ensure SQLite tables exist synchronously
initSchema();

// Promise to ensure remote cloud snapshot restore and seeding complete before requests run
let dbReadyPromise = null;
async function ensureDbReady() {
  if (!dbReadyPromise) {
    dbReadyPromise = (async () => {
      try {
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          const restored = await restoreDatabaseFromVercel(getDbPath());
          if (restored) {
            initSchema();
          }
        }
      } catch (err) {
        console.error('[Storage Init] Cloud restore notice:', err.message);
      }
      initSchema();
      try {
        const userCount = getDb().prepare('SELECT count(*) as count FROM users').get().count;
        if (userCount === 0) {
          console.log('[Storage Init] Database empty. Seeding initial records...');
          seedDatabase();
          if (process.env.BLOB_READ_WRITE_TOKEN) {
            await backupDatabaseToVercel(getDbPath());
          }
        } else {
          console.log(`[Storage Init] Database active with ${userCount} users. Preserving user data.`);
        }
      } catch (err) {
        console.error('[Storage Init] Seed verification notice:', err.message);
      }
    })();
  }
  return dbReadyPromise;
}

// Start initialization in background
ensureDbReady();

// Periodic Cloud Auto-Sync: backup database state to Vercel Storage every 30 seconds
if (process.env.BLOB_READ_WRITE_TOKEN) {
  setInterval(async () => {
    try {
      await backupDatabaseToVercel(getDbPath());
    } catch (e) {
      // background periodic sync error logged in storage module
    }
  }, 30 * 1000);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure database is 100% ready before any route runs
app.use(async (req, res, next) => {
  try {
    await ensureDbReady();
    next();
  } catch (err) {
    next(err);
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'SMIT Smart Attendance Platform',
    institution: 'Sri Muthukumaran Institute of Technology',
    department: 'Information Technology',
    academicYear: '2026-2027',
    storage: process.env.BLOB_READ_WRITE_TOKEN ? 'Vercel Blob Storage (Active)' : 'Local File Storage',
    autoSyncIntervalSec: 30,
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/od', require('./routes/od'));
app.use('/api/leave', require('./routes/leave'));
app.use('/api/students', require('./routes/students'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/timetables', require('./routes/timetable'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/storage', require('./routes/storage'));

// Serve Client in production
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send('SMIT Smart Attendance API Server is active.');
});

// Global JSON Error Handler - Ensures JSON is returned on any error instead of HTML
app.use((err, req, res, next) => {
  console.error('[API Error Handler]', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start Server
if (require.main === module || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` SMIT Smart Attendance Server running on port ${PORT}`);
    console.log(` Institution : Sri Muthukumaran Institute of Technology`);
    console.log(` Department  : Information Technology (2026-2027)`);
    console.log(` API Endpoint: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
