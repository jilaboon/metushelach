import { Card, Rank, Suit } from "../types/game";

export const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
export const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

export const SUIT_COLORS: Record<Suit, string> = {
  spades: "#1E1711",
  clubs: "#1E1711",
  hearts: "#9F2C2C",
  diamonds: "#B24832",
};

export function createDeck(seed: string): Card[] {
  return SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({
      id: `${seed}-${suit}-${rank}`,
      suit,
      rank,
    })),
  );
}

function mulberry32(seedNumber: number) {
  return function () {
    let t = (seedNumber += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(seed: string) {
  return seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 1777);
}

export function shuffleDeck(deck: Card[], seed: string) {
  const random = mulberry32(hashSeed(seed));
  const copy = [...deck];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swapIndex];
    copy[swapIndex] = current;
  }

  return copy;
}

export function cardLabel(card: Card) {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}
