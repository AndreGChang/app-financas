import type { Product, Sale, DashboardMetrics } from "@/types";
import { subDays } from 'date-fns';

// --- Placeholder Data ---
const mockProducts: Product[] = [
  { id: "prod_1", name: "Organic Apples", price: 2.99, cost: 1.50, quantity: 150, createdAt: new Date(), updatedAt: new Date() },
  { id: "prod_2", name: "Whole Wheat Bread", price: 3.49, cost: 1.20, quantity: 80, createdAt: new Date(), updatedAt: new Date() },
  { id: "prod_3", name: "Free-Range Eggs (Dozen)", price: 4.99, cost: 2.50, quantity: 60, createdAt: new Date(), updatedAt: new Date() },
  { id: "prod_4", name: "Almond Milk (1L)", price: 3.79, cost: 2.00, quantity: 90, createdAt: new Date(), updatedAt: new Date() },
  { id: "prod_5", name: "Avocado (Large)", price: 1.99, cost: 0.80, quantity: 120, createdAt: new Date(), updatedAt: new Date() },
  { id: "prod_6", name: "Pasta (500g)", price: 1.50, cost: 0.50, quantity: 200, createdAt: new Date(), updatedAt: new Date() },
  { id: "prod_7", name: "Canned Tomatoes", price: 0.99, cost: 0.30, quantity: 50, createdAt: new Date(), updatedAt: new Date() }, // Low stock example
];

const mockSales: Sale[] = [
  {
    id: "sale_1",
    items: [
      { productId: "prod_1", productName: "Organic Apples", quantity: 2, priceAtSale: 2.99, costAtSale: 1.50 },
      { productId: "prod_2", productName: "Whole Wheat Bread", quantity: 1, priceAtSale: 3.49, costAtSale: 1.20 },
    ],
    totalAmount: (2 * 2.99) + 3.49,
    totalProfit: (2 * (2.99 - 1.50)) + (3.49 - 1.20),
    saleDate: subDays(new Date(), 1),
    cashierId: "user_1",
  },
  {
    id: "sale_2",
    items: [
      { productId: "prod_3", productName: "Free-Range Eggs (Dozen)", quantity: 1, priceAtSale: 4.99, costAtSale: 2.50 },
    ],
    totalAmount: 4.99,
    totalProfit: 4.99 - 2.50,
    saleDate: subDays(new Date(), 0), // Today
    cashierId: "user_2",
  },
    {
    id: "sale_3",
    items: [
      { productId: "prod_5", productName: "Avocado (Large)", quantity: 5, priceAtSale: 1.99, costAtSale: 0.80 },
    ],
    totalAmount: 5 * 1.99,
    totalProfit: 5 * (1.99 - 0.80),
    saleDate: subDays(new Date(), 3), // A few days ago
    cashierId: "user_1",
  },
];


// --- Simulated Data Fetching Functions ---

export async function getProducts(): Promise<Product[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return JSON.parse(JSON.stringify(mockProducts)); // Deep copy to avoid mutation issues if data is modified
}

export async function getProductById(id: string): Promise<Product | undefined> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return JSON.parse(JSON.stringify(mockProducts.find(p => p.id === id)));
}

export async function getSales(): Promise<Sale[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  return JSON.parse(JSON.stringify(mockSales.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime())));
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  await new Promise(resolve => setTimeout(resolve, 700));

  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const startOfWeek = subDays(startOfToday, today.getDay()); // Assuming Sunday is start of week

  const dailyProfit = mockSales
    .filter(sale => sale.saleDate >= startOfToday)
    .reduce((sum, sale) => sum + sale.totalProfit, 0);

  const weeklyProfit = mockSales
    .filter(sale => sale.saleDate >= startOfWeek)
    .reduce((sum, sale) => sum + sale.totalProfit, 0);
  
  const totalCash = mockSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  
  const currentStockValue = mockProducts.reduce((sum, prod) => sum + (prod.cost * prod.quantity), 0);

  const lowStockItems = mockProducts.filter(prod => prod.quantity < 50);


  return {
    totalCash,
    currentStockValue,
    dailyProfit,
    weeklyProfit,
    lowStockItems,
  };
}
