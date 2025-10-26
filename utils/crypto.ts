import CryptoJS from 'crypto-js';

export const hashPassword = (password: string): string => {
  try {
    const hash = CryptoJS.SHA256(password).toString();
    return hash;
  } catch (error) {
    throw error;
  }
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const hash = await hashPassword(password);
  return hash === hashedPassword;
};