function getMoscowTime() {
  return new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

const logLevels = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  WARN: 'WARN',
  DEBUG: 'DEBUG'
};

const colors = {
  INFO: '\x1b[36m',     
  ERROR: '\x1b[31m',    
  WARN: '\x1b[33m',     
  DEBUG: '\x1b[0m',     
  RESET: '\x1b[0m'
};



function log(level, message, meta = {}) {
  const timestamp = getMoscowTime();
  const color = colors[level] || colors.RESET;

  const formattedMeta = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';

  console.log(`${color}[${timestamp}] [${level}] ${message}${formattedMeta}${colors.RESET}`);
}

module.exports = {
  info: (message, meta) => log(logLevels.INFO, message, meta),
  error: (message, meta) => log(logLevels.ERROR, message, meta),
  warn: (message, meta) => log(logLevels.WARN, message, meta),
  debug: (message, meta) => log(logLevels.DEBUG, message, meta)
};