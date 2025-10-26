import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { obtenerReportesRecientes } from '../../DB/supabase';

export default function ReportesScreen() {
  const [reportes, setReportes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ciudadUsuario, setCiudadUsuario] = useState<string>(''); 

  const cargarReportes = async () => {
    try {
      setLoading(true);
      const resultado = await obtenerReportesRecientes(20); 

      if (resultado.success && resultado.data) {
        const reportesCercanos = resultado.data.filter(
          (reporte: any) =>
            reporte.ultima_ubicacion?.toLowerCase() === ciudadUsuario.toLowerCase()
        );
        setReportes(reportesCercanos || []);
      } else {
        console.error('Error al cargar reportes:', resultado.error || 'Datos no disponibles');
        setReportes([]);
      }
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      setReportes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Obtener ciudad del usuario (simulación)
  const obtenerCiudadUsuario = async () => {
    
    setCiudadUsuario('Centro de la ciudad');
  };

  // Cargar reportes y ciudad al montar el componente
  useEffect(() => {
    const inicializar = async () => {
      await obtenerCiudadUsuario();
      await cargarReportes();
    };
    inicializar();
  }, []);

  // Función para refrescar
  const onRefresh = () => {
    setRefreshing(true);
    cargarReportes();
  };

  const handleReportePress = (reporte: any) => {
    router.push(`/(ciudadano)/detalle/${reporte.id}`);
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fechaString: string) => {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return fechaString;
    }
  };

  const renderReporte = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.reporteCard}
      onPress={() => handleReportePress(item)}
    >
      <View style={styles.reporteHeader}>
        <Text style={styles.reporteNombre}>{item.nombre_desaparecido}</Text>
        <View
          style={[
            styles.estadoBadge,
            {
              backgroundColor:
                item.estatus === 'desaparecido'
                  ? '#e74c3c'
                  : item.estatus === 'encontrado'
                  ? '#27ae60'
                  : '#f39c12',
            },
          ]}
        >
          <Text style={styles.estadoText}>
            {item.estatus === 'desaparecido'
              ? '🔴 DESAPARECIDO'
              : item.estatus === 'encontrado'
              ? '🟢 ENCONTRADO'
              : '🟡 PENDIENTE'}
          </Text>
        </View>
      </View>

      {item.edad && (
        <Text style={styles.reporteInfo}>👤 Edad: {item.edad} años</Text>
      )}

      <Text style={styles.reporteInfo}>
        📍 Última ubicación: {item.ultima_ubicacion}
      </Text>

      {item.ultima_fecha_visto && (
        <Text style={styles.reporteInfo}>
          📅 Visto por última vez: {formatearFecha(item.ultima_fecha_visto)}
        </Text>
      )}

      {item.descripcion && (
        <Text style={styles.reporteDescripcion} numberOfLines={2}>
          {item.descripcion}
        </Text>
      )}

      <Text style={styles.verMasText}>Toca para ver más detalles →</Text>
    </TouchableOpacity>
  );

  // Mostrar loading
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando reportes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reportes cercanos</Text>
      </View>

      {reportes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No hay reportes cercanos</Text>
          <Text style={styles.emptyText}>
            No se encontraron reportes de personas desaparecidas en tu ubicación.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reportes}
          renderItem={renderReporte}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3498db']}
              tintColor="#3498db"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
  lista: {
    padding: 20,
  },
  reporteCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  reporteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  reporteNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  estadoText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reporteInfo: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 5,
  },
  reporteDescripcion: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 10,
    marginBottom: 10,
    lineHeight: 20,
  },
  verMasText: {
    fontSize: 12,
    color: '#3498db',
    fontStyle: 'italic',
  },
});