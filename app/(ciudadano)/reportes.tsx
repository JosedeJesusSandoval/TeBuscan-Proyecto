import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { obtenerReportesRecientes } from '../../DB/supabase';

export default function ReportesScreen() {
  const [reportes, setReportes] = useState<any[]>([]);
  const [reportesTodos, setReportesTodos] = useState<any[]>([]); // Todos los reportes sin filtro
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ciudadUsuario, setCiudadUsuario] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'desaparecidos' | 'encontrados'>('desaparecidos'); // Filtro por defecto: desaparecidos

  // Función para aplicar filtros de estado
  const aplicarFiltroEstado = (reportesBase: any[]) => {
    console.log(`🔍 Aplicando filtro de estado: ${filtroEstado}`);
    console.log(`📊 Reportes base para filtrar: ${reportesBase.length}`);
    
    let reportesFiltrados = [];
    
    switch (filtroEstado) {
      case 'todos':
        reportesFiltrados = reportesBase;
        break;
      case 'desaparecidos':
        reportesFiltrados = reportesBase.filter(reporte => reporte.estatus === 'desaparecido');
        break;
      case 'encontrados':
        reportesFiltrados = reportesBase.filter(reporte => reporte.estatus === 'encontrado');
        break;
      default:
        reportesFiltrados = reportesBase;
    }
    
    console.log(`✅ Reportes después del filtro '${filtroEstado}': ${reportesFiltrados.length}`);
    
    // Debug: mostrar distribución de estatus
    const distribucion = reportesBase.reduce((acc, reporte) => {
      acc[reporte.estatus] = (acc[reporte.estatus] || 0) + 1;
      return acc;
    }, {} as any);
    console.log('📈 Distribución de estatus:', distribucion);
    
    setReportes(reportesFiltrados);
  };

  // Función para cambiar filtro de estado
  const cambiarFiltroEstado = (nuevoFiltro: 'todos' | 'desaparecidos' | 'encontrados') => {
    console.log(`🔄 Cambiando filtro de '${filtroEstado}' a '${nuevoFiltro}'`);
    setFiltroEstado(nuevoFiltro);
    aplicarFiltroEstado(reportesTodos);
  }; 

  const cargarReportes = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando reportes...');
      
      const resultado = await obtenerReportesRecientes(50);

      if (resultado.success && resultado.data) {
        console.log(`📊 Total de reportes obtenidos: ${resultado.data.length}`);
        
        // Debug: Mostrar algunos reportes disponibles
        console.log('📋 Primeros reportes disponibles:');
        resultado.data.slice(0, 5).forEach((reporte: any, index: number) => {
          console.log(`${index + 1}. ${reporte.nombre_desaparecido} - ${reporte.ultima_ubicacion} - ${reporte.estatus}`);
        });
        
        // Usar la misma lógica de filtrado exitosa de home.tsx
        let reportesFiltrados = [];
        if (!ciudadUsuario) {
          console.log('⚠️ Sin ubicación detectada, mostrando todos los reportes');
          reportesFiltrados = resultado.data || [];
        } else {
          console.log(`🔍 Filtrando reportes para: ${ciudadUsuario}`);
          
          // Filtrar reportes por ciudad con lógica mejorada y flexible (igual que home.tsx)
          reportesFiltrados = resultado.data.filter((reporte: any) => {
            if (!reporte.ultima_ubicacion) return false;
            
            const ubicacionReporte = reporte.ultima_ubicacion.toLowerCase();
            const ciudadBusqueda = ciudadUsuario.toLowerCase();
            
            // Extraer palabras clave de la ciudad del usuario
            const palabrasCiudad = ciudadBusqueda.split(' ').filter(p => p.length > 2);
            
            const coincide = ubicacionReporte.includes(ciudadBusqueda) || 
                   ciudadBusqueda.includes(ubicacionReporte) ||
                   // Buscar cualquier palabra de la ciudad en la ubicación
                   palabrasCiudad.some(palabra => ubicacionReporte.includes(palabra)) ||
                   (ciudadBusqueda.includes('guadalajara') && ubicacionReporte.includes('guadalajara')) ||
                   (ciudadBusqueda.includes('monterrey') && ubicacionReporte.includes('monterrey')) ||
                   (ciudadBusqueda.includes('mexico') && ubicacionReporte.includes('mexico')) ||
                   (ciudadBusqueda.includes('puebla') && ubicacionReporte.includes('puebla')) ||
                   // Búsqueda por estado y zona metropolitana (IGUAL que home.tsx)
                   (ciudadBusqueda.includes('santa fe') && ubicacionReporte.includes('jalisco')) ||
                   (ciudadBusqueda.includes('hacienda') && ubicacionReporte.includes('jalisco')) ||
                   (ciudadBusqueda.includes('santa fe') && (
                     ubicacionReporte.includes('guadalajara') ||
                     ubicacionReporte.includes('zapopan') ||
                     ubicacionReporte.includes('tlaquepaque') ||
                     ubicacionReporte.includes('tonala') ||
                     ubicacionReporte.includes('tlajomulco')
                   ));
            
            if (coincide) {
              console.log(`✅ Reporte coincidente: ${reporte.nombre_desaparecido} en ${reporte.ultima_ubicacion}`);
            }
            
            return coincide;
          });
        }

        console.log(`🎯 Reportes filtrados: ${reportesFiltrados.length}`);

        // Guardar todos los reportes filtrados por ubicación
        setReportesTodos(reportesFiltrados || []);
        
        // Aplicar filtro de estado
        aplicarFiltroEstado(reportesFiltrados || []);
      } else {
        console.error('Error al cargar reportes:', resultado.error || 'Datos no disponibles');
        setReportes([]);
        setReportesTodos([]);
      }
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      setReportes([]);
      setReportesTodos([]);
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
        
        // Usar exactamente la misma lógica que home.tsx
        if (address && address.city) {
          console.log('🏙️ Ciudad detectada:', address.city);
          setCiudadUsuario(address.city);
          // Cargar reportes inmediatamente después de obtener la ciudad (como home.tsx)
          // cargarReportes se ejecutará automáticamente por el useEffect
        } else {
          console.log('No se pudo obtener información de la ciudad');
          setCiudadUsuario('Ciudad desconocida');
        }
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

  // Cargar reportes cuando cambie la ciudad (igual que home.tsx)
  useEffect(() => {
    if (ciudadUsuario) {
      console.log('🔄 Cargando reportes para ciudad:', ciudadUsuario);
      cargarReportes();
    }
  }, [ciudadUsuario]);

  // Aplicar filtro de estado cuando cambien los reportes base o el filtro
  useEffect(() => {
    if (reportesTodos.length > 0) {
      aplicarFiltroEstado(reportesTodos);
    }
  }, [filtroEstado]);

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
          <Text style={styles.locationText}>📍 Filtrando por: {ciudadUsuario}</Text>
        ) : (
          <Text style={styles.locationText}>📍 Mostrando todos los reportes (ubicación no disponible)</Text>
        )}
      </View>

      {/* Filtros de estado */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filtrar por:</Text>
        <View style={styles.filtersButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filtroEstado === 'desaparecidos' && styles.filterButtonActive
            ]}
            onPress={() => cambiarFiltroEstado('desaparecidos')}
          >
            <Text style={[
              styles.filterButtonText,
              filtroEstado === 'desaparecidos' && styles.filterButtonTextActive
            ]}>
              🔴 Desaparecidos ({reportesTodos.filter(r => r.estatus === 'desaparecido').length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filtroEstado === 'encontrados' && styles.filterButtonActive
            ]}
            onPress={() => cambiarFiltroEstado('encontrados')}
          >
            <Text style={[
              styles.filterButtonText,
              filtroEstado === 'encontrados' && styles.filterButtonTextActive
            ]}>
              🟢 Encontrados ({reportesTodos.filter(r => r.estatus === 'encontrado').length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filtroEstado === 'todos' && styles.filterButtonActive
            ]}
            onPress={() => cambiarFiltroEstado('todos')}
          >
            <Text style={[
              styles.filterButtonText,
              filtroEstado === 'todos' && styles.filterButtonTextActive
            ]}>
              📋 Todos ({reportesTodos.length})
            </Text>
          </TouchableOpacity>
        </View>
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
  // Estilos para filtros
  filtersContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  filtersButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    flexShrink: 1,
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});