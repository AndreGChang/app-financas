export interface Product {
  id: string; // Handled by Prisma (uuid)
  name: string;
  price: number; // Prisma Float maps to number
  cost: number;  // Prisma Float maps to number
  quantity: number;
  createdAt: Date; // Prisma DateTime maps to Date
  updatedAt: Date; // Prisma DateTime maps to Date
}

export interface SaleItem {
  id: string; // Handled by Prisma (uuid)
  saleId: string; // FK to the sale
  productId: string;
  productName: string; // Denormalized for easier display
  quantity: number;
  priceAtSale: number; // Price of the product at the time of sale
  costAtSale: number; // Cost of the product at the time of sale
}

export interface Sale {
  id: string; // Handled by Prisma (uuid)
  items: SaleItem[]; // Relation to SaleItem model
  totalAmount: number;
  totalProfit: number;
  saleDate: Date; // Prisma DateTime maps to Date
  cashierId?: string | null; // Optional: if tracking which employee made the sale
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  // role: 'admin' | 'employee'; // Example roles - define in Prisma schema if needed
}

// For dashboard metrics
export interface DashboardMetrics {
  totalCash: number;
  currentStockValue: number; // Based on cost price
  dailyProfit: number;
  weeklyProfit: number;
  lowStockItems: Product[];
}
