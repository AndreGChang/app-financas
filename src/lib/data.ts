import type { Product, Sale, DashboardMetrics, SaleItem } from "@/types";
import { query } from './db';
import { subDays, startOfDay, startOfWeek as dateFnsStartOfWeek } from 'date-fns';

// --- Funções de busca de dados do Banco de Dados ---

export async function getProducts(): Promise<Product[]> {
  try {
    const result = await query('SELECT id, name, price, cost, quantity, created_at, updated_at FROM products ORDER BY name ASC');
    return result.rows.map(row => ({
      ...row,
      price: parseFloat(row.price),
      cost: parseFloat(row.cost),
    }));
  } catch (error) {
    console.error('Database Error (getProducts):', error);
    throw new Error('Failed to fetch products.');
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    const result = await query('SELECT id, name, price, cost, quantity, created_at, updated_at FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return undefined;
    }
    const row = result.rows[0];
    return {
      ...row,
      price: parseFloat(row.price),
      cost: parseFloat(row.cost),
    };
  } catch (error) {
    console.error('Database Error (getProductById):', error);
    throw new Error('Failed to fetch product.');
  }
}

export async function getSales(): Promise<Sale[]> {
  try {
    const salesResult = await query(`
      SELECT 
        s.id, 
        s.total_amount, 
        s.total_profit, 
        s.sale_date, 
        s.cashier_id,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', si.id,
              'product_id', si.product_id,
              'product_name', si.product_name,
              'quantity', si.quantity,
              'price_at_sale', si.price_at_sale,
              'cost_at_sale', si.cost_at_sale
            )
          ) FROM sale_items si WHERE si.sale_id = s.id),
          '[]'::json
        ) as items
      FROM sales s 
      ORDER BY s.sale_date DESC
    `);

    return salesResult.rows.map(row => ({
      ...row,
      total_amount: parseFloat(row.total_amount),
      total_profit: parseFloat(row.total_profit),
      items: row.items.map((item: any) => ({
        ...item,
        price_at_sale: parseFloat(item.price_at_sale),
        cost_at_sale: parseFloat(item.cost_at_sale),
      }))
    }));
  } catch (error) {
    console.error('Database Error (getSales):', error);
    throw new Error('Failed to fetch sales.');
  }
}


export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const today = new Date();
    const sod = startOfDay(today);
    const sow = dateFnsStartOfWeek(today, { weekStartsOn: 0 }); // Sunday as start of week

    const totalCashResult = await query('SELECT SUM(total_amount) as total FROM sales');
    const totalCash = parseFloat(totalCashResult.rows[0]?.total) || 0;

    const stockValueResult = await query('SELECT SUM(cost * quantity) as total FROM products');
    const currentStockValue = parseFloat(stockValueResult.rows[0]?.total) || 0;

    const dailyProfitResult = await query('SELECT SUM(total_profit) as total FROM sales WHERE sale_date >= $1', [sod]);
    const dailyProfit = parseFloat(dailyProfitResult.rows[0]?.total) || 0;

    const weeklyProfitResult = await query('SELECT SUM(total_profit) as total FROM sales WHERE sale_date >= $1', [sow]);
    const weeklyProfit = parseFloat(weeklyProfitResult.rows[0]?.total) || 0;
    
    const lowStockItemsResult = await query('SELECT id, name, price, cost, quantity, created_at, updated_at FROM products WHERE quantity < 50 ORDER BY quantity ASC');
    const lowStockItems: Product[] = lowStockItemsResult.rows.map(row => ({
        ...row,
        price: parseFloat(row.price),
        cost: parseFloat(row.cost),
    }));

    return {
      totalCash,
      currentStockValue,
      dailyProfit,
      weeklyProfit,
      lowStockItems,
    };
  } catch (error) {
    console.error('Database Error (getDashboardMetrics):', error);
    throw new Error('Failed to fetch dashboard metrics.');
  }
}
