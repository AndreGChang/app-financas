import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export const SignupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters."}),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], // path of error
});


export const ProductSchema = z.object({
  id: z.string().optional(), // Optional for new products
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  price: z.coerce.number().positive({ message: "Price must be a positive number." }),
  cost: z.coerce.number().nonnegative({ message: "Cost must be a non-negative number." }),
  quantity: z.coerce.number().int().nonnegative({ message: "Quantity must be a non-negative integer." }),
});

export const SaleItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required."),
  quantity: z.coerce.number().int().positive("Quantity must be a positive integer."),
});

export const SaleSchema = z.object({
  items: z.array(SaleItemSchema).min(1, "At least one item must be added to the sale."),
});
