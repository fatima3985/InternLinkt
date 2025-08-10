// Student Dashboard Specific JS

console.log('student_dashboard.js loaded');

let dashboardDataLoading = false;

document.addEventListener('DOMContentLoaded', async function () {
  console.log('DOMContentLoaded fired');

  console.log('Current User:', currentUser);
  if (!currentUser) {
    console.log('Redirecting to / because no user');
    window.location.href = '/';
    return;
  }

  if (dashboardDataLoading) {
    console.log('Dashboard data already loading, skipping duplicate call');
    return;
  }
  dashboardDataLoading = true;

  try {
    console.log('Loading dashboard data...');
    await loadDashboardData();
    console.log('Dashboard data loaded');

    updateUserInfo();
    setupEventListeners();

    const dashboard = document.getElementById('dashboard-content');
    if (dashboard) {
      dashboard.style.display = 'flex'; // or block if you prefer
      console.log('Dashboard shown');
    }
  } catch (error) {
    console.error('Failed to load dashboard:', error);
    showToast('Failed to load dashboard data', 'error');
  } finally {
    dashboardDataLoading = false;
  }
});

function updateUserInfo() {
  if (!currentUser) return;
  const userNameEl = document.getElementById('user-name');
  const sidebarNameEl = document.getElementById('sidebar-name');
  const userAvatarEl = document.getElementById('user-avatar');
  if (userNameEl) userNameEl.textContent = currentUser.name;
  if (sidebarNameEl) sidebarNameEl.textContent = currentUser.name;
  if (userAvatarEl) userAvatarEl.textContent = getInitials(currentUser.name);
  console.log('User info updated:', currentUser.name);
}

function setupEventListeners() {
  console.log('Setting up event listeners...');
  // Application form
  document.getElementById('applicationForm')?.addEventListener('submit', handleApplicationSubmit);
  // Profile form
  document.getElementById('profileForm')?.addEventListener('submit', handleProfileUpdate);
  // Search and Filter
  document.getElementById('search-input')?.addEventListener('input', filterInternships);
  document.getElementById('location-filter')?.addEventListener('change', filterInternships);
  document.getElementById('type-filter')?.addEventListener('change', filterInternships);
  console.log('Event listeners set up');
}

async function loadDashboardData() {
  console.log('Starting to load dashboard data');

  // Use Promise.all to parallelize API calls (better performance)
  try {
    const [internships, applications, profile] = await Promise.all([
      apiCall('/api/internships'),
      apiCall(`/api/students/${currentUser.id}/applications`),
      apiCall(`/api/students/${currentUser.id}`)
    ]);

    console.log('API calls complete');

    renderInternships(internships);
    renderApplications(applications);
    renderStudentProfile(profile);
    updateStats(applications);
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    throw err;
  }
}

function updateStats(applications) {
  const total = applications.length;
  const pending = applications.filter(app => app.status === 'Pending').length;
  const accepted = applications.filter(app => app.status === 'Accepted').length;
  const shortlisted = applications.filter(app => app.status === 'Shortlisted').length;
  document.getElementById('total-applications').textContent = total;
  document.getElementById('pending-applications').textContent = pending;
  document.getElementById('accepted-applications').textContent = accepted;
  document.getElementById('shortlisted-applications').textContent = shortlisted;
  console.log('Stats updated');
}

// Section Navigation
function showSection(section, event) {
  console.log('Switching to section:', section);
  // Hide all sections
  document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
  // Show selected section
  const sec = document.getElementById(`${section}-section`);
  if (sec) sec.style.display = 'block';

  // Update active nav link
  document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');

  // Load section data
  if (section === 'internships') {
    loadInternships();
  } else if (section === 'applications') {
    loadStudentApplications();
  } else if (section === 'profile') {
    loadStudentProfile();
  }
}

async function loadInternships() {
  console.log('Loading internships for section...');
  try {
    const internships = await apiCall('/api/internships');
    renderInternships(internships);
  } catch (error) {
    console.error('Failed to load internships', error);
    showToast('Failed to load internships', 'error');
  }
}

async function loadStudentApplications() {
  console.log('Loading student applications for section...');
  try {
    const applications = await apiCall(`/api/students/${currentUser.id}/applications`);
    renderApplications(applications);
  } catch (error) {
    console.error('Failed to load applications', error);
    showToast('Failed to load applications', 'error');
  }
}

async function loadStudentProfile() {
  console.log('Loading student profile for section...');
  try {
    const profile = await apiCall(`/api/students/${currentUser.id}`);
    renderStudentProfile(profile);
  } catch (error) {
    console.error('Failed to load profile', error);
    showToast('Failed to load profile', 'error');
  }
}

function renderInternships(internships) {
  const container = document.getElementById('internships-container');
  if (!container) return;
  if (internships.length === 0) {
    container.innerHTML = '<p class="empty-state">No internships available at the moment.</p>';
    return;
  }
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
  console.log('Internships rendered:', internships.length);
}

function renderApplications(applications) {
  const container = document.getElementById('applications-container');
  if (!container) return;
  if (applications.length === 0) {
    container.innerHTML = '<p class="empty-state">No applications yet. Start browsing internships!</p>';
    return;
  }
  container.innerHTML = applications.map(app => `
    <div class="application-card">
      <div class="application-header">
        <h4>${app.title}</h4>
        <span class="application-status ${app.status.toLowerCase()}">${app.status}</span>
      </div>
      <div class="application-meta">
        <span><i class="fas fa-building"></i> ${app.company_name}</span>
        <span><i class="fas fa-map-marker-alt"></i> ${app.location}</span>
        <span><i class="fas fa-calendar"></i> ${new Date(app.applied_at).toLocaleDateString()}</span>
      </div>
    </div>
  `).join('');
  console.log('Applications rendered:', applications.length);
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
        ${profile.phone ? `<p><strong>Phone:</strong> ${profile.phone}</p>` : ''}
        ${profile.location ? `<p><strong>Location:</strong> ${profile.location}</p>` : ''}
        ${profile.bio ? `<p><strong>Bio:</strong> ${profile.bio}</p>` : ''}
        ${profile.skills ? `<p><strong>Skills:</strong> ${profile.skills}</p>` : ''}
        ${profile.experience ? `<p><strong>Experience:</strong> ${profile.experience}</p>` : ''}
      </div>
      <button class="btn btn-primary" onclick="editProfile()">Edit Profile</button>
    </div>
  `;
  console.log('Profile rendered for:', profile.name);
}

async function handleApplicationSubmit(event) {
  event.preventDefault();
  console.log('Submitting application...');
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
        // Avoid multiple rapid reloads
        if (!dashboardDataLoading) {
          loadDashboardData();
        }
      }, 500); // Give time for toast to show
    } else {
      showToast(data.error || 'Failed to submit application', 'error');
    }
  } catch (error) {
    console.error('Application error:', error);
    showToast('Network error. Please try again.', 'error');
  }
}

function filterInternships() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const locationFilter = document.getElementById('location-filter').value;
  const typeFilter = document.getElementById('type-filter').value;
  const cards = document.querySelectorAll('.internship-card');
  cards.forEach(card => {
    const title = card.querySelector('.internship-title').textContent.toLowerCase();
    const company = card.querySelector('.internship-company').textContent.toLowerCase();
    const location = card.querySelector('.internship-meta span').textContent;
    const type = card.querySelector('.internship-meta span:nth-child(2)').textContent;
    const matchesSearch = title.includes(searchTerm) || company.includes(searchTerm);
    const matchesLocation = !locationFilter || location.includes(locationFilter);
    const matchesType = !typeFilter || type.includes(typeFilter);
    card.style.display = matchesSearch && matchesLocation && matchesType ? 'block' : 'none';
  });
  console.log('Filter applied:', { searchTerm, locationFilter, typeFilter });
}

function editProfile() {
  // Populate form with current data
  const form = document.getElementById('profileForm');
  form.name.value = currentUser.name;
  form.email.value = currentUser.email;
  form.university.value = currentUser.university || '';
  form.major.value = currentUser.major || '';
  form.graduation_year.value = currentUser.graduation_year || '';
  form.phone.value = currentUser.phone || '';
  form.location.value = currentUser.location || '';
  form.bio.value = currentUser.bio || '';
  form.skills.value = currentUser.skills || '';
  form.experience.value = currentUser.experience || '';
  document.getElementById('profileModal').style.display = 'flex';
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  console.log('Updating profile...');
  const formData = new FormData(event.target);
  const profileData = {
    name: formData.get('name'),
    email: formData.get('email'),
    university: formData.get('university'),
    major: formData.get('major'),
    graduation_year: formData.get('graduation_year'),
    phone: formData.get('phone'),
    location: formData.get('location'),
    bio: formData.get('bio'),
    skills: formData.get('skills'),
    experience: formData.get('experience')
  };
  
  try {
    const data = await apiCall(`/api/students/${currentUser.id}`, {
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
        loadStudentProfile();
      }
    } else {
      showToast(data.error || 'Failed to update profile', 'error');
    }
  } catch (error) {
    console.error('Profile update error:', error);
    showToast('Network error. Please try again.', 'error');
  }
}
