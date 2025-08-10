// Premium animations and interactions for landing page

document.addEventListener('DOMContentLoaded', function() {
  // Animate stats on scroll
  animateStats();
  // Smooth scroll for navigation links
  setupSmoothScroll();
  // Parallax effect for hero section
  setupParallax();
  // Intersection Observer for scroll animations
  setupScrollAnimations();

  // Add hover effects for interactive elements
  document.querySelectorAll('.feature-card, .step-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });
});

function animateStats() {
  const stats = document.querySelectorAll('.stat-number[data-target]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.getAttribute('data-target'));
        animateNumber(entry.target, 0, target, 2000);
        observer.unobserve(entry.target);
      }
    });
  });
  stats.forEach(stat => observer.observe(stat));
}

function animateNumber(element, start, end, duration) {
  const startTime = performance.now();
  const increment = (end - start) / (duration / 16);
  let current = start;
  function updateNumber(currentTime) {
    current += increment;
    if (current < end) {
      element.textContent = Math.floor(current) + (end >= 1000 ? '+' : '');
      requestAnimationFrame(updateNumber);
    } else {
      element.textContent = end + (end >= 1000 ? '+' : '');
    }
  }
  requestAnimationFrame(updateNumber);
}

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function setupParallax() {
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.hero-background');
    if (parallax) {
      const speed = scrolled * 0.5;
      parallax.style.transform = `translateY(${speed}px)`;
    }
  });
}

function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
} 