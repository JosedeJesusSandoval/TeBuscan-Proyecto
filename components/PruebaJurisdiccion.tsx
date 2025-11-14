import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { insertarUsuario } from '../DB/supabase';
import { hashPassword } from '../utils/crypto';

const PruebaJurisdiccion = () => {
  const valoresPrueba = [
    'Guadalajara',
    'Tlajomulco de Zúñiga', 
    'Zapopan',
    'Tonalá',
    'Tlaquepaque',
    'El Salto',
    'Zona Metropolitana de Guadalajara',
    'Jalisco',
    'Federal',
    'Municipal',
    'Estatal',
    'Nacional',
    'Regional',
    'Local'
  ];

  const probarValor = async (valor: string) => {
    try {
      const testEmail = `test-${valor.toLowerCase().replace(/[\s]/g, '-').replace(/[ñü]/g, 'n')}${Date.now()}@example.com`;
      const password_hash = await hashPassword('TestPassword123!');
      
      const resultado = await insertarUsuario(
        'Usuario Test',
        testEmail,
        password_hash,
        'autoridad',
        '1234567890',
        'Institución Test',
        valor
      );

      if (resultado.success) {
        Alert.alert('✅ Éxito', `"${valor}" es un valor VÁLIDO`);
      } else {
        if (resultado.error && resultado.error.includes('check_jurisdiccipon_valida')) {
          Alert.alert('❌ Error de Constraint', `"${valor}" NO es válido según la restricción de BD`);
        } else {
          Alert.alert('⚠️ Otro Error', `"${valor}": ${resultado.error}`);
        }
      }
    } catch (error) {
      Alert.alert('💥 Error', `Error probando "${valor}": ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🧪 Prueba de Valores de Jurisdicción</Text>
        <Text style={styles.subtitle}>
          Toca cualquier valor para probarlo en la base de datos
        </Text>
        
        <View style={styles.buttonContainer}>
          {valoresPrueba.map((valor, index) => (
            <TouchableOpacity
              key={index}
              style={styles.testButton}
              onPress={() => probarValor(valor)}
            >
              <Text style={styles.buttonText}>{valor}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>ℹ️ Información:</Text>
          <Text style={styles.infoText}>
            • ✅ = Valor aceptado por la base de datos{'\n'}
            • ❌ = Valor rechazado por constraint{'\n'}
            • ⚠️ = Otro tipo de error{'\n\n'}
            Este componente es solo para pruebas. Puedes eliminarlo después.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  testButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
});

export default PruebaJurisdiccion;