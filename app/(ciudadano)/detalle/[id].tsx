import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { obtenerReportePorIdConUsuario } from '../../../DB/supabase';
import { useAuth } from '../../../context/AuthContext';

export default function DetalleReporte() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [reporte, setReporte] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const reporteId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    const cargarReporte = async () => {
      if (!reporteId) {
        setError('ID de reporte no proporcionado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Usar la nueva función que detecta si es el propio reporte del usuario
        const resultado = await obtenerReportePorIdConUsuario(reporteId, user?.id || null);
        
        if (resultado.success && resultado.data) {
          setReporte(resultado.data);
          setError(null);
        } else {
          setError((resultado as any).error || 'Reporte no encontrado');
        }
      } catch (error) {
        console.error('Error al cargar reporte:', error);
        setError('Error al cargar el reporte');
      } finally {
        setLoading(false);
      }
    };

    cargarReporte();
  }, [reporteId]);

  const formatearFecha = (fechaString: string) => {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return fechaString;
    }
  };

  const formatearHora = (horaString: string) => {
    try {
      const [horas, minutos] = horaString.split(':');
      return `${horas}:${minutos} hrs`;
    } catch (error) {
      return horaString;
    }
  };

  const handleCall = () => {
    if (!reporte?.telefono_reportante) {
      Alert.alert('Error', 'No hay número de teléfono disponible');
      return;
    }

    Alert.alert(
      'Llamar',
      `¿Deseas llamar al ${reporte.telefono_reportante}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Llamar', 
          onPress: () => {
            Linking.openURL(`tel:${reporte.telefono_reportante}`);
          }
        }
      ]
    );
  };

  const handleEmail = () => {
    if (!reporte?.correo_reportante) {
      Alert.alert('Error', 'No hay correo electrónico disponible');
      return;
    }

    Alert.alert(
      'Enviar Correo',
      `¿Deseas enviar un correo a ${reporte.correo_reportante}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Enviar', 
          onPress: () => {
            Linking.openURL(`mailto:${reporte.correo_reportante}`);
          }
        }
      ]
    );
  };

  const handleProvideInfo = () => {
    Alert.alert(
      'Proporcionar Información',
      'Si tienes información sobre esta persona, por favor contacta al reportante usando los botones de arriba.',
      [{ text: 'Entendido' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Cargando reporte...</Text>
      </View>
    );
  }

  if (error || !reporte) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ {error || 'Reporte no encontrado'}</Text>
        <Text style={styles.errorSubtext}>ID: {reporteId || 'No proporcionado'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{reporte.nombre_desaparecido}</Text>
        <View style={[
          styles.statusBadge, 
          { 
            backgroundColor: reporte.estatus === 'desaparecido' ? '#e74c3c' : 
                            reporte.estatus === 'encontrado' ? '#27ae60' : '#f39c12'
          }
        ]}>
          <Text style={styles.statusText}>
            {reporte.estatus === 'desaparecido' ? '🔴 DESAPARECIDO' : 
             reporte.estatus === 'encontrado' ? '🟢 ENCONTRADO' : '🟡 PENDIENTE'}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Información de la Persona Desaparecida */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Información de la Persona</Text>

          {/* Mostrar imagen si está disponible */}
          {reporte.foto_url ? (
            <>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Image 
                  source={{ uri: reporte.foto_url }} 
                  style={styles.image} 
                  resizeMode="cover" 
                />
              </TouchableOpacity>

              {/* Modal para ampliar la imagen */}
              <Modal
                visible={modalVisible}
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
              >
                <View style={styles.modalContainer}>
                  <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalCloseText}>✖</Text>
                  </TouchableOpacity>
                  <Image 
                    source={{ uri: reporte.foto_url }} 
                    style={styles.modalImage} 
                    resizeMode="contain" 
                  />
                </View>
              </Modal>
            </>
          ) : (
            <Text style={styles.infoText}>No hay imagen disponible</Text>
          )}

          {reporte.edad && (
            <Text style={styles.infoText}><Text style={styles.label}>Edad:</Text> {reporte.edad} años</Text>
          )}
          
          {reporte.sexo && (
            <Text style={styles.infoText}><Text style={styles.label}>Sexo:</Text> {reporte.sexo}</Text>
          )}
          
          {reporte.descripcion && (
            <>
              <Text style={styles.label}>Descripción Física:</Text>
              <Text style={[styles.infoText, styles.multilineText]}>{reporte.descripcion}</Text>
            </>
          )}
          
          {reporte.ropa && (
            <>
              <Text style={styles.label}>Ropa que Vestía:</Text>
              <Text style={[styles.infoText, styles.multilineText]}>{reporte.ropa}</Text>
            </>
          )}
        </View>

        {/* Información de la Desaparición */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Información de la Desaparición</Text>
          
          <Text style={styles.infoText}><Text style={styles.label}>Última Ubicación:</Text> {reporte.ultima_ubicacion}</Text>
          
          {reporte.ultima_fecha_visto && (
            <Text style={styles.infoText}><Text style={styles.label}>Fecha:</Text> {formatearFecha(reporte.ultima_fecha_visto)}</Text>
          )}
          
          {reporte.ultima_hora_visto && (
            <Text style={styles.infoText}><Text style={styles.label}>Hora:</Text> {formatearHora(reporte.ultima_hora_visto)}</Text>
          )}
          
          {reporte.circunstancias && (
            <>
              <Text style={styles.label}>Circunstancias:</Text>
              <Text style={[styles.infoText, styles.multilineText]}>{reporte.circunstancias}</Text>
            </>
          )}
        </View>

        {/* Información del Reportante */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>📞 Información de Contacto</Text>
            {reporte.es_propio && (
              <View style={styles.ownReportBadge}>
                <Text style={styles.ownReportText}>TU REPORTE</Text>
              </View>
            )}
          </View>
          
          {reporte.nombre_reportante && (
            <Text style={styles.infoText}><Text style={styles.label}>Nombre del Reportante:</Text> {reporte.nombre_reportante}</Text>
          )}
          
          {reporte.relacion_reportante && (
            <Text style={styles.infoText}><Text style={styles.label}>Relación:</Text> {reporte.relacion_reportante}</Text>
          )}
          
          {reporte.telefono_reportante && (
            <Text style={styles.infoText}><Text style={styles.label}>Teléfono:</Text> {reporte.telefono_reportante}</Text>
          )}
          
          {reporte.correo_reportante && (
            <Text style={styles.infoText}><Text style={styles.label}>Correo:</Text> {reporte.correo_reportante}</Text>
          )}
        </View>

        {/* Información Adicional */}
        {(reporte.denuncia_oficial || reporte.autoridad_notificada || reporte.comentarios) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Información Adicional</Text>
            
            {reporte.denuncia_oficial && (
              <Text style={styles.infoText}><Text style={styles.label}>Denuncia Oficial:</Text> {reporte.denuncia_oficial}</Text>
            )}
            
            {reporte.autoridad_notificada && (
              <Text style={styles.infoText}><Text style={styles.label}>Autoridad Notificada:</Text> {reporte.autoridad_notificada}</Text>
            )}
            
            {reporte.comentarios && (
              <>
                <Text style={styles.label}>Comentarios Adicionales:</Text>
                <Text style={[styles.infoText, styles.multilineText]}>{reporte.comentarios}</Text>
              </>
            )}
          </View>
        )}

        {/* Botones de Acción - Solo para reportes de otros usuarios */}
        {reporte.estatus === 'desaparecido' && !reporte.es_propio && (
          <View style={styles.buttonContainer}>
            {reporte.telefono_reportante && (
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <Text style={styles.buttonText}>📞 Llamar al Reportante</Text>
              </TouchableOpacity>
            )}
            
            {reporte.correo_reportante && (
              <TouchableOpacity style={styles.emailButton} onPress={handleEmail}>
                <Text style={styles.buttonTextSecondary}>✉️ Enviar Correo</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Mensaje especial para reportes propios */}
        {reporte.estatus === 'desaparecido' && reporte.es_propio && (
          <View style={styles.ownReportMessage}>
            <Text style={styles.ownReportMessageTitle}>📱 Tu Reporte Activo</Text>
            <Text style={styles.ownReportMessageText}>
              Este es tu reporte. Si has recibido información sobre esta persona, puedes actualizar el reporte o contactar directamente a las autoridades.
            </Text>
          </View>
        )}

        {reporte.estatus === 'encontrado' && (
          <View style={styles.foundContainer}>
            <Text style={styles.foundText}>🎉 Esta persona ya fue encontrada</Text>
            <Text style={styles.foundSubtext}>Gracias a todos los que ayudaron en la búsqueda</Text>
          </View>
        )}

        {/* Información del Sistema */}
        <View style={styles.systemInfo}>
          <Text style={styles.systemText}>
            Reportado el: <Text style={styles.systemValue}>{formatearFecha(reporte.created_at)}</Text>
          </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  ownReportBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ownReportText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ownReportMessage: {
    backgroundColor: '#e8f4fd',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  ownReportMessageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  ownReportMessageText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 22,
  },
  multilineText: {
    lineHeight: 24,
    marginTop: 4,
  },
  label: {
    fontWeight: 'bold',
    color: '#34495e',
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  callButton: {
    backgroundColor: '#27ae60',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  emailButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  infoButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  foundContainer: {
    backgroundColor: '#d5f4e6',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#27ae60',
    marginTop: 20,
  },
  foundText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 8,
  },
  foundSubtext: {
    fontSize: 14,
    color: '#2d8f47',
    textAlign: 'center',
  },
  systemInfo: {
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  systemText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  systemValue: {
    fontWeight: 'bold',
    color: '#2c3e50',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '90%',
    height: '80%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  modalCloseText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});