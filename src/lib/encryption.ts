
// src/lib/encryption.ts
'use server';

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

// Ensure environment variables are defined
const ENCRYPTION_KEY_HEX = process.env.AUDIT_ENCRYPTION_KEY;
const IV_HEX = process.env.AUDIT_ENCRYPTION_IV;

let encryptionKey: Buffer | null = null;
let iv: Buffer | null = null;
let keysValid = false;

if (ENCRYPTION_KEY_HEX && IV_HEX) {
  if (ENCRYPTION_KEY_HEX.length === 64 && IV_HEX.length === 32) {
    try {
      encryptionKey = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
      iv = Buffer.from(IV_HEX, 'hex');
      if (encryptionKey.length === 32 && iv.length === 16) {
        keysValid = true;
      } else {
        console.error('Encryption key or IV has incorrect length after hex decoding.');
      }
    } catch (e) {
      console.error('Failed to decode encryption key or IV from hex:', e);
    }
  } else {
    console.error('AUDIT_ENCRYPTION_KEY must be 64 hex characters (32 bytes) and AUDIT_ENCRYPTION_IV must be 32 hex characters (16 bytes).');
  }
} else {
  console.warn('AUDIT_ENCRYPTION_KEY or AUDIT_ENCRYPTION_IV is not set. Audit log details will not be encrypted/decrypted.');
}


export function encrypt(text: string): string | null {
  if (!keysValid || !encryptionKey || !iv) {
    console.warn('Encryption keys not valid or not initialized. Returning plain text for audit details.');
    return text; // Or handle as an error, for now, returning plain to avoid breaking logging
  }
  try {
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    return null; // Or return text to indicate failure, depends on policy
  }
}

export function decrypt(encryptedText: string): string | null {
  if (!keysValid || !encryptionKey || !iv) {
     console.warn('Encryption keys not valid or not initialized. Cannot decrypt audit details.');
    return encryptedText; // Return original if keys aren't set up
  }
  if (!encryptedText || typeof encryptedText !== 'string') {
    return null; // Nothing to decrypt or invalid input
  }

  try {
    // Check if the text is likely hex (basic check)
    if (!/^[0-9a-fA-F]+$/.test(encryptedText)) {
        // console.warn("Attempted to decrypt non-hex string, returning as is:", encryptedText);
        return encryptedText; // If it's not hex, it's likely not encrypted by this system
    }
    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed for text:', encryptedText, error);
    return null; // Indicates decryption failure
  }
}
