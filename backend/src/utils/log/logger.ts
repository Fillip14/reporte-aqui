import winston from 'winston';
import path from 'path';

const logPath = path.join(__dirname, 'logs', 'app.log');
const isTestEnv: boolean = process.env.NODE_ENV === 'test';

const logger = winston.createLogger({
  level: 'silly', // Níveis: error, warn, info, http, verbose, debug, silly
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    ...(isTestEnv ? [] : [new winston.transports.Console()]),
    // new winston.transports.Console(),
    new winston.transports.File({ filename: logPath }),
  ],
});

export default logger;
