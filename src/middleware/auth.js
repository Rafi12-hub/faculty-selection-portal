const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'fssp_super_secure_jwt_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Strict verification: only ADMIN and STUDENT allowed
    if (decoded.role !== 'ADMIN' && decoded.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Invalid role. Access denied.' });
    }

    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found or revoked.' });
    }

    // Role must still match
    if (user.role !== decoded.role) {
      return res.status(403).json({ success: false, message: 'Role mismatch.' });
    }

    req.user = user;

    // If student, attach student details
    if (user.role === 'STUDENT') {
      const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
      if (!student) {
        return res.status(403).json({ success: false, message: 'Associated student profile not found.' });
      }
      if (student.status === 'INACTIVE') {
        return res.status(403).json({ success: false, message: 'Student account is currently inactive.' });
      }
      req.student = student;
    }

    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ success: false, message: `Access forbidden. ${role} authority required.` });
    }
    next();
  };
}

const requireAdmin = requireRole('ADMIN');
const requireStudent = requireRole('STUDENT');

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireAdmin,
  requireStudent
};
