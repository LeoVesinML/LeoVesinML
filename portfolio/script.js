const root = document.documentElement;
const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');
const themeToggle = document.querySelector('.theme-toggle');
const copyButton = document.querySelector('.copy-email');

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

const eventNames = {
  PushEvent: 'PUSH',
  PullRequestEvent: 'PULL REQUEST',
  IssuesEvent: 'ISSUE',
  CreateEvent: 'CREATE',
  WatchEvent: 'STAR',
  ForkEvent: 'FORK',
  IssueCommentEvent: 'COMMENT',
  PullRequestReviewEvent: 'REVIEW'
};

function activityDescription(event) {
  const repo = event.repo?.name || 'GitHub';
  switch (event.type) {
    case 'PushEvent': {
      const count = event.payload?.commits?.length || 1;
      return `${count} commit${count === 1 ? '' : 's'} pushed to ${repo}`;
    }
    case 'PullRequestEvent':
      return `${event.payload?.action || 'updated'} pull request in ${repo}`;
    case 'IssuesEvent':
      return `${event.payload?.action || 'updated'} issue in ${repo}`;
    case 'CreateEvent':
      return `Created ${event.payload?.ref_type || 'repository item'} in ${repo}`;
    case 'WatchEvent':
      return `Starred ${repo}`;
    case 'ForkEvent':
      return `Forked ${repo}`;
    default:
      return `Activity in ${repo}`;
  }
}

async function loadGitHub() {
  const feed = document.getElementById('activity-feed');
  try {
    const [profileResponse, eventsResponse] = await Promise.all([
      fetch('https://api.github.com/users/LeoVesinML'),
      fetch('https://api.github.com/users/LeoVesinML/events/public?per_page=8')
    ]);
    if (!profileResponse.ok || !eventsResponse.ok) throw new Error('GitHub API unavailable');

    const profile = await profileResponse.json();
    const events = await eventsResponse.json();

    document.getElementById('repo-count').textContent = profile.public_repos ?? '—';
    document.getElementById('follower-count').textContent = profile.followers ?? '—';
    if (profile.created_at) document.getElementById('github-since').textContent = new Date(profile.created_at).getFullYear();

    feed.innerHTML = '';
    const visibleEvents = events.slice(0, 5);
    if (!visibleEvents.length) {
      feed.innerHTML = '<div class="activity-loading">No recent public activity to display.</div>';
      return;
    }

    visibleEvents.forEach((event) => {
      const row = document.createElement('div');
      row.className = 'activity-row';
      const repoUrl = `https://github.com/${event.repo?.name || 'LeoVesinML'}`;
      row.innerHTML = `
        <span class="activity-type">${eventNames[event.type] || 'ACTIVITY'}</span>
        <a href="${repoUrl}" target="_blank" rel="noreferrer">${activityDescription(event)}</a>
        <time datetime="${event.created_at}">${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(event.created_at))}</time>
      `;
      feed.appendChild(row);
    });
  } catch {
    feed.innerHTML = '<div class="activity-loading">Live GitHub data is temporarily unavailable. Visit the profile directly.</div>';
  }
}

loadGitHub();

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
  const pointCount = Math.min(70, Math.max(28, Math.floor(window.innerWidth / 22)));
  points = Array.from({ length: pointCount }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18
  }));
}

function drawNetwork() {
  if (!ctx) return;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const light = root.dataset.theme === 'light';
  ctx.fillStyle = light ? 'rgba(15, 23, 42, .18)' : 'rgba(99, 242, 207, .22)';
  points.forEach((point) => {
    point.x += point.vx;
    point.y += point.vy;
    if (point.x < 0 || point.x > window.innerWidth) point.vx *= -1;
    if (point.y < 0 || point.y > window.innerHeight) point.vy *= -1;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  });

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const distance = Math.hypot(dx, dy);
      if (distance < 125) {
        ctx.strokeStyle = light
          ? `rgba(15, 23, 42, ${0.07 * (1 - distance / 125)})`
          : `rgba(106, 168, 255, ${0.13 * (1 - distance / 125)})`;
        ctx.lineWidth = 0.7;
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
