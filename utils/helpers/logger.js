// Minimal logger using console to avoid external dependencies during runtime
const logger = {
  info: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: (console.debug || console.log).bind(console),
};

module.exports = logger;