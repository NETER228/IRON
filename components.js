// components.js - загрузка header и footer

async function loadComponent(elementId, fileName) {
  try {
    const response = await fetch(fileName);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    document.getElementById(elementId).innerHTML = html;
    return true;
  } catch (error) {
    return false;
  }
}

async function loadAllComponents() {
  await loadComponent('header-container', 'header.html');
  await loadComponent('footer-container', 'footer.html');
  initTheme();
  initDynamicHandlers();
}

function initTheme() {
  const savedTheme = localStorage.getItem('iron-theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light');
  } else if (savedTheme === 'dark') {
    document.documentElement.classList.remove('light');
  }
  updateThemeButton();
}

function updateThemeButton() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;
  const isLight = document.documentElement.classList.contains('light');
  themeToggle.textContent = isLight ? '🌙' : '☀️';
}

window.updateThemeButton = updateThemeButton;

function initDynamicHandlers() {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const newToggle = themeToggle.cloneNode(true);
    themeToggle.parentNode.replaceChild(newToggle, themeToggle);
    
    newToggle.addEventListener('click', () => {
      const isLight = document.documentElement.classList.contains('light');
      if (isLight) {
        document.documentElement.classList.remove('light');
        localStorage.setItem('iron-theme', 'dark');
      } else {
        document.documentElement.classList.add('light');
        localStorage.setItem('iron-theme', 'light');
      }
      updateThemeButton();
      if (window.initParticles) window.initParticles();
      if (window.refreshBackground) window.refreshBackground();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAllComponents);
} else {
  loadAllComponents();
}