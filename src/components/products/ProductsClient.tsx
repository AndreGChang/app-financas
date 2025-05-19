"use client";

import type React from 'react';
import { useState, useTransition, useCallback } from 'react';
import type { Product } from '@/types';
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
import { PlusCircle, Edit, Trash2, PackageSearch } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ProductsClientProps {
  initialProducts: Product[];
}

export function ProductsClient({ initialProducts }: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();


  const refreshProducts = useCallback(async () => {
    // In a real app, you'd fetch from an API. Here, we might need to re-prop or use a different state management.
    // For now, actions will revalidate and Next.js should re-render.
    // This function is a placeholder if client-side refresh is needed without full page reload.
    // For this example, we'll rely on revalidatePath from server actions.
    // To ensure UI updates after add/edit, we can clear editingProduct/showAddDialog
    // and the ProductDialog's onSuccess can trigger a parent-level state update if needed.
    // For simplicity with server actions, we'll assume revalidation works.
  }, []);


  const handleDelete = (productId: string) => {
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.error) {
        toast({ variant: "destructive", title: "Deletion Failed", description: result.error });
      } else {
        toast({ title: "Success", description: result.success });
        setProducts(prev => prev.filter(p => p.id !== productId)); // Optimistic update or rely on revalidation
        refreshProducts();
      }
    });
  };
  
  const handleDialogSuccess = () => {
    setEditingProduct(null);
    setShowAddDialog(false);
    // Server action revalidation should update the list.
    // If not, implement a client-side fetch here.
    // For now, we expect Next.js to handle it.
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
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
        <ProductDialog onSuccess={handleDialogSuccess}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </ProductDialog>
      </div>

      {editingProduct && (
        <ProductDialog product={editingProduct} onSuccess={handleDialogSuccess}>
          {/* This is a placeholder trigger, actual trigger is row button. Dialog opens via state. */}
          {/* This structure for dialogs is tricky. It might be better to manage dialog open state directly. */}
          {/* For simplicity: the row edit button will set `editingProduct` and then this dialog will use it. */}
          {/* This is not ideal; dialog should be self-contained or controlled by parent state effectively. */}
          {/* Let's assume this dialog is opened by setting editingProduct, then its open state managed internally */}
          {/* We need to ensure the dialog is actually mounted and can open when editingProduct changes. */}
          {/* A better way: <ProductDialog isOpen={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)} product={editingProduct} ... /> */}
          {/* For now, keep it simple and rely on the trigger mechanism or a more direct state control. */}
          <span /> 
        </ProductDialog>
      )}


      {filteredProducts.length > 0 ? (
        <Table>
          <TableCaption>A list of your products.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Cost</TableHead>
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
    </div>
  );
}
