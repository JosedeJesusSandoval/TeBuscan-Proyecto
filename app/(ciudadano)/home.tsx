import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { obtenerReportesRecientes } from '../../DB/supabase';

export default function HomeScreen() {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [ciudad, setCiudad] = useState('Cargando...');
  const [todosLosReportes, setTodosLosReportes] = useState<any[]>([]);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationUpdates = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 5000,
              distanceInterval: 10,
            },
            async (location) => {
              setUserLocation(location);
              await updateCity(location.coords.latitude, location.coords.longitude);
            }
          );
        }
      } catch (error) {
        // Error handling silenciado
      }
    };

    startLocationUpdates();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const updateCity = async (latitude: number, longitude: number) => {
    try {
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address && address.city) {
        setCiudad(address.city);
        // Cargar reportes cuando se obtenga la ciudad
        await cargarReportesCercanos(address.city);
      } else {
        setCiudad('Ciudad desconocida');
      }
    } catch (error) {
      setCiudad('Error al obtener ciudad');
    }
  };

  const cargarReportesCercanos = async (ciudadUsuario: string) => {
    try {
      const resultado = await obtenerReportesRecientes(30);
      
      if (resultado.success && resultado.data) {
        // Filtrar reportes por ciudad con lógica mejorada y flexible
        const reportesFiltrados = resultado.data.filter((reporte: any) => {
          if (!reporte.ultima_ubicacion) return false;
          
          const ubicacionReporte = reporte.ultima_ubicacion.toLowerCase();
          const ciudadBusqueda = ciudadUsuario.toLowerCase();
          
          // Extraer palabras clave de la ciudad del usuario
          const palabrasCiudad = ciudadBusqueda.split(' ').filter(p => p.length > 2);
          
          return ubicacionReporte.includes(ciudadBusqueda) || 
                 ciudadBusqueda.includes(ubicacionReporte) ||
                 // Buscar cualquier palabra de la ciudad en la ubicación
                 palabrasCiudad.some(palabra => ubicacionReporte.includes(palabra)) ||
                 (ciudadBusqueda.includes('guadalajara') && ubicacionReporte.includes('guadalajara')) ||
                 (ciudadBusqueda.includes('monterrey') && ubicacionReporte.includes('monterrey')) ||
                 (ciudadBusqueda.includes('mexico') && ubicacionReporte.includes('mexico')) ||
                 (ciudadBusqueda.includes('puebla') && ubicacionReporte.includes('puebla')) ||
                 // Búsqueda por estado y zona metropolitana
                 (ciudadBusqueda.includes('santa fe') && ubicacionReporte.includes('jalisco')) ||
                 (ciudadBusqueda.includes('hacienda') && ubicacionReporte.includes('jalisco')) ||
                 (ciudadBusqueda.includes('santa fe') && (
                   ubicacionReporte.includes('guadalajara') ||
                   ubicacionReporte.includes('zapopan') ||
                   ubicacionReporte.includes('tlaquepaque') ||
                   ubicacionReporte.includes('tonala') ||
                   ubicacionReporte.includes('tlajomulco')
                 ));
        });

        // Transformar datos para compatibilidad con la UI existente
        const reportesTransformados = reportesFiltrados.map((reporte: any) => ({
          id: reporte.id,
          nombre: reporte.nombre_desaparecido,
          ultimaUbicacion: reporte.ultima_ubicacion,
          fechaDesaparicion: reporte.ultima_fecha_visto ? 
            new Date(reporte.ultima_fecha_visto).toLocaleDateString('es-MX') : 
            'Fecha no disponible',
          estado: reporte.estatus === 'desaparecido' ? 'activo' : reporte.estatus,
          prioridad: 'alta' // Por defecto, se podría mejorar con lógica más específica
        }));

        setTodosLosReportes(reportesTransformados);
      } else {
        setTodosLosReportes([]);
      }
    } catch (error) {
      setTodosLosReportes([]);
    }
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
        await updateCity(location.coords.latitude, location.coords.longitude);
      }
    } catch (error) {
      // Error handling silenciado
    }
  };

  const handleReportePress = (reporte: any) => {
    router.push(`/(ciudadano)/detalle/${reporte.id}`);
  };

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

  const renderReporteCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.reporteCard, { borderLeftColor: getPriorityColor(item.prioridad) }]} 
      onPress={() => handleReportePress(item)}
    >
      <View style={styles.reporteHeader}>
        <Text style={styles.reporteNombre}>{item.nombre}</Text>
        <View style={[styles.estadoBadge, { backgroundColor: item.estado === 'activo' ? '#e74c3c' : '#27ae60' }]}>
          <Text style={styles.estadoText}>
            {item.estado === 'activo' ? 'ACTIVO' : 'ENCONTRADO'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.reporteInfo}>📍 {item.ultimaUbicacion}</Text>
      <Text style={styles.reporteInfo}>🕒 {item.fechaDesaparicion}</Text>
    </TouchableOpacity>
  );

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return '#e74c3c';
      case 'media': return '#f39c12';
      case 'baja': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  // Filtrar reportes activos cercanos
  const reportesActivosCercanos = todosLosReportes
    .filter((reporte) => reporte.estado === 'activo')
    .sort((a, b) => new Date(b.fechaDesaparicion).getTime() - new Date(a.fechaDesaparicion).getTime())
    .slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>¡Hola! 👋</Text>
          <Text style={styles.locationText}>📍 {ciudad}</Text>
        </View>
      </View>

      {/* Estadísticas rápidas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{reportesActivosCercanos.length}</Text>
          <Text style={styles.statLabel}>Casos Activos Cercanos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todosLosReportes.length}</Text>
          <Text style={styles.statLabel}>Total en {ciudad}</Text>
        </View>
      </View>

      {/* Reportes cercanos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🚨 Casos Activos Cercanos</Text>
          <TouchableOpacity onPress={() => router.push('/(ciudadano)/reportes')}>
            <Text style={styles.verTodosText}>Ver todos →</Text>
          </TouchableOpacity>
        </View>

        {reportesActivosCercanos.length > 0 ? (
          <FlatList
            data={reportesActivosCercanos}
            renderItem={renderReporteCard}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>✅ No hay casos activos cercanos</Text>
          </View>
        )}
      </View>

      {/* Accesos rápidos */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => router.push('/(ciudadano)/mapa')}
        >
          <Text style={styles.quickActionText}>🗺️ Ver Mapa</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickActionButton, styles.reportActionButton]}
          onPress={() => router.push('/(ciudadano)/reportar')}
        >
          <Text style={styles.quickActionTextWhite}>➕ Reportar Caso</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  locationText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  section: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  verTodosText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
  },
  reporteCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  reporteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reporteNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reporteInfo: {
    fontSize: 12,
    color: '#2c3e50',
    marginBottom: 3,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  reportActionButton: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  quickActionText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionTextWhite: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});