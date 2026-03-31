import type { CharacterData } from './types';
import { CHAR_ID } from './ids';
import { BOARD_SIZE, EMPTY } from '../constants';
import { cloneBoard, forceSetStone } from '../board';

export const SSR_CHARACTERS: Record<string, CharacterData> = {
  [CHAR_ID.ZEUS]: {
    id: CHAR_ID.ZEUS,
    name: 'ゼウス',
    title: '全知全能の雷神',
    rarity: 'SSR',
    color: '#F1C40F',
    icon: '⚡',
    imageUrl: 'assets/characters/zeus.png',
    activeSkill: {
      name: 'ケラウノスの雷霆',
      description: '十字方向にある相手の石を全て自分の石に変える。',
      manaCost: 7,
      execute: (ctx) => {
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
      effect: (ctx, uncapLevel) => {
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

  [CHAR_ID.HADES]: {
    id: CHAR_ID.HADES,
    name: 'ハデス',
    title: '冥府を統べる王',
    rarity: 'SSR',
    color: '#8E44AD',
    icon: '💀',
    imageUrl: 'assets/characters/hades.png',
    activeSkill: {
      name: '隠れ兜の権能',
      description: '盤面の四隅（コーナー）のいずれかを強制的に自分の石にする。',
      manaCost: 6,
      execute: (ctx) => {
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
      effect: () => {},
    },
    uncapBonuses: [
      { level: 1, description: '常闇の猶予：時間ボーナス+2秒', stat: 'timeBonus', value: 2 },
      { level: 2, description: '魂の収穫：獲得スコア+5%', stat: 'scoreMultiplier', value: 0.05 },
      { level: 3, description: '常闇の猶予：時間ボーナス+3秒', stat: 'timeBonus', value: 3 },
      { level: 4, description: '魂の収穫：獲得スコア+10%', stat: 'scoreMultiplier', value: 0.1 },
      { level: 5, description: '冥王の覚醒：一度に2つの隅を支配する', stat: 'activeEnhance', value: 1 },
    ],
  },
};
