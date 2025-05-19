"use server";

import { z } from 'zod';
import { SaleSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import type { SaleItem, Product, Sale } from '@/types'; // Assuming Product type is also needed

// In-memory store for mockProducts and mockSales (simulate database)
let productsStore: Product[] = [
  { id: "prod_1", name: "Organic Apples", price: 2.99, cost: 1.50, quantity: 150 },
  { id: "prod_2", name: "Whole Wheat Bread", price: 3.49, cost: 1.20, quantity: 80 },
  { id: "prod_3", name: "Free-Range Eggs (Dozen)", price: 4.99, cost: 2.50, quantity: 60 },
];

let salesStore: Sale[] = [];

export async function recordSale(values: z.infer<typeof SaleSchema>) {
  const validatedFields = SaleSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid sale data!", fieldErrors: validatedFields.error.flatten().fieldErrors };
  }

  const { items } = validatedFields.data;
  let totalAmount = 0;
  let totalProfit = 0;
  const saleItems: SaleItem[] = [];

  for (const item of items) {
    const product = productsStore.find(p => p.id === item.productId);
    if (!product) {
      return { error: `Product with ID ${item.productId} not found.` };
    }
    if (product.quantity < item.quantity) {
      return { error: `Not enough stock for ${product.name}. Available: ${product.quantity}.` };
    }

    // Update product quantity (simulated)
    product.quantity -= item.quantity;

    const itemAmount = product.price * item.quantity;
    const itemProfit = (product.price - product.cost) * item.quantity;
    
    totalAmount += itemAmount;
    totalProfit += itemProfit;

    saleItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      priceAtSale: product.price,
      costAtSale: product.cost,
    });
  }

  const newSale: Sale = {
    id: `sale_${Date.now()}`,
    items: saleItems,
    totalAmount,
    totalProfit,
    saleDate: new Date(),
    // cashierId: 'current_user_id' // Would come from session
  };

  salesStore.push(newSale);
  console.log("Sale recorded:", newSale);
  console.log("Updated product stock:", productsStore.map(p => ({id: p.id, quantity: p.quantity})));


  revalidatePath('/app/sales');
  revalidatePath('/app/dashboard'); // Dashboard metrics might change
  revalidatePath('/app/products'); // Product quantities changed
  return { success: "Sale recorded successfully!", sale: newSale };
}
