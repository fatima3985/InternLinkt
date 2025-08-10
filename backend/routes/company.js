const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// TODO: Add company endpoints

// 1. Company Signup POST /api/companies/signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
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
      [email, hashed, 'company']
    );
    
    // Create company profile
    await db.query(
      'INSERT INTO companies (user_id, company_name, description) VALUES (?, ?, ?)',
      [userResult.insertId, name, '']
    );
    
    res.json({ success: true, message: 'Company registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 2. Company Login POST /api/companies/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }
  
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'company']);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    
    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    
    // Get company profile
    const [companies] = await db.query('SELECT * FROM companies WHERE user_id = ?', [user.id]);
    if (companies.length === 0) {
      return res.status(400).json({ error: 'Company profile not found.' });
    }
    
    const company = companies[0];
    res.json({ 
      success: true, 
      company: {
        id: company.id,
        user_id: user.id,
        name: company.company_name,
        email: user.email,
        description: company.description,
        logo: company.logo,
        website: company.website,
        location: company.location
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 3. Create Internship POST /api/companies/:companyId/internships
router.post('/:companyId/internships', async (req, res) => {
  const { title, location, type, salary, duration, deadline, skills, description } = req.body;
  const companyId = req.params.companyId;
  
  if (!title || !location || !type || !skills) {
    return res.status(400).json({ error: 'Title, location, type, and skills are required.' });
  }
  
  try {
    await db.query(
      'INSERT INTO internships (company_id, title, location, type, salary, duration, deadline, skills, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [companyId, title, location, type, salary, duration, deadline, skills, description]
    );
    res.json({ success: true, message: 'Internship created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 4. Get All Company Internships GET /api/companies/:companyId/internships
router.get('/:companyId/internships', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM internships WHERE company_id = ? ORDER BY created_at DESC', [req.params.companyId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 7. Get Applications for an Internship GET /api/internships/:id/applications
router.get('/internship/:internshipId/applications', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, s.name, s.university, s.major, s.graduation_year, s.skills, s.experience 
       FROM applications a 
       JOIN students s ON a.student_id = s.id 
       WHERE a.internship_id = ?`,
      [req.params.internshipId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 8. Update Application Status PUT /api/applications/:id
router.put('/application/:applicationId/status', async (req, res) => {
  const { status } = req.body;
  
  if (!['Pending', 'Shortlisted', 'Accepted', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  
  try {
    await db.query('UPDATE applications SET status=? WHERE id=?', [status, req.params.applicationId]);
    res.json({ success: true, message: 'Application status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 9. Update Company Account PUT /api/companies/:id
router.put('/:id', async (req, res) => {
  const { name, email, description, logo, website, location } = req.body;
  
  try {
    // Get user_id from company
    const [company] = await db.query('SELECT user_id FROM companies WHERE id = ?', [req.params.id]);
    if (company.length === 0) return res.status(404).json({ error: 'Company not found.' });
    
    // Update user email if provided
    if (email) {
      await db.query('UPDATE users SET email = ? WHERE id = ?', [email, company[0].user_id]);
    }
    
    // Update company profile
    await db.query(
      'UPDATE companies SET company_name=?, description=?, logo=?, website=?, location=? WHERE id=?',
      [name, description, logo, website, location, req.params.id]
    );
    res.json({ success: true, message: 'Company profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// 10. Get Company Info GET /api/companies/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT c.*, u.email FROM companies c JOIN users u ON c.user_id = u.id WHERE c.id = ?', 
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Company not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router; 