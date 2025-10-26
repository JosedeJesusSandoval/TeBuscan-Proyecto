import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../DB/supabase'; 

export default function AdminDashboard() {
  const [totalCiudadanos, setTotalCiudadanos] = useState(0);
  const [reportesActivos, setReportesActivos] = useState(0);
  const [totalAutoridades, setTotalAutoridades] = useState(0);

  useEffect(() => {
    // Obtener el total de usuarios con rol "ciudadano"
    const fetchTotalCiudadanos = async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id', { count: 'exact' })
        .eq('rol', 'ciudadano');
      if (!error) setTotalCiudadanos(data.length || 0);
    };

    // Obtener el total de reportes activos con estatus "desaparecido"
    const fetchReportesActivos = async () => {
      const { data, error } = await supabase
        .from('reportes')
        .select('id', { count: 'exact' })
        .eq('estatus', 'desaparecido');
      if (!error) setReportesActivos(data.length || 0);
    };

    // Obtener el total de usuarios con rol "autoridad"
    const fetchTotalAutoridades = async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id', { count: 'exact' })
        .eq('rol', 'autoridad');
      if (!error) setTotalAutoridades(data.length || 0);
    };

    fetchTotalCiudadanos();
    fetchReportesActivos();
    fetchTotalAutoridades();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', onPress: () => router.replace('/') }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcome}>Bienvenido, Admin Prueba</Text>
        <Text style={styles.subtitle}>Panel de administración del sistema</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalCiudadanos}</Text>
            <Text style={styles.statLabel}>Total Usuarios</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{reportesActivos}</Text>
            <Text style={styles.statLabel}>Reportes Activos</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalAutoridades}</Text>
            <Text style={styles.statLabel}>Autoridades</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => router.push('/(admin)/usuarios')}
          >
            <Text style={styles.buttonText}>👥 Gestionar Usuarios</Text>
          </TouchableOpacity>
        </View>

        {/* Botón de cerrar sesión */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9b59b6',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});