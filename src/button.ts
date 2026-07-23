import lichessLogoSvg from './assets/lichess-logo.svg?raw';

// Stable random ID generated once per session — guarantees no collision with
// chess.com's own IDs and makes the O(1) getElementById guard possible.
const NS = `cc2l_${Math.random().toString(36).slice(2, 10)}`;
const STYLE_ID = `${NS}_style`;

export type ButtonState = 'idle' | 'cached' | 'loading' | 'error';

const BUTTON_CONTENT: Record<ButtonState, string> = {
	idle: `${lichessLogoSvg}<span>Analyse on Lichess</span>`,
	cached: `${lichessLogoSvg}<span>Re-open on Lichess ✓</span>`,
	loading: `<span>⏳ Importing…</span>`,
	error: `<span>❌ Failed — retry?</span>`,
};

export function isButtonInjected(): boolean {
	// getElementById is an O(1) hash-map lookup — safe to call every 500 ms.
	return document.getElementById(NS) !== null;
}

const ANCHOR_SELECTORS = [
	'.game-over-modal-shell-buttons',
	'.game-review-buttons-component',
];

/**
 * Finds a suitable anchor in chess.com's game-over modal shell or sidebar and appends the button.
 * Returns false if no anchor was found yet (caller should retry next tick).
 */
export function injectButton(
	onClick: () => void,
	initialState: ButtonState = 'idle',
): boolean {
	let anchor: HTMLElement | null = null;
	for (const selector of ANCHOR_SELECTORS) {
		anchor = document.querySelector<HTMLElement>(selector);
		if (anchor) break;
	}

	if (!anchor) return false;

	const btn = document.createElement('button');
	btn.id = NS;
	btn.type = 'button';
	btn.className = 'cc2l-btn';
	btn.innerHTML = BUTTON_CONTENT[initialState];
	btn.addEventListener('click', onClick);

	const secondaryActions = anchor.querySelector(
		'.game-over-secondary-actions-row-component',
	);
	if (secondaryActions) {
		anchor.insertBefore(btn, secondaryActions);
	} else {
		anchor.appendChild(btn);
	}

	injectStyles();
	return true;
}

export function setButtonState(state: ButtonState): void {
	const btn = document.getElementById(NS) as HTMLButtonElement | null;
	if (!btn) return;
	btn.innerHTML = BUTTON_CONTENT[state];
	btn.disabled = state === 'loading';
}

function injectStyles(): void {
	if (document.getElementById(STYLE_ID)) return;

	const style = document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = `
    .cc2l-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 2rem 4rem;
      margin-top: 8px;
      border: none;
      border-radius: 4px;
      background: #d64f00;
      color: #ffffff;
      font-size: 22px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      box-sizing: border-box;
    }
    .game-over-modal-shell-buttons .cc2l-btn {
      width: auto;
	  padding: 1.3rem 2rem;
      max-width: 100%;
      margin: 8px 1.6rem;
    }
    .cc2l-btn svg {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }
    .cc2l-btn:hover:not(:disabled) { background: #c57445ff; }
    .cc2l-btn:disabled { opacity: 0.65; cursor: not-allowed; }
  `;
	document.head.appendChild(style);
}
