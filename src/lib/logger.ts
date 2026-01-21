/**
 * نظام Logger مخصص
 * يعرض الرسائل في التطوير فقط ويخفيها في الإنتاج
 */

const isDev = process.env.NODE_ENV === 'development';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  showTimestamp?: boolean;
}

class Logger {
  private prefix: string;
  private showTimestamp: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '';
    this.showTimestamp = options.showTimestamp ?? false;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = this.showTimestamp ? `[${new Date().toISOString()}] ` : '';
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    return `${timestamp}${prefix}${message}`;
  }

  /**
   * Debug - يظهر في التطوير فقط
   */
  debug(message: string, ...args: unknown[]): void {
    if (isDev) {
      console.log(`🔍 ${this.formatMessage('debug', message)}`, ...args);
    }
  }

  /**
   * Info - يظهر في التطوير فقط
   */
  info(message: string, ...args: unknown[]): void {
    if (isDev) {
      console.info(`ℹ️ ${this.formatMessage('info', message)}`, ...args);
    }
  }

  /**
   * Warn - يظهر دائماً
   */
  warn(message: string, ...args: unknown[]): void {
    console.warn(`⚠️ ${this.formatMessage('warn', message)}`, ...args);
  }

  /**
   * Error - يظهر دائماً (بدون تفاصيل حساسة في الإنتاج)
   */
  error(message: string, error?: unknown): void {
    if (isDev) {
      console.error(`❌ ${this.formatMessage('error', message)}`, error);
    } else {
      // في الإنتاج: رسالة عامة فقط بدون تفاصيل
      console.error(`❌ ${this.formatMessage('error', message)}`);
    }
  }

  /**
   * رسالة تظهر دائماً (للأخطاء الحرجة)
   */
  critical(message: string, ...args: unknown[]): void {
    console.error(`🚨 ${this.formatMessage('error', message)}`, ...args);
  }
}

// Logger instances للاستخدام في أماكن مختلفة
export const authLogger = new Logger({ prefix: 'Auth' });
export const dbLogger = new Logger({ prefix: 'DB' });
export const apiLogger = new Logger({ prefix: 'API' });
export const fingerLogger = new Logger({ prefix: 'Fingerprint' });

// Logger عام
export const logger = new Logger();

// دالة مساعدة للتحقق من بيئة التطوير
export const isDevMode = (): boolean => isDev;

export default Logger;
