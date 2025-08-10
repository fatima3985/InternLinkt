// Global variables
let currentUser = null;
let currentRole = null;

// DOM Elements
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const toast = document.getElementById('toast');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupEventListeners();
});

// Check if user is already logged in
function checkAuthStatus() {
    // Do not auto-redirect to dashboard based on localStorage
    // Only set currentUser/currentRole if present, but do not redirect
    const user = localStorage.getItem('currentUser');
    const role = localStorage.getItem('userRole');
    if (user && role) {
        try {
            currentUser = JSON.parse(user);
            currentRole = role;
            // Optionally, validate currentUser object here, but do not redirect
            if (!(currentUser && typeof currentUser === 'object' && currentUser.id && (currentUser.name || currentUser.company_name))) {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('userRole');
                currentUser = null;
                currentRole = null;
            }
        } catch (e) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userRole');
            currentUser = null;
            currentRole = null;
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Signup forms
    document.getElementById('studentSignupForm').addEventListener('submit', handleStudentSignup);
    document.getElementById('companySignupForm').addEventListener('submit', handleCompanySignup);
    
    // Modal close events
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) closeModal('loginModal');
        if (event.target === signupModal) closeModal('signupModal');
    });
}

// Modal Management
function showLoginModal() {
    loginModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function showSignupModal(role = 'student') {
    signupModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    switchSignupTab(role);
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

function switchTab(role) {
    const tabs = document.querySelectorAll('.login-tabs .tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update form action based on role
    const form = document.getElementById('loginForm');
    form.dataset.role = role;
}

function switchSignupTab(role) {
    const tabs = document.querySelectorAll('.signup-tabs .tab-btn');
    const studentForm = document.getElementById('studentSignupForm');
    const companyForm = document.getElementById('companySignupForm');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if (role === 'student') {
        tabs[0].classList.add('active');
        studentForm.style.display = 'flex';
        companyForm.style.display = 'none';
    } else {
        tabs[1].classList.add('active');
        studentForm.style.display = 'none';
        companyForm.style.display = 'flex';
    }
}

// Authentication Functions
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const role = event.target.dataset.role || 'student';
    let endpoint = '';
    if (role === 'company') {
        endpoint = '/api/companies/login';
    } else {
        endpoint = '/api/students/login';
    }
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.success) {
            currentUser = data[role];
            currentRole = role;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('userRole', role);
            showToast('Login successful!', 'success');
            closeModal('loginModal');
            setTimeout(() => {
                redirectToDashboard();
            }, 1000);
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

async function handleStudentSignup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        university: formData.get('university'),
        major: formData.get('major'),
        graduation_year: formData.get('graduation_year')
    };
    
    try {
        const response = await fetch('/api/students/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Account created successfully! Please log in.', 'success');
            closeModal('signupModal');
            showLoginModal();
        } else {
            showToast(data.error || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

async function handleCompanySignup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    try {
        const response = await fetch('/api/companies/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Account created successfully! Please log in.', 'success');
            closeModal('signupModal');
            showLoginModal();
        } else {
            showToast(data.error || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Navigation
function redirectToDashboard() {
    if (currentRole === 'student') {
        window.location.href = '/student_dashboard.html';
    } else {
        window.location.href = '/company_dashboard.html';
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    currentUser = null;
    currentRole = null;
    window.location.href = '/';
}

// Toast Notifications
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// API Helper Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// Dashboard Functions (for dashboard pages)
function loadDashboardData() {
    if (!currentUser) {
        window.location.href = '/';
        return;
    }
    
    if (currentRole === 'student') {
        loadStudentDashboard();
    } else {
        loadCompanyDashboard();
    }
}

async function loadStudentDashboard() {
    try {
        // Load internships
        const internships = await apiCall('/api/internships');
        renderInternships(internships);
        
        // Load applications
        const applications = await apiCall(`/api/students/${currentUser.id}/applications`);
        renderApplications(applications);
        
        // Load profile
        const profile = await apiCall(`/api/students/${currentUser.id}`);
        renderStudentProfile(profile);
    } catch (error) {
        showToast('Failed to load dashboard data', 'error');
    }
}

async function loadCompanyDashboard() {
    try {
        // Load company internships
        const internships = await apiCall(`/api/companies/${currentUser.id}/internships`);
        renderCompanyInternships(internships);
        
        // Load company profile
        const profile = await apiCall(`/api/companies/${currentUser.id}`);
        renderCompanyProfile(profile);
    } catch (error) {
        showToast('Failed to load dashboard data', 'error');
    }
}

// Rendering Functions
function renderInternships(internships) {
    const container = document.getElementById('internships-container');
    if (!container) return;
    
    container.innerHTML = internships.map(internship => `
        <div class="internship-card">
            <div class="internship-header">
                <h3 class="internship-title">${internship.title}</h3>
                <span class="internship-company">${internship.company_name}</span>
            </div>
            <div class="internship-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${internship.location}</span>
                <span><i class="fas fa-clock"></i> ${internship.type}</span>
                <span><i class="fas fa-dollar-sign"></i> ${internship.salary || 'Not specified'}</span>
            </div>
            <p>${internship.description || 'No description available'}</p>
            <div class="internship-actions">
                <button class="btn btn-primary" onclick="applyToInternship(${internship.id})">
                    Apply Now
                </button>
                <button class="btn btn-secondary" onclick="viewInternshipDetails(${internship.id})">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

function renderApplications(applications) {
    const container = document.getElementById('applications-container');
    if (!container) return;
    
    container.innerHTML = applications.map(app => `
        <div class="application-card">
            <div class="application-header">
                <h3 class="internship-title">${app.title}</h3>
                <span class="application-status ${app.status.toLowerCase()}">${app.status}</span>
            </div>
            <div class="application-meta">
                <span><i class="fas fa-building"></i> ${app.company_name}</span>
                <span><i class="fas fa-calendar"></i> Applied on ${new Date(app.created_at).toLocaleDateString()}</span>
            </div>
        </div>
    `).join('');
}

function renderStudentProfile(profile) {
    const container = document.getElementById('profile-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="profile-card">
            <div class="profile-header">
                <div class="avatar">${getInitials(profile.name)}</div>
                <h2>${profile.name}</h2>
            </div>
            <div class="profile-details">
                <p><strong>Email:</strong> ${profile.email}</p>
                <p><strong>University:</strong> ${profile.university}</p>
                <p><strong>Major:</strong> ${profile.major}</p>
                <p><strong>Graduation Year:</strong> ${profile.graduation_year}</p>
                ${profile.bio ? `<p><strong>Bio:</strong> ${profile.bio}</p>` : ''}
            </div>
            <button class="btn btn-primary" onclick="editProfile()">Edit Profile</button>
        </div>
    `;
}

function renderCompanyProfile(profile) {
    const container = document.getElementById('profile-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="profile-card">
            <div class="profile-header">
                <div class="avatar">${getInitials(profile.company_name)}</div>
                <h2>${profile.company_name}</h2>
            </div>
            <div class="profile-details">
                <p><strong>Email:</strong> ${profile.email}</p>
                ${profile.description ? `<p><strong>Description:</strong> ${profile.description}</p>` : ''}
                ${profile.location ? `<p><strong>Location:</strong> ${profile.location}</p>` : ''}
                ${profile.website ? `<p><strong>Website:</strong> <a href="${profile.website}" target="_blank">${profile.website}</a></p>` : ''}
            </div>
            <button class="btn btn-primary" onclick="editCompanyProfile()">Edit Profile</button>
        </div>
    `;
}

function renderCompanyInternships(internships) {
    const container = document.getElementById('internships-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="section-header">
            <h2>My Internships</h2>
            <button class="btn btn-primary" onclick="createInternship()">
                <i class="fas fa-plus"></i> Create Internship
            </button>
        </div>
        ${internships.map(internship => `
            <div class="internship-card">
                <div class="internship-header">
                    <h3 class="internship-title">${internship.title}</h3>
                    <span class="internship-status">${internship.status || 'Active'}</span>
                </div>
                <div class="internship-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${internship.location}</span>
                    <span><i class="fas fa-clock"></i> ${internship.type}</span>
                    <span><i class="fas fa-dollar-sign"></i> ${internship.salary || 'Not specified'}</span>
                </div>
                <p>${internship.description || 'No description available'}</p>
                <div class="internship-actions">
                    <button class="btn btn-secondary" onclick="viewApplications(${internship.id})">
                        View Applications
                    </button>
                    <button class="btn btn-secondary" onclick="editInternship(${internship.id})">
                        Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteInternship(${internship.id})">
                        Delete
                    </button>
                </div>
            </div>
        `).join('')}
    `;
}

// Utility Functions
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Action Functions (to be implemented in dashboard pages)
function applyToInternship(internshipId) {
    // Show application modal
    document.getElementById('applicationModal').style.display = 'flex';
    document.getElementById('internship-id').value = internshipId;
}

function viewInternshipDetails(internshipId) {
    // Implementation for viewing internship details
}

function editProfile() {
    // Implementation for editing profile
}

function editCompanyProfile() {
    // Implementation for editing company profile
}

function createInternship() {
    document.getElementById('internship-modal-title').textContent = 'Create New Internship';
    document.getElementById('internshipForm').reset();
    document.getElementById('internship-id').value = '';
    document.getElementById('internshipModal').style.display = 'flex';
}

async function viewApplications(internshipId) {
    // Show the application modal
    const modal = document.getElementById('applicationModal');
    const details = document.getElementById('application-details');
    modal.style.display = 'flex';
    details.innerHTML = `<div class="loading"><div class="loader"></div><p>Loading applications...</p></div>`;
    try {
        const applications = await apiCall(`/api/companies/internship/${internshipId}/applications`);
        if (!applications.length) {
            details.innerHTML = '<p class="empty-state">No students have applied for this internship yet.</p>';
            return;
        }
        details.innerHTML = applications.map(app => `
            <div class="application-card">
                <div class="application-header">
                    <h4>${app.name}</h4>
                    <span class="application-status ${app.status.toLowerCase()}">${app.status}</span>
                </div>
                <div class="application-meta">
                    <span><i class='fas fa-graduation-cap'></i> ${app.university}</span>
                    <span><i class='fas fa-book'></i> ${app.major}</span>
                    <span><i class='fas fa-calendar'></i> Graduation: ${app.graduation_year}</span>
                    <span><i class='fas fa-cogs'></i> Skills: ${app.skills || 'N/A'}</span>
                    <span><i class='fas fa-briefcase'></i> Experience: ${app.experience || 'N/A'}</span>
                </div>
                <div class="application-body">
                    <p><strong>Cover Letter:</strong><br>${app.cover_letter || 'No cover letter provided.'}</p>
                    ${app.resume ? `<a href="/resumes/${app.resume}" target="_blank" class="btn btn-secondary btn-small"><i class='fas fa-file'></i> View Resume</a>` : ''}
                </div>
                <div class="application-actions">
                    ${(app.status !== 'Accepted') ? `<button class="btn btn-primary btn-small" onclick="InternLinkt.acceptApplication(${app.id}, ${internshipId})">Accept</button>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        details.innerHTML = '<p class="empty-state">Failed to load applications.</p>';
    }
}

function editInternship(internshipId) {
    // Implementation for editing internship
}

function deleteInternship(internshipId) {
    // Implementation for deleting internship
}

async function handleApplicationSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    formData.append('student_id', currentUser.id);
    try {
        const response = await fetch(`/api/internships/${formData.get('internship_id')}/apply`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            showToast('Application submitted successfully!', 'success');
            closeModal('applicationModal');
            setTimeout(() => {
                loadDashboardData();
            }, 500); // Give time for toast to show
        } else {
            showToast(data.error || 'Failed to submit application', 'error');
        }
    } catch (error) {
        console.error('Application error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

function updateUserInfo() {
    if (!currentUser) return;
    const userNameEl = document.getElementById('user-name');
    const sidebarNameEl = document.getElementById('sidebar-name');
    const userAvatarEl = document.getElementById('user-avatar');
    if (userNameEl) userNameEl.textContent = currentUser.name;
    if (sidebarNameEl) sidebarNameEl.textContent = currentUser.name;
    if (userAvatarEl) userAvatarEl.textContent = getInitials(currentUser.name);
}

async function acceptApplication(applicationId, internshipId) {
    try {
        const response = await apiCall(`/api/companies/application/${applicationId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Accepted' })
        });
        if (response.success) {
            showToast('Application accepted!', 'success');
            await viewApplications(internshipId); // Refresh modal
        } else {
            showToast(response.error || 'Failed to accept application', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    }
}

// Export functions for use in other files
window.InternLinkt = {
    showLoginModal,
    showSignupModal,
    closeModal,
    switchTab,
    switchSignupTab,
    logout,
    loadDashboardData,
    showToast,
    apiCall,
    acceptApplication
}; 