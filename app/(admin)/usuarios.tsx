import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
    actualizarUsuario,
    insertarUsuario,
    obtenerUsuarios
} from '../../DB/supabase';
import { hashPassword } from '../../utils/crypto';
import { validatePassword } from '../../utils/passwordValidation';

// Importaciones específicas para activación/desactivación
const { desactivarUsuario, activarUsuario } = require('../../DB/supabase');

interface Usuario {
  id: number;
  name: string;
  email: string;
  rol: string;
  telefono?: string;
  institucion?: string;
  verificado?: boolean;
}

export default function UsuariosScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [formData, setFormData] = useState<{ 
    id?: number;
    name: string; 
    email: string; 
    password?: string; 
    rol: string; 
    telefono?: string; 
    institucion?: string; 
  }>({
    id: undefined,
    name: '', 
    email: '', 
    password: '', 
    rol: '', 
    telefono: '', 
    institucion: '' 
  });
  const [passwordValidation, setPasswordValidation] = useState({
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
    score: 0,
    isValid: false,
  });
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await obtenerUsuarios();
    if (!error && data) {
      setUsers(data);
    } else {
      Alert.alert('Error', 'No se pudieron cargar los usuarios.');
    }
  };

  const handleOpenModal = (rol: string) => {
    setFormData({ name: '', email: '', password: '', rol, telefono: '', institucion: '' });
    setPasswordValidation({
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      },
      score: 0,
      isValid: false,
    });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditModalVisible(false);
    setRoleModalVisible(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });

    if (field === 'password') {
      const validation = validatePassword(value);
      setPasswordValidation(validation);
    }
  };

  const handleSubmit = async () => {
    const { name, email, password, rol, telefono, institucion } = formData;

    // Validaciones básicas
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Error', 'Nombre, email y contraseña son obligatorios.');
      return;
    }

    // Validación específica para autoridades
    if (rol === 'autoridad' && !institucion?.trim()) {
      Alert.alert('Error', 'La institución es obligatoria para usuarios de autoridad.');
      return;
    }

    // Validación de contraseña
    if (!passwordValidation.isValid) {
      Alert.alert(
        'Contraseña inválida', 
        'La contraseña debe cumplir todos los requisitos de seguridad mostrados.'
      );
      return;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido.');
      return;
    }

    try {
      console.log(`🔄 Creando usuario ${rol}: ${email}`);
      
      const hashedPassword = await hashPassword(password);
      const { success, error } = await insertarUsuario(
        name.trim(), 
        email.trim().toLowerCase(), 
        hashedPassword, 
        rol, 
        telefono?.trim() || '', 
        institucion?.trim() || ''
      );

      if (success) {
        const roleText = rol === 'admin' ? 'Administrador' : 'Autoridad';
        const statusText = rol === 'admin' ? 
          'Puede iniciar sesión inmediatamente.' : 
          'Necesita activación manual antes de poder acceder.';
          
        Alert.alert(
          'Usuario Creado Exitosamente', 
          `${roleText} creado: ${email}\n\n${statusText}`
        );
        
        console.log(`✅ Usuario ${rol} creado exitosamente: ${email}`);
        fetchUsers();
        handleCloseModal();
      } else {
        console.error(`❌ Error creando usuario ${rol}:`, error);
        Alert.alert('Error al Crear Usuario', error || 'No se pudo crear el usuario.');
      }
    } catch (error) {
      console.error('❌ Error en handleSubmit:', error);
      Alert.alert('Error', 'Ocurrió un problema inesperado. Intenta nuevamente.');
    }
  };

  const handleDeactivateUser = async (userId: number, userEmail: string, userName: string) => {
    Alert.alert(
      'Confirmar Desactivación',
      `¿Estás seguro de que deseas desactivar a ${userName}?\n\nEsto impedirá que el usuario inicie sesión hasta que sea reactivado.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { success, error, message } = await desactivarUsuario(userId, userEmail);
              if (success) {
                Alert.alert('Usuario Desactivado', message || 'El usuario ha sido desactivado exitosamente.');
                fetchUsers();
              } else {
                Alert.alert('Error', `No se pudo desactivar el usuario: ${error}`);
              }
            } catch (error) {
              Alert.alert('Error', 'Ocurrió un problema al desactivar el usuario.');
            }
          }
        }
      ]
    );
  };

  const handleActivateUser = async (userId: number, userEmail: string, userName: string) => {
    Alert.alert(
      'Confirmar Activación',
      `¿Estás seguro de que deseas activar a ${userName}?\n\nEsto permitirá que el usuario inicie sesión normalmente.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Activar',
          onPress: async () => {
            try {
              const { success, error, message } = await activarUsuario(userId, userEmail);
              if (success) {
                Alert.alert('Usuario Activado', message || 'El usuario ha sido activado exitosamente.');
                fetchUsers();
              } else {
                Alert.alert('Error', `No se pudo activar el usuario: ${error}`);
              }
            } catch (error) {
              Alert.alert('Error', 'Ocurrió un problema al activar el usuario.');
            }
          }
        }
      ]
    );
  };

  const handleEditUser = (user: Usuario) => {
    setFormData(user);
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    const { id, name, email, password, telefono, institucion, rol } = formData;

    // Validar que usuarios autoridad tengan institución
    if (rol === 'autoridad' && !institucion?.trim()) {
      Alert.alert('Error', 'La institución es obligatoria para usuarios de autoridad.');
      return;
    }

    try {
      
      const updatedData: any = { name, email, telefono, institucion };

      
      if (password) {
        updatedData.password_hash = await hashPassword(password);
      }

      
      const { success, error } = await actualizarUsuario(id, updatedData);

      if (success) {
        Alert.alert('Éxito', 'Usuario actualizado correctamente.');
        fetchUsers();
        handleCloseModal();
      } else {
        Alert.alert('Error', `No se pudo actualizar el usuario: ${error}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al actualizar el usuario.');
    }
  };

  const handleOpenRoleModal = (userId: number, currentRole: string) => {
    setSelectedUserId(userId);
    setSelectedRole(currentRole);
    setRoleModalVisible(true);
  };

  const handleRoleSubmit = async () => {
    if (selectedUserId === null) return;

    // Si se está cambiando a autoridad, verificar que tenga institución
    if (selectedRole === 'autoridad') {
      const usuario = users.find(u => u.id === selectedUserId);
      if (!usuario?.institucion?.trim()) {
        Alert.alert(
          'Institución Requerida',
          'Para cambiar el rol a autoridad, primero debe agregar una institución. Use la opción "Editar" para agregar la institución.',
          [{ text: 'Entendido' }]
        );
        return;
      }
    }

    try {
      const { success, error } = await actualizarUsuario(selectedUserId, { rol: selectedRole });

      if (success) {
        Alert.alert('Éxito', 'Rol de usuario actualizado correctamente.');
        fetchUsers();
        handleCloseModal();
      } else {
        Alert.alert('Error', `No se pudo actualizar el rol del usuario: ${error}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al actualizar el rol del usuario.');
    }
  };

  const handleEditRole = (user: Usuario) => {
    setSelectedUserId(user.id);
    setSelectedRole(user.rol);
    setRoleModalVisible(true); 
  };

  const handleSaveRole = async () => {
    if (!selectedUserId) return;

    try {
      const { success, error } = await actualizarUsuario(selectedUserId, { rol: selectedRole });

      if (success) {
        Alert.alert('Éxito', 'El rol del usuario ha sido actualizado.');
        fetchUsers();
        setRoleModalVisible(false);
      } else {
        Alert.alert('Error', `No se pudo actualizar el rol: ${error}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al actualizar el rol.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Gestión de Usuarios</Text>

        {/* Botón para crear usuario Admin */}
        <TouchableOpacity style={[styles.button, styles.adminButton]} onPress={() => handleOpenModal('admin')}>
          <Text style={styles.buttonText}>Crear Usuario Admin</Text>
        </TouchableOpacity>

        {/* Botón para crear usuario Autoridad */}
        <TouchableOpacity style={[styles.button, styles.autoridadButton]} onPress={() => handleOpenModal('autoridad')}>
          <Text style={styles.buttonText}>Crear Usuario Autoridad</Text>
        </TouchableOpacity>

        {/* Lista de usuarios */}
        <Text style={styles.sectionTitle}>Lista de Usuarios</Text>
        {users.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View>
              <View style={styles.userHeader}>
                <Text style={styles.userName}>{user.name}</Text>
                <View style={[
                  styles.statusBadge, 
                  user.verificado ? styles.activeBadge : styles.inactiveBadge
                ]}>
                  <Text style={styles.statusText}>
                    {user.verificado ? '🟢 ACTIVO' : '🔴 INACTIVO'}
                  </Text>
                </View>
              </View>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userRole}>Rol: {user.rol}</Text>
              {!user.verificado && (
                <Text style={styles.warningText}>
                  ⚠️ Este usuario no puede iniciar sesión
                </Text>
              )}
            </View>
            <View style={styles.userActions}>
              <TouchableOpacity
                style={[styles.actionButton, user.verificado ? styles.deactivateButton : styles.activateButton]}
                onPress={() =>
                  user.verificado
                    ? handleDeactivateUser(user.id, user.email, user.name) 
                    : handleActivateUser(user.id, user.email, user.name)
                }
              >
                <Text style={styles.buttonText}>{user.verificado ? 'Desactivar' : 'Activar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEditUser(user)}
              >
                <Text style={styles.buttonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.roleButton]}
                onPress={() => handleEditRole(user)}
              >
                <Text style={styles.buttonText}>Editar Rol</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Modal para crear usuario */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Crear Usuario {formData.rol === 'admin' ? 'Administrador' : 'Autoridad'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Correo Electrónico"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
            />

            {/* Mostrar validaciones de contraseña */}
            {formData.password && formData.password.length > 0 && (
              <View style={styles.passwordValidation}>
                <Text style={styles.passwordValidationTitle}>Requisitos de contraseña:</Text>
                <Text style={{ color: passwordValidation.requirements.length ? '#27ae60' : '#e74c3c' }}>
                  • Al menos 8 caracteres
                </Text>
                <Text style={{ color: passwordValidation.requirements.uppercase ? '#27ae60' : '#e74c3c' }}>
                  • Una letra mayúscula (A-Z)
                </Text>
                <Text style={{ color: passwordValidation.requirements.lowercase ? '#27ae60' : '#e74c3c' }}>
                  • Una letra minúscula (a-z)
                </Text>
                <Text style={{ color: passwordValidation.requirements.number ? '#27ae60' : '#e74c3c' }}>
                  • Un número (0-9)
                </Text>
                <Text style={{ color: passwordValidation.requirements.special ? '#27ae60' : '#e74c3c' }}>
                  • Un carácter especial (!@#$%^&*)
                </Text>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Teléfono (opcional)"
              value={formData.telefono}
              onChangeText={(value) => handleInputChange('telefono', value)}
              keyboardType="phone-pad"
            />

            {formData.rol === 'autoridad' && (
              <TextInput
                style={styles.input}
                placeholder="Institución"
                value={formData.institucion}
                onChangeText={(value) => handleInputChange('institucion', value)}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={!passwordValidation.isValid || !formData.name || !formData.email}
              >
                <Text style={styles.buttonText}>
                  Crear {formData.rol === 'admin' ? 'Admin' : 'Autoridad'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={handleCloseModal}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para editar usuario */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Usuario</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Correo Electrónico"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Nueva Contraseña (opcional)"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
            />

            {/* Mostrar validaciones de contraseña */}
            {formData.password ? (
              <View style={styles.passwordValidation}>
                <Text style={{ color: passwordValidation.requirements.length ? 'green' : 'red' }}>
                  • Al menos 8 caracteres
                </Text>
                <Text style={{ color: passwordValidation.requirements.uppercase ? 'green' : 'red' }}>
                  • Una letra mayúscula
                </Text>
                <Text style={{ color: passwordValidation.requirements.lowercase ? 'green' : 'red' }}>
                  • Una letra minúscula
                </Text>
                <Text style={{ color: passwordValidation.requirements.number ? 'green' : 'red' }}>
                  • Un número
                </Text>
                <Text style={{ color: passwordValidation.requirements.special ? 'green' : 'red' }}>
                  • Un carácter especial
                </Text>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              value={formData.telefono}
              onChangeText={(value) => handleInputChange('telefono', value)}
            />
            <TextInput
              style={styles.input}
              placeholder={formData.rol === 'autoridad' ? "Institución *" : "Institución"}
              value={formData.institucion}
              onChangeText={(value) => handleInputChange('institucion', value)}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleEditSubmit}
                disabled={!!formData.password && !passwordValidation.isValid}
              >
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCloseModal}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para editar rol de usuario */}
      <Modal visible={roleModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Rol</Text>

            {/* Opciones de rol */}
            <TouchableOpacity
              style={[
                styles.roleOption,
                selectedRole === 'ciudadano' && styles.selectedRoleOption,
              ]}
              onPress={() => setSelectedRole('ciudadano')}
            >
              <Text style={styles.roleOptionText}>Ciudadano</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleOption,
                selectedRole === 'autoridad' && styles.selectedRoleOption,
              ]}
              onPress={() => setSelectedRole('autoridad')}
            >
              <Text style={styles.roleOptionText}>Autoridad</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleOption,
                selectedRole === 'admin' && styles.selectedRoleOption,
              ]}
              onPress={() => setSelectedRole('admin')}
            >
              <Text style={styles.roleOptionText}>Admin</Text>
            </TouchableOpacity>

            {/* Botones de acción */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSaveRole}
              >
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setRoleModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  adminButton: {
    backgroundColor: '#9b59b6',
  },
  autoridadButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  passwordValidation: {
    marginBottom: 15,
  },
  passwordValidationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    flex: 1,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#34495e',
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  userEmail: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2980b9',
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  activeBadge: {
    backgroundColor: '#d5f4e6',
  },
  inactiveBadge: {
    backgroundColor: '#ffeaa7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  warningText: {
    fontSize: 12,
    color: '#e74c3c',
    fontStyle: 'italic',
    marginTop: 5,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    minWidth: 80, 
  },
  deactivateButton: {
    backgroundColor: '#e67e22',
  },
  activateButton: {
    backgroundColor: '#27ae60',
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  roleButton: {
    backgroundColor: '#8e44ad',
  },
  roleOption: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedRoleOption: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
});

