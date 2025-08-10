const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

// TODO: Add student endpoints

// Multer setup for resume upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/resumes'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// 1. Student Signup POST /api/students/signup
router.post('/signup', async (req, res) => {
  const { name, email, password, university, major, graduation_year } = req.body;
  
  if (!name || !email || !password || !university || !major || !graduation_year) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  
  try {
    // Check if user already exists
    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already registered.' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    
    // Create user first
    const [userResult] = await db.query(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, hashed, 'student']
    );
    
    // Create student profile
    await db.query(
      'INSERT INTO students (user_id, name, university, major, graduation_year) VALUES (?, ?, ?, ?, ?)',
      [userResult.insertId, name, university, major, graduation_year]
    );
    
    res.json({ success: true, message: 'Student registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 2. Student Login POST /api/students/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }
  
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'student']);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    
    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    
    // Get student profile
    const [students] = await db.query('SELECT * FROM students WHERE user_id = ?', [user.id]);
    if (students.length === 0) {
      return res.status(400).json({ error: 'Student profile not found.' });
    }
    
    const student = students[0];
    res.json({ 
      success: true, 
      student: {
        id: student.id,
        user_id: user.id,
        name: student.name,
        email: user.email,
        university: student.university,
        major: student.major,
        graduation_year: student.graduation_year,
        bio: student.bio,
        photo: student.profile_photo,
        skills: student.skills,
        experience: student.experience
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 7. Update Student Profile PUT /api/students/:id
router.put('/:id', async (req, res) => {
  const { name, email, university, major, graduation_year, bio, skills, experience, phone, location } = req.body;
  
  try {
    // Get user_id from student
    const [student] = await db.query('SELECT user_id FROM students WHERE id = ?', [req.params.id]);
    if (student.length === 0) return res.status(404).json({ error: 'Student not found.' });
    
    // Update user email if provided
    if (email) {
      await db.query('UPDATE users SET email = ? WHERE id = ?', [email, student[0].user_id]);
    }
    
    // Update student profile
    await db.query(
      'UPDATE students SET name=?, university=?, major=?, graduation_year=?, bio=?, skills=?, experience=?, phone=?, location=? WHERE id=?',
      [name, university, major, graduation_year, bio, skills, experience, phone, location, req.params.id]
    );
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 8. Get Student Profile GET /api/students/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT s.*, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?', 
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Student not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 5. Apply to Internship POST /api/applications
router.post('/apply', upload.single('resume'), async (req, res) => {
  const { student_id, internship_id, cover_letter } = req.body;
  const resume = req.file ? req.file.filename : null;
  
  if (!student_id || !internship_id) {
    return res.status(400).json({ error: 'Student ID and Internship ID are required.' });
  }
  
  try {
    // Check if application already exists
    const [existing] = await db.query(
      'SELECT id FROM applications WHERE student_id = ? AND internship_id = ?', 
      [student_id, internship_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already applied to this internship.' });
    }
    
    await db.query(
      'INSERT INTO applications (student_id, internship_id, resume, cover_letter, status) VALUES (?, ?, ?, ?, ?)',
      [student_id, internship_id, resume, cover_letter, 'Pending']
    );
    res.json({ success: true, message: 'Application submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 6. Get Student Applications GET /api/students/:studentId/applications
router.get('/:studentId/applications', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, i.title, i.location, i.type, i.salary, i.duration, c.company_name 
       FROM applications a 
       JOIN internships i ON a.internship_id = i.id 
       JOIN companies c ON i.company_id = c.id 
       WHERE a.student_id = ?`,
      [req.params.studentId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router; 