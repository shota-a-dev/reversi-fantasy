// ─── ゲーム定数 ─────────────────────────────────────
export const BOARD_SIZE = 8;
export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;
export const TURN_TIME_LIMIT = 15; // 秒

// 方向ベクトル（8方向）
export const DIRECTIONS: readonly [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
] as const;

// スキル関連
export const MAX_ACTIVE_SKILL_USES = 1; // 1対局あたりのアクティブスキル使用回数

// 凸レベル
export const MAX_UNCAP_LEVEL = 5;

// ガチャ
export const GACHA_COST = 100; // ゲーム内通貨
export const GACHA_RATES: Record<string, number> = {
  SSR: 0.03,
  SR: 0.12,
  R: 0.85,
};

// キャラクターID
export const CHARACTER_IDS = [
  'alfred',
  'luna',
  'drake',
  'mira',
  'zephyr',
  'noir',
] as const;

export type CharacterId = typeof CHARACTER_IDS[number];
export type CellState = typeof EMPTY | typeof BLACK | typeof WHITE;
export type Board = CellState[][];
