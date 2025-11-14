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

  for (const valor of valoresPrueba) {
    try {
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
      } else {
        await supabase
          .from('usuarios')
          .delete()
          .eq('email', testEmail);
      }
    } catch (error) {
      // Error handling sin logs para producción
    }
    
    // Pequeña pausa para no sobrecargar la BD
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};

// Para ejecutar manualmente:
// verificarValoresJurisdiccion();