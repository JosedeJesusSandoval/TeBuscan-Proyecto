import { Stack } from 'expo-router';
import React from 'react';

export default function AutoridadLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="panel" 
        options={{ 
          title: 'Panel de Autoridad',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="casos" 
        options={{ 
          title: 'Gestión de Casos',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="estadisticas" 
        options={{ 
          title: 'Estadísticas',
          headerShown: true 
        }} 
      />
    </Stack>
  );
}