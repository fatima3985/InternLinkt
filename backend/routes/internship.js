const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Set up multer for resume uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/resumes'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Create Internship
router.post('/', async (req, res) => {
  const { company_id, title, location, type, skills, salary, duration, deadline, description } = req.body;
  if (!company_id || !title || !location || !type) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    await db.query(
      'INSERT INTO internships (company_id, title, location, type, skills, salary, duration, deadline, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [company_id, title, location, type, skills, salary, duration, deadline, description]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get All Internships (for browsing)
router.get('/', async (req, res) => {
  const { location, type, salaryMin, salaryMax, skills } = req.query;
  
  try {
    let query = `
      SELECT i.*, c.company_name, c.logo 
      FROM internships i 
      JOIN companies c ON i.company_id = c.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (location) {
      query += ' AND i.location LIKE ?';
      params.push(`%${location}%`);
    }
    
    if (type) {
      query += ' AND i.type = ?';
      params.push(type);
    }
    
    if (salaryMin) {
      query += ' AND i.salary >= ?';
      params.push(salaryMin);
    }
    
    if (salaryMax) {
      query += ' AND i.salary <= ?';
      params.push(salaryMax);
    }
    
    if (skills) {
      query += ' AND i.skills LIKE ?';
      params.push(`%${skills}%`);
    }
    
    query += ' ORDER BY i.created_at DESC';
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get Internship by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT i.*, c.company_name, c.logo, c.description as company_description FROM internships i JOIN companies c ON i.company_id = c.id WHERE i.id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Internship not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Edit Internship
router.put('/:id', async (req, res) => {
  const { title, location, type, salary, duration, deadline, skills, description } = req.body;
  
  try {
    await db.query(
      'UPDATE internships SET title=?, location=?, type=?, salary=?, duration=?, deadline=?, skills=?, description=? WHERE id=?',
      [title, location, type, salary, duration, deadline, skills, description, req.params.id]
    );
    res.json({ success: true, message: 'Internship updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete Internship
router.delete('/:id', async (req, res) => {
  try {
    // First delete all applications for this internship
    await db.query('DELETE FROM applications WHERE internship_id = ?', [req.params.id]);
    
    // Then delete the internship
    await db.query('DELETE FROM internships WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Internship deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Student applies to internship
router.post('/:id/apply', upload.single('resume'), async (req, res) => {
  const internship_id = req.params.id;
  const { student_id, cover_letter } = req.body;
  let resume_path = null;
  if (req.file) {
    resume_path = '/resumes/' + req.file.filename;
  }
  if (!student_id || !cover_letter) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    await db.query(
      'INSERT INTO applications (student_id, internship_id, cover_letter, resume) VALUES (?, ?, ?, ?)',
      [student_id, internship_id, cover_letter, resume_path]
    );
    res.json({ success: true, message: 'Application submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router; 