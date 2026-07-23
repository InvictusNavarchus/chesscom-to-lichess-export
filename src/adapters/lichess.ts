import { GM_xmlhttpRequest } from '$';

interface LichessImportResponse {
	id: string;
	url: string;
}

/** POSTs a PGN to the Lichess import API and returns the analysis URL. */
export function importPgn(pgn: string): Promise<LichessImportResponse> {
	return new Promise((resolve, reject) => {
		GM_xmlhttpRequest({
			method: 'POST',
			url: 'https://lichess.org/api/import',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
				'User-Agent': 'chess-com-to-lichess-userscript/1.0',
			},
			data: `pgn=${encodeURIComponent(pgn)}`,
			onload(response) {
				if (response.status !== 200) {
					reject(new Error(`Lichess API returned ${response.status}`));
					return;
				}
				try {
					const data = JSON.parse(
						response.responseText,
					) as LichessImportResponse;
					resolve(data);
				} catch {
					reject(new Error('Failed to parse Lichess response'));
				}
			},
			onerror() {
				reject(new Error('Network error contacting Lichess'));
			},
		});
	});
}
