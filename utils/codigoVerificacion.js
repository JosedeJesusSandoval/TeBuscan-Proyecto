import { supabase } from './supabase';

export const generarCodigoVerificacion = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const guardarCodigoVerificacion = async (email, codigo) => {
  try {
    const expiraEn = new Date();
    expiraEn.setMinutes(expiraEn.getMinutes() + 15);

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

    await supabase
      .from('codigos_verificacion')
      .update({ usado: true })
      .eq('id', data.id);

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

export const reenviarCodigo = async (email) => {
  const codigo = generarCodigoVerificacion();
  
  const guardado = await guardarCodigoVerificacion(email, codigo);
  if (!guardado.success) {
    return guardado;
  }

  return { 
    success: true, 
    codigo: codigo,
    message: 'Código de verificación enviado' 
  };
};