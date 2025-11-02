import * as Crypto from 'expo-crypto';

// Clave secreta para cifrado (en producción debería estar en variables de entorno)
const SECRET_KEY = 'TeBuscan_2024_Secret_Key_CNB_Protection';

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
    return hash;
  } catch (error) {
    throw error;
  }
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const hash = await hashPassword(password);
  return hash === hashedPassword;
};

// Simple XOR cipher para cifrar datos sensibles (para React Native)
const simpleEncrypt = (text: string, key: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 encode
};

const simpleDecrypt = (encryptedText: string, key: string): string => {
  try {
    const text = atob(encryptedText); // Base64 decode
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch (error) {
    return encryptedText; // Return original if decryption fails
  }
};

// Cifrar datos sensibles
export const encryptSensitiveData = (data: string): string => {
  try {
    if (!data || data.trim() === '') return '';
    const encrypted = simpleEncrypt(data, SECRET_KEY);
    return encrypted;
  } catch (error) {
    console.error('Error cifrando datos:', error);
    return data; // En caso de error, devolver datos sin cifrar para no perder información
  }
};

// Descifrar datos sensibles
export const decryptSensitiveData = (encryptedData: string): string => {
  try {
    if (!encryptedData || encryptedData.trim() === '') return '';
    const decrypted = simpleDecrypt(encryptedData, SECRET_KEY);
    return decrypted;
  } catch (error) {
    console.error('Error descifrando datos:', error);
    return encryptedData; // En caso de error, devolver datos como están
  }
};

// Información de contacto institucional para mostrar al público
export const getInstitutionalContactInfo = () => {
  return {
    nombre_reportante: 'Comisión Nacional de Búsqueda (CNB)',
    telefono_reportante: '800 028 7723',
    correo_reportante: 'contacto@cnb.gob.mx',
    relacion_reportante: 'Organismo Federal',
    whatsapp: '55 1309 9024',
    descripcion: 'Para más información sobre este caso, contacta directamente a la CNB'
  };
};