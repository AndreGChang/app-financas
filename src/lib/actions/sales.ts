
"use server";

import { z } from 'zod';
import { SaleSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db'; // Use Prisma client
import type { Product, Sale, SaleItem } from '@/types'; // Assuming types are compatible

export async function recordSale(values: z.infer<typeof SaleSchema>) {
  const validatedFields = SaleSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid sale data!", fieldErrors: validatedFields.error.flatten().fieldErrors };
  }

  const { items } = validatedFields.data;
  
  try {
    const newSale = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let totalProfit = 0;
      const saleItemsData: Omit<SaleItem, 'id' | 'saleId'>[] = []; // Prisma will generate IDs

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found.`);
        }

        if (product.quantity < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}.`);
        }

        // Update product quantity
        await tx.product.update({
          where: { id: product.id },
          data: { quantity: { decrement: item.quantity } },
        });

        const itemAmount = product.price * item.quantity;
        const itemProfit = (product.price - product.cost) * item.quantity;
        
        totalAmount += itemAmount;
        totalProfit += itemProfit;

        saleItemsData.push({
          productId: product.id,
          productName: product.name, // Denormalized
          quantity: item.quantity,
          priceAtSale: product.price,
          costAtSale: product.cost,
        });
      }

      // Create the sale and link sale items
      const createdSale = await tx.sale.create({
        data: {
          totalAmount,
          totalProfit,
          // saleDate is @default(now()) in Prisma schema
          items: {
            create: saleItemsData.map(si => ({
              productId: si.productId,
              productName: si.productName,
              quantity: si.quantity,
              priceAtSale: si.priceAtSale,
              costAtSale: si.costAtSale,
            })),
          },
        },
        include: {
          items: true, // Include the created items in the response
        },
      });

      return createdSale;
    });

    revalidatePath('/app/sales');
    revalidatePath('/app/dashboard');
    revalidatePath('/app/products'); // Stock levels changed
    
    // Adapt the returned 'newSale' to the 'Sale' type if necessary.
    // Prisma's returned object should be largely compatible if types/index.ts is aligned.
    return { success: "Sale recorded successfully!", sale: newSale as unknown as Sale };

  } catch (error: any) {
    console.error("Prisma Transaction Error (recordSale):", error);
    if (error.message.includes("Not enough stock") || error.message.includes("not found")) {
        return { error: error.message };
    }
    // Check for specific Prisma error codes if needed, e.g., transaction conflict
    return { error: `Failed to record sale: ${error.message || "Database operation failed."}` };
  }
}
