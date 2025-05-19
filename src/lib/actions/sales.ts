
"use server";

import { z } from 'zod';
import { SaleSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { pool, query } from '@/lib/db'; // Import pool for transactions
import type { Product, Sale, SaleItem } from '@/types';
import { randomUUID } from 'crypto';

export async function recordSale(values: z.infer<typeof SaleSchema>) {
  const validatedFields = SaleSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid sale data!", fieldErrors: validatedFields.error.flatten().fieldErrors };
  }

  const { items } = validatedFields.data;
  
  const client = await pool.connect(); // Get a client from the pool for transaction

  try {
    await client.query('BEGIN'); // Start transaction

    let totalAmount = 0;
    let totalProfit = 0;
    const processedSaleItems: Omit<SaleItem, 'id' | 'sale_id'>[] = []; // For inserting into sale_items table

    for (const item of items) {
      // Get product details and lock the row for update if using stricter concurrency control
      // For simplicity, SELECT ... FOR UPDATE is omitted, but consider for high concurrency
      const productResult = await client.query(
        'SELECT id, name, price, cost, quantity FROM products WHERE id = $1', 
        [item.productId]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Product with ID ${item.productId} not found.`);
      }
      const product: Product = {
          ...productResult.rows[0],
          price: parseFloat(productResult.rows[0].price),
          cost: parseFloat(productResult.rows[0].cost),
      };

      if (product.quantity < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}.`);
      }

      // Update product quantity
      await client.query(
        'UPDATE products SET quantity = quantity - $1 WHERE id = $2',
        [item.quantity, product.id]
      );

      const itemAmount = product.price * item.quantity;
      const itemProfit = (product.price - product.cost) * item.quantity;
      
      totalAmount += itemAmount;
      totalProfit += itemProfit;

      processedSaleItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        price_at_sale: product.price,
        cost_at_sale: product.cost,
      });
    }

    const newSaleId = `sale_${randomUUID()}`;
    // Insert into sales table
    const saleInsertResult = await client.query(
      'INSERT INTO sales (id, total_amount, total_profit, sale_date) VALUES ($1, $2, $3, NOW()) RETURNING id, sale_date',
      [newSaleId, totalAmount, totalProfit]
    );
    const createdSaleId = saleInsertResult.rows[0].id;
    const saleDate = saleInsertResult.rows[0].sale_date;


    // Insert into sale_items table
    for (const saleItem of processedSaleItems) {
      await client.query(
        'INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price_at_sale, cost_at_sale) VALUES ($1, $2, $3, $4, $5, $6)',
        [createdSaleId, saleItem.product_id, saleItem.product_name, saleItem.quantity, saleItem.price_at_sale, saleItem.cost_at_sale]
      );
    }

    await client.query('COMMIT'); // Commit transaction

    // Reconstruct the Sale object to return (or could refetch, but this is more efficient)
    const finalSaleItems: SaleItem[] = processedSaleItems.map(psi => ({
        ...psi,
        // id and sale_id would be set if RETURNING from sale_items insert, but not strictly necessary for this return
    }));

    const newSale: Sale = {
        id: createdSaleId,
        items: finalSaleItems,
        totalAmount,
        totalProfit,
        saleDate: new Date(saleDate), // Ensure it's a Date object
    };

    revalidatePath('/app/sales');
    revalidatePath('/app/dashboard');
    revalidatePath('/app/products');
    return { success: "Sale recorded successfully!", sale: newSale };

  } catch (error: any) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    console.error("Database Transaction Error (recordSale):", error);
    // Provide a more specific error message if possible
    if (error.message.includes("Not enough stock")) {
        return { error: error.message };
    }
    if (error.message.includes("not found")) {
        return { error: error.message };
    }
    return { error: `Failed to record sale: ${error.message || "Database operation failed."}` };
  } finally {
    client.release(); // Release client back to the pool
  }
}
