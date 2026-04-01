import './game.css';
import { store } from '../../store/store';
import { CHARACTERS } from '../../core/characters/characters';
import { BLACK, WHITE } from '../../core/constants';
import type { CellState, CharacterId } from '../../core/constants';
import { GameManager } from '../../core/gameManager';
import type { GameState, GameMode } from '../../core/gameManager';
import { BoardRenderer } from '../../render/boardRenderer';
import { screenManager } from '../screenManager';
import { showResultScreen } from '../resultScreen/resultScreen';
import { showModal } from '../components/modal/modal';
import { showCharacterDetail } from '../formationDetail/formationDetail';

let gameManager: GameManager | null = null;
let renderer: BoardRenderer | null = null;
let resizeHandler: (() => void) | null = null;

export function createGameScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.id = 'screen-game';
  screen.className = 'screen';
  screen.style.display = 'none';

  screen.innerHTML = `
    <!-- 敵情報 -->
    <div class="game-info-container enemy-info" id="game-enemy-info">
      <!-- 1行目 (比率3) -->
      <div class="info-cell stone-cell">
        <div class="stone-icon stone-white"></div>
        <span class="stone-count" id="player-white-stones">2</span>
      </div>
      <div class="info-cell portrait-cell">
        <div class="divine-portrait-wrapper clickable" id="player-white-icon-btn">
          <div class="divine-portrait" id="player-white-icon"></div>
        </div>
      </div>
      <div class="info-cell timer-cell">
        <div class="timer-display" id="timer-enemy">15</div>
      </div>
      <!-- 2行目 (比率2) -->
      <div class="info-cell mana-cell">
        <div class="mana-icon">💧</div>
        <span class="mana-count" id="player-white-mana">0</span>
        <span class="mana-required" id="player-white-mana-required">/ -</span>
      </div>
      <div class="info-cell skill-cell">
        <button class="btn-skill btn-skill-enemy" id="btn-skill-enemy" disabled>
          <span class="skill-icon" id="skill-icon-enemy">⚡</span>
        </button>
      </div>
      <div class="info-cell spacer-cell"></div>
    </div>

    <div class="game-message" id="game-message"></div>
    
    <!-- 盤面 -->
    <div class="board-container" id="board-container">
      <canvas id="game-canvas"></canvas>
    </div>

    <!-- 自分情報 -->
    <div class="game-info-container player-info" id="game-player-info">
      <!-- 1行目 (比率3) -->
      <div class="info-cell stone-cell">
        <div class="stone-icon stone-black"></div>
        <span class="stone-count" id="player-black-stones">2</span>
      </div>
      <div class="info-cell portrait-cell">
        <div class="divine-portrait-wrapper clickable" id="player-black-icon-btn">
          <div class="divine-portrait" id="player-black-icon"></div>
        </div>
      </div>
      <div class="info-cell timer-cell">
        <div class="timer-display" id="timer-player">15</div>
      </div>
      <!-- 2行目 (比率2) -->
      <div class="info-cell mana-cell">
        <div class="mana-icon">💧</div>
        <span class="mana-count" id="player-black-mana">1</span>
        <span class="mana-required" id="player-black-mana-required">/ -</span>
      </div>
      <div class="info-cell skill-cell">
        <button class="btn-skill" id="btn-skill">
          <span class="skill-icon" id="skill-icon">⚡</span>
        </button>
      </div>
      <div class="info-cell control-cell">
        <button class="btn-surrender" id="btn-surrender">🏳️</button>
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

  let opponentId: CharacterId;
  if (mode === 'ai') {
    const targetRarity = aiLevel === 1 ? 'R' : aiLevel === 2 ? 'SR' : 'SSR';
    const possibleOpponents = Object.keys(CHARACTERS).filter(id => CHARACTERS[id].rarity === targetRarity);
    opponentId = (possibleOpponents.length > 0 
      ? possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)] as CharacterId
      : Object.keys(CHARACTERS)[0] as CharacterId);
  } else {
    const opponentIds = Object.keys(CHARACTERS).filter(id => id !== leaderId);
    opponentId = opponentIds[Math.floor(Math.random() * opponentIds.length)] as CharacterId;
  }
  const opponentChar = CHARACTERS[opponentId];

  gameManager = new GameManager();

  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  renderer = new BoardRenderer(canvas);
  renderer.setColorBlindMode(data.settings.colorBlindMode);

  // UI初期化
  const blackIcon = document.getElementById('player-black-icon');
  const whiteIcon = document.getElementById('player-white-icon');
  const blackManaReq = document.getElementById('player-black-mana-required');
  const whiteManaReq = document.getElementById('player-white-mana-required');
  const skillIcon = document.getElementById('skill-icon');
  const skillIconEnemy = document.getElementById('skill-icon-enemy');
  const skillBtn = document.getElementById('btn-skill') as HTMLButtonElement;

  if (blackIcon) {
    const imgUrl = leaderChar.imageUrl ? `${leaderChar.imageUrl}` : '';
    blackIcon.textContent = leaderChar.imageUrl ? '' : leaderChar.icon;
    blackIcon.className = `divine-portrait ${leaderChar.imageUrl ? 'has-image' : ''}`;
    if (leaderChar.imageUrl) (blackIcon as HTMLElement).style.backgroundImage = `url(${imgUrl})`;
  }
  if (blackManaReq) {
    blackManaReq.textContent = `/ ${leaderChar.activeSkill.manaCost}`;
  }

  if (whiteIcon) {
    const imgUrl = opponentChar.imageUrl ? `${opponentChar.imageUrl}` : '';
    whiteIcon.textContent = opponentChar.imageUrl ? '' : opponentChar.icon;
    whiteIcon.className = `divine-portrait ${opponentChar.imageUrl ? 'has-image' : ''}`;
    if (opponentChar.imageUrl) (whiteIcon as HTMLElement).style.backgroundImage = `url(${imgUrl})`;
  }
  if (whiteManaReq) {
    whiteManaReq.textContent = `/ ${opponentChar.activeSkill.manaCost}`;
  }

  // キャラアイコンクリックで詳細表示（リスナー蓄積防止のためクローンして置換）
  const blackIconBtn = document.getElementById('player-black-icon-btn');
  const whiteIconBtn = document.getElementById('player-white-icon-btn');

  if (blackIconBtn) {
    const newBtn = blackIconBtn.cloneNode(true) as HTMLElement;
    blackIconBtn.parentNode?.replaceChild(newBtn, blackIconBtn);
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showCharacterDetail(leaderId, () => {}, false);
    });
  }

  if (whiteIconBtn) {
    const newBtn = whiteIconBtn.cloneNode(true) as HTMLElement;
    whiteIconBtn.parentNode?.replaceChild(newBtn, whiteIconBtn);
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showCharacterDetail(opponentId, () => {}, false);
    });
  }

  // スキルアイコン初期化
  if (skillIcon) {
    skillIcon.textContent = leaderChar.icon;
  }
  if (skillIconEnemy) {
    skillIconEnemy.textContent = opponentChar.icon;
  }

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
    if (leaderId === 'god_zeus') effectType = 'lightning';
    else if (leaderId === 'god_hades') effectType = 'void';
    else if (leaderId === 'god_athena') effectType = 'divine';
    
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
    const onSkillClick = () => {
      if (gameManager?.isHumanTurn()) {
        gameManager.activateSkill();
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
  const blackMana = document.getElementById('player-black-mana');
  const whiteMana = document.getElementById('player-white-mana');
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

  if (blackMana) blackMana.textContent = String(state.players[BLACK].mana);
  if (whiteMana) whiteMana.textContent = String(state.players[WHITE].mana);

  playerInfo?.classList.toggle('active-player', state.currentPlayer === BLACK && state.phase === 'playing');
  enemyInfo?.classList.toggle('active-player', state.currentPlayer === WHITE && state.phase === 'playing');

  if (playerSkillBtn) {
    const player = state.players[BLACK];
    const canUse = player.mana >= player.character.activeSkill.manaCost;
    playerSkillBtn.disabled = !canUse;
    playerSkillBtn.classList.toggle('can-use', canUse);
  }

  if (enemySkillBtn) {
    const enemy = state.players[WHITE];
    const canUse = enemy.mana >= enemy.character.activeSkill.manaCost;
    enemySkillBtn.classList.toggle('can-use', canUse);
  }
}

function showMessage(text: string): void {
  const msgEl = document.getElementById('game-message');
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.classList.add('message-show');
  setTimeout(() => msgEl.classList.remove('message-show'), 2500);
}
