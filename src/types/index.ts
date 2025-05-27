
export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  password?: string; 
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
  productId: string;
  productName: string;
  quantity: number;
  priceAtSale: number; // Stored in USD
  costAtSale: number;  // Stored in USD
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number; // Stored in USD
  totalProfit: number; // Stored in USD
  saleDate: Date;
  cashierId?: string | null;
  cashierName?: string; 
  cashier?: { 
    id: string;
    name?: string | null;
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
  userId?: string | null;
  userName?: string; 
  user?: { 
    id: string;
    name?: string | null;
    email: string;
  } | null;
  details?: any | null; 
  ipAddress?: string | null;
  createdAt: Date;
}

// Type for exchange rates, e.g., { "BRL": 5.05, "EUR": 0.92 }
// These rates are relative to USD (USD is 1.0)
export type ExchangeRates = Record<string, number>;

// Type for AwesomeAPI response item
export interface AwesomeAPICurrencyInfo {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string; // We'll use this one for the rate
  ask: string;
  timestamp: string;
  create_date: string;
}

// Type for AwesomeAPI full response
export type AwesomeAPIResponse = Record<string, AwesomeAPICurrencyInfo>;
