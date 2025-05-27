// src/lib/services/currencyService.ts
'use server';

import type { ExchangeRates, AwesomeAPIResponse, AwesomeAPICurrencyInfo } from '@/types';

const AWESOMEAPI_BASE_URL = "https://economia.awesomeapi.com.br/json/last/";

/**
 * Fetches exchange rates from AwesomeAPI for specified currency pairs (e.g., "USD-BRL", "USD-EUR").
 * Returns rates relative to USD. USD itself will have a rate of 1.0.
 * @param currencyPairs Array of strings for currency pairs, e.g., ["USD-BRL", "USD-EUR"]
 * @returns A promise that resolves to an ExchangeRates object or throws an error.
 */
export async function getExchangeRates(currencyPairs: string[]): Promise<ExchangeRates> {
  if (currencyPairs.length === 0) {
    return { USD: 1.0 };
  }

  const pairsString = currencyPairs.join(',');
  const url = `${AWESOMEAPI_BASE_URL}${pairsString}`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Revalidate every hour
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`AwesomeAPI Error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch exchange rates from AwesomeAPI: ${response.statusText}`);
    }

    const data: AwesomeAPIResponse = await response.json();
    
    const rates: ExchangeRates = { USD: 1.0 }; // Base currency

    Object.values(data).forEach((currencyInfo: AwesomeAPICurrencyInfo) => {
      if (currencyInfo && currencyInfo.code === 'USD' && currencyInfo.bid) {
         // Example: USD-BRL, currencyInfo.codein will be "BRL"
        rates[currencyInfo.codein] = parseFloat(currencyInfo.bid);
      }
    });
    
    // Ensure all requested target currencies that are not USD itself have a rate
    // This handles cases where the API might not return a pair as expected,
    // or if a pair like "EUR-USD" was requested but we normalize to USD as base.
    currencyPairs.forEach(pair => {
      const [base, target] = pair.split('-');
      if (base === 'USD' && target !== 'USD' && !rates[target]) {
        console.warn(`Rate for ${target} (from ${pair}) not found or invalid in API response, defaulting to 1.0.`);
        rates[target] = 1.0; // Fallback, though ideally API should provide it
      }
    });

    return rates;
  } catch (error) {
    console.error("Error in getExchangeRates:", error);
    // Fallback in case of API error: return USD only or throw
    // For now, let's return a basic fallback to prevent full page crash
     const fallbackRates: ExchangeRates = { USD: 1.0 };
     currencyPairs.forEach(pair => {
       const targetCurrency = pair.split('-')[1];
       if (targetCurrency && targetCurrency !== 'USD' && !fallbackRates[targetCurrency]) {
         fallbackRates[targetCurrency] = 1.0; // Default to 1 if API fails
       }
     });
     console.warn("Falling back to default rates (1.0 for all) due to API error.");
     return fallbackRates;
  }
}
