import { createDeck, shuffleDeck } from "./cards";
import { Card, GameState, Pile, ValidMove } from "../types/game";

function cloneState(state: GameState): GameState {
  const snapshot = JSON.parse(JSON.stringify(state)) as GameState;
  snapshot.moveHistory = [];
  return snapshot;
}

function pileTopCard(pile: Pile): Card {
  return pile.cards[pile.cards.length - 1];
}

function cardsMatch(first: Card, second: Card) {
  return first.rank === second.rank || first.suit === second.suit;
}

export function createNewGame(seed = `${Date.now()}`): GameState {
  return {
    seed,
    deck: shuffleDeck(createDeck(seed), seed),
    piles: [],
    moveHistory: [],
    startedAt: Date.now(),
    status: "playing",
  };
}

export function canMove(piles: Pile[], fromPileIndex: number, toPileIndex: number) {
  if (fromPileIndex <= toPileIndex) {
    return false;
  }

  const distance = fromPileIndex - toPileIndex;
  if (distance !== 1 && distance !== 3) {
    return false;
  }

  const fromPile = piles[fromPileIndex];
  const toPile = piles[toPileIndex];

  if (!fromPile || !toPile) {
    return false;
  }

  return cardsMatch(pileTopCard(fromPile), pileTopCard(toPile));
}

export function getValidMoves(piles: Pile[], fromPileIndex?: number): ValidMove[] {
  if (piles.length < 2) {
    return [];
  }

  const fromIndexes =
    typeof fromPileIndex === "number"
      ? [fromPileIndex]
      : piles.map((_, index) => index).filter((index) => index > 0);

  return fromIndexes.flatMap((fromIndex) =>
    [1, 3]
      .map((distance) => ({ toIndex: fromIndex - distance, distance }))
      .filter(({ toIndex }) => toIndex >= 0)
      .filter(({ toIndex }) => canMove(piles, fromIndex, toIndex))
      .map(({ toIndex, distance }) => ({
        fromIndex,
        toIndex,
        distance: distance as 1 | 3,
      })),
  );
}

export function dealNextCard(state: GameState): GameState {
  if (state.deck.length === 0 || state.status !== "playing") {
    return state;
  }

  const previous = cloneState(state);
  const [nextCard, ...remainingDeck] = state.deck;
  const nextPile: Pile = {
    id: `${nextCard.id}-pile`,
    cards: [nextCard],
  };

  const nextState: GameState = {
    ...state,
    deck: remainingDeck,
    piles: [...state.piles, nextPile],
    moveHistory: [...state.moveHistory, { type: "deal", previous }],
  };

  return finalizeIfFinished(nextState);
}

export function movePile(state: GameState, fromPileIndex: number, toPileIndex: number): GameState {
  if (!canMove(state.piles, fromPileIndex, toPileIndex) || state.status !== "playing") {
    return state;
  }

  const previous = cloneState(state);
  const piles = [...state.piles];
  const movingPile = piles[fromPileIndex];
  const targetPile = piles[toPileIndex];
  const mergedPile: Pile = {
    ...targetPile,
    cards: [...targetPile.cards, ...movingPile.cards],
  };

  piles[toPileIndex] = mergedPile;
  piles.splice(fromPileIndex, 1);

  return finalizeIfFinished({
    ...state,
    piles,
    moveHistory: [...state.moveHistory, { type: "move", previous }],
  });
}

export function undoMove(state: GameState): GameState {
  const lastMove = state.moveHistory[state.moveHistory.length - 1];
  if (!lastMove) {
    return state;
  }

  return {
    ...lastMove.previous,
    moveHistory: state.moveHistory.slice(0, -1),
  };
}

export function isGameOver(state: GameState) {
  return state.deck.length === 0 && getValidMoves(state.piles).length === 0;
}

export function getScore(state: Pick<GameState, "piles">) {
  return state.piles.length;
}

export function getPerformanceTier(score: number) {
  if (score === 1) {
    return "מושלם";
  }
  if (score <= 5) {
    return "נהדר";
  }
  if (score <= 10) {
    return "יפה מאוד";
  }
  if (score <= 15) {
    return "לא רע בכלל";
  }
  return "עוד סיבוב קטן";
}

export function finishGame(state: GameState): GameState {
  if (state.status !== "playing") {
    return state;
  }

  return {
    ...state,
    status: state.piles.length === 1 ? "won" : "finished",
    finishedAt: Date.now(),
  };
}

export function finalizeIfFinished(state: GameState): GameState {
  if (!isGameOver(state)) {
    return state;
  }

  return finishGame(state);
}
