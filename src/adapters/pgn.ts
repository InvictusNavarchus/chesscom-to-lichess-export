import { waitForElement } from '../utils';

const SELECTORS = {
  secondaryMenu: '.game-controls-secondary-more > button, .game-controls-secondary-button > button',
  shareBtn:
    '[data-cy="sidebar-share-icon"], ' +
    '[data-cy="analysis-secondary-controls-menu-open-share"], ' +
    'button[aria-label="Share"], ' +
    'button.share-button-component.icon-share, ' +
    'button.share-button-component.share, ' +
    '#shareMenuButton',
  dialog: '.share-menu-dialog-component, .cc-modal-body, div[role="dialog"]',
  pgnTabActive: '#tab-pgn.cc-tab-item-active',
  pgnTab: '#tab-pgn, #live_ShareMenuGlobalDialogDownloadButton, .icon-download',
  dialogButtons: '.share-menu-dialog-component header *, .cc-modal-body button, div[role="dialog"] button',
  textarea:
    '.share-menu-tab-pgn-textarea, ' +
    '#live_ShareMenuPgnContentTextareaId, ' +
    'textarea[name=pgn], ' +
    '#chessboard_ShareMenuPgnContentTextareaId',
  timestampsCheckbox: '#tab-pgn-timestamps',
  closeBtn:
    '.cc-close-button-component, ' +
    '#live_ShareMenuGlobalDialogCloseButton, ' +
    'button.ui_outside-close-component, ' +
    '#chessboard_ShareMenuGlobalDialogCloseButton',
} as const;

async function openShareDialog(): Promise<void> {
  // Chess.com sometimes nests share behind a secondary controls overflow menu.
  // If the button exists, click it and wait for the menu to materialise before
  // looking for the share button inside it.
  const secondaryBtn = document.querySelector<HTMLElement>(SELECTORS.secondaryMenu);
  if (secondaryBtn) {
    secondaryBtn.click();
    await waitForElement<HTMLElement>(SELECTORS.shareBtn);
  }

  const shareBtn = document.querySelector<HTMLElement>(SELECTORS.shareBtn);
  if (!shareBtn) throw new Error('Share button not found');

  shareBtn.click();
  // Wait until the dialog DOM is actually present before proceeding.
  await waitForElement(SELECTORS.dialog);
}

async function openPgnTab(): Promise<void> {
  // Already on the PGN tab — the textarea will be visible immediately.
  if (document.querySelector(SELECTORS.pgnTabActive)) return;

  // Try the labelled tab button first, then fall back to text-content search.
  const pgnTab: HTMLElement | undefined =
    document.querySelector<HTMLElement>(SELECTORS.pgnTab) ??
    Array.from(document.querySelectorAll<HTMLElement>(SELECTORS.dialogButtons)).find(
      el => el.textContent?.trim() === 'PGN',
    );

  if (pgnTab) {
    pgnTab.click();
    // Wait until the textarea appears, confirming the tab switched.
    await waitForElement(SELECTORS.textarea);
  }
  // If no tab button was found the textarea may already be the default view.
}

function closeShareDialog(): void {
  document.querySelector<HTMLElement>(SELECTORS.closeBtn)?.click();
}

async function readPgnFromTextarea(): Promise<string> {
  // Timestamps confuse Lichess's PGN parser — disable if the checkbox is on,
  // then wait for the textarea to refresh with the new content.
  const timestampsCheckbox = document.querySelector<HTMLInputElement>(SELECTORS.timestampsCheckbox);
  if (timestampsCheckbox?.checked) {
    timestampsCheckbox.click();
  }

  // Poll until the textarea exists AND contains a non-empty value.
  // This covers both the timestamps-reload case and any lazy rendering.
  const textarea = await waitForElement<HTMLTextAreaElement>(SELECTORS.textarea, {
    predicate: el => el.value.trim().length > 0,
  });

  return textarea.value;
}

/** Opens the chess.com share dialog, reads the PGN, then closes the dialog. */
export async function extractPgn(): Promise<string> {
  await openShareDialog();
  await openPgnTab();

  let pgn: string;
  try {
    pgn = await readPgnFromTextarea();
  } finally {
    closeShareDialog();
  }

  // Normalise the Termination tag so Lichess resolves the result correctly.
  // chess.com sometimes leaves Result "*" on time-forfeit games.
  pgn = pgn.includes(' won on time')
    ? pgn.replace(/Termination "[^"]+"/g, 'Termination "Time forfeit"')
    : pgn.replace(/Termination "[^"]+"/g, 'Termination "Normal"');

  return pgn;
}