export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export type Card = {
  id: string;
  suit: Suit;
  rank: Rank;
};

export type Pile = {
  id: string;
  cards: Card[];
};

export type MoveRecord =
  | {
      type: "deal";
      previous: GameState;
    }
  | {
      type: "move";
      previous: GameState;
    };

export type GameStatus = "idle" | "playing" | "won" | "finished";

export type GameState = {
  seed: string;
  deck: Card[];
  piles: Pile[];
  moveHistory: MoveRecord[];
  startedAt: number;
  finishedAt?: number;
  status: GameStatus;
};

export type GameStats = {
  bestPiles: number | null;
  totalGames: number;
  perfectWins: number;
  currentStreak: number;
};

export type Settings = {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  reduceMotion: boolean;
  clueMode: boolean;
  cardTheme: "classic" | "ivory";
  customCardBackUri?: string | null;
};

export type ValidMove = {
  fromIndex: number;
  toIndex: number;
  distance: 1 | 3;
};
