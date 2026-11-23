const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Ensure database is initialized and auto-seeded
const { db } = require('./config/database');
const { runAutoSeed } = require('./config/seedPortal');
runAutoSeed(db);

const app = express();
const PORT = process.env.PORT || 5000;

// Prevent browser caching of client JS scripts
app.use((req, res, next) => {
  if (req.path.endsWith('.js') || req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/mappings', require('./routes/mappings'));
app.use('/api/students', require('./routes/students'));
app.use('/api/rounds', require('./routes/rounds'));
app.use('/api/selections', require('./routes/selections'));
app.use('/api/open-electives', require('./routes/openElectives'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/emails', require('./routes/emails'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Faculty-Student Selection Portal (FSSP)', timestamp: new Date().toISOString() });
});

// SPA fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    const indexPath = path.join(__dirname, '../public/index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` Faculty-Student Selection Portal (FSSP) Server Started `);
    console.log(` Roles: ADMIN & STUDENT only`);
    console.log(` Running on: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
