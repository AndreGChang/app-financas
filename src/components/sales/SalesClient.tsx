"use client";

import type React from 'react';
import { useState, useTransition, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SaleSchema, SaleItemSchema } from '@/lib/schemas';
import { recordSale } from '@/lib/actions/sales';
import type { Product, Sale, SaleItem as SaleItemType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getProducts as fetchProducts, getSales as fetchSales } from '@/lib/data'; // For fetching products for dropdown

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { PlusCircle, Trash2, ShoppingCart, ReceiptText, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SalesClientProps {
  initialSales: Sale[];
  initialProducts: Product[];
}

type SaleFormValues = z.infer<typeof SaleSchema>;

export function SalesClient({ initialSales, initialProducts }: SalesClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(SaleSchema),
    defaultValues: {
      items: [{ productId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const refreshSales = useCallback(async () => {
    const updatedSales = await fetchSales();
    setSales(updatedSales);
  }, []);

  useEffect(() => {
    // Fetch products if not provided or if they can change
    const loadData = async () => {
      if(!initialProducts || initialProducts.length === 0) {
        const fetchedProds = await fetchProducts();
        setProducts(fetchedProds);
      }
      if(!initialSales || initialSales.length === 0) {
        refreshSales();
      }
    };
    loadData();
  }, [initialProducts, initialSales, refreshSales]);

  const onSubmit = (values: SaleFormValues) => {
    startTransition(async () => {
      const result = await recordSale(values);
      if (result.error) {
        toast({ variant: "destructive", title: "Sale Failed", description: result.error });
        if (result.fieldErrors) {
            // Handle field errors if your action provides them
            // e.g. result.fieldErrors.items.forEach(...)
        }
      } else {
        toast({ title: "Success", description: result.success });
        form.reset({ items: [{ productId: "", quantity: 1 }] });
        refreshSales(); // Refresh sales list
        // Potentially refresh product list too if stock changes are critical to reflect immediately
        const updatedProducts = await fetchProducts();
        setProducts(updatedProducts);
      }
    });
  };
  
  const calculateItemTotal = (itemIndex: number) => {
    const itemValues = form.getValues(`items.${itemIndex}`);
    const product = products.find(p => p.id === itemValues.productId);
    if (product && itemValues.quantity > 0) {
      return product.price * itemValues.quantity;
    }
    return 0;
  };

  const calculateGrandTotal = () => {
    const allItems = form.getValues("items");
    return allItems.reduce((total, currentItem) => {
      const product = products.find(p => p.id === currentItem.productId);
      if (product && currentItem.quantity > 0) {
        return total + (product.price * currentItem.quantity);
      }
      return total;
    }, 0);
  };
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <ShoppingCart className="mr-2 h-6 w-6 text-primary" /> Record New Sale
          </CardTitle>
          <CardDescription>Add products to the current sale transaction.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {fields.map((field, index) => {
                const selectedProduct = products.find(p => p.id === form.watch(`items.${index}.productId`));
                return (
                  <div key={field.id} className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-lg shadow-sm bg-background">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productId`}
                        render={({ field: controllerField }) => (
                          <FormItem className="md:col-span-1">
                            <FormLabel>Product</FormLabel>
                            <Select onValueChange={(value) => {
                                controllerField.onChange(value);
                                // Trigger re-calculation or update
                                form.trigger(`items.${index}`);
                            }} defaultValue={controllerField.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id} disabled={product.quantity === 0}>
                                    {product.name} (Stock: {product.quantity}) - {formatCurrency(product.price)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field: controllerField }) => (
                          <FormItem className="md:col-span-1">
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number" 
                                    placeholder="1" 
                                    {...controllerField} 
                                    onChange={(e) => {
                                        controllerField.onChange(parseInt(e.target.value, 10) || 0);
                                        form.trigger(`items.${index}`);
                                    }}
                                    min="1"
                                    max={selectedProduct?.quantity}
                                    disabled={!selectedProduct || selectedProduct?.quantity === 0}
                                />
                            </FormControl>
                            <FormMessage />
                            {selectedProduct && form.getValues(`items.${index}.quantity`) > selectedProduct.quantity && (
                                <p className="text-sm text-destructive">Max stock: {selectedProduct.quantity}</p>
                            )}
                          </FormItem>
                        )}
                      />
                    </div>
                     <div className="flex flex-col items-end justify-between h-full pt-1 sm:pt-0 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => fields.length > 1 && remove(index)}
                            disabled={fields.length <= 1}
                            className="text-muted-foreground hover:text-destructive self-end sm:self-auto"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove item</span>
                        </Button>
                        <p className="text-sm font-semibold text-right mt-2 sm:mt-0 whitespace-nowrap">
                           Subtotal: {formatCurrency(calculateItemTotal(index))}
                        </p>
                    </div>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ productId: "", quantity: 1 })}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Another Product
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-4">
               <div className="text-2xl font-bold text-right text-primary">
                  Grand Total: {formatCurrency(calculateGrandTotal())}
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isPending || fields.length === 0 || !form.formState.isValid}>
                {isPending ? "Processing..." : "Record Sale"} <ShoppingCart className="ml-2 h-5 w-5" />
              </Button>
               {form.formState.errors.items && (
                <p className="text-sm font-medium text-destructive text-center">{form.formState.errors.items.message || form.formState.errors.items.root?.message}</p>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="lg:col-span-1 shadow-xl max-h-[calc(100vh-10rem)] flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <ReceiptText className="mr-2 h-5 w-5 text-primary" /> Recent Sales
          </CardTitle>
          <CardDescription>Last 5 sales transactions.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto">
          {sales.length > 0 ? (
            <div className="space-y-4">
              {sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="p-3 border rounded-md bg-background shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">ID: {sale.id.substring(0,8)}...</span>
                    <Badge variant="outline">{format(new Date(sale.saleDate), "PPp")}</Badge>
                  </div>
                  <ul className="text-sm space-y-0.5 mb-1">
                    {sale.items.map(item => (
                      <li key={item.productId} className="flex justify-between">
                        <span>{item.productName} x {item.quantity}</span>
                        <span>{formatCurrency(item.priceAtSale * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between items-center border-t pt-1 mt-1">
                     <p className="text-sm font-semibold text-muted-foreground">Profit: {formatCurrency(sale.totalProfit)}</p>
                     <p className="text-sm font-bold text-primary">Total: {formatCurrency(sale.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No sales recorded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
