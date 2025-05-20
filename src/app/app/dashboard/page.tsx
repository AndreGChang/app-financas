import { getDashboardMetrics } from "@/lib/data";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DollarSign, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard - MarketEase',
  description: 'Overview of your market performance.',
};

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  // Format currency utility
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Key Metrics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Cash"
            value={formatCurrency(metrics.totalCash)}
            icon={DollarSign}
            description="Total revenue from sales"
          />
          <MetricCard
            title="Stock Value"
            value={formatCurrency(metrics.currentStockValue)}
            icon={Package}
            description="Current value of inventory (at cost)"
          />
          <MetricCard
            title="Daily Profit"
            value={formatCurrency(metrics.dailyProfit)}
            icon={TrendingUp}
            description="Profit generated today"
          />
          <MetricCard
            title="Weekly Profit"
            value={formatCurrency(metrics.weeklyProfit)}
            icon={TrendingUp}
            description="Profit generated this week"
            iconClassName="text-accent"
          />
        </div>
      </section>

      <section>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Low Stock Items</CardTitle>
            <CardDescription>Products that are running low in stock (less than 50 units).</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.lowStockItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Quantity Left</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.lowStockItems.map((item: Product) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.quantity < 10 ? "destructive" : "secondary"}>
                          {item.quantity}
                        </Badge>
                      </TableCell>
                       <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/app/products?edit=${item.id}`}>Restock</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Package className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No items are currently low on stock.</p>
                <p className="text-sm text-muted-foreground">All products have 50 units or more.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
      
      {/* Placeholder for charts - Example */}
      {/* 
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend (Placeholder)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
            <p className="text-muted-foreground">Chart will be displayed here.</p>
          </CardContent>
        </Card>
      </section>
      */}
    </div>
  );
}
