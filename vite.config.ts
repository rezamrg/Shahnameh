import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function ganjoorProxyPlugin(): Plugin {
  return {
    name: 'ganjoor-proxy',
    configureServer(server) {
      server.middlewares.use('/api/ganjoor/verses', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', 'http://localhost');
          const targetUrl = urlObj.searchParams.get('url');

          if (!targetUrl || !targetUrl.startsWith('https://ganjoor.net/')) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Invalid URL. Must be a ganjoor.net URL' }));
            return;
          }

          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
          });

          if (!response.ok) {
            res.statusCode = response.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Ganjoor returned ${response.status}` }));
            return;
          }

          const html = await response.text();
          const regex = /<div class="m1"><p>(.*?)<\/p><\/div>\s*<div class="m2"><p>(.*?)<\/p><\/div>/g;
          const couplets: Array<{ m1: string; m2: string }> = [];
          let match;

          while ((match = regex.exec(html)) !== null) {
            const m1 = match[1].replace(/<[^>]+>/g, '').trim();
            const m2 = match[2].replace(/<[^>]+>/g, '').trim();
            if (m1 && m2) {
              couplets.push({ m1, m2 });
            }
          }

          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ success: true, count: couplets.length, couplets }));
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: message }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), ganjoorProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
