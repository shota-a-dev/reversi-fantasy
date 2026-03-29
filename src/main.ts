import './style.css';
import { createHomeScreen } from './ui/homeScreen';
import { createFormationScreen } from './ui/formationScreen';
import { createGachaScreen } from './ui/gachaScreen';
import { createGameScreen } from './ui/gameScreen';
import { createResultScreen } from './ui/resultScreen';
import { createHelpScreen } from './ui/helpScreen';
import { createOnlineScreen } from './ui/onlineScreen';

// ─── App Initialization ─────
function initApp(): void {
  const app = document.getElementById('app');
  if (!app) return;

  // Clear default vite content
  app.innerHTML = '';

  // Create all screens
  app.appendChild(createHomeScreen());
  app.appendChild(createFormationScreen());
  app.appendChild(createGachaScreen());
  app.appendChild(createGameScreen());
  app.appendChild(createResultScreen());
  app.appendChild(createHelpScreen());
  app.appendChild(createOnlineScreen());

  // PWA Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration failed:', err);
      });
    });
  }

  // Prevent default touch behaviors for game
  document.addEventListener('touchmove', (e) => {
    if ((e.target as HTMLElement).closest('.board-container')) {
      e.preventDefault();
    }
  }, { passive: false });

  // Viewport height fix for iOS
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  setVH();
  window.addEventListener('resize', setVH);
}

// Start
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
