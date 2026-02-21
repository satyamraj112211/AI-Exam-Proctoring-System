// Entry point for the standalone session-based auth demo.
// This does NOT touch your existing backend; it runs as a separate Node app.

const app = require('./src/app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Session auth server running at http://localhost:${PORT}`);
});



















