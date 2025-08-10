// Company Dashboard Specific JS

let currentSection = 'dashboard';
let applications = [];
let internships = [];
let allApplications = [];

document.addEventListener('DOMContentLoaded', async function() {
  if (!currentUser) {
    window.location.href = '/';
    return;
  }
  try {
    await loadDashboardData();
    updateUserInfo();
    setupDashboardEventListeners();
    // Smoothly transition from loading to dashboard
    const loadingScreen = document.getElementById('dashboard-loading');
    const dashboardContent = document.getElementById('dashboard-content');
    loadingScreen.style.transition = 'opacity 0.5s ease-out';
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      dashboardContent.style.display = 'flex';
      dashboardContent.style.opacity = '0';
      dashboardContent.style.transition = 'opacity 0.5s ease-in';
      setTimeout(() => {
        dashboardContent.style.opacity = '1';
      }, 50);
    }, 500);
  } catch (error) {
    showToast();
  }
});

function updateUserInfo() {
  document.getElementById('user-name').textContent = currentUser.name;
  document.getElementById('sidebar-name').textContent = currentUser.name;
  document.getElementById('user-avatar').textContent = getInitials(currentUser.name);
}

function setupDashboardEventListeners() {
  // Internship form
  document.getElementById('internshipForm')?.addEventListener('submit', handleInternshipSubmit);
  // Profile form
  document.getElementById('profileForm')?.addEventListener('submit', handleProfileUpdate);
}

function showSection(section) {
  // Hide all sections
  document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
  // Show selected section
  document.getElementById(`${section}-section`).style.display = 'block';
  // Update active nav link
  document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
  event.target.classList.add('active');
  currentSection = section;
  // Load section data
  if (section === 'internships') {
    loadInternships();
  } else if (section === 'applications') {
    loadAllApplications();
  } else if (section === 'profile') {
    loadProfile();
  }
}

async function loadDashboardData() {
  try {
    // Load company internships
    const internshipsData = await apiCall(`/api/companies/${currentUser.id}/internships`);
    internships = internshipsData;
    // Load all applications for the first internship (if any)
    const applicationsData = internships.length > 0 ? await apiCall(`/api/companies/internship/${internships[0].id}/applications`) : [];
    allApplications = applicationsData;
    updateDashboardStats(internshipsData, applicationsData);
    renderRecentApplications(applicationsData.slice(0, 5));
    // Load profile
    const profile = await apiCall(`/api/companies/${currentUser.id}`);
    renderCompanyProfile(profile);
  } catch (error) {
    showToast('Failed to load dashboard data', 'error');
  }
}

function updateDashboardStats(internships, applications) {
  document.getElementById('total-internships').textContent = internships.length;
  document.getElementById('total-applications').textContent = applications.length;
  document.getElementById('pending-applications').textContent = applications.filter(app => app.status === 'Pending').length;
  document.getElementById('shortlisted-applications').textContent = applications.filter(app => app.status === 'Shortlisted').length;
}

function renderRecentApplications(applications) {
  const container = document.getElementById('recent-applications');
  if (!container) return;
  if (applications.length === 0) {
    container.innerHTML = '<p class="empty-state">No applications yet. Create your first internship!</p>';
    return;
  }
  container.innerHTML = applications.map(app => `
    <div class="application-card">
      <div class="application-header">
        <h4>${app.name}</h4>
        <span class="application-status ${app.status.toLowerCase()}">${app.status}</span>
      </div>
      <div class="application-meta">
        <span><i class="fas fa-graduation-cap"></i> ${app.university}</span>
        <span><i class="fas fa-calendar"></i> ${new Date(app.created_at).toLocaleDateString()}</span>
      </div>
      <button class="btn btn-secondary btn-small" onclick="reviewApplication(${app.id})">Review</button>
    </div>
  `).join('');
}

async function loadInternships() {
  try {
    const data = await apiCall(`/api/companies/${currentUser.id}/internships`);
    internships = data;
    renderCompanyInternships(data);
  } catch (error) {
    showToast('Failed to load internships', 'error');
  }
}

async function loadAllApplications() {
  try {
    // Get all applications for all internships
    const allApps = [];
    for (const internship of internships) {
      const apps = await apiCall(`/api/companies/internship/${internship.id}/applications`);
      allApps.push(...apps.map(app => ({ ...app, internship_title: internship.title })));
    }
    allApplications = allApps;
    // Populate internship filter
    const filter = document.getElementById('internship-filter');
    filter.innerHTML = '<option value="">All Internships</option>' + internships.map(internship => `<option value="${internship.id}">${internship.title}</option>`).join('');
    renderApplications(allApps);
  } catch (error) {
    showToast('Failed to load applications', 'error');
  }
}

async function loadProfile() {
  try {
    const data = await apiCall(`/api/companies/${currentUser.id}`);
    renderCompanyProfile(data);
  } catch (error) {
    showToast('Failed to load profile', 'error');
  }
}

function renderCompanyInternships(internships) {
  const container = document.getElementById('internships-container');
  if (!container) return;
  if (internships.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No internships created yet.</p>
        <button class="btn btn-primary" onclick="createInternship()">
          <i class="fas fa-plus"></i>
          Create Your First Internship
        </button>
      </div>
    `;
    return;
  }
  container.innerHTML = internships.map(internship => `
    <div class="internship-card">
      <div class="internship-header">
        <h3 class="internship-title">${internship.title}</h3>
        <span class="internship-status">${internship.status || 'Active'}</span>
      </div>
      <div class="internship-meta">
        <span><i class="fas fa-map-marker-alt"></i> ${internship.location}</span>
        <span><i class="fas fa-clock"></i> ${internship.type}</span>
        <span><i class="fas fa-dollar-sign"></i> ${internship.salary || 'Not specified'}</span>
        <span><i class="fas fa-calendar"></i> Deadline: ${new Date(internship.deadline).toLocaleDateString()}</span>
      </div>
      <p>${internship.description || 'No description available'}</p>
      <div class="internship-actions">
        <button class="btn btn-secondary" onclick="viewApplications(${internship.id})">
          <i class="fas fa-users"></i>
          View Applications
        </button>
        <button class="btn btn-secondary" onclick="editInternship(${internship.id})">
          <i class="fas fa-edit"></i>
          Edit
        </button>
        <button class="btn btn-danger" onclick="deleteInternship(${internship.id})">
          <i class="fas fa-trash"></i>
          Delete
        </button>
      </div>
    </div>
  `).join('');
}

function renderApplications(applications) {
  const container = document.getElementById('applications-container');
  if (!container) return;
  if (applications.length === 0) {
    container.innerHTML = '<p class="empty-state">No applications found.</p>';
    return;
  }
  container.innerHTML = applications.map(app => `
    <div class="application-card">
      <div class="application-header">
        <div>
          <h4>${app.name}</h4>
          <small>${app.internship_title}</small>
        </div>
        <span class="application-status ${app.status.toLowerCase()}">${app.status}</span>
      </div>
      <div class="application-meta">
        <span><i class="fas fa-graduation-cap"></i> ${app.university}</span>
        <span><i class="fas fa-book"></i> ${app.major}</span>
        <span><i class="fas fa-calendar"></i> ${new Date(app.created_at).toLocaleDateString()}</span>
      </div>
      <div class="application-actions">
        <button class="btn btn-secondary" onclick="reviewApplication(${app.id})">
          <i class="fas fa-eye"></i>
          Review
        </button>
        <select class="status-select" onchange="updateApplicationStatus(${app.id}, this.value)">
          <option value="Pending" ${app.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Shortlisted" ${app.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
          <option value="Accepted" ${app.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
          <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </div>
    </div>
  `).join('');
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

function filterApplications() {
  const internshipFilter = document.getElementById('internship-filter').value;
  const statusFilter = document.getElementById('status-filter').value;
  let filtered = allApplications;
  if (internshipFilter) {
    filtered = filtered.filter(app => app.internship_id == internshipFilter);
  }
  if (statusFilter) {
    filtered = filtered.filter(app => app.status === statusFilter);
  }
  renderApplications(filtered);
}

function createInternship() {
  document.getElementById('internship-modal-title').textContent = 'Create New Internship';
  document.getElementById('internshipForm').reset();
  document.getElementById('internship-id').value = '';
  document.getElementById('internshipModal').style.display = 'flex';
}

function editInternship(internshipId) {
  const internship = internships.find(i => i.id === internshipId);
  if (!internship) return;
  document.getElementById('internship-modal-title').textContent = 'Edit Internship';
  const form = document.getElementById('internshipForm');
  form.id.value = internship.id;
  form.title.value = internship.title;
  form.location.value = internship.location;
  form.type.value = internship.type;
  form.duration.value = internship.duration || '';
  form.salary.value = internship.salary || '';
  form.deadline.value = internship.deadline ? internship.deadline.split('T')[0] : '';
  form.skills.value = internship.skills || '';
  form.description.value = internship.description || '';
  document.getElementById('internshipModal').style.display = 'flex';
}

async function handleInternshipSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const internshipData = {
    title: formData.get('title'),
    location: formData.get('location'),
    type: formData.get('type'),
    duration: formData.get('duration'),
    salary: formData.get('salary'),
    deadline: formData.get('deadline'),
    skills: formData.get('skills'),
    description: formData.get('description')
  };
  const internshipId = formData.get('id');
  try {
    let data;
    if (internshipId) {
      // Update existing internship
      data = await apiCall(`/api/internships/${internshipId}`, {
        method: 'PUT',
        body: JSON.stringify(internshipData)
      });
    } else {
      // Create new internship
      data = await apiCall(`/api/companies/${currentUser.id}/internships`, {
        method: 'POST',
        body: JSON.stringify(internshipData)
      });
    }
    if (data.success) {
      showToast(internshipId ? 'Internship updated successfully!' : 'Internship created successfully!', 'success');
      closeModal('internshipModal');
      // Refresh internships
      if (currentSection === 'internships') {
        loadInternships();
      }
      loadDashboardData();
    } else {
      showToast(data.error || '', 'error');
    }
  } catch (error) {
    console.error('Internship error:', error);
    showToast('Network error. Please try again.', 'error');
  }
}

async function deleteInternship(internshipId) {
  if (!confirm('Are you sure you want to delete this internship? This action cannot be undone.')) {
    return;
  }
  try {
    const data = await apiCall(`/api/internships/${internshipId}`, {
      method: 'DELETE'
    });
    if (data.success) {
      showToast('Internship deleted successfully!', 'success');
      loadInternships();
      loadDashboardData();
    } else {
      showToast(data.error || 'Failed to delete internship', 'error');
    }
  } catch (error) {
    console.error('Delete error:', error);
    showToast('Network error. Please try again.', 'error');
  }
}

async function updateApplicationStatus(applicationId, newStatus) {
  try {
    const data = await apiCall(`/api/companies/application/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    if (data.success) {
      showToast('Application status updated successfully!', 'success');
      loadAllApplications();
      loadDashboardData();
    } else {
      showToast(data.error || 'Failed to update status', 'error');
    }
  } catch (error) {
    console.error('Status update error:', error);
    showToast('Network error. Please try again.', 'error');
  }
}

function reviewApplication(applicationId) {
  // Implementation for reviewing application details
  showToast('Application review feature coming soon!', 'success');
}

function editCompanyProfile() {
  // Populate form with current data
  const form = document.getElementById('profileForm');
  form.name.value = currentUser.name;
  form.email.value = currentUser.email;
  form.description.value = currentUser.description || '';
  form.website.value = currentUser.website || '';
  form.location.value = currentUser.location || '';
  document.getElementById('profileModal').style.display = 'flex';
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const profileData = {
    name: formData.get('name'),
    email: formData.get('email'),
    description: formData.get('description'),
    website: formData.get('website'),
    location: formData.get('location')
  };
  try {
    const data = await apiCall(`/api/companies/${currentUser.id}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    if (data.success) {
      showToast('Profile updated successfully!', 'success');
      closeModal('profileModal');
      // Update current user data
      currentUser = { ...currentUser, ...profileData };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      updateUserInfo();
      // Refresh profile
      if (currentSection === 'profile') {
        loadProfile();
      }
    } else {
      showToast(data.error || 'Failed to update profile', 'error');
    }
  } catch (error) {
    console.error('Profile update error:', error);
    showToast('Network error. Please try again.', 'error');
  }
}

// Override the logout function
function logout() {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('userRole');
  window.location.href = '/';
} 