import type { CharacterData } from './types';
import { CHAR_ID } from './ids';
import { BOARD_SIZE, EMPTY } from '../constants';
import { cloneBoard, countStones } from '../board';

export const R_CHARACTERS: Record<string, CharacterData> = {
  [CHAR_ID.HERMES]: {
    id: CHAR_ID.HERMES,
    name: 'ヘルメス',
    title: '神々の伝令使',
    rarity: 'R',
    color: '#27AE60',
    icon: '🕊️',
    imageUrl: 'assets/characters/hermes.png',
    activeSkill: {
      name: '神速のタラリア',
      description: '盤面の外周（一番外側の列）にある相手の石を全て自分の石に変える。',
      manaCost: 4,
      execute: (ctx) => {
        const board = cloneBoard(ctx.board);
        const affected: [number, number][] = [];
        for (let i = 0; i < BOARD_SIZE; i++) {
          if (board[0][i] === ctx.opponentPlayer) { board[0][i] = ctx.currentPlayer; affected.push([0, i]); }
          if (board[BOARD_SIZE-1][i] === ctx.opponentPlayer) { board[BOARD_SIZE-1][i] = ctx.currentPlayer; affected.push([BOARD_SIZE-1, i]); }
          if (board[i][0] === ctx.opponentPlayer) { board[i][0] = ctx.currentPlayer; affected.push([i, 0]); }
          if (board[i][BOARD_SIZE-1] === ctx.opponentPlayer) { board[i][BOARD_SIZE-1] = ctx.currentPlayer; affected.push([i, BOARD_SIZE-1]); }
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
      effect: (ctx, uncapLevel) => {
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

  [CHAR_ID.ARTEMIS]: {
    id: CHAR_ID.ARTEMIS,
    name: 'アルテミス',
    title: '純潔なる月の女神',
    rarity: 'R',
    color: '#34495E',
    icon: '🏹',
    imageUrl: 'assets/characters/artemis.png',
    activeSkill: {
      name: '月光の狙撃',
      description: '相手の石が最も多い一列（行）を、全て空きマスに戻す。',
      manaCost: 5,
      execute: (ctx) => {
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
      effect: (ctx, uncapLevel) => {
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
