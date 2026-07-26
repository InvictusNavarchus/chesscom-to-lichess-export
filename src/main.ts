import { isButtonInjected, injectButton, setButtonState } from './button';
import { analyseOnLichess } from './analyseOnLichess';
import { extractGameId, getStoredLichessUrl } from './storage';

const GAME_PATH_FRAGMENTS = ['/game/', '/play/'];
const ABORTED_GAME_SELECTORS = [
	'.game-over-modal-header-is-v6-aborted',
	'.game-over-aborted-body-component',
	'.game-over-header-abortedIcon',
];

function isOnGamePage(): boolean {
	return GAME_PATH_FRAGMENTS.some((fragment) =>
		window.location.pathname.includes(fragment),
	);
}

function isGameAborted(): boolean {
	return ABORTED_GAME_SELECTORS.some(
		(selector) => document.querySelector(selector) !== null,
	);
}

function isGameCached(): boolean {
	const id = extractGameId();
	return id !== null && getStoredLichessUrl(id) !== null;
}

async function handleClick(): Promise<void> {
	setButtonState('loading');
	try {
		await analyseOnLichess();
		setButtonState('cached');
	} catch (err) {
		console.error('[cc2l]', err);
		setButtonState('error');
		const fallbackState = isGameCached() ? 'cached' : 'idle';
		setTimeout(() => setButtonState(fallbackState), 3000);
	}
}

function tick(): void {
	// Path guard — bail immediately if not on a game page
	if (!isOnGamePage()) return;

	// Abort guard — skip button injection for aborted games (no moves to analyse)
	if (isGameAborted()) return;

	// Fast-path guard — O(1) check, exits if button already present
	if (isButtonInjected()) return;

	// .game-review-buttons-component doesn't exist mid-game.
	// Its presence IS the "game is over" signal — no separate guard needed.
	const initialState = isGameCached() ? 'cached' : 'idle';
	injectButton(() => {
		void handleClick();
	}, initialState);
}

setInterval(tick, 500);
