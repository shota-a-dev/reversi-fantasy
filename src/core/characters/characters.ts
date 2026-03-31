import { CHAR_ID } from './ids';
import type { CharacterData, Rarity } from './types';
import { SSR_CHARACTERS } from './ssr';
import { SR_CHARACTERS } from './sr';
import { R_CHARACTERS } from './r';

export * from './types';
export * from './ids';

export const CHARACTERS: Record<string, CharacterData> = {
  ...SSR_CHARACTERS,
  ...SR_CHARACTERS,
  ...R_CHARACTERS,
};

export function getCharacter(id: string): CharacterData {
  return CHARACTERS[id] || CHARACTERS[CHAR_ID.ZEUS];
}

export function getCharactersByRarity(rarity: Rarity): CharacterData[] {
  return Object.values(CHARACTERS).filter(c => c.rarity === rarity);
}
