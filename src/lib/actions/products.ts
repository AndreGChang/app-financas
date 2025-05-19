"use server";

import { z } from 'zod';
import { ProductSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation'; // Though redirect might not be needed for all product actions

// In-memory store for mockProducts (simulate database)
// This would be replaced by actual database calls (e.g., Prisma, Drizzle)
let productsStore = [
  { id: "prod_1", name: "Organic Apples", price: 2.99, cost: 1.50, quantity: 150, createdAt: new Date(), updatedAt: new Date() },
  { id: "prod_2", name: "Whole Wheat Bread", price: 3.49, cost: 1.20, quantity: 80, createdAt: new Date(), updatedAt: new Date() },
  { id: "prod_3", name: "Free-Range Eggs (Dozen)", price: 4.99, cost: 2.50, quantity: 60, createdAt: new Date(), updatedAt: new Date() },
];


export async function createProduct(values: z.infer<typeof ProductSchema>) {
  const validatedFields = ProductSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!", fieldErrors: validatedFields.error.flatten().fieldErrors };
  }

  const newProduct = {
    ...validatedFields.data,
    id: `prod_${Date.now()}`, // simple unique ID
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  productsStore.push(newProduct);
  console.log("Product created:", newProduct);

  revalidatePath('/app/products'); // Revalidate the products page to show the new product
  return { success: "Product created successfully!", product: newProduct };
}

export async function updateProduct(id: string, values: z.infer<typeof ProductSchema>) {
  const validatedFields = ProductSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!", fieldErrors: validatedFields.error.flatten().fieldErrors };
  }

  const productIndex = productsStore.findIndex(p => p.id === id);
  if (productIndex === -1) {
    return { error: "Product not found!" };
  }

  const updatedProduct = {
    ...productsStore[productIndex],
    ...validatedFields.data,
    updatedAt: new Date(),
  };
  productsStore[productIndex] = updatedProduct;
  console.log("Product updated:", updatedProduct);

  revalidatePath('/app/products');
  revalidatePath(`/app/products/${id}`); // If there's a specific product page
  return { success: "Product updated successfully!", product: updatedProduct };
}

export async function deleteProduct(id: string) {
  const productIndex = productsStore.findIndex(p => p.id === id);
  if (productIndex === -1) {
    return { error: "Product not found!" };
  }

  productsStore.splice(productIndex, 1);
  console.log("Product deleted, ID:", id);

  revalidatePath('/app/products');
  return { success: "Product deleted successfully!" };
}
