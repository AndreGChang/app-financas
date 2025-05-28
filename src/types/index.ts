
export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  password?: string; // Should be the hash in DB, not exposed to client beyond auth forms
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  price: number; // Stored in USD
  cost: number;  // Stored in USD
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  saleId: string;
  // sale?: Sale; // Optional: if you need to navigate back from item to sale
  productId: string;
  // product?: Product; // Optional: if you need full product details here
  productName: string; // Denormalized for convenience
  quantity: number;
  priceAtSale: number; // Stored in USD (price per unit at the time of sale)
  costAtSale: number;  // Stored in USD (cost per unit at the time of sale)
  // createdAt and updatedAt can be added if needed for SaleItem itself
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number; // Stored in USD
  totalProfit: number; // Stored in USD
  saleDate: Date;
  cashierId?: string | null; // Foreign key
  cashier?: { // Populated by Prisma include
    id: string;
    name: string | null;
    email: string;
  } | null;
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
  userId?: string | null; // Changed from string to string | null
  userName?: string; // Added for display convenience
  user?: { // Populated by Prisma include
    id: string;
    name?: string | null;
    email: string;
  } | null;
  details?: any | null; // Can be string (encrypted), object (decrypted), or null
  ipAddress?: string | null;
  createdAt: Date;
}

// Type for exchange rates, e.g., { "BRL": 5.05, "EUR": 0.92 }
// These rates are relative to USD (USD is 1.0)
export type ExchangeRates = Record<string, number>;

// Type for AwesomeAPI response item
export interface AwesomeAPICurrencyInfo {
  code: string; // e.g., "USD"
  codein: string; // e.g., "BRL"
  name: string; // e.g., "Dólar Americano/Real Brasileiro"
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string; // We'll use this one for the rate
  ask: string;
  timestamp: string;
  create_date: string;
}

// Type for AwesomeAPI full response, which is a dictionary where keys are like "USDBRL"
export type AwesomeAPIResponse = Record<string, AwesomeAPICurrencyInfo>;
