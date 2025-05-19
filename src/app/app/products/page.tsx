import { getProducts } from "@/lib/data";
import { ProductsClient } from "@/components/products/ProductsClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products - MarketEase',
  description: 'Manage your product inventory.',
};

// Ensure this page is dynamically rendered if data changes frequently
// export const revalidate = 0; // or a reasonable time like 60 seconds
// Or use `fetch` with cache options in `getProducts`

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-foreground">Product Management</CardTitle>
        <CardDescription>View, add, edit, or delete your products.</CardDescription>
      </CardHeader>
      <CardContent>
        <ProductsClient initialProducts={products} />
      </CardContent>
    </Card>
  );
}
