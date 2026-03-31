export const CHAR_ID = {
  ZEUS: 'god_zeus',
  HADES: 'god_hades',
  ARES: 'god_ares',
  ATHENA: 'god_athena',
  HERMES: 'god_hermes',
  ARTEMIS: 'god_artemis',
} as const;

export type CharacterId = typeof CHAR_ID[keyof typeof CHAR_ID];
