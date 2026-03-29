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
          <div class="game-version">v${__APP_VERSION__}</div>
        </div>

        <div class="home-leader-display">
          <div class="home-leader-icon ${leader.imageUrl ? 'has-image' : ''}" 
               style="background: ${leader.imageUrl ? `url(${leader.imageUrl})` : `linear-gradient(135deg, ${leader.color}66, ${leader.color})`}">
            ${leader.icon}
          </div>
          <div class="home-leader-info">
            <span class="home-leader-name">${leader.name}</span>
            <span class="home-leader-title">${leader.title}</span>
          </div>
        </div>

        <div class="home-stats">
          <div class="stat-badge clickable" id="stat-currency">💎 ${data.currency}</div>
          <div class="stat-badge clickable" id="stat-trophy">🏆 ${data.totalWins}/${data.totalGames}</div>
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

        </div>
      </div>

      <!-- 難易度選択モーダル -->
      <div class="modal-overlay" id="difficulty-modal" style="display: none;">
        <div class="modal-content difficulty-modal-content">
          <h2>⚔️ AI対戦 - 難易度選択</h2>
          <p>挑戦するレベルを選んでください</p>
          <div class="difficulty-options">
            <button class="menu-btn diff-select-btn" data-level="1">
              <span class="diff-title">初級</span>
              <span class="diff-desc">初めての方にオススメ</span>
            </button>
            <button class="menu-btn diff-select-btn" data-level="2">
              <span class="diff-title">中級</span>
              <span class="diff-desc">標準的なAIと勝負</span>
            </button>
            <button class="menu-btn diff-select-btn" data-level="3">
              <span class="diff-title">上級</span>
              <span class="diff-desc">最強のAIに挑戦！(報酬アップ)</span>
            </button>
          </div>
          <button class="btn-secondary modal-close" id="difficulty-close">戻る</button>
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

      <!-- 解説モーダル -->
      <div class="modal-overlay" id="info-modal" style="display: none;">
        <div class="modal-content info-modal-content">
          <h2 id="info-title">解説</h2>
          <div class="info-body" id="info-body"></div>
          <button class="btn-secondary modal-close" id="info-close">閉じる</button>
        </div>
      </div>
    `;

    // イベント
    screen.querySelector('#btn-ai-battle')?.addEventListener('click', () => {
      audioManager.init();
      const modal = screen.querySelector('#difficulty-modal') as HTMLElement;
      if (modal) modal.style.display = 'flex';
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

    // 難易度選択モーダル
    screen.querySelectorAll('.diff-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const level = parseInt(btn.getAttribute('data-level') || '2');
        store.updateSettings({ aiDifficulty: level });
        
        const modal = screen.querySelector('#difficulty-modal') as HTMLElement;
        if (modal) modal.style.display = 'none';

        screenManager.navigate('game');
        setTimeout(() => startGame('ai', level), 100);
      });
    });

    screen.querySelector('#difficulty-close')?.addEventListener('click', () => {
      const modal = screen.querySelector('#difficulty-modal') as HTMLElement;
      if (modal) modal.style.display = 'none';
    });

    // 解説表示
    const showInfo = (title: string, body: string) => {
      const modal = screen.querySelector('#info-modal') as HTMLElement;
      const titleEl = screen.querySelector('#info-title');
      const bodyEl = screen.querySelector('#info-body');
      if (modal && titleEl && bodyEl) {
        titleEl.textContent = title;
        bodyEl.textContent = body;
        modal.style.display = 'flex';
      }
    };

    screen.querySelector('#stat-currency')?.addEventListener('click', () => {
      showInfo('💎 ダイヤ', 'ガチャを引くために必要な貴重な宝石です。難易度の高いAIに勝利するとより多く獲得できます。');
    });

    screen.querySelector('#stat-trophy')?.addEventListener('click', () => {
      showInfo('🏆 通算戦績', 'これまでの対戦成績（勝利数 / 全試合数）です。最強のオセロマスターを目指しましょう！');
    });

    screen.querySelector('#info-close')?.addEventListener('click', () => {
      const modal = screen.querySelector('#info-modal') as HTMLElement;
      if (modal) modal.style.display = 'none';
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
