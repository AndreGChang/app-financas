// src/lib/audit.ts
'use server';

import { prisma } from './db';
import type { AuditLogEntry } from '@/types';

interface LogDetails {
  [key: string]: any;
}

/**
 * Logs an audit event to the database.
 * @param action A string describing the action (e.g., "CREATE_PRODUCT", "USER_LOGIN").
 * @param options Optional parameters.
 * @param options.userId The ID of the user performing the action.
 * @param options.details Additional details about the event (e.g., product ID, sale ID).
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
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: options.userId,
        details: options.details ? options.details : undefined, // Prisma expects `Json?` so pass `undefined` if null/empty
        ipAddress: options.ipAddress,
      },
    });
  } catch (error) {
    console.error(`Failed to log audit event "${action}":`, error);
    // Depending on the criticality, you might want to re-throw or handle differently
  }
}

// Example usage (you would call this from your server actions):
// await logAuditEvent("PRODUCT_CREATED", { userId: "user_xyz", details: { productId: "prod_123", name: "New Apples" } });
// await logAuditEvent("USER_LOGIN_SUCCESS", { userId: "user_abc", ipAddress: "192.168.1.1" });
