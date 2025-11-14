import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { reportError, safeAsyncCall } from '../utils/crashHandler';
import { decryptSensitiveData, hashPassword } from '../utils/crypto';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============ FUNCIONES DE USUARIOS ============

// Insertar usuario con rol
export const insertarUsuario = async (name, email, password_hash, rol = 'ciudadano', telefono = '', institucion = '', jurisdiccion = '') => {
  try {
    console.log('Datos enviados a Supabase:', { name, email, password_hash, rol, telefono, institucion, jurisdiccion });

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
          jurisdiccion,
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
  return await safeAsyncCall(
    async () => {
      // Buscar usuario sin filtrar por activo primero para dar mensajes específicos
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, name, email, rol, activo, verificado, password_hash')
        .eq('email', email)
        .single();

      if (error) {
        return { success: false, error: 'Usuario o contraseña incorrectos' };
      }

      // Verificar contraseña primero
      const hashedPassword = await hashPassword(password);
      if (hashedPassword !== data.password_hash) {
        return { success: false, error: 'Usuario o contraseña incorrectos' };
      }

      // Verificar si el usuario está activo
      if (!data.activo) {
        return { success: false, error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' };
      }

      // Verificar si el usuario está verificado
      if (!data.verificado) {
        if (data.rol === 'autoridad') {
          return { success: false, error: 'Su cuenta de autoridad está pendiente de verificación' };
        } else {
          return { success: false, error: 'Tu cuenta ha sido desactivada temporalmente. Contacta al administrador.' };
        }
      }

      console.log(`✅ Login exitoso para ${email} (${data.rol})`);
      
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
    },
    'Error al intentar iniciar sesión. Verifica tu conexión.',
    (error) => {
      reportError(error, 'verificarLogin');
      return { success: false, error: 'Error de conexión al servidor' };
    }
  ) || { success: false, error: 'Error de conexión al servidor' };
};

// Enviar correo de recuperación de contraseña
export const enviarRecuperacionContrasena = async (email) => {
  try {
    console.log('🔍 Iniciando recuperación de contraseña para:', email);
    
    // Primero verificar que el email existe en nuestra base de datos
    const usuarioExiste = await existeUsuario(email);
    console.log('👤 Usuario existe en BD:', usuarioExiste);
    
    if (!usuarioExiste) {
      console.log('❌ Usuario no encontrado en la base de datos');
      return { success: false, error: 'No existe una cuenta con este correo electrónico' };
    }

    console.log('📧 Intentando enviar correo de recuperación...');
    
    // Configuración mejorada para el resetPasswordForEmail
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://localhostlocalhost:8081/reset-password', // URL temporal para desarrollo
    });

    console.log('📨 Respuesta de Supabase:', { data, error });

    if (error) {
      console.error('❌ Error detallado de Supabase:', {
        message: error.message,
        status: error.status,
        details: error
      });
      
      // Mensajes de error más específicos
      if (error.message?.includes('email not confirmed')) {
        return { success: false, error: 'El correo electrónico no ha sido confirmado' };
      } else if (error.message?.includes('email not found')) {
        return { success: false, error: 'No existe una cuenta con este correo electrónico' };
      } else {
        return { success: false, error: `Error: ${error.message}` };
      }
    }

    console.log('✅ Correo de recuperación enviado exitosamente');
    return { success: true, message: 'Se ha enviado un correo de recuperación a tu email' };
  } catch (error) {
    console.error('💥 Error inesperado en enviarRecuperacionContrasena:', error);
    return { success: false, error: 'Error de conexión' };
  }
};

// Función de diagnóstico para verificar configuración
export const diagnosticarConfiguracion = async () => {
  try {
    console.log('🔧 Diagnosticando configuración de Supabase...');
    
    // Verificar URLs y keys
    console.log('📍 Supabase URL:', supabaseUrl ? '✅ Configurada' : '❌ No configurada');
    console.log('🔑 Supabase Key:', supabaseAnonKey ? '✅ Configurada' : '❌ No configurada');
    console.log('📍 URL completa:', supabaseUrl);
    
    // Verificar conexión
    const { data, error } = await supabase.auth.getSession();
    console.log('🔌 Conexión a Supabase:', error ? '❌ Error' : '✅ OK');
    
    if (error) {
      console.error('Error de conexión:', error);
    }
    
    // Verificar configuración de Auth
    try {
      const { data: settings } = await supabase.auth.getUser();
      console.log('👤 Estado de Auth:', settings ? '✅ Disponible' : '❌ No disponible');
    } catch (authError) {
      console.log('👤 Auth no inicializado (normal)');
    }
    
    return {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey,
      connection: !error,
      urlValue: supabaseUrl
    };
  } catch (error) {
    console.error('Error en diagnóstico:', error);
    return {
      url: false,
      key: false,
      connection: false,
      error: error.message
    };
  }
};

// Crear usuario en Supabase Auth (para testing)
export const crearUsuarioAuth = async (email, password) => {
  try {
    console.log('👤 Creando usuario en Supabase Auth:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.error('Error al crear usuario Auth:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Usuario Auth creado:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error en crearUsuarioAuth:', error);
    return { success: false, error: error.message };
  }
};

// Verificar historial de emails enviados (solo para debug)
export const verificarEmailsEnviados = async (email) => {
  try {
    console.log('📧 Verificando historial de emails para:', email);
    
    // Intentar obtener información del usuario en Supabase Auth
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log('⚠️ No se puede acceder al admin (normal en desarrollo)');
      return { success: false, message: 'No se puede verificar historial (requiere permisos admin)' };
    }
    
    const user = users.find(u => u.email === email);
    console.log('👤 Usuario encontrado en Supabase Auth:', !!user);
    
    if (user) {
      console.log('📊 Datos del usuario:', {
        id: user.id,
        email: user.email,
        confirmed: user.email_confirmed_at !== null,
        created: user.created_at
      });
    }
    
    return { 
      success: true, 
      userExists: !!user,
      userConfirmed: user?.email_confirmed_at !== null
    };
  } catch (error) {
    console.error('Error verificando emails:', error);
    return { success: false, error: error.message };
  }
};

// Listener para cambios en el estado de autenticación
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

// Cambiar contraseña
export const cambiarContrasena = async (email, nuevaPassword) => {
  try {
    const hashedPassword = await hashPassword(nuevaPassword);

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

// Desactivar usuario completamente (base de datos + auth)
export const desactivarUsuario = async (usuarioId, email) => {
  try {
    console.log(`🔒 Desactivando usuario: ${email} (ID: ${usuarioId})`);

    // 1. Actualizar el campo verificado en la base de datos
    const { data: updateData, error: updateError } = await supabase
      .from('usuarios')
      .update({ verificado: false })
      .eq('id', usuarioId)
      .select();

    if (updateError) {
      console.error('Error actualizando usuario en BD:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('✅ Usuario marcado como no verificado en BD');

    // 2. Intentar desactivar en Supabase Auth (Admin API)
    // Nota: Esto requiere privilegios de admin, si no está disponible, continúa
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
        usuarioId,
        { user_metadata: { active: false, deactivated_at: new Date().toISOString() } }
      );

      if (authError) {
        console.warn('⚠️ No se pudo desactivar en Auth (requiere privilegios admin):', authError.message);
        // No es error crítico, el usuario sigue desactivado en BD
      } else {
        console.log('✅ Usuario desactivado en Supabase Auth');
      }
    } catch (authError) {
      console.warn('⚠️ Auth admin no disponible:', authError.message);
    }

    return { 
      success: true, 
      data: updateData[0],
      message: 'Usuario desactivado exitosamente. Perderá acceso en el próximo inicio de sesión.'
    };

  } catch (error) {
    console.error('❌ Error desactivando usuario:', error);
    return { success: false, error: error.message };
  }
};

// Activar usuario completamente (base de datos + auth)
export const activarUsuario = async (usuarioId, email) => {
  try {
    console.log(`🔓 Activando usuario: ${email} (ID: ${usuarioId})`);

    // 1. Actualizar el campo verificado en la base de datos
    const { data: updateData, error: updateError } = await supabase
      .from('usuarios')
      .update({ verificado: true })
      .eq('id', usuarioId)
      .select();

    if (updateError) {
      console.error('Error actualizando usuario en BD:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('✅ Usuario marcado como verificado en BD');

    // 2. Intentar activar en Supabase Auth (Admin API)
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
        usuarioId,
        { user_metadata: { active: true, activated_at: new Date().toISOString() } }
      );

      if (authError) {
        console.warn('⚠️ No se pudo activar en Auth (requiere privilegios admin):', authError.message);
        // No es error crítico, el usuario sigue activado en BD
      } else {
        console.log('✅ Usuario activado en Supabase Auth');
      }
    } catch (authError) {
      console.warn('⚠️ Auth admin no disponible:', authError.message);
    }

    return { 
      success: true, 
      data: updateData[0],
      message: 'Usuario activado exitosamente. Puede iniciar sesión normalmente.'
    };

  } catch (error) {
    console.error('❌ Error activando usuario:', error);
    return { success: false, error: error.message };
  }
};

// Verificar si un usuario está activo (para usar en login)
export const verificarUsuarioActivo = async (usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('verificado, name, email')
      .eq('id', usuarioId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: {
        ...data,
        isActive: data.verificado === true
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
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

// Obtener todos los reportes (para autoridades)
export const obtenerReportes = async () => {
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
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Actualizar reporte
export const actualizarReporte = async (reporteId, datosActualizacion) => {
  try {
    const { data, error } = await supabase
      .from('reportes')
      .update(datosActualizacion)
      .eq('id', reporteId)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener reporte por ID con información de contacto según permisos
export const obtenerReportePorId = async (id, usuarioActual = null) => {
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

    // Determinar si el usuario puede ver información de contacto real
    const puedeVerContactoReal = usuarioActual && (
      usuarioActual.rol === 'autoridad' || 
      usuarioActual.rol === 'admin' || 
      data.usuario_id === usuarioActual.id
    );

    if (!puedeVerContactoReal) {
      // Mostrar información institucional en lugar de datos reales
      const { getInstitutionalContactInfo } = await import('../utils/crypto');
      const contactoInstitucional = getInstitutionalContactInfo();
      
      data.nombre_reportante = contactoInstitucional.nombre_reportante;
      data.telefono_reportante = contactoInstitucional.telefono_reportante;
      data.correo_reportante = contactoInstitucional.correo_reportante;
      data.relacion_reportante = contactoInstitucional.relacion_reportante;
      data.whatsapp_cnb = contactoInstitucional.whatsapp;
      data.descripcion_contacto = contactoInstitucional.descripcion;
      data.es_contacto_institucional = true;
    } else if (puedeVerContactoReal && data.nombre_reportante) {
      // Descifrar datos para usuarios autorizados
      const { decryptSensitiveData } = await import('../utils/crypto');
      
      data.nombre_reportante = decryptSensitiveData(data.nombre_reportante);
      data.telefono_reportante = decryptSensitiveData(data.telefono_reportante);
      data.correo_reportante = decryptSensitiveData(data.correo_reportante);
      data.relacion_reportante = decryptSensitiveData(data.relacion_reportante);
      data.es_contacto_institucional = false;
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

// Obtener reportes por usuario CON información de contacto descifrada (para perfil)
export const obtenerReportesPorUsuarioConContacto = async (usuarioId) => {
  try {
    console.log('Cargando reportes para usuario:', usuarioId);
    
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .eq('usuario_id', usuarioId);

    if (error) {
      console.error('Error consultando reportes:', error);
      return { success: false, error: error.message };
    }

    console.log(`Encontrados ${data?.length || 0} reportes para el usuario`);
    

    // Descifrar la información de contacto para los reportes propios
    const reportesConContacto = data.map(reporte => {
      try {
        console.log(`\n🔍 Procesando reporte ${reporte.id}:`);
        console.log('- nombre_reportante_cifrado:', reporte.nombre_reportante_cifrado ? 'PRESENTE' : 'NULL');
        console.log('- nombre_reportante:', reporte.nombre_reportante ? reporte.nombre_reportante.substring(0, 30) + '...' : 'NULL');
        
        const reporteDescifrado = { ...reporte };

        // Función simple para descifrar automáticamente
        const procesarCampo = (campoCifrado, campoNormal, nombreCampo) => {
          console.log(`\n🔄 Procesando ${nombreCampo}:`);
          
          // Intentar descifrar el campo normal primero (que parece contener los datos cifrados)
          if (campoNormal && campoNormal.trim() !== '') {
            try {
              const descifrado = decryptSensitiveData(campoNormal);
              console.log(`  📤 Campo normal: "${campoNormal}"`);
              console.log(`  📥 Descifrado: "${descifrado}"`);
              
              // Si el descifrado es diferente y no está vacío, usarlo
              if (descifrado && descifrado !== campoNormal && descifrado.trim() !== '') {
                console.log(`  ✅ Usando campo normal descifrado para ${nombreCampo}`);
                return descifrado;
              }
            } catch (error) {
              console.log(`  ❌ Error descifrando campo normal: ${error.message}`);
            }
          }

          // Si hay campo cifrado, intentar con ese
          if (campoCifrado && campoCifrado.trim() !== '') {
            try {
              const descifrado = decryptSensitiveData(campoCifrado);
              console.log(`  📤 Campo cifrado: "${campoCifrado}"`);
              console.log(`  📥 Descifrado: "${descifrado}"`);
              
              if (descifrado && descifrado !== campoCifrado && descifrado.trim() !== '') {
                console.log(`  ✅ Usando campo cifrado descifrado para ${nombreCampo}`);
                return descifrado;
              }
            } catch (error) {
              console.log(`  ❌ Error descifrando campo cifrado: ${error.message}`);
            }
          }

          // Como último recurso, usar el campo normal sin descifrar
          console.log(`  ⚠️ Usando campo normal sin descifrar para ${nombreCampo}`);
          return campoNormal || campoCifrado || '';
        };

        // Procesar cada campo de contacto
        reporteDescifrado.nombre_reportante = procesarCampo(
          reporte.nombre_reportante_cifrado, 
          reporte.nombre_reportante,
          'nombre_reportante'
        );
        reporteDescifrado.telefono_reportante = procesarCampo(
          reporte.telefono_reportante_cifrado, 
          reporte.telefono_reportante,
          'telefono_reportante'
        );
        reporteDescifrado.correo_reportante = procesarCampo(
          reporte.correo_reportante_cifrado, 
          reporte.correo_reportante,
          'correo_reportante'
        );
        reporteDescifrado.relacion_reportante = procesarCampo(
          reporte.relacion_reportante_cifrada, 
          reporte.relacion_reportante,
          'relacion_reportante'
        );

        return reporteDescifrado;
      } catch (error) {
        console.error('Error procesando reporte:', reporte.id, error);
        return reporte; // Devolver el reporte original si hay error
      }
    });

    console.log('✅ Reportes procesados con información de contacto');
    return { success: true, data: reportesConContacto };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener reporte por ID con información de contacto apropiada según el usuario
export const obtenerReportePorIdConUsuario = async (reporteId, usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .eq('id', reporteId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Reporte no encontrado' };
    }

    // Si es el propio reporte del usuario, mostrar información real descifrada
    if (usuarioId && data.usuario_id === usuarioId) {
      try {
        console.log(`\n🔍 Descifrando reporte propio ${reporteId} para usuario ${usuarioId}`);

        // Usar la misma función de procesamiento que en obtenerReportesPorUsuarioConContacto
        const procesarCampoDetalle = (campoCifrado, campoNormal, nombreCampo) => {
          console.log(`\n🔄 Procesando ${nombreCampo} (detalle):`);
          
          // Intentar descifrar el campo normal primero
          if (campoNormal && campoNormal.trim() !== '') {
            try {
              const descifrado = decryptSensitiveData(campoNormal);
              console.log(`  📤 Campo normal: "${campoNormal}"`);
              console.log(`  📥 Descifrado: "${descifrado}"`);
              
              if (descifrado && descifrado !== campoNormal && descifrado.trim() !== '') {
                console.log(`  ✅ Usando campo normal descifrado para ${nombreCampo}`);
                return descifrado;
              }
            } catch (error) {
              console.log(`  ❌ Error descifrando campo normal: ${error.message}`);
            }
          }

          // Si hay campo cifrado, intentar con ese
          if (campoCifrado && campoCifrado.trim() !== '') {
            try {
              const descifrado = decryptSensitiveData(campoCifrado);
              console.log(`  📤 Campo cifrado: "${campoCifrado}"`);
              console.log(`  📥 Descifrado: "${descifrado}"`);
              
              if (descifrado && descifrado !== campoCifrado && descifrado.trim() !== '') {
                console.log(`  ✅ Usando campo cifrado descifrado para ${nombreCampo}`);
                return descifrado;
              }
            } catch (error) {
              console.log(`  ❌ Error descifrando campo cifrado: ${error.message}`);
            }
          }

          console.log(`  ⚠️ Usando campo normal sin descifrar para ${nombreCampo}`);
          return campoNormal || campoCifrado || '';
        };

        const reporteConContacto = {
          ...data,
          // Descifrar datos sensibles usando la función mejorada
          nombre_reportante: procesarCampoDetalle(
            data.nombre_reportante_cifrado, 
            data.nombre_reportante,
            'nombre_reportante'
          ),
          telefono_reportante: procesarCampoDetalle(
            data.telefono_reportante_cifrado, 
            data.telefono_reportante,
            'telefono_reportante'
          ),
          correo_reportante: procesarCampoDetalle(
            data.correo_reportante_cifrado, 
            data.correo_reportante,
            'correo_reportante'
          ),
          relacion_reportante: procesarCampoDetalle(
            data.relacion_reportante_cifrada, 
            data.relacion_reportante,
            'relacion_reportante'
          ),
          es_propio: true // Marcar que es su propio reporte
        };

        console.log('✅ Reporte propio procesado con información descifrada');
        return { success: true, data: reporteConContacto };
      } catch (error) {
        console.error('Error descifrando datos propios:', error);
        // En caso de error, usar la función normal
        return obtenerReportePorId(reporteId);
      }
    } else {
      // Si no es su reporte, usar la función normal que muestra info institucional
      return obtenerReportePorId(reporteId);
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener reportes para el mapa (con filtros opcionales)
export const obtenerReportesParaMapa = async (filtros = {}) => {
  try {
    let query = supabase
      .from('reportes')
      .select(`
        id,
        nombre_desaparecido,
        edad,
        sexo,
        descripcion,
        ultima_ubicacion,
        latitud,
        longitud,
        ultima_fecha_visto,
        estatus,
        foto_url,
        created_at,
        usuarios(name)
      `);

    // Aplicar filtros
    if (filtros.estatus) {
      query = query.eq('estatus', filtros.estatus);
    }
    
    if (filtros.dias_recientes) {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - filtros.dias_recientes);
      query = query.gte('created_at', fechaLimite.toISOString());
    }

    // Solo mostrar reportes que tienen coordenadas
    query = query.not('latitud', 'is', null)
              .not('longitud', 'is', null);

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100); // Limitar para rendimiento

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener reportes con información de contacto segura según el rol del usuario
export const obtenerReportesConContacto = async (usuarioId, rolUsuario, limite = 10) => {
  try {
    let selectFields = `
      id,
      nombre_desaparecido,
      edad,
      descripcion,
      ultima_ubicacion,
      ultima_fecha_visto,
      estatus,
      created_at,
      usuarios(name)
    `;

    // Solo autoridades y el propio usuario pueden ver datos de contacto reales
    if (rolUsuario === 'autoridad' || rolUsuario === 'admin') {
      selectFields += `,
        nombre_reportante,
        relacion_reportante,
        telefono_reportante,
        correo_reportante
      `;
    }

    let query = supabase
      .from('reportes')
      .select(selectFields);

    // Si es ciudadano común, solo mostrar reportes propios con contacto real
    if (rolUsuario === 'ciudadano') {
      query = query.eq('usuario_id', usuarioId);
      selectFields += `,
        nombre_reportante,
        relacion_reportante,
        telefono_reportante,
        correo_reportante
      `;
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) {
      return { success: false, error: error.message };
    }

    // Para usuarios no autorizados, agregar información institucional
    if (rolUsuario === 'ciudadano' && data) {
      const { getInstitutionalContactInfo } = await import('../utils/crypto');
      const contactoInstitucional = getInstitutionalContactInfo();
      
      data.forEach(reporte => {
        if (reporte.usuario_id !== usuarioId) {
          // Reemplazar con información institucional
          reporte.nombre_reportante = contactoInstitucional.nombre_reportante;
          reporte.telefono_reportante = contactoInstitucional.telefono_reportante;
          reporte.correo_reportante = contactoInstitucional.correo_reportante;
          reporte.relacion_reportante = contactoInstitucional.relacion_reportante;
          reporte.es_contacto_institucional = true;
        }
      });
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const obtenerReportesPorJurisdiccion = async (jurisdiccionAutoridad) => {
  try {
    console.log('🔍 Obteniendo reportes para jurisdicción:', jurisdiccionAutoridad);

    // Si la jurisdicción es 'Federal' o amplia, mostrar todos los reportes
    if (jurisdiccionAutoridad === 'Federal' || jurisdiccionAutoridad === 'Zona Metropolitana de Guadalajara') {
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo reportes (todos):', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Se encontraron ${data?.length || 0} reportes totales`);
      return { success: true, data: data };
    }

    // Para jurisdicciones específicas, intentar filtrado flexible
    console.log('🔍 Intentando filtrado para jurisdicción específica:', jurisdiccionAutoridad);
    
    let { data, error } = await supabase
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
      .ilike('ultima_ubicacion', `%${jurisdiccionAutoridad}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo reportes por jurisdicción:', error);
      return { success: false, error: error.message };
    }

    // Si no hay resultados con filtro exacto, intentar con palabra principal
    if (!data || data.length === 0) {
      console.log('⚠️ No hay resultados con filtro exacto, intentando con palabra principal...');
      const palabraPrincipal = jurisdiccionAutoridad.split(' ')[0]; // Primera palabra
      
      ({ data, error } = await supabase
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
        .ilike('ultima_ubicacion', `%${palabraPrincipal}%`)
        .order('created_at', { ascending: false }));

      if (error) {
        console.error('Error con filtro de palabra principal:', error);
        return { success: false, error: error.message };
      }
    }

    // Si aún no hay resultados, mostrar todos los reportes
    if (!data || data.length === 0) {
      console.log('⚠️ No hay resultados específicos, mostrando todos los reportes...');
      ({ data, error } = await supabase
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
        .order('created_at', { ascending: false }));

      if (error) {
        console.error('Error obteniendo todos los reportes:', error);
        return { success: false, error: error.message };
      }
    }

    console.log(`✅ Se encontraron ${data?.length || 0} reportes para jurisdicción: ${jurisdiccionAutoridad}`);
    return { success: true, data: data };
  } catch (error) {
    console.error('Error en obtenerReportesPorJurisdiccion:', error);
    return { success: false, error: error.message };
  }
};

export const obtenerInfoAutoridad = async (usuarioId) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, name, institucion, jurisdiccion, rol')
      .eq('id', usuarioId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Función alternativa para obtener todos los reportes (sin filtro de jurisdicción)
export const obtenerTodosLosReportes = async () => {
  try {
    console.log('🔍 Obteniendo todos los reportes...');
    
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo todos los reportes:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Se encontraron ${data?.length || 0} reportes totales`);
    return { success: true, data: data };
  } catch (error) {
    console.error('Error en obtenerTodosLosReportes:', error);
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

