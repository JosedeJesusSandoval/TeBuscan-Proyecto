// Función de prueba para verificar valores válidos de jurisdicción
// Ejecutar en la consola del navegador o en un componente de prueba

import { supabase } from '../DB/supabase';

export const verificarValoresJurisdiccion = async () => {
  const valoresPrueba = [
    'Guadalajara',
    'Tlajomulco de Zúñiga', 
    'Zapopan',
    'Tonalá',
    'Tlaquepaque',
    'El Salto',
    'Zona Metropolitana de Guadalajara',
    'Jalisco',
    'Federal',
    'Municipal',
    'Estatal',
    'Nacional',
    'Regional',
    'Local'
  ];

  console.log('🔍 Verificando valores válidos para jurisdicción...\n');

  for (const valor of valoresPrueba) {
    try {
      // Intentar hacer una consulta simulada para probar el constraint
      const testEmail = `test-${valor.toLowerCase().replace(/\s/g, '-')}@example.com`;
      
      const { data, error } = await supabase
        .from('usuarios')
        .insert([
          {
            name: 'Test Usuario',
            email: testEmail,
            password_hash: 'test_hash',
            rol: 'autoridad',
            telefono: '1234567890',
            institucion: 'Test Institution',
            jurisdiccion: valor,
            activo: false,
            verificado: false,
          },
        ])
        .select();

      if (error) {
        if (error.message.includes('check_jurisdiccipon_valida')) {
          console.log(`❌ "${valor}": RECHAZADO por constraint`);
        } else if (error.message.includes('duplicate key')) {
          console.log(`✅ "${valor}": VÁLIDO (ya existe)`);
        } else {
          console.log(`⚠️ "${valor}": Error diferente - ${error.message}`);
        }
      } else {
        console.log(`✅ "${valor}": VÁLIDO - insertado correctamente`);
        // Limpiar el registro de prueba inmediatamente
        await supabase
          .from('usuarios')
          .delete()
          .eq('email', testEmail);
      }
    } catch (error) {
      console.log(`💥 "${valor}": Error inesperado - ${error.message}`);
    }
    
    // Pequeña pausa para no sobrecargar la BD
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n✨ Verificación completada');
};

// Para ejecutar manualmente:
// verificarValoresJurisdiccion();