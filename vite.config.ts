import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
	plugins: [
		monkey({
			entry: 'src/main.ts',
			userscript: {
				name: 'Chess.com → Lichess Analyser',
				author: 'Invictus Navarchus',
				namespace: 'https://github.com/InvictusNavarchus',
				version: '1.0.0',
				description:
					'One-click PGN export from Chess.com directly to Lichess analysis',
				icon: 'https://lichess.org/favicon.ico',
				match: ['https://www.chess.com/*'],
				grant: ['GM_xmlhttpRequest', 'GM_getValue', 'GM_setValue'],
				connect: ['lichess.org'],
			},
		}),
	],
});
