// Test para verificar reportes existentes y crear uno de prueba
const { obtenerReportesRecientes } = require('./DB/supabase');

async function testReportes() {
  console.log('📋 Verificando reportes existentes...');
  
  try {
    const resultado = await obtenerReportesRecientes(10);
    
    if (resultado.success && resultado.data) {
      console.log(`📊 Total de reportes: ${resultado.data.length}`);
      
      resultado.data.forEach((reporte, index) => {
        console.log(`${index + 1}. ${reporte.nombre_desaparecido} - ${reporte.ultima_ubicacion}`);
      });
    } else {
      console.log('❌ Error obteniendo reportes:', resultado.error);
    }
  } catch (error) {
    console.error('❌ Error en el test:', error);
  }
}

testReportes();