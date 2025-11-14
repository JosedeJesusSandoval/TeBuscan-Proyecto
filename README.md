# 🔍 TeBuscan

> **Sistema integral de gestión de personas desaparecidas con tecnología móvil y geolocalización inteligente**

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.21-black.svg)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.53.0-green.svg)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](LICENSE)

## 📱 Descripción

**TeBuscan** es una aplicación móvil desarrollada para facilitar la búsqueda y localización de personas desaparecidas. La aplicación conecta ciudadanos, autoridades competentes y administradores del sistema en una plataforma integrada que utiliza geolocalización, mapas interactivos y algoritmos de clasificación inteligente para optimizar los esfuerzos de búsqueda.

## ✨ Características Principales

### 👥 **Para Ciudadanos**
- **Reportes de desaparición**: Interfaz intuitiva para registrar casos
- **Geolocalización automática**: Detección de ubicación con precisión
- **Galería fotográfica**: Subida de imágenes para identificación
- **Mapa interactivo**: Visualización de casos cercanos en tiempo real
- **Seguimiento de reportes**: Monitor del estado de casos propios
- **Filtros avanzados**: Búsqueda por estado, ubicación y fecha

### 🏛️ **Para Autoridades**
- **Panel de control institucional**: Dashboard completo de gestión
- **Gestión de casos por jurisdicción**: Filtrado automático por área
- **Algoritmos de priorización**: Clasificación inteligente por urgencia
- **Estadísticas avanzadas**: Análisis temporal y geográfico
- **Actualización de estados**: Control del progreso de investigaciones
- **Exportación de datos**: Reportes oficiales para documentación

### ⚙️ **Para Administradores**
- **Gestión completa de usuarios**: Control de ciudadanos y autoridades
- **Dashboard administrativo**: Métricas generales del sistema
- **Verificación de autoridades**: Proceso de validación institucional
- **Monitoreo del sistema**: Supervisión de actividad y rendimiento

## 🛠️ Tecnologías

### **Frontend & Mobile**
- **React Native 19.1.0** - Framework de desarrollo móvil multiplataforma
- **Expo 54.0.21** - Plataforma de desarrollo y despliegue
- **Expo Router 6.0.14** - Sistema de navegación basado en archivos
- **TypeScript 5.9.2** - Tipado estático para JavaScript

### **Backend & Database**
- **Supabase** - Base de datos PostgreSQL en la nube
- **Supabase Auth** - Sistema de autenticación (simplificado)
- **Vault Integration** - Cifrado de datos sensibles

### **Mapas & Geolocalización**
- **React Native Maps 1.20.1** - Mapas nativos para iOS/Android
- **Expo Location 19.0.7** - API de geolocalización
- **Google Places Autocomplete** - Búsqueda inteligente de direcciones

### **Funcionalidades Adicionales**
- **Expo Image Picker** - Selección y subida de imágenes
- **Expo Crypto** - Cifrado de datos sensibles
- **React Native Gesture Handler** - Gestos nativos optimizados

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js 16+ 
- npm o yarn
- Expo CLI
- Android Studio (para Android) / Xcode (para iOS)

### **1. Clonar el repositorio**
```bash
git clone https://github.com/JosedeJesusSandoval/TeBuscan-Proyecto.git
cd TeBuscan-Proyecto
```

### **2. Instalar dependencias**
```bash
npm install
```

### **3. Configurar variables de entorno**
Crear archivo `.env` en la raíz del proyecto:
```env
EXPO_PUBLIC_SUPABASE_URL=tu_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### **4. Configurar base de datos**
Ejecutar los scripts SQL en `/DB/` para configurar las tablas necesarias en Supabase.

### **5. Ejecutar la aplicación**
```bash
# Desarrollo
npm start

# Android
npm run android

# iOS  
npm run ios

# Web
npm run web
```

## 📊 Estructura del Proyecto

```
TeBuscan-Proyecto/
├── app/                          # Pantallas principales (Expo Router)
│   ├── (admin)/                 # Módulo de administrador
│   ├── (autoridad)/             # Módulo de autoridades  
│   ├── (ciudadano)/             # Módulo de ciudadanos
│   └── (auth)/                  # Pantallas de autenticación
├── components/                   # Componentes reutilizables
│   ├── auth/                    # Componentes de autenticación
│   ├── common/                  # Componentes generales
│   └── navigation/              # Componentes de navegación
├── context/                     # Contextos de React
├── DB/                          # Configuración de base de datos
├── utils/                       # Utilidades y helpers
├── types/                       # Tipos de TypeScript
└── assets/                      # Recursos estáticos
```

## 🔐 Seguridad y Privacidad

- **Cifrado de datos sensibles**: Información personal protegida con Expo Crypto
- **Autenticación robusta**: Sistema de verificación por roles
- **Control de acceso**: Diferentes niveles de permisos por usuario
- **Protección de ubicación**: Geolocalización controlada y opcional
- **Cumplimiento GDPR**: Respeto a la privacidad de datos personales

## 🔄 Algoritmos Inteligentes

### **Clasificación de Urgencia**
Sistema de scoring automático basado en:
- **Factor edad**: Prioridad para menores y adultos mayores  
- **Tiempo transcurrido**: Escalamiento temporal automático
- **Ubicación**: Análisis de zonas de riesgo
- **Circunstancias**: Evaluación de contexto del caso

### **Geolocalización Inteligente**
- **Filtrado por proximidad**: Casos relevantes por ubicación
- **Detección automática de ciudad**: Sin intervención manual
- **Mapas de calor**: Visualización de zonas con mayor actividad

## 📈 Estadísticas y Métricas

- **Análisis temporal**: Tendencias de casos por períodos
- **Distribución geográfica**: Mapeo de incidencias por región  
- **Tasa de resolución**: Seguimiento de casos resueltos exitosamente
- **Demografía**: Análisis por grupos etarios y género
- **Rendimiento institucional**: Métricas por jurisdicción

## 🌟 Funcionalidades Destacadas

### **🔍 Búsqueda Avanzada**
- Filtros múltiples simultáneos
- Búsqueda por proximidad automática
- Ordenamiento por relevancia y urgencia

### **📱 Interfaz Intuitiva**
- Diseño responsivo multiplataforma
- Navegación optimizada por roles
- Accesibilidad para diferentes usuarios

### **🗺️ Mapas Interactivos**
- Visualización en tiempo real
- Marcadores categorizado por estado
- Navegación integrada a ubicaciones

### **📊 Dashboard Profesional**
- Métricas en tiempo real
- Gráficos y estadísticas avanzadas
- Exportación de reportes institucionales

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. Fork del proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit de cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### **Guías de Contribución**
- Seguir las convenciones de código establecidas
- Documentar nuevas funcionalidades
- Incluir tests para nuevas features
- Respetar la arquitectura existente

## 📄 Licencia

Este proyecto está licenciado bajo la **GNU General Public License v3.0**. Ver el archivo [LICENSE](LICENSE) para más detalles.

### **Derechos y Obligaciones**
- ✅ **Uso comercial** permitido
- ✅ **Distribución** permitida  
- ✅ **Modificación** permitida
- ✅ **Uso privado** permitido
- ❗ **Debe mantener** la misma licencia
- ❗ **Debe incluir** código fuente
- ❗ **Debe incluir** aviso de licencia

## 👤 Autor

**José de Jesús Sandoval**
- GitHub: [@JosedeJesusSandoval](https://github.com/JosedeJesusSandoval)

## 🆘 Soporte

Para soporte técnico:
- 📧 Email: [Contacto por GitHub Issues]
- 📋 Issues: [GitHub Issues](https://github.com/JosedeJesusSandoval/TeBuscan-Proyecto/issues)
- 📖 Wiki: [GitHub Wiki](https://github.com/JosedeJesusSandoval/TeBuscan-Proyecto/wiki)

## 🙏 Agradecimientos

- **Comunidad React Native** por las herramientas robustas
- **Equipo de Expo** por simplificar el desarrollo móvil
- **Supabase** por la infraestructura backend confiable
- **Contribuyentes** que hacen posible mejorar el proyecto

---

<div align="center">

**⭐ ¡Star el proyecto si te parece útil! ⭐**

*Desarrollado con ❤️ para ayudar en la búsqueda de personas desaparecidas*

</div>