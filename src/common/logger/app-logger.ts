import { ConsoleLogger, LogLevel } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const LOG_LEVEL_ORDER: LogLevel[] = [
  'verbose',
  'debug',
  'log',
  'warn',
  'error',
  'fatal',
];

const resolveActiveLevels = (configuredLevel: string): LogLevel[] => {
  const levelIndex = LOG_LEVEL_ORDER.indexOf(configuredLevel as LogLevel);
  if (levelIndex === -1) {
    return ['log', 'warn', 'error', 'fatal'];
  }
  return LOG_LEVEL_ORDER.slice(levelIndex);
};

export class AppLogger extends ConsoleLogger {
  private readonly logFilePath: string;
  private readonly maxFileSizeBytes: number;

  constructor(context?: string) {
    const configuredLevel = process.env.LOG_LEVEL ?? 'log';
    super(context ?? 'App', {
      logLevels: resolveActiveLevels(configuredLevel),
    });
    this.logFilePath = path.join(process.cwd(), 'logs', 'app.log');
    this.maxFileSizeBytes =
      parseInt(process.env.LOG_MAX_FILE_SIZE ?? '1024', 10) * 1024;
    this.ensureLogDirectory();
  }

  protected override printMessages(
    messages: unknown[],
    context = '',
    logLevel: LogLevel = 'log',
    writeStreamType?: 'stdout' | 'stderr',
  ): void {
    super.printMessages(messages, context, logLevel, writeStreamType);
    this.appendToLogFile(messages, context, logLevel);
  }

  private appendToLogFile(
    messages: unknown[],
    context: string,
    logLevel: LogLevel,
  ): void {
    const line = this.buildLogLine(messages, context, logLevel);
    try {
      this.rotateLogFileIfNeeded();
      fs.appendFileSync(this.logFilePath, line);
    } catch {
      // silently fail on file write errors
    }
  }

  private buildLogLine(
    messages: unknown[],
    context: string,
    logLevel: LogLevel,
  ): string {
    const timestamp = new Date().toISOString();
    const text = messages.join(' ');
    if (process.env.NODE_ENV === 'production') {
      return (
        JSON.stringify({ timestamp, level: logLevel, context, message: text }) +
        '\n'
      );
    }
    return `${timestamp} [${logLevel.toUpperCase()}] [${context}] ${text}\n`;
  }

  private rotateLogFileIfNeeded(): void {
    try {
      const stats = fs.statSync(this.logFilePath);
      if (stats.size >= this.maxFileSizeBytes) {
        const suffix = new Date()
          .toISOString()
          .replace(/:/g, '-')
          .replace(/\./g, '-');
        const rotatedPath = this.logFilePath.replace(
          'app.log',
          `app-${suffix}.log`,
        );
        fs.renameSync(this.logFilePath, rotatedPath);
      }
    } catch {
      // file does not exist yet — no rotation needed
    }
  }

  private ensureLogDirectory(): void {
    try {
      fs.mkdirSync(path.dirname(this.logFilePath), { recursive: true });
    } catch {
      // directory already exists
    }
  }
}
