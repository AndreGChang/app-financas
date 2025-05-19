export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  created_at: Date; // Alterado para Date
  updated_at: Date; // Alterado para Date
}

export interface SaleItem {
  id?: string; // Pode ser útil se a tabela sale_items tiver seu próprio PK
  sale_id?: string; // FK para a venda
  product_id: string;
  product_name: string; // Denormalized for easier display
  quantity: number;
  price_at_sale: number; // Price of the product at the time of sale
  cost_at_sale: number; // Cost of the product at the time of sale
}

export interface Sale {
  id: string;
  items: SaleItem[]; // Deve ser populado a partir da tabela sale_items
  total_amount: number;
  total_profit: number;
  sale_date: Date; // Alterado para Date
  cashier_id?: string; // Optional: if tracking which employee made the sale
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
