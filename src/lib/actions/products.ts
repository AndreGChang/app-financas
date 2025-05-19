
"use server";

import { z } from 'zod';
import { ProductSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto'; // For generating IDs
import type { Product } from '@/types';


export async function createProduct(values: z.infer<typeof ProductSchema>) {
  const validatedFields = ProductSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!", fieldErrors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, price, cost, quantity } = validatedFields.data;
  const newId = `prod_${randomUUID()}`; // Generate a new UUID-based ID

  try {
    const result = await query(
      'INSERT INTO products (id, name, price, cost, quantity, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, name, price, cost, quantity, created_at, updated_at',
      [newId, name, price, cost, quantity]
    );
    const newProduct: Product = {
        ...result.rows[0],
        price: parseFloat(result.rows[0].price),
        cost: parseFloat(result.rows[0].cost),
    };

    revalidatePath('/app/products');
    return { success: "Product created successfully!", product: newProduct };
  } catch (error) {
    console.error("Database Error (createProduct):", error);
    return { error: "Failed to create product in database." };
  }
}

export async function updateProduct(id: string, values: z.infer<typeof ProductSchema>) {
  const validatedFields = ProductSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!", fieldErrors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, price, cost, quantity } = validatedFields.data;

  try {
    const result = await query(
      'UPDATE products SET name = $1, price = $2, cost = $3, quantity = $4, updated_at = NOW() WHERE id = $5 RETURNING id, name, price, cost, quantity, created_at, updated_at',
      [name, price, cost, quantity, id]
    );

    if (result.rowCount === 0) {
      return { error: "Product not found!" };
    }
    const updatedProduct: Product = {
        ...result.rows[0],
        price: parseFloat(result.rows[0].price),
        cost: parseFloat(result.rows[0].cost),
    };

    revalidatePath('/app/products');
    revalidatePath(`/app/dashboard`); // Low stock items might change
    // If there's a specific product page: revalidatePath(`/app/products/${id}`);
    return { success: "Product updated successfully!", product: updatedProduct };
  } catch (error) {
    console.error("Database Error (updateProduct):", error);
    return { error: "Failed to update product in database." };
  }
}

export async function deleteProduct(id: string) {
  try {
    // Consider foreign key constraints. If sale_items references products,
    // you might need to handle this (e.g., ON DELETE SET NULL/RESTRICT or archive product).
    // For now, assuming direct delete is okay or handled by DB schema (e.g., ON DELETE RESTRICT).
    // If product has sales, deletion might fail if not ON DELETE CASCADE (which is risky for sales history).
    // A safer approach might be to "soft delete" or archive products.
    
    // First, check if there are sales associated with this product.
    // This is a simplified check. A real app might prevent deletion or offer archiving.
    const salesCheckResult = await query('SELECT 1 FROM sale_items WHERE product_id = $1 LIMIT 1', [id]);
    if (salesCheckResult.rowCount > 0) {
      return { error: "Cannot delete product: It has associated sales records. Consider archiving the product instead." };
    }

    const result = await query('DELETE FROM products WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return { error: "Product not found!" };
    }

    revalidatePath('/app/products');
    revalidatePath('/app/dashboard');
    return { success: "Product deleted successfully!" };
  } catch (error) {
    console.error("Database Error (deleteProduct):", error);
    // Check for specific foreign key violation error if possible
    if ((error as any).code === '23503') { // PostgreSQL foreign key violation code
        return { error: "Cannot delete product: It is referenced in existing sales records. Please remove associated sales first or archive the product." };
    }
    return { error: "Failed to delete product from database." };
  }
}
