import type { Board, CellState } from './constants';
import { BLACK, WHITE, TURN_TIME_LIMIT, MAX_MANA, INITIAL_MANA } from './constants';
import {
  createInitialBoard,
  cloneBoard,
  getValidMoves,
  placeStone,
  isGameOver,
  getWinner,
  countStones,
  opponent,
} from './board';
import type { CharacterData, SkillContext, SkillResult, PassiveTrigger } from './characters/characters';
import { onlineManager } from './onlineManager';
import type { OnlineMessage } from './onlineManager';
import { audioManager } from './audioManager';

export type GamePhase = 'waiting' | 'playing' | 'skillAnimation' | 'finished';
export type GameMode = 'ai' | 'pvp' | 'online';

export interface PlayerInfo {
  character: CharacterData;
  uncapLevel: number;
  isHuman: boolean;
  mana: number;
  maxMana: number;
  scoreMultiplier: number;
  timeBonus: number;
}

export interface GameState {
  board: Board;
  currentPlayer: CellState;
  phase: GamePhase;
  mode: GameMode;
  turnCount: number;
  turnTimeRemaining: number;
  players: Record<number, PlayerInfo>;
  validMoves: [number, number][];
  lastMove: [number, number] | null;
  lastFlips: [number, number][];
  skillResult: SkillResult | null;
  previewCells: [number, number][]; // ミラスキル用
  winner: CellState | null;
  scores: { black: number; white: number };
  aiLevel: number;
  message: string;
}

export type GameEventType = 
  | 'stateChange'
  | 'move'
  | 'flip'
  | 'skillActivated'
  | 'turnChange'
  | 'gameOver'
  | 'timerUpdate'
  | 'message';

export type GameEventCallback = (data: unknown) => void;

export class GameManager {
  private state: GameState;
  private listeners: Map<GameEventType, Set<GameEventCallback>> = new Map();
  private timerInterval: number | null = null;
  private aiWorker: Worker | null = null;

  constructor() {
    this.state = this.createDefaultState();
    this.initWorker();
  }

  private initWorker(): void {
    try {
      this.aiWorker = new Worker(new URL('../ai/aiWorker.ts', import.meta.url), { type: 'module' });
      this.aiWorker.onmessage = (e) => {
        const move = e.data;
        if (move) {
          this.makeMove(move[0], move[1]);
        }
      };
    } catch (e) {
      console.error('Failed to initialize AI Worker:', e);
    }
  }

  private createDefaultState(): GameState {
    return {
      board: createInitialBoard(),
      currentPlayer: BLACK,
      phase: 'waiting',
      mode: 'ai',
      turnCount: 0,
      turnTimeRemaining: TURN_TIME_LIMIT,
      players: {
        [BLACK]: this.createDefaultPlayer(),
        [WHITE]: this.createDefaultPlayer(),
      },
      validMoves: [],
      lastMove: null,
      lastFlips: [],
      skillResult: null,
      previewCells: [],
      winner: null,
      scores: { black: 0, white: 0 },
      aiLevel: 2,
      message: '',
    };
  }

  private createDefaultPlayer(): PlayerInfo {
    return {
      character: null as unknown as CharacterData,
      uncapLevel: 0,
      isHuman: true,
      mana: INITIAL_MANA,
      maxMana: MAX_MANA,
      scoreMultiplier: 1.0,
      timeBonus: 0,
    };
  }

  // イベントシステム
  on(event: GameEventType, callback: GameEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: GameEventType, callback: GameEventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: GameEventType, data?: unknown): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  // ゲーム制御
  startGame(
    mode: GameMode,
    blackChar: CharacterData,
    whiteChar: CharacterData,
    blackUncap: number,
    whiteUncap: number,
    aiLevel: number = 2
  ): void {
    this.state = this.createDefaultState();
    this.state.mode = mode;
    this.state.aiLevel = aiLevel;
    this.state.phase = 'playing';
    this.state.players[BLACK] = {
      character: blackChar,
      uncapLevel: blackUncap,
      isHuman: true,
      mana: INITIAL_MANA,
      maxMana: MAX_MANA,
      scoreMultiplier: this.calculateScoreMultiplier(blackChar, blackUncap),
      timeBonus: 0,
    };
    this.state.players[WHITE] = {
      character: whiteChar,
      uncapLevel: whiteUncap,
      isHuman: mode !== 'ai',
      mana: INITIAL_MANA,
      maxMana: MAX_MANA,
      scoreMultiplier: this.calculateScoreMultiplier(whiteChar, whiteUncap),
      timeBonus: 0,
    };

    // パッシブ: onGameStart
    this.triggerPassive('onGameStart', BLACK);
    this.triggerPassive('onGameStart', WHITE);

    this.state.validMoves = getValidMoves(this.state.board, this.state.currentPlayer);
    this.state.turnTimeRemaining = TURN_TIME_LIMIT + this.state.players[BLACK].timeBonus;
    this.startTimer();
    this.emit('stateChange', this.getState());
    this.emit('message', { text: '対局開始！' });

    // AI先攻の場合はAIに手を打たせる
    if (mode === 'ai' && !this.state.players[this.state.currentPlayer].isHuman) {
      this.requestAIMove();
    }

    // オンライン同期設定
    if (mode === 'online') {
      this.initOnlineSync();
    }
  }

  private initOnlineSync(): void {
    onlineManager.onMessage((msg: OnlineMessage) => {
      if (msg.type === 'move') {
        this.makeMove(msg.row, msg.col, true);
      } else if (msg.type === 'skill') {
        this.activateSkill(true);
      }
    });
  }

  private calculateScoreMultiplier(char: CharacterData, uncapLevel: number): number {
    let mult = 1.0;
    for (const bonus of char.uncapBonuses) {
      if (bonus.level <= uncapLevel && bonus.stat === 'scoreMultiplier') {
        mult += bonus.value;
      }
    }
    return mult;
  }

  // タイマー
  private startTimer(): void {
    this.stopTimer();
    this.timerInterval = window.setInterval(() => {
      if (this.state.phase !== 'playing') return;
      this.state.turnTimeRemaining -= 1;
      this.emit('timerUpdate', { time: this.state.turnTimeRemaining });

      if (this.state.turnTimeRemaining <= 0) {
        this.handleTimeout();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private handleTimeout(): void {
    const moves = this.state.validMoves;
    if (moves.length > 0) {
      const [r, c] = moves[Math.floor(Math.random() * moves.length)];
      const placed = this.makeMove(r, c);
      if (placed) {
        this.emit('message', { text: '時間切れ！ランダムに石を配置しました' });
      } else {
        this.emit('message', { text: '時間切れ！配置に失敗したためパスしました' });
        this.nextTurn();
      }
    } else {
      this.nextTurn();
    }
  }

  // 石を置く
  makeMove(row: number, col: number, isRemote: boolean = false): boolean {
    if (this.state.phase !== 'playing') return false;

    // オンライン時の相手ターンチェック
    if (this.state.mode === 'online' && !isRemote && !this.isHumanTurn()) {
      return false;
    }

    const player = this.state.currentPlayer;
    const flips = placeStone(this.state.board, row, col, player);
    if (flips.length === 0) return false;

    // 自分の手なら相手に送信
    if (this.state.mode === 'online' && !isRemote) {
      onlineManager.send({ type: 'move', row, col });
    }

    this.state.lastMove = [row, col];
    this.state.lastFlips = flips;
    this.state.turnCount++;

    audioManager.playPlaceStone();
    setTimeout(() => audioManager.playFlipStone(), 300);

    // パッシブ: onFlip
    this.triggerPassive('onFlip', player);

    this.emit('move', { row, col, player, flips });
    this.emit('flip', { flips, player });

    // ゲーム終了チェック
    if (isGameOver(this.state.board)) {
      this.endGame();
      return true;
    }

    this.nextTurn();
    return true;
  }

  private nextTurn(): void {
    // パッシブ: onTurnEnd
    this.triggerPassive('onTurnEnd', this.state.currentPlayer);

    const next = opponent(this.state.currentPlayer);
    this.state.currentPlayer = next;
    this.state.validMoves = getValidMoves(this.state.board, next);
    this.state.previewCells = [];

    // マナ加算: 自分のターンが来るたびに+1
    const nextPlayerInfo = this.state.players[next];
    nextPlayerInfo.mana = Math.min(nextPlayerInfo.maxMana, nextPlayerInfo.mana + 1);

    // パスチェック
    if (this.state.validMoves.length === 0) {
      const otherMoves = getValidMoves(this.state.board, opponent(next));
      if (otherMoves.length === 0) {
        this.endGame();
        return;
      }
      this.emit('message', { text: `${next === BLACK ? '黒' : '白'}はパスです` });
      this.state.currentPlayer = opponent(next);
      this.state.validMoves = otherMoves;
    }

    // パッシブ: onTurnStart
    this.triggerPassive('onTurnStart', this.state.currentPlayer);

    const playerInfo = this.state.players[this.state.currentPlayer];
    this.state.turnTimeRemaining = TURN_TIME_LIMIT + playerInfo.timeBonus;
    this.emit('turnChange', { player: this.state.currentPlayer });
    this.emit('stateChange', this.getState());

    if (this.state.mode === 'ai' && !playerInfo.isHuman) {
      this.requestAIMove();
    }
  }

  private endGame(): void {
    this.state.phase = 'finished';
    this.stopTimer();

    this.triggerPassive('onGameEnd', BLACK);
    this.triggerPassive('onGameEnd', WHITE);

    const winner = getWinner(this.state.board);
    this.state.winner = winner;

    const counts = countStones(this.state.board);
    this.state.scores = {
      black: Math.round(counts.black * this.state.players[BLACK].scoreMultiplier),
      white: Math.round(counts.white * this.state.players[WHITE].scoreMultiplier),
    };

    this.emit('gameOver', {
      winner,
      scores: this.state.scores,
      counts,
    });
    this.emit('stateChange', this.getState());
  }

  // スキル発動
  activateSkill(isRemote: boolean = false): SkillResult | null {
    if (this.state.phase !== 'playing') return null;

    if (this.state.mode === 'online' && !isRemote && !this.isHumanTurn()) {
      return null;
    }

    const player = this.state.currentPlayer;
    const playerInfo = this.state.players[player];
    const skill = playerInfo.character.activeSkill;

    if (playerInfo.mana < skill.manaCost) {
      this.emit('message', { text: `マナが足りません (必要: ${skill.manaCost})` });
      return null;
    }

    const ctx = this.createSkillContext(player);
    const result = skill.execute(ctx);

    if (this.state.mode === 'online' && !isRemote) {
      onlineManager.send({ type: 'skill' });
    }

    playerInfo.mana -= skill.manaCost;
    this.state.board = result.board;
    this.state.skillResult = result;
    this.state.validMoves = getValidMoves(this.state.board, player);

    audioManager.playSkill();

    if (result.bonusTime) {
      this.state.turnTimeRemaining += result.bonusTime;
    }

    this.emit('skillActivated', result);
    this.emit('message', { text: result.message });
    this.emit('stateChange', this.getState());

    return result;
  }

  private createSkillContext(player: CellState): SkillContext {
    const info = this.state.players[player];
    return {
      board: this.state.board,
      currentPlayer: player,
      opponentPlayer: opponent(player),
      turnCount: this.state.turnCount,
      timeRemaining: this.state.turnTimeRemaining,
      uncapLevel: info.uncapLevel,
      scoreMultiplier: info.scoreMultiplier,
      timeBonus: info.timeBonus,
      mana: info.mana,
    };
  }

  private triggerPassive(trigger: PassiveTrigger, player: CellState): void {
    const info = this.state.players[player];
    if (!info.character) return;
    const passive = info.character.passiveSkill;
    if (passive.trigger === trigger) {
      const ctx = this.createSkillContext(player);
      passive.effect(ctx, info.uncapLevel);
      info.scoreMultiplier = ctx.scoreMultiplier;
      info.timeBonus = ctx.timeBonus;
      info.mana = ctx.mana;
    }
  }

  private requestAIMove(): void {
    if (!this.aiWorker) return;

    setTimeout(() => {
      if (this.state.phase !== 'playing') return;

      const player = this.state.currentPlayer;
      const playerInfo = this.state.players[player];
      const skill = playerInfo.character.activeSkill;

      if (playerInfo.mana >= skill.manaCost) {
        const counts = countStones(this.state.board);
        const myCount = player === BLACK ? counts.black : counts.white;
        const opCount = player === BLACK ? counts.white : counts.black;

        const shouldSkill = this.state.aiLevel >= 2 && (
          (opCount > myCount + 5) || 
          (Math.random() < 0.2)
        );

        if (shouldSkill) {
          this.activateSkill();
          if (this.state.currentPlayer === player) {
            this.requestAIMove();
            return;
          }
        }
      }
      
      this.aiWorker?.postMessage({
        board: this.state.board,
        player: this.state.currentPlayer,
        level: this.state.aiLevel
      });
    }, 800 + Math.random() * 800);
  }

  getState(): Readonly<GameState> {
    return { ...this.state };
  }

  getCurrentPlayer(): CellState {
    return this.state.currentPlayer;
  }

  getBoard(): Board {
    return cloneBoard(this.state.board);
  }

  isHumanTurn(): boolean {
    return this.state.players[this.state.currentPlayer]?.isHuman ?? false;
  }

  destroy(): void {
    this.stopTimer();
    this.listeners.clear();
    if (this.aiWorker) {
      this.aiWorker.terminate();
      this.aiWorker = null;
    }
  }
}
