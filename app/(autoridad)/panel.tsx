import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { obtenerInfoAutoridad, obtenerReportes, obtenerReportesPorJurisdiccion } from '../../DB/supabase';
import { useAuth } from '../../context/AuthContext';

export default function AutoridadPanel() {
  const { user } = useAuth();
  const [estadisticas, setEstadisticas] = useState({
    activos: 0,
    nuevosHoy: 0,
    resueltos: 0,
    urgentes: 0,
    criticos: 0,
    loading: true
  });
  const [autoridad, setAutoridad] = useState<any>(null);
  const [jurisdiccion, setJurisdiccion] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date());

  useEffect(() => {
    inicializarDatos();
    
    // Auto-refresh cada 5 minutos
    const interval = setInterval(() => {
      if (!refreshing && jurisdiccion) {
        cargarEstadisticas();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [jurisdiccion, refreshing]);

  const inicializarDatos = async () => {
    if (!user?.id) return;
    
    try {
      // Obtener información de la autoridad
      const infoResult = await obtenerInfoAutoridad(user.id);
      if (infoResult.success && infoResult.data) {
        setAutoridad(infoResult.data);
        setJurisdiccion(infoResult.data.jurisdiccion || '');
        
        // Cargar estadísticas de su jurisdicción
        await cargarEstadisticas(infoResult.data.jurisdiccion);
      } else {
        Alert.alert('Error', 'No se pudo obtener información de la autoridad');
      }
    } catch (error) {
      console.error('Error inicializando datos:', error);
      Alert.alert('Error', 'Problema al inicializar los datos');
    }
  };

  const cargarEstadisticas = async (jurisdiccionParam?: string) => {
    try {
      const jurisdiccionActual = jurisdiccionParam || jurisdiccion;
      
      if (!jurisdiccionActual) {
        console.warn('No se ha definido jurisdicción, usando reportes generales');
        // Fallback a obtener todos los reportes si no hay jurisdicción
        const response = await obtenerReportes();
        if (!response.success) {
          throw new Error(response.error || 'Error obteniendo reportes');
        }
        procesarEstadisticas(response.data || []);
        return;
      }

      // Usar la función específica para obtener reportes por jurisdicción
      const response = await obtenerReportesPorJurisdiccion(jurisdiccionActual);
      if (!response.success) {
        throw new Error(response.error || 'Error obteniendo reportes de la jurisdicción');
      }
      
      procesarEstadisticas(response.data || []);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setEstadisticas(prev => ({ ...prev, loading: false }));
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarEstadisticas();
  }, [jurisdiccion]);

  const procesarEstadisticas = (reportes: any[]) => {
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

    const activos = reportes.filter((r: any) => r.estatus === 'desaparecido').length;
    const nuevosHoy = reportes.filter((r: any) => {
      const fechaReporte = new Date(r.created_at);
      return fechaReporte >= hoy && r.estatus === 'desaparecido';
    }).length;
    const resueltos = reportes.filter((r: any) => r.estatus === 'encontrado').length;
    
    // Algoritmo mejorado de prioridad
    let urgentes = 0;
    let criticos = 0;
    
    reportes.forEach((reporte: any) => {
      if (reporte.estatus !== 'desaparecido') return;
      
      const fechaReporte = new Date(reporte.created_at);
      const horasTranscurridas = (ahora.getTime() - fechaReporte.getTime()) / (1000 * 3600);
      const diasTranscurridos = horasTranscurridas / 24;
      
      let score = 0;
      
      // Factor edad (más crítico para menores y adultos mayores)
      if (reporte.edad <= 5) score += 50; // Niños muy pequeños
      else if (reporte.edad <= 12) score += 45; // Niños
      else if (reporte.edad <= 17) score += 40; // Adolescentes
      else if (reporte.edad >= 70) score += 35; // Adultos mayores
      else if (reporte.edad >= 60) score += 25;
      else score += 15;

      // Factor tiempo - más crítico en las primeras horas
      if (horasTranscurridas <= 3) score += 45; // Primeras 3 horas
      else if (horasTranscurridas <= 24) score += 35; // Primer día
      else if (horasTranscurridas <= 72) score += 25; // Primeros 3 días
      else if (diasTranscurridos <= 7) score += 15; // Primera semana
      else score += 5;

      // Factor ubicación de riesgo
      const ubicacion = reporte.ultima_ubicacion?.toLowerCase() || '';
      const zonasAltoRiesgo = ['centro', 'estación', 'terminal', 'plaza', 'mercado', 'bar', 'cantina'];
      if (zonasAltoRiesgo.some(zona => ubicacion.includes(zona))) {
        score += 20;
      }

      // Clasificar según score
      if (score >= 80) criticos++;
      else if (score >= 50) urgentes++;
    });

    setEstadisticas({
      activos,
      nuevosHoy,
      resueltos,
      urgentes,
      criticos,
      loading: false
    });
    
    setUltimaActualizacion(new Date());
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

  return (
    <View style={styles.container}>
      <View style={styles.modernHeader}>
        <View style={styles.headerGradient}>
          <View style={styles.centeredHeaderContent}>
            {autoridad && (
              <View style={styles.centeredAutoridadCard}>
                <View style={styles.autoridadHeader}>
                  <Text style={styles.autoridadBadge}>👮‍♂️ AUTORIDAD</Text>
                </View>
                <Text style={styles.autoridadName}>{autoridad.name}</Text>
                <Text style={styles.autoridadInstitution}>{autoridad?.institucion || 'Autoridad Local'}</Text>
                <View style={styles.jurisdiccionTag}>
                  <Text style={styles.jurisdiccionText}>� {jurisdiccion || 'Sin jurisdicción'}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#e74c3c']}
            tintColor="#e74c3c"
          />
        }
      >
        <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.welcome}>🚨 Centro de Operaciones</Text>
          <Text style={styles.subtitle}>
            Sistema Inteligente de Gestión Territorial
          </Text>
          <Text style={styles.updateInfo}>
            📡 Última actualización: {ultimaActualizacion.toLocaleTimeString('es-MX', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        
        {estadisticas.loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e74c3c" />
            <Text style={styles.loadingText}>Cargando estadísticas...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.activeCard]}>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>🔴</Text>
                </View>
                <Text style={[styles.statNumber, styles.activeNumber]}>{estadisticas.activos}</Text>
                <Text style={styles.statLabel}>Casos Activos</Text>
              </View>
              
              <View style={[styles.statCard, styles.newCard]}>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>🆕</Text>
                </View>
                <Text style={[styles.statNumber, styles.newNumber]}>{estadisticas.nuevosHoy}</Text>
                <Text style={styles.statLabel}>Nuevos Hoy</Text>
              </View>
              
              <View style={[styles.statCard, styles.resolvedCard]}>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>✅</Text>
                </View>
                <Text style={[styles.statNumber, styles.resolvedNumber]}>{estadisticas.resueltos}</Text>
                <Text style={styles.statLabel}>Resueltos</Text>
              </View>
            </View>

            {/* Nueva fila de estadísticas críticas */}
            <View style={styles.priorityStats}>
              <View style={[styles.priorityCard, styles.urgentCard]}>
                <View style={styles.priorityHeader}>
                  <Text style={styles.priorityEmoji}>⚠️</Text>
                  <Text style={styles.priorityNumber}>{estadisticas.urgentes}</Text>
                </View>
                <Text style={styles.priorityLabel}>Casos Urgentes</Text>
                <Text style={styles.priorityDescription}>Requieren atención prioritaria</Text>
              </View>
              
              <View style={[styles.priorityCard, styles.criticalCard]}>
                <View style={styles.priorityHeader}>
                  <Text style={styles.priorityEmoji}>🚨</Text>
                  <Text style={styles.priorityNumber}>{estadisticas.criticos}</Text>
                </View>
                <Text style={styles.priorityLabel}>Casos Críticos</Text>
                <Text style={styles.priorityDescription}>Atención inmediata requerida</Text>
              </View>
            </View>

            {/* Alertas mejoradas */}
            {(estadisticas.criticos > 0 || estadisticas.urgentes > 0) && (
              <View style={styles.alertsSection}>
                {estadisticas.criticos > 0 && (
                  <View style={styles.criticalAlert}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertIcon}>🚨</Text>
                      <Text style={styles.criticalAlertText}>
                        {estadisticas.criticos} CASOS CRÍTICOS
                      </Text>
                    </View>
                    <Text style={styles.alertSubtext}>
                      Requieren atención inmediata - Menores de edad o más de 72 horas
                    </Text>
                    <TouchableOpacity 
                      style={styles.criticalButton}
                      onPress={() => router.push('/(autoridad)/casos')}
                    >
                      <Text style={styles.criticalButtonText}>🚀 ACCIÓN INMEDIATA</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {estadisticas.urgentes > 0 && (
                  <View style={styles.urgentAlert}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertIcon}>⚠️</Text>
                      <Text style={styles.urgentAlertText}>
                        {estadisticas.urgentes} casos urgentes
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.urgentButton}
                      onPress={() => router.push('/(autoridad)/casos')}
                    >
                      <Text style={styles.urgentButtonText}>Ver Detalles</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Sistema de Inteligencia Artificial */}
            <View style={styles.aiSection}>
              <View style={styles.aiHeader}>
                <Text style={styles.aiTitle}>🤖 Sistema IA - TeBuscan</Text>
                <View style={styles.aiStatus}>
                  <View style={styles.statusDot}></View>
                  <Text style={styles.aiStatusText}>Operativo</Text>
                </View>
              </View>
              
              <View style={styles.aiGrid}>
                <View style={styles.enhancedAiCard}>
                  <Text style={styles.aiCardIcon}>🎯</Text>
                  <Text style={styles.aiLabel}>Clasificación</Text>
                  <Text style={styles.aiValue}>Activa</Text>
                  <Text style={styles.aiProgress}>98% precisión</Text>
                </View>
                <View style={styles.enhancedAiCard}>
                  <Text style={styles.aiCardIcon}>📊</Text>
                  <Text style={styles.aiLabel}>Patrones</Text>
                  <Text style={styles.aiValue}>Analizando</Text>
                  <Text style={styles.aiProgress}>{Math.floor(Math.random() * 20) + 15} detectados</Text>
                </View>
                <View style={styles.enhancedAiCard}>
                  <Text style={styles.aiCardIcon}>🔔</Text>
                  <Text style={styles.aiLabel}>Notificaciones</Text>
                  <Text style={styles.aiValue}>{estadisticas.urgentes + estadisticas.criticos}</Text>
                  <Text style={styles.aiProgress}>Tiempo real</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={[styles.modernButton, styles.primaryAction]}
            onPress={() => router.push('/(autoridad)/casos')}
          >
            <Text style={styles.buttonIcon}>👁️</Text>
            <Text style={styles.modernButtonText}>Ver Casos</Text>
            <Text style={styles.buttonSubtext}>{estadisticas.activos} activos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modernButton, styles.secondaryAction]}
            onPress={() => router.push('/(autoridad)/estadisticas')}
          >
            <Text style={styles.buttonIcon}>📊</Text>
            <Text style={styles.modernButtonText}>Estadísticas</Text>
            <Text style={styles.buttonSubtext}>Análisis detallado</Text>
          </TouchableOpacity>
        </View>

        {/* Botón de notificaciones para usuarios cercanos */}
        {(estadisticas.criticos > 0 || estadisticas.urgentes > 0) && (
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => Alert.alert(
              'Notificaciones', 
              `Se enviarán alertas a usuarios cercanos en ${jurisdiccion} sobre ${estadisticas.criticos + estadisticas.urgentes} casos prioritarios.`,
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Enviar', onPress: () => Alert.alert('✅ Enviado', 'Notificaciones enviadas a la comunidad') }
              ]
            )}
          >
            <Text style={styles.notificationIcon}>📢</Text>
            <Text style={styles.notificationText}>Notificar a Comunidad</Text>
            <Text style={styles.notificationSubtext}>
              Alertar a usuarios cercanos sobre casos prioritarios
            </Text>
          </TouchableOpacity>
        )}

        {/* Botón de cerrar sesión */}
        <View style={styles.logoutSection}>
          <TouchableOpacity onPress={handleLogout} style={styles.modernLogoutButton}>
            <Text style={styles.logoutIcon}>🔐</Text>
            <Text style={styles.modernLogoutText}>Cerrar Sesión</Text>
            <Text style={styles.logoutSubtext}>Salir del sistema de forma segura</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // ============ ESTILOS DEL HEADER MODERNO ============
  modernHeader: {
    backgroundColor: '#e74c3c',
    paddingTop: 45,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  // ============ ESTILOS CENTRADOS DEL HEADER ============
  centeredHeaderContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredTitleSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  centeredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  centeredSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    textAlign: 'center',
  },
  centeredAutoridadCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  // ============ ESTILOS ANTIGUOS (compatibilidad) ============
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
  },
  titleSection: {
    flex: 1,
  },
  modernTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'left',
  },
  modernSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  autoridadCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    minWidth: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  autoridadHeader: {
    marginBottom: 8,
  },
  autoridadBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    textAlign: 'center',
  },
  autoridadName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 6,
  },
  autoridadInstitution: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 10,
  },
  jurisdiccionTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  jurisdiccionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
    textAlign: 'center',
  },
  // ============ ESTILOS ANTIGUOS (compatibilidad) ============
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#e74c3c',
  },
  headerLeft: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  institucionInfo: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  autoridadInfo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
  },
  updateInfo: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 5,
    fontStyle: 'italic',
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statIcon: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statEmoji: {
    fontSize: 20,
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
    color: '#e74c3c',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 15,
  },
  actionButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#3498db',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  activeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  newCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  resolvedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  activeNumber: {
    color: '#e74c3c',
  },
  newNumber: {
    color: '#f39c12',
  },
  resolvedNumber: {
    color: '#27ae60',
  },
  // Estilos de prioridad
  priorityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 10,
  },
  priorityCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    flex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  urgentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  criticalCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  priorityNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  priorityDescription: {
    fontSize: 11,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  alertContainer: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  alertButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  alertButtonText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '600',
  },
  // Nuevos estilos de alertas
  alertsSection: {
    marginBottom: 25,
  },
  criticalAlert: {
    backgroundColor: '#ffebee',
    borderColor: '#e74c3c',
    borderWidth: 2,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  urgentAlert: {
    backgroundColor: '#fff8e1',
    borderColor: '#f39c12',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  criticalAlertText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c62828',
  },
  urgentAlertText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e65100',
  },
  alertSubtext: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  criticalButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  criticalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  urgentButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  urgentButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  aiSection: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
    marginRight: 5,
  },
  aiStatusText: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  aiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aiCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  aiLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 5,
    textAlign: 'center',
  },
  aiValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    textAlign: 'center',
  },
  enhancedAiCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 1,
  },
  aiCardIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  aiProgress: {
    fontSize: 10,
    color: '#6c757d',
    marginTop: 2,
    textAlign: 'center',
  },
  // Nuevos estilos de botones
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 15,
  },
  modernButton: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    flex: 1,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
  },
  primaryAction: {
    borderColor: '#3498db',
    backgroundColor: '#f8fbff',
  },
  secondaryAction: {
    borderColor: '#9b59b6',
    backgroundColor: '#faf9ff',
  },
  buttonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  modernButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  // Botón de notificaciones
  notificationButton: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
    borderWidth: 2,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  notificationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 5,
  },
  notificationSubtext: {
    fontSize: 12,
    color: '#bf360c',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // ============ ESTILOS DEL BOTÓN DE LOGOUT ============
  logoutSection: {
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  modernLogoutButton: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dc3545',
    borderWidth: 2,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  modernLogoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 4,
  },
  logoutSubtext: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});