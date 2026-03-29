import { store } from '../store/store';
import { CHARACTERS } from '../core/characters';
import { BLACK, WHITE } from '../core/constants';
import type { CellState } from '../core/constants';
import { GameManager } from '../core/gameManager';
import type { GameState, GameMode } from '../core/gameManager';
import { BoardRenderer } from '../render/boardRenderer';
import { screenManager } from './screenManager';
import { showResultScreen } from './resultScreen.ts';

let gameManager: GameManager | null = null;
let renderer: BoardRenderer | null = null;
let resizeHandler: (() => void) | null = null;

export function createGameScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.id = 'screen-game';
  screen.className = 'screen';
  screen.style.display = 'none';

  screen.innerHTML = `
    <div class="game-header">
      <div class="player-info player-black" id="player-black-info">
        <div class="player-icon" id="player-black-icon">⬛</div>
        <div class="player-details">
          <span class="player-name" id="player-black-name">Player</span>
          <span class="player-stones" id="player-black-stones">2</span>
        </div>
      </div>
      <div class="turn-indicator" id="turn-indicator">
        <div class="timer-display" id="timer-display">15</div>
        <div class="turn-label" id="turn-label">黒のターン</div>
      </div>
      <div class="player-info player-white" id="player-white-info">
        <div class="player-details">
          <span class="player-name" id="player-white-name">CPU</span>
          <span class="player-stones" id="player-white-stones">2</span>
        </div>
        <div class="player-icon" id="player-white-icon">⬜</div>
      </div>
    </div>
    <div class="game-message" id="game-message"></div>
    <div class="board-container" id="board-container">
      <canvas id="game-canvas"></canvas>
    </div>
    <div class="game-controls">
      <button class="btn-skill" id="btn-skill" disabled>
        <span class="skill-icon" id="skill-icon">⚡</span>
        <span class="skill-name" id="skill-name-display">スキル</span>
      </button>
      <button class="btn-secondary" id="btn-surrender">🏳️ 投了</button>
    </div>
  `;

  return screen;
}

export function startGame(mode: GameMode, aiLevel: number = 2): void {
  // 前のゲームをクリーンアップ
  cleanupGame();

  const data = store.getData();
  const leaderId = data.selectedLeader;
  const leaderChar = CHARACTERS[leaderId];
  const leaderUncap = data.characters[leaderId].uncapLevel;

  // 対戦相手キャラ（AI用：ランダム選択）
  const opponentIds = Object.keys(CHARACTERS).filter(id => id !== leaderId);
  const opponentId = opponentIds[Math.floor(Math.random() * opponentIds.length)] as keyof typeof CHARACTERS;
  const opponentChar = CHARACTERS[opponentId];

  // GameManager初期化
  gameManager = new GameManager();

  // Renderer初期化
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  renderer = new BoardRenderer(canvas);
  renderer.setColorBlindMode(data.settings.colorBlindMode);

  // UI更新
  const blackIcon = document.getElementById('player-black-icon');
  const blackName = document.getElementById('player-black-name');
  const whiteIcon = document.getElementById('player-white-icon');
  const whiteName = document.getElementById('player-white-name');
  const skillIcon = document.getElementById('skill-icon');
  const skillNameEl = document.getElementById('skill-name-display');
  const skillBtn = document.getElementById('btn-skill') as HTMLButtonElement;

  if (blackIcon) {
    blackIcon.textContent = leaderChar.icon;
    blackIcon.className = `player-icon ${leaderChar.imageUrl ? 'has-image' : ''}`;
    if (leaderChar.imageUrl) (blackIcon as HTMLElement).style.backgroundImage = `url(${leaderChar.imageUrl})`;
  }
  if (blackName) blackName.textContent = leaderChar.name;
  if (whiteIcon) {
    whiteIcon.textContent = opponentChar.icon;
    whiteIcon.className = `player-icon ${opponentChar.imageUrl ? 'has-image' : ''}`;
    if (opponentChar.imageUrl) (whiteIcon as HTMLElement).style.backgroundImage = `url(${opponentChar.imageUrl})`;
  }
  if (whiteName) whiteName.textContent = mode === 'ai' ? `CPU(Lv${aiLevel})` : opponentChar.name;
  if (skillIcon) {
    skillIcon.textContent = leaderChar.icon;
    skillIcon.className = `skill-icon ${leaderChar.imageUrl ? 'has-image' : ''}`;
    if (leaderChar.imageUrl) (skillIcon as HTMLElement).style.backgroundImage = `url(${leaderChar.imageUrl})`;
  }
  if (skillNameEl) skillNameEl.textContent = leaderChar.activeSkill.name;

  // イベントリスナー
  gameManager.on('stateChange', (evData) => {
    const state = evData as GameState;
    updateGameUI(state);
  });

  gameManager.on('timerUpdate', (evData) => {
    const { time } = evData as { time: number };
    const timerEl = document.getElementById('timer-display');
    if (timerEl) {
      timerEl.textContent = String(Math.max(0, time));
      timerEl.classList.toggle('timer-critical', time <= 5);
    }
  });

  gameManager.on('move', (evData) => {
    const { flips, player } = evData as { row: number; col: number; player: CellState; flips: [number, number][] };
    const fromColor = (player === BLACK ? WHITE : BLACK) as CellState;
    renderer?.startFlipAnimation(flips, fromColor, player);
  });

  gameManager.on('skillActivated', (evData) => {
    const result = evData as { affectedCells: [number, number][]; message: string };
    renderer?.startSkillAnimation(result.affectedCells, leaderChar.color, 'burn');
    showMessage(result.message);
  });

  gameManager.on('message', (evData) => {
    const { text } = evData as { text: string };
    showMessage(text);
  });

  gameManager.on('gameOver', (evData) => {
    const { winner, scores, counts } = evData as {
      winner: number;
      scores: { black: number; white: number };
      counts: { black: number; white: number; empty: number };
    };
    renderer?.stopLoop();

    const won = winner === BLACK;
    const isDraw = winner === 0; // EMPTY
    store.recordGame(won);
    
    // 勝利報酬（難易度補正あり）
    const baseReward = won ? 100 : (isDraw ? 50 : 20);
    const finalReward = Math.floor(baseReward * (aiLevel * 0.5 + 0.5));
    store.addCurrency(finalReward);

    setTimeout(() => {
      showResultScreen(winner, scores, counts, leaderChar.name, opponentChar.name);
    }, 1500);
  });

  // Canvas タッチ/クリック - 新しいcanvasを取得
  const onCanvasClick = (e: MouseEvent) => {
    if (!gameManager || !renderer) return;
    if (!gameManager.isHumanTurn()) return;
    const cell = renderer.getCellFromPoint(e.clientX, e.clientY);
    if (cell) {
      gameManager.makeMove(cell[0], cell[1]);
    }
  };

  const onCanvasTouch = (e: TouchEvent) => {
    e.preventDefault();
    if (!gameManager || !renderer) return;
    if (!gameManager.isHumanTurn()) return;
    const touch = e.changedTouches[0];
    const cell = renderer.getCellFromPoint(touch.clientX, touch.clientY);
    if (cell) {
      gameManager.makeMove(cell[0], cell[1]);
    }
  };

  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('touchend', onCanvasTouch);

  // スキルボタン
  if (skillBtn) {
    skillBtn.disabled = false;
    skillBtn.classList.remove('skill-used');
    const onSkillClick = () => {
      if (!gameManager || !gameManager.isHumanTurn()) return;
      const result = gameManager.activateSkill();
      if (result) {
        skillBtn.disabled = true;
        skillBtn.classList.add('skill-used');
      }
    };
    // 古いリスナーを除去して新しいものを追加
    const newSkillBtn = skillBtn.cloneNode(true) as HTMLButtonElement;
    newSkillBtn.disabled = false;
    skillBtn.parentNode?.replaceChild(newSkillBtn, skillBtn);
    newSkillBtn.addEventListener('click', onSkillClick);
  }

  // 投了ボタン
  const surrenderBtn = document.getElementById('btn-surrender');
  if (surrenderBtn) {
    const newSurrenderBtn = surrenderBtn.cloneNode(true) as HTMLButtonElement;
    surrenderBtn.parentNode?.replaceChild(newSurrenderBtn, surrenderBtn);
    newSurrenderBtn.addEventListener('click', () => {
      if (confirm('投了しますか？')) {
        cleanupGame();
        store.recordGame(false);
        store.addCurrency(10);
        screenManager.navigate('home');
      }
    });
  }

  // リサイズ対応
  if (resizeHandler) window.removeEventListener('resize', resizeHandler);
  resizeHandler = () => renderer?.resize();
  window.addEventListener('resize', resizeHandler);

  // ゲーム開始
  renderer.resize();
  renderer.startLoop(() => gameManager!.getState());
  gameManager.startGame(mode, leaderChar, opponentChar, leaderUncap, 0, aiLevel);
}

function cleanupGame(): void {
  if (gameManager) {
    gameManager.destroy();
    gameManager = null;
  }
  if (renderer) {
    renderer.stopLoop();
    renderer = null;
  }
}

function updateGameUI(state: GameState): void {
  const blackStones = document.getElementById('player-black-stones');
  const whiteStones = document.getElementById('player-white-stones');
  const turnLabel = document.getElementById('turn-label');
  const blackInfo = document.getElementById('player-black-info');
  const whiteInfo = document.getElementById('player-white-info');

  // 石数更新
  let bc = 0, wc = 0;
  for (const row of state.board) {
    for (const cell of row) {
      if (cell === BLACK) bc++;
      else if (cell === WHITE) wc++;
    }
  }
  if (blackStones) blackStones.textContent = String(bc);
  if (whiteStones) whiteStones.textContent = String(wc);

  // ターン表示
  if (turnLabel) {
    turnLabel.textContent = state.phase === 'finished' 
      ? '対局終了' 
      : state.currentPlayer === BLACK ? '黒のターン' : '白のターン';
  }

  // アクティブプレイヤーハイライト
  blackInfo?.classList.toggle('active-player', state.currentPlayer === BLACK && state.phase === 'playing');
  whiteInfo?.classList.toggle('active-player', state.currentPlayer === WHITE && state.phase === 'playing');
}

function showMessage(text: string): void {
  const msgEl = document.getElementById('game-message');
  if (!msgEl) return;

  msgEl.textContent = text;
  msgEl.classList.add('message-show');
  setTimeout(() => {
    msgEl.classList.remove('message-show');
  }, 2500);
}
