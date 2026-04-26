import * as fs from 'fs';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppLogger } from './app-logger';

vi.mock('fs');

describe('AppLogger', () => {
  beforeEach(() => {
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.appendFileSync).mockReturnValue(undefined);
    vi.mocked(fs.renameSync).mockReturnValue(undefined);
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_MAX_FILE_SIZE;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates log directory on construction', () => {
    new AppLogger('Test');

    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('logs'), {
      recursive: true,
    });
  });

  it('writes log line to file when a message is logged', () => {
    vi.mocked(fs.statSync).mockImplementation(() => {
      throw new Error('file not found');
    });

    const logger = new AppLogger('Test');
    logger.log('hello world');

    expect(fs.appendFileSync).toHaveBeenCalledWith(
      expect.stringContaining('app.log'),
      expect.stringContaining('hello world'),
    );
  });

  it('writes JSON format in production mode', () => {
    process.env.NODE_ENV = 'production';
    vi.mocked(fs.statSync).mockImplementation(() => {
      throw new Error('file not found');
    });

    const logger = new AppLogger('Prod');
    logger.log('prod message');

    const writtenLine = vi.mocked(fs.appendFileSync).mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenLine);

    expect(parsed.level).toBe('log');
    expect(parsed.context).toBe('Prod');
    expect(parsed.message).toContain('prod message');
  });

  it('rotates log file when it exceeds max size', () => {
    process.env.LOG_MAX_FILE_SIZE = '1';
    vi.mocked(fs.statSync).mockReturnValue({ size: 2048 } as fs.Stats);

    const logger = new AppLogger('Test');
    logger.log('trigger rotation');

    expect(fs.renameSync).toHaveBeenCalledWith(
      expect.stringContaining('app.log'),
      expect.stringContaining('app-'),
    );
  });

  it('does not rotate when file size is below threshold', () => {
    process.env.LOG_MAX_FILE_SIZE = '1024';
    vi.mocked(fs.statSync).mockReturnValue({ size: 100 } as fs.Stats);

    const logger = new AppLogger('Test');
    logger.log('no rotation needed');

    expect(fs.renameSync).not.toHaveBeenCalled();
  });

  it('uses LOG_LEVEL env variable to control active levels', () => {
    process.env.LOG_LEVEL = 'error';
    vi.mocked(fs.statSync).mockImplementation(() => {
      throw new Error('file not found');
    });

    const logger = new AppLogger('Test');
    logger.log('this should be suppressed');

    expect(fs.appendFileSync).not.toHaveBeenCalled();
  });

  it('falls back to default log levels when LOG_LEVEL is invalid', () => {
    process.env.LOG_LEVEL = 'invalid-level';
    vi.mocked(fs.statSync).mockImplementation(() => {
      throw new Error('file not found');
    });

    const logger = new AppLogger('Test');
    logger.log('should be logged at default level');

    expect(fs.appendFileSync).toHaveBeenCalled();
  });

  it('rotated file name includes timestamp suffix', () => {
    process.env.LOG_MAX_FILE_SIZE = '1';
    vi.mocked(fs.statSync).mockReturnValue({ size: 2048 } as fs.Stats);

    const logger = new AppLogger('Test');
    logger.log('rotation test');

    const renamedPath = vi.mocked(fs.renameSync).mock.calls[0][1] as string;
    expect(renamedPath).toMatch(/app-\d{4}-\d{2}-\d{2}/);
  });

  it('rotated path is in same directory as original log file', () => {
    process.env.LOG_MAX_FILE_SIZE = '1';
    vi.mocked(fs.statSync).mockReturnValue({ size: 2048 } as fs.Stats);

    const logger = new AppLogger('Test');
    logger.log('rotation dir check');

    const originalPath = vi.mocked(fs.renameSync).mock.calls[0][0] as string;
    const renamedPath = vi.mocked(fs.renameSync).mock.calls[0][1] as string;
    expect(path.dirname(originalPath)).toBe(path.dirname(renamedPath));
  });
});
