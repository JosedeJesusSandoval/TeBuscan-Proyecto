import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { actualizarReporte, supabase } from '../../../DB/supabase';
import { useAuth } from '../../../context/AuthContext';
import { decryptSensitiveData } from '../../../utils/crypto';

interface DetalleReporte {
  id: string;
  nombre_desaparecido: string;
  edad: number;
  descripcion: string;
  ultima_ubicacion: string;
  ultima_fecha_visto: string;
  telefono_reportante?: string;
  nombre_reportante?: string;
  relacion_reportante?: string;
  correo_reportante?: string;
  comentarios?: string;
  estatus: string;
  created_at: string;
  foto_url?: string;
  usuarios: { name: string }[];
}

export default function DetalleCasoAutoridad() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [reporte, setReporte] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [datosDesencriptados, setDatosDesencriptados] = useState<{[key: string]: string}>({});
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    cargarDetalle();
  }, [id]);

  const mostrarDatoDesencriptado = (dato: string) => {
    if (datosDesencriptados[dato]) {
      return datosDesencriptados[dato];
    }
    
    // Intentar desencriptar datos que parecen encriptados
    // Base64 puede incluir caracteres A-Z, a-z, 0-9, +, /, = y tener longitud múltiplo de 4
    const esFormatoBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(dato) && dato.length >= 4 && dato.length % 4 === 0;
    const tieneCaracteresEncriptados = dato && (dato.includes('=') || esFormatoBase64);
    
    if (tieneCaracteresEncriptados) {
      // Hacer la desencriptación de forma asíncrona
      (async () => {
        try {
          console.log(`Intentando desencriptar: "${dato}"`);
          const decrypted = await decryptSensitiveData(dato);
          console.log(`Resultado desencriptado: "${decrypted}"`);
          
          if (decrypted && decrypted !== dato && decrypted.trim() !== '') {
            setDatosDesencriptados(prev => ({
              ...prev,
              [dato]: decrypted
            }));
            console.log(`✅ Desencriptación exitosa: ${dato} -> ${decrypted}`);
          } else {
            // Si el resultado es igual al original, probablemente no estaba encriptado
            setDatosDesencriptados(prev => ({
              ...prev,
              [dato]: dato
            }));
            console.log(`⚠️ Dato no encriptado o desencriptación sin cambios: ${dato}`);
          }
        } catch (error) {
          console.log(`❌ Error desencriptando "${dato}":`, error);
          // Si no se puede desencriptar, usar el original
          setDatosDesencriptados(prev => ({
            ...prev,
            [dato]: dato
          }));
        }
      })();
    }
    
    return dato;
  };

  // Función local para obtener un reporte específico con contacto
  const obtenerReportePorId = async (reporteId: string) => {
    try {
      const selectFields = `
        id,
        nombre_desaparecido,
        edad,
        descripcion,
        ultima_ubicacion,
        ultima_fecha_visto,
        estatus,
        created_at,
        foto_url,
        nombre_reportante,
        relacion_reportante,
        telefono_reportante,
        correo_reportante,
        comentarios,
        usuarios(name)
      `;

      const { data, error } = await supabase
        .from('reportes')
        .select(selectFields)
        .eq('id', reporteId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  };

  const desencriptarDatosSensibles = async (reporteData: any) => {
    const camposSensibles = ['telefono_reportante', 'correo_reportante', 'nombre_reportante', 'relacion_reportante'];
    
    for (const campo of camposSensibles) {
      const valor = reporteData[campo];
      if (valor && typeof valor === 'string') {
        try {
          console.log(`🔍 Procesando ${campo}: "${valor}"`);
          
          // Verificar si parece ser Base64
          const esFormatoBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(valor) && 
                                  valor.length >= 4 && 
                                  valor.length % 4 === 0;
          
          if (esFormatoBase64 || valor.includes('=')) {
            const decrypted = await decryptSensitiveData(valor);
            console.log(`🔓 ${campo} desencriptado: "${valor}" -> "${decrypted}"`);
            
            if (decrypted && decrypted !== valor && decrypted.trim() !== '') {
              setDatosDesencriptados(prev => ({
                ...prev,
                [valor]: decrypted
              }));
              console.log(`✅ ${campo} actualizado en estado`);
            } else {
              console.log(`⚠️ ${campo}: desencriptación sin cambios`);
              setDatosDesencriptados(prev => ({
                ...prev,
                [valor]: valor
              }));
            }
          } else {
            console.log(`📝 ${campo}: texto plano, no requiere desencriptación`);
            setDatosDesencriptados(prev => ({
              ...prev,
              [valor]: valor
            }));
          }
        } catch (error) {
          console.error(`❌ Error desencriptando ${campo}:`, error);
          setDatosDesencriptados(prev => ({
            ...prev,
            [valor]: valor
          }));
        }
      }
    }
  };

  const cargarDetalle = async () => {
    try {
      setLoading(true);
      
      if (!user?.id || !user?.rol) {
        Alert.alert('Error', 'Usuario no autenticado');
        router.back();
        return;
      }

      if (!id) {
        Alert.alert('Error', 'ID de reporte no válido');
        router.back();
        return;
      }

      console.log('Cargando reporte con ID:', id);
      const resultado = await obtenerReportePorId(id as string);
      
      if (resultado.success && resultado.data) {
        console.log('Reporte encontrado:', resultado.data);
        console.log('Teléfono reportante:', resultado.data.telefono_reportante);
        console.log('Correo reportante:', resultado.data.correo_reportante);
        console.log('Nombre reportante:', resultado.data.nombre_reportante);
        setReporte(resultado.data);
        
        // Desencriptar inmediatamente todos los datos sensibles
        await desencriptarDatosSensibles(resultado.data);
      } else {
        console.error('Error al obtener reporte:', resultado.error);
        Alert.alert('Error', resultado.error || 'Reporte no encontrado');
        router.back();
      }
    } catch (error) {
      console.error('Error cargando detalle:', error);
      Alert.alert('Error', 'Error al cargar el detalle');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstatus = async (nuevoEstatus: string) => {
    if (!reporte) {
      Alert.alert('Error', 'No hay reporte cargado');
      return;
    }

    const estatusTexto = nuevoEstatus === 'encontrado' ? 'ENCONTRADO' : 
                        nuevoEstatus === 'en_progreso' ? 'EN PROGRESO' : 
                        nuevoEstatus === 'desaparecido' ? 'DESAPARECIDO' : 
                        nuevoEstatus.toUpperCase();

    Alert.alert(
      'Confirmar Cambio',
      `¿Estás seguro de cambiar el estatus a "${estatusTexto}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setUpdatingStatus(true);
            try {
              console.log(`🔄 Actualizando estatus de ${reporte.id} a: ${nuevoEstatus}`);
              
              const resultado = await actualizarReporte(reporte.id, {
                estatus: nuevoEstatus
              });

              console.log('📋 Resultado de actualización:', resultado);

              if (resultado.success) {
                console.log(`✅ Estatus actualizado exitosamente a: ${nuevoEstatus}`);
                
                // Actualizar el estado local
                setReporte((prev: any) => {
                  if (prev) {
                    const updated = { ...prev, estatus: nuevoEstatus };
                    console.log('📱 Estado local actualizado:', updated.estatus);
                    return updated;
                  }
                  return null;
                });
                
                Alert.alert('Éxito', `Estatus actualizado a ${estatusTexto}`);
                
                // Recargar el reporte para confirmar que se guardó
                setTimeout(() => {
                  cargarDetalle();
                }, 1000);
                
              } else {
                console.error('❌ Error en resultado:', resultado.error);
                Alert.alert('Error', resultado.error || 'No se pudo actualizar el estatus');
              }
            } catch (error) {
              console.error('💥 Error actualizando estatus:', error);
              Alert.alert('Error', 'Error al actualizar el estatus');
            } finally {
              setUpdatingStatus(false);
            }
          }
        }
      ]
    );
  };

  const llamarContacto = async () => {
    if (!reporte?.telefono_reportante) {
      Alert.alert('Error', 'No hay teléfono de contacto disponible');
      return;
    }

    try {
      let telefono = reporte.telefono_reportante;
      console.log('Teléfono original:', telefono);
      
      // Intentar desencriptar si está encriptado
      try {
        const decrypted = await decryptSensitiveData(telefono);
        if (decrypted && decrypted !== telefono) {
          telefono = decrypted;
          console.log('Teléfono desencriptado:', telefono);
        }
      } catch (error) {
        console.log('Teléfono no encriptado, usando valor original');
      }

      // Limpiar el número de teléfono: solo números y algunos caracteres especiales
      const telefonoLimpio = telefono.replace(/[^\d+\-\(\)\s\.]/g, '');
      console.log('Teléfono limpio:', telefonoLimpio);

      // Extraer solo los números para validación
      const soloNumeros = telefonoLimpio.replace(/[^\d]/g, '');
      console.log('Solo números:', soloNumeros);

      if (!soloNumeros || soloNumeros.length < 7) {
        // Mostrar el número original para que el usuario vea qué está mal
        Alert.alert(
          'Número inválido', 
          `El número "${telefono}" no es válido. Debe tener al menos 7 dígitos.`
        );
        return;
      }

      const phoneUrl = `tel:${telefonoLimpio}`;
      console.log('URL de teléfono:', phoneUrl);
      
      // En lugar de verificar canOpenURL, intentar abrir directamente
      try {
        await Linking.openURL(phoneUrl);
        console.log('Llamada iniciada exitosamente');
      } catch (openError) {
        console.error('Error al abrir URL:', openError);
        
        // Intentar con formato alternativo (solo números)
        const soloNumeros = telefonoLimpio.replace(/[^\d]/g, '');
        if (soloNumeros && soloNumeros.length >= 7) {
          try {
            await Linking.openURL(`tel:${soloNumeros}`);
            console.log('Llamada iniciada con números únicamente');
          } catch (secondError) {
            Alert.alert('Error', 'No se puede realizar la llamada. Verifica que tengas una aplicación de teléfono instalada.');
          }
        } else {
          Alert.alert('Error', 'No se puede realizar la llamada');
        }
      }
    } catch (error) {
      console.error('Error al intentar llamar:', error);
      Alert.alert('Error', 'Error al intentar hacer la llamada');
    }
  };

  const enviarCorreo = async () => {
    if (!reporte?.correo_reportante) {
      Alert.alert('Error', 'No hay correo de contacto disponible');
      return;
    }

    try {
      let correo = reporte.correo_reportante;
      console.log('Correo original:', correo);
      
      // Intentar desencriptar si está encriptado
      try {
        const decrypted = await decryptSensitiveData(correo);
        if (decrypted && decrypted !== correo) {
          correo = decrypted;
          console.log('Correo desencriptado:', correo);
        }
      } catch (error) {
        console.log('Correo no encriptado, usando valor original');
      }

      // Validar formato de correo básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        Alert.alert('Error', 'El correo electrónico no tiene un formato válido');
        return;
      }

      const folioCorto = reporte.id.substring(0, 8).toUpperCase();
      const subject = `Actualización sobre el caso de ${reporte.nombre_desaparecido}`;
      const body = `Estimado/a ${reporte.nombre_reportante || 'Ciudadano/a'},

Este correo es para proporcionarle una actualización sobre el caso de ${reporte.nombre_desaparecido}.

Folio del caso: #${folioCorto}

Saludos cordiales,
Autoridades TeBuscan`;
      
      const mailUrl = `mailto:${correo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      console.log('URL de correo:', mailUrl);
      
      try {
        await Linking.openURL(mailUrl);
        console.log('Cliente de correo abierto exitosamente');
      } catch (openError) {
        console.error('Error al abrir cliente de correo:', openError);
        Alert.alert('Error', 'No se puede abrir el cliente de correo. Verifica que tengas una aplicación de correo configurada.');
      }
    } catch (error) {
      console.error('Error al intentar enviar correo:', error);
      Alert.alert('Error', 'Error al intentar enviar correo');
    }
  };

  const copiarFolio = async () => {
    try {
      const folioCorto = reporte.id.substring(0, 8).toUpperCase();
      await Clipboard.setString(`#${folioCorto}`);
      Alert.alert('Copiado', `Folio #${folioCorto} copiado al portapapeles`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo copiar el folio');
    }
  };



  const abrirUbicacion = async () => {
    if (!reporte?.ultima_ubicacion) {
      Alert.alert('Error', 'No hay ubicación disponible');
      return;
    }

    try {
      const ubicacion = encodeURIComponent(reporte.ultima_ubicacion);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${ubicacion}`;
      
      const canOpen = await Linking.canOpenURL(mapsUrl);
      if (canOpen) {
        await Linking.openURL(mapsUrl);
      } else {
        Alert.alert('Error', 'No se puede abrir el mapa');
      }
    } catch (error) {
      console.error('Error al abrir ubicación:', error);
      Alert.alert('Error', 'Error al abrir la ubicación en el mapa');
    }
  };





  const formatearFecha = (fechaString: string) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activo': return '#e74c3c';
      case 'desaparecido': return '#e74c3c'; // Mismo color que activo
      case 'en_progreso': return '#f39c12'; // Mantener por casos existentes
      case 'encontrado': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'activo': return 'ACTIVO';
      case 'desaparecido': return 'DESAPARECIDO';
      case 'en_progreso': return 'EN PROGRESO'; // Mantener por casos existentes
      case 'encontrado': return 'ENCONTRADO';
      default: return status.toUpperCase();
    }
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Cargando detalle del caso...</Text>
      </View>
    );
  }

  if (!reporte) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar el reporte</Text>
        <TouchableOpacity
          style={{ 
            backgroundColor: '#e74c3c', 
            padding: 12, 
            borderRadius: 8, 
            marginTop: 20 
          }}
          onPress={() => router.push('/(autoridad)/casos')}
        >
          <Text style={{ 
            color: 'white', 
            fontSize: 16, 
            fontWeight: '600', 
            textAlign: 'center' 
          }}>← Regresar a Casos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Casos',
          headerStyle: { backgroundColor: '#e74c3c' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
      <ScrollView style={styles.container}>
        {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reporte.estatus) }]}>
        <Text style={styles.statusText}>{getStatusText(reporte.estatus)}</Text>
      </View>

      {/* Información Principal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Información del Desaparecido</Text>
        <View style={styles.infoCard}>
          <Text style={styles.personName}>{reporte.nombre_desaparecido}</Text>
          
          {/* Mostrar imagen si está disponible */}
          {reporte.foto_url ? (
            <TouchableOpacity 
              style={styles.imageContainer} 
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: reporte.foto_url }} 
                style={styles.personImage} 
                resizeMode="cover" 
              />
              <View style={styles.imageOverlay}>
                <Text style={styles.imageOverlayText}>👆 Toca para ampliar</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>📷 Sin imagen disponible</Text>
            </View>
          )}
          
          <Text style={styles.infoRow}>👤 Edad: {reporte.edad} años</Text>
          <Text style={styles.infoRow}>📍 Última ubicación: {reporte.ultima_ubicacion}</Text>
          <Text style={styles.infoRow}>📅 Última vez visto: {reporte.ultima_fecha_visto}</Text>
        </View>
      </View>

      {/* Modal para ampliar la imagen */}
      {reporte.foto_url && (
        <Modal
          visible={modalVisible}
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
          animationType="fade"
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✖</Text>
            </TouchableOpacity>
            <Image 
              source={{ uri: reporte.foto_url }} 
              style={styles.modalImage} 
              resizeMode="contain" 
            />
            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoText}>
                📋 {reporte.nombre_desaparecido} • {reporte.edad} años
              </Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Descripción */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Descripción</Text>
        <View style={styles.infoCard}>
          <Text style={styles.description}>{reporte.descripcion}</Text>
        </View>
      </View>

      {/* Información de Contacto */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📞 Contacto</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoRow}>
            👤 Reportado por: {reporte.usuarios?.name || reporte.usuarios?.[0]?.name || 'Usuario no disponible'}
          </Text>
          {reporte.nombre_reportante && (
            <Text style={styles.infoRow}>
              📝 Contacto: {mostrarDatoDesencriptado(reporte.nombre_reportante)}
            </Text>
          )}
          {reporte.relacion_reportante && (
            <Text style={styles.infoRow}>
              👥 Relación: {mostrarDatoDesencriptado(reporte.relacion_reportante)}
            </Text>
          )}
          {reporte.telefono_reportante && (
            <Text style={styles.infoRow}>
              📱 Teléfono: {mostrarDatoDesencriptado(reporte.telefono_reportante)}
            </Text>
          )}
          {reporte.correo_reportante && (
            <Text style={styles.infoRow}>
              📧 Correo: {mostrarDatoDesencriptado(reporte.correo_reportante)}
            </Text>
          )}
          
          {/* Botones de Contacto */}
          <View style={styles.contactButtonsContainer}>
            {reporte.telefono_reportante && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={llamarContacto}
              >
                <Text style={styles.callButtonText}>📞 Llamar</Text>
              </TouchableOpacity>
            )}
            {reporte.correo_reportante && (
              <TouchableOpacity
                style={styles.emailButton}
                onPress={enviarCorreo}
              >
                <Text style={styles.emailButtonText}>� Enviar Correo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Información del Reporte */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ Detalles del Reporte</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoRow}>
            📅 Fecha de reporte: {formatearFecha(reporte.created_at)}
          </Text>
          <Text style={styles.infoRow}>
            📋 Folio del caso: #{reporte.id.substring(0, 8).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Notas de Autoridad */}
      {reporte.comentarios && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Notas de Autoridad</Text>
          <View style={styles.infoCard}>
            <Text style={styles.description}>{reporte.comentarios}</Text>
          </View>
        </View>
      )}

      {/* Acciones de Autoridad */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚨 Acciones de Autoridad</Text>
        
        {/* Botones de Acción */}
        <TouchableOpacity
          style={[styles.actionButton, styles.utilityButton]}
          onPress={copiarFolio}
        >
          <Text style={styles.actionButtonText}>📋 Copiar Folio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.utilityButton]}
          onPress={abrirUbicacion}
        >
          <Text style={styles.actionButtonText}>🗺️ Ver Ubicación</Text>
        </TouchableOpacity>
        <View style={styles.actionButtonsContainer}>
          {(reporte.estatus === 'activo' || reporte.estatus === 'desaparecido' || reporte.estatus === 'en_progreso') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.foundButton]}
              onPress={() => actualizarEstatus('encontrado')}
              disabled={updatingStatus}
            >
              <Text style={styles.actionButtonText}>
                {updatingStatus ? 'Actualizando...' : '✅ Encontrado'}
              </Text>
            </TouchableOpacity>
          )}

          {reporte.estatus === 'encontrado' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.reactivateButton]}
              onPress={() => actualizarEstatus('desaparecido')}
              disabled={updatingStatus}
            >
              <Text style={styles.actionButtonText}>
                {updatingStatus ? 'Actualizando...' : '🔄 Reactivar Caso'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusBadge: {
    margin: 20,
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  personName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  infoRow: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  contactButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  callButton: {
    backgroundColor: '#27ae60',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  callButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emailButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  emailButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  actionButtonsContainer: {
    gap: 10,
  },
  actionButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  progressButton: {
    backgroundColor: '#f39c12',
  },
  foundButton: {
    backgroundColor: '#2ecc71',
  },
  resolvedButton: {
    backgroundColor: '#27ae60',
  },
  reactivateButton: {
    backgroundColor: '#3498db',
  },
  utilityButton: {
    backgroundColor: '#6c757d',
    marginBottom: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // ============ ESTILOS PARA IMÁGENES ============
  imageContainer: {
    position: 'relative',
    marginVertical: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  personImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f5f5f5',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  imageOverlayText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  noImageContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 15,
  },
  noImageText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // ============ ESTILOS PARA MODAL ============
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalImage: {
    width: '100%',
    height: '80%',
    borderRadius: 12,
  },
  modalInfo: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modalInfoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});