// Vercel Serverless Function
// Built files exist in dist/ after `npm run build` runs

let app = null;
let initError = null;

// Initialize synchronously — Vercel waits for module load
try {
  const server = require('../dist/index.cjs');
  app = server.app || server.default || server;
  if (typeof app !== 'function') {
    initError = new Error(`Invalid app export. Type: ${typeof app}. Keys: ${Object.keys(server).join(',')}`);
    app = null;
  }
} catch (e) {
  initError = e;
}

// Vercel calls this as the request handler
module.exports = async (req, res) => {
  if (initError) {
    console.error('Init error:', initError.message);
    return res.status(500).json({ error: initError.message });
  }

  // Wait for async route registration
  try {
    const server = require('../dist/index.cjs');
    if (server.appReady) {
      await server.appReady;
    }
    return app(req, res);
  } catch (e) {
    console.error('Handler error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
