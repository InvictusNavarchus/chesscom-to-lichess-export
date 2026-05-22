function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function openShareDialog(): Promise<void> {
  // Chess.com sometimes nests share behind a secondary controls overflow menu
  const secondaryBtn = document.querySelector<HTMLElement>(
    '.game-controls-secondary-more > button, .game-controls-secondary-button > button',
  );
  if (secondaryBtn) {
    secondaryBtn.click();
    await sleep(300);
  }

  const shareBtn = document.querySelector<HTMLElement>(
    '[data-cy="sidebar-share-icon"], ' +
    '[data-cy="analysis-secondary-controls-menu-open-share"], ' +
    'button[aria-label="Share"], ' +
    'button.share-button-component.icon-share, ' +
    'button.share-button-component.share, ' +
    '#shareMenuButton',
  );

  if (!shareBtn) throw new Error('Share button not found');

  shareBtn.click();
  await sleep(1000);
}

async function openPgnTab(): Promise<void> {
  // Already on PGN tab — nothing to do
  if (document.querySelector('#tab-pgn.cc-tab-item-active')) return;

  // Try the direct PGN tab button first, then fall back to text search
  const pgnTab: HTMLElement | undefined =
    document.querySelector<HTMLElement>(
      '#tab-pgn, #live_ShareMenuGlobalDialogDownloadButton, .icon-download',
    ) ??
    Array.from(
      document.querySelectorAll<HTMLElement>(
        '.share-menu-dialog-component header *, .cc-modal-body button, div[role="dialog"] button',
      ),
    ).find(el => el.textContent?.trim() === 'PGN');

  if (pgnTab) {
    pgnTab.click();
    await sleep(500);
  }
  // If not found, the PGN textarea may already be the default view — fall through.
}

function closeShareDialog(): void {
  const closeBtn = document.querySelector<HTMLElement>(
    '.cc-close-button-component, ' +
    '#live_ShareMenuGlobalDialogCloseButton, ' +
    'button.ui_outside-close-component, ' +
    '#chessboard_ShareMenuGlobalDialogCloseButton',
  );
  closeBtn?.click();
}

async function readPgnFromTextarea(): Promise<string> {
  // Timestamps confuse Lichess's PGN parser — disable if checked
  const timestampsCheckbox = document.querySelector<HTMLInputElement>('#tab-pgn-timestamps');
  if (timestampsCheckbox?.checked) {
    timestampsCheckbox.click();
    await sleep(500);
  }

  const textarea = document.querySelector<HTMLTextAreaElement>(
    '.share-menu-tab-pgn-textarea, ' +
    '#live_ShareMenuPgnContentTextareaId, ' +
    'textarea[name=pgn], ' +
    '#chessboard_ShareMenuPgnContentTextareaId',
  );

  if (textarea?.value) return textarea.value;
  throw new Error('PGN textarea not found or empty');
}

/** Opens the chess.com share dialog, reads the PGN, and closes the dialog. */
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