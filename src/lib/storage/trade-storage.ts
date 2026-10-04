import fs from 'fs';
import path from 'path';
import type { AutoTraderConfig, AutoTradeRecord } from '../engines/auto-trader';

export interface PersistentTradeState {
  version: number;
  lastUpdated: number;
  savedAt: string;
  config: AutoTraderConfig;
  totalRealizedProfitUsd: number;
  totalRealizedLossUsd: number;
  partiallyClosedTickets: Array<number | string>;
  tradeHistory: AutoTradeRecord[];
}

export class TradeStorageManager {
  private static readonly DATA_DIR = path.join(process.cwd(), 'data');
  private static readonly FILE_PATH = path.join(TradeStorageManager.DATA_DIR, 'trade_history.json');
  private static readonly BACKUP_PATH = path.join(TradeStorageManager.DATA_DIR, 'trade_history.backup.json');
  private static isInitialized = false;

  /**
   * Ensures the data directory exists.
   */
  private static ensureDirExists(): void {
    try {
      if (!fs.existsSync(this.DATA_DIR)) {
        fs.mkdirSync(this.DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.warn('[TradeStorage] Failed to create data directory:', err);
    }
  }

  /**
   * Loads saved trade history and engine state from local JSON file.
   * If file does not exist, returns null so caller can supply initial defaults.
   */
  public static loadState(): PersistentTradeState | null {
    if (typeof window !== 'undefined') return null;

    try {
      this.ensureDirExists();
      if (!fs.existsSync(this.FILE_PATH)) {
        return null;
      }

      const content = fs.readFileSync(this.FILE_PATH, 'utf-8');
      if (!content || !content.trim()) return null;

      const parsed: PersistentTradeState = JSON.parse(content);
      if (Array.isArray(parsed.tradeHistory)) {
        this.isInitialized = true;
        console.log(`[TradeStorage] Successfully loaded ${parsed.tradeHistory.length} trade records from ${this.FILE_PATH}`);
        return parsed;
      }
    } catch (err) {
      console.error('[TradeStorage] Error loading trade history from disk, attempting backup:', err);
      try {
        if (fs.existsSync(this.BACKUP_PATH)) {
          const backupContent = fs.readFileSync(this.BACKUP_PATH, 'utf-8');
          const backupParsed: PersistentTradeState = JSON.parse(backupContent);
          console.log(`[TradeStorage] Restored ${backupParsed.tradeHistory.length} trades from backup file!`);
          return backupParsed;
        }
      } catch (backupErr) {
        console.error('[TradeStorage] Backup restore failed:', backupErr);
      }
    }

    return null;
  }

  /**
   * Persists trade history, realized PnL, and configuration to disk.
   */
  public static saveState(state: {
    config: AutoTraderConfig;
    totalRealizedProfitUsd: number;
    totalRealizedLossUsd: number;
    partiallyClosedTickets: Array<number | string>;
    tradeHistory: AutoTradeRecord[];
  }): boolean {
    if (typeof window !== 'undefined') return false;

    try {
      this.ensureDirExists();
      const now = Date.now();

      const payload: PersistentTradeState = {
        version: 1,
        lastUpdated: now,
        savedAt: new Date(now).toLocaleString(),
        config: state.config,
        totalRealizedProfitUsd: Number(state.totalRealizedProfitUsd.toFixed(2)),
        totalRealizedLossUsd: Number(state.totalRealizedLossUsd.toFixed(2)),
        partiallyClosedTickets: Array.from(state.partiallyClosedTickets),
        tradeHistory: state.tradeHistory,
      };

      const jsonString = JSON.stringify(payload, null, 2);

      // 1. Write current state to primary file
      fs.writeFileSync(this.FILE_PATH, jsonString, 'utf-8');

      // 2. Also keep a backup copy every ~10 records for disaster resilience
      if (state.tradeHistory.length > 0 && state.tradeHistory.length % 5 === 0) {
        fs.writeFileSync(this.BACKUP_PATH, jsonString, 'utf-8');
      }

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error('[TradeStorage] Failed to save trade state to disk:', err);
      return false;
    }
  }

  /**
   * Returns metadata about the persistent storage file.
   */
  public static getStorageMetadata(): {
    exists: boolean;
    filePath: string;
    sizeBytes: number;
    lastModified: string | null;
    recordsCount: number;
  } {
    if (typeof window !== 'undefined') {
      return { exists: false, filePath: '', sizeBytes: 0, lastModified: null, recordsCount: 0 };
    }

    try {
      this.ensureDirExists();
      if (fs.existsSync(this.FILE_PATH)) {
        const stats = fs.statSync(this.FILE_PATH);
        const content = fs.readFileSync(this.FILE_PATH, 'utf-8');
        const parsed = JSON.parse(content);
        return {
          exists: true,
          filePath: this.FILE_PATH,
          sizeBytes: stats.size,
          lastModified: stats.mtime.toLocaleString(),
          recordsCount: Array.isArray(parsed.tradeHistory) ? parsed.tradeHistory.length : 0,
        };
      }
    } catch (e) {}

    return {
      exists: false,
      filePath: this.FILE_PATH,
      sizeBytes: 0,
      lastModified: null,
      recordsCount: 0,
    };
  }
}
