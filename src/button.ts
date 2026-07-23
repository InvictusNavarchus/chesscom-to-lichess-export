// Stable random ID generated once per session — guarantees no collision with
// chess.com's own IDs and makes the O(1) getElementById guard possible.
const NS = `cc2l_${Math.random().toString(36).slice(2, 10)}`;
const STYLE_ID = `${NS}_style`;

type ButtonState = 'idle' | 'loading' | 'error';

const LABELS = {
  idle: '⚡ Analyse on Lichess',
  loading: '⏳ Importing…',
  error: '❌ Failed — retry?',
} satisfies Record<ButtonState, string>;

export function isButtonInjected(): boolean {
  // getElementById is an O(1) hash-map lookup — safe to call every 500 ms.
  return document.getElementById(NS) !== null;
}

/**
 * Finds a suitable anchor in chess.com's sidebar and appends the button.
 * Returns false if no anchor was found yet (caller should retry next tick).
 */
export function injectButton(onClick: () => void): boolean {
  // Prefer the icon row (Share, Flip, etc.) — present in both State A and B.
  const iconRow = document.querySelector<HTMLElement>('.game-icons-container-component');

  // Fallback: the nav-button row, then the whole sidebar.
  const anchor =
    iconRow ??
    document.querySelector<HTMLElement>('.game-buttons-container-component') ??
    document.querySelector<HTMLElement>('.game-buttons-component') ??
    document.querySelector<HTMLElement>('.sidebar-component');

  if (!anchor) return false;

  const btn = document.createElement('button');
  btn.id = NS;
  btn.className = 'cc2l-btn';
  btn.textContent = LABELS.idle;
  btn.addEventListener('click', onClick);

  if (iconRow) {
    // Insert before the spacer so it sits among the icon buttons,
    // not after Flip Board at the far right.
    const spacer = iconRow.querySelector('.game-icons-container-spacer');
    if (spacer) {
      iconRow.insertBefore(btn, spacer);
    } else {
      iconRow.appendChild(btn);
    }
  } else {
    anchor.appendChild(btn);
  }

  injectStyles();
  return true;
}

export function setButtonState(state: ButtonState): void {
  const btn = document.getElementById(NS) as HTMLButtonElement | null;
  if (!btn) return;
  btn.textContent = LABELS[state];
  btn.disabled = state === 'loading';
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .cc2l-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 12px;
      margin: 0 4px;
      border: none;
      border-radius: 4px;
      background: #3692e7;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      box-sizing: border-box;
      vertical-align: middle;
    }
    .cc2l-btn:hover:not(:disabled) { background: #2778c4; }
    .cc2l-btn:disabled { opacity: 0.65; cursor: not-allowed; }
  `;
  document.head.appendChild(style);
}