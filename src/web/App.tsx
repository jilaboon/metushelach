import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { he } from "../localization/he";
import { useAppModel } from "../hooks/useAppModel";
import { clearLogs, getLogs, installGlobalErrorLogging, logEvent } from "../services/logger";
import savtaCardBack from "../../assets/savta-card-back.png";

function CardFace({ rank, suit }: { rank: string; suit: string }) {
  const isRed = suit === "♥" || suit === "♦";
  return (
    <div className={`card-face ${isRed ? "red" : ""}`}>
      <div className="card-corner">
        <span>{rank}</span>
        <span>{suit}</span>
      </div>
      <div className="card-center">{suit}</div>
    </div>
  );
}

function CardBack() {
  return (
    <div className="card-back">
      <div className="card-back__portrait">
        <img src={savtaCardBack} alt="סבתא נמרודי" />
      </div>
    </div>
  );
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className="premium-button" {...props} />;
}

function LogDrawer() {
  const [open, setOpen] = useState(false);
  const logs = getLogs();

  return (
    <>
      <button className="log-fab" onClick={() => setOpen((value) => !value)} type="button">
        לוג
      </button>
      {open ? (
        <aside className="log-drawer">
          <div className="log-drawer__header">
            <strong>לוג קריסות</strong>
            <button onClick={() => clearLogs()} type="button">
              נקה
            </button>
          </div>
          <div className="log-drawer__body">
            {logs.length === 0 ? <p>אין אירועים שמורים.</p> : null}
            {logs.map((entry) => (
              <article className="log-entry" key={entry.id}>
                <strong>{entry.event}</strong>
                <span>{new Date(entry.ts).toLocaleString("he-IL")}</span>
                <pre>{JSON.stringify(entry.details ?? {}, null, 2)}</pre>
              </article>
            ))}
          </div>
        </aside>
      ) : null}
    </>
  );
}

function Home({ model }: { model: ReturnType<typeof useAppModel> }) {
  return (
    <section className="screen screen-home">
      <div className="home-hero">
        <div className="hero hero--home">
          <p className="eyebrow">{he.titleSubtitle}</p>
          <h1>{he.appName}</h1>
          <p className="hero-copy">קלפים, זיכרון קטן מהבית, ורגע שקט של מחשבה.</p>
        </div>
        <div className="home-portrait" aria-hidden="true">
          <div className="home-portrait__frame">
            <img src={savtaCardBack} alt="סבתא נמרודי" />
          </div>
        </div>
      </div>
      <div className="home-actions">
        <Button onClick={model.startNewGame}>{he.newGame}</Button>
        <Button onClick={model.continueGame} disabled={!model.currentGame}>
          {model.currentGame ? he.continueGame : he.noSavedGame}
        </Button>
        <Button onClick={() => model.setScreen("settings")}>{he.settings}</Button>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <span>{he.bestResult}</span>
          <strong>{model.stats.bestPiles ?? "—"}</strong>
        </div>
        <div className="stat-card">
          <span>{he.totalGames}</span>
          <strong>{model.stats.totalGames}</strong>
        </div>
        <div className="stat-card">
          <span>{he.lostGames}</span>
          <strong>{model.stats.lostGames}</strong>
        </div>
      </div>
    </section>
  );
}

function Settings({ model }: { model: ReturnType<typeof useAppModel> }) {
  const toggles = [
    ["soundEnabled", he.sound],
    ["musicEnabled", he.music],
    ["vibrationEnabled", he.vibration],
    ["reduceMotion", he.reduceMotion],
    ["clueMode", he.clueMode],
  ] as const;

  return (
    <section className="screen">
      <div className="settings-shell">
        <h2>{he.settings}</h2>
        {toggles.map(([key, label]) => (
          <label className="toggle-row" key={key}>
            <span>{label}</span>
            <input
              type="checkbox"
              checked={Boolean(model.settings[key])}
              onChange={(event) => model.updateSetting(key, event.target.checked as never)}
            />
          </label>
        ))}
        <div className="how-to">
          <h3>{he.howToPlay}</h3>
          <p>{he.howLine1}</p>
          <p>{he.howLine2}</p>
          <p>{he.howLine3}</p>
          <p>{he.howLine4}</p>
        </div>
        <Button onClick={() => model.setScreen("home")}>{he.home}</Button>
      </div>
    </section>
  );
}

function Results({ model }: { model: ReturnType<typeof useAppModel> }) {
  if (!model.currentGame || model.currentGame.status === "playing") {
    return null;
  }

  async function onShare() {
    const pilesLeft = model.currentGame?.piles.length ?? 0;
    const baseMessage = `בדאלקום! שיחקתי ב"המשחק של סבתא נמרודי" ונשארתי עם ${pilesLeft} ערימות ♠️♥️♣️♦️\nנראה אותך עוברת את זה`;
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareText = shareUrl ? `${baseMessage}\n${shareUrl}` : baseMessage;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: he.appName,
          text: shareText,
        });
        return;
      }
    } catch {
      return;
    }

    if (typeof window !== "undefined") {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="results-modal">
      <div className="results-card">
        <h2>{model.currentGame.status === "won" ? he.won : model.currentGame.status === "lost" ? he.lost : he.finished}</h2>
        <p>{model.currentGame.status === "lost" ? he.tryAgain : model.performanceTier}</p>
        <strong>נשארו {model.currentGame.piles.length} ערימות</strong>
        <div className="results-actions">
          <Button onClick={onShare}>{he.shareResult}</Button>
          <Button onClick={model.restartGame}>{he.replay}</Button>
          <Button
            onClick={() => {
              model.clearFinishedGame();
              model.setScreen("home");
            }}
          >
            {he.home}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Game({ model }: { model: ReturnType<typeof useAppModel> }) {
  const game = model.currentGame!;
  const [selectedPileIndex, setSelectedPileIndex] = useState<number | null>(null);
  const [pendingMove, setPendingMove] = useState<{ fromIndex: number; toIndex: number } | null>(null);
  const [recentPileId, setRecentPileId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const moveTimerRef = useRef<number | null>(null);
  const recentTimerRef = useRef<number | null>(null);
  const boardShellRef = useRef<HTMLDivElement | null>(null);
  const selectedMoves = useMemo(
    () => model.validMoves.filter((move) => move.fromIndex === selectedPileIndex),
    [model.validMoves, selectedPileIndex],
  );
  const validTargets = new Set(model.settings.clueMode ? selectedMoves.map((move) => move.toIndex) : []);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!model.moveDeadline || game.status !== "playing" || model.paused) {
      setTimeLeft(null);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((model.moveDeadline! - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [game.status, model.moveDeadline, model.paused]);

  useEffect(() => {
    const lastMove = game.moveHistory[game.moveHistory.length - 1];
    if (lastMove?.type !== "deal") {
      return;
    }

    const newestPile = game.piles[game.piles.length - 1];
    if (!newestPile) {
      return;
    }

    setRecentPileId(newestPile.id);
    if (recentTimerRef.current) {
      window.clearTimeout(recentTimerRef.current);
    }
    recentTimerRef.current = window.setTimeout(() => {
      setRecentPileId(null);
      recentTimerRef.current = null;
    }, model.settings.reduceMotion ? 80 : 420);

    const board = boardShellRef.current;
    if (board) {
      board.scrollTo({
        left: board.scrollWidth,
        behavior: model.settings.reduceMotion ? "auto" : "smooth",
      });
    }
  }, [game.moveHistory, game.piles, model.settings.reduceMotion]);

  useEffect(() => {
    return () => {
      if (moveTimerRef.current) {
        window.clearTimeout(moveTimerRef.current);
      }
      if (recentTimerRef.current) {
        window.clearTimeout(recentTimerRef.current);
      }
    };
  }, []);

  function onPileClick(index: number) {
    if (pendingMove || model.paused) {
      return;
    }
    if (selectedPileIndex === null) {
      setSelectedPileIndex(index);
      return;
    }
    if (selectedPileIndex === index) {
      setSelectedPileIndex(null);
      return;
    }
    const move = selectedMoves.find((item) => item.toIndex === index);
    if (!move) {
      setSelectedPileIndex(index);
      logEvent("ui.select.switch", { selectedPileIndex: index });
      return;
    }

    if (moveTimerRef.current) {
      window.clearTimeout(moveTimerRef.current);
    }

    setPendingMove({ fromIndex: move.fromIndex, toIndex: move.toIndex });
    moveTimerRef.current = window.setTimeout(() => {
      model.onMove(move.fromIndex, move.toIndex);
      setPendingMove(null);
      setSelectedPileIndex(null);
      moveTimerRef.current = null;
    }, model.settings.reduceMotion ? 40 : 240);
  }

  return (
    <section className="screen screen-game">
      <header className="game-topbar">
        <div className="topbar-stats">
          <div className="metric compact">
            <strong>{game.deck.length}</strong>
            <span>{he.remainingDeck}</span>
          </div>
          <div className="metric compact">
            <strong>{game.piles.length}</strong>
            <span>{he.pilesLeft}</span>
          </div>
          <div className={`metric compact timer ${timeLeft !== null && timeLeft <= 5 ? "danger" : ""}`}>
            <strong>{timeLeft ?? "—"}</strong>
            <span>{he.timerLabel}</span>
          </div>
        </div>
        <div className="header-center">
          <h1>{he.appName}</h1>
        </div>
        <button className="escape-button" onClick={() => model.setScreen("home")} type="button">
          {he.exitGame}
        </button>
      </header>

      <div className="landscape-shell">
        <main className="table-stage">
          <div className="table-meta">
            <div>
              <span className="table-label">{he.boardTitle}</span>
              <strong>{selectedPileIndex === null ? he.selectRightmost : he.chooseDestination}</strong>
            </div>
            <div className="utility-buttons">
              <button
                className={`mini-button ${model.paused ? "active" : ""}`}
                onClick={model.togglePause}
                type="button"
              >
                {model.paused ? he.resumeGame : he.pause}
              </button>
              <button className="mini-button" onClick={() => setHelpOpen(true)} type="button">
                {he.quickHelp}
              </button>
              <button
                className={`mini-button ${model.settings.clueMode ? "active" : ""}`}
                onClick={() => model.updateSetting("clueMode", !model.settings.clueMode)}
                type="button"
              >
                {he.clueMode}
              </button>
              <button className="mini-button" onClick={() => model.setScreen("settings")} type="button">
                {he.quickSettings}
              </button>
            </div>
          </div>

          <div className="board-shell" ref={boardShellRef}>
            <div className="piles-row">
              {game.piles.map((pile, index) => {
                const top = pile.cards[pile.cards.length - 1];
                const suitMap = { hearts: "♥", diamonds: "♦", clubs: "♣", spades: "♠" } as const;
                const moving =
                  pendingMove?.fromIndex === index
                    ? ({
                        "--move-x": `${-(pendingMove.fromIndex - pendingMove.toIndex) * 96}px`,
                      } as CSSProperties)
                    : undefined;
                return (
                  <button
                    key={pile.id}
                    className={`pile ${selectedPileIndex === index ? "selected" : ""} ${validTargets.has(index) ? "valid" : ""} ${recentPileId === pile.id ? "pile-enter" : ""} ${pendingMove?.fromIndex === index ? "pile-moving" : ""}`}
                    onClick={() => onPileClick(index)}
                    type="button"
                    style={moving}
                    disabled={model.paused}
                  >
                    <div className="pile-stack">
                      <div className="pile-card">
                        <CardFace rank={top.rank} suit={suitMap[top.suit]} />
                      </div>
                      {pile.cards.length > 1 ? <span className="pile-count">×{pile.cards.length}</span> : null}
                    </div>
                    <span className="pile-index">{top.rank + suitMap[top.suit]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {model.paused ? (
            <div className="pause-cover">
              <strong>{he.pauseCover}</strong>
              <button className="premium-button pause-cover__button" onClick={model.togglePause} type="button">
                {he.resumeGame}
              </button>
            </div>
          ) : null}
        </main>

        <aside className="control-rail">
          <button
            className="deck-button"
            onClick={model.onDealCard}
            disabled={model.paused || game.deck.length === 0 || game.status !== "playing"}
          >
            <CardBack />
            <div className="deck-copy">
              <strong>{game.deck.length}</strong>
              <span>{he.remainingDeck}</span>
              <em>{he.deckAction}</em>
            </div>
          </button>
          <div className="rail-stats">
            <div className="rail-stat">
              <span>{he.remainingDeck}</span>
              <strong>{game.deck.length}</strong>
            </div>
            <div className="rail-stat">
              <span>{he.pilesLeft}</span>
              <strong>{game.piles.length}</strong>
            </div>
          </div>
          <div className="sidebar-actions">
            <Button onClick={model.onUndo} disabled={model.paused}>{he.undo}</Button>
            <Button onClick={model.restartGame} disabled={model.paused}>{he.restart}</Button>
          </div>
        </aside>
      </div>

      {helpOpen ? (
        <div className="results-modal">
          <div className="results-card help-card">
            <h2>{he.howToPlay}</h2>
            <p>{he.howLine1}</p>
            <p>{he.howLine2}</p>
            <p>{he.howLine3}</p>
            <p>{he.howLine4}</p>
            <Button onClick={() => setHelpOpen(false)}>{he.close}</Button>
          </div>
        </div>
      ) : null}
      <Results model={model} />
    </section>
  );
}

export function App() {
  const model = useAppModel();

  useEffect(() => {
    const uninstall = installGlobalErrorLogging();
    return uninstall;
  }, []);

  return (
    <div className="app-shell">
      <LogDrawer />
      <div className="orientation-guard">
        <div className="orientation-card">
          <strong>{he.rotateLandscape}</strong>
        </div>
      </div>
      {model.screen === "splash" ? (
        <section className="screen splash">
          <div className="splash-mark" />
          <h1>{he.appName}</h1>
          <p>{he.titleSubtitle}</p>
        </section>
      ) : null}
      {model.screen === "home" ? <Home model={model} /> : null}
      {model.screen === "settings" ? <Settings model={model} /> : null}
      {model.screen === "game" && model.currentGame ? <Game model={model} /> : null}
    </div>
  );
}
