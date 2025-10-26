import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function DetalleCaso() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalle del Caso</Text>
      <Text style={styles.subtitle}>Información completa del caso - Próximamente</Text>
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