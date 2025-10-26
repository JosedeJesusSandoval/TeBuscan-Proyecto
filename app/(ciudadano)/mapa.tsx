import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function MapaScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reportes, setReportes] = useState<any[]>([]);

  useEffect(() => {
    getCurrentLocation();
    fetchReportes();
  }, []);

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

  const fetchReportes = async () => {
    try {
      const response = await fetch('https://api.example.com/reportes');
      const data = await response.json();
      setReportes(data);
    } catch (error) {
      console.error('Error obteniendo reportes:', error);
      setReportes([]);
    }
  };

  const handleMarkerPress = (reporte: any) => {
    Alert.alert(
      reporte.nombre,
      `Estado: ${reporte.estado}\nFecha: ${reporte.fecha}`,
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
        {reportes.map((reporte) => (
          <Marker
            key={reporte.id}
            coordinate={{
              latitude: reporte.ultimaUbicacion.latitud,
              longitude: reporte.ultimaUbicacion.longitud,
            }}
            title={reporte.nombre}
            description={`${reporte.estado} - ${reporte.fecha}`}
            pinColor={reporte.estado === 'activo' ? 'red' : 'green'}
            onPress={() => handleMarkerPress(reporte)}
          />
        ))}
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
});