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
    </Stack>
  );
}