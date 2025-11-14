import { Alert } from 'react-native';

declare const global: any;
declare const performance: any;
declare const navigator: any;

export const setupGlobalErrorHandler = () => {
  try {
    if (global.ErrorUtils && typeof global.ErrorUtils.setGlobalHandler === 'function') {
      const defaultHandler = global.ErrorUtils.getGlobalHandler();
      
      global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        console.error('Error global capturado:', {
          message: error.message,
          stack: error.stack,
          isFatal: isFatal,
          timestamp: new Date().toISOString(),
        });

        if (isFatal) {
          Alert.alert(
            'Error Crítico',
            `La aplicación encontró un problema:\n\n${error.message}\n\nSe reiniciará automáticamente.`,
            [
              {
                text: 'Reiniciar',
                onPress: () => {
                  setTimeout(() => {
                    defaultHandler(error, isFatal);
                  }, 1000);
                }
              }
            ],
            { cancelable: false }
          );
        } else {
          console.warn('Error no fatal:', error.message);
        }
      });
    }

    if (global.HermesInternal || global.__DEV__) {
      const originalConsoleError = console.error;
      console.error = (...args: any[]) => {
        const errorString = args.join(' ');
        
        if (errorString.includes('Unhandled promise rejection') || 
            errorString.includes('Network request failed') ||
            errorString.includes('Timeout') ||
            errorString.includes('Connection failed') ||
            errorString.includes('Task orphaned') ||
            errorString.includes('Possible Unhandled Promise Rejection')) {
          
          console.warn('Error crítico detectado:', errorString);
          
          setTimeout(() => {
            Alert.alert(
              'Error de Conectividad',
              'Se detectó un problema de red. La aplicación continuará funcionando, pero algunas funciones pueden estar limitadas.',
              [
                { 
                  text: 'Entendido',
                  onPress: () => {
                    forceGarbageCollection();
                  }
                }
              ]
            );
          }, 500);
        }
        
        if (errorString.includes('React') || 
            errorString.includes('Component') ||
            errorString.includes('render') ||
            errorString.includes('setState')) {
          
          console.warn('Error de React detectado:', errorString);
          
          setTimeout(() => {
            Alert.alert(
              'Error de Interfaz',
              'Se detectó un problema en la interfaz. Si persiste, reinicia la aplicación.',
              [{ text: 'Entendido' }]
            );
          }, 500);
        }
        
        originalConsoleError.apply(console, args);
      };
    }
  } catch (setupError) {
    console.warn('No se pudo configurar el handler de errores:', setupError);
  }
};

export const reportError = (error: Error, context?: string) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context: context,
    timestamp: new Date().toISOString(),
  };

  console.error('Error reportado:', errorInfo);
};

export const safeAsyncCall = async <T>(
  asyncFunction: () => Promise<T>,
  errorMessage?: string,
  onError?: (error: Error) => void
): Promise<T | null> => {
  try {
    return await asyncFunction();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    
    console.error('Error capturado:', {
      message: err.message,
      customMessage: errorMessage,
      stack: err.stack,
    });

    if (onError) {
      onError(err);
    } else {
      Alert.alert(
        'Error',
        errorMessage || err.message || 'Ocurrió un error inesperado',
        [{ text: 'Entendido' }]
      );
    }

    return null;
  }
};

export const checkAppHealth = () => {
  const healthStatus = {
    timestamp: new Date().toISOString(),
    memoryWarning: false,
    platform: 'react-native',
  };

  try {
    if (typeof performance !== 'undefined' && performance.memory) {
      const memory = performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
      
      healthStatus.memoryWarning = (usedMB / limitMB) > 0.8;
    }
  } catch (e) {
  }

  if (healthStatus.memoryWarning) {
    console.warn('Advertencia: Uso alto de memoria detectado');
  }

  return healthStatus;
};

export const forceGarbageCollection = () => {
  try {
    if (global.gc && typeof global.gc === 'function') {
      global.gc();
    }
  } catch (e) {
  }
};