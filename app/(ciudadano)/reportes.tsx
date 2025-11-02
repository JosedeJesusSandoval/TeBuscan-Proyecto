import * as Location from 'expo-location';
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
      const resultado = await obtenerReportesRecientes(50); // Aumentamos el límite para tener más datos que filtrar

      if (resultado.success && resultado.data) {
        console.log(`📊 Total de reportes obtenidos: ${resultado.data.length}`);
        console.log(`🏙️ Filtrando por ciudad: ${ciudadUsuario}`);
        
        // Debug: Mostrar todos los reportes disponibles
        console.log('📋 Reportes disponibles:');
        resultado.data.forEach((reporte: any, index: number) => {
          console.log(`${index + 1}. ${reporte.nombre_desaparecido} - ${reporte.ultima_ubicacion}`);
        });
        
        // Si no tenemos ciudad del usuario, mostrar todos
        if (!ciudadUsuario) {
          console.log('⚠️ Sin ciudad detectada, mostrando todos los reportes');
          setReportes(resultado.data || []);
        } else {
          // Filtrar por ciudad del usuario con múltiples criterios de coincidencia MÁS FLEXIBLES
          const reportesCercanos = resultado.data.filter((reporte: any) => {
            if (!reporte.ultima_ubicacion) return false;
            
            const ubicacionReporte = reporte.ultima_ubicacion.toLowerCase();
            const ciudadBusqueda = ciudadUsuario.toLowerCase();
            
            // Extraer palabras clave de la ciudad del usuario
            const palabrasCiudad = ciudadBusqueda.split(' ').filter(p => p.length > 2);
            
            // Buscar coincidencias más flexibles
            const coincide = 
                   // Coincidencia directa
                   ubicacionReporte.includes(ciudadBusqueda) || 
                   ciudadBusqueda.includes(ubicacionReporte) ||
                   // Buscar cualquier palabra de la ciudad en la ubicación
                   palabrasCiudad.some(palabra => ubicacionReporte.includes(palabra)) ||
                   // Comparar palabras clave de ciudades principales
                   (ciudadBusqueda.includes('guadalajara') && ubicacionReporte.includes('guadalajara')) ||
                   (ciudadBusqueda.includes('monterrey') && ubicacionReporte.includes('monterrey')) ||
                   (ciudadBusqueda.includes('mexico') && ubicacionReporte.includes('mexico')) ||
                   (ciudadBusqueda.includes('puebla') && ubicacionReporte.includes('puebla')) ||
                   (ciudadBusqueda.includes('tijuana') && ubicacionReporte.includes('tijuana')) ||
                   (ciudadBusqueda.includes('leon') && ubicacionReporte.includes('leon')) ||
                   (ciudadBusqueda.includes('juarez') && ubicacionReporte.includes('juarez')) ||
                   // Búsqueda por estado (Jalisco en este caso)
                   (ciudadBusqueda.includes('santa fe') && ubicacionReporte.includes('jalisco')) ||
                   (ciudadBusqueda.includes('hacienda') && ubicacionReporte.includes('jalisco')) ||
                   // Búsqueda por zona metropolitana de Guadalajara
                   (ciudadBusqueda.includes('santa fe') && (
                     ubicacionReporte.includes('guadalajara') ||
                     ubicacionReporte.includes('zapopan') ||
                     ubicacionReporte.includes('tlaquepaque') ||
                     ubicacionReporte.includes('tonala') ||
                     ubicacionReporte.includes('tlajomulco')
                   ));
            
            if (coincide) {
              console.log(`✅ Reporte coincidente: ${reporte.nombre_desaparecido} en ${reporte.ultima_ubicacion}`);
            } else {
              console.log(`❌ No coincide: ${reporte.nombre_desaparecido} en ${reporte.ultima_ubicacion}`);
            }
            
            return coincide;
          });
          
          console.log(`🎯 Reportes filtrados para ${ciudadUsuario}: ${reportesCercanos.length}`);
          setReportes(reportesCercanos || []);
        }
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

  // Obtener ciudad del usuario usando geolocalización
  const obtenerCiudadUsuario = async () => {
    try {
      // Solicitar permisos de ubicación
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permisos de ubicación denegados');
        setCiudadUsuario(''); // Sin filtro si no hay permisos
        return;
      }

      // Obtener ubicación actual
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Obtener información de la dirección
      let addressInfo = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addressInfo && addressInfo.length > 0) {
        const address = addressInfo[0];
        // Priorizar ciudad, luego región, luego distrito
        const ciudad = address.city || address.region || address.district || address.subregion || '';
        console.log('Ciudad detectada:', ciudad);
        setCiudadUsuario(ciudad);
      } else {
        console.log('No se pudo obtener información de la ciudad');
        setCiudadUsuario('');
      }
    } catch (error) {
      console.error('Error obteniendo ubicación del usuario:', error);
      setCiudadUsuario(''); // Sin filtro si hay error
    }
  };

  // Cargar reportes y ciudad al montar el componente
  useEffect(() => {
    const inicializar = async () => {
      await obtenerCiudadUsuario();
    };
    inicializar();
  }, []);

  // Cargar reportes cuando cambie la ciudad
  useEffect(() => {
    if (ciudadUsuario !== '') {
      cargarReportes();
    }
  }, [ciudadUsuario]);

  // Función para refrescar
  const onRefresh = () => {
    setRefreshing(true);
    cargarReportes();
  };

  const handleReportePress = (reporte: any) => {
    router.push(`/(ciudadano)/detalle/${reporte.id}`);
  };

  // Navegar al mapa centrado en un reporte específico
  const verEnMapa = (reporte: any) => {
    if (reporte.latitud && reporte.longitud) {
      // Aquí podrías pasar las coordenadas como parámetros al mapa
      // Por ahora, simplemente navegamos al mapa
      router.push('/(ciudadano)/mapa');
    } else {
      alert('Este reporte no tiene coordenadas disponibles');
    }
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

      <View style={styles.reporteActions}>
        <Text style={styles.verMasText}>Toca para ver más detalles →</Text>
        {item.latitud && item.longitud && (
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={(e) => {
              e.stopPropagation();
              verEnMapa(item);
            }}
          >
            <Text style={styles.mapButtonText}>📍 Ver en mapa</Text>
          </TouchableOpacity>
        )}
      </View>
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
        {ciudadUsuario ? (
          <Text style={styles.locationText}>📍 {ciudadUsuario}</Text>
        ) : (
          <Text style={styles.locationText}>📍 Ubicación no disponible</Text>
        )}
      </View>

      {reportes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No hay reportes cercanos</Text>
          <Text style={styles.emptyText}>
            {ciudadUsuario 
              ? `No se encontraron reportes de personas desaparecidas en ${ciudadUsuario}.`
              : 'No se pudieron cargar reportes de tu ubicación. Verifica los permisos de ubicación.'
            }
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
  locationText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
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
    flex: 1,
  },
  reporteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  mapButton: {
    backgroundColor: '#9c27b0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  mapButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});