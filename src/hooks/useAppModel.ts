import { useEffect, useMemo, useRef, useState } from "react";
import {
  createNewGame,
  dealNextCard,
  finishGame,
  finalizeIfFinished,
  getPerformanceTier,
  getScore,
  getValidMoves,
  movePile,
  undoMove,
} from "../game/engine";
import { triggerInvalidFeedback, triggerMergeFeedback, triggerPerfectFeedback, triggerTapFeedback } from "../services/feedback";
import { logEvent } from "../services/logger";
import {
  defaultSettings,
  defaultStats,
  loadSavedGame,
  loadSettings,
  loadStats,
  saveGame,
  saveSettings,
  saveStats,
} from "../services/storage";
import { GameState, GameStats, Settings } from "../types/game";

export type AppScreen = "splash" | "home" | "game" | "settings";

export function useAppModel() {
  const [screen, setScreen] = useState<AppScreen>("splash");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [stats, setStats] = useState<GameStats>(defaultStats);
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);
  const [moveDeadline, setMoveDeadline] = useState<number | null>(null);
  const lastTrackedFinishRef = useRef<number | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
    setStats(loadStats());
    const game = loadSavedGame();
    setCurrentGame(game ? finalizeIfFinished(game) : null);
    logEvent("app.bootstrap", {
      hasSavedGame: Boolean(game),
    });

    const timer = window.setTimeout(() => setScreen("home"), 900);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => saveStats(stats), [stats]);
  useEffect(() => saveGame(currentGame), [currentGame]);

  useEffect(() => {
    if (!currentGame || currentGame.status === "playing" || !currentGame.finishedAt) {
      return;
    }
    if (lastTrackedFinishRef.current === currentGame.finishedAt) {
      return;
    }
    lastTrackedFinishRef.current = currentGame.finishedAt;
    void maybeTrackCompletion(currentGame);
  }, [currentGame]);

  const validMoves = useMemo(() => (currentGame ? getValidMoves(currentGame.piles) : []), [currentGame]);

  useEffect(() => {
    if (!currentGame || currentGame.status !== "playing") {
      setMoveDeadline(null);
      return;
    }

    if (validMoves.length === 0 && currentGame.deck.length === 0) {
      setMoveDeadline(null);
      const finished = finishGame(currentGame);
      setCurrentGame(finished);
      logEvent("game.finish.no_moves", {
        deckRemaining: currentGame.deck.length,
        piles: currentGame.piles.length,
      });
      return;
    }

    const deadline = Date.now() + 20000;
    setMoveDeadline(deadline);
    const timeout = window.setTimeout(() => {
      setCurrentGame((previous) => {
        if (!previous || previous.status !== "playing") {
          return previous;
        }
        const finished = finishGame(previous, "lost");
        logEvent("game.finish.timer_expired", {
          deckRemaining: previous.deck.length,
          piles: previous.piles.length,
        }, "error");
        return finished;
      });
    }, 20000);

    return () => window.clearTimeout(timeout);
  }, [currentGame, validMoves]);

  async function startNewGame() {
    const game = createNewGame();
    lastTrackedFinishRef.current = null;
    setCurrentGame(game);
    setScreen("game");
    logEvent("game.start", { seed: game.seed });
    setStats((previous) => ({ ...previous, totalGames: previous.totalGames + 1 }));
    await triggerTapFeedback(settings);
  }

  function continueGame() {
    if (currentGame) {
      setScreen("game");
    }
  }

  async function onDealCard() {
    if (!currentGame) {
      return;
    }
    const next = dealNextCard(currentGame);
    setCurrentGame(next);
    logEvent("game.deal", {
      deckRemaining: next.deck.length,
      piles: next.piles.length,
      topCards: next.piles.map((pile) => pile.cards[pile.cards.length - 1]?.id),
    });
    await triggerTapFeedback(settings);
    await maybeTrackCompletion(next);
  }

  async function onMove(fromIndex: number, toIndex: number) {
    if (!currentGame) {
      return;
    }
    const next = movePile(currentGame, fromIndex, toIndex);
    if (next === currentGame) {
      logEvent("game.move.invalid", { fromIndex, toIndex, piles: currentGame.piles.length }, "error");
      await triggerInvalidFeedback(settings);
      return;
    }
    setCurrentGame(next);
    logEvent("game.move", {
      fromIndex,
      toIndex,
      piles: next.piles.length,
      deckRemaining: next.deck.length,
    });
    await triggerMergeFeedback(settings);
    await maybeTrackCompletion(next);
  }

  async function onUndo() {
    if (!currentGame || currentGame.moveHistory.length === 0) {
      logEvent("game.undo.invalid", undefined, "error");
      await triggerInvalidFeedback(settings);
      return;
    }
    setCurrentGame(undoMove(currentGame));
    logEvent("game.undo", { remainingHistory: currentGame.moveHistory.length - 1 });
    await triggerTapFeedback(settings);
  }

  async function restartGame() {
    const next = createNewGame(`${Date.now()}`);
    lastTrackedFinishRef.current = null;
    setCurrentGame(next);
    logEvent("game.restart", { seed: next.seed });
    setStats((previous) => ({ ...previous, totalGames: previous.totalGames + 1 }));
    await triggerTapFeedback(settings);
  }

  async function maybeTrackCompletion(game: GameState) {
    if (game.status === "playing") {
      return;
    }
    const score = getScore(game);
    setStats((previous) => ({
      bestPiles: previous.bestPiles === null ? score : Math.min(previous.bestPiles, score),
      totalGames: previous.totalGames,
      perfectWins: previous.perfectWins + (score === 1 ? 1 : 0),
      currentStreak: score <= 5 ? previous.currentStreak + 1 : 0,
    }));
    if (score === 1) {
      await triggerPerfectFeedback(settings);
    }
    logEvent("game.complete", {
      score,
      status: game.status,
      piles: game.piles.length,
    });
  }

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((previous) => ({ ...previous, [key]: value }));
  }

  function clearFinishedGame() {
    if (currentGame?.status !== "playing") {
      lastTrackedFinishRef.current = null;
      setCurrentGame(null);
    }
  }

  return {
    screen,
    setScreen,
    settings,
    stats,
    currentGame,
    validMoves,
    performanceTier: currentGame ? getPerformanceTier(getScore(currentGame)) : null,
    startNewGame,
    continueGame,
    onDealCard,
    onMove,
    onUndo,
    restartGame,
    updateSetting,
    clearFinishedGame,
    moveDeadline,
  };
}
