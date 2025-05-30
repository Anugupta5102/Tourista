const winston = require('winston');
const { format, transports } = winston;
const path = require('path');

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error'
    }),
    new transports.File({
      filename: path.join(__dirname, '../../logs/combined.log')
    }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// Morgan stream for HTTP logging
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = { logger, morganStream };
