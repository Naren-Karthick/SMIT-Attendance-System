const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const { initSchema } = require('./db');
const { seedDatabase } = require('./seed');

// Initialize database schema and seed if not already present
initSchema();
seedDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'SMIT Smart Attendance Platform',
    institution: 'Sri Muthukumaran Institute of Technology',
    department: 'Information Technology',
    academicYear: '2026-2027',
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
