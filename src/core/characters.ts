import type { CharacterId } from './constants';
import type { Board, CellState } from './constants';
import { BOARD_SIZE, EMPTY } from './constants';
import { getValidMoves, flipStone, forceSetStone, cloneBoard, countStones } from './board';

// ─── キャラクターデータ型 ─────
export interface CharacterData {
  id: CharacterId;
  name: string;
  title: string;
  rarity: 'SSR' | 'SR' | 'R';
  color: string;         // テーマカラー
  icon: string;          // Emoji代用
  imageUrl?: string;
  activeSkill: ActiveSkill;
  passiveSkill: PassiveSkill;
  uncapBonuses: UncapBonus[];
}

export interface ActiveSkill {
  name: string;
  description: string;
  execute: (ctx: SkillContext) => SkillResult;
}

export interface PassiveSkill {
  name: string;
  description: string;
  trigger: PassiveTrigger;
  effect: (ctx: SkillContext, uncapLevel: number) => void;
}

export type PassiveTrigger = 'onTurnStart' | 'onTurnEnd' | 'onFlip' | 'onGameStart' | 'onGameEnd';

export interface UncapBonus {
  level: number;
  description: string;
  stat: 'timeBonus' | 'scoreMultiplier' | 'passiveEnhance' | 'activeEnhance';
  value: number;
}

export interface SkillContext {
  board: Board;
  currentPlayer: CellState;
  opponentPlayer: CellState;
  turnCount: number;
  timeRemaining: number;
  uncapLevel: number;
  scoreMultiplier: number;
  timeBonus: number;
}

export interface SkillResult {
  board: Board;
  message: string;
  affectedCells: [number, number][];
  bonusTime?: number;
  bonusScore?: number;
}

// ─── キャラクター定義 ─────
export const CHARACTERS: Record<CharacterId, CharacterData> = {
  alfred: {
    id: 'alfred',
    name: 'アルフレッド',
    title: '聖騎士',
    rarity: 'SSR',
    color: '#FFD700',
    icon: '⚔️',
    imageUrl: 'assets/characters/alfred.png',
    activeSkill: {
      name: '聖なる裁き',
      description: '十字方向（縦横1列）の敵石を全て自分の色に反転する',
      execute: (ctx: SkillContext): SkillResult => {
        const board = cloneBoard(ctx.board);
        const affected: [number, number][] = [];
        const mid = Math.floor(BOARD_SIZE / 2);
        // 中央十字を反転
        for (let i = 0; i < BOARD_SIZE; i++) {
          if (board[mid][i] === ctx.opponentPlayer) {
            board[mid][i] = ctx.currentPlayer;
            affected.push([mid, i]);
          }
          if (board[i][mid] === ctx.opponentPlayer) {
            board[i][mid] = ctx.currentPlayer;
            affected.push([i, mid]);
          }
        }
        return {
          board,
          message: 'アルフレッドの聖なる裁き！十字方向の石を反転！',
          affectedCells: affected,
        };
      },
    },
    passiveSkill: {
      name: '騎士の誇り',
      description: '自分のターン開始時、残り時間が3秒回復',
      trigger: 'onTurnStart',
      effect: (ctx: SkillContext, uncapLevel: number) => {
        ctx.timeBonus += 3 + uncapLevel;
      },
    },
    uncapBonuses: [
      { level: 1, description: 'パッシブの回復時間+1秒', stat: 'passiveEnhance', value: 1 },
      { level: 2, description: 'スコア倍率+5%', stat: 'scoreMultiplier', value: 0.05 },
      { level: 3, description: 'パッシブの回復時間+2秒', stat: 'passiveEnhance', value: 2 },
      { level: 4, description: 'スコア倍率+10%', stat: 'scoreMultiplier', value: 0.1 },
      { level: 5, description: '聖なる裁きがX字方向にも追加発動', stat: 'activeEnhance', value: 1 },
    ],
  },

  luna: {
    id: 'luna',
    name: 'ルナ',
    title: '月影の魔女',
    rarity: 'SSR',
    color: '#9B59B6',
    icon: '🌙',
    imageUrl: 'assets/characters/luna.png',
    activeSkill: {
      name: '月蝕の帳',
      description: '四隅のいずれか1つに自分の石を強制配置する',
      execute: (ctx: SkillContext): SkillResult => {
        const board = cloneBoard(ctx.board);
        const corners: [number, number][] = [
          [0, 0], [0, BOARD_SIZE - 1],
          [BOARD_SIZE - 1, 0], [BOARD_SIZE - 1, BOARD_SIZE - 1],
        ];
        const affected: [number, number][] = [];
        // 空いている隅から1つ選んで自分の石を置く
        for (const [r, c] of corners) {
          if (board[r][c] === EMPTY) {
            forceSetStone(board, r, c, ctx.currentPlayer);
            affected.push([r, c]);
            break;
          }
        }
        if (affected.length === 0) {
          // 隅が全部埋まっている場合、敵の隅を奪う
          for (const [r, c] of corners) {
            if (board[r][c] === ctx.opponentPlayer) {
              board[r][c] = ctx.currentPlayer;
              affected.push([r, c]);
              break;
            }
          }
        }
        return {
          board,
          message: 'ルナの月蝕の帳！角を制圧！',
          affectedCells: affected,
        };
      },
    },
    passiveSkill: {
      name: '月光の加護',
      description: '相手のスキル発動時、その効果を半減する',
      trigger: 'onTurnEnd',
      effect: (_ctx: SkillContext, _uncapLevel: number) => {
        // 相手スキル半減は GameManager 側で処理
      },
    },
    uncapBonuses: [
      { level: 1, description: '時間ボーナス+2秒', stat: 'timeBonus', value: 2 },
      { level: 2, description: 'スコア倍率+5%', stat: 'scoreMultiplier', value: 0.05 },
      { level: 3, description: '時間ボーナス+3秒', stat: 'timeBonus', value: 3 },
      { level: 4, description: 'スコア倍率+10%', stat: 'scoreMultiplier', value: 0.1 },
      { level: 5, description: '月蝕の帳で2つの角を制圧', stat: 'activeEnhance', value: 1 },
    ],
  },

  drake: {
    id: 'drake',
    name: 'ドレイク',
    title: '紅蓮の竜騎士',
    rarity: 'SR',
    color: '#E74C3C',
    icon: '🐉',
    imageUrl: 'assets/characters/drake.png',
    activeSkill: {
      name: '竜炎の息吹',
      description: 'ランダムな3×3エリアの石を全て自分の色に変える',
      execute: (ctx: SkillContext): SkillResult => {
        const board = cloneBoard(ctx.board);
        const affected: [number, number][] = [];
        // ランダムな開始位置
        const sr = Math.floor(Math.random() * (BOARD_SIZE - 2));
        const sc = Math.floor(Math.random() * (BOARD_SIZE - 2));
        for (let r = sr; r < sr + 3; r++) {
          for (let c = sc; c < sc + 3; c++) {
            if (board[r][c] === ctx.opponentPlayer) {
              board[r][c] = ctx.currentPlayer;
              affected.push([r, c]);
            }
          }
        }
        return {
          board,
          message: `ドレイクの竜炎の息吹！[${sr},${sc}]エリアを焼き尽くす！`,
          affectedCells: affected,
        };
      },
    },
    passiveSkill: {
      name: '竜鱗の守り',
      description: '石をひっくり返した時、追加で隣接1マスを自分の色にする',
      trigger: 'onFlip',
      effect: (ctx: SkillContext, uncapLevel: number) => {
        // GameManager側で実装: flip時に隣接マスを追加反転
        ctx.scoreMultiplier += 0.02 * uncapLevel;
      },
    },
    uncapBonuses: [
      { level: 1, description: 'パッシブ強化：追加反転数+1', stat: 'passiveEnhance', value: 1 },
      { level: 2, description: 'スコア倍率+5%', stat: 'scoreMultiplier', value: 0.05 },
      { level: 3, description: '竜炎エリアが4×4に拡大', stat: 'activeEnhance', value: 1 },
      { level: 4, description: '時間ボーナス+3秒', stat: 'timeBonus', value: 3 },
      { level: 5, description: 'スコア倍率+15%', stat: 'scoreMultiplier', value: 0.15 },
    ],
  },

  mira: {
    id: 'mira',
    name: 'ミラ',
    title: '星詠みの賢者',
    rarity: 'SR',
    color: '#3498DB',
    icon: '⭐',
    imageUrl: 'assets/characters/mira.png',
    activeSkill: {
      name: '星座の導き',
      description: '次の3手先まで相手の最善手を表示する（実際はAI示唆）',
      execute: (ctx: SkillContext): SkillResult => {
        // 盤面は変更せず、情報スキルとして機能
        const moves = getValidMoves(ctx.board, ctx.opponentPlayer);
        const previewMoves = moves.slice(0, Math.min(3, moves.length));
        return {
          board: cloneBoard(ctx.board),
          message: `ミラの星座の導き！相手の候補手を${previewMoves.length}箇所表示！`,
          affectedCells: previewMoves,
        };
      },
    },
    passiveSkill: {
      name: '星明りの知恵',
      description: 'ゲーム開始時に制限時間をボーナスで延長',
      trigger: 'onGameStart',
      effect: (ctx: SkillContext, uncapLevel: number) => {
        ctx.timeBonus += 5 + uncapLevel * 2;
      },
    },
    uncapBonuses: [
      { level: 1, description: '開始時の時間ボーナス+3秒', stat: 'timeBonus', value: 3 },
      { level: 2, description: 'スコア倍率+5%', stat: 'scoreMultiplier', value: 0.05 },
      { level: 3, description: '表示手数が5手に増加', stat: 'activeEnhance', value: 1 },
      { level: 4, description: '時間ボーナス+5秒', stat: 'timeBonus', value: 5 },
      { level: 5, description: 'スコア倍率+10%', stat: 'scoreMultiplier', value: 0.1 },
    ],
  },

  zephyr: {
    id: 'zephyr',
    name: 'ゼフィル',
    title: '風来の盗賊',
    rarity: 'R',
    color: '#2ECC71',
    icon: '💨',
    imageUrl: 'assets/characters/zephyr.png',
    activeSkill: {
      name: '疾風怒濤',
      description: '盤面の外周1列の敵石を全てひっくり返す',
      execute: (ctx: SkillContext): SkillResult => {
        const board = cloneBoard(ctx.board);
        const affected: [number, number][] = [];
        for (let i = 0; i < BOARD_SIZE; i++) {
          // 上辺
          if (board[0][i] === ctx.opponentPlayer) { flipStone(board, 0, i); affected.push([0, i]); }
          // 下辺
          if (board[BOARD_SIZE-1][i] === ctx.opponentPlayer) { flipStone(board, BOARD_SIZE-1, i); affected.push([BOARD_SIZE-1, i]); }
          // 左辺
          if (board[i][0] === ctx.opponentPlayer) { flipStone(board, i, 0); affected.push([i, 0]); }
          // 右辺
          if (board[i][BOARD_SIZE-1] === ctx.opponentPlayer) { flipStone(board, i, BOARD_SIZE-1); affected.push([i, BOARD_SIZE-1]); }
        }
        return {
          board,
          message: 'ゼフィルの疾風怒濤！外周の石を反転！',
          affectedCells: affected,
        };
      },
    },
    passiveSkill: {
      name: '風読み',
      description: 'ターン終了時、相手の思考時間を1秒短縮',
      trigger: 'onTurnEnd',
      effect: (ctx: SkillContext, uncapLevel: number) => {
        ctx.timeBonus -= (1 + Math.floor(uncapLevel / 2));
      },
    },
    uncapBonuses: [
      { level: 1, description: '相手の時間短縮+1秒', stat: 'passiveEnhance', value: 1 },
      { level: 2, description: 'スコア倍率+3%', stat: 'scoreMultiplier', value: 0.03 },
      { level: 3, description: '外周反転が内周1列にも拡大', stat: 'activeEnhance', value: 1 },
      { level: 4, description: '時間ボーナス+2秒', stat: 'timeBonus', value: 2 },
      { level: 5, description: 'スコア倍率+10%', stat: 'scoreMultiplier', value: 0.1 },
    ],
  },

  noir: {
    id: 'noir',
    name: 'ノワール',
    title: '闇夜の暗殺者',
    rarity: 'R',
    color: '#8E44AD',
    icon: '🗡️',
    activeSkill: {
      name: '影縫い',
      description: '相手の最も石が多い行を1行完全にリセット（空にする）',
      execute: (ctx: SkillContext): SkillResult => {
        const board = cloneBoard(ctx.board);
        const affected: [number, number][] = [];
        // 相手の石が最も多い行を探す
        let maxRow = 0;
        let maxCount = 0;
        for (let r = 0; r < BOARD_SIZE; r++) {
          let count = 0;
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === ctx.opponentPlayer) count++;
          }
          if (count > maxCount) {
            maxCount = count;
            maxRow = r;
          }
        }
        // その行を空にする
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (board[maxRow][c] !== EMPTY) {
            affected.push([maxRow, c]);
            board[maxRow][c] = EMPTY;
          }
        }
        return {
          board,
          message: `ノワールの影縫い！第${maxRow + 1}行を消去！`,
          affectedCells: affected,
        };
      },
    },
    passiveSkill: {
      name: '暗殺術',
      description: 'ゲーム終了時、スコアに石差×2のボーナスを加算',
      trigger: 'onGameEnd',
      effect: (ctx: SkillContext, uncapLevel: number) => {
        const { black, white } = countStones(ctx.board);
        const diff = Math.abs(black - white);
        ctx.scoreMultiplier += diff * 0.02 * (1 + uncapLevel * 0.5);
      },
    },
    uncapBonuses: [
      { level: 1, description: 'ボーナス倍率+50%', stat: 'passiveEnhance', value: 0.5 },
      { level: 2, description: 'スコア倍率+5%', stat: 'scoreMultiplier', value: 0.05 },
      { level: 3, description: '影縫いが2行に拡大', stat: 'activeEnhance', value: 1 },
      { level: 4, description: '時間ボーナス+2秒', stat: 'timeBonus', value: 2 },
      { level: 5, description: 'スコア倍率+15%', stat: 'scoreMultiplier', value: 0.15 },
    ],
  },
};
