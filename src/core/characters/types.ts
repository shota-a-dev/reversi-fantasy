import type { Board, CellState } from '../constants';

export type Rarity = 'SSR' | 'SR' | 'R';

export interface CharacterData {
  id: string;
  name: string;
  title: string;
  rarity: Rarity;
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
  manaCost: number;      // スキル使用に必要なマナ
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
  mana: number;           // 現在のマナ
}

export interface SkillResult {
  board: Board;
  message: string;
  affectedCells: [number, number][];
  bonusTime?: number;
  bonusScore?: number;
}
