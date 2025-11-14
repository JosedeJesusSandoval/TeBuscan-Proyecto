import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { verificarLogin } from '../../DB/supabase';
import Button from '../common/Button';


const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser } = useAuth();
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email y contraseña son obligatorios');
      return;
    }

    setLoading(true);

    try {
      console.log('Intentando login para:', email);

      const resultado = await verificarLogin(email.trim(), password); // Enviar contraseña sin hashear

      if (resultado.success && resultado.usuario) {
        const {id, rol, name, email: userEmail } = resultado.usuario;

      setUser({
        id,
        name,
        email: userEmail,
        rol,
      });

        Alert.alert('¡Bienvenido!', `Hola ${name}`, [
          {
            text: 'Continuar',
            onPress: () => {
              // Redireccionar según el rol
              switch (rol) {
                case 'ciudadano':
                  router.replace('/(ciudadano)/home');
                  break;
                case 'autoridad':
                  router.replace('/(autoridad)/panel');
                  break;
                case 'admin':
                  router.replace('/(admin)/dashboard');
                  break;
                default:
                  router.replace('/(ciudadano)/home');
              }
            },
          },
        ]);
      } else {
        Alert.alert('Error de login', resultado.error || 'Usuario o contraseña incorrectos');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      Alert.alert('Error', errorMessage);
      console.error('Error en login:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/(auth)/registro-tipo');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Iniciando sesión...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Iniciar Sesión</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <Button title="Ingresar" onPress={handleLogin} />

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleRegister} style={styles.linkButton}>
          <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  titulo: {
    fontSize: 28,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'white',
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkButton: {
    marginVertical: 8,
  },
  linkText: {
    color: '#3498db',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },

  // ESTILOS PARA SECCIÓN DE PRUEBAS
  testSection: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#ecf0f1',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#f39c12',
    borderStyle: 'dashed',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#e67e22',
  },
  testButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  testButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  testCiudadano: {
    backgroundColor: '#3498db',
  },
  testAutoridad: {
    backgroundColor: '#e74c3c',
  },
  testAdmin: {
    backgroundColor: '#9b59b6',
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  testNote: {
    fontSize: 12,
    textAlign: 'center',
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
});

export default LoginForm;