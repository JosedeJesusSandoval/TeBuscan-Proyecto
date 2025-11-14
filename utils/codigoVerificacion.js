// Sistema simple de verificación por códigos de 6 dígitos
import { supabase } from './supabase';

// Generar código de verificación de 6 dígitos
export const generarCodigoVerificacion = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Guardar código temporal en base de datos
export const guardarCodigoVerificacion = async (email, codigo) => {
  try {
    const expiraEn = new Date();
    expiraEn.setMinutes(expiraEn.getMinutes() + 15); // Código válido por 15 minutos

    const { error } = await supabase
      .from('codigos_verificacion')
      .upsert([{
        email: email,
        codigo: codigo,
        expira_en: expiraEn.toISOString(),
        usado: false
      }]);

    if (error) {
      console.error('Error guardando código:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en guardarCodigoVerificacion:', error);
    return { success: false, error: error.message };
  }
};

// Verificar código ingresado por el usuario
export const verificarCodigo = async (email, codigoIngresado) => {
  try {
    const { data, error } = await supabase
      .from('codigos_verificacion')
      .select('*')
      .eq('email', email)
      .eq('codigo', codigoIngresado)
      .eq('usado', false)
      .gt('expira_en', new Date().toISOString())
      .single();

    if (error || !data) {
      return { success: false, error: 'Código inválido o expirado' };
    }

    // Marcar código como usado
    await supabase
      .from('codigos_verificacion')
      .update({ usado: true })
      .eq('id', data.id);

    // Marcar usuario como verificado
    await supabase
      .from('usuarios')
      .update({ 
        verificado: true,
        fecha_verificacion: new Date().toISOString()
      })
      .eq('email', email);

    return { success: true, message: 'Email verificado exitosamente' };
  } catch (error) {
    console.error('Error verificando código:', error);
    return { success: false, error: 'Error verificando código' };
  }
};

// Reenviar código
export const reenviarCodigo = async (email) => {
  const codigo = generarCodigoVerificacion();
  
  const guardado = await guardarCodigoVerificacion(email, codigo);
  if (!guardado.success) {
    return guardado;
  }

  // Aquí irían las instrucciones para enviar el email
  // Por ahora, mostrar el código en consola para testing
  console.log(`📧 CÓDIGO DE VERIFICACIÓN PARA ${email}: ${codigo}`);
  
  return { 
    success: true, 
    codigo: codigo, // Solo para desarrollo
    message: 'Código de verificación enviado' 
  };
};