// Centralized logging utility (Step 5 foundation - used throughout)
const LOG_LEVELS = { ERROR: "ERROR", WARN: "WARN", INFO: "INFO", DEBUG: "DEBUG" };

const formatLog = (level, service, message, meta = {}) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    ...meta,
  });
};

const logger = {
  error: (service, message, meta) => console.error(formatLog(LOG_LEVELS.ERROR, service, message, meta)),
  warn:  (service, message, meta) => console.warn(formatLog(LOG_LEVELS.WARN,  service, message, meta)),
  info:  (service, message, meta) => console.log(formatLog(LOG_LEVELS.INFO,   service, message, meta)),
  debug: (service, message, meta) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(formatLog(LOG_LEVELS.DEBUG, service, message, meta));
    }
  },
};

module.exports = logger;
