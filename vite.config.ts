import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Chess.com → Lichess Analyser',
        namespace: 'npm/vite-plugin-monkey',
        version: '1.0.0',
        description: 'One-click PGN export from Chess.com directly to Lichess analysis',
        icon: 'https://lichess.org/favicon.ico',
        match: [
          'https://www.chess.com/game/*',
        ],
        grant: ['GM_xmlhttpRequest'],
        connect: ['lichess.org'],
      },
    }),
  ],
});