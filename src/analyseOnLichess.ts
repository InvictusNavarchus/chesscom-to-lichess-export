import { extractPgn } from './adapters/pgn';
import { importPgn } from './adapters/lichess';

/** Pulls the PGN from chess.com, imports it to Lichess, and opens the analysis page. */
export async function analyseOnLichess(): Promise<void> {
  const pgn = await extractPgn();
  const result = await importPgn(pgn);
  window.open(result.url, '_blank');
}