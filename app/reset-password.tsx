import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ResetPassword from '../components/auth/ResetPassword';
import { supabase } from '../DB/supabase';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams();
  const [isValidToken, setIsValidToken] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay una sesión activa con el token
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          setIsValidToken(true);
        } else {
          // Si hay token en los parámetros, intentar establecer la sesión
          if (token) {
            const { data, error } = await supabase.auth.setSession({
              access_token: token as string,
              refresh_token: '', // Supabase lo manejará automáticamente
            });
            
            if (data.session && !error) {
              setIsValidToken(true);
            }
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [token]);

  const handlePasswordReset = () => {
    // Limpiar la sesión después del reset
    supabase.auth.signOut();
    router.replace('/(auth)');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Aquí puedes agregar un loading indicator */}
      </View>
    );
  }

  if (!isValidToken) {
    // Redirigir al login si el token no es válido
    router.replace('/(auth)');
    return null;
  }

  return (
    <View style={styles.container}>
      <ResetPassword onPasswordReset={handlePasswordReset} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});