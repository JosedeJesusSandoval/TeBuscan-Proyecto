// Configuración de estabilidad para la aplicación TeBuscan

import { AppState, Dimensions, Platform } from 'react-native';
import { forceGarbageCollection } from './crashHandler';

// Configuración de timeouts seguros
export const SAFE_TIMEOUTS = {
  DATABASE_QUERY: 15000, // 15 segundos para consultas de BD
  API_REQUEST: 10000, // 10 segundos para requests API
  USER_INPUT: 5000, // 5 segundos para validaciones de input
  NAVIGATION: 3000, // 3 segundos para navegación
  IMAGE_LOAD: 8000, // 8 segundos para carga de imágenes
};

// Configuración de reintentos
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo inicial
  BACKOFF_MULTIPLIER: 2,
};

// Límites de memoria y rendimiento
export const PERFORMANCE_LIMITS = {
  MAX_MEMORY_MB: 200, // MB máximos recomendados
  MAX_CACHE_SIZE: 50, // Elementos en cache
  GC_INTERVAL_MS: 5 * 60 * 1000, // Garbage collection cada 5 minutos
  HEALTH_CHECK_INTERVAL: 2 * 60 * 1000, // Verificar salud cada 2 minutos
};

// Estado de la aplicación
let appHealthStatus = {
  isLowMemory: false,
  lastGCTime: Date.now(),
  crashCount: 0,
  errorCount: 0,
};

// Función para configurar monitoreo de rendimiento
export const setupPerformanceMonitoring = () => {
  // Monitorear cambios de estado de la app
  AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      console.log('📱 App regresó al primer plano');
      // Verificar salud al regresar
      checkAndCleanMemory();
    } else if (nextAppState === 'background') {
      console.log('📱 App pasó a segundo plano');
      // Limpiar memoria antes de ir al background
      forceGarbageCollection();
    }
  });

  // Monitoreo periódico de memoria
  setInterval(() => {
    checkAndCleanMemory();
  }, PERFORMANCE_LIMITS.HEALTH_CHECK_INTERVAL);

  // Garbage collection periódico
  setInterval(() => {
    forceGarbageCollection();
    appHealthStatus.lastGCTime = Date.now();
  }, PERFORMANCE_LIMITS.GC_INTERVAL_MS);
};

// Función para verificar y limpiar memoria
export const checkAndCleanMemory = () => {
  try {
    // Verificar si estamos en un dispositivo con poca memoria
    const { width, height } = Dimensions.get('window');
    const screenPixels = width * height;
    
    // Dispositivos con resoluciones bajas pueden tener menos memoria
    const isLowEndDevice = screenPixels < 800 * 600; // Menos de 480k pixeles
    
    if (isLowEndDevice) {
      appHealthStatus.isLowMemory = true;
      console.log('⚠️ Dispositivo de bajos recursos detectado');
    }

    // Forzar garbage collection si ha pasado mucho tiempo
    const timeSinceLastGC = Date.now() - appHealthStatus.lastGCTime;
    if (timeSinceLastGC > PERFORMANCE_LIMITS.GC_INTERVAL_MS) {
      forceGarbageCollection();
      appHealthStatus.lastGCTime = Date.now();
    }

    return appHealthStatus;
  } catch (error) {
    console.warn('⚠️ Error verificando memoria:', error);
    return appHealthStatus;
  }
};

// Función para timeout seguro con abort
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

// Función para reintentos con backoff
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
      
      // Calcular delay con backoff exponencial
      const delay = initialDelay * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt);
      console.log(`⏳ Reintentando operación en ${delay}ms (intento ${attempt + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Función para operaciones de base de datos seguras
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
    2, // Solo 2 reintentos para operaciones de BD
    1500 // 1.5 segundos de delay inicial
  );
};

// Función para limpiar caches y optimizar rendimiento
export const optimizePerformance = () => {
  try {
    // Limpiar memoria
    forceGarbageCollection();
    
    // Resetear contadores de errores si han pasado 10 minutos sin errores
    if (Date.now() - appHealthStatus.lastGCTime > 10 * 60 * 1000) {
      appHealthStatus.errorCount = Math.max(0, appHealthStatus.errorCount - 1);
      appHealthStatus.crashCount = Math.max(0, appHealthStatus.crashCount - 1);
    }
    
    console.log('🧹 Optimización de rendimiento ejecutada');
    return true;
  } catch (error) {
    console.warn('⚠️ Error durante optimización:', error);
    return false;
  }
};

// Función para obtener estadísticas de salud de la app
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