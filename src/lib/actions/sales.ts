
"use server";

import { z } from 'zod';
import { SaleSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import type { Sale } from '@/types';
import { logAuditEvent } from '@/lib/audit';
// Import getSimulatedCurrentUser para obter o ID do usuário para auditoria
// Em um app real, isso viria de um sistema de sessão/auth.
import { getSimulatedCurrentUser } from './auth';


export async function recordSale(values: z.infer<typeof SaleSchema>) {
  const validatedFields = SaleSchema.safeParse(values);
  const currentUser = await getSimulatedCurrentUser(); // Obter usuário para auditoria

  if (!validatedFields.success) {
    await logAuditEvent("SALE_RECORD_FAILED", { userId: currentUser?.id, details: { error: "Invalid sale data", values } });
    return { error: "Invalid sale data!", fieldErrors: validatedFields.error.flatten().fieldErrors };
  }

  const { items } = validatedFields.data;
  
  try {
    const newSale = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let totalProfit = 0;
      const saleItemsDataForAudit = [];

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

        await tx.product.update({
          where: { id: product.id },
          data: { quantity: { decrement: item.quantity } },
        });

        const itemAmount = product.price * item.quantity;
        const itemProfit = (product.price - product.cost) * item.quantity;
        
        totalAmount += itemAmount;
        totalProfit += itemProfit;

        saleItemsDataForAudit.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          priceAtSale: product.price,
        });
      }

      const createdSale = await tx.sale.create({
        data: {
          totalAmount,
          totalProfit,
          cashierId: currentUser?.id, // Associar venda ao usuário logado (simulado)
          items: {
            create: items.map(item => {
              const productDetails = saleItemsDataForAudit.find(p => p.productId === item.productId)!;
              return {
                productId: item.productId,
                productName: productDetails.productName, 
                quantity: item.quantity,
                priceAtSale: productDetails.priceAtSale,
                // Custo precisa ser buscado do produto original para o cálculo do lucro no item
                costAtSale: (async () => {
                    const originalProduct = await prisma.product.findUnique({where: {id: item.productId}});
                    return originalProduct?.cost || 0;
                })(),
              };
            }),
          },
        },
        include: {
          items: true,
        },
      });
      
      // Log de auditoria após a transação ser bem-sucedida
      await logAuditEvent("SALE_RECORDED", { 
        userId: currentUser?.id, 
        details: { 
          saleId: createdSale.id, 
          totalAmount: createdSale.totalAmount,
          itemCount: items.length,
          items: saleItemsDataForAudit 
        } 
      });

      return createdSale;
    });

    revalidatePath('/app/sales');
    revalidatePath('/app/dashboard');
    revalidatePath('/app/products');
    
    return { success: "Sale recorded successfully!", sale: newSale as unknown as Sale };

  } catch (error: any) {
    console.error("Prisma Transaction Error (recordSale):", error);
    const errorDetails = { 
        error: error.message || "Database operation failed.", 
        inputValues: items 
    };
    await logAuditEvent("SALE_RECORD_EXCEPTION", { userId: currentUser?.id, details: errorDetails });
    
    if (error.message.includes("Not enough stock") || error.message.includes("not found")) {
        return { error: error.message };
    }
    return { error: `Failed to record sale: ${error.message || "Database operation failed."}` };
  }
}
