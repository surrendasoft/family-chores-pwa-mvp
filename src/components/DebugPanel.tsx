import { useEffect, useState } from "react";
import { Copy, Trash2, X } from "lucide-react";
import { clearDebug, subscribeDebug, type DebugEntry } from "../lib/debug";

export function DebugPanel({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<DebugEntry[]>([]);

  useEffect(() => subscribeDebug(setEntries), []);

  return (
    <div className="debug-panel">
      <div className="debug-bar">
        <button type="button" className="debug-icon-btn" onClick={onClose} aria-label="Close debug log">
          <X size={16} />
          <span>Close</span>
        </button>
        <div className="debug-actions">
          <button
            type="button"
            className="debug-icon-btn"
            onClick={() => {
              const text = entries.map((e) => `${e.time} [${e.level}] ${e.message}`).join("\n");
              navigator.clipboard?.writeText(text).catch(() => undefined);
            }}
          >
            <Copy size={14} />
            <span>Copy</span>
          </button>
          <button type="button" className="debug-icon-btn" onClick={() => clearDebug()}>
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>
      <div className="debug-body">
        {entries.length === 0 && <div className="debug-line info">No logs yet.</div>}
        {entries.map((e) => (
          <div key={e.id} className={`debug-line ${e.level}`}>
            <span className="debug-time">{e.time}</span> {e.message}
          </div>
        ))}
      </div>
    </div>
  );
}
