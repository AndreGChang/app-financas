
import { getProducts } from "@/lib/data";
import { ProductsClient } from "@/components/products/ProductsClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from 'next';
import { getExchangeRates } from "@/lib/services/currencyService";
import type { ExchangeRates } from "@/types";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Products - MarketEase',
  description: 'Manage your product inventory.',
};

// Define the currencies you want to support for conversion here
const SUPPORTED_CURRENCIES = ["USD", "BRL", "EUR"];
// Define the currency pairs needed for AwesomeAPI (always relative to USD for this setup)
const CURRENCY_PAIRS_TO_FETCH = ["USD-BRL", "USD-EUR"];


export default async function ProductsPage() {
  const products = await getProducts();
  let exchangeRates: ExchangeRates = { USD: 1.0 }; // Default to USD only

  try {
    exchangeRates = await getExchangeRates(CURRENCY_PAIRS_TO_FETCH);
  } catch (error) {
    console.error("Failed to fetch exchange rates for ProductsPage:", error);
    // exchangeRates will remain { USD: 1.0 } as a fallback
    // You might want to show a toast or message to the user in ProductsClient
  }
  
  // Ensure all supported currencies have a rate, even if API failed for some.
  // This prevents crashes if a supported currency is missing from API response.
  SUPPORTED_CURRENCIES.forEach(currency => {
    if (!(currency in exchangeRates)) {
      console.warn(`Exchange rate for ${currency} not available, defaulting to 1.0 (USD equivalent).`);
      exchangeRates[currency] = 1.0;
    }
  });


  const defaultCurrency = "USD"; 

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div>
          <CardTitle className="text-2xl font-semibold text-foreground">Product Management</CardTitle>
          <CardDescription>View, add, edit, or delete your products. Prices displayed in selected currency.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ProductsClient 
          initialProducts={products} 
          exchangeRates={exchangeRates}
          supportedCurrencies={SUPPORTED_CURRENCIES}
          initialCurrency={defaultCurrency}
        />
      </CardContent>
    </Card>
  );
}
