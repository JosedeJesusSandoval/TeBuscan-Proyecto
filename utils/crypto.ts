import * as Crypto from 'expo-crypto';

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

const simpleEncrypt = (text: string, key: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
};

const simpleDecrypt = (encryptedText: string, key: string): string => {
  try {
    const text = atob(encryptedText);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch (error) {
    return encryptedText;
  }
};

export const encryptSensitiveData = (data: string): string => {
  try {
    if (!data || data.trim() === '') return '';
    const encrypted = simpleEncrypt(data, SECRET_KEY);
    return encrypted;
  } catch (error) {
    return data;
  }
};

export const decryptSensitiveData = (encryptedData: string): string => {
  try {
    if (!encryptedData || encryptedData.trim() === '') return '';
    const decrypted = simpleDecrypt(encryptedData, SECRET_KEY);
    return decrypted;
  } catch (error) {
    return encryptedData;
  }
};

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