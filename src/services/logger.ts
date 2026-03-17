type LogEntry = {
  id: string;
  ts: number;
  level: "info" | "error";
  event: string;
  details?: unknown;
};

const KEY = "savta-nimrodi/logs";
const LIMIT = 80;

function readLogs(): LogEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as LogEntry[]) : [];
}

function writeLogs(entries: LogEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(KEY, JSON.stringify(entries.slice(-LIMIT)));
}

export function logEvent(event: string, details?: unknown, level: LogEntry["level"] = "info") {
  const next: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    level,
    event,
    details,
  };
  writeLogs([...readLogs(), next]);
}

export function getLogs() {
  return readLogs().slice().reverse();
}

export function clearLogs() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(KEY);
}

export function installGlobalErrorLogging() {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onError = (event: ErrorEvent) => {
    logEvent("window.error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack ?? null,
    }, "error");
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    logEvent("window.unhandledrejection", {
      reason:
        event.reason instanceof Error
          ? { message: event.reason.message, stack: event.reason.stack }
          : event.reason,
    }, "error");
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
