
import type { Product, Sale, DashboardMetrics, SaleItem, AuditLogEntry } from "@/types";
import { prisma } from './db';
import { subDays, startOfDay, startOfWeek as dateFnsStartOfWeek } from 'date-fns';
import { Prisma } from '@prisma/client'; // Import Prisma for raw queries
import { decrypt } from './encryption'; // Import decrypt function

// --- Funções de busca de dados do Banco de Dados usando Prisma ---

export async function getProducts(): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
    });
    return products;
  } catch (error) {
    console.error('Prisma Error (getProducts):', error);
    throw new Error('Failed to fetch products.');
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });
    return product;
  } catch (error) {
    console.error('Prisma Error (getProductById):', error);
    throw new Error('Failed to fetch product.');
  }
}

export async function getSales(): Promise<Sale[]> {
  try {
    const salesFromPrisma = await prisma.sale.findMany({
      orderBy: { saleDate: 'desc' },
      include: {
        items: true, // Include related SaleItems
        cashier: { // Include data from the related User (cashier)
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
    });

    // Map to the Sale type defined in src/types/index.ts
    return salesFromPrisma.map(sale => ({
      id: sale.id,
      items: sale.items.map(item => ({
          ...item,
          id: item.id, // Ensure id is explicitly passed if SaleItem type requires it
          saleId: sale.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          priceAtSale: item.priceAtSale,
          costAtSale: item.costAtSale,
          // Ensure all fields required by SaleItem are present
       })),
      totalAmount: sale.totalAmount,
      totalProfit: sale.totalProfit,
      saleDate: sale.saleDate,
      cashierId: sale.cashierId, // This is nullable String? from Prisma schema
      cashier: sale.cashier ? { // This will be populated if include is successful
        id: sale.cashier.id,
        name: sale.cashier.name, // name is nullable (String?) in User model
        email: sale.cashier.email,
      } : null,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
    }));
  } catch (error) {
    console.error('Prisma Error (getSales):', error);
    throw new Error('Failed to fetch sales.');
  }
}


export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const today = new Date();
    const sod = startOfDay(today);
    const sow = dateFnsStartOfWeek(today, { weekStartsOn: 0 }); // Sunday as start of week

    const totalCashResult = await prisma.sale.aggregate({
      _sum: { totalAmount: true },
    });
    const totalCash = totalCashResult._sum.totalAmount || 0;

    const stockValueRawResult = await prisma.$queryRaw<[{ total: number | null }]>`
      SELECT SUM(cost * quantity) as total FROM "Product"
    `;
    const currentStockValue = stockValueRawResult[0]?.total ?? 0;


    const dailyProfitResult = await prisma.sale.aggregate({
      _sum: { totalProfit: true },
      where: { saleDate: { gte: sod } },
    });
    const dailyProfit = dailyProfitResult._sum.totalProfit || 0;

    const weeklyProfitResult = await prisma.sale.aggregate({
      _sum: { totalProfit: true },
      where: { saleDate: { gte: sow } },
    });
    const weeklyProfit = weeklyProfitResult._sum.totalProfit || 0;

    const lowStockItems = await prisma.product.findMany({
      where: { quantity: { lt: 50 } },
      orderBy: { quantity: 'asc' },
    });

    return {
      totalCash,
      currentStockValue,
      dailyProfit,
      weeklyProfit,
      lowStockItems,
    };
  } catch (error) {
    console.error('Prisma Error (getDashboardMetrics):', error);
    throw new Error('Failed to fetch dashboard metrics.');
  }
}

export async function getAuditLogs(limit: number = 50, skip: number = 0): Promise<AuditLogEntry[]> {
  try {
    const logsFromPrisma = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return logsFromPrisma.map(log => {
      let decryptedDetails: any = '(Could not parse details)'; // Default for parsing error
      if (log.details) {
        const decryptedString = decrypt(log.details);
        if (decryptedString === null) {
          decryptedDetails = '(Failed to decrypt)';
        } else if (decryptedString === log.details && !decryptedString.startsWith('ENCRYPTION_FAILED:')) {
          // If decrypt returns the original string and it's not an encryption error marker,
          // it means it was likely plain text to begin with (e.g. keys not set, or old data)
          try {
             decryptedDetails = JSON.parse(decryptedString);
          } catch (e) {
             // If it's not JSON, display as is (could be plain text if encryption wasn't active)
             decryptedDetails = decryptedString;
          }
        }
        else {
          try {
            decryptedDetails = JSON.parse(decryptedString);
          } catch (e) {
            // If parsing fails, it might be the "ENCRYPTION_FAILED:" marker or other non-JSON
            decryptedDetails = decryptedString;
          }
        }
      } else {
        decryptedDetails = null; // No details to decrypt
      }

      return {
        id: log.id,
        action: log.action,
        userId: log.userId ?? undefined,
        userName: log.user?.name ?? (log.userId ? 'User ID: ' + log.userId.substring(0,8) + '...' : 'System'),
        user: log.user ? { id: log.user.id, name: log.user.name, email: log.user.email } : null,
        details: decryptedDetails,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      };
    });
  } catch (error) {
    console.error('Prisma Error (getAuditLogs):', error);
    throw new Error('Failed to fetch audit logs.');
  }
}
