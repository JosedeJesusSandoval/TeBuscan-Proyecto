import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function CasosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Casos</Text>
      <Text style={styles.subtitle}>Lista de casos para autoridades - Próximamente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});