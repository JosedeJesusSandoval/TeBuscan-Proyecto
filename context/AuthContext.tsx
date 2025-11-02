import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { onAuthStateChange, supabase } from '../DB/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  telefono?: string;
  rol?: string; 
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
    // Cargar usuario inicial si hay una sesión activa
    const cargarUsuarioInicial = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          const { data: userData, error } = await supabase
            .from('usuarios')
            .select('id, name, telefono, email, rol')
            .eq('id', sessionData.session.user.id)
            .single();

          if (userData && !error) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Error al cargar usuario inicial:', error);
      }
    };

    cargarUsuarioInicial();

    // Escuchar cambios en el estado de autenticación de Supabase
    const { data: { subscription } } = onAuthStateChange((event: any, session: any) => {
      console.log('Auth event:', event, session);
      
      if (event === 'PASSWORD_RECOVERY') {
        // Usuario está en modo de recuperación de contraseña
        setPasswordResetMode(true);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setPasswordResetMode(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Cargar datos completos del usuario al iniciar sesión
        const cargarDatosUsuario = async () => {
          const { data: userData, error } = await supabase
            .from('usuarios')
            .select('id, name, telefono, email, rol')
            .eq('id', session.user.id)
            .single();

          if (userData && !error) {
            setUser(userData);
          }
        };
        cargarDatosUsuario();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setPasswordResetMode(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
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