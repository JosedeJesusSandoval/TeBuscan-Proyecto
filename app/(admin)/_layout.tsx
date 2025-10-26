import { Stack } from 'expo-router';
import React from 'react';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          title: 'Dashboard Admin',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="usuarios" 
        options={{ 
          title: 'Gestión de Usuarios',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="crear-usuario" 
        options={{ 
          title: 'Crear Usuario',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="configuracion" 
        options={{ 
          title: 'Configuración',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="reportes" 
        options={{ 
          title: 'Todos los Reportes',
          headerShown: true 
        }} 
      />
    </Stack>
  );
}