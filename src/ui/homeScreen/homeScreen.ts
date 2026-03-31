import './home.css';
import { store } from '../../store/store';
import { CHARACTERS } from '../../core/characters';
import { screenManager } from '../screenManager';
import { startGame } from '../gameScreen/gameScreen';
import { audioManager } from '../../core/audioManager';
import { showModal } from '../components/modal/modal';

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
          <h1 class="game-title">神々の対局</h1>
          <p class="game-subtitle">- Duel of Deities -</p>
          <div class="game-version">${__APP_VERSION__}</div>
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
          <div class="stat-badge clickable" id="stat-currency">
            <span class="currency-icon-small"></span> ${data.currency}
          </div>
          <div class="stat-badge clickable" id="stat-trophy">🏆 ${data.totalWins}/${data.totalGames}</div>
        </div>

        <div class="home-menu">
          <div class="menu-row">
            <button class="menu-btn menu-btn-primary" id="btn-ai-battle">
              <span class="menu-icon">⚔️</span>
              <span class="menu-text">AI対戦</span>
            </button>
            <button class="menu-btn menu-btn-primary" id="btn-online-battle">
              <span class="menu-icon">🌐</span>
              <span class="menu-text">オンライン対戦</span>
            </button>
          </div>
          
          <div class="menu-row">
            <button class="menu-btn menu-btn-divine" id="btn-formation">
              <span class="menu-icon">👥</span>
              <span class="menu-text">神格</span>
            </button>
            <button class="menu-btn menu-btn-divine" id="btn-gacha">
              <span class="menu-icon">🎰</span>
              <span class="menu-text">神託</span>
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
    `;

    // ─── AI対戦 難易度選択 ───
    screen.querySelector('#btn-ai-battle')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      audioManager.init();
      
      const difficultyHtml = `
        <div class="difficulty-options">
          <button class="menu-btn diff-select-btn" data-level="1">
            <span class="diff-title">初級</span>
            <span class="diff-desc">初めての方にオススメ (相手: R)</span>
          </button>
          <button class="menu-btn diff-select-btn" data-level="2">
            <span class="diff-title">中級</span>
            <span class="diff-desc">標準的なAIと勝負 (相手: SR)</span>
          </button>
          <button class="menu-btn diff-select-btn" data-level="3">
            <span class="diff-title">上級</span>
            <span class="diff-desc">最強のAIに挑戦！ (相手: SSR)</span>
          </button>
        </div>
      `;

      const modal = showModal({
        title: '⚔️ 難易度選択',
        contentHtml: difficultyHtml,
        cancelText: '戻る'
      });

      // 難易度ボタンのイベント登録
      modal.getElement().querySelectorAll<HTMLElement>('.diff-select-btn').forEach((btn: HTMLElement) => {
        btn.addEventListener('click', (e: Event) => {
          e.stopPropagation();
          const level = parseInt(btn.getAttribute('data-level') || '2');
          const levelNames = ['', '初級', '中級', '上級'];
          
          modal.close(); 
          
          showModal({
            title: '⚔️ 対戦確認',
            message: `難易度: <strong>${levelNames[level]}</strong><br><br>対戦を開始しますか？`,
            confirmText: '対戦開始！',
            cancelText: '戻る',
            onConfirm: () => {
              store.updateSettings({ aiDifficulty: level });
              screenManager.navigate('game');
              setTimeout(() => startGame('ai', level), 100);
            }
          });
        });
      });
    });

    // オンライン対戦
    screen.querySelector('#btn-online-battle')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      audioManager.init();
      import('../onlineScreen/onlineScreen').then(m => {
        m.initOnlineScreen();
        screenManager.navigate('online');
      });
    });

    // 神格
    screen.querySelector('#btn-formation')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      audioManager.init();
      screenManager.navigate('formation');
    });

    // 神託
    screen.querySelector('#btn-gacha')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      audioManager.init();
      screenManager.navigate('gacha');
    });

    // ヘルプ
    screen.querySelector('#btn-help')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      screenManager.navigate('help');
    });

    // 設定
    screen.querySelector('#btn-settings')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const data = store.getData();
      const settingsHtml = `
        <div class="setting-item">
          <label>色覚多様性モード</label>
          <label class="toggle-switch">
            <input type="checkbox" id="setting-colorblind" ${data.settings.colorBlindMode ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-item">
          <label>デバッグ（宝玉+100）</label>
          <button class="btn-primary" id="btn-debug-currency" style="padding: 4px 12px; font-size: 0.8rem;">追加</button>
        </div>
        <div class="setting-item">
          <label>データリセット</label>
          <button class="btn-primary" id="btn-reset-data" style="padding: 4px 12px; font-size: 0.8rem;">リセット</button>
        </div>
      `;

      const modal = showModal({
        title: '⚙️ 設定',
        contentHtml: settingsHtml,
        cancelText: '閉じる'
      });

      const modalEl = modal.getElement();
      modalEl.querySelector('#setting-colorblind')?.addEventListener('change', (ev: Event) => {
        store.updateSettings({ colorBlindMode: (ev.target as HTMLInputElement).checked });
      });
      modalEl.querySelector('#btn-debug-currency')?.addEventListener('click', () => {
        store.addCurrency(100);
        // ホーム画面の通貨表示を直接更新
        const currencyEl = screen.querySelector('#stat-currency');
        if (currencyEl) currencyEl.innerHTML = `<span class="currency-icon-small"></span> ${store.getCurrency()}`;
      });
      modalEl.querySelector('#btn-reset-data')?.addEventListener('click', () => {
        if (confirm('全てのデータをリセットしますか？')) {
          store.reset();
          render();
          modal.close();
        }
      });
    });

    // 通算戦績クリック
    screen.querySelector('#stat-trophy')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      const data = store.getData();
      showModal({
        title: '🏆 通算戦績',
        message: `これまでの対戦成績：<br><strong>${data.totalWins}勝 / ${data.totalGames}戦</strong><br><br>最強のオセロマスターを目指しましょう！`,
        cancelText: '閉じる'
      });
    });

    // ダイヤクリック
    screen.querySelector('#stat-currency')?.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      showModal({
        title: '神の宝玉',
        message: 'ガチャを引くために必要な貴重な宝玉です。難易度の高いAIに勝利するとより多く獲得できます。',
        cancelText: '閉じる'
      });
    });

    initHomeParticles(screen);
  }

  render();

  screenManager.onChange((to) => {
    if (to === 'home') render();
  });

  return screen;
}

function initHomeParticles(screen: HTMLElement): void {
  const container = screen.querySelector('#home-particles');
  if (!container) return;
  container.innerHTML = '';
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
