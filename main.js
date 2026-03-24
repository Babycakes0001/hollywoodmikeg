// ===========================
// HOLLYWOOD MIKE G — main.js
// ===========================

// Set footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Dynamically measure nav height and set CSS variable
function updateNavHeight() {
  const nav = document.getElementById('nav');
  if (nav) {
    document.documentElement.style.setProperty('--nav-height', nav.offsetHeight + 'px');
  }
}
updateNavHeight();
window.addEventListener('resize', updateNavHeight);
window.addEventListener('load', updateNavHeight);

// Nav scroll effect
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  if (window.scrollY > 30) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// Mobile menu toggle
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
}

// Close mobile menu on link click
document.querySelectorAll('.mobile-menu a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.remove('open');
  });
});

// Fade-in on scroll
const fadeEls = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

fadeEls.forEach(el => observer.observe(el));

// Lightbox (gallery page)
function openLightbox(el) {
  const img = el.querySelector('img');
  if (!img) return; // placeholder, no image yet
  const lightbox = document.getElementById('lightbox');
  document.getElementById('lightbox-img').src = img.src;
  lightbox.classList.add('open');
}

function closeLightbox() {
  document.getElementById('lightbox')?.classList.remove('open');
}

// Close lightbox on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});
