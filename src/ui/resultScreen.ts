import '../styles/screens/result.css';
import { screenManager } from './screenManager';
import { store } from '../store/store';
import { BLACK, EMPTY } from '../core/constants';

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
  playerName: string,
  opponentName: string
): void {
  const screen = document.getElementById('screen-result');
  if (!screen) return;

  const isWin = winner === BLACK;
  const isDraw = winner === EMPTY;
  const aiDifficulty = store.getSettings().aiDifficulty;
  const baseReward = isWin ? 100 : isDraw ? 50 : 20;
  const reward = Math.floor(baseReward * (aiDifficulty * 0.5 + 0.5));
  const data = store.getData();

  screen.innerHTML = `
    <div class="screen-header">
      <button class="btn-back" id="result-home">← 戻る</button>
      <h1 class="screen-title">対戦結果</h1>
    </div>
    <div class="result-container ${isWin ? 'result-win' : isDraw ? 'result-draw' : 'result-lose'}">
      <div class="result-banner">
        <h1 class="result-title">${isWin ? '🏆 VICTORY!' : isDraw ? '🤝 DRAW' : '💀 DEFEAT'}</h1>
        <div class="result-subtitle">${isWin ? '見事な勝利！' : isDraw ? '互角の戦い' : '次こそは...'}</div>
      </div>
      
      <div class="result-scoreboard">
        <div class="score-row">
          <div class="score-player">
            <span class="score-name">${playerName}</span>
            <span class="score-color">●</span>
          </div>
          <div class="score-values">
            <span class="stone-count">${counts.black}</span>
            <span class="score-label">石</span>
            <span class="score-total">${scores.black}</span>
            <span class="score-label">点</span>
          </div>
        </div>
        <div class="score-divider">VS</div>
        <div class="score-row">
          <div class="score-player">
            <span class="score-name">${opponentName}</span>
            <span class="score-color" style="color: #fff;">○</span>
          </div>
          <div class="score-values">
            <span class="stone-count">${counts.white}</span>
            <span class="score-label">石</span>
            <span class="score-total">${scores.white}</span>
            <span class="score-label">点</span>
          </div>
        </div>
      </div>

      <div class="result-rewards">
        <h3>報酬</h3>
        <div class="reward-item">
          <span class="reward-icon">💎</span>
          <span class="reward-amount">+${reward}</span>
        </div>
      </div>

      <div class="result-stats">
        <div class="stat-item">
          <span class="stat-label">通算戦績</span>
          <span class="stat-value">${data.totalWins}勝 / ${data.totalGames}戦</span>
        </div>
      </div>

      <div class="result-buttons">
        <button class="btn-primary btn-large" id="result-rematch">🔄 もう一度</button>
      </div>
    </div>
  `;

  // 画面遷移
  screenManager.navigate('result');

  // イベント
  screen.querySelector('#result-rematch')?.addEventListener('click', () => {
    screenManager.navigate('game');
    // gameScreenのstartGameを再実行
    import('./gameScreen').then(m => m.startGame('ai', store.getSettings().aiDifficulty));
  });

  screen.querySelector('#result-home')?.addEventListener('click', () => {
    screenManager.navigate('home');
  });
}
