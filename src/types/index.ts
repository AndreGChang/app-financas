export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtSale: number;
  costAtSale: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  totalProfit: number;
  saleDate: Date;
  cashierId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardMetrics {
  totalCash: number;
  currentStockValue: number;
  dailyProfit: number;
  weeklyProfit: number;
  lowStockItems: Product[];
}

export interface AuditLogEntry {
  id: string;
  action: string;
  userId?: string | null;
  details?: any | null; // Prisma usa Json, que pode ser qualquer tipo serializável
  ipAddress?: string | null;
  createdAt: Date;
}
