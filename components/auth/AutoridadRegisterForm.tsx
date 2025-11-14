import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { existeUsuario, insertarUsuario } from '../../DB/supabase';
import { hashPassword } from '../../utils/crypto';
import { getErrorMessage } from '../../utils/errors';
import Button from '../common/Button';

const AutoridadRegisterForm = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [jurisdiccion, setJurisdiccion] = useState('');
  const [loading, setLoading] = useState(false);

  // Opciones de jurisdicción predefinidas - municipios y áreas de Jalisco
  const jurisdicciones = [
    { label: 'Seleccionar jurisdicción...', value: '' },
    { label: 'Guadalajara', value: 'Guadalajara' },
    { label: 'Tlajomulco de Zúñiga', value: 'Tlajomulco de Zúñiga' },
    { label: 'Zapopan', value: 'Zapopan' },
    { label: 'Tonalá', value: 'Tonalá' },
    { label: 'Tlaquepaque', value: 'Tlaquepaque' },
    { label: 'El Salto', value: 'El Salto' },
    { label: 'Zona Metropolitana de Guadalajara', value: 'Zona Metropolitana de Guadalajara' },
    { label: 'Jalisco (Estatal)', value: 'Jalisco' },
    { label: 'Federal', value: 'Federal' },
    { label: 'Otra', value: 'Otra' },
  ];

  // Función para validar la seguridad de la contraseña
  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;
    
    return {
      requirements,
      score,
      isValid: score === 5
    };
  };

  const passwordValidation = validatePassword(password);

  const getPasswordStrength = () => {
    if (password.length === 0) return { text: '', color: '#bdc3c7' };
    
    switch (passwordValidation.score) {
      case 1:
      case 2:
        return { text: 'Muy débil', color: '#e74c3c' };
      case 3:
        return { text: 'Débil', color: '#f39c12' };
      case 4:
        return { text: 'Casi segura', color: '#f1c40f' };
      case 5:
        return { text: '¡Muy segura!', color: '#27ae60' };
      default:
        return { text: 'Muy débil', color: '#e74c3c' };
    }
  };

  const handleRegister = async () => {
    // Validaciones básicas
    if (!firstName || !lastName || !email || !password || !confirmPassword || !institucion || !jurisdiccion) {
      Alert.alert('Error', 'Todos los campos marcados con * son obligatorios');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Ingresa un email válido');
      return;
    }

    if (!passwordValidation.isValid) {
      Alert.alert(
        'Contraseña insegura', 
        'Tu contraseña debe cumplir todos los requisitos de seguridad.'
      );
      return;
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      // Verificar si el usuario ya existe
      const usuarioExiste = await existeUsuario(email.trim());
      
      if (usuarioExiste) {
        Alert.alert('Error', 'Ya existe un usuario con este email');
        setLoading(false);
        return;
      }

      // Hash de la contraseña
      const password_hash = await hashPassword(password);
      
      // Combinar nombre y apellido
      const nombreCompleto = `${firstName.trim()} ${lastName.trim()}`;
      
      // Insertar usuario autoridad
      const resultado = await insertarUsuario(
        nombreCompleto,
        email.trim(),
        password_hash,
        'autoridad',
        telefono.trim(),
        institucion.trim(),
        jurisdiccion
      );

      if (resultado.success) {
        Alert.alert(
          '¡Registro de Autoridad Exitoso! 🎉', 
          `Bienvenido ${firstName}!\n\nTu cuenta de autoridad ha sido creada y está pendiente de verificación por el administrador. Recibirás notificación cuando puedas acceder al sistema.`,
          [
            {
              text: 'Entendido',
              onPress: () => router.push('/(auth)'),
            }
          ]
        );
      } else {
        Alert.alert('Error de registro', resultado.error || 'Error desconocido');
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/(auth)');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Registrando autoridad...</Text>
      </View>
    );
  }

  const strengthInfo = getPasswordStrength();

  return (
    <ScrollView 
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>Registro de Autoridad</Text>
      <Text style={styles.subtitulo}>Acceso institucional para búsqueda y seguimiento de casos</Text>
      
      <View style={styles.formContainer}>
        {/* Campos de nombre */}
        <View style={styles.nameRow}>
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="Nombre(s) *"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="Apellido(s) *"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Email institucional *"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Teléfono de contacto"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Institución/Organización *"
          value={institucion}
          onChangeText={setInstitucion}
          autoCapitalize="words"
          multiline={true}
          numberOfLines={2}
        />

        {/* Selector de jurisdicción */}
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Jurisdicción *</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={jurisdiccion}
              onValueChange={(itemValue) => setJurisdiccion(itemValue)}
              style={styles.picker}
            >
              {jurisdicciones.map((item, index) => (
                <Picker.Item key={index} label={item.label} value={item.value} />
              ))}
            </Picker>
          </View>
        </View>
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Contraseña *"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          
          {/* Indicador de fuerza de contraseña */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <Text style={[styles.strengthText, { color: strengthInfo.color }]}>
                Seguridad: {strengthInfo.text}
              </Text>
              <View style={styles.strengthBar}>
                <View 
                  style={[
                    styles.strengthFill, 
                    { 
                      width: `${(passwordValidation.score / 5) * 100}%`,
                      backgroundColor: strengthInfo.color 
                    }
                  ]} 
                />
              </View>
            </View>
          )}

          {/* Requisitos de contraseña */}
          {password.length > 0 && (
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Requisitos de seguridad:</Text>
              
              <View style={styles.requirement}>
                <Text style={[styles.requirementIcon, { color: passwordValidation.requirements.length ? '#27ae60' : '#e74c3c' }]}>
                  {passwordValidation.requirements.length ? '✓' : '✗'}
                </Text>
                <Text style={[styles.requirementText, { color: passwordValidation.requirements.length ? '#27ae60' : '#7f8c8d' }]}>
                  Mínimo 8 caracteres
                </Text>
              </View>

              <View style={styles.requirement}>
                <Text style={[styles.requirementIcon, { color: passwordValidation.requirements.uppercase ? '#27ae60' : '#e74c3c' }]}>
                  {passwordValidation.requirements.uppercase ? '✓' : '✗'}
                </Text>
                <Text style={[styles.requirementText, { color: passwordValidation.requirements.uppercase ? '#27ae60' : '#7f8c8d' }]}>
                  Al menos una mayúscula (A-Z)
                </Text>
              </View>

              <View style={styles.requirement}>
                <Text style={[styles.requirementIcon, { color: passwordValidation.requirements.lowercase ? '#27ae60' : '#e74c3c' }]}>
                  {passwordValidation.requirements.lowercase ? '✓' : '✗'}
                </Text>
                <Text style={[styles.requirementText, { color: passwordValidation.requirements.lowercase ? '#27ae60' : '#7f8c8d' }]}>
                  Al menos una minúscula (a-z)
                </Text>
              </View>

              <View style={styles.requirement}>
                <Text style={[styles.requirementIcon, { color: passwordValidation.requirements.number ? '#27ae60' : '#e74c3c' }]}>
                  {passwordValidation.requirements.number ? '✓' : '✗'}
                </Text>
                <Text style={[styles.requirementText, { color: passwordValidation.requirements.number ? '#27ae60' : '#7f8c8d' }]}>
                  Al menos un número (0-9)
                </Text>
              </View>

              <View style={styles.requirement}>
                <Text style={[styles.requirementIcon, { color: passwordValidation.requirements.special ? '#27ae60' : '#e74c3c' }]}>
                  {passwordValidation.requirements.special ? '✓' : '✗'}
                </Text>
                <Text style={[styles.requirementText, { color: passwordValidation.requirements.special ? '#27ae60' : '#7f8c8d' }]}>
                  Al menos un símbolo (!@#$%^&*)
                </Text>
              </View>
            </View>
          )}
        </View>
        
        <TextInput
          style={[
            styles.input,
            confirmPassword.length > 0 && password !== confirmPassword && styles.inputError
          ]}
          placeholder="Confirmar Contraseña *"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        {/* Mensaje de error si las contraseñas no coinciden */}
        {confirmPassword.length > 0 && password !== confirmPassword && (
          <Text style={styles.errorText}>Las contraseñas no coinciden</Text>
        )}
        
        <Button 
          title="Registrar Autoridad" 
          onPress={handleRegister}
          disabled={!passwordValidation.isValid || password !== confirmPassword || !firstName || !lastName || !email || !institucion || !jurisdiccion}
          style={styles.submitButton}
        />
        
        <TouchableOpacity onPress={handleBackToLogin} style={styles.linkButton}>
          <Text style={styles.linkText}>← Volver al login</Text>
        </TouchableOpacity>
      </View>

      {/* Información adicional */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          ⚠️ <Text style={styles.infoTextBold}>Importante:</Text> Las cuentas de autoridad requieren verificación manual del administrador antes de poder acceder al sistema.
        </Text>
        <Text style={styles.infoText}>
          🔍 Una vez verificada, tendrás acceso completo a herramientas de seguimiento y coordinación de búsquedas.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  titulo: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  subtitulo: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#7f8c8d',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
  },
  nameInput: {
    flex: 1,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 5,
    fontWeight: '600',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  passwordContainer: {
    marginBottom: 15,
  },
  strengthContainer: {
    marginBottom: 10,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#ecf0f1',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  requirementsContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  requirementIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 25,
  },
  requirementText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#e74c3c',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#e74c3c',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  infoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  infoText: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },
  infoTextBold: {
    fontWeight: 'bold',
  },
});

export default AutoridadRegisterForm;