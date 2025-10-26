import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { hashPassword } from '../utils/crypto';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============ FUNCIONES DE USUARIOS ============

// Insertar usuario con rol
export const insertarUsuario = async (name, email, password_hash, rol = 'ciudadano', telefono = '', institucion = '') => {
  try {
    console.log('Datos enviados a Supabase:', { name, email, password_hash, rol, telefono, institucion });

    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        {
          name,
          email,
          password_hash,
          rol,
          telefono,
          institucion,
          activo: true,
          verificado: rol === 'autoridad' ? false : true,
        },
      ])
      .select();

    if (error) {
      console.error('Error al insertar usuario:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error en insertarUsuario:', error);
    return { success: false, error: error.message };
  }
};

// Verificar si existe usuario
export const existeUsuario = async (email) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      return false;
    }

    return data !== null;
  } catch (error) {
    return false;
  }
};

// Verificar login con rol
export const verificarLogin = async (email, password) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, name, email, rol, activo, verificado, password_hash')
      .eq('email', email)
      .eq('activo', true)
      .single();

    if (error) {
      return { success: false, error: 'Usuario o contraseña incorrectos' };
    }

    const hashedPassword = hashPassword(password);
    if (hashedPassword !== data.password_hash) {
      return { success: false, error: 'Usuario o contraseña incorrectos' };
    }

    if (data.rol === 'autoridad' && !data.verificado) {
      return { success: false, error: 'Su cuenta de autoridad está pendiente de verificación' };
    }

    return { 
      success: true, 
      usuario: {
        id: data.id,
        name: data.name,
        email: data.email,
        rol: data.rol,
        activo: data.activo,
        verificado: data.verificado
      }
    };
  } catch (error) {
    return { success: false, error: 'Error de conexión' };
  }
};

// Cambiar contraseña
export const cambiarContrasena = async (email, nuevaPassword) => {
  try {
    const hashedPassword = hashPassword(nuevaPassword);

    const { data, error } = await supabase
      .from('usuarios')
      .update({ password_hash: hashedPassword })
      .eq('email', email)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Actualizar datos del usuario
export const actualizarUsuario = async (usuarioId, userData) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .update(userData)
      .eq('id', usuarioId)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener usuarios
export const obtenerUsuarios = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*');

    if (error) {
      console.error('Error al obtener usuarios:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error en obtenerUsuarios:', error);
    return { data: null, error };
  }
};

// ============ FUNCIONES DE REPORTES ============

// Insertar reporte
export const insertarReporte = async (reporteData) => {
  try {
    const { data, error } = await supabase
      .from('reportes')
      .insert([reporteData])
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener reportes recientes
export const obtenerReportesRecientes = async (limite = 10) => {
  try {
    const { data, error } = await supabase
      .from('reportes')
      .select(`
        id,
        nombre_desaparecido,
        edad,
        descripcion,
        ultima_ubicacion,
        ultima_fecha_visto,
        estatus,
        created_at,
        usuario_id,
        usuarios(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener reporte por ID
export const obtenerReportePorId = async (id) => {
  try {
    const { data, error } = await supabase
      .from('reportes')
      .select(`
        *,
        usuarios(name, telefono)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener reportes por usuario
export const obtenerReportesPorUsuario = async (usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .eq('usuario_id', usuarioId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============ FUNCIONES DE SEGUIMIENTOS ============

// Agregar seguimiento
export const agregarSeguimiento = async (reporteId, autoridadId, comentario, nuevoEstatus = null) => {
  try {
    const seguimientoData = {
      reporte_id: reporteId,
      autoridad_id: autoridadId,
      comentario,
      nuevo_estatus: nuevoEstatus
    };

    const { data, error } = await supabase
      .from('seguimientos')
      .insert([seguimientoData])
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    if (nuevoEstatus) {
      const { error: updateError } = await supabase
        .from('reportes')
        .update({ 
          estatus: nuevoEstatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reporteId);

      if (updateError) {
        console.error('Error al actualizar estatus del reporte:', updateError);
      }
    }

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};