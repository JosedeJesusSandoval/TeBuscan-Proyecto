import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { crearUsuarioAuth, diagnosticarConfiguracion, enviarRecuperacionContrasena } from '../../DB/supabase';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendResetEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Iniciando proceso de recuperación...');
      const result = await enviarRecuperacionContrasena(email.trim().toLowerCase());

      if (result.success) {
        setEmailSent(true);
        Alert.alert(
          'Correo enviado',
          'Se ha enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada y spam.',
          [{ text: 'OK' }]
        );
      } else {
        console.log('❌ Error en recuperación:', result.error);
        Alert.alert('Error', result.error || 'Error al enviar el correo de recuperación');
      }
    } catch (error) {
      console.error('💥 Error inesperado al enviar correo de recuperación:', error);
      Alert.alert('Error', 'Error de conexión. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnostico = async () => {
    console.log('🔧 Iniciando diagnóstico...');
    const diagnostico = await diagnosticarConfiguracion();
    
    Alert.alert(
      'Diagnóstico de Configuración',
      `URL: ${diagnostico.url ? '✅' : '❌'}\nKey: ${diagnostico.key ? '✅' : '❌'}\nConexión: ${diagnostico.connection ? '✅' : '❌'}\n\n${diagnostico.error || 'Revisa la consola para más detalles'}`,
      [{ text: 'OK' }]
    );
  };

  const handleTestUsuario = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Ingresa un email primero');
      return;
    }

    try {
      setLoading(true);
      console.log('🧪 Creando usuario de prueba...');
      
      const result = await crearUsuarioAuth(email.trim().toLowerCase(), 'TempPassword123!');
      
      if (result.success) {
        Alert.alert(
          'Usuario de Prueba',
          'Usuario creado en Supabase Auth. Ahora intenta la recuperación de contraseña.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error al crear usuario', result.error);
      }
    } catch (error) {
      console.error('Error en test de usuario:', error);
      Alert.alert('Error', 'Error al crear usuario de prueba');
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setEmail('');
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          <Text style={styles.successTitle}>¡Correo enviado!</Text>
          <Text style={styles.successText}>
            Hemos enviado un enlace de recuperación a:
          </Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.instructionText}>
            Revisa tu bandeja de entrada y sigue las instrucciones del correo.
          </Text>
          
          <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
            <Text style={styles.tryAgainText}>Usar otro correo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.backButton} onPress={onBackToLogin}>
            <Ionicons name="arrow-back" size={20} color="#007AFF" />
            <Text style={styles.backText}>Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButtonHeader} onPress={onBackToLogin}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Recuperar Contraseña</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed-outline" size={60} color="#007AFF" />
          </View>

          <Text style={styles.subtitle}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.description}>
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSendResetEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.sendButtonText}>Enviar enlace de recuperación</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Botones de diagnóstico - Solo para desarrollo */}
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>🔧 Herramientas de Diagnóstico</Text>
            
            <TouchableOpacity
              style={styles.debugButton}
              onPress={handleDiagnostico}
            >
              <Text style={styles.debugButtonText}>Verificar Configuración</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.debugButton}
              onPress={handleTestUsuario}
              disabled={loading}
            >
              <Text style={styles.debugButtonText}>
                Crear Usuario de Prueba en Supabase Auth
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Recordaste tu contraseña?</Text>
            <TouchableOpacity onPress={onBackToLogin}>
              <Text style={styles.loginLink}>Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButtonHeader: {
    padding: 10,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 30,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 5,
  },
  // Estilos para pantalla de éxito
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  successText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  tryAgainButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  tryAgainText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 5,
  },
  // Estilos para sección de debug
  debugSection: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
    textAlign: 'center',
  },
  debugButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ForgotPassword;
