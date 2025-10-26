import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function EstadisticasScreen() {
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
              <Text style={styles.statNumber}>45</Text>
              <Text style={styles.statLabel}>Total de Casos</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Casos Activos</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>28</Text>
              <Text style={styles.statLabel}>Encontrados</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Fallecidos</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Por Región</Text>
          <View style={styles.regionStats}>
            <View style={styles.regionItem}>
              <Text style={styles.regionName}>Centro</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progress, { width: '60%' }]} />
              </View>
              <Text style={styles.regionCount}>15 casos</Text>
            </View>
            
            <View style={styles.regionItem}>
              <Text style={styles.regionName}>Norte</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progress, { width: '40%' }]} />
              </View>
              <Text style={styles.regionCount}>10 casos</Text>
            </View>
            
            <View style={styles.regionItem}>
              <Text style={styles.regionName}>Sur</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progress, { width: '30%' }]} />
              </View>
              <Text style={styles.regionCount}>8 casos</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Por Edad</Text>
          <View style={styles.ageStats}>
            <Text style={styles.ageItem}>👶 0-12 años: 8 casos</Text>
            <Text style={styles.ageItem}>🧒 13-17 años: 12 casos</Text>
            <Text style={styles.ageItem}>👨 18-30 años: 15 casos</Text>
            <Text style={styles.ageItem}>👩 31-50 años: 7 casos</Text>
            <Text style={styles.ageItem}>👴 50+ años: 3 casos</Text>
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
});