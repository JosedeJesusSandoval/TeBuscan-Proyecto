# 🏛️ Implementación de Filtrado por Ubicación de Autoridad

## 📊 **Análisis del Sistema Actual**

### **✅ Lo que ya existe**:
- Campo `institucion` en tabla `usuarios`
- Sistema de roles (autoridad, ciudadano, admin)
- Función `obtenerReportes()` que obtiene todos los casos

### **🎯 Lo que necesitamos agregar**:
- Campo `jurisdiccion` o `ubicacion_autoridad` en tabla `usuarios`
- Campo `municipio` o `ciudad` en tabla `reportes` 
- Función `obtenerReportesPorJurisdiccion()`
- Lógica de filtrado en frontend

---

## 🗄️ **CAMBIOS EN BASE DE DATOS REQUERIDOS**

### **1. Tabla `usuarios` - Agregar campo jurisdicción**

```sql
-- Script para ejecutar en Supabase SQL Editor
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS jurisdiccion VARCHAR(100);

-- Ejemplos de jurisdicciones
UPDATE public.usuarios 
SET jurisdiccion = 'Guadalajara' 
WHERE institucion LIKE '%Guadalajara%' AND rol = 'autoridad';

UPDATE public.usuarios 
SET jurisdiccion = 'Tlajomulco de Zuñiga' 
WHERE institucion LIKE '%Tlajomulco%' AND rol = 'autoridad';

UPDATE public.usuarios 
SET jurisdiccion = 'Zapopan' 
WHERE institucion LIKE '%Zapopan%' AND rol = 'autoridad';

-- Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_jurisdiccion 
ON public.usuarios(jurisdiccion);
```

### **2. Tabla `reportes` - Agregar campo municipio**

```sql
-- Agregar campo para el municipio del reporte
ALTER TABLE public.reportes 
ADD COLUMN IF NOT EXISTS municipio VARCHAR(100);

-- Extraer municipio de ultima_ubicacion existente (ejemplo)
UPDATE public.reportes 
SET municipio = CASE 
  WHEN ultima_ubicacion ILIKE '%guadalajara%' THEN 'Guadalajara'
  WHEN ultima_ubicacion ILIKE '%tlajomulco%' THEN 'Tlajomulco de Zuñiga'
  WHEN ultima_ubicacion ILIKE '%zapopan%' THEN 'Zapopan'
  WHEN ultima_ubicacion ILIKE '%tonala%' THEN 'Tonalá'
  WHEN ultima_ubicacion ILIKE '%tlaquepaque%' THEN 'San Pedro Tlaquepaque'
  ELSE 'Guadalajara' -- Default
END;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_reportes_municipio 
ON public.reportes(municipio);
```

### **3. Constraint para validar jurisdicciones**

```sql
-- Validar jurisdicciones permitidas
ALTER TABLE public.usuarios 
ADD CONSTRAINT check_jurisdiccion_valida 
CHECK (jurisdiccion IS NULL OR jurisdiccion IN (
  'Guadalajara',
  'Zapopan', 
  'Tlajomulco de Zuñiga',
  'Tonalá',
  'San Pedro Tlaquepaque',
  'El Salto',
  'Juanacatlán'
));

-- Validar municipios permitidos
ALTER TABLE public.reportes
ADD CONSTRAINT check_municipio_valido
CHECK (municipio IS NULL OR municipio IN (
  'Guadalajara',
  'Zapopan',
  'Tlajomulco de Zuñiga', 
  'Tonalá',
  'San Pedro Tlaquepaque',
  'El Salto',
  'Juanacatlán'
));
```

---

## ⚙️ **FUNCIONES DE BASE DE DATOS NUEVAS**

### **1. Función para obtener reportes por jurisdicción**

```javascript
// En DB/supabase.js - NUEVA FUNCIÓN
export const obtenerReportesPorJurisdiccion = async (jurisdiccionAutoridad) => {
  try {
    const { data, error } = await supabase
      .from('reportes')
      .select(`
        id,
        nombre_desaparecido,
        edad,
        descripcion,
        ultima_ubicacion,
        municipio,
        ultima_fecha_visto,
        estatus,
        created_at,
        usuario_id,
        usuarios(name)
      `)
      .eq('municipio', jurisdiccionAutoridad)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### **2. Función para obtener información de la autoridad**

```javascript
// En DB/supabase.js - NUEVA FUNCIÓN
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
```

---

## 📱 **CAMBIOS EN FRONTEND**

### **1. Modificar casos.tsx**

```tsx
// Cambios principales en casos.tsx
const cargarReportes = async () => {
  try {
    setLoading(true);
    
    // ✅ NUEVO: Obtener información de la autoridad
    const infoAutoridad = await obtenerInfoAutoridad(user.id);
    if (!infoAutoridad.success) {
      Alert.alert('Error', 'No se pudo obtener información de autoridad');
      return;
    }

    const { jurisdiccion } = infoAutoridad.data;
    
    // ✅ NUEVO: Obtener reportes por jurisdicción
    const resultado = jurisdiccion 
      ? await obtenerReportesPorJurisdiccion(jurisdiccion)
      : await obtenerReportes(); // Fallback para admins

    if (!resultado.success || !resultado.data) {
      Alert.alert('Error', resultado.error || 'No se pudieron cargar los reportes');
      return;
    }

    // ... resto de la lógica existente
  } catch (error) {
    console.error('Error cargando reportes:', error);
    Alert.alert('Error', 'Problema al cargar los reportes');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
```

### **2. Modificar panel.tsx**

```tsx
// En panel.tsx - Mostrar información de jurisdicción
const [autoridad, setAutoridad] = useState(null);

useEffect(() => {
  cargarInfoAutoridad();
  cargarEstadisticas();
}, []);

const cargarInfoAutoridad = async () => {
  try {
    const info = await obtenerInfoAutoridad(user.id);
    if (info.success) {
      setAutoridad(info.data);
    }
  } catch (error) {
    console.error('Error cargando info autoridad:', error);
  }
};

// ✅ NUEVO: Mostrar jurisdicción en el header
<View style={styles.header}>
  <View>
    <Text style={styles.title}>Panel de Autoridad</Text>
    {autoridad?.jurisdiccion && (
      <Text style={styles.jurisdiction}>📍 {autoridad.jurisdiccion}</Text>
    )}
  </View>
  <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
    <Text style={styles.logoutText}>Salir</Text>
  </TouchableOpacity>
</View>
```

---

## 🎯 **EJEMPLOS DE USO**

### **Escenario 1: Policía de Guadalajara**
```
Usuario: oficial.gdl@policia.mx
Institución: "Policía Municipal de Guadalajara"  
Jurisdicción: "Guadalajara"

Ve solo reportes donde:
- municipio = "Guadalajara"
```

### **Escenario 2: Policía de Tlajomulco**
```
Usuario: oficial.tla@policia.mx
Institución: "Comisaría Tlajomulco de Zuñiga"
Jurisdicción: "Tlajomulco de Zuñiga"

Ve solo reportes donde:
- municipio = "Tlajomulco de Zuñiga"
```

### **Escenario 3: Administrador**
```
Usuario: admin@tebuscan.mx
Rol: "admin"
Jurisdicción: null

Ve TODOS los reportes (sin filtro)
```

---

## 🔧 **IMPLEMENTACIÓN PASO A PASO**

### **Paso 1: Ejecutar Scripts SQL**
1. Abrir Supabase Dashboard
2. Ir a SQL Editor
3. Ejecutar scripts para agregar campos
4. Actualizar datos existentes con jurisdicciones

### **Paso 2: Actualizar supabase.js**
1. Agregar `obtenerReportesPorJurisdiccion()`
2. Agregar `obtenerInfoAutoridad()`
3. Modificar función de insertar usuario si es necesario

### **Paso 3: Modificar Frontend**
1. Actualizar `casos.tsx` con filtrado
2. Actualizar `panel.tsx` con info de jurisdicción
3. Actualizar `estadisticas.tsx` si es necesario

### **Paso 4: Testing**
1. Crear usuarios autoridad con diferentes jurisdicciones
2. Crear reportes en diferentes municipios
3. Verificar que cada autoridad ve solo sus casos

---

## ✅ **BENEFICIOS DE LA IMPLEMENTACIÓN**

### **1. Eficiencia Operativa** 📈
- Autoridades ven solo casos relevantes
- Reduce sobrecarga de información
- Mejora tiempo de respuesta

### **2. Organización Territorial** 🗺️
- Casos organizados por municipio
- Responsabilidades claras por zona
- Coordinación mejorada entre autoridades

### **3. Escalabilidad** 🚀
- Fácil agregar nuevos municipios
- Sistema preparado para crecimiento
- Administración centralizada

---

**¿Quieres que proceda con la implementación de estos cambios?**

Los cambios principales serían:
1. **Scripts SQL** para agregar campos
2. **Nuevas funciones** en supabase.js  
3. **Modificaciones** en casos.tsx y panel.tsx
4. **Testing** del sistema filtrado