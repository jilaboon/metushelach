import { GameState, GameStats, Settings } from "../types/game";
import { logEvent } from "./logger";
import savtaCardBack from "../../assets/savta-card-back.png";

const memoryStore = new Map<string, string>();

function getStorage() {
  if (typeof window === "undefined") {
    return {
      getItem: (key: string) => memoryStore.get(key) ?? null,
      setItem: (key: string, value: string) => void memoryStore.set(key, value),
      removeItem: (key: string) => void memoryStore.delete(key),
    };
  }

  return window.localStorage;
}

export const defaultSettings: Settings = {
  soundEnabled: false,
  musicEnabled: false,
  vibrationEnabled: false,
  reduceMotion: false,
  clueMode: false,
  cardTheme: "classic",
  customCardBackUri: savtaCardBack,
};

export const defaultStats: GameStats = {
  bestPiles: null,
  totalGames: 0,
  lostGames: 0,
  currentStreak: 0,
};

const KEYS = {
  game: "savta-nimrodi/game",
  stats: "savta-nimrodi/stats",
  settings: "savta-nimrodi/settings",
};

function readJson<T>(key: string, fallback: T): T {
  const raw = getStorage().getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

export function loadSettings() {
  return {
    ...defaultSettings,
    ...readJson<Partial<Settings>>(KEYS.settings, defaultSettings),
  };
}

export function saveSettings(settings: Settings) {
  getStorage().setItem(KEYS.settings, JSON.stringify(settings));
}

export function loadStats() {
  const raw = readJson<Partial<GameStats> & { perfectWins?: number }>(KEYS.stats, defaultStats);
  return {
    ...defaultStats,
    ...raw,
    lostGames: raw.lostGames ?? 0,
  };
}

export function saveStats(stats: GameStats) {
  getStorage().setItem(KEYS.stats, JSON.stringify(stats));
}

export function loadSavedGame() {
  return readJson<GameState | null>(KEYS.game, null);
}

export function saveGame(game: GameState | null) {
  if (!game) {
    getStorage().removeItem(KEYS.game);
    return;
  }

  try {
    getStorage().setItem(KEYS.game, JSON.stringify(game));
  } catch (error) {
    const compactGame: GameState = {
      ...game,
      moveHistory: [],
    };
    getStorage().setItem(KEYS.game, JSON.stringify(compactGame));
    logEvent("storage.saveGame.compacted", {
      originalHistory: game.moveHistory.length,
      reason: error instanceof Error ? error.message : String(error),
    }, "error");
  }
}
