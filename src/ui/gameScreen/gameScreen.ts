import './game.css';
import { store } from '../../store/store';
import { CHARACTERS } from '../../core/characters';
import { BLACK, WHITE } from '../../core/constants';
import type { CellState } from '../../core/constants';
import { GameManager } from '../../core/gameManager';
import type { GameState, GameMode } from '../../core/gameManager';
import { BoardRenderer } from '../../render/boardRenderer';
import { screenManager } from '../screenManager';
import { showResultScreen } from '../resultScreen/resultScreen';
import { showModal } from '../components/modal/modal';

let gameManager: GameManager | null = null;
let renderer: BoardRenderer | null = null;
let resizeHandler: (() => void) | null = null;

export function createGameScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.id = 'screen-game';
  screen.className = 'screen';
  screen.style.display = 'none';

  screen.innerHTML = `
    <!-- 敵情報 (25%) -->
    <div class="game-enemy" id="game-enemy-info">
      <div class="player-stones-box">
        <div class="stone-icon stone-white"></div>
        <span class="stone-count" id="player-white-stones">2</span>
      </div>
      <div class="player-portrait-box">
        <div class="divine-portrait-wrapper">
          <div class="divine-portrait" id="player-white-icon"></div>
          <div class="divine-rarity" id="player-white-rarity">SSR</div>
        </div>
        <div class="divine-player-name" id="player-white-name">Opponent</div>
        <div class="game-controls">
          <button class="btn-skill btn-skill-enemy" id="btn-skill-enemy" disabled>
            <span class="skill-icon" id="skill-icon-enemy">⚡</span>
            <span class="skill-name" id="skill-name-enemy">権能</span>
          </button>
        </div>
      </div>
      <div class="player-timer-box">
        <div class="timer-display" id="timer-enemy">15</div>
      </div>
    </div>

    <div class="game-message" id="game-message"></div>
    
    <!-- 盤面 (50%) -->
    <div class="board-container" id="board-container">
      <canvas id="game-canvas"></canvas>
    </div>

    <!-- 自分情報 (25%) -->
    <div class="game-player" id="game-player-info">
      <div class="player-stones-box">
        <div class="stone-icon stone-black"></div>
        <span class="stone-count" id="player-black-stones">2</span>
      </div>
      <div class="player-portrait-box">
        <div class="divine-portrait-wrapper">
          <div class="divine-portrait" id="player-black-icon"></div>
          <div class="divine-rarity" id="player-black-rarity">SSR</div>
        </div>
        <div class="divine-player-name" id="player-black-name">Player</div>
        <div class="game-controls">
          <button class="btn-skill" id="btn-skill" disabled>
            <span class="skill-icon" id="skill-icon">⚡</span>
            <span class="skill-name" id="skill-name-display">権能</span>
          </button>
        </div>
      </div>
      <div class="player-timer-box">
        <div class="timer-display" id="timer-player">15</div>
        <button class="btn-surrender" id="btn-surrender">🏳️ 投了</button>
      </div>
    </div>
  `;

  return screen;
}

export function startGame(mode: GameMode, aiLevel: number = 2): void {
  cleanupGame();

  const data = store.getData();
  const leaderId = data.selectedLeader;
  const leaderChar = CHARACTERS[leaderId];
  const leaderUncap = data.characters[leaderId].uncapLevel;

  let opponentId: keyof typeof CHARACTERS;
  if (mode === 'ai') {
    const targetRarity = aiLevel === 1 ? 'R' : aiLevel === 2 ? 'SR' : 'SSR';
    const possibleOpponents = Object.keys(CHARACTERS).filter(id => CHARACTERS[id as keyof typeof CHARACTERS].rarity === targetRarity);
    opponentId = (possibleOpponents.length > 0 
      ? possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)] 
      : Object.keys(CHARACTERS)[0]) as keyof typeof CHARACTERS;
  } else {
    const opponentIds = Object.keys(CHARACTERS).filter(id => id !== leaderId);
    opponentId = opponentIds[Math.floor(Math.random() * opponentIds.length)] as keyof typeof CHARACTERS;
  }
  const opponentChar = CHARACTERS[opponentId];

  gameManager = new GameManager();

  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  renderer = new BoardRenderer(canvas);
  renderer.setColorBlindMode(data.settings.colorBlindMode);

  // UI初期化
  const blackIcon = document.getElementById('player-black-icon');
  const blackName = document.getElementById('player-black-name');
  const blackRarity = document.getElementById('player-black-rarity');
  const whiteIcon = document.getElementById('player-white-icon');
  const whiteName = document.getElementById('player-white-name');
  const whiteRarity = document.getElementById('player-white-rarity');
  const skillIcon = document.getElementById('skill-icon');
  const skillNameEl = document.getElementById('skill-name-display');
  const skillIconEnemy = document.getElementById('skill-icon-enemy');
  const skillNameEnemy = document.getElementById('skill-name-enemy');
  const skillBtn = document.getElementById('btn-skill') as HTMLButtonElement;

  if (blackIcon) {
    const imgUrl = leaderChar.imageUrl ? `${leaderChar.imageUrl}` : '';
    blackIcon.textContent = leaderChar.imageUrl ? '' : leaderChar.icon;
    blackIcon.className = `divine-portrait ${leaderChar.imageUrl ? 'has-image' : ''}`;
    if (leaderChar.imageUrl) (blackIcon as HTMLElement).style.backgroundImage = `url(${imgUrl})`;
  }
  if (blackName) blackName.textContent = leaderChar.name;
  if (blackRarity) {
    blackRarity.textContent = leaderChar.rarity;
    blackRarity.className = `divine-rarity rarity-${leaderChar.rarity.toLowerCase()}`;
  }

  if (whiteIcon) {
    const imgUrl = opponentChar.imageUrl ? `${opponentChar.imageUrl}` : '';
    whiteIcon.textContent = opponentChar.imageUrl ? '' : opponentChar.icon;
    whiteIcon.className = `divine-portrait ${opponentChar.imageUrl ? 'has-image' : ''}`;
    if (opponentChar.imageUrl) (whiteIcon as HTMLElement).style.backgroundImage = `url(${imgUrl})`;
  }
  if (whiteName) whiteName.textContent = mode === 'ai' ? `CPU(Lv${aiLevel})` : opponentChar.name;
  if (whiteRarity) {
    whiteRarity.textContent = opponentChar.rarity;
    whiteRarity.className = `divine-rarity rarity-${opponentChar.rarity.toLowerCase()}`;
  }

  // スキル表示
  if (skillIcon) {
    const imgUrl = leaderChar.imageUrl ? `${leaderChar.imageUrl}` : '';
    skillIcon.textContent = leaderChar.icon;
    skillIcon.className = `skill-icon ${leaderChar.imageUrl ? 'has-image' : ''}`;
    if (leaderChar.imageUrl) (skillIcon as HTMLElement).style.backgroundImage = `url(${imgUrl})`;
  }
  if (skillNameEl) skillNameEl.textContent = leaderChar.activeSkill.name;

  if (skillIconEnemy) {
    const imgUrl = opponentChar.imageUrl ? `${opponentChar.imageUrl}` : '';
    skillIconEnemy.textContent = opponentChar.icon;
    skillIconEnemy.className = `skill-icon ${opponentChar.imageUrl ? 'has-image' : ''}`;
    if (opponentChar.imageUrl) (skillIconEnemy as HTMLElement).style.backgroundImage = `url(${imgUrl})`;
  }
  if (skillNameEnemy) skillNameEnemy.textContent = opponentChar.activeSkill.name;

  // イベント
  gameManager.on('stateChange', (evData) => {
    updateGameUI(evData as GameState);
  });

  gameManager.on('timerUpdate', (evData) => {
    const { time } = evData as { time: number };
    const currentPlayer = gameManager?.getCurrentPlayer();
    const timerId = currentPlayer === BLACK ? 'timer-player' : 'timer-enemy';
    const otherTimerId = currentPlayer === BLACK ? 'timer-enemy' : 'timer-player';
    
    const timerEl = document.getElementById(timerId);
    if (timerEl) {
      timerEl.textContent = String(Math.max(0, time));
      timerEl.classList.toggle('timer-critical', time <= 5);
    }
    const otherTimerEl = document.getElementById(otherTimerId);
    if (otherTimerEl) {
      otherTimerEl.textContent = '15';
      otherTimerEl.classList.remove('timer-critical');
    }
  });

  gameManager.on('move', (evData) => {
    const { flips, player } = evData as { row: number; col: number; player: CellState; flips: [number, number][] };
    renderer?.startFlipAnimation(flips, (player === BLACK ? WHITE : BLACK) as CellState, player);
  });

  gameManager.on('skillActivated', (evData) => {
    const result = evData as { affectedCells: [number, number][]; message: string };
    let effectType: 'lightning' | 'void' | 'divine' | 'burn' = 'burn';
    if (leaderId === 'alfred') effectType = 'lightning';
    else if (leaderId === 'luna') effectType = 'void';
    else if (leaderId === 'mira') effectType = 'divine';
    
    renderer?.startSkillAnimation(result.affectedCells, leaderChar.color, effectType);
    showMessage(result.message);
  });

  gameManager.on('message', (evData) => {
    showMessage((evData as { text: string }).text);
  });

  gameManager.on('gameOver', (evData) => {
    const { winner, scores, counts } = evData as { winner: number; scores: any; counts: any };
    renderer?.stopLoop();
    const won = winner === BLACK;
    store.recordGame(won);
    const baseReward = won ? 100 : (winner === 0 ? 50 : 20);
    store.addCurrency(Math.floor(baseReward * (aiLevel * 0.5 + 0.5)));
    setTimeout(() => showResultScreen(winner, scores, counts, leaderChar.name, opponentChar.name), 1500);
  });

  const onCanvasClick = (e: MouseEvent) => {
    if (!gameManager?.isHumanTurn()) return;
    const cell = renderer?.getCellFromPoint(e.clientX, e.clientY);
    if (cell) gameManager.makeMove(cell[0], cell[1]);
  };

  const onCanvasTouch = (e: TouchEvent) => {
    if (!gameManager?.isHumanTurn()) return;
    const touch = e.changedTouches[0];
    const cell = renderer?.getCellFromPoint(touch.clientX, touch.clientY);
    if (cell) gameManager.makeMove(cell[0], cell[1]);
  };

  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('touchend', (e) => { e.preventDefault(); onCanvasTouch(e); });

  if (skillBtn) {
    skillBtn.disabled = false;
    skillBtn.classList.remove('skill-used');
    const onSkillClick = () => {
      if (gameManager?.isHumanTurn() && gameManager.activateSkill()) {
        skillBtn.disabled = true;
        skillBtn.classList.add('skill-used');
      }
    };
    const newSkillBtn = skillBtn.cloneNode(true) as HTMLButtonElement;
    skillBtn.parentNode?.replaceChild(newSkillBtn, skillBtn);
    newSkillBtn.addEventListener('click', onSkillClick);
  }

  const surrenderBtn = document.getElementById('btn-surrender');
  if (surrenderBtn) {
    const newBtn = surrenderBtn.cloneNode(true) as HTMLButtonElement;
    surrenderBtn.parentNode?.replaceChild(newBtn, surrenderBtn);
    newBtn.addEventListener('click', () => {
      showModal({
        title: '🏳️ 投了の確認',
        message: '対局を終了してホームに戻りますか？<br>（負け扱いとなります）',
        confirmText: '投了する',
        cancelText: '続ける',
        onConfirm: () => {
          cleanupGame();
          store.recordGame(false);
          screenManager.navigate('home');
        }
      });
    });
  }

  if (resizeHandler) window.removeEventListener('resize', resizeHandler);
  resizeHandler = () => renderer?.resize();
  window.addEventListener('resize', resizeHandler);

  renderer.resize();
  renderer.startLoop(() => gameManager!.getState());
  gameManager.startGame(mode, leaderChar, opponentChar, leaderUncap, 0, aiLevel);
}

function cleanupGame(): void {
  if (gameManager) { gameManager.destroy(); gameManager = null; }
  if (renderer) { renderer.stopLoop(); renderer = null; }
}

function updateGameUI(state: GameState): void {
  const blackStones = document.getElementById('player-black-stones');
  const whiteStones = document.getElementById('player-white-stones');
  const playerInfo = document.getElementById('game-player-info');
  const enemyInfo = document.getElementById('game-enemy-info');
  const playerSkillBtn = document.getElementById('btn-skill') as HTMLButtonElement;
  const enemySkillBtn = document.getElementById('btn-skill-enemy') as HTMLButtonElement;

  let bc = 0, wc = 0;
  for (const row of state.board) {
    for (const cell of row) {
      if (cell === BLACK) bc++;
      else if (cell === WHITE) wc++;
    }
  }
  if (blackStones) blackStones.textContent = String(bc);
  if (whiteStones) whiteStones.textContent = String(wc);

  playerInfo?.classList.toggle('active-player', state.currentPlayer === BLACK && state.phase === 'playing');
  enemyInfo?.classList.toggle('active-player', state.currentPlayer === WHITE && state.phase === 'playing');

  // 自分のスキルボタン状態
  if (playerSkillBtn) {
    const used = state.players[BLACK].activeSkillUsed;
    playerSkillBtn.disabled = used;
    playerSkillBtn.classList.toggle('skill-used', used);
  }

  // 相手のスキルボタン状態
  if (enemySkillBtn) {
    const used = state.players[WHITE].activeSkillUsed;
    enemySkillBtn.disabled = used;
    enemySkillBtn.classList.toggle('skill-used', used);
  }
}

function showMessage(text: string): void {
  const msgEl = document.getElementById('game-message');
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.classList.add('message-show');
  setTimeout(() => msgEl.classList.remove('message-show'), 2500);
}
