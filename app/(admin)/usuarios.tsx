import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { actualizarUsuario, insertarUsuario, obtenerUsuarios } from '../../DB/supabase';
import { hashPassword } from '../../utils/crypto';
import { validatePassword } from '../../utils/passwordValidation';

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

    if (!name || !email || !password) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    if (!passwordValidation.isValid) {
      Alert.alert('Error', 'La contraseña no cumple con los requisitos de seguridad.');
      return;
    }

    try {
      const hashedPassword = hashPassword(password);
      const { success, error } = await insertarUsuario(name, email, hashedPassword, rol, telefono, institucion);

      if (success) {
        Alert.alert('Éxito', `Usuario ${rol} creado: ${email}`);
        fetchUsers();
        handleCloseModal();
      } else {
        Alert.alert('Error', `No se pudo crear el usuario ${rol}: ${error}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un problema al procesar la contraseña.');
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    const { success, error } = await actualizarUsuario(userId, { verificado: false });
    if (success) {
      Alert.alert('Éxito', 'El usuario ha sido desactivado.');
      fetchUsers();
    } else {
      Alert.alert('Error', `No se pudo desactivar el usuario: ${error}`);
    }
  };

  const handleActivateUser = async (userId: number) => {
    const { success, error } = await actualizarUsuario(userId, { verificado: true });
    if (success) {
      Alert.alert('Éxito', 'El usuario ha sido activado.');
      fetchUsers();
    } else {
      Alert.alert('Error', `No se pudo activar el usuario: ${error}`);
    }
  };

  const handleEditUser = (user: Usuario) => {
    setFormData(user);
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    const { id, name, email, password, telefono, institucion } = formData;

    try {
      
      const updatedData: any = { name, email, telefono, institucion };

      
      if (password) {
        updatedData.password_hash = hashPassword(password);
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
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userRole}>Rol: {user.rol}</Text>
            </View>
            <View style={styles.userActions}>
              <TouchableOpacity
                style={[styles.actionButton, user.verificado ? styles.deactivateButton : styles.activateButton]}
                onPress={() =>
                  user.verificado
                    ? handleDeactivateUser(user.id) 
                    : handleActivateUser(user.id)
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
              placeholder="Institución"
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
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userEmail: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2980b9',
    marginBottom: 10,
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

