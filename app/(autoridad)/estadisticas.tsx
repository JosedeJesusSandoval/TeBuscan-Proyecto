import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { obtenerReportes } from '../../DB/supabase';

export default function EstadisticasScreen() {
  const [estadisticas, setEstadisticas] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const resultado = await obtenerReportes();
      
      if (resultado.success && resultado.data) {
        const stats = generarEstadisticas(resultado.data);
        setEstadisticas(stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const generarEstadisticas = (reportes: any[]) => {
    const total = reportes.length;
    const activos = reportes.filter(r => r.estatus === 'desaparecido').length;
    const encontrados = reportes.filter(r => r.estatus === 'encontrado').length;

    // Análisis por edad
    const edades = {
      '0-12': reportes.filter(r => r.edad <= 12).length,
      '13-17': reportes.filter(r => r.edad >= 13 && r.edad <= 17).length,
      '18-30': reportes.filter(r => r.edad >= 18 && r.edad <= 30).length,
      '31-50': reportes.filter(r => r.edad >= 31 && r.edad <= 50).length,
      '50+': reportes.filter(r => r.edad > 50).length,
    };

    // Análisis por ubicación (ciudades más frecuentes)
    const ubicaciones: { [key: string]: number } = {};
    reportes.forEach(r => {
      const ciudad = extraerCiudad(r.ultima_ubicacion);
      ubicaciones[ciudad] = (ubicaciones[ciudad] || 0) + 1;
    });

    const topUbicaciones = Object.entries(ubicaciones)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Análisis temporal (últimos 30 días)
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const recientes = reportes.filter(r => new Date(r.created_at) >= hace30Dias).length;

    return {
      total,
      activos,
      encontrados,
      recientes,
      edades,
      topUbicaciones,
      porcentajeExito: total > 0 ? Math.round((encontrados / total) * 100) : 0
    };
  };

  const extraerCiudad = (ubicacion: string): string => {
    if (!ubicacion) return 'No especificada';
    
    // Buscar patrones comunes de ciudades
    const ciudades = ['guadalajara', 'zapopan', 'tlaquepaque', 'tonalá', 'tlajomulco'];
    const ubicacionLower = ubicacion.toLowerCase();
    
    for (const ciudad of ciudades) {
      if (ubicacionLower.includes(ciudad)) {
        return ciudad.charAt(0).toUpperCase() + ciudad.slice(1);
      }
    }
    
    // Si no encuentra una ciudad conocida, usar la primera palabra
    return ubicacion.split(',')[0].trim() || 'No especificada';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Generando estadísticas...</Text>
      </View>
    );
  }
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.subtitle}>Análisis de casos de personas desaparecidas</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen General</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{estadisticas.total || 0}</Text>
              <Text style={styles.statLabel}>Total de Casos</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{estadisticas.activos || 0}</Text>
              <Text style={styles.statLabel}>Casos Activos</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{estadisticas.encontrados || 0}</Text>
              <Text style={styles.statLabel}>Encontrados</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{estadisticas.porcentajeExito || 0}%</Text>
              <Text style={styles.statLabel}>Tasa de Éxito</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.highlightNumber}>{estadisticas.recientes || 0}</Text>
            <Text style={styles.highlightLabel}>Reportes últimos 30 días</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Por Ubicación</Text>
          <View style={styles.regionStats}>
            {estadisticas.topUbicaciones?.map(([ciudad, cantidad]: [string, number], index: number) => {
              const porcentaje = estadisticas.total > 0 ? (cantidad / estadisticas.total) * 100 : 0;
              return (
                <View key={ciudad} style={styles.regionItem}>
                  <Text style={styles.regionName}>{ciudad}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progress, { width: `${porcentaje}%` }]} />
                  </View>
                  <Text style={styles.regionCount}>{cantidad} casos ({porcentaje.toFixed(1)}%)</Text>
                </View>
              );
            })}
            {(!estadisticas.topUbicaciones || estadisticas.topUbicaciones.length === 0) && (
              <Text style={styles.noData}>No hay datos de ubicación disponibles</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análisis por Edad</Text>
          <View style={styles.ageStats}>
            <Text style={styles.ageItem}>👶 0-12 años: {estadisticas.edades?.['0-12'] || 0} casos</Text>
            <Text style={styles.ageItem}>🧒 13-17 años: {estadisticas.edades?.['13-17'] || 0} casos</Text>
            <Text style={styles.ageItem}>👨 18-30 años: {estadisticas.edades?.['18-30'] || 0} casos</Text>
            <Text style={styles.ageItem}>👩 31-50 años: {estadisticas.edades?.['31-50'] || 0} casos</Text>
            <Text style={styles.ageItem}>👴 50+ años: {estadisticas.edades?.['50+'] || 0} casos</Text>
          </View>
        </View>

        {/* Sección de algoritmos inteligentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 Inteligencia Artificial</Text>
          <View style={styles.aiStats}>
            <View style={styles.aiCard}>
              <Text style={styles.aiTitle}>Clasificación de Urgencia</Text>
              <Text style={styles.aiDescription}>
                Algoritmo de árboles de decisión activo clasificando casos por prioridad
              </Text>
              <Text style={styles.aiMetric}>
                ✅ {estadisticas.activos || 0} casos analizados
              </Text>
            </View>
            
            <View style={styles.aiCard}>
              <Text style={styles.aiTitle}>Difusión Geolocalizada</Text>
              <Text style={styles.aiDescription}>
                Sistema kNN para notificaciones inteligentes por proximidad
              </Text>
              <Text style={styles.aiMetric}>
                📍 {estadisticas.topUbicaciones?.length || 0} zonas activas
              </Text>
            </View>
            
            <View style={styles.aiCard}>
              <Text style={styles.aiTitle}>Detección de Patrones</Text>
              <Text style={styles.aiDescription}>
                Clustering para identificar zonas y tiempos críticos
              </Text>
              <Text style={styles.aiMetric}>
                🔍 Análisis continuo activo
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  regionStats: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  regionItem: {
    marginBottom: 15,
  },
  regionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    marginBottom: 5,
  },
  progress: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  regionCount: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  ageStats: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  ageItem: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 10,
    paddingVertical: 5,
  },
  aiStats: {
    flexDirection: 'column',
    gap: 15,
  },
  aiCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    marginBottom: 10,
  },
  aiTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  aiDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  aiMetric: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  highlightNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    textAlign: 'center',
  },
  highlightLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 5,
  },
  noData: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});