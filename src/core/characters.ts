import type { CharacterId } from './constants';
import type { Board, CellState } from './constants';
import { BOARD_SIZE, EMPTY } from './constants';
import { getValidMoves, flipStone, forceSetStone, cloneBoard, countStones } from './board';

// ─── 神格データ型 ─────
export interface CharacterData {
  id: CharacterId;
  name: string;
  title: string;
  rarity: 'SSR' | 'SR' | 'R';
  color: string;         // 神格のオーラカラー
  icon: string;          // 属性シンボル
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

// ─── 神格定義 ─────
export const CHARACTERS: Record<CharacterId, CharacterData> = {
  alfred: {
    id: 'alfred',
    name: 'ゼウス',
    title: '全知全能の雷神',
    rarity: 'SSR',
    color: '#F1C40F',
    icon: '⚡',
    imageUrl: 'assets/characters/zeus.png',
    activeSkill: {
      name: 'ケラウノスの雷霆',
      description: '十字方向にある相手の石を全て自分の石に変える。',
      execute: (ctx: SkillContext): SkillResult => {
        const board = cloneBoard(ctx.board);
        const affected: [number, number][] = [];
        const mid = Math.floor(BOARD_SIZE / 2);
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
          message: 'ゼウスの神雷！ケラウノスが盤面を貫く！',
          affectedCells: affected,
        };
      },
    },
    passiveSkill: {
      name: '至高の権威',
      description: '自分のターン開始時、思考時間が回復する。',
      trigger: 'onTurnStart',
      effect: (ctx: SkillContext, uncapLevel: number) => {
        ctx.timeBonus += 3 + uncapLevel;
      },
    },
    uncapBonuses: [
      { level: 1, description: '権威の格：回復時間+1秒', stat: 'passiveEnhance', value: 1 },
      { level: 2, description: '黄金の導き：獲得スコア+5%', stat: 'scoreMultiplier', value: 0.05 },
      { level: 3, description: '権威の格：回復時間+2秒', stat: 'passiveEnhance', value: 2 },
      { level: 4, description: '黄金の導き：獲得スコア+10%', stat: 'scoreMultiplier', value: 0.1 },
      { level: 5, description: '神雷の覚醒：効果範囲が拡大する', stat: 'activeEnhance', value: 1 },
    ],
  },

  luna: {
    id: 'luna',
    name: 'ハデス',
    title: '冥府を統べる王',
    rarity: 'SSR',
    color: '#8E44AD',
    icon: '💀',
    imageUrl: 'assets/characters/hades.png',
    activeSkill: {
      name: '隠れ兜の権能',
      description: '盤面の四隅（コーナー）のいずれかを強制的に自分の石にする。',
      execute: (ctx: SkillContext): SkillResult => {
        const board = cloneBoard(ctx.board);
        const corners: [number, number][] = [
          [0, 0], [0, BOARD_SIZE - 1],
          [BOARD_SIZE - 1, 0], [BOARD_SIZE - 1, BOARD_SIZE - 1],
        ];
        const affected: [number, number][] = [];
        for (const [r, c] of corners) {
          if (board[r][c] === EMPTY) {
            forceSetStone(board, r, c, ctx.currentPlayer);
            affected.push([r, c]);
            break;
          }
        }
        if (affected.length === 0) {
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
          message: 'ハデスの権能！隠れ兜が隅の支配を確定させる！',
          affectedCells: affected,
        };
      },
    },
    passiveSkill: {
      name: '冥府の戒律',
      description: '相手がスキルを使用した際、その影響を軽減する。',
      trigger: 'onTurnEnd',
      effect: (_ctx: SkillContext, _uncapLevel: number) => {},
    },
    uncapBonuses: [
      { level: 1, description: '常闇の猶予：時間ボーナス+2秒', stat: 'timeBonus', value: 2 },
      { level: 2, description: '魂の収穫：獲得スコア+5%', stat: 'scoreMultiplier', value: 0.05 },
      { level: 3, description: '常闇の猶予：時間ボーナス+3秒', stat: 'timeBonus', value: 3 },
      { level: 4, description: '魂の収穫：獲得スコア+10%', stat: 'scoreMultiplier', value: 0.1 },
      { level: 5, description: '冥王の覚醒：一度に2つの隅を支配する', stat: 'activeEnhance', value: 1 },
    ],
  },

  drake: {
    id: 'drake',
    name: 'アレス',
    title: '戦場を駆ける荒神',
    rarity: 'SR',
    color: '#C0392B',
    icon: '🔥',
    imageUrl: 'assets/characters/ares.png',
    activeSkill: {
      name: 'ゴッド・オブ・ウォー',
      description: 'ランダムな3×3マスの範囲にある相手の石を全て自分の石に変える。',
      execute: (ctx: SkillContext): SkillResult => {
        const board = cloneBoard(ctx.board);
        const affected: [number, number][] = [];
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
          message: `アレスの咆哮！戦火が盤面を焼き払う！`,
          affectedCells: affected,
        };
      },
    },
    passiveSkill: {
      name: '軍神の闘気',
      description: '石を裏返すたび、獲得スコア倍率が上昇する。',
      trigger: 'onFlip',
      effect: (ctx: SkillContext, uncapLevel: number) => {
        ctx.scoreMultiplier += 0.02 * uncapLevel;
      },
    },
    uncapBonuses: [
      { level: 1, description: '闘気の高揚：倍率上昇量アップ', stat: 'passiveEnhance', value: 1 },
      { level: 2, description: '勝利の凱歌：獲得スコア+5%', stat: 'scoreMultiplier', value: 0.05 },
      { level: 3, description: '戦火の拡大：攻撃エリアが4×4に増加', stat: 'activeEnhance', value: 1 },
      { level: 4, description: '戦士の休息：時間ボーナス+3秒', stat: 'timeBonus', value: 3 },
      { level: 5, description: '軍神の覚醒：獲得スコア+15%', stat: 'scoreMultiplier', value: 0.15 },
    ],
  },

  mira: {
    id: 'mira',
    name: 'アテナ',
    title: '勝利と知恵の女神',
    rarity: 'SR',
    color: '#2980B9',
    icon: '🛡️',
    imageUrl: 'assets/characters/athena.png',
    activeSkill: {
      name: 'アイギスの啓示',
      description: '相手の次の合法手を最大3手までハイライト表示する。',
      execute: (ctx: SkillContext): SkillResult => {
        const moves = getValidMoves(ctx.board, ctx.opponentPlayer);
        const previewMoves = moves.slice(0, Math.min(3, moves.length));
        return {
          board: cloneBoard(ctx.board),
          message: `アテナの啓示！アイギスが未来の攻防を映し出す！`,
          affectedCells: previewMoves,
        };
      },
    },
    passiveSkill: {
      name: '神託の知略',
      description: '対局開始時、制限時間が延長される。',
      trigger: 'onGameStart',
      effect: (ctx: SkillContext, uncapLevel: number) => {
        ctx.timeBonus += 5 + uncapLevel * 2;
      },
    },
    uncapBonuses: [
      { level: 1, description: '知略の深み：開始時間+3秒', stat: 'timeBonus', value: 3 },
      { level: 2, description: '神殿の恵み：獲得スコア+5%', stat: 'scoreMultiplier', value: 0.05 },
      { level: 3, description: '啓示の拡大：予見できる手数が5手に増加', stat: 'activeEnhance', value: 1 },
      { level: 4, description: '知略の深み：開始時間+5秒', stat: 'timeBonus', value: 5 },
      { level: 5, description: '知恵の覚醒：獲得スコア+10%', stat: 'scoreMultiplier', value: 0.1 },
    ],
  },

  zephyr: {
    id: 'zephyr',
    name: 'ヘルメス',
    title: '神々の伝令使',
    rarity: 'R',
    color: '#27AE60',
    icon: '🕊️',
    imageUrl: 'assets/characters/hermes.png',
    activeSkill: {
      name: '神速のタラリア',
      description: '盤面の外周（一番外側の列）にある相手の石を全て自分の石に変える。',
      execute: (ctx: SkillContext): SkillResult => {
        const board = cloneBoard(ctx.board);
        const affected: [number, number][] = [];
        for (let i = 0; i < BOARD_SIZE; i++) {
          if (board[0][i] === ctx.opponentPlayer) { flipStone(board, 0, i); affected.push([0, i]); }
          if (board[BOARD_SIZE-1][i] === ctx.opponentPlayer) { flipStone(board, BOARD_SIZE-1, i); affected.push([BOARD_SIZE-1, i]); }
          if (board[i][0] === ctx.opponentPlayer) { flipStone(board, i, 0); affected.push([i, 0]); }
          if (board[i][BOARD_SIZE-1] === ctx.opponentPlayer) { flipStone(board, i, BOARD_SIZE-1); affected.push([i, BOARD_SIZE-1]); }
        }
        return {
          board,
          message: 'ヘルメスの神速！盤面の外周を瞬く間に制圧！',
          affectedCells: affected,
        };
      },
    },
    passiveSkill: {
      name: '風の便り',
      description: '自分のターン終了時、相手の思考時間を短縮させる。',
      trigger: 'onTurnEnd',
      effect: (ctx: SkillContext, uncapLevel: number) => {
        ctx.timeBonus -= (1 + Math.floor(uncapLevel / 2));
      },
    },
    uncapBonuses: [
      { level: 1, description: '追い風：相手の短縮時間+1秒', stat: 'passiveEnhance', value: 1 },
      { level: 2, description: '旅の収穫：獲得スコア+3%', stat: 'scoreMultiplier', value: 0.03 },
      { level: 3, description: '突風：反転エリアが内周にも波及', stat: 'activeEnhance', value: 1 },
      { level: 4, description: '伝令の休息：時間ボーナス+2秒', stat: 'timeBonus', value: 2 },
      { level: 5, description: '伝令の覚醒：獲得スコア+10%', stat: 'scoreMultiplier', value: 0.1 },
    ],
  },

  noir: {
    id: 'noir',
    name: 'アルテミス',
    title: '純潔なる月の女神',
    rarity: 'R',
    color: '#34495E',
    icon: '🏹',
    imageUrl: 'assets/characters/artemis.png',
    activeSkill: {
      name: '月光の狙撃',
      description: '相手の石が最も多い一列（行）を、全て空きマスに戻す。',
      execute: (ctx: SkillContext): SkillResult => {
        const board = cloneBoard(ctx.board);
        const affected: [number, number][] = [];
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
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (board[maxRow][c] !== EMPTY) {
            affected.push([maxRow, c]);
            board[maxRow][c] = EMPTY;
          }
        }
        return {
          board,
          message: `アルテミスの銀矢！第${maxRow + 1}行を静寂が包む！`,
          affectedCells: affected,
        };
      },
    },
    passiveSkill: {
      name: '狩猟の掟',
      description: '対局終了時、相手との石の差に応じたボーナススコアを獲得する。',
      trigger: 'onGameEnd',
      effect: (ctx: SkillContext, uncapLevel: number) => {
        const { black, white } = countStones(ctx.board);
        const diff = Math.abs(black - white);
        ctx.scoreMultiplier += diff * 0.02 * (1 + uncapLevel * 0.5);
      },
    },
    uncapBonuses: [
      { level: 1, description: '狙撃の精度：ボーナス倍率上昇', stat: 'passiveEnhance', value: 0.5 },
      { level: 2, description: '月の加護：獲得スコア+5%', stat: 'scoreMultiplier', value: 0.05 },
      { level: 3, description: '双子矢：狙撃エリアが2行に拡大', stat: 'activeEnhance', value: 1 },
      { level: 4, description: '狩人の休息：時間ボーナス+2秒', stat: 'timeBonus', value: 2 },
      { level: 5, description: '月の覚醒：獲得スコア+15%', stat: 'scoreMultiplier', value: 0.15 },
    ],
  },
};
