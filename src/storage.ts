import { GM_getValue, GM_setValue } from '$';

const STORAGE_KEY = 'cc2l_game_map';

type GameMap = Record<string, string>;

/**
 * Extracts the unique Chess.com game ID from the URL pathname.
 * Handles paths like /game/live/123456789, /game/daily/123456789, /game/123456789, etc.
 */
export function extractGameId(
	pathname: string = window.location.pathname,
): string | null {
	const match = pathname.match(/\/game\/(?:[a-z-]+\/)?(\d+)/i);
	return match ? match[1] : null;
}

function getGameMap(): GameMap {
	try {
		const raw = GM_getValue<unknown>(STORAGE_KEY, '{}');
		if (typeof raw === 'string') {
			return JSON.parse(raw) as GameMap;
		}
		if (typeof raw === 'object' && raw !== null) {
			return raw as GameMap;
		}
		return {};
	} catch {
		return {};
	}
}

/** Returns the stored Lichess URL for a given Chess.com game ID, or null if not cached. */
export function getStoredLichessUrl(gameId: string): string | null {
	const map = getGameMap();
	return map[gameId] ?? null;
}

/** Persists the mapping from Chess.com game ID to Lichess URL in Userscript storage. */
export function saveLichessUrl(gameId: string, lichessUrl: string): void {
	const map = getGameMap();
	map[gameId] = lichessUrl;
	GM_setValue(STORAGE_KEY, JSON.stringify(map));
}
