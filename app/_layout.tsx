import { Slot } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { optimizePerformance, setupPerformanceMonitoring } from '../utils/appStability';
import { checkAppHealth, setupGlobalErrorHandler } from '../utils/crashHandler';

export default function RootLayout() {
  useEffect(() => {
    // Configurar el manejo de errores al iniciar la aplicación
    setupGlobalErrorHandler();
    
    // Configurar monitoreo de rendimiento
    setupPerformanceMonitoring();
    
    // Verificar el estado inicial de la aplicación
    checkAppHealth();
    
    // Optimización inicial
    optimizePerformance();
    
    // Verificar el estado periódicamente (cada 5 minutos)
    const healthCheckInterval = setInterval(() => {
      const health = checkAppHealth();
      if (health.memoryWarning) {

        optimizePerformance();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, []);

  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}