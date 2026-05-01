// particles.js — система частиц с поддержкой отключения

let canvasElement = null;
let ctx = null;
let particles = [];
let animationId = null;
let isParticlesEnabled = true;

const PARTICLE_COUNT = 85;
const CONNECTION_DISTANCE = 120;
let mouseX = 0;
let mouseY = 0;
let isTyping = false;
let typingIntensity = 0;

let hoveredCardX = null;
let hoveredCardY = null;
let hoveredCardWidth = null;
let hoveredCardHeight = null;
let attractionStrength = 0;

function getParticleColor() {
  const isLight = document.documentElement.classList.contains('light');
  return isLight ? '#1F2937' : '#FFFFFF';
}

function getParticleGlowColor() {
  const isLight = document.documentElement.classList.contains('light');
  return isLight ? '#9CA3AF' : '#67E8F9';
}

function getConnectionColor(distance) {
  const isLight = document.documentElement.classList.contains('light');
  const opacity = Math.max(0, 1 - distance / CONNECTION_DISTANCE);
  if (isLight) {
    return `rgba(31, 41, 55, ${opacity * 0.2})`;
  } else {
    return `rgba(103, 232, 249, ${opacity * 0.3})`;
  }
}

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * (canvasElement ? canvasElement.width : window.innerWidth);
    this.y = Math.random() * (canvasElement ? canvasElement.height : window.innerHeight);
    this.baseSize = Math.random() * 2 + 1;
    this.size = this.baseSize;
    this.baseOpacity = Math.random() * 0.4 + 0.3;
    this.opacity = this.baseOpacity;
    this.angle = Math.random() * Math.PI * 2;
    this.vx = (Math.random() - 0.5) * 0.03;
    this.vy = (Math.random() - 0.5) * 0.03;
    this.orbitPhase = Math.random() * Math.PI * 2;
    this.orbitSpeed = 0.003 + Math.random() * 0.005;
  }

  update() {
    this.angle += 0.01;
    const breath = Math.sin(this.angle) * 0.35;
    this.size = this.baseSize + breath;
    this.opacity = this.baseOpacity + breath * 0.12;

    this.orbitPhase += this.orbitSpeed;
    this.x += Math.sin(this.orbitPhase) * 0.05;
    this.y += Math.cos(this.orbitPhase * 0.7) * 0.05;

    if (hoveredCardX !== null && attractionStrength > 0) {
      const cardCenterX = hoveredCardX + hoveredCardWidth / 2;
      const cardCenterY = hoveredCardY + hoveredCardHeight / 2;
      const dx = cardCenterX - this.x;
      const dy = cardCenterY - this.y;
      const distance = Math.hypot(dx, dy);
      
      if (distance < 300) {
        const force = (1 - distance / 300) * attractionStrength * 0.4;
        this.x += dx * force * 0.003;
        this.y += dy * force * 0.003;
        this.size += force * 0.8;
        this.opacity = Math.min(0.9, this.opacity + force * 0.2);
      }
    }

    this.vx += (Math.random() - 0.5) * 0.008;
    this.vy += (Math.random() - 0.5) * 0.008;
    
    this.vx = Math.max(-0.08, Math.min(0.08, this.vx));
    this.vy = Math.max(-0.08, Math.min(0.08, this.vy));
    
    this.x += this.vx;
    this.y += this.vy;

    if (canvasElement) {
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const dist = Math.hypot(dx, dy);

      if (dist < 160) {
        const force = (160 - dist) / 160;
        const angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * force * 1.2;
        this.y += Math.sin(angle) * force * 1.2;
        this.size += force * 1.8;
        this.opacity = Math.min(0.95, this.opacity + force * 0.35);
      }
    }

    if (isTyping || typingIntensity > 0) {
      const intensity = isTyping ? 0.8 : typingIntensity * 0.6;
      this.x += (Math.random() - 0.5) * intensity;
      this.y += (Math.random() - 0.5) * intensity;
      this.opacity = Math.min(0.9, this.opacity + 0.15 * (isTyping ? 1 : typingIntensity));
    }

    const width = canvasElement?.width || window.innerWidth;
    const height = canvasElement?.height || window.innerHeight;
    
    if (this.x < 5) { this.x = 5; this.vx *= -0.3; }
    if (this.x > width - 5) { this.x = width - 5; this.vx *= -0.3; }
    if (this.y < 5) { this.y = 5; this.vy *= -0.3; }
    if (this.y > height - 5) { this.y = height - 5; this.vy *= -0.3; }
  }

  draw() {
    if (!ctx) return;
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.shadowBlur = 5;
    ctx.shadowColor = getParticleGlowColor();
    ctx.fillStyle = getParticleColor();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawConnections() {
  if (!ctx) return;
  
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < CONNECTION_DISTANCE) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = getConnectionColor(distance);
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
  }
}

function resizeCanvas() {
  if (!canvasElement) return;
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
}

function clearCanvas() {
  if (!ctx) return;
  const isLight = document.documentElement.classList.contains('light');
  ctx.fillStyle = isLight ? '#F3F4F6' : '#0A0B0F';
  ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
}

function animate() {
  if (!isParticlesEnabled) {
    animationId = requestAnimationFrame(animate);
    return;
  }
  
  clearCanvas();

  particles.forEach(p => {
    p.update();
    p.draw();
  });
  
  drawConnections();

  if (attractionStrength > 0) {
    attractionStrength = Math.max(0, attractionStrength - 0.015);
  }
  if (attractionStrength === 0) {
    hoveredCardX = null;
    hoveredCardY = null;
  }

  animationId = requestAnimationFrame(animate);
}

function initParticles() {
  canvasElement = document.getElementById('canvas');
  if (!canvasElement) return;

  ctx = canvasElement.getContext('2d');
  resizeCanvas();

  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  if (animationId) cancelAnimationFrame(animationId);
  animate();
}

function stopParticles() {
  if (!isParticlesEnabled) return;
  isParticlesEnabled = false;
  if (ctx) {
    clearCanvas();
  }
}

function startParticles() {
  if (isParticlesEnabled) return;
  isParticlesEnabled = true;
  if (ctx) {
    clearCanvas();
    particles.forEach(p => p.draw());
    drawConnections();
  }
}

function toggleParticles() {
  if (isParticlesEnabled) {
    stopParticles();
  } else {
    startParticles();
  }
  updateParticlesButton();
}

function updateParticlesButton() {
  const btn = document.getElementById('particles-toggle');
  if (btn) {
    btn.textContent = isParticlesEnabled ? '✨' : '💤';
    btn.title = isParticlesEnabled ? 'Отключить анимацию частиц' : 'Включить анимацию частиц';
  }
}

window.updateHoveredCard = function(element) {
  if (!isParticlesEnabled) return;
  if (!element) {
    attractionStrength = 0;
    return;
  }
  const rect = element.getBoundingClientRect();
  hoveredCardX = rect.left;
  hoveredCardY = rect.top;
  hoveredCardWidth = rect.width;
  hoveredCardHeight = rect.height;
  attractionStrength = 1.0;
};

window.refreshParticles = function() {
  if (!isParticlesEnabled) return;
  clearCanvas();
  if (ctx) {
    particles.forEach(p => p.draw());
    drawConnections();
  }
};

window.toggleParticles = toggleParticles;

window.addEventListener('mousemove', (e) => {
  if (!isParticlesEnabled) return;
  mouseX = e.clientX;
  mouseY = e.clientY;
});

window.addEventListener('resize', () => {
  resizeCanvas();
  if (!isParticlesEnabled && ctx) {
    clearCanvas();
    return;
  }
  const oldWidth = canvasElement?.width || window.innerWidth;
  const oldHeight = canvasElement?.height || window.innerHeight;
  const scaleX = (canvasElement?.width || window.innerWidth) / oldWidth;
  const scaleY = (canvasElement?.height || window.innerHeight) / oldHeight;
  
  particles.forEach(p => {
    p.x *= scaleX;
    p.y *= scaleY;
  });
});

const searchInput = document.getElementById('search-input');
if (searchInput) {
  searchInput.addEventListener('input', () => {
    if (!isParticlesEnabled) return;
    isTyping = true;
    typingIntensity = 1.0;
    clearTimeout(window.typingTimer);
    window.typingTimer = setTimeout(() => {
      isTyping = false;
      typingIntensity = 0;
    }, 1400);
  });
}

const themeObserver = new MutationObserver(() => {
  if (isParticlesEnabled) {
    window.refreshParticles();
  } else if (ctx) {
    clearCanvas();
  }
});
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

window.initParticles = initParticles;
window.refreshBackground = window.refreshParticles;

if (document.getElementById('canvas')) {
  initParticles();
}
