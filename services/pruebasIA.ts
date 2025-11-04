/**
 * PRUEBAS UNITARIAS - SISTEMA DE INTELIGENCIA ARTIFICIAL
 * 
 * Conjunto completo de pruebas para validar el funcionamiento
 * de todos los algoritmos de IA del sistema TeBuscan.
 */

import {
    analizarPatronesTemporalesBayesiano,
    clasificarUrgenciaArbolDecision,
    distanciaGeografica,
    encontrarCasosSimilaresKNN,
    EstadoIA,
    generarRecomendacionesInteligentes,
    identificarZonasCriticasKMeans,
    procesarCasoConIA,
    ReporteIA
} from './inteligenciaArtificial';

// ============================================================================
// DATOS DE PRUEBA
// ============================================================================

const reportesPrueba: ReporteIA[] = [
  {
    id: 1,
    nombre_desaparecido: "Test Niño Crítico",
    edad: 5,
    estatus: "activo",
    ultima_ubicacion: "Parque A",
    created_at: new Date().toISOString(),
    ubicacion_coords: { lat: 19.4326, lng: -99.1332 }
  },
  {
    id: 2,
    nombre_desaparecido: "Test Adolescente",
    edad: 16,
    estatus: "activo",
    ultima_ubicacion: "Escuela B",
    created_at: new Date(Date.now() - 3600000).toISOString(), // hace 1 hora
    ubicacion_coords: { lat: 19.4342, lng: -99.1312 }
  },
  {
    id: 3,
    nombre_desaparecido: "Test Adulto Mayor",
    edad: 70,
    estatus: "activo",
    ultima_ubicacion: "Hospital C",
    created_at: new Date(Date.now() - 86400000).toISOString(), // hace 1 día
    ubicacion_coords: { lat: 19.4356, lng: -99.1298 }
  },
  {
    id: 4,
    nombre_desaparecido: "Test Adulto Joven",
    edad: 25,
    estatus: "activo",
    ultima_ubicacion: "Centro D",
    created_at: new Date(Date.now() - 172800000).toISOString(), // hace 2 días
    ubicacion_coords: { lat: 19.4308, lng: -99.1354 }
  },
  {
    id: 5,
    nombre_desaparecido: "Test Resuelto",
    edad: 30,
    estatus: "resuelto",
    ultima_ubicacion: "Plaza E",
    created_at: new Date(Date.now() - 259200000).toISOString(), // hace 3 días
    ubicacion_coords: { lat: 19.4318, lng: -99.1345 }
  }
];

// ============================================================================
// PRUEBAS UNITARIAS
// ============================================================================

export interface ResultadoPrueba {
  nombre: string;
  pasada: boolean;
  mensaje: string;
  tiempo: number;
  datos?: any;
}

export class TestSuiteIA {
  private resultados: ResultadoPrueba[] = [];

  // Método principal para ejecutar todas las pruebas
  ejecutarTodasLasPruebas(): ResultadoPrueba[] {
    console.log('🧪 INICIANDO SUITE DE PRUEBAS DEL SISTEMA DE IA');
    console.log('=' .repeat(60));

    this.resultados = [];

    // Ejecutar cada grupo de pruebas
    this.pruebasClasificacionUrgencia();
    this.pruebasKNN();
    this.pruebasKMeans();
    this.pruebasAnalisisBayesiano();
    this.pruebasRecomendaciones();
    this.pruebasProcesamientoCompleto();
    this.pruebasRendimiento();
    this.pruebasValidacion();

    this.mostrarResumenPruebas();
    return this.resultados;
  }

  // ========================================================================
  // PRUEBAS DE CLASIFICACIÓN DE URGENCIA
  // ========================================================================

  private pruebasClasificacionUrgencia(): void {
    console.log('\n🌳 PRUEBAS: Clasificación por Árboles de Decisión');
    console.log('-' .repeat(50));

    // Prueba 1: Caso crítico (niño pequeño)
    this.ejecutarPrueba('Clasificación Crítica - Niño', () => {
      const caso = reportesPrueba[0]; // 5 años
      const resultado = clasificarUrgenciaArbolDecision(caso);
      
      return {
        pasada: resultado.prioridad === 'critica' && resultado.score_urgencia >= 80,
        mensaje: `Prioridad: ${resultado.prioridad}, Score: ${resultado.score_urgencia}`,
        datos: resultado
      };
    });

    // Prueba 2: Caso alto (adolescente)
    this.ejecutarPrueba('Clasificación Alta - Adolescente', () => {
      const caso = reportesPrueba[1]; // 16 años
      const resultado = clasificarUrgenciaArbolDecision(caso);
      
      return {
        pasada: resultado.prioridad === 'alta' && resultado.score_urgencia >= 60,
        mensaje: `Prioridad: ${resultado.prioridad}, Score: ${resultado.score_urgencia}`,
        datos: resultado
      };
    });

    // Prueba 3: Caso con adulto mayor
    this.ejecutarPrueba('Clasificación Adulto Mayor', () => {
      const caso = reportesPrueba[2]; // 70 años
      const resultado = clasificarUrgenciaArbolDecision(caso);
      
      return {
        pasada: resultado.score_urgencia >= 40, // Adulto mayor debe tener score significativo
        mensaje: `Edad: ${caso.edad}, Score: ${resultado.score_urgencia}`,
        datos: resultado
      };
    });

    // Prueba 4: Factores incluidos
    this.ejecutarPrueba('Factores de Clasificación', () => {
      const caso = reportesPrueba[0];
      const resultado = clasificarUrgenciaArbolDecision(caso);
      
      return {
        pasada: resultado.factores.length > 0 && resultado.recomendaciones.length > 0,
        mensaje: `Factores: ${resultado.factores.length}, Recomendaciones: ${resultado.recomendaciones.length}`,
        datos: { factores: resultado.factores, recomendaciones: resultado.recomendaciones }
      };
    });
  }

  // ========================================================================
  // PRUEBAS DE kNN
  // ========================================================================

  private pruebasKNN(): void {
    console.log('\n🔍 PRUEBAS: k-Nearest Neighbors');
    console.log('-' .repeat(50));

    // Prueba 1: Encontrar casos similares
    this.ejecutarPrueba('kNN - Casos Similares', () => {
      const casoReferencia = reportesPrueba[0];
      const similares = encontrarCasosSimilaresKNN(casoReferencia, reportesPrueba, 3);
      
      return {
        pasada: similares.length <= 3 && similares.every(caso => caso.id !== casoReferencia.id),
        mensaje: `Encontrados: ${similares.length} casos similares`,
        datos: similares
      };
    });

    // Prueba 2: Caso sin coordenadas
    this.ejecutarPrueba('kNN - Sin Coordenadas', () => {
      const casoSinCoords = { ...reportesPrueba[0], ubicacion_coords: undefined };
      const similares = encontrarCasosSimilaresKNN(casoSinCoords, reportesPrueba, 3);
      
      return {
        pasada: similares.length === 0,
        mensaje: `Sin coordenadas debe retornar array vacío: ${similares.length} elementos`,
        datos: similares
      };
    });

    // Prueba 3: Cálculo de distancia
    this.ejecutarPrueba('Distancia Geográfica', () => {
      const coord1 = { lat: 19.4326, lng: -99.1332 };
      const coord2 = { lat: 19.4342, lng: -99.1312 };
      const distancia = distanciaGeografica(coord1, coord2);
      
      return {
        pasada: distancia > 0 && distancia < 10, // Debería ser menos de 10km
        mensaje: `Distancia calculada: ${distancia.toFixed(2)} km`,
        datos: { coord1, coord2, distancia }
      };
    });
  }

  // ========================================================================
  // PRUEBAS DE K-MEANS
  // ========================================================================

  private pruebasKMeans(): void {
    console.log('\n🗺️ PRUEBAS: K-Means Clustering');
    console.log('-' .repeat(50));

    // Prueba 1: Identificar zonas críticas
    this.ejecutarPrueba('K-Means - Zonas Críticas', () => {
      const zonas = identificarZonasCriticasKMeans(reportesPrueba, 3);
      
      return {
        pasada: zonas.length > 0 && zonas.every(z => z.coordenadas && z.frecuencia > 0),
        mensaje: `Zonas identificadas: ${zonas.length}`,
        datos: zonas
      };
    });

    // Prueba 2: Pocos datos
    this.ejecutarPrueba('K-Means - Datos Insuficientes', () => {
      const pocosDatos = reportesPrueba.slice(0, 2);
      const zonas = identificarZonasCriticasKMeans(pocosDatos, 5);
      
      return {
        pasada: zonas.length === 0, // Debe retornar vacío si hay menos datos que clusters
        mensaje: `Con pocos datos debe retornar array vacío: ${zonas.length} zonas`,
        datos: zonas
      };
    });

    // Prueba 3: Niveles de riesgo
    this.ejecutarPrueba('K-Means - Niveles de Riesgo', () => {
      const zonas = identificarZonasCriticasKMeans(reportesPrueba, 2);
      const riesgosValidos = zonas.every(z => ['alto', 'medio', 'bajo'].includes(z.riesgo));
      
      return {
        pasada: riesgosValidos,
        mensaje: `Todos los niveles de riesgo son válidos: ${riesgosValidos}`,
        datos: zonas.map(z => ({ zona: z.zona, riesgo: z.riesgo, frecuencia: z.frecuencia }))
      };
    });
  }

  // ========================================================================
  // PRUEBAS DE ANÁLISIS BAYESIANO
  // ========================================================================

  private pruebasAnalisisBayesiano(): void {
    console.log('\n📈 PRUEBAS: Análisis Bayesiano');
    console.log('-' .repeat(50));

    // Prueba 1: Patrones temporales
    this.ejecutarPrueba('Bayesiano - Patrones Temporales', () => {
      const analisis = analizarPatronesTemporalesBayesiano(reportesPrueba);
      
      return {
        pasada: 
          analisis.hora_critica >= 0 && analisis.hora_critica <= 23 &&
          analisis.dia_semana_critico >= 0 && analisis.dia_semana_critico <= 6 &&
          analisis.mes_critico >= 0 && analisis.mes_critico <= 11 &&
          analisis.confianza >= 0 && analisis.confianza <= 1,
        mensaje: `Hora: ${analisis.hora_critica}, Día: ${analisis.dia_semana_critico}, Confianza: ${analisis.confianza}`,
        datos: analisis
      };
    });

    // Prueba 2: Descripción de patrón
    this.ejecutarPrueba('Bayesiano - Descripción Patrón', () => {
      const analisis = analizarPatronesTemporalesBayesiano(reportesPrueba);
      
      return {
        pasada: Boolean(analisis.patron_detectado && analisis.patron_detectado.length > 0),
        mensaje: `Patrón: "${analisis.patron_detectado}"`,
        datos: analisis
      };
    });
  }

  // ========================================================================
  // PRUEBAS DE SISTEMA DE RECOMENDACIONES
  // ========================================================================

  private pruebasRecomendaciones(): void {
    console.log('\n💡 PRUEBAS: Sistema de Recomendaciones');
    console.log('-' .repeat(50));

    // Prueba 1: Recomendaciones generadas
    this.ejecutarPrueba('Recomendaciones - Estructura', () => {
      const caso = reportesPrueba[0];
      const recomendaciones = generarRecomendacionesInteligentes(caso, reportesPrueba);
      
      const estructura = 
        Array.isArray(recomendaciones.acciones_inmediatas) &&
        Array.isArray(recomendaciones.recursos_sugeridos) &&
        Array.isArray(recomendaciones.areas_busqueda) &&
        Array.isArray(recomendaciones.alertas_especiales);
      
      return {
        pasada: estructura,
        mensaje: `Estructura válida: ${estructura}`,
        datos: recomendaciones
      };
    });

    // Prueba 2: Contenido de recomendaciones
    this.ejecutarPrueba('Recomendaciones - Contenido', () => {
      const caso = reportesPrueba[0]; // Caso crítico
      const recomendaciones = generarRecomendacionesInteligentes(caso, reportesPrueba);
      
      const tieneContenido = recomendaciones.acciones_inmediatas.length > 0;
      
      return {
        pasada: tieneContenido,
        mensaje: `Acciones inmediatas: ${recomendaciones.acciones_inmediatas.length}`,
        datos: recomendaciones.acciones_inmediatas
      };
    });
  }

  // ========================================================================
  // PRUEBAS DE PROCESAMIENTO COMPLETO
  // ========================================================================

  private pruebasProcesamientoCompleto(): void {
    console.log('\n🤖 PRUEBAS: Procesamiento Completo con IA');
    console.log('-' .repeat(50));

    // Prueba 1: Procesamiento completo
    this.ejecutarPrueba('Procesamiento - Completo', () => {
      const caso = reportesPrueba[0];
      const resultado = procesarCasoConIA(caso, reportesPrueba);
      
      const estructura = 
        resultado.clasificacion &&
        resultado.casos_similares &&
        resultado.zonas_criticas &&
        resultado.analisis_temporal &&
        resultado.recomendaciones &&
        resultado.estado_ia;
      
      return {
        pasada: !!estructura,
        mensaje: `Procesamiento completo exitoso: ${!!estructura}`,
        datos: {
          tiempo: resultado.estado_ia.tiempo_procesamiento,
          confianza: resultado.estado_ia.confianza_general,
          algoritmos: resultado.estado_ia.algoritmos_activos.length
        }
      };
    });

    // Prueba 2: Estado de IA
    this.ejecutarPrueba('Estado IA - Algoritmos Activos', () => {
      const caso = reportesPrueba[0];
      const resultado = procesarCasoConIA(caso, reportesPrueba);
      
      return {
        pasada: resultado.estado_ia.algoritmos_activos.length === 5,
        mensaje: `Algoritmos activos: ${resultado.estado_ia.algoritmos_activos.length}/5`,
        datos: resultado.estado_ia.algoritmos_activos
      };
    });
  }

  // ========================================================================
  // PRUEBAS DE RENDIMIENTO
  // ========================================================================

  private pruebasRendimiento(): void {
    console.log('\n⚡ PRUEBAS: Rendimiento del Sistema');
    console.log('-' .repeat(50));

    // Prueba 1: Tiempo de clasificación
    this.ejecutarPrueba('Rendimiento - Clasificación', () => {
      const inicio = Date.now();
      const caso = reportesPrueba[0];
      clasificarUrgenciaArbolDecision(caso);
      const tiempo = Date.now() - inicio;
      
      return {
        pasada: tiempo < 100, // Debe ser menor a 100ms
        mensaje: `Tiempo de clasificación: ${tiempo}ms`,
        datos: { tiempo }
      };
    });

    // Prueba 2: Procesamiento en lote
    this.ejecutarPrueba('Rendimiento - Procesamiento Lote', () => {
      const inicio = Date.now();
      
      reportesPrueba.forEach(caso => {
        clasificarUrgenciaArbolDecision(caso);
      });
      
      const tiempo = Date.now() - inicio;
      const throughput = (reportesPrueba.length / tiempo * 1000).toFixed(2);
      
      return {
        pasada: tiempo < 500, // Debe procesar 5 casos en menos de 500ms
        mensaje: `Lote de ${reportesPrueba.length} casos: ${tiempo}ms (${throughput} casos/seg)`,
        datos: { tiempo, throughput }
      };
    });
  }

  // ========================================================================
  // PRUEBAS DE VALIDACIÓN
  // ========================================================================

  private pruebasValidacion(): void {
    console.log('\n✅ PRUEBAS: Validación de Datos');
    console.log('-' .repeat(50));

    // Prueba 1: Manejo de datos faltantes
    this.ejecutarPrueba('Validación - Datos Faltantes', () => {
      const casoIncompleto = {
        id: 999,
        nombre_desaparecido: "Test Incompleto",
        edad: 25,
        estatus: "activo",
        ultima_ubicacion: "",
        created_at: new Date().toISOString()
      };
      
      const resultado = clasificarUrgenciaArbolDecision(casoIncompleto);
      
      return {
        pasada: resultado.prioridad && resultado.score_urgencia >= 0,
        mensaje: `Maneja datos faltantes correctamente: Score ${resultado.score_urgencia}`,
        datos: resultado
      };
    });

    // Prueba 2: Estado del sistema
    this.ejecutarPrueba('Validación - Estado Sistema', () => {
      const estadoValido = Boolean(
        EstadoIA.version &&
        EstadoIA.algoritmos_disponibles > 0 &&
        EstadoIA.precision_promedio > 0 &&
        EstadoIA.precision_promedio <= 1
      );
      
      return {
        pasada: estadoValido,
        mensaje: `Estado del sistema válido: ${estadoValido}`,
        datos: EstadoIA
      };
    });
  }

  // ========================================================================
  // MÉTODOS AUXILIARES
  // ========================================================================

  private ejecutarPrueba(nombre: string, prueba: () => { pasada: boolean; mensaje: string; datos?: any }): void {
    const inicio = Date.now();
    
    try {
      const resultado = prueba();
      const tiempo = Date.now() - inicio;
      
      const resultadoPrueba: ResultadoPrueba = {
        nombre,
        pasada: resultado.pasada,
        mensaje: resultado.mensaje,
        tiempo,
        datos: resultado.datos
      };
      
      this.resultados.push(resultadoPrueba);
      
      const estado = resultado.pasada ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${estado} ${nombre} (${tiempo}ms)`);
      console.log(`        ${resultado.mensaje}`);
      
    } catch (error) {
      const tiempo = Date.now() - inicio;
      const resultadoPrueba: ResultadoPrueba = {
        nombre,
        pasada: false,
        mensaje: `Error: ${error}`,
        tiempo
      };
      
      this.resultados.push(resultadoPrueba);
      console.log(`   ❌ ERROR ${nombre} (${tiempo}ms)`);
      console.log(`        Error: ${error}`);
    }
  }

  private mostrarResumenPruebas(): void {
    const total = this.resultados.length;
    const pasadas = this.resultados.filter(r => r.pasada).length;
    const fallidas = total - pasadas;
    const tiempoTotal = this.resultados.reduce((sum, r) => sum + r.tiempo, 0);
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('=' .repeat(60));
    console.log(`✅ Pruebas Pasadas: ${pasadas}/${total} (${(pasadas/total*100).toFixed(1)}%)`);
    console.log(`❌ Pruebas Fallidas: ${fallidas}/${total}`);
    console.log(`⏱️ Tiempo Total: ${tiempoTotal}ms`);
    console.log(`⚡ Tiempo Promedio: ${(tiempoTotal/total).toFixed(1)}ms por prueba`);
    
    if (fallidas > 0) {
      console.log('\n❌ PRUEBAS FALLIDAS:');
      this.resultados.filter(r => !r.pasada).forEach(r => {
        console.log(`   - ${r.nombre}: ${r.mensaje}`);
      });
    }
    
    console.log('\n🎯 Estado General del Sistema:', pasadas === total ? '✅ TODOS LOS ALGORITMOS FUNCIONANDO' : '⚠️ REQUIERE ATENCIÓN');
    console.log('');
  }

  // Método para obtener resultados
  obtenerResultados(): ResultadoPrueba[] {
    return this.resultados;
  }

  // Método para verificar si todas las pruebas pasaron
  todasLasPruebasPasaron(): boolean {
    return this.resultados.every(r => r.pasada);
  }
}

// ============================================================================
// EXPORTACIONES Y EJECUCIÓN
// ============================================================================

// Función principal para ejecutar todas las pruebas
export function ejecutarPruebas(): ResultadoPrueba[] {
  const testSuite = new TestSuiteIA();
  return testSuite.ejecutarTodasLasPruebas();
}

// Función para pruebas específicas
export function ejecutarPruebaEspecifica(categoria: string): ResultadoPrueba[] {
  const testSuite = new TestSuiteIA();
  const todosLosResultados = testSuite.ejecutarTodasLasPruebas();
  
  // Filtrar por categoría si se especifica
  if (categoria) {
    return todosLosResultados.filter(r => 
      r.nombre.toLowerCase().includes(categoria.toLowerCase())
    );
  }
  
  return todosLosResultados;
}

// Función de validación rápida
export function validacionRapida(): boolean {
  console.log('🚀 EJECUTANDO VALIDACIÓN RÁPIDA DEL SISTEMA IA...');
  
  const testSuite = new TestSuiteIA();
  const resultados = testSuite.ejecutarTodasLasPruebas();
  
  return testSuite.todasLasPruebasPasaron();
}

// Auto-ejecutar pruebas si se ejecuta el archivo directamente
if (typeof require !== 'undefined' && require.main === module) {
  console.log('🧪 Ejecutando pruebas automáticamente...');
  ejecutarPruebas();
}

export default {
  TestSuiteIA,
  ejecutarPruebas,
  ejecutarPruebaEspecifica,
  validacionRapida,
  reportesPrueba
};