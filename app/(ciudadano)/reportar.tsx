import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { insertarReporte } from '../../DB/supabase';
import { useAuth } from '../../context/AuthContext';
import { encryptSensitiveData } from '../../utils/crypto';

function generarFolio() {
  return 'FOLIO-' + Date.now();
}

export default function ReportarScreen() {
  const { user } = useAuth(); 

  // Estados para persona desaparecida
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState<number | undefined>(undefined);
  const [sexo, setSexo] = useState('');
  const [descripcionFisica, setDescripcionFisica] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [ropa, setRopa] = useState('');
  
  // Estados para desaparición
  const [ubicacion, setUbicacion] = useState('');
  const [coordenadas, setCoordenadas] = useState<{ latitud: number; longitud: number } | null>(null);
  const [fecha, setFecha] = useState<Date | null>(null);
  const [hora, setHora] = useState<Date | null>(null);
  const [circunstancias, setCircunstancias] = useState('');
  
  // Estados para contacto
  const [nombreReportante, setNombreReportante] = useState('');
  const [relacion, setRelacion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  
  // Estados opcionales
  const [denuncia, setDenuncia] = useState('');
  const [autoridad, setAutoridad] = useState('');
  
  const [folio, setFolio] = useState<string | null>(null);

  const [showFecha, setShowFecha] = useState(false);
  const [showHora, setShowHora] = useState(false);

  const edades = Array.from({ length: 151 }, (_, i) => i);

  const handleFoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Se necesita acceso a la galería para seleccionar una foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Buscar ubicación por dirección (Geocodificación)
  const buscarUbicacionPorDireccion = async () => {
    if (!ubicacion.trim()) {
      Alert.alert('Error', 'Primero escribe una dirección para buscar');
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos', 
          'Se necesita acceso a la ubicación para buscar direcciones. Por favor, concede los permisos en la configuración de tu dispositivo.',
          [{ text: 'Entendido' }]
        );
        return;
      }

      // Geocodificar la dirección ingresada
      const results = await Location.geocodeAsync(ubicacion.trim());
      
      if (results && results.length > 0) {
        const location = results[0];
        setCoordenadas({
          latitud: location.latitude,
          longitud: location.longitude
        });
        Alert.alert('✅ Ubicación encontrada', 'La ubicación se ha guardado correctamente.');
      } else {
        Alert.alert(
          '❌ Ubicación no encontrada', 
          'No se pudo encontrar la ubicación. Intenta ser más específico con la dirección (incluye calle, colonia, ciudad).'
        );
      }
    } catch (error) {
      console.error('Error al buscar ubicación:', error);
      Alert.alert(
        'Error de búsqueda', 
        'No se pudo buscar la ubicación. Verifica tu conexión a internet e intenta nuevamente.',
        [{ text: 'Entendido' }]
      );
    }
  };



  // Validar formulario 
  const validarFormulario = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return false;
    }
    if (!foto) {
      Alert.alert('Error', 'La fotografía es obligatoria');
      return false;
    }
    if (!ubicacion.trim()) {
      Alert.alert('Error', 'La ubicación es obligatoria');
      return false;
    }
    if (!telefono.trim()) {
      Alert.alert('Error', 'El teléfono de contacto es obligatorio');
      return false;
    }
    if (!correo.trim()) {
      Alert.alert('Error', 'El correo electrónico es obligatorio');
      return false;
    }
    return true;
  };

  // Guardar reporte en Supabase
  const handleSubmit = async () => {
    if (!validarFormulario()) {
      return;
    }

    if (!user || !user.id) {
      Alert.alert('Error', 'No se pudo identificar al usuario. Por favor, inicia sesión nuevamente.');
      return;
    }

    try {
      const nuevoFolio = generarFolio();
      setFolio(nuevoFolio);

      const fechaISO = fecha ? fecha.toISOString().split('T')[0] : null;
      const horaStr = hora ? `${hora.getHours().toString().padStart(2, '0')}:${hora.getMinutes().toString().padStart(2, '0')}` : null;

      // Cifrar datos sensibles de contacto
      const reporteData = {
        folio: nuevoFolio,
        usuario_id: user.id,
        nombre_desaparecido: nombre.trim(),
        edad: edad || null,
        sexo: sexo || null,
        descripcion: descripcionFisica.trim() || null,
        foto_url: foto,
        ropa: ropa.trim() || null,
        ultima_ubicacion: ubicacion.trim(),
        latitud: coordenadas?.latitud || null,
        longitud: coordenadas?.longitud || null,
        ultima_fecha_visto: fechaISO,
        ultima_hora_visto: horaStr,
        circunstancias: circunstancias.trim() || null,
        // Datos sensibles cifrados
        nombre_reportante: encryptSensitiveData(nombreReportante.trim()),
        relacion_reportante: encryptSensitiveData(relacion.trim()),
        telefono_reportante: encryptSensitiveData(telefono.trim()),
        correo_reportante: encryptSensitiveData(correo.trim()),
        denuncia_oficial: denuncia.trim() || null,
        autoridad_notificada: autoridad.trim() || null,
        comentarios: null, // Reservado para notas de autoridades
        estatus: 'desaparecido',
        created_at: new Date().toISOString(),
      };

      const res = await insertarReporte(reporteData);

      if (res.success) {
        Alert.alert(
          'Reporte enviado',
          `Tu folio es: ${nuevoFolio}\n\nGuarda este folio para dar seguimiento a tu reporte.`,
          [
            {
              text: 'Copiar folio',
              onPress: () => {
                Clipboard.setStringAsync(nuevoFolio);
                Alert.alert('Copiado', 'El folio ha sido copiado al portapapeles.');
              },
            },
            {
              text: 'OK',
            },
          ]
        );
        limpiarFormulario();
      } else {
        Alert.alert('Error', res.error || 'No se pudo guardar el reporte');
        setFolio(null);
      }
    } catch (error) {
      console.error('Error al enviar reporte:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado al enviar el reporte');
      setFolio(null);
    }
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setNombre('');
    setEdad(undefined);
    setSexo('');
    setDescripcionFisica('');
    setFoto(null);
    setRopa('');
    setUbicacion('');
    setCoordenadas(null);
    setFecha(null);
    setHora(null);
    setCircunstancias('');
    setNombreReportante('');
    setRelacion('');
    setTelefono('');
    setCorreo('');
    setDenuncia('');
    setAutoridad('');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reportar Persona Desaparecida</Text>

      {/* Información de la persona */}
      <Text style={styles.section}>1. Información de la persona</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre completo *"
        value={nombre}
        onChangeText={setNombre}
      />
      
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Edad:</Text>
        <Picker
          selectedValue={edad}
          style={styles.picker}
          onValueChange={(itemValue) => setEdad(itemValue)}
        >
          <Picker.Item label="Selecciona edad *" value={undefined} />
          {edades.map((e) => (
            <Picker.Item key={e} label={e.toString()} value={e} />
          ))}
        </Picker>
      </View>
      
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Sexo:</Text>
        <Picker
          selectedValue={sexo}
          style={styles.picker}
          onValueChange={(itemValue) => setSexo(itemValue)}
        >
          <Picker.Item label="Selecciona sexo *" value="" />
          <Picker.Item label="Masculino" value="masculino" />
          <Picker.Item label="Femenino" value="femenino" />
          <Picker.Item label="Otro" value="otro" />
        </Picker>
      </View>
      
      <TextInput 
        style={[styles.input, styles.multilineInput]} 
        placeholder="Descripción física (altura, complexión, señas particulares, etc.) *" 
        value={descripcionFisica} 
        onChangeText={setDescripcionFisica} 
        multiline 
        numberOfLines={3}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Ropa vista por última vez *"
        value={ropa}
        onChangeText={setRopa}
      />

      <TouchableOpacity style={styles.fotoBtn} onPress={handleFoto}>
        <Text style={styles.fotoBtnText}>
          {foto ? 'Foto cargada ✔️' : 'Subir fotografía reciente *'}
        </Text>
      </TouchableOpacity>
      
      {foto && (
        <Image 
          source={{ uri: foto }} 
          style={styles.fotoPreview} 
        />
      )}

      {/* Información de la desaparición */}
      <Text style={styles.section}>2. Información de la desaparición</Text>
      
      <Text style={styles.fieldLabel}>Última ubicación donde fue vista la persona:</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Ej: Parque Central, Centro de Guadalajara, Jalisco - Cerca de la fuente principal *"
        value={ubicacion}
        onChangeText={setUbicacion}
        multiline
        numberOfLines={3}
      />
      <Text style={styles.fieldHelper}>
        💡 Describe el lugar lo más específico posible (calle, colonia, referencias)
      </Text>
      
      <TouchableOpacity style={styles.ubicacionBtn} onPress={buscarUbicacionPorDireccion}>
        <Text style={styles.ubicacionBtnText}>
          {coordenadas ? '📍 Buscar ubicación ' : '🔍 Buscar ubicación en mapa'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setShowFecha(true)} style={styles.dateButton}>
        <Text style={{ color: fecha ? '#000' : '#888' }}>
          {fecha ? fecha.toLocaleDateString('es-MX') : 'Selecciona fecha de desaparición *'}
        </Text>
      </TouchableOpacity>
      
      {showFecha && (
        <DateTimePicker
          value={fecha || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selectedDate) => {
            setShowFecha(false);
            if (selectedDate) setFecha(selectedDate);
          }}
          maximumDate={new Date()}
        />
      )}
      
      <TouchableOpacity onPress={() => setShowHora(true)} style={styles.dateButton}>
        <Text style={{ color: hora ? '#000' : '#888' }}>
          {hora ? `${hora.getHours().toString().padStart(2, '0')}:${hora.getMinutes().toString().padStart(2, '0')}` : 'Selecciona hora de desaparición *'}
        </Text>
      </TouchableOpacity>
      
      {showHora && (
        <DateTimePicker
          value={hora || new Date()}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selectedTime) => {
            setShowHora(false);
            if (selectedTime) setHora(selectedTime);
          }}
        />
      )}
      
      <TextInput 
        style={[styles.input, styles.multilineInput]} 
        placeholder="Circunstancias conocidas de la desaparición" 
        value={circunstancias} 
        onChangeText={setCircunstancias} 
        multiline 
        numberOfLines={3}
      />

      {/* Información de contacto */}
      <Text style={styles.section}>3. Información de contacto</Text>
      
      <View style={styles.securityNotice}>
        <Text style={styles.securityNoticeTitle}>🔒 Información Protegida</Text>
        <Text style={styles.securityNoticeText}>
          Tus datos de contacto serán cifrados y solo visibles para autoridades y para ti. 
          Otros usuarios verán información de contacto de la CNB para comunicarse oficialmente.
        </Text>
      </View>
      
      <TextInput 
        style={styles.input} 
        placeholder="Nombre del reportante *" 
        value={nombreReportante} 
        onChangeText={setNombreReportante} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Relación con la persona *" 
        value={relacion} 
        onChangeText={setRelacion} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Correo electrónico *" 
        value={correo} 
        onChangeText={setCorreo} 
        keyboardType="email-address" 
        autoCapitalize="none"
      />
      <TextInput 
        style={styles.input} 
        placeholder="Teléfono de contacto *" 
        value={telefono} 
        onChangeText={setTelefono} 
        keyboardType="phone-pad" 
      />
      

      {/* Opcionales */}
      <Text style={styles.section}>4. Información adicional (opcional)</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Número de denuncia oficial" 
        value={denuncia} 
        onChangeText={setDenuncia} 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Autoridad notificada" 
        value={autoridad} 
        onChangeText={setAutoridad} 
      />


      {/* Botón de enviar */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Enviar Reporte</Text>
      </TouchableOpacity>

      {/* Folio generado */}
      {folio && (
        <View style={styles.folioBox}>
          <Text style={styles.folioText}>Folio generado: {folio}</Text>
          <Text style={styles.folioSubtext}>Guarda este número para seguimiento</Text>
        </View>
      )}

      <Text style={styles.privacidad}>
        Al enviar este reporte aceptas nuestra política de privacidad. 
        Tus datos de contacto serán cifrados por seguridad y solo visibles para autoridades competentes.
        Otros usuarios verán información de la Comisión Nacional de Búsqueda (CNB) para contacto oficial.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 40, 
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 10,
    textAlign: 'center',
    color: '#1a73e8',
  },
  section: {
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 10,
    color: '#2a2a2a',
    fontSize: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
  },
  picker: {
    width: '100%',
    height: 50,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  fotoBtn: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  fotoBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fotoPreview: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 12,
    borderRadius: 8,
  },
  dateButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  folioBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  folioText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 16,
  },
  folioSubtext: {
    color: '#1976d2',
    fontSize: 12,
    marginTop: 5,
  },
  ubicacionBtn: {
    backgroundColor: '#9c27b0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  ubicacionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 5,
  },
  fieldHelper: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  securityNotice: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  securityNoticeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 5,
  },
  securityNoticeText: {
    fontSize: 12,
    color: '#1565c0',
    lineHeight: 18,
  },
  privacidad: {
    marginTop: 20,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});