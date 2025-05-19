export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SaleItem {
  productId: string;
  productName: string; // Denormalized for easier display
  quantity: number;
  priceAtSale: number; // Price of the product at the time of sale
  costAtSale: number; // Cost of the product at the time of sale
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  totalProfit: number;
  saleDate: Date;
  cashierId?: string; // Optional: if tracking which employee made the sale
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'employee'; // Example roles
}

// For dashboard metrics
export interface DashboardMetrics {
  totalCash: number;
  currentStockValue: number; // Based on cost price
  dailyProfit: number;
  weeklyProfit: number;
  lowStockItems: Product[];
}
