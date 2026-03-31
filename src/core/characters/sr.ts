import type { CharacterData } from './types';
import { CHAR_ID } from './ids';
import { BOARD_SIZE } from '../constants';
import { cloneBoard } from '../board';

export const SR_CHARACTERS: Record<string, CharacterData> = {
  [CHAR_ID.ARES]: {
    id: CHAR_ID.ARES,
    name: 'アレス',
    title: '戦場を駆ける荒神',
    rarity: 'SR',
    color: '#C0392B',
    icon: '🔥',
    imageUrl: 'assets/characters/ares.png',
    activeSkill: {
      name: 'ゴッド・オブ・ウォー',
      description: 'ランダムな3×3マスの範囲にある相手の石を全て自分の石に変える。',
      manaCost: 5,
      execute: (ctx) => {
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
      effect: (ctx, uncapLevel) => {
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

  [CHAR_ID.ATHENA]: {
    id: CHAR_ID.ATHENA,
    name: 'アテナ',
    title: '勝利と知恵の女神',
    rarity: 'SR',
    color: '#2980B9',
    icon: '🛡️',
    imageUrl: 'assets/characters/athena.png',
    activeSkill: {
      name: 'アイギスの啓示',
      description: '相手の次の合法手を最大3手までハイライト表示する。',
      manaCost: 4,
      execute: (ctx) => {
        // 注: getValidMovesは循環参照を防ぐため、実行時に渡されるか、他から取得する必要がある
        // ここではメッセージのみ返すが、UI側でhighlight処理を行う
        return {
          board: cloneBoard(ctx.board),
          message: `アテナの啓示！アイギスが未来の攻防を映し出す！`,
          affectedCells: [], // UI側でGameManagerから取得
        };
      },
    },
    passiveSkill: {
      name: '神託の知略',
      description: '対局開始時、制限時間が延長される。',
      trigger: 'onGameStart',
      effect: (ctx, uncapLevel) => {
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
};
