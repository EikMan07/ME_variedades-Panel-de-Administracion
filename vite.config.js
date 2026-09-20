import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function viteServerlessApiPlugin() {
  return {
    name: 'vite-serverless-api',
    configureServer(server) {
      // Cargar variables de entorno locales (.env, .env.local) en process.env para que las funciones
      // serverless locales (/api/tipo-cambio, /api/chatbot) tengan acceso a sus credenciales del servidor
      const localEnv = loadEnv(server.config.mode || 'development', server.config.root || process.cwd(), '');
      Object.assign(process.env, localEnv);

      server.middlewares.use('/api/tipo-cambio', async (req, res) => {
        try {
          const { default: handler } = await import('./api/tipo-cambio.js');
          const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
          const query = Object.fromEntries(parsedUrl.searchParams.entries());

          let body = {};
          if (req.method === 'POST') {
            let raw = '';
            for await (const chunk of req) {
              raw += chunk;
            }
            try { body = JSON.parse(raw || '{}'); } catch { /* ignore parse error */ }
          }

          const mockRes = {
            statusCode: 200,
            status(code) {
              this.statusCode = code;
              res.statusCode = code;
              return this;
            },
            setHeader(key, val) {
              res.setHeader(key, val);
              return this;
            },
            json(data) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return this;
            },
            end() {
              res.end();
              return this;
            }
          };

          const mockReq = {
            method: req.method,
            headers: req.headers,
            query,
            body
          };

          await handler(mockReq, mockRes);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      server.middlewares.use('/api/chatbot', async (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const parsedBody = JSON.parse(body || '{}');
              const { default: handler } = await import('./api/chatbot.js');
              const mockRes = {
                status(code) {
                  res.statusCode = code;
                  return this;
                },
                setHeader(key, val) {
                  res.setHeader(key, val);
                  return this;
                },
                json(data) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                  return this;
                },
                end() {
                  res.end();
                  return this;
                }
              };
              const mockReq = {
                method: 'POST',
                body: parsedBody
              };
              await handler(mockReq, mockRes);
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), viteServerlessApiPlugin()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['chart.js']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
});
