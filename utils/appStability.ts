import { AppState, Dimensions, Platform } from 'react-native';
import { forceGarbageCollection } from './crashHandler';

export const SAFE_TIMEOUTS = {
  DATABASE_QUERY: 15000,
  API_REQUEST: 10000,
  USER_INPUT: 5000,
  NAVIGATION: 3000,
  IMAGE_LOAD: 8000,
};

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  BACKOFF_MULTIPLIER: 2,
};

export const PERFORMANCE_LIMITS = {
  MAX_MEMORY_MB: 200,
  MAX_CACHE_SIZE: 50,
  GC_INTERVAL_MS: 5 * 60 * 1000,
  HEALTH_CHECK_INTERVAL: 2 * 60 * 1000,
};

let appHealthStatus = {
  isLowMemory: false,
  lastGCTime: Date.now(),
  crashCount: 0,
  errorCount: 0,
};

export const setupPerformanceMonitoring = () => {
  AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      console.log('App regresó al primer plano');
      checkAndCleanMemory();
    } else if (nextAppState === 'background') {
      console.log('App pasó a segundo plano');
      forceGarbageCollection();
    }
  });

  setInterval(() => {
    checkAndCleanMemory();
  }, PERFORMANCE_LIMITS.HEALTH_CHECK_INTERVAL);

  setInterval(() => {
    forceGarbageCollection();
    appHealthStatus.lastGCTime = Date.now();
  }, PERFORMANCE_LIMITS.GC_INTERVAL_MS);
};

export const checkAndCleanMemory = () => {
  try {
    const { width, height } = Dimensions.get('window');
    const screenPixels = width * height;
    
    const isLowEndDevice = screenPixels < 800 * 600;
    
    if (isLowEndDevice) {
      appHealthStatus.isLowMemory = true;
    }

    const timeSinceLastGC = Date.now() - appHealthStatus.lastGCTime;
    if (timeSinceLastGC > PERFORMANCE_LIMITS.GC_INTERVAL_MS) {
      forceGarbageCollection();
      appHealthStatus.lastGCTime = Date.now();
    }

    return appHealthStatus;
  } catch (error) {
    return appHealthStatus;
  }
};

export const safeTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage || `Operación cancelada por timeout (${timeoutMs}ms)`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.MAX_RETRIES,
  initialDelay: number = RETRY_CONFIG.RETRY_DELAY
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        appHealthStatus.errorCount++;
        throw lastError;
      }
      
      const delay = initialDelay * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt);
      console.log(`Reintentando operación en ${delay}ms (intento ${attempt + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

export const safeDatabaseOperation = async <T>(
  operation: () => Promise<T>,
  operationName?: string
): Promise<T> => {
  const wrappedOperation = async () => {
    return await safeTimeout(
      operation(),
      SAFE_TIMEOUTS.DATABASE_QUERY,
      `Timeout en operación de base de datos: ${operationName}`
    );
  };

  return await retryWithBackoff(
    wrappedOperation,
    2,
    1500
  );
};

export const optimizePerformance = () => {
  try {
    forceGarbageCollection();
    
    if (Date.now() - appHealthStatus.lastGCTime > 10 * 60 * 1000) {
      appHealthStatus.errorCount = Math.max(0, appHealthStatus.errorCount - 1);
      appHealthStatus.crashCount = Math.max(0, appHealthStatus.crashCount - 1);
    }
    
    console.log('Optimización de rendimiento ejecutada');
    return true;
  } catch (error) {
    console.warn('Error durante optimización:', error);
    return false;
  }
};

export const getHealthStats = () => {
  return {
    ...appHealthStatus,
    platform: Platform.OS,
    version: Platform.Version,
    isLowEndDevice: appHealthStatus.isLowMemory,
    timeSinceLastGC: Date.now() - appHealthStatus.lastGCTime,
    needsOptimization: appHealthStatus.errorCount > 5 || appHealthStatus.crashCount > 2,
  };
};