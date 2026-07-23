import { GM_xmlhttpRequest } from '$';

interface LichessImportResponse {
	id: string;
	url: string;
}

/**
 * Extracts target URL from GM_xmlhttpRequest response,
 * handling both auto-followed redirects (status 200 with finalUrl)
 * and direct 302/303 redirect responses with a Location header.
 */
function extractRedirectUrl(response: {
	status: number;
	finalUrl?: string;
	responseHeaders?: string;
}): string | null {
	if (response.finalUrl && !response.finalUrl.endsWith('/import')) {
		return response.finalUrl;
	}

	if (response.responseHeaders) {
		const match = response.responseHeaders.match(/^location:\s*(.+)$/im);
		if (match?.[1]) {
			const loc = match[1].trim();
			if (loc.startsWith('http://') || loc.startsWith('https://')) {
				return loc;
			}
			return new URL(loc, 'https://lichess.org').toString();
		}
	}

	if (response.finalUrl) {
		return response.finalUrl;
	}

	return null;
}

/**
 * POSTs a PGN to the Lichess web import endpoint with auto-analysis enabled (`analyse=true`).
 * Returns the game ID and direct analysis URL.
 */
export function importPgn(pgn: string): Promise<LichessImportResponse> {
	return new Promise((resolve, reject) => {
		const normalizedPgn = pgn.replace(/\r?\n/g, '\r\n');
		const body = new URLSearchParams({
			pgn: normalizedPgn,
			pgnFile: '',
			analyse: 'true',
		}).toString();

		GM_xmlhttpRequest({
			method: 'POST',
			url: 'https://lichess.org/import',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			data: body,
			onload(response) {
				if (response.status < 200 || response.status >= 400) {
					reject(new Error(`Lichess returned status ${response.status}`));
					return;
				}

				const targetUrl = extractRedirectUrl(response);
				if (!targetUrl) {
					reject(
						new Error(
							'Could not determine imported game URL from Lichess response',
						),
					);
					return;
				}

				const idMatch = targetUrl.match(/lichess\.org\/([a-zA-Z0-9]{8,12})/);
				const id = idMatch ? idMatch[1] : '';

				resolve({
					id,
					url: targetUrl,
				});
			},
			onerror() {
				reject(new Error('Network error contacting Lichess'));
			},
		});
	});
}
