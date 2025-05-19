"use client";

import type React from 'react';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProductSchema } from '@/lib/schemas';
import { createProduct, updateProduct } from '@/lib/actions/products';
import type { Product } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit } from 'lucide-react';

interface ProductDialogProps {
  product?: Product | null; // If product is provided, it's an edit dialog
  children: React.ReactNode; // Trigger element
  onSuccess?: () => void; // Callback on successful operation
}

export function ProductDialog({ product, children, onSuccess }: ProductDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof ProductSchema>>({
    resolver: zodResolver(ProductSchema),
    defaultValues: product || {
      name: "",
      price: 0,
      cost: 0,
      quantity: 0,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset(product);
    } else {
      form.reset({ name: "", price: 0, cost: 0, quantity: 0 });
    }
  }, [product, form, isOpen]);


  const onSubmit = (values: z.infer<typeof ProductSchema>) => {
    startTransition(async () => {
      try {
        let result;
        if (product && product.id) {
          result = await updateProduct(product.id, values);
        } else {
          result = await createProduct(values);
        }

        if (result.error) {
          toast({ variant: "destructive", title: "Operation Failed", description: result.error });
          if (result.fieldErrors) {
             Object.entries(result.fieldErrors).forEach(([fieldName, errors]) => {
                if (errors && errors.length > 0) {
                    form.setError(fieldName as keyof z.infer<typeof ProductSchema>, { message: errors[0] });
                }
            });
          }
        } else {
          toast({ title: "Success", description: result.success });
          setIsOpen(false);
          onSuccess?.();
        }
      } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update the details of this product.' : 'Fill in the details for the new product.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Organic Apples" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity in Stock</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" placeholder="0" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? (product ? 'Saving...' : 'Adding...') : (product ? 'Save Changes' : 'Add Product')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
