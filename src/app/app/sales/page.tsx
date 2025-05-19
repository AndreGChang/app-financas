import { getSales, getProducts } from "@/lib/data";
import { SalesClient } from "@/components/sales/SalesClient";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sales - MarketEase',
  description: 'Record sales transactions and view sales history.',
};

// Ensure this page is dynamically rendered if data changes frequently
export const revalidate = 0; 

export default async function SalesPage() {
  const initialSales = await getSales();
  const initialProducts = await getProducts(); // Fetch products for the select dropdown

  return (
    <SalesClient initialSales={initialSales} initialProducts={initialProducts} />
  );
}
