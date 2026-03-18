// Vercel Serverless Function
process.env.NODE_ENV = 'production';

let app = null;
let appError = null;
let initialized = false;

async function initialize() {
  if (initialized) return;
  initialized = true;
  
  try {
    const server = require('../dist/index.cjs');
    
    // Wait for async initialization (route registration)
    if (server.appReady) {
      await server.appReady;
    }
    
    const candidate = server.app || server.default || server;
    if (typeof candidate !== 'function') {
      throw new Error(`app is not a function. typeof=${typeof candidate}. keys=${Object.keys(server).join(',')}`);
    }
    app = candidate;
  } catch (e) {
    appError = e;
    console.error('[api/index.js] Initialization failed:', e.message);
    console.error(e.stack);
  }
}

// Start initializing immediately
const initPromise = initialize();

module.exports = async (req, res) => {
  await initPromise;
  
  if (appError) {
    return res.status(500).json({ 
      error: 'Server init failed', 
      message: appError.message,
      hint: 'Check Vercel function logs for details'
    });
  }
  
  if (!app) {
    return res.status(500).json({ error: 'App not ready' });
  }

  return app(req, res);
};
