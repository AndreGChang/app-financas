import type { Product, Sale, DashboardMetrics, SaleItem, AuditLogEntry } from "@/types";
import { prisma } from './db';
import { subDays, startOfDay, startOfWeek as dateFnsStartOfWeek } from 'date-fns';
import { Prisma } from '@prisma/client'; // Import Prisma for raw queries

// --- Funções de busca de dados do Banco de Dados usando Prisma ---

export async function getProducts(): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
    });
    return products; // Prisma handles type mapping (Float/Decimal to number, DateTime to Date)
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
    const sales = await prisma.sale.findMany({
      orderBy: { saleDate: 'desc' },
      include: {
        items: true, // Include related SaleItems
        cashier: { // Incluir dados do caixa (usuário)
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
    });
    return sales.map(sale => ({
        ...sale,
        cashierId: sale.cashierId ?? undefined, 
        cashierName: sale.cashier?.name ?? 'N/A', // Adicionar nome do caixa
        items: sale.items.map(item => ({...item})) 
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
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
      include: {
        user: { // Incluir dados do usuário associado ao log
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    return logs.map(log => ({
      ...log,
      userId: log.userId ?? undefined,
      userName: log.user?.name ?? (log.userId ? 'User ID: ' + log.userId.substring(0,8) + '...' : 'System'),
      details: log.details as any, // Prisma.JsonValue can be complex
    }));
  } catch (error) {
    console.error('Prisma Error (getAuditLogs):', error);
    throw new Error('Failed to fetch audit logs.');
  }
}
