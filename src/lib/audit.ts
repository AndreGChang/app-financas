
// src/lib/audit.ts
'use server';

import { prisma } from './db';
import { encrypt } from './encryption'; // Import the encrypt function
import type { AuditLogEntry } from '@/types'; // Assuming LogDetails is part of types or defined here

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
  let finalDetailsForDb: string | null = null;

  // Only proceed if options.details is provided and is not an empty object
  if (options.details && Object.keys(options.details).length > 0) {
    try {
      const detailsString = JSON.stringify(options.details);
      // Attempt to encrypt the stringified details
      let-encryptedStringAttempt = encrypt(detailsString);

      if (encryptedStringAttempt === null) {
        // This means encrypt() itself had an internal error during the encryption process
        console.error(`Encryption failed for audit action "${action}". Logging details as plain text with error marker.`);
        finalDetailsForDb = `ENCRYPTION_FAILED: ${detailsString}`;
      } else if (encryptedStringAttempt === detailsString) {
        // This means encryption was skipped (e.g., keys not valid/configured in encrypt()),
        // so encrypt() returned the original plain text.
        console.warn(`Encryption skipped for audit action "${action}" (keys likely not configured). Storing plain text details: ${detailsString}`);
        finalDetailsForDb = detailsString; // Store plain stringified JSON
      } else {
        // Encryption was successful
        finalDetailsForDb = encryptedStringAttempt;
      }
    } catch (e) {
      // This catch is for errors during JSON.stringify()
      console.error(`Failed to stringify details for audit action "${action}":`, e);
      finalDetailsForDb = "ERROR_STRINGIFYING_DETAILS";
    }
  } else if (options.details && Object.keys(options.details).length === 0) {
    // If options.details was an empty object {}, log it as null.
    console.warn(`Audit action "${action}" called with empty details object. Storing null for details.`);
    finalDetailsForDb = null;
  } else {
    // options.details was null or undefined from the start.
    finalDetailsForDb = null;
  }

  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: options.userId,
        details: finalDetailsForDb, // Ensures details is either a string or null
        ipAddress: options.ipAddress,
      },
    });
  } catch (error) {
    console.error(`Failed to log audit event "${action}" to database:`, error);
    // Depending on the criticality, you might want to re-throw or handle differently
  }
}
