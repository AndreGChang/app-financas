
"use server";

import { z } from 'zod';
import { ProductSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
// Import getSimulatedCurrentUser para obter o ID do usuário para auditoria
// Em um app real, isso viria de um sistema de sessão/auth.
import { getSimulatedCurrentUser } from './auth';


export async function createProduct(values: z.infer<typeof ProductSchema>) {
  const validatedFields = ProductSchema.safeParse(values);
  const currentUser = await getSimulatedCurrentUser(); // Obter usuário para auditoria

  if (!validatedFields.success) {
    await logAuditEvent("PRODUCT_CREATE_FAILED", { userId: currentUser?.id, details: { error: "Invalid fields", values } });
    return { error: "Invalid fields!", fieldErrors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, price, cost, quantity } = validatedFields.data;
  
  try {
    const newProduct = await prisma.product.create({
      data: {
        name,
        price,
        cost,
        quantity,
      },
    });

    await logAuditEvent("PRODUCT_CREATED", { userId: currentUser?.id, details: { productId: newProduct.id, name, price, quantity } });
    revalidatePath('/app/products');
    revalidatePath('/app/dashboard');
    return { success: "Product created successfully!", product: newProduct };
  } catch (error) {
    console.error("Prisma Error (createProduct):", error);
    await logAuditEvent("PRODUCT_CREATE_EXCEPTION", { userId: currentUser?.id, details: { error: "Database error", values } });
    return { error: "Failed to create product in database." };
  }
}

export async function updateProduct(id: string, values: z.infer<typeof ProductSchema>) {
  const validatedFields = ProductSchema.safeParse(values);
  const currentUser = await getSimulatedCurrentUser();

  if (!validatedFields.success) {
    await logAuditEvent("PRODUCT_UPDATE_FAILED", { userId: currentUser?.id, details: { error: "Invalid fields", productId: id, values } });
    return { error: "Invalid fields!", fieldErrors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, price, cost, quantity } = validatedFields.data;

  try {
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        price,
        cost,
        quantity,
      },
    });

    await logAuditEvent("PRODUCT_UPDATED", { userId: currentUser?.id, details: { productId: id, newValues: values } });
    revalidatePath('/app/products');
    revalidatePath(`/app/dashboard`);
    return { success: "Product updated successfully!", product: updatedProduct };
  } catch (error) {
    console.error("Prisma Error (updateProduct):", error);
    await logAuditEvent("PRODUCT_UPDATE_EXCEPTION", { userId: currentUser?.id, details: { error: "Database error", productId: id, values } });
    if ((error as any).code === 'P2025') {
        return { error: "Product not found!" };
    }
    return { error: "Failed to update product in database." };
  }
}

export async function deleteProduct(id: string) {
  const currentUser = await getSimulatedCurrentUser();
  try {
    const associatedSales = await prisma.saleItem.count({
      where: { productId: id },
    });

    if (associatedSales > 0) {
      await logAuditEvent("PRODUCT_DELETE_FAILED", { userId: currentUser?.id, details: { error: "Product has associated sales", productId: id } });
      return { error: "Cannot delete product: It has associated sales records. Consider archiving the product instead." };
    }
    
    const productToDelete = await prisma.product.findUnique({ where: {id}});
    if (!productToDelete) {
      await logAuditEvent("PRODUCT_DELETE_FAILED", { userId: currentUser?.id, details: { error: "Product not found for deletion", productId: id } });
      return { error: "Product not found!" };
    }

    await prisma.product.delete({
      where: { id },
    });

    await logAuditEvent("PRODUCT_DELETED", { userId: currentUser?.id, details: { productId: id, productName: productToDelete.name } });
    revalidatePath('/app/products');
    revalidatePath('/app/dashboard');
    return { success: "Product deleted successfully!" };
  } catch (error) {
    console.error("Prisma Error (deleteProduct):", error);
    await logAuditEvent("PRODUCT_DELETE_EXCEPTION", { userId: currentUser?.id, details: { error: "Database error", productId: id } });
    if ((error as any).code === 'P2025') {
        return { error: "Product not found!" };
    }
    if ((error as any).code === 'P2003' || (error as any).code === 'P2014') { 
        return { error: "Cannot delete product: It is referenced in existing sales records or other relations." };
    }
    return { error: "Failed to delete product from database." };
  }
}
