/**
 * Logger Service
 * 
 * This service provides logging functionality with different log levels:
 * - ERROR: For critical errors that prevent the application from functioning correctly
 * - WARN: For non-critical issues that might lead to unexpected behavior
 * - INFO: For general information about application flow
 * - DEBUG: For detailed debugging information (disabled in production)
 */

// Log levels enum
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Configuration interface
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  prefix: string;
}

class LoggerService {
  private config: LoggerConfig = {
    level: import.meta.env.VITE_LOG_LEVEL === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
    enableConsole: true,
    prefix: '[TaskMaster]'
  };

  /**
   * Configure the logger
   * @param config - Logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Log an error message
   * @param message - The message to log
   * @param data - Optional data to include
   */
  error(message: string, ...data: any[]): void {
    if (this.config.level >= LogLevel.ERROR) {
      this.log('ERROR', message, data);
    }
  }

  /**
   * Log a warning message
   * @param message - The message to log
   * @param data - Optional data to include
   */
  warn(message: string, ...data: any[]): void {
    if (this.config.level >= LogLevel.WARN) {
      this.log('WARN', message, data);
    }
  }

  /**
   * Log an info message
   * @param message - The message to log
   * @param data - Optional data to include
   */
  info(message: string, ...data: any[]): void {
    if (this.config.level >= LogLevel.INFO) {
      this.log('INFO', message, data);
    }
  }

  /**
   * Log a debug message
   * @param message - The message to log
   * @param data - Optional data to include
   */
  debug(message: string, ...data: any[]): void {
    if (this.config.level >= LogLevel.DEBUG) {
      this.log('DEBUG', message, data);
    }
  }

  /**
   * Internal method to handle the actual logging
   * @param level - The log level
   * @param message - The message to log
   * @param data - Optional data to include
   */
  private log(level: string, message: string, data: any[]): void {
    if (!this.config.enableConsole) return;

    const timestamp = new Date().toISOString();
    const formattedMessage = `${timestamp} ${this.config.prefix} [${level}] ${message}`;

    switch (level) {
      case 'ERROR':
        console.error(formattedMessage, ...data);
        break;
      case 'WARN':
        console.warn(formattedMessage, ...data);
        break;
      case 'INFO':
        console.info(formattedMessage, ...data);
        break;
      case 'DEBUG':
        console.debug(formattedMessage, ...data);
        break;
      default:
        console.log(formattedMessage, ...data);
    }
  }
}

// Create and export a singleton instance
const loggerService = new LoggerService();
export default loggerService;