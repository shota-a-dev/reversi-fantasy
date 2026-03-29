import { store } from '../store/store';
import { CHARACTERS } from '../core/characters';
import { screenManager } from './screenManager';
import { startGame } from './gameScreen';
import { audioManager } from '../core/audioManager';

export function createHomeScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.id = 'screen-home';
  screen.className = 'screen screen-active';

  function render() {
    const data = store.getData();
    const leader = CHARACTERS[data.selectedLeader];

    screen.innerHTML = `
      <div class="home-bg">
        <div class="home-particles" id="home-particles"></div>
      </div>
      <div class="home-content">
        <div class="home-logo">
          <h1 class="game-title">盤上のファンタジア</h1>
          <p class="game-subtitle">- Skill Reversi -</p>
        </div>

        <div class="home-leader-display">
          <div class="home-leader-icon" style="background: linear-gradient(135deg, ${leader.color}66, ${leader.color})">
            ${leader.icon}
          </div>
          <div class="home-leader-info">
            <span class="home-leader-name">${leader.name}</span>
            <span class="home-leader-title">${leader.title}</span>
          </div>
        </div>

        <div class="home-stats">
          <div class="stat-badge">💎 ${data.currency}</div>
          <div class="stat-badge">🏆 ${data.totalWins}/${data.totalGames}</div>
        </div>

        <div class="home-menu">
          <div class="menu-row">
            <button class="menu-btn menu-btn-primary" id="btn-ai-battle">
              <span class="menu-icon">⚔️</span>
              <span class="menu-text">AI対戦</span>
            </button>
            <button class="menu-btn menu-btn-accent" id="btn-online-battle">
              <span class="menu-icon">🌐</span>
              <span class="menu-text">オンライン</span>
            </button>
          </div>
          
          <div class="menu-row">
            <button class="menu-btn menu-btn-secondary" id="btn-formation">
              <span class="menu-icon">👥</span>
              <span class="menu-text">編成</span>
            </button>
            <button class="menu-btn menu-btn-secondary" id="btn-gacha">
              <span class="menu-icon">🎰</span>
              <span class="menu-text">ガチャ</span>
            </button>
          </div>

          <div class="menu-row">
            <button class="menu-btn menu-btn-tertiary" id="btn-help">
              <span class="menu-icon">📖</span>
              <span class="menu-text">ヘルプ</span>
            </button>
            <button class="menu-btn menu-btn-tertiary" id="btn-settings">
              <span class="menu-icon">⚙️</span>
              <span class="menu-text">設定</span>
            </button>
          </div>
        </div>

        <div class="home-difficulty" id="difficulty-selector">
          <label>AI難易度:</label>
          <div class="difficulty-buttons">
            <button class="diff-btn ${data.settings.aiDifficulty === 1 ? 'active' : ''}" data-level="1">初級</button>
            <button class="diff-btn ${data.settings.aiDifficulty === 2 ? 'active' : ''}" data-level="2">中級</button>
            <button class="diff-btn ${data.settings.aiDifficulty === 3 ? 'active' : ''}" data-level="3">上級</button>
          </div>
        </div>
      </div>

      <!-- 設定モーダル -->
      <div class="modal-overlay" id="settings-modal" style="display: none;">
        <div class="modal-content">
          <h2>⚙️ 設定</h2>
          <div class="setting-item">
            <label>色覚多様性モード</label>
            <label class="toggle-switch">
              <input type="checkbox" id="setting-colorblind" ${data.settings.colorBlindMode ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <label>データリセット</label>
            <button class="btn-danger" id="btn-reset-data">リセット</button>
          </div>
          <button class="btn-secondary modal-close" id="settings-close">閉じる</button>
        </div>
      </div>
    `;

    // イベント
    screen.querySelector('#btn-ai-battle')?.addEventListener('click', () => {
      audioManager.init();
      screenManager.navigate('game');
      setTimeout(() => startGame('ai', data.settings.aiDifficulty), 100);
    });

    screen.querySelector('#btn-online-battle')?.addEventListener('click', () => {
      audioManager.init();
      import('./onlineScreen').then(m => {
        m.initOnlineScreen();
        screenManager.navigate('online');
      });
    });

    screen.querySelector('#btn-formation')?.addEventListener('click', () => {
      audioManager.init();
      screenManager.navigate('formation');
    });

    screen.querySelector('#btn-gacha')?.addEventListener('click', () => {
      audioManager.init();
      screenManager.navigate('gacha');
    });

    screen.querySelector('#btn-help')?.addEventListener('click', () => {
      screenManager.navigate('help');
    });

    // 難易度選択
    screen.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const level = parseInt(btn.getAttribute('data-level') || '2');
        store.updateSettings({ aiDifficulty: level });
        screen.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // 設定モーダル
    screen.querySelector('#btn-settings')?.addEventListener('click', () => {
      const modal = screen.querySelector('#settings-modal') as HTMLElement;
      if (modal) modal.style.display = 'flex';
    });

    screen.querySelector('#settings-close')?.addEventListener('click', () => {
      const modal = screen.querySelector('#settings-modal') as HTMLElement;
      if (modal) modal.style.display = 'none';
    });

    screen.querySelector('#setting-colorblind')?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      store.updateSettings({ colorBlindMode: checked });
    });

    screen.querySelector('#btn-reset-data')?.addEventListener('click', () => {
      if (confirm('全てのデータをリセットしますか？この操作は取り消せません。')) {
        store.reset();
        render();
      }
    });

    // パーティクル
    initHomeParticles(screen);
  }

  render();

  // 画面遷移時に再レンダリング（ホームに戻った時にデータを反映）
  screenManager.onChange((to) => {
    if (to === 'home') {
      render();
    }
  });

  return screen;
}

function initHomeParticles(screen: HTMLElement): void {
  const container = screen.querySelector('#home-particles');
  if (!container) return;

  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'floating-particle';
    particle.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation-delay: ${Math.random() * 5}s;
      animation-duration: ${3 + Math.random() * 4}s;
      opacity: ${0.1 + Math.random() * 0.3};
      width: ${2 + Math.random() * 4}px;
      height: ${2 + Math.random() * 4}px;
    `;
    container.appendChild(particle);
  }
}
