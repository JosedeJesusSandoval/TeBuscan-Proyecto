import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { actualizarUsuario, cambiarContrasena, obtenerReportesPorUsuario, supabase } from '../../DB/supabase';
import { useAuth } from '../../context/AuthContext';
import { validatePassword } from '../../utils/passwordValidation';

export default function PerfilScreen() {
  const { user, setUser, logout } = useAuth();
  const [reportes, setReportes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [userData, setUserData] = useState({
    name: user?.name || '',
    telefono: user?.telefono || '',
    email: user?.email || ''
  });
  const [saving, setSaving] = useState(false);

  // Cargar reportes del usuario
  const cargarReportes = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const resultado = await obtenerReportesPorUsuario(user.id);

      if (resultado.success) {
        setReportes(resultado.data || []);
      } else {
        console.error('Error al cargar reportes:', resultado.error);
      }
    } catch (error) {
      console.error('Error al cargar reportes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const cargarUsuario = async () => {
      const session = await supabase.auth.getSession();

      if (session.data.session) {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, name, telefono, email, rol')
          .eq('id', session.data.session.user.id)
          .single();

        if (data) {
          console.log('Datos del usuario:', data);
          setUser(data);
        } else {
          console.error('Error al cargar usuario:', error);
        }
      }
    };

    cargarUsuario();
  }, []);

  useEffect(() => {
    if (user?.id) {
      cargarReportes();
    }
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarReportes();
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          onPress: () => {
            logout();
            router.replace('/');
          }
        }
      ]
    );
  };

  const handleChangePassword = async () => {
    const passwordValidation = validatePassword(passwordData.newPassword);

    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }

    if (!passwordValidation.isValid) {
      Alert.alert(
        'Contraseña insegura',
        'Tu contraseña debe cumplir los requisitos de seguridad:\n\n' +
          '- Mínimo 8 caracteres\n' +
          '- Al menos una mayúscula (A-Z)\n' +
          '- Al menos una minúscula (a-z)\n' +
          '- Al menos un número (0-9)\n' +
          '- Al menos un símbolo (!@#$%^&*)'
      );
      return;
    }

    try {
      setSaving(true);
      const resultado = await cambiarContrasena(user?.email, passwordData.newPassword);

      if (resultado.success) {
        Alert.alert('Éxito', 'Contraseña cambiada correctamente');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setModalVisible(false);
      } else {
        Alert.alert('Error', resultado.error || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userData.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);
      const resultado = await actualizarUsuario(user?.id, userData);

      if (resultado.success) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        setUser({
          ...user,
          ...userData,
          id: user?.id || '', 
          rol: user?.rol || 'ciudadano',
        });
        setEditModalVisible(false);
      } else {
        Alert.alert('Error', resultado.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const formatearFecha = (fechaString: string) => {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-MX');
    } catch (error) {
      return fechaString;
    }
  };

  const renderReporte = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.reporteCard}
      onPress={() => router.push(`/(ciudadano)/detalle/${item.id}`)}
    >
      <View style={styles.reporteHeader}>
        <Text style={styles.reporteNombre}>{item.nombre_desaparecido}</Text>
        <View style={[
          styles.estadoBadge,
          {
            backgroundColor: item.estatus === 'desaparecido' ? '#e74c3c' :
              item.estatus === 'encontrado' ? '#27ae60' : '#f39c12'
          }
        ]}>
          <Text style={styles.estadoText}>
            {item.estatus === 'desaparecido' ? 'ACTIVO' : 'ENCONTRADO'}
          </Text>
        </View>
      </View>

      <Text style={styles.reporteInfo}>📍 {item.ultima_ubicacion}</Text>
      <Text style={styles.reporteInfo}>📅 {formatearFecha(item.created_at)}</Text>

      <Text style={styles.verMasText}>Toca para ver detalles →</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#3498db']}
        />
      }
    >
      {/* Información del Usuario */}
      <View style={styles.profileSection}>
        <Text style={styles.title}>Mi Perfil</Text>

        <View style={styles.infoCard}>
          <Text style={styles.label}>Nombre:</Text>
          <Text style={styles.value}>{user?.name || 'No especificado'}</Text>

          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email}</Text>

          <Text style={styles.label}>Teléfono:</Text>
          <Text style={styles.value}>{user?.telefono || 'No especificado'}</Text>

          <Text style={styles.label}>Rol:</Text>
          <Text style={styles.value}>{user?.rol === 'ciudadano' ? 'Ciudadano' : 'Autoridad'}</Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.editButton]}
            onPress={() => setEditModalVisible(true)}
          >
            <Text style={[styles.buttonText, styles.editButtonText]}>✏️ Editar Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.passwordButton]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={[styles.buttonText, styles.passwordButtonText]}>🔒 Cambiar Contraseña</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mis Reportes */}
      <View style={styles.reportesSection}>
        <Text style={styles.sectionTitle}>Mis Reportes</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#3498db" style={styles.loading} />
        ) : reportes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No has creado reportes aún</Text>
            <TouchableOpacity
              style={styles.createReportButton}
              onPress={() => router.push('/(ciudadano)/reportar')}
            >
              <Text style={styles.createReportText}>Crear Primer Reporte</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={reportes}
            renderItem={renderReporte}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.reportesList}
          />
        )}
      </View>

      {/* Cerrar Sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Cerrar Sesión</Text>
      </TouchableOpacity>

      {/* Modal Cambiar Contraseña */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>

            <TextInput
              style={styles.input}
              placeholder="Contraseña actual"
              secureTextEntry
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
            />

            <Text style={styles.label}>Nueva Contraseña:</Text>
            <TextInput
              style={styles.input}
              placeholder="Nueva contraseña"
              secureTextEntry
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
            />
            {passwordData.newPassword.length > 0 && (
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>Requisitos de seguridad:</Text>
                <Text style={{ color: validatePassword(passwordData.newPassword).requirements.length ? '#27ae60' : '#e74c3c' }}>
                  - Mínimo 8 caracteres
                </Text>
                <Text style={{ color: validatePassword(passwordData.newPassword).requirements.uppercase ? '#27ae60' : '#e74c3c' }}>
                  - Al menos una mayúscula (A-Z)
                </Text>
                <Text style={{ color: validatePassword(passwordData.newPassword).requirements.lowercase ? '#27ae60' : '#e74c3c' }}>
                  - Al menos una minúscula (a-z)
                </Text>
                <Text style={{ color: validatePassword(passwordData.newPassword).requirements.number ? '#27ae60' : '#e74c3c' }}>
                  - Al menos un número (0-9)
                </Text>
                <Text style={{ color: validatePassword(passwordData.newPassword).requirements.special ? '#27ae60' : '#e74c3c' }}>
                  - Al menos un símbolo (!@#$%^&*)
                </Text>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Confirmar nueva contraseña"
              secureTextEntry
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangePassword}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Perfil */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={userData.name}
              onChangeText={(text) => setUserData({...userData, name: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              keyboardType="phone-pad"
              value={userData.telefono}
              onChangeText={(text) => setUserData({...userData, telefono: text})}
            />

            <TextInput
              style={[styles.input, styles.disabledInput]}
              placeholder="Email"
              value={userData.email}
              editable={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  profileSection: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  passwordButton: {
    backgroundColor: '#9b59b6',
  },
  buttonText: {
    fontSize: 18, 
    fontWeight: 'bold',
    textAlign: 'center',
  },
  editButtonText: {
    color: '#ffffff', 
    textShadowColor: 'rgba(0, 0, 0, 0.3)', 
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  passwordButtonText: {
    color: '#ffffff', 
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  reportesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  loading: {
    marginVertical: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
  },
  createReportButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createReportText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reportesList: {
    gap: 10,
  },
  reporteCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  reporteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reporteNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reporteInfo: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  verMasText: {
    fontSize: 12,
    color: '#3498db',
    fontStyle: 'italic',
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    alignContent: 'center',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    alignContent: 'center',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
    color: '#7f8c8d',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#3498db',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  requirementsContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
});