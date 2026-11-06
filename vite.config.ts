import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import {handleElfLinesRequest} from './server/elfLines';

/**
 * Serves POST /api/elf-lines during `npm run dev` / `vite preview` so the elf's
 * Gemini brain works locally. In production the same handler runs as the
 * Vercel function in api/elf-lines.ts. The API key stays on the server.
 */
function elfLinesApi(env: Record<string, string>): Plugin {
  const middleware = async (req: any, res: any, next: () => void) => {
    if (req.url?.split('?')[0] !== '/api/elf-lines') return next();
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const request = new Request('http://localhost/api/elf-lines', {
      method: req.method,
      headers: {'content-type': 'application/json'},
      body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
    });
    const response = await handleElfLinesRequest(request, env.GEMINI_API_KEY, env.GEMINI_MODEL);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(await response.text());
  };
  return {
    name: 'elf-lines-api',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
}

export default defineConfig(({mode}) => {
  // '' prefix loads all vars (incl. GEMINI_API_KEY) for server-side use only; nothing here is exposed to the client.
  const env = {...loadEnv(mode, process.cwd(), ''), ...process.env} as Record<string, string>;
  return {
    plugins: [react(), tailwindcss(), elfLinesApi(env)],
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
