export type DebugLevel = "info" | "warn" | "error";

export interface DebugEntry {
  id: number;
  time: string;
  level: DebugLevel;
  message: string;
}

let counter = 0;
const entries: DebugEntry[] = [];
const listeners = new Set<(entries: DebugEntry[]) => void>();

function emit() {
  const snapshot = [...entries];
  listeners.forEach((l) => l(snapshot));
}

export function dlog(level: DebugLevel, message: string, detail?: unknown) {
  const time = new Date().toISOString().slice(11, 23);
  let text = message;
  if (detail !== undefined) {
    if (detail instanceof Error) {
      const code = (detail as { code?: string }).code;
      text += ` — ${code ? `[${code}] ` : ""}${detail.message}`;
    } else if (typeof detail === "object") {
      try {
        text += ` — ${JSON.stringify(detail)}`;
      } catch {
        text += ` — ${String(detail)}`;
      }
    } else {
      text += ` — ${String(detail)}`;
    }
  }

  const entry: DebugEntry = { id: ++counter, time, level, message: text };
  entries.push(entry);
  if (entries.length > 200) entries.shift();

  const consoleFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  consoleFn(`[chores ${level}] ${time} ${text}`);

  emit();
}

export function subscribeDebug(listener: (entries: DebugEntry[]) => void): () => void {
  listeners.add(listener);
  listener([...entries]);
  return () => listeners.delete(listener);
}

export function clearDebug() {
  entries.length = 0;
  emit();
}
