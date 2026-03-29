import type { CharacterId } from '../core/constants';
import { MAX_UNCAP_LEVEL, CHARACTER_IDS } from '../core/constants';

// ─── 型定義 ─────
export interface PlayerData {
  characters: Record<CharacterId, CharacterState>;
  selectedLeader: CharacterId;
  currency: number;
  totalGames: number;
  totalWins: number;
  settings: GameSettings;
}

export interface CharacterState {
  owned: boolean;
  uncapLevel: number;
}

export interface GameSettings {
  bgmVolume: number;
  sfxVolume: number;
  colorBlindMode: boolean;
  aiDifficulty: number;
}

const STORAGE_KEY = 'reversi-fantasy-data';

// ─── デフォルト状態 ─────
function createDefaultData(): PlayerData {
  const characters = {} as Record<CharacterId, CharacterState>;
  for (const id of CHARACTER_IDS) {
    characters[id] = { owned: false, uncapLevel: 0 };
  }
  // 初期キャラとしてヘルメスのみを所持
  characters.zephyr = { owned: true, uncapLevel: 0 };

  return {
    characters,
    selectedLeader: 'zephyr',
    currency: 500,
    totalGames: 0,
    totalWins: 0,
    settings: {
      bgmVolume: 0.5,
      sfxVolume: 0.7,
      colorBlindMode: false,
      aiDifficulty: 2,
    },
  };
}

// ─── ストアクラス ─────
class Store {
  private data: PlayerData;
  private listeners: Set<(data: PlayerData) => void> = new Set();

  constructor() {
    this.data = this.load();
  }

  private load(): PlayerData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // マイグレーション: 新キャラが追加された場合
        const defaults = createDefaultData();
        for (const id of CHARACTER_IDS) {
          if (!parsed.characters[id]) {
            parsed.characters[id] = defaults.characters[id];
          }
        }
        return { ...defaults, ...parsed };
      }
    } catch (e) {
      console.warn('Store load failed:', e);
    }
    return createDefaultData();
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Store save failed:', e);
    }
    this.notify();
  }

  private notify(): void {
    for (const cb of this.listeners) {
      cb(this.getData());
    }
  }

  subscribe(callback: (data: PlayerData) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getData(): PlayerData {
    return JSON.parse(JSON.stringify(this.data));
  }

  getCharacter(id: CharacterId): CharacterState {
    return { ...this.data.characters[id] };
  }

  getLeader(): CharacterId {
    return this.data.selectedLeader;
  }

  setLeader(id: CharacterId): void {
    if (this.data.characters[id].owned) {
      this.data.selectedLeader = id;
      this.save();
    }
  }

  getOwnedCharacters(): CharacterId[] {
    return CHARACTER_IDS.filter(id => this.data.characters[id].owned);
  }

  // ガチャ結果を反映
  addCharacter(id: CharacterId): { isNew: boolean; uncapLevel: number } {
    const char = this.data.characters[id];
    if (char.owned) {
      // 凸
      const newLevel = Math.min(char.uncapLevel + 1, MAX_UNCAP_LEVEL);
      char.uncapLevel = newLevel;
      this.save();
      return { isNew: false, uncapLevel: newLevel };
    } else {
      char.owned = true;
      char.uncapLevel = 0;
      this.save();
      return { isNew: true, uncapLevel: 0 };
    }
  }

  getCurrency(): number {
    return this.data.currency;
  }

  addCurrency(amount: number): void {
    this.data.currency += amount;
    this.save();
  }

  spendCurrency(amount: number): boolean {
    if (this.data.currency < amount) return false;
    this.data.currency -= amount;
    this.save();
    return true;
  }

  recordGame(won: boolean): void {
    this.data.totalGames++;
    if (won) this.data.totalWins++;
    this.save();
  }

  getSettings(): GameSettings {
    return { ...this.data.settings };
  }

  updateSettings(partial: Partial<GameSettings>): void {
    this.data.settings = { ...this.data.settings, ...partial };
    this.save();
  }

  // デバッグ用リセット
  reset(): void {
    this.data = createDefaultData();
    this.save();
  }
}

export const store = new Store();
