const root = document.documentElement;
const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');
const themeToggle = document.querySelector('.theme-toggle');
const copyButton = document.querySelector('.copy-email');

// Load the refined visual system without changing the original stylesheet pipeline.
const refinedStyles = document.createElement('link');
refinedStyles.rel = 'stylesheet';
refinedStyles.href = 'design-v2.css';
document.head.appendChild(refinedStyles);

// The recruiter-facing portfolio deliberately avoids a raw GitHub activity feed.
// Projects link to their repositories where relevant, while the page stays focused.
document.getElementById('github')?.remove();
document.querySelectorAll('a[href="#github"]').forEach((link) => link.remove());

const contactEmail = 'vesin.lev@gmail.com';
document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
  link.href = `mailto:${contactEmail}`;
  if (link.textContent.includes('@')) link.textContent = contactEmail;
});
if (copyButton) copyButton.dataset.email = contactEmail;

const savedTheme = localStorage.getItem('portfolio-theme');
if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;

window.addEventListener('scroll', () => {
  header?.classList.toggle('scrolled', window.scrollY > 14);
}, { passive: true });

menuToggle?.addEventListener('click', () => {
  const open = navMenu.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.nav-menu a').forEach((link) => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

themeToggle?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('portfolio-theme', root.dataset.theme);
});

copyButton?.addEventListener('click', async () => {
  const email = copyButton.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
    copyButton.textContent = 'Email copied';
    copyButton.classList.add('copied');
    setTimeout(() => {
      copyButton.textContent = 'Copy email';
      copyButton.classList.remove('copied');
    }, 1800);
  } catch {
    window.location.href = `mailto:${email}`;
  }
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));

document.getElementById('year').textContent = String(new Date().getFullYear());

// Subtle mouse depth on the profile card for desktop users.
const profileCard = document.querySelector('.hero-card');
if (profileCard && window.matchMedia('(pointer:fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  profileCard.addEventListener('pointermove', (event) => {
    const rect = profileCard.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    profileCard.style.transform = `perspective(1100px) rotateY(${x * 5}deg) rotateX(${y * -4}deg) translateY(-4px)`;
  });
  profileCard.addEventListener('pointerleave', () => {
    profileCard.style.transform = '';
  });
}

const canvas = document.getElementById('network-canvas');
const ctx = canvas?.getContext('2d');
let points = [];
let animationFrame;

function resizeCanvas() {
  if (!canvas || !ctx) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const pointCount = Math.min(56, Math.max(24, Math.floor(window.innerWidth / 28)));
  points = Array.from({ length: pointCount }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.12,
    vy: (Math.random() - 0.5) * 0.12
  }));
}

function drawNetwork() {
  if (!ctx) return;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const light = root.dataset.theme === 'light';
  ctx.fillStyle = light ? 'rgba(79,70,229,.13)' : 'rgba(139,92,246,.20)';

  points.forEach((point) => {
    point.x += point.vx;
    point.y += point.vy;
    if (point.x < 0 || point.x > window.innerWidth) point.vx *= -1;
    if (point.y < 0 || point.y > window.innerHeight) point.vy *= -1;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 1.05, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const distance = Math.hypot(dx, dy);
      if (distance < 118) {
        const strength = 1 - distance / 118;
        ctx.strokeStyle = light
          ? `rgba(79,70,229,${0.05 * strength})`
          : `rgba(34,211,238,${0.09 * strength})`;
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[j].x, points[j].y);
        ctx.stroke();
      }
    }
  }
  animationFrame = requestAnimationFrame(drawNetwork);
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  resizeCanvas();
  drawNetwork();
  window.addEventListener('resize', () => {
    cancelAnimationFrame(animationFrame);
    resizeCanvas();
    drawNetwork();
  });
}
