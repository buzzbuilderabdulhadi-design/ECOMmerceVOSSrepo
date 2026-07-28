import config from '../config';

// ============================================================
// Simple Logger Utility
// ============================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

class Logger {
  private readonly isDevelopment: boolean;

  constructor() {
    this.isDevelopment = config.env === 'development';
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && Object.keys(meta).length > 0 && { meta }),
    };
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry = this.formatMessage(level, message, meta);

    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message, meta || '');
        break;
      case 'warn':
        console.warn(prefix, message, meta || '');
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(prefix, message, meta || '');
        }
        break;
      default:
        console.log(prefix, message, meta || '');
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  // HTTP request logging helper
  httpRequest(method: string, url: string, statusCode: number, durationMs: number): void {
    const level: LogLevel = statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `${method} ${url} ${statusCode} ${durationMs}ms`);
  }

  // Database query logging
  databaseQuery(query: string, durationMs: number): void {
    if (this.isDevelopment) {
      this.debug(`DB Query (${durationMs}ms): ${query.substring(0, 200)}`);
    }
  }
}

export const logger = new Logger();
export default logger;

