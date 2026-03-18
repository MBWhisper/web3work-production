// Vercel Serverless Function
'use strict';

// Capture any initialization errors
let app = null;
let initError = null;

try {
  const server = require('../dist/index.cjs');
  app = server.app || server.default || server;
  
  if (typeof app !== 'function') {
    initError = new Error(`app export is not callable. typeof=${typeof app}`);
    app = null;
  }
} catch (e) {
  initError = e;
  console.error('[INIT ERROR]', e.message);
}

module.exports = async function handler(req, res) {
  // If sync init failed, return JSON error
  if (initError) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    return res.end(JSON.stringify({
      error: 'init_failed',
      message: initError.message,
    }));
  }

  try {
    // Wait for async route registration
    const server = require('../dist/index.cjs');
    if (server.appReady && typeof server.appReady.then === 'function') {
      await server.appReady;
    }
    return app(req, res);
  } catch (e) {
    console.error('[HANDLER ERROR]', e.message);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'handler_failed', message: e.message }));
  }
};
