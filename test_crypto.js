// Test simple para verificar el cifrado
const { encryptSensitiveData, decryptSensitiveData } = require('./utils/crypto');

async function testCrypto() {
  console.log('🧪 Probando sistema de cifrado...');
  
  const datosSensibles = "Juan Pérez - 555-1234 - juan@email.com";
  console.log('📝 Datos originales:', datosSensibles);
  
  try {
    // Cifrar
    const datosCifrados = encryptSensitiveData(datosSensibles);
    console.log('🔒 Datos cifrados:', datosCifrados);
    
    // Descifrar
    const datosDescifrados = decryptSensitiveData(datosCifrados);
    console.log('🔓 Datos descifrados:', datosDescifrados);
    
    // Verificar que coinciden
    if (datosSensibles === datosDescifrados) {
      console.log('✅ ¡Cifrado funcionando correctamente!');
    } else {
      console.log('❌ Error: Los datos no coinciden');
    }
  } catch (error) {
    console.error('❌ Error en el test:', error);
  }
}

testCrypto();