export interface Usuario {
  id: number;
  name: string;
  email: string;
  rol: 'ciudadano' | 'autoridad' | 'admin';
  activo: boolean;
  verificado: boolean;
  jurisdiccion?: string;
}

export interface LoginResponse {
  success: boolean;
  usuario?: Usuario;
  error?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  rol?: 'ciudadano' | 'autoridad' | 'admin';
  telefono?: string;
  institucion?: string;
  jurisdiccion?: string;
}
