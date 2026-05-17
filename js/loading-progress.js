/**
 * Appends a live "NN%" value next to loading messages.
 */
export function formatLoadingText(baseMessage, percent) {
  const base = String(baseMessage || "Loading")
    .replace(/\s*\.{3}\s*$/u, "")
    .replace(/\s+\d+%\s*$/u, "")
    .trim();
  const value = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  return `${base} ${value}%`;
}

/**
 * @param {object} options
 * @param {string} [options.baseMessage]
 * @param {(text: string, percent: number) => void} [options.onUpdate]
 * @param {number} [options.estimateMs] — auto-creep cap before complete() (default 12s)
 */
export function createLoadingProgress(options = {}) {
  let baseMessage = String(options.baseMessage || "Loading");
  let percent = 0;
  let timerId = null;
  let stopped = false;
  const estimateMs = Number(options.estimateMs) > 0 ? Number(options.estimateMs) : 12000;
  const autoCap = 88;

  const notify = () => {
    const text = formatLoadingText(baseMessage, percent);
    if (typeof options.onUpdate === "function") options.onUpdate(text, percent);
    return text;
  };

  const start = () => {
    if (timerId) return;
    const startTime = performance.now();
    timerId = window.setInterval(() => {
      if (stopped) return;
      const elapsed = performance.now() - startTime;
      const eased = autoCap * (1 - Math.exp(-elapsed / estimateMs));
      if (eased > percent) {
        percent = Math.min(autoCap, eased);
        notify();
      }
    }, 75);
  };

  return {
    start,
    setMessage(message) {
      baseMessage = String(message || "Loading");
      notify();
    },
    setProgress(nextPercent) {
      percent = Math.max(percent, Math.min(100, Number(nextPercent) || 0));
      notify();
    },
    complete() {
      stopped = true;
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
      percent = 100;
      notify();
    },
    stop() {
      stopped = true;
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    },
    getText() {
      return formatLoadingText(baseMessage, percent);
    }
  };
}

const api = { formatLoadingText, createLoadingProgress };

if (typeof window !== "undefined") {
  window.JanaLoadingProgress = api;
}
