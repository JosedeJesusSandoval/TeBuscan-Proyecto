import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const RegistroTipoSelector = () => {
  const handleCiudadanoPress = () => {
    router.push('/(auth)/registro');
  };

  const handleAutoridadPress = () => {
    router.push('/(auth)/registro-autoridad');
  };

  const handleBackToLogin = () => {
    router.push('/(auth)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.titulo}>¿Cómo deseas registrarte?</Text>
        <Text style={styles.subtitulo}>Selecciona el tipo de cuenta que necesitas</Text>
        
        <View style={styles.optionsContainer}>
          {/* Opción Ciudadano */}
          <TouchableOpacity style={[styles.optionCard, styles.ciudadanoCard]} onPress={handleCiudadanoPress}>
            <Text style={styles.optionIcon}>👤</Text>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Ciudadano</Text>
              <Text style={styles.optionDescription}>
                • Reportar personas desaparecidas{'\n'}
                • Ver reportes públicos{'\n'}
                • Acceso al mapa de búsqueda{'\n'}
                • Seguimiento de tus reportes
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          {/* Opción Autoridad */}
          <TouchableOpacity style={[styles.optionCard, styles.autoridadCard]} onPress={handleAutoridadPress}>
            <Text style={styles.optionIcon}>🏛️</Text>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Autoridad</Text>
              <Text style={styles.optionDescription}>
                • Acceso institucional completo{'\n'}
                • Gestión y seguimiento de casos{'\n'}
                • Herramientas de coordinación{'\n'}
                • Estadísticas y reportes avanzados
              </Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleBackToLogin} style={styles.linkButton}>
          <Text style={styles.linkText}>← Volver al login</Text>
        </TouchableOpacity>
      </View>

      {/* Información adicional */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          ℹ️ Las cuentas de autoridad requieren verificación manual antes de poder acceder al sistema
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 50,
  },
  titulo: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitulo: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    color: '#7f8c8d',
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 5,
  },
  ciudadanoCard: {
    borderLeftColor: '#3498db',
  },
  autoridadCard: {
    borderLeftColor: '#e74c3c',
  },
  optionIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  arrow: {
    fontSize: 24,
    color: '#bdc3c7',
    marginLeft: 10,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#3498db',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  infoContainer: {
    padding: 15,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderRadius: 10,
    margin: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  infoText: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RegistroTipoSelector;