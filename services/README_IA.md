# 🤖 Sistema de Inteligencia Artificial - TeBuscan

## Descripción General

El Sistema de Inteligencia Artificial de TeBuscan es una solución completa que utiliza múltiples algoritmos de machine learning para optimizar la búsqueda y gestión de casos de personas desaparecidas. El sistema proporciona clasificación automática, análisis predictivo y recomendaciones inteligentes para las autoridades.

## 📋 Tabla de Contenidos

1. [Algoritmos Implementados](#algoritmos-implementados)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [Guía de Uso](#guía-de-uso)
4. [API Reference](#api-reference)
5. [Ejemplos Prácticos](#ejemplos-prácticos)
6. [Casos de Prueba](#casos-de-prueba)
7. [Métricas y Monitoreo](#métricas-y-monitoreo)

## 🧠 Algoritmos Implementados

### 1. 🌳 Clasificación por Árboles de Decisión
**Función**: `clasificarUrgenciaArbolDecision()`
- **Propósito**: Clasificar automáticamente la urgencia de cada caso
- **Factores**: Edad, tiempo transcurrido, ubicación conocida, día de la semana
- **Salida**: Prioridad (crítica/alta/media/baja) + score numérico + recomendaciones

### 2. 🔍 k-Nearest Neighbors (kNN)
**Función**: `encontrarCasosSimilaresKNN()`
- **Propósito**: Encontrar casos similares por proximidad geográfica y características
- **Factores**: Distancia geográfica, similitud de edad, similitud temporal
- **Salida**: Lista de casos relacionados ordenados por relevancia

### 3. 🗺️ K-Means Clustering
**Función**: `identificarZonasCriticasKMeans()`
- **Propósito**: Identificar zonas geográficas de alto riesgo
- **Método**: Agrupa casos por ubicación para detectar patrones espaciales
- **Salida**: Lista de zonas críticas con nivel de riesgo y frecuencia

### 4. 📈 Análisis Bayesiano
**Función**: `analizarPatronesTemporalesBayesiano()`
- **Propósito**: Detectar patrones temporales en las desapariciones
- **Análisis**: Hora del día, día de la semana, mes del año más críticos
- **Salida**: Patrones temporales con nivel de confianza

### 5. 💡 Sistema de Recomendaciones
**Función**: `generarRecomendacionesInteligentes()`
- **Propósito**: Generar recomendaciones actionables basadas en todos los algoritmos
- **Combinación**: Integra resultados de todos los algoritmos anteriores
- **Salida**: Acciones inmediatas, recursos sugeridos, áreas de búsqueda, alertas

## 🚀 Instalación y Configuración

### Requisitos Previos
```bash
Node.js >= 16.0.0
TypeScript >= 4.0.0
React Native >= 0.68.0
```

### Importación del Sistema
```typescript
import {
  clasificarUrgenciaArbolDecision,
  encontrarCasosSimilaresKNN,
  identificarZonasCriticasKMeans,
  analizarPatronesTemporalesBayesiano,
  generarRecomendacionesInteligentes,
  procesarCasoConIA,
  ReporteIA,
  EstadoIA
} from './services/inteligenciaArtificial';
```

### Configuración Inicial
```typescript
// Verificar estado del sistema
console.log('Estado IA:', EstadoIA);

// El sistema se inicializa automáticamente
// No requiere configuración adicional
```

## 📖 Guía de Uso

### Uso Básico - Clasificación de Urgencia

```typescript
const reporte: ReporteIA = {
  id: 1,
  nombre_desaparecido: "María González",
  edad: 8,
  estatus: "activo",
  ultima_ubicacion: "Parque Central",
  created_at: "2025-11-02T14:30:00Z",
  ubicacion_coords: { lat: 19.4326, lng: -99.1332 }
};

const clasificacion = clasificarUrgenciaArbolDecision(reporte);

console.log(`Prioridad: ${clasificacion.prioridad}`);
console.log(`Score: ${clasificacion.score_urgencia}/100`);
console.log('Recomendaciones:', clasificacion.recomendaciones);
```

### Uso Avanzado - Análisis Completo

```typescript
const todosLosReportes = await obtenerReportes();
const casoActual = todosLosReportes[0];

const analisisCompleto = procesarCasoConIA(casoActual, todosLosReportes);

// Acceder a todos los resultados
console.log('Clasificación:', analisisCompleto.clasificacion);
console.log('Casos similares:', analisisCompleto.casos_similares);
console.log('Zonas críticas:', analisisCompleto.zonas_criticas);
console.log('Análisis temporal:', analisisCompleto.analisis_temporal);
console.log('Recomendaciones:', analisisCompleto.recomendaciones);
console.log('Estado IA:', analisisCompleto.estado_ia);
```

### Integración en Pantallas de Autoridad

```typescript
// En casos.tsx - Ordenar por prioridad
const cargarReportes = async () => {
  const resultado = await obtenerReportes();
  
  const reportesConPrioridad = resultado.data.map(reporte => ({
    ...reporte,
    ...clasificarUrgenciaArbolDecision(reporte)
  }));

  // Ordenar por score de urgencia
  reportesConPrioridad.sort((a, b) => b.score_urgencia - a.score_urgencia);
  
  setReportes(reportesConPrioridad);
};
```

## 📚 API Reference

### Interfaces Principales

```typescript
interface ReporteIA {
  id: number;
  nombre_desaparecido: string;
  edad: number;
  estatus: string;
  ultima_ubicacion: string;
  created_at: string;
  ubicacion_coords?: { lat: number; lng: number };
  descripcion?: string;
  contacto?: string;
}

interface PrioridadResult {
  prioridad: 'critica' | 'alta' | 'media' | 'baja';
  score_urgencia: number;
  factores: string[];
  recomendaciones: string[];
}
```

### Funciones Principales

#### `clasificarUrgenciaArbolDecision(reporte: ReporteIA): PrioridadResult`
Clasifica la urgencia de un caso usando árboles de decisión.

**Parámetros:**
- `reporte`: Objeto con información del caso

**Retorna:**
- Objeto con prioridad, score, factores y recomendaciones

#### `encontrarCasosSimilaresKNN(caso: ReporteIA, todos: ReporteIA[], k: number): ReporteIA[]`
Encuentra casos similares usando k-Nearest Neighbors.

**Parámetros:**
- `caso`: Caso de referencia
- `todos`: Array con todos los casos disponibles
- `k`: Número de casos similares a retornar (default: 5)

**Retorna:**
- Array de casos similares ordenados por relevancia

#### `identificarZonasCriticasKMeans(reportes: ReporteIA[], clusters: number): PatronGeografico[]`
Identifica zonas críticas usando clustering K-Means.

**Parámetros:**
- `reportes`: Array de casos con coordenadas
- `clusters`: Número de clusters a formar (default: 5)

**Retorna:**
- Array de zonas críticas con información de riesgo

#### `procesarCasoConIA(reporte: ReporteIA, todos: ReporteIA[]): AnalisisCompletoIA`
Ejecuta todos los algoritmos de IA para un análisis completo.

**Parámetros:**
- `reporte`: Caso a analizar
- `todos`: Array con todos los casos para contexto

**Retorna:**
- Objeto con resultados de todos los algoritmos

## 🎯 Ejemplos Prácticos

### Ejemplo 1: Caso Crítico (Menor de Edad)

```typescript
import { ejemploClasificacionUrgencia } from './services/ejemplosIA';

// Ejecutar ejemplo de clasificación
const resultado = ejemploClasificacionUrgencia();

// Salida esperada:
// 🚨 Prioridad: CRITICA
// 📊 Score de Urgencia: 95/100
// 💡 Recomendaciones: ACCIÓN INMEDIATA REQUERIDA
```

### Ejemplo 2: Análisis de Zonas de Riesgo

```typescript
import { ejemploZonasCriticasKMeans } from './services/ejemplosIA';

const zonasRiesgo = ejemploZonasCriticasKMeans();

// Salida esperada:
// 🔴 Zona Crítica 1
//    📍 Coordenadas: 19.4326, -99.1332
//    📊 Frecuencia: 3 casos
//    ⚠️ Nivel de Riesgo: ALTO
```

### Ejemplo 3: Ejecución Completa

```typescript
import { ejecutarTodosLosEjemplos } from './services/ejemplosIA';

// Ejecutar demostración completa
ejecutarTodosLosEjemplos();

// Muestra todos los algoritmos en acción
```

## 🧪 Casos de Prueba

El sistema incluye casos de prueba predefinidos:

```typescript
import { casosDePrueba } from './services/ejemplosIA';

// Caso crítico (niña de 3 años)
const casoCritico = casosDePrueba.critico;

// Caso normal (adulto joven)
const casoNormal = casosDePrueba.normal;

// Caso resuelto
const casoResuelto = casosDePrueba.resuelto;
```

## 📊 Métricas y Monitoreo

### Estado del Sistema

```typescript
import { EstadoIA } from './services/inteligenciaArtificial';

console.log('Versión:', EstadoIA.version);
console.log('Algoritmos disponibles:', EstadoIA.algoritmos_disponibles);
console.log('Precisión promedio:', EstadoIA.precision_promedio);
console.log('Tiempo de respuesta:', EstadoIA.tiempo_respuesta_promedio, 'ms');
```

### Métricas de Rendimiento

```typescript
// Monitoreo en tiempo real
import { ejemploMonitoreoTiempoReal } from './services/ejemplosIA';

ejemploMonitoreoTiempoReal();

// Salida incluye:
// - Estado de algoritmos
// - Throughput del sistema
// - Métricas de precisión
// - Tiempo de procesamiento
```

## 🔧 Configuración Avanzada

### Ajuste de Parámetros

```typescript
// Personalizar K para kNN
const casosSimilares = encontrarCasosSimilaresKNN(caso, todos, 10); // k=10

// Personalizar número de clusters
const zonas = identificarZonasCriticasKMeans(reportes, 8); // 8 clusters

// Los pesos del algoritmo de clasificación están optimizados
// pero pueden ajustarse modificando las constantes en el código
```

### Integración con Base de Datos

```typescript
// Ejemplo de integración con Supabase
import { obtenerReportes } from '../DB/supabase';

const procesarTodosLosCasos = async () => {
  const respuesta = await obtenerReportes();
  if (respuesta.success) {
    const reportes = respuesta.data;
    
    // Procesar cada caso con IA
    const reportesConIA = reportes.map(reporte => ({
      ...reporte,
      ...clasificarUrgenciaArbolDecision(reporte)
    }));
    
    return reportesConIA;
  }
};
```

## 🚨 Consideraciones Importantes

### Limitaciones
- El sistema requiere datos históricos para mejor precisión
- Los algoritmos de clustering necesitan al menos 5 casos con coordenadas
- La precisión mejora con más datos de entrenamiento

### Recomendaciones de Uso
- Ejecutar el análisis completo para casos críticos
- Usar el sistema de recomendaciones para toma de decisiones
- Monitorear regularmente las métricas del sistema
- Actualizar los datos de entrenamiento periódicamente

### Mantenimiento
- El sistema es autónomo y no requiere mantenimiento manual
- Las métricas se actualizan automáticamente
- Los algoritmos se adaptan a nuevos patrones de datos

## 📞 Soporte y Contribuciones

Para reportar bugs, sugerir mejoras o contribuir al desarrollo:

1. **Issues**: Reportar problemas o solicitar features
2. **Pull Requests**: Contribuir con mejoras al código
3. **Documentación**: Ayudar a mejorar esta documentación

## 📝 Changelog

### v1.0.0 (Noviembre 2025)
- ✅ Implementación inicial de todos los algoritmos
- ✅ Sistema completo de clasificación de urgencia
- ✅ Algoritmos kNN y K-Means funcionales
- ✅ Análisis Bayesiano para patrones temporales
- ✅ Sistema de recomendaciones inteligentes
- ✅ Ejemplos de uso y casos de prueba
- ✅ Documentación completa

---

**🤖 Sistema de Inteligencia Artificial TeBuscan v1.0.0**
*Desarrollado para optimizar la búsqueda y rescate de personas desaparecidas*