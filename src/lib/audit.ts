
// src/lib/audit.ts
'use server';

import { prisma } from './db';
import { encrypt } from './encryption'; // Import the encrypt function
import type { AuditLogEntry } from '@/types';

interface LogDetails {
  [key: string]: any;
}

/**
 * Logs an audit event to the database. Details are encrypted.
 * @param action A string describing the action (e.g., "CREATE_PRODUCT", "USER_LOGIN").
 * @param options Optional parameters.
 * @param options.userId The ID of the user performing the action.
 * @param options.details Additional details about the event (e.g., product ID, sale ID). These will be encrypted.
 * @param options.ipAddress The IP address of the user.
 */
export async function logAuditEvent(
  action: string,
  options: {
    userId?: string;
    details?: LogDetails;
    ipAddress?: string;
  } = {}
): Promise<void> {
  let encryptedDetails: string | null = null;
  if (options.details) {
    try {
      const detailsString = JSON.stringify(options.details);
      encryptedDetails = encrypt(detailsString);
      if (encryptedDetails === null) { // Encryption failed
        console.error(`Encryption failed for audit action "${action}". Logging details as plain text (or error state).`);
        // Fallback: Log plain text or an error message. For this example, log plain text.
        // In a high-security environment, you might want to prevent logging or log an error marker.
        encryptedDetails = `ENCRYPTION_FAILED: ${detailsString}`;
      }
    } catch (e) {
      console.error(`Failed to stringify details for audit action "${action}":`, e);
      encryptedDetails = "ERROR_STRINGIFYING_DETAILS";
    }
  }

  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: options.userId,
        details: encryptedDetails, // Store encrypted string or error string
        ipAddress: options.ipAddress,
      },
    });
  } catch (error) {
    console.error(`Failed to log audit event "${action}":`, error);
    // Depending on the criticality, you might want to re-throw or handle differently
  }
}
