import { extractPgn } from './adapters/pgn';
import { importPgn } from './adapters/lichess';
import { extractGameId, getStoredLichessUrl, saveLichessUrl } from './storage';

/** Pulls the PGN from chess.com, imports it to Lichess, and opens the analysis page. */
export async function analyseOnLichess(): Promise<void> {
	const gameId = extractGameId();
	if (gameId) {
		const cachedUrl = getStoredLichessUrl(gameId);
		if (cachedUrl) {
			window.open(cachedUrl, '_blank');
			return;
		}
	}

	const pgn = await extractPgn();
	const result = await importPgn(pgn);

	if (gameId) {
		saveLichessUrl(gameId, result.url);
	}

	window.open(result.url, '_blank');
}
