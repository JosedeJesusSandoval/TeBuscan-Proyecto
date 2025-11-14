import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { obtenerInfoAutoridad, obtenerReportes, obtenerTodosLosReportes } from '../DB/supabase';
import { useAuth } from '../context/AuthContext';

const DebugAutoridad = () => {
  const { user } = useAuth();
  const [autoridad, setAutoridad] = useState<any>(null);
  const [reportes, setReportes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const diagnosticar = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'No hay usuario logueado');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 === DEBUG AUTORIDAD ===');
      console.log('👤 Usuario logueado:', user);

      // 1. Verificar información de autoridad
      const infoResult = await obtenerInfoAutoridad(user.id);
      console.log('📋 Info autoridad:', infoResult);
      setAutoridad(infoResult.data);

      // 2. Verificar todos los reportes
      const todosReportes = await obtenerTodosLosReportes();
      console.log('📊 Todos los reportes:', todosReportes);
      
      if (todosReportes.success && todosReportes.data) {
        setReportes(todosReportes.data);
        console.log('✅ Reportes cargados:', todosReportes.data.length);
      }

      // 3. Mostrar resumen
      Alert.alert(
        'Diagnóstico Completo',
        `Usuario: ${user.name}\n` +
        `ID: ${user.id}\n` +
        `Autoridad Info: ${infoResult.success ? '✅' : '❌'}\n` +
        `Jurisdicción: ${infoResult.data?.jurisdiccion || 'No definida'}\n` +
        `Institución: ${infoResult.data?.institucion || 'No definida'}\n` +
        `Total Reportes: ${todosReportes.data?.length || 0}`
      );

    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      Alert.alert('Error', 'Error en diagnóstico: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const verificarEstructuraDB = async () => {
    try {
      // Verificar si podemos obtener reportes básicos
      const reportesBasicos = await obtenerReportes();
      console.log('🗃️ Reportes básicos:', reportesBasicos);
      
      Alert.alert(
        'Estructura DB',
        `Función obtenerReportes: ${reportesBasicos.success ? '✅' : '❌'}\n` +
        `Error: ${reportesBasicos.error || 'Ninguno'}\n` +
        `Datos: ${reportesBasicos.data ? 'Presentes' : 'Ausentes'}`
      );
    } catch (error) {
      console.error('Error verificando DB:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🛠️ Debug Autoridad</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Usuario Actual</Text>
          <Text style={styles.info}>ID: {user?.id || 'No disponible'}</Text>
          <Text style={styles.info}>Nombre: {user?.name || 'No disponible'}</Text>
          <Text style={styles.info}>Rol: {user?.rol || 'No disponible'}</Text>
        </View>

        {autoridad && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏛️ Información Autoridad</Text>
            <Text style={styles.info}>Institución: {autoridad.institucion || 'No definida'}</Text>
            <Text style={styles.info}>Jurisdicción: {autoridad.jurisdiccion || 'No definida'}</Text>
            <Text style={styles.info}>Rol: {autoridad.rol || 'No definido'}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Reportes</Text>
          <Text style={styles.info}>Total encontrados: {reportes.length}</Text>
          {reportes.slice(0, 3).map((reporte, index) => (
            <View key={index} style={styles.reporteItem}>
              <Text style={styles.reporteText}>
                • {reporte.nombre_desaparecido} - {reporte.estatus}
              </Text>
              <Text style={styles.reporteUbicacion}>
                📍 {reporte.ultima_ubicacion || 'Sin ubicación'}
              </Text>
            </View>
          ))}
          {reportes.length > 3 && (
            <Text style={styles.info}>... y {reportes.length - 3} más</Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={diagnosticar}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '⏳ Diagnosticando...' : '🔍 Ejecutar Diagnóstico'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={verificarEstructuraDB}
          >
            <Text style={styles.buttonText}>🗃️ Verificar DB</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>ℹ️ Instrucciones</Text>
          <Text style={styles.infoBoxText}>
            1. Presiona "Ejecutar Diagnóstico" para verificar toda la configuración{'\n'}
            2. Revisa la consola del navegador para logs detallados{'\n'}
            3. Si no aparecen reportes, verifica que existan en la base de datos{'\n'}
            4. Asegúrate de que el usuario tenga rol 'autoridad'
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
    marginBottom: 30,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    paddingBottom: 5,
  },
  info: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  reporteItem: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  reporteText: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '500',
  },
  reporteUbicacion: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  buttonContainer: {
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#e8f5e8',
    borderRadius: 10,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
});

export default DebugAutoridad;