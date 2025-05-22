
import { getProducts } from "@/lib/data";
import { ProductsClient } from "@/components/products/ProductsClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from 'next';
import { Globe } from "lucide-react"; // Icon for currency
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // For currency dropdown

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Products - MarketEase',
  description: 'Manage your product inventory.',
};

export default async function ProductsPage() {
  const products = await getProducts();

  // Simulação de taxas de câmbio (em um app real, viria de uma API)
  const exchangeRates = {
    USD: 1,
    BRL: 5.05, // Exemplo
    EUR: 0.92, // Exemplo
  };
  const currencies = Object.keys(exchangeRates);
  const defaultCurrency = "USD"; // Ou poderia vir das preferências do usuário

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-2xl font-semibold text-foreground">Product Management</CardTitle>
            <CardDescription>View, add, edit, or delete your products.</CardDescription>
          </div>
          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <Select defaultValue={defaultCurrency} disabled> {/* Desabilitado pois é simulação */}
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(currency => (
                  <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">(API Sim.)</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ProductsClient 
          initialProducts={products} 
          // Passar taxas simuladas para o client se ele for converter
          // exchangeRates={exchangeRates} 
          // selectedCurrency={defaultCurrency}
        />
        <p className="text-xs text-muted-foreground mt-4">
          * Conversão de moeda é simulada. Em uma aplicação real, os preços seriam convertidos usando taxas de uma API externa.
        </p>
      </CardContent>
    </Card>
  );
}
