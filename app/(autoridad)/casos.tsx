import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { actualizarReporte, obtenerInfoAutoridad, obtenerReportesPorJurisdiccion } from '../../DB/supabase';
import { useAuth } from '../../context/AuthContext';

interface Reporte {
  id: string;
  nombre_desaparecido: string;
  edad: number;
  estatus: string;
  ultima_ubicacion: string;
  created_at: string;
  prioridad?: 'alta' | 'media' | 'baja';
  score_urgencia?: number;
}

export default function CasosScreen() {
  const { user } = useAuth();
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jurisdiccion, setJurisdiccion] = useState<string>('');
  const [autoridad, setAutoridad] = useState<any>(null);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'desaparecidos' | 'encontrados'>('desaparecidos');
  const [reportesFiltrados, setReportesFiltrados] = useState<Reporte[]>([]);

  useEffect(() => {
    inicializarDatos();
  }, []);

  // Efecto para aplicar filtros cuando cambien los reportes
  useEffect(() => {
    aplicarFiltroEstado(reportes, filtroEstado);
  }, [reportes, filtroEstado]);

  const inicializarDatos = async () => {
    if (!user?.id) {
      console.log('❌ No hay usuario logueado');
      return;
    }
    
    try {
      console.log('🚀 Inicializando datos para usuario:', user.name);
      
      // Primero obtener información de la autoridad
      const infoResult = await obtenerInfoAutoridad(user.id);
      console.log('📋 Resultado info autoridad:', infoResult);
      
      if (infoResult.success && infoResult.data) {
        setAutoridad(infoResult.data);
        setJurisdiccion(infoResult.data.jurisdiccion || '');
        
        console.log('✅ Información de autoridad cargada:', {
          nombre: infoResult.data.name,
          institucion: infoResult.data.institucion,
          jurisdiccion: infoResult.data.jurisdiccion
        });
        
        // Luego cargar reportes de su jurisdicción
        await cargarReportes(infoResult.data.jurisdiccion);
      } else {
        console.error('❌ Error obteniendo info de autoridad:', infoResult.error);
        Alert.alert('Error', 'No se pudo obtener información de la autoridad: ' + (infoResult.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('❌ Error inicializando datos:', error);
      Alert.alert('Error', 'Problema al inicializar los datos');
    }
  };

  const cargarReportes = async (jurisdiccionParam?: string) => {
    try {
      setLoading(true);
      const jurisdiccionActual = jurisdiccionParam || jurisdiccion;
      
      console.log('🔍 Cargando reportes para autoridad:', user?.name);
      console.log('📍 Jurisdicción:', jurisdiccionActual);

      // Siempre intentar obtener reportes por jurisdicción (la función ahora maneja fallbacks internamente)
      const resultado = await obtenerReportesPorJurisdiccion(jurisdiccionActual || 'Todos');
      
      if (!resultado.success) {
        console.error('❌ Error en obtenerReportesPorJurisdiccion:', resultado.error);
        Alert.alert('Error', resultado.error || 'No se pudieron cargar los reportes');
        return;
      }

      const reportesData = resultado.data || [];
      console.log(`✅ Cargados ${reportesData.length} reportes`);

      if (reportesData.length === 0) {
        console.log('⚠️ No se encontraron reportes');
        setReportes([]);
        return;
      }

      // Aplicar clasificación inteligente de urgencia
      const reportesConPrioridad = reportesData.map((reporte: any) => ({
        ...reporte,
        ...calcularPrioridad(reporte)
      }));

      // Ordenar por prioridad y fecha
      reportesConPrioridad.sort((a: any, b: any) => {
        const prioridadOrder: { [key: string]: number } = { alta: 3, media: 2, baja: 1 };
        if (a.prioridad !== b.prioridad) {
          return prioridadOrder[b.prioridad] - prioridadOrder[a.prioridad];
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setReportes(reportesConPrioridad);
      // Aplicar filtro después de cargar los reportes
      aplicarFiltroEstado(reportesConPrioridad, filtroEstado);
    } catch (error) {
      console.error('❌ Error cargando reportes:', error);
      Alert.alert('Error', 'Problema al cargar los reportes: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarReportes();
  };

  const aplicarFiltroEstado = (reportesList: Reporte[], filtro: 'todos' | 'desaparecidos' | 'encontrados') => {
    let filtrados: Reporte[];
    
    switch (filtro) {
      case 'desaparecidos':
        filtrados = reportesList.filter(reporte => reporte.estatus === 'desaparecido');
        break;
      case 'encontrados':
        filtrados = reportesList.filter(reporte => reporte.estatus === 'encontrado');
        break;
      case 'todos':
      default:
        filtrados = reportesList;
        break;
    }
    
    setReportesFiltrados(filtrados);
  };

  const cambiarFiltro = (nuevoFiltro: 'todos' | 'desaparecidos' | 'encontrados') => {
    setFiltroEstado(nuevoFiltro);
    aplicarFiltroEstado(reportes, nuevoFiltro);
  };

  const cambiarEstatus = async (reporteId: string, nuevoEstatus: string) => {
    try {
      const { success, error } = await actualizarReporte(reporteId, { estatus: nuevoEstatus });
      
      if (success) {
        Alert.alert('Éxito', `Reporte marcado como ${nuevoEstatus}`);
        cargarReportes();
      } else {
        Alert.alert('Error', error || 'No se pudo actualizar el reporte');
      }
    } catch (error) {
      Alert.alert('Error', 'Problema al actualizar el reporte');
    }
  };

  const formatearFecha = (fechaString: string) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-MX');
  };

  const renderReporte = ({ item }: { item: Reporte }) => (
    <TouchableOpacity
      style={[styles.modernCard, getPriorityCardStyle(item.prioridad || 'baja')]}
      onPress={() => router.push(`/(autoridad)/caso/${item.id}`)}
      activeOpacity={0.7}
    >
      {/* Header con prioridad */}
      <View style={styles.cardHeader}>
        <View style={[styles.priorityIndicator, getPriorityIndicatorStyle(item.prioridad || 'baja')]}>
          <Text style={styles.priorityIcon}>{getPriorityIcon(item.prioridad || 'baja')}</Text>
          <Text style={styles.priorityText}>{item.prioridad?.toUpperCase() || 'BAJA'}</Text>
        </View>
        <View style={[styles.statusBadge, getModernStatusStyle(item.estatus)]}>
          <Text style={styles.statusText}>
            {item.estatus === 'desaparecido' ? '🔍 DESAPARECIDO' : '✅ ENCONTRADO'}
          </Text>
        </View>
      </View>

      {/* Información principal */}
      <View style={styles.cardBody}>
        <View style={styles.personInfo}>
          <Text style={styles.personName}>{item.nombre_desaparecido}</Text>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>👤</Text>
              <Text style={styles.detailText}>{item.edad} años</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText} numberOfLines={1}>{item.ultima_ubicacion}</Text>
            </View>
          </View>
          <View style={styles.timeInfo}>
            <Text style={styles.timeIcon}>⏰</Text>
            <Text style={styles.timeText}>Reportado: {formatearFecha(item.created_at)}</Text>
            {item.score_urgencia && (
              <Text style={styles.urgencyScore}>Score: {item.score_urgencia.toFixed(1)}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Botones de acción */}
      {item.estatus === 'desaparecido' && (
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.modernFoundButton}
            onPress={(e) => {
              e.stopPropagation();
              cambiarEstatus(item.id, 'encontrado');
            }}
          >
            <Text style={styles.foundButtonIcon}>✓</Text>
            <Text style={styles.foundButtonText}>Marcar Encontrado</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => router.push(`/(autoridad)/caso/${item.id}`)}
          >
            <Text style={styles.viewButtonText}>Ver Detalles →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Indicador visual de prioridad */}
      <View style={[styles.priorityStripe, getPriorityStripeStyle(item.prioridad || 'baja')]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header con filtros */}
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>📊 Gestión de Casos</Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, filtroEstado === 'todos' && styles.filterButtonActive]}
            onPress={() => cambiarFiltro('todos')}
          >
            <Text style={[styles.filterButtonText, filtroEstado === 'todos' && styles.filterButtonTextActive]}>
              Todos
            </Text>
            <Text style={[styles.filterButtonCount, filtroEstado === 'todos' && styles.filterButtonCountActive]}>
              {reportes.length}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filtroEstado === 'desaparecidos' && styles.filterButtonActive]}
            onPress={() => cambiarFiltro('desaparecidos')}
          >
            <Text style={[styles.filterButtonText, filtroEstado === 'desaparecidos' && styles.filterButtonTextActive]}>
              Desaparecidos
            </Text>
            <Text style={[styles.filterButtonCount, filtroEstado === 'desaparecidos' && styles.filterButtonCountActive]}>
              {reportes.filter(r => r.estatus === 'desaparecido').length}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filtroEstado === 'encontrados' && styles.filterButtonActive]}
            onPress={() => cambiarFiltro('encontrados')}
          >
            <Text style={[styles.filterButtonText, filtroEstado === 'encontrados' && styles.filterButtonTextActive]}>
              Encontrados
            </Text>
            <Text style={[styles.filterButtonCount, filtroEstado === 'encontrados' && styles.filterButtonCountActive]}>
              {reportes.filter(r => r.estatus === 'encontrado').length}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#e74c3c" style={styles.loading} />
      ) : (
        <FlatList
          data={reportesFiltrados}
          renderItem={renderReporte}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#e74c3c']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>
                {filtroEstado === 'todos' ? 'No hay casos registrados' :
                 filtroEstado === 'desaparecidos' ? 'No hay casos de desaparecidos' :
                 'No hay casos de personas encontradas'}
              </Text>
              <Text style={styles.emptySubtext}>
                {jurisdiccion 
                  ? `No se encontraron reportes con estatus "${filtroEstado}" para la jurisdicción: ${jurisdiccion}`
                  : `No se encontraron reportes con estatus "${filtroEstado}" en el sistema`
                }
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton} 
                onPress={() => cargarReportes()}
              >
                <Text style={styles.refreshButtonText}>🔄 Actualizar</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

// ============ ALGORITMOS DE CLASIFICACIÓN INTELIGENTE ============

const calcularPrioridad = (reporte: any) => {
  let score = 0;
  
  // Factor edad (más crítico para menores y adultos mayores)
  if (reporte.edad <= 12) score += 40;
  else if (reporte.edad <= 17) score += 35;
  else if (reporte.edad >= 65) score += 30;
  else if (reporte.edad <= 30) score += 20;
  else score += 15;

  // Factor tiempo transcurrido
  const tiempoTranscurrido = Date.now() - new Date(reporte.created_at).getTime();
  const horasTranscurridas = tiempoTranscurrido / (1000 * 60 * 60);

  if (horasTranscurridas <= 24) score += 30;
  else if (horasTranscurridas <= 72) score += 25;
  else if (horasTranscurridas <= 168) score += 15; // 1 semana
  else score += 5;

  // Factor ubicación (zonas críticas conocidas)
  const ubicacion = reporte.ultima_ubicacion?.toLowerCase() || '';
  const zonasCriticas = ['centro', 'estación', 'terminal', 'plaza', 'mercado'];
  if (zonasCriticas.some(zona => ubicacion.includes(zona))) {
    score += 15;
  }

  // Determinar prioridad basada en score
  let prioridad: 'alta' | 'media' | 'baja';
  if (score >= 70) prioridad = 'alta';
  else if (score >= 45) prioridad = 'media';
  else prioridad = 'baja';

  return { prioridad, score_urgencia: score };
};

// ============ FUNCIONES DE ESTILO MODERNAS ============

const getPriorityCardStyle = (prioridad: string) => {
  switch (prioridad) {
    case 'alta': return { borderColor: '#e74c3c', shadowColor: '#e74c3c' };
    case 'media': return { borderColor: '#f39c12', shadowColor: '#f39c12' };
    case 'baja': return { borderColor: '#95a5a6', shadowColor: '#95a5a6' };
    default: return { borderColor: '#95a5a6', shadowColor: '#95a5a6' };
  }
};

const getPriorityIndicatorStyle = (prioridad: string) => {
  switch (prioridad) {
    case 'alta': return { backgroundColor: '#ffe6e6', borderColor: '#e74c3c' };
    case 'media': return { backgroundColor: '#fff7e6', borderColor: '#f39c12' };
    case 'baja': return { backgroundColor: '#f8f9fa', borderColor: '#95a5a6' };
    default: return { backgroundColor: '#f8f9fa', borderColor: '#95a5a6' };
  }
};

const getPriorityIcon = (prioridad: string) => {
  switch (prioridad) {
    case 'alta': return '🚨';
    case 'media': return '⚠️';
    case 'baja': return '📋';
    default: return '📋';
  }
};

const getPriorityStripeStyle = (prioridad: string) => {
  switch (prioridad) {
    case 'alta': return { backgroundColor: '#e74c3c' };
    case 'media': return { backgroundColor: '#f39c12' };
    case 'baja': return { backgroundColor: '#95a5a6' };
    default: return { backgroundColor: '#95a5a6' };
  }
};

const getModernStatusStyle = (estatus: string) => {
  switch (estatus) {
    case 'desaparecido': return { backgroundColor: '#fff3e0', borderColor: '#ff9800' };
    case 'encontrado': return { backgroundColor: '#e8f5e8', borderColor: '#4caf50' };
    default: return { backgroundColor: '#f5f5f5', borderColor: '#9e9e9e' };
  }
};

// Funciones anteriores para compatibilidad
const getPriorityStyle = (prioridad: string) => {
  switch (prioridad) {
    case 'alta': return { borderLeftColor: '#e74c3c', borderLeftWidth: 5 };
    case 'media': return { borderLeftColor: '#f39c12', borderLeftWidth: 5 };
    case 'baja': return { borderLeftColor: '#95a5a6', borderLeftWidth: 5 };
    default: return {};
  }
};

const getPriorityBadgeStyle = (prioridad: string) => {
  switch (prioridad) {
    case 'alta': return { backgroundColor: '#e74c3c' };
    case 'media': return { backgroundColor: '#f39c12' };
    case 'baja': return { backgroundColor: '#95a5a6' };
    default: return { backgroundColor: '#95a5a6' };
  }
};

const getStatusStyle = (estatus: string) => {
  switch (estatus) {
    case 'desaparecido': return { backgroundColor: '#e67e22' };
    case 'encontrado': return { backgroundColor: '#27ae60' };
    default: return { backgroundColor: '#95a5a6' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  // ============ ESTILOS DE FILTROS ============
  filterHeader: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterButtonActive: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
    elevation: 3,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 2,
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterButtonCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    textAlign: 'center',
  },
  filterButtonCountActive: {
    color: 'white',
  },
  // ============ ESTILOS DEL HEADER MODERNO ============
  modernHeader: {
    backgroundColor: '#e74c3c',
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 15,
  },
  titleSection: {
    flex: 1,
    marginRight: 10,
  },
  modernTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'left',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 1,
    fontWeight: '600',
  },
  jurisdiccionChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    flex: 1,
    minWidth: 120,
  },
  jurisdiccionText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
    textAlign: 'center',
  },
  autoridadCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  autoridadName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 2,
  },
  autoridadInstitution: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // ============ ESTILOS ANTIGUOS (compatibilidad) ============
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#e74c3c',
    borderBottomWidth: 1,
    borderBottomColor: '#c0392b',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  autoridadInfo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reporteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reporteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reporteInfo: {
    flex: 1,
    marginRight: 10,
  },
  reporteNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  reporteDetalle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  reporteFecha: {
    fontSize: 12,
    color: '#95a5a6',
  },
  reporteActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  prioridadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  prioridadText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  estatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  foundButton: {
    backgroundColor: '#27ae60',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // ============ ESTILOS DE TARJETAS MODERNAS ============
  modernCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  priorityIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  personInfo: {
    marginBottom: 12,
  },
  personName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 6,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeIcon: {
    fontSize: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#777',
  },
  urgencyScore: {
    fontSize: 11,
    color: '#9e9e9e',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  modernFoundButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flex: 1,
    justifyContent: 'center',
  },
  foundButtonIcon: {
    color: 'white',
    fontSize: 16,
    marginRight: 6,
  },
  foundButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  viewButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2196f3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  viewButtonText: {
    color: '#2196f3',
    fontSize: 13,
    fontWeight: 'bold',
  },
  priorityStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
});