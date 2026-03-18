// Vercel Serverless Function entry point
// Loads the compiled Express app and handles requests

let handler = null;

async function getHandler() {
  if (!handler) {
    // The compiled server exports `app` and `appReady`
    const server = require('../dist/index.cjs');
    // Wait for routes to be registered
    if (server.appReady) {
      await server.appReady;
    }
    handler = server.app || server.default || server;
  }
  return handler;
}

module.exports = async (req, res) => {
  const h = await getHandler();
  return h(req, res);
};
