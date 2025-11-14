import { router } from 'expo-router';
import { Alert } from 'react-native';
import { safeAsyncCall } from './crashHandler';

export const safeNavigate = async (path: any, params?: any) => {
  return await safeAsyncCall(
    async () => {
      if (params) {
        router.push({ pathname: path as any, params });
      } else {
        router.push(path as any);
      }
      return true;
    },
    'Error al navegar a la pantalla solicitada',
    (error) => {
      console.error('Error de navegación:', {
        path,
        params,
        error: error.message,
      });
      
      try {
        router.replace('/(auth)' as any);
      } catch (fallbackError) {
        console.error('Error crítico de navegación:', fallbackError);
      }
    }
  );
};

export const safeReplace = async (path: any, params?: any) => {
  return await safeAsyncCall(
    async () => {
      if (params) {
        router.replace({ pathname: path as any, params });
      } else {
        router.replace(path as any);
      }
      return true;
    },
    'Error al cambiar de pantalla',
    (error) => {
      console.error('Error de reemplazo de ruta:', {
        path,
        params,
        error: error.message,
      });
    }
  );
};

export const safeGoBack = async () => {
  return await safeAsyncCall(
    async () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(auth)' as any);
      }
      return true;
    },
    'Error al regresar a la pantalla anterior',
    (error) => {
      console.error('Error al ir atrás:', error.message);
      try {
        router.replace('/(auth)' as any);
      } catch (fallbackError) {
        console.error('Error crítico de navegación hacia atrás:', fallbackError);
      }
    }
  );
};

export const safeDeepLink = async (url: string) => {
  return await safeAsyncCall(
    async () => {
      const allowedPaths = [
        '/(auth)',
        '/(ciudadano)',
        '/(autoridad)',
        '/(admin)',
        '/reset-password',
      ];
      
      const isValidPath = allowedPaths.some(path => url.startsWith(path));
      
      if (!isValidPath) {
        throw new Error(`Ruta no válida: ${url}`);
      }
      
      router.push(url as any);
      return true;
    },
    'Error al procesar el enlace',
    (error) => {
      console.error('Error de enlace profundo:', {
        url,
        error: error.message,
      });
      
      Alert.alert(
        'Enlace No Válido',
        'El enlace que intentas abrir no es válido o no está disponible.',
        [
          {
            text: 'Ir al Inicio',
            onPress: () => safeReplace('/(auth)')
          }
        ]
      );
    }
  );
};

export const useNavigationSafety = () => {
  const navigate = safeNavigate;
  const replace = safeReplace;
  const goBack = safeGoBack;
  const deepLink = safeDeepLink;
  
  return {
    navigate,
    replace,
    goBack,
    deepLink,
  };
};