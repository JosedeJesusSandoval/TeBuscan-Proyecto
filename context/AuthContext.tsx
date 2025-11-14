import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { onAuthStateChange, supabase } from '../DB/supabase';
import { reportError, safeAsyncCall } from '../utils/crashHandler';

interface User {
  id: string;
  name: string;
  email: string;
  telefono?: string;
  rol?: string;
  jurisdiccion?: string;
}

interface AuthContextProps {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isPasswordResetMode: boolean;
  setPasswordResetMode: (mode: boolean) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isPasswordResetMode, setPasswordResetMode] = useState(false);

  useEffect(() => {
    // Cargar usuario inicial si hay una sesión activa con manejo de errores
    const cargarUsuarioInicial = async () => {
      const result = await safeAsyncCall(
        async () => {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            const { data: userData, error } = await supabase
              .from('usuarios')
              .select('id, name, telefono, email, rol, jurisdiccion')
              .eq('id', sessionData.session.user.id)
              .single();

            if (userData && !error) {
              setUser(userData);
              return userData;
            }
          }
          return null;
        },
        'No se pudo cargar la sesión del usuario',
        (error) => {
          reportError(error, 'cargarUsuarioInicial');
          // No mostrar alert aquí, solo loguear el error
          console.warn('⚠️ Error cargando usuario inicial, continuando sin sesión');
        }
      );

      if (!result) {
        // Si falla la carga inicial, limpiar cualquier estado inconsistente
        setUser(null);
      }
    };

    cargarUsuarioInicial();

    // Escuchar cambios en el estado de autenticación con manejo de errores
    const { data: { subscription } } = onAuthStateChange((event: any, session: any) => {
      console.log('Auth event:', event, session);
      
      if (event === 'PASSWORD_RECOVERY') {
        // Usuario está en modo de recuperación de contraseña
        setPasswordResetMode(true);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setPasswordResetMode(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Cargar datos completos del usuario al iniciar sesión con manejo de errores
        const cargarDatosUsuario = async () => {
          await safeAsyncCall(
            async () => {
              const { data: userData, error } = await supabase
                .from('usuarios')
                .select('id, name, telefono, email, rol, jurisdiccion')
                .eq('id', session.user.id)
                .single();

              if (userData && !error) {
                setUser(userData);
                return userData;
              }
              throw new Error(error?.message || 'No se pudo cargar la información del usuario');
            },
            'Error al cargar información del usuario después del login',
            (error) => {
              reportError(error, 'cargarDatosUsuario');
              // En caso de error, establecer datos mínimos del usuario
              setUser({
                id: session.user.id,
                name: session.user.email || 'Usuario',
                email: session.user.email || '',
              });
            }
          );
        };
        cargarDatosUsuario();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await safeAsyncCall(
      async () => {
        await supabase.auth.signOut();
        setUser(null);
        setPasswordResetMode(false);
        return true;
      },
      'Error al cerrar sesión',
      (error) => {
        reportError(error, 'logout');
        // Aún así limpiar el estado local
        setUser(null);
        setPasswordResetMode(false);
      }
    );
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      logout, 
      isPasswordResetMode, 
      setPasswordResetMode 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};