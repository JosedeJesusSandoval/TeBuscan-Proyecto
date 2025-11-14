import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { obtenerReportesParaMapa } from '../../DB/supabase';

export default function MapaScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reportes, setReportes] = useState<any[]>([]);
  const [filtroEstatus, setFiltroEstatus] = useState<string>('desaparecido'); // Por defecto mostrar solo desaparecidos
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  useEffect(() => {
    getCurrentLocation();
    fetchReportes(filtroEstatus);
  }, []);

  // Refrescar reportes cuando cambie el filtro
  useEffect(() => {
    if (filtroEstatus) {
      fetchReportes(filtroEstatus);
    }
  }, [filtroEstatus]);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Se necesitan permisos de ubicación para mostrar el mapa');
        setLocation({
          coords: {
            latitude: 25.6866,
            longitude: -100.3161,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setLoading(false);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      setLocation({
        coords: {
          latitude: 25.6866,
          longitude: -100.3161,
          altitude: null,
          accuracy: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
      setLoading(false);
    }
  };

  const fetchReportes = async (estatus?: string) => {
    try {
      console.log(`🗺️ Cargando reportes para mapa con estatus: ${estatus || 'todos'}`);
      
      const filtros: any = { dias_recientes: 365 };
      
      if (estatus && estatus !== 'todos') {
        filtros.estatus = estatus;
        console.log(`🔍 Aplicando filtro de estatus: ${estatus}`);
      }

      const resultado = await obtenerReportesParaMapa(filtros);

      if (resultado.success) {
        console.log(`📊 Reportes obtenidos para mapa: ${resultado.data?.length || 0}`);
        
        // Debug: mostrar distribución de estatus
        if (resultado.data && resultado.data.length > 0) {
          const distribucion = resultado.data.reduce((acc: any, reporte: any) => {
            acc[reporte.estatus] = (acc[reporte.estatus] || 0) + 1;
            return acc;
          }, {});
          console.log('📈 Distribución de estatus en mapa:', distribucion);
          
          // Mostrar algunos ejemplos
          resultado.data.slice(0, 3).forEach((reporte: any, index: number) => {
            console.log(`${index + 1}. ${reporte.nombre_desaparecido} - ${reporte.estatus} - Coords: ${reporte.latitud}, ${reporte.longitud}`);
          });
        }
        
        setReportes(resultado.data || []);
      } else {
        console.error('Error obteniendo reportes para mapa:', resultado.error);
        setReportes([]);
      }
    } catch (error) {
      console.error('Error obteniendo reportes para mapa:', error);
      setReportes([]);
    }
  };

  const cambiarFiltro = (nuevoEstatus: string) => {
    console.log(`🔄 Cambiando filtro de mapa de '${filtroEstatus}' a '${nuevoEstatus}'`);
    setFiltroEstatus(nuevoEstatus);
    fetchReportes(nuevoEstatus);
    setMostrarFiltros(false);
  };

  const handleMarkerPress = (reporte: any) => {
    const fechaFormateada = reporte.ultima_fecha_visto 
      ? new Date(reporte.ultima_fecha_visto).toLocaleDateString('es-MX')
      : 'No disponible';

    Alert.alert(
      reporte.nombre_desaparecido,
      `Estado: ${reporte.estatus.toUpperCase()}\nEdad: ${reporte.edad || 'No especificada'} años\nÚltima vez visto: ${fechaFormateada}\nUbicación: ${reporte.ultima_ubicacion}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Ver Detalles', 
          onPress: () => router.push(`/(ciudadano)/detalle/${reporte.id}`)
        }
      ]
    );
  };

  const handleReportarPress = () => {
    router.push('/(ciudadano)/reportar');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  const initialRegion = {
    latitude: location?.coords.latitude || 25.6866,
    longitude: location?.coords.longitude || -100.3161,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };



  return (
    <View style={styles.container}>
      {/* Panel de filtros */}
      <View style={styles.filterPanel}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setMostrarFiltros(!mostrarFiltros)}
        >
          <Text style={styles.filterButtonText}>
            {filtroEstatus === 'todos' ? '📋 Todos' : 
             filtroEstatus === 'desaparecido' ? '🔴 Desaparecidos' :
             filtroEstatus === 'encontrado' ? '🟢 Encontrados' : filtroEstatus.toUpperCase()
            } ({reportes.length})
          </Text>
        </TouchableOpacity>
        
        {mostrarFiltros && (
          <View style={styles.filterOptions}>
            <TouchableOpacity 
              style={[styles.filterOption, filtroEstatus === 'desaparecido' && styles.filterOptionActive]}
              onPress={() => cambiarFiltro('desaparecido')}
            >
              <Text style={[styles.filterOptionText, filtroEstatus === 'desaparecido' && styles.filterOptionTextActive]}>
                🔴 Desaparecidos
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterOption, filtroEstatus === 'encontrado' && styles.filterOptionActive]}
              onPress={() => cambiarFiltro('encontrado')}
            >
              <Text style={[styles.filterOptionText, filtroEstatus === 'encontrado' && styles.filterOptionTextActive]}>
                🟢 Encontrados
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterOption, filtroEstatus === 'todos' && styles.filterOptionActive]}
              onPress={() => cambiarFiltro('todos')}
            >
              <Text style={[styles.filterOptionText, filtroEstatus === 'todos' && styles.filterOptionTextActive]}>
                📋 Todos
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
      >
        {/* Marcadores de reportes */}
        {reportes.map((reporte) => {
          const pinColor = reporte.estatus === 'desaparecido' ? '#e74c3c' : 
                          reporte.estatus === 'encontrado' ? '#27ae60' : '#f39c12';
          
          const emoji = reporte.estatus === 'desaparecido' ? '🔴' : 
                       reporte.estatus === 'encontrado' ? '🟢' : '🟡';
          
          return (
            <Marker
              key={reporte.id}
              coordinate={{
                latitude: parseFloat(reporte.latitud),
                longitude: parseFloat(reporte.longitud),
              }}
              title={`${emoji} ${reporte.nombre_desaparecido}`}
              description={`Estado: ${reporte.estatus.toUpperCase()} - ${reporte.ultima_ubicacion}`}
              pinColor={pinColor}
              onPress={() => handleMarkerPress(reporte)}
            />
          );
        })}
      </MapView>

      {/* Botón flotante para reportar */}
      <TouchableOpacity style={styles.reportButton} onPress={handleReportarPress}>
        <Text style={styles.reportButtonText}>+</Text>
      </TouchableOpacity>

      {/* Mensaje de error flotante */}
      {errorMsg && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>📍 {errorMsg}</Text>
        </View>
      )}

      {/* Mensaje informativo cuando no hay reportes */}
      {reportes.length === 0 && !loading && (
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            {filtroEstatus === 'encontrado' 
              ? '🟢 No hay reportes de personas encontradas en este momento'
              : filtroEstatus === 'desaparecido'
              ? '🔴 No hay reportes de personas desaparecidas cerca'
              : '📋 No hay reportes disponibles con coordenadas'
            }
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  reportButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  reportButtonText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  errorBanner: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    padding: 10,
    borderRadius: 8,
  },
  errorBannerText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  infoBanner: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
    padding: 12,
    borderRadius: 8,
  },
  infoBannerText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  filterPanel: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  filterButton: {
    padding: 12,
    borderRadius: 10,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  filterOptions: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
    marginHorizontal: 2,
  },
  filterOptionActive: {
    backgroundColor: '#3498db',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#2c3e50',
    textAlign: 'center',
  },
  filterOptionTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
});