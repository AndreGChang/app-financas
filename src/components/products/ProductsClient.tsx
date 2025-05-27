
"use client";

import type React from 'react';
import { useState, useTransition, useCallback, useEffect } from 'react';
import type { Product, ExchangeRates } from '@/types';
import { deleteProduct } from '@/lib/actions/products';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProductDialog } from './ProductDialog';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, PackageSearch, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductsClientProps {
  initialProducts: Product[];
  exchangeRates: ExchangeRates;
  supportedCurrencies: string[];
  initialCurrency: string;
}

export function ProductsClient({ 
  initialProducts, 
  exchangeRates,
  supportedCurrencies,
  initialCurrency 
}: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>(initialCurrency);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Update products if initialProducts changes (e.g. after add/edit)
    // This might not be strictly necessary if revalidatePath works perfectly,
    // but can help ensure client-side state is in sync.
    setProducts(initialProducts);
  }, [initialProducts]);

  const refreshProductsList = async () => {
    // For now, rely on Next.js revalidation via server actions.
    // If client-side fetching is needed, implement here.
    // e.g. const updatedProducts = await fetch('/api/products').then(res => res.json());
    // setProducts(updatedProducts);
    console.log("Product list refresh triggered by dialog success.");
  };
  
  const handleDialogSuccess = () => {
    // The server action should revalidate the path, causing `initialProducts` to update.
    // The useEffect above will then update the local `products` state.
    refreshProductsList();
  };

  const handleDelete = (productId: string) => {
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.error) {
        toast({ variant: "destructive", title: "Deletion Failed", description: result.error });
      } else {
        toast({ title: "Success", description: result.success });
        // Optimistic update or rely on revalidation:
        // setProducts(prev => prev.filter(p => p.id !== productId)); 
        // Server action revalidation should handle the list update.
      }
    });
  };
  
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatCurrency = (amountUSD: number | undefined) => {
    if (amountUSD === undefined) return 'N/A';
    
    const rate = exchangeRates[selectedCurrency] || 1.0; // Default to 1.0 if rate not found
    const convertedAmount = amountUSD * rate;

    try {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: selectedCurrency,
        // Attempt to provide sensible fraction digits based on currency
        minimumFractionDigits: selectedCurrency === "USD" || selectedCurrency === "EUR" || selectedCurrency === "BRL" ? 2 : 2,
        maximumFractionDigits: selectedCurrency === "USD" || selectedCurrency === "EUR" || selectedCurrency === "BRL" ? 2 : 4,
      }).format(convertedAmount);
    } catch (e) {
      // Fallback for unsupported currency codes in Intl.NumberFormat
      return `${selectedCurrency} ${convertedAmount.toFixed(2)}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Input 
          placeholder="Search products (name or ID)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-x-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {supportedCurrencies.map(currency => (
                  <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ProductDialog onSuccess={handleDialogSuccess}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </ProductDialog>
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <Table>
          <TableCaption>
            A list of your products. Prices are shown in {selectedCurrency}. 
            Original prices are stored in USD.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price ({selectedCurrency})</TableHead>
              <TableHead className="text-right">Cost ({selectedCurrency})</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.cost)}</TableCell>
                <TableCell className="text-right">
                   <Badge variant={product.quantity < 10 ? "destructive" : product.quantity < 50 ? "secondary" : "default"}>
                    {product.quantity}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <ProductDialog product={product} onSuccess={handleDialogSuccess}>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={isPending}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </ProductDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" className="h-8 w-8" disabled={isPending}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the product &quot;{product.name}&quot;.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(product.id)} disabled={isPending}>
                          {isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-lg">
            <PackageSearch className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground">No Products Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? `No products match your search for "${searchTerm}".` : "You haven't added any products yet."}
            </p>
            {!searchTerm && (
                 <ProductDialog onSuccess={handleDialogSuccess}>
                    <Button className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Product
                    </Button>
                 </ProductDialog>
            )}
        </div>
      )}
       <p className="text-xs text-muted-foreground mt-4">
          * Currency conversion is for display purposes. Rates are fetched from AwesomeAPI and may be cached for up to an hour. All transactions are processed in USD.
        </p>
    </div>
  );
}
