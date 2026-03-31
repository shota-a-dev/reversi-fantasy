import './result.css';
import { screenManager } from '../screenManager';
import { store } from '../../store/store';
import { BLACK } from '../../core/constants';

export function createResultScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.id = 'screen-result';
  screen.className = 'screen';
  screen.style.display = 'none';

  return screen;
}

export function showResultScreen(
  winner: number,
  scores: { black: number; white: number },
  counts: { black: number; white: number; empty: number },
  blackName: string,
  whiteName: string
): void {
  const screen = document.getElementById('screen-result');
  if (!screen) return;

  const isWin = winner === BLACK;
  const isDraw = winner === 0;
  const resultClass = isWin ? 'result-win' : isDraw ? 'result-draw' : 'result-lose';
  
  screen.innerHTML = `
    <div class="result-container ${resultClass}">
      <div class="result-banner">
        <h2 class="result-title">${isWin ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}</h2>
        <p class="result-subtitle">${isWin ? '神の叡智が勝利を導いた' : isDraw ? '互角の戦いであった' : '次なる一手を見極めよ'}</p>
      </div>

      <div class="result-scoreboard">
        <div class="score-row">
          <div class="score-player">
            <span class="score-color">⚫</span>
            <span class="score-name">${blackName}</span>
          </div>
          <div class="score-values">
            <span class="stone-count">${counts.black}</span>
            <span class="score-label">pts</span>
            <span class="score-total">${scores.black}</span>
          </div>
        </div>

        <div class="score-divider">VS</div>

        <div class="score-row">
          <div class="score-player">
            <span class="score-color">⚪</span>
            <span class="score-name">${whiteName}</span>
          </div>
          <div class="score-values">
            <span class="stone-count">${counts.white}</span>
            <span class="score-label">pts</span>
            <span class="score-total">${scores.white}</span>
          </div>
        </div>
      </div>

      <div class="result-rewards">
        <h3>獲得報酬</h3>
        <div class="reward-item">
          <span class="currency-icon-small"></span>
          <span class="reward-amount">+${isWin ? 100 : isDraw ? 50 : 20}</span>
        </div>
      </div>

      <div class="result-buttons">
        <button class="menu-btn menu-btn-primary" id="btn-result-retry">再戦する</button>
        <button class="menu-btn menu-btn-secondary" id="btn-result-home">ホームへ</button>
      </div>
    </div>
  `;

  screen.style.display = 'flex';

  screen.querySelector('#btn-result-home')?.addEventListener('click', () => {
    screen.style.display = 'none';
    screenManager.navigate('home');
  });

  screen.querySelector('#btn-result-retry')?.addEventListener('click', () => {
    screen.style.display = 'none';
    import('../gameScreen/gameScreen').then(m => m.startGame('ai', store.getSettings().aiDifficulty));
  });
}
