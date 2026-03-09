import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const ERROR_LOG_KEY = '@error_logs';
const MAX_ERRORS = 100; // Keep last 100 errors
const LOG_SERVER_URL = 'https://diax.in:8080/log';
const BATCH_SIZE = 10; // Send logs in batches
const BATCH_INTERVAL = 5000; // Send batch every 5 seconds
const MAX_RETRIES = 3;

export interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  context?: any;
  type: 'error' | 'warning' | 'info' | 'debug';
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLog[] = [];
  private listeners: Array<(logs: ErrorLog[]) => void> = [];
  private pendingLogs: ErrorLog[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private deviceInfo: any = null;
  private isInitialized = false;

  private constructor() {
    // Don't initialize synchronously - defer to prevent crashes
    // this.loadLogs();
    // this.initializeDeviceInfo();
    
    // Initialize asynchronously to prevent blocking
    setTimeout(() => {
      try {
        this.loadLogs();
        this.initializeDeviceInfo();
      } catch (e) {
        // Silently fail - don't crash app
      }
    }, 0);
  }

  private async initializeDeviceInfo() {
    try {
      this.deviceInfo = {
        platform: Platform.OS || 'unknown',
        version: Platform.Version || 'unknown',
        deviceId: await DeviceInfo.getUniqueId().catch(() => 'unknown'),
        deviceName: await DeviceInfo.getDeviceName().catch(() => 'unknown'),
        brand: DeviceInfo.getBrand() || 'unknown',
        model: DeviceInfo.getModel() || 'unknown',
        manufacturer: await DeviceInfo.getManufacturer().catch(() => 'unknown'),
        systemVersion: DeviceInfo.getSystemVersion() || 'unknown',
        appVersion: DeviceInfo.getVersion() || 'unknown',
        bundleId: DeviceInfo.getBundleId() || 'unknown',
        isTablet: DeviceInfo.isTablet() || false,
        isEmulator: await DeviceInfo.isEmulator().catch(() => false),
      };
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize device info:', error);
      this.deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
      };
      this.isInitialized = true;
    }
  }

  private async sendLogToServer(log: ErrorLog) {
    try {
      const logPayload: any = {
        id: log.id,
        timestamp: log.timestamp,
        type: log.type,
        message: log.message,
        stack: log.stack,
        context: log.context,
        deviceInfo: this.deviceInfo,
      };

      const obj: any = {};
      obj['detail'] = logPayload;
      const jsonString = JSON.stringify(obj);

      const response = await fetch(LOG_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonString,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send log to server:', error);
      return false;
    }
  }

  private async sendBatchToServer(logs: ErrorLog[]): Promise<boolean> {
    if (logs.length === 0) return true;

    try {
      const logPayloads = logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        type: log.type,
        message: log.message,
        stack: log.stack,
        context: log.context,
        deviceInfo: this.deviceInfo,
      }));

      const obj: any = {};
      obj['detail'] = logPayloads;
      const jsonString = JSON.stringify(obj);

      const response = await fetch(LOG_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonString,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send batch to server:', error);
      return false;
    }
  }

  private scheduleBatchSend() {
    if (this.batchTimer) {
      return; // Already scheduled
    }

    // Reduced interval for faster log sending during debugging
    const interval = 1000; // 1 second instead of 5 seconds
    
    this.batchTimer = setTimeout(async () => {
      this.batchTimer = null;
      if (this.pendingLogs.length > 0) {
        const logsToSend = [...this.pendingLogs];
        this.pendingLogs = []; // Clear before sending
        try {
          await this.sendBatchToServer(logsToSend);
        } catch (error) {
          // Re-add logs if send failed
          this.pendingLogs = [...logsToSend, ...this.pendingLogs];
        }
      }
    }, interval);
  }

  private async queueLogForServer(log: ErrorLog) {
    // Wait for device info to be initialized (but don't wait too long)
    if (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.pendingLogs.push(log);

    // Send immediately for all logs (no batching delay for crash debugging)
    // This ensures we capture crash logs before app dies
    const logsToSend = [...this.pendingLogs];
    this.pendingLogs = [];
    
    try {
      await this.sendBatchToServer(logsToSend);
    } catch (error) {
      // If send fails, keep logs in pending for retry
      this.pendingLogs = [...logsToSend, ...this.pendingLogs];
      // But also schedule a retry
      this.scheduleBatchSend();
    }
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private async loadLogs() {
    try {
      const stored = await AsyncStorage.getItem(ERROR_LOG_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load error logs:', error);
    }
  }

  private async saveLogs() {
    try {
      // Keep only the last MAX_ERRORS
      const logsToSave = this.logs.slice(-MAX_ERRORS);
      await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logsToSave));
      this.logs = logsToSave;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save error logs:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  subscribe(listener: (logs: ErrorLog[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  async logError(
    message: string,
    error?: Error | any,
    context?: any,
    showAlert: boolean = false
  ) {
    const errorLog: ErrorLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      message,
      stack: error?.stack || error?.toString(),
      context: context ? JSON.stringify(context, null, 2) : undefined,
      type: 'error',
    };

    this.logs.push(errorLog);
    
    // Save to AsyncStorage immediately (synchronous-like, but async)
    // This ensures logs are saved even if app crashes
    try {
      await this.saveLogs();
    } catch (saveError) {
      // If save fails, at least try to send immediately
      console.error('Failed to save log to AsyncStorage:', saveError);
    }

    // Always log to console
    console.error('ERROR LOGGED:', message, error, context);

    // Send to server (non-blocking) - but also try immediate send for critical errors
    this.queueLogForServer(errorLog).catch(err => {
      console.error('Failed to queue log for server:', err);
    });
    
    // For critical errors, try immediate send
    if (message.includes('FATAL') || message.includes('crash') || message.includes('Global Error')) {
      this.sendLogToServer(errorLog).catch(() => {
        // Ignore errors - already queued above
      });
    }

    // Show alert if requested (with longer timeout)
    if (showAlert) {
      const fullMessage = error?.message 
        ? `${message}\n\nError: ${error.message}`
        : message;
      
      // Alert.alert(
      //   'Error',
      //   fullMessage,
      //   [{ text: 'OK' }],
      //   { cancelable: true }
      // );
    }
  }

  async logWarning(message: string, context?: any) {
    const errorLog: ErrorLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      message,
      context: context ? JSON.stringify(context, null, 2) : undefined,
      type: 'warning',
    };

    this.logs.push(errorLog);
    
    // Save to AsyncStorage immediately
    try {
      await this.saveLogs();
    } catch (saveError) {
      console.error('Failed to save log to AsyncStorage:', saveError);
    }
    
    console.warn('WARNING LOGGED:', message, context);

    // Send to server (non-blocking)
    this.queueLogForServer(errorLog).catch(err => {
      console.error('Failed to queue log for server:', err);
    });
  }

  async logInfo(message: string, context?: any) {
    const errorLog: ErrorLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      message,
      context: context ? JSON.stringify(context, null, 2) : undefined,
      type: 'info',
    };

    this.logs.push(errorLog);
    
    // Save to AsyncStorage immediately
    try {
      await this.saveLogs();
    } catch (saveError) {
      console.error('Failed to save log to AsyncStorage:', saveError);
    }
    
    console.log('INFO LOGGED:', message, context);

    // Send to server (non-blocking)
    this.queueLogForServer(errorLog).catch(err => {
      console.error('Failed to queue log for server:', err);
    });
  }

  async logDebug(message: string, context?: any, showAlert: boolean = false) {
    const errorLog: ErrorLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      message,
      context: context ? JSON.stringify(context, null, 2) : undefined,
      type: 'debug',
    };

    //this.logs.push(errorLog);
    //await this.saveLogs();
    //console.log('DEBUG LOGGED:', message, context);

    // Send to server (non-blocking)
    this.queueLogForServer(errorLog).catch(err => {
      console.error('Failed to queue log for server:', err);
    });

    // Show alert if requested (with longer timeout)
    if (showAlert) {
      // Alert.alert(
      //   'DEBUG',
      //   `${message}${context ? '\n\n' + JSON.stringify(context, null, 2) : ''}`,
      //   [{ text: 'OK' }],
      //   { cancelable: true }
      // );
    }
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  async clearLogs() {
    this.logs = [];
    await AsyncStorage.removeItem(ERROR_LOG_KEY);
    this.notifyListeners();
  }

  async exportLogs(): Promise<string> {
    return JSON.stringify(this.logs, null, 2);
  }

  // Force send pending logs to server
  async flushLogs() {
    if (this.pendingLogs.length > 0) {
      const logsToSend = [...this.pendingLogs];
      this.pendingLogs = [];
      await this.sendBatchToServer(logsToSend);
    }
  }
}

export const errorLogger = ErrorLogger.getInstance();

// Global error handler
if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    errorLogger.logError(
      `Global Error Handler: ${isFatal ? 'FATAL' : 'NON-FATAL'}`,
      error,
      { isFatal },
      false // Don't show alert for global errors
    );
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

