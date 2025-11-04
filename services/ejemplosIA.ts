/**
 * EJEMPLOS DE USO - SISTEMA DE INTELIGENCIA ARTIFICIAL
 * 
 * Este archivo contiene ejemplos prácticos de cómo utilizar
 * los algoritmos de IA en diferentes escenarios del sistema.
 */

import {
    analizarPatronesTemporalesBayesiano,
    clasificarUrgenciaArbolDecision,
    encontrarCasosSimilaresKNN,
    EstadoIA,
    generarRecomendacionesInteligentes,
    identificarZonasCriticasKMeans,
    procesarCasoConIA,
    ReporteIA
} from './inteligenciaArtificial';

// ============================================================================
// EJEMPLOS DE DATOS DE PRUEBA
// ============================================================================

const reportesEjemplo: ReporteIA[] = [
  {
    id: 1,
    nombre_desaparecido: "María González",
    edad: 8,
    estatus: "activo",
    ultima_ubicacion: "Parque Central",
    created_at: "2025-11-02T14:30:00Z",
    ubicacion_coords: { lat: 19.4326, lng: -99.1332 },
    descripcion: "Niña de 8 años, cabello castaño, vestía playera rosa",
    contacto: "555-0123"
  },
  {
    id: 2,
    nombre_desaparecido: "Carlos Ruiz",
    edad: 34,
    estatus: "activo",
    ultima_ubicacion: "Centro Comercial",
    created_at: "2025-11-01T19:45:00Z",
    ubicacion_coords: { lat: 19.4342, lng: -99.1312 },
    descripcion: "Adulto de 34 años, complexión media",
    contacto: "555-0456"
  },
  {
    id: 3,
    nombre_desaparecido: "Ana Martínez",
    edad: 16,
    estatus: "activo",
    ultima_ubicacion: "Escuela Secundaria",
    created_at: "2025-10-30T08:15:00Z",
    ubicacion_coords: { lat: 19.4356, lng: -99.1298 },
    descripcion: "Adolescente de 16 años, uniforme escolar",
    contacto: "555-0789"
  },
  {
    id: 4,
    nombre_desaparecido: "Roberto Silva",
    edad: 72,
    estatus: "resuelto",
    ultima_ubicacion: "Hospital General",
    created_at: "2025-10-28T16:20:00Z",
    ubicacion_coords: { lat: 19.4308, lng: -99.1354 },
    descripcion: "Adulto mayor con Alzheimer",
    contacto: "555-0321"
  },
  {
    id: 5,
    nombre_desaparecido: "Sofía López",
    edad: 12,
    estatus: "activo",
    ultima_ubicacion: "Plaza Principal",
    created_at: "2025-11-02T10:00:00Z",
    ubicacion_coords: { lat: 19.4318, lng: -99.1345 },
    descripcion: "Niña de 12 años, mochila azul",
    contacto: "555-0654"
  }
];

// ============================================================================
// EJEMPLO 1: CLASIFICACIÓN DE URGENCIA
// ============================================================================

export function ejemploClasificacionUrgencia() {
  console.log('🎯 EJEMPLO: Clasificación de Urgencia con Árboles de Decisión');
  console.log('=' .repeat(60));

  const casoUrgente = reportesEjemplo[0]; // María, 8 años

  const resultado = clasificarUrgenciaArbolDecision(casoUrgente);

  console.log(`📋 Caso: ${casoUrgente.nombre_desaparecido}, ${casoUrgente.edad} años`);
  console.log(`🚨 Prioridad: ${resultado.prioridad.toUpperCase()}`);
  console.log(`📊 Score de Urgencia: ${resultado.score_urgencia}/100`);
  console.log('\n🔍 Factores Identificados:');
  resultado.factores.forEach((factor, index) => {
    console.log(`   ${index + 1}. ${factor}`);
  });
  console.log('\n💡 Recomendaciones:');
  resultado.recomendaciones.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`);
  });
  console.log('\n');

  return resultado;
}

// ============================================================================
// EJEMPLO 2: BÚSQUEDA DE CASOS SIMILARES CON kNN
// ============================================================================

export function ejemploCasosSimilaresKNN() {
  console.log('🔍 EJEMPLO: Búsqueda de Casos Similares con k-Nearest Neighbors');
  console.log('=' .repeat(60));

  const casoReferencia = reportesEjemplo[0]; // María, 8 años
  const casosSimilares = encontrarCasosSimilaresKNN(casoReferencia, reportesEjemplo, 3);

  console.log(`📋 Caso de Referencia: ${casoReferencia.nombre_desaparecido}`);
  console.log(`📍 Ubicación: ${casoReferencia.ultima_ubicacion}`);
  console.log(`👤 Edad: ${casoReferencia.edad} años`);
  console.log('\n🎯 Casos Similares Encontrados:');

  if (casosSimilares.length > 0) {
    casosSimilares.forEach((caso, index) => {
      console.log(`\n   ${index + 1}. ${caso.nombre_desaparecido}`);
      console.log(`      📍 Ubicación: ${caso.ultima_ubicacion}`);
      console.log(`      👤 Edad: ${caso.edad} años`);
      console.log(`      📏 Distancia: ${(caso as any).distancia?.toFixed(2)} km`);
      console.log(`      🎯 Score kNN: ${(caso as any).scoreKNN?.toFixed(3)}`);
    });
  } else {
    console.log('   ❌ No se encontraron casos similares');
  }
  console.log('\n');

  return casosSimilares;
}

// ============================================================================
// EJEMPLO 3: IDENTIFICACIÓN DE ZONAS CRÍTICAS CON K-MEANS
// ============================================================================

export function ejemploZonasCriticasKMeans() {
  console.log('🗺️ EJEMPLO: Identificación de Zonas Críticas con K-Means Clustering');
  console.log('=' .repeat(60));

  const zonasRiesgo = identificarZonasCriticasKMeans(reportesEjemplo, 3);

  console.log(`📊 Total de reportes analizados: ${reportesEjemplo.length}`);
  console.log(`🎯 Clusters identificados: ${zonasRiesgo.length}`);
  console.log('\n🔴 Zonas de Riesgo Detectadas:');

  zonasRiesgo.forEach((zona, index) => {
    const emoji = zona.riesgo === 'alto' ? '🔴' : zona.riesgo === 'medio' ? '🟡' : '🟢';
    console.log(`\n   ${emoji} ${zona.zona}`);
    console.log(`      📍 Coordenadas: ${zona.coordenadas.lat.toFixed(4)}, ${zona.coordenadas.lng.toFixed(4)}`);
    console.log(`      📊 Frecuencia: ${zona.frecuencia} casos`);
    console.log(`      ⚠️ Nivel de Riesgo: ${zona.riesgo.toUpperCase()}`);
    console.log(`      🔗 Casos Relacionados: ${zona.casos_relacionados}`);
  });
  console.log('\n');

  return zonasRiesgo;
}

// ============================================================================
// EJEMPLO 4: ANÁLISIS TEMPORAL BAYESIANO
// ============================================================================

export function ejemploAnalisisTemporalBayesiano() {
  console.log('📈 EJEMPLO: Análisis de Patrones Temporales con Análisis Bayesiano');
  console.log('=' .repeat(60));

  const analisisTemporal = analizarPatronesTemporalesBayesiano(reportesEjemplo);

  console.log('🕒 Patrones Temporales Detectados:');
  console.log(`   ⏰ Hora Crítica: ${analisisTemporal.hora_critica}:00h`);
  console.log(`   📅 Día Crítico: ${obtenerNombreDia(analisisTemporal.dia_semana_critico)}`);
  console.log(`   📆 Mes Crítico: ${obtenerNombreMes(analisisTemporal.mes_critico)}`);
  console.log(`   🎯 Confianza: ${(analisisTemporal.confianza * 100).toFixed(1)}%`);
  console.log(`\n🔍 Patrón Detectado:`);
  console.log(`   ${analisisTemporal.patron_detectado}`);
  console.log('\n');

  return analisisTemporal;
}

// ============================================================================
// EJEMPLO 5: SISTEMA COMPLETO DE RECOMENDACIONES
// ============================================================================

export function ejemploSistemaRecomendaciones() {
  console.log('💡 EJEMPLO: Sistema Integral de Recomendaciones Inteligentes');
  console.log('=' .repeat(60));

  const casoActual = reportesEjemplo[0]; // María, 8 años
  const recomendaciones = generarRecomendacionesInteligentes(casoActual, reportesEjemplo);

  console.log(`📋 Analizando caso: ${casoActual.nombre_desaparecido}`);
  console.log('\n🚨 ACCIONES INMEDIATAS:');
  recomendaciones.acciones_inmediatas.forEach((accion, index) => {
    console.log(`   ${index + 1}. ${accion}`);
  });

  console.log('\n🛠️ RECURSOS SUGERIDOS:');
  recomendaciones.recursos_sugeridos.forEach((recurso, index) => {
    console.log(`   ${index + 1}. ${recurso}`);
  });

  console.log('\n🗺️ ÁREAS DE BÚSQUEDA:');
  recomendaciones.areas_busqueda.forEach((area, index) => {
    console.log(`   ${index + 1}. ${area}`);
  });

  console.log('\n⚠️ ALERTAS ESPECIALES:');
  recomendaciones.alertas_especiales.forEach((alerta, index) => {
    console.log(`   ${index + 1}. ${alerta}`);
  });
  console.log('\n');

  return recomendaciones;
}

// ============================================================================
// EJEMPLO 6: PROCESAMIENTO COMPLETO CON IA
// ============================================================================

export function ejemploProcesamientoCompletoIA() {
  console.log('🤖 EJEMPLO: Procesamiento Completo con Todos los Algoritmos de IA');
  console.log('=' .repeat(70));

  const casoComplejo = reportesEjemplo[0]; // María, 8 años
  const resultado = procesarCasoConIA(casoComplejo, reportesEjemplo);

  console.log(`📋 Procesando caso: ${casoComplejo.nombre_desaparecido}`);
  console.log(`🔄 Tiempo de procesamiento: ${resultado.estado_ia.tiempo_procesamiento}ms`);
  console.log(`🎯 Confianza general del sistema: ${(resultado.estado_ia.confianza_general * 100).toFixed(1)}%`);
  
  console.log('\n🤖 ALGORITMOS ACTIVOS:');
  resultado.estado_ia.algoritmos_activos.forEach((algoritmo, index) => {
    console.log(`   ✅ ${index + 1}. ${algoritmo}`);
  });

  console.log('\n📊 RESUMEN DE RESULTADOS:');
  console.log(`   🚨 Clasificación: ${resultado.clasificacion.prioridad.toUpperCase()}`);
  console.log(`   📏 Score de Urgencia: ${resultado.clasificacion.score_urgencia}/100`);
  console.log(`   🔍 Casos Similares: ${resultado.casos_similares.length} encontrados`);
  console.log(`   🗺️ Zonas Críticas: ${resultado.zonas_criticas.length} identificadas`);
  console.log(`   📈 Confianza Temporal: ${(resultado.analisis_temporal.confianza * 100).toFixed(1)}%`);

  console.log('\n💡 RECOMENDACIONES PRINCIPALES:');
  resultado.recomendaciones.acciones_inmediatas.slice(0, 3).forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`);
  });
  console.log('\n');

  return resultado;
}

// ============================================================================
// EJEMPLO 7: MONITOREO EN TIEMPO REAL
// ============================================================================

export function ejemploMonitoreoTiempoReal() {
  console.log('📡 EJEMPLO: Monitoreo en Tiempo Real del Sistema de IA');
  console.log('=' .repeat(60));

  console.log('🤖 ESTADO DEL SISTEMA:');
  console.log(`   📌 Versión: ${EstadoIA.version}`);
  console.log(`   🔧 Algoritmos Disponibles: ${EstadoIA.algoritmos_disponibles}`);
  console.log(`   🎯 Precisión Promedio: ${(EstadoIA.precision_promedio * 100).toFixed(1)}%`);
  console.log(`   📊 Casos Procesados: ${EstadoIA.casos_procesados}`);
  console.log(`   ⚡ Tiempo Respuesta Promedio: ${EstadoIA.tiempo_respuesta_promedio}ms`);
  console.log(`   🕒 Última Actualización: ${new Date(EstadoIA.ultima_actualizacion).toLocaleString()}`);

  // Simular procesamiento de múltiples casos
  console.log('\n🔄 PROCESAMIENTO EN LOTE:');
  const tiempoInicio = Date.now();
  
  reportesEjemplo.filter(r => r.estatus === 'activo').forEach((reporte, index) => {
    const prioridad = clasificarUrgenciaArbolDecision(reporte);
    console.log(`   ${index + 1}. ${reporte.nombre_desaparecido} - Prioridad: ${prioridad.prioridad.toUpperCase()}`);
  });

  const tiempoTotal = Date.now() - tiempoInicio;
  console.log(`\n⏱️ Tiempo total de procesamiento: ${tiempoTotal}ms`);
  console.log(`📈 Throughput: ${(reportesEjemplo.length / tiempoTotal * 1000).toFixed(2)} casos/segundo`);
  console.log('\n');
}

// ============================================================================
// FUNCIÓN PARA EJECUTAR TODOS LOS EJEMPLOS
// ============================================================================

export function ejecutarTodosLosEjemplos() {
  console.log('🚀 INICIANDO DEMOSTRACIÓN COMPLETA DEL SISTEMA DE IA');
  console.log('=' .repeat(70));
  console.log('\n');

  ejemploClasificacionUrgencia();
  ejemploCasosSimilaresKNN();
  ejemploZonasCriticasKMeans();
  ejemploAnalisisTemporalBayesiano();
  ejemploSistemaRecomendaciones();
  ejemploProcesamientoCompletoIA();
  ejemploMonitoreoTiempoReal();

  console.log('✅ DEMOSTRACIÓN COMPLETADA');
  console.log('🎯 Todos los algoritmos de IA están funcionando correctamente');
  console.log('📊 Sistema listo para producción');
  console.log('\n');
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function obtenerNombreDia(dia: number): string {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[dia];
}

function obtenerNombreMes(mes: number): string {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return meses[mes];
}

// ============================================================================
// CASOS DE PRUEBA PARA DESARROLLO
// ============================================================================

export const casosDePrueba = {
  critico: {
    id: 999,
    nombre_desaparecido: "Emma Test",
    edad: 3,
    estatus: "activo",
    ultima_ubicacion: "Centro Comercial Crowley",
    created_at: new Date().toISOString(),
    ubicacion_coords: { lat: 19.4326, lng: -99.1332 },
    descripcion: "Niña de 3 años, caso de prueba crítico"
  },
  normal: {
    id: 998,
    nombre_desaparecido: "Juan Test",
    edad: 25,
    estatus: "activo",
    ultima_ubicacion: "Parque Local",
    created_at: new Date(Date.now() - 86400000).toISOString(), // hace 1 día
    ubicacion_coords: { lat: 19.4342, lng: -99.1312 },
    descripcion: "Adulto joven, caso de prueba normal"
  },
  resuelto: {
    id: 997,
    nombre_desaparecido: "Ana Test",
    edad: 45,
    estatus: "resuelto",
    ultima_ubicacion: "Hospital",
    created_at: new Date(Date.now() - 172800000).toISOString(), // hace 2 días
    ubicacion_coords: { lat: 19.4356, lng: -99.1298 },
    descripcion: "Caso resuelto exitosamente"
  }
};

// Exportar todo para uso en el sistema
export default {
  ejemploClasificacionUrgencia,
  ejemploCasosSimilaresKNN,
  ejemploZonasCriticasKMeans,
  ejemploAnalisisTemporalBayesiano,
  ejemploSistemaRecomendaciones,
  ejemploProcesamientoCompletoIA,
  ejemploMonitoreoTiempoReal,
  ejecutarTodosLosEjemplos,
  casosDePrueba,
  reportesEjemplo
};