import { isButtonInjected, injectButton, setButtonState } from './button';
import { analyseOnLichess } from './analyseOnLichess';

const GAME_PATH_FRAGMENTS = ['/game/'];

function isOnGamePage(): boolean {
  return GAME_PATH_FRAGMENTS.some(fragment =>
    window.location.pathname.includes(fragment),
  );
}

async function handleClick(): Promise<void> {
  setButtonState('loading');
  try {
    await analyseOnLichess();
    setButtonState('idle');
  } catch (err) {
    console.error('[cc2l]', err);
    setButtonState('error');
    setTimeout(() => setButtonState('idle'), 3000);
  }
}

function tick(): void {
  // Path guard — bail immediately if not on a game page
  if (!isOnGamePage()) return;

  // Fast-path guard — O(1) check, exits if button already present
  if (isButtonInjected()) return;

  // Chess.com is a React SPA; the sidebar may not be in the DOM yet.
  // injectButton returns false if the anchor isn't ready — loop will retry.
  injectButton(() => { void handleClick(); });
}

setInterval(tick, 500);