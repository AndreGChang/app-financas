import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <Store className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold text-primary">MarketEase</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Simple Management for Your Market
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-foreground">
            Streamline your inventory, sales, and finances with an intuitive and easy-to-use system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1" size="lg">
              <Link href="/login">
                <LogIn className="mr-2 h-5 w-5" /> Login
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1" size="lg">
              <Link href="/signup">
                <UserPlus className="mr-2 h-5 w-5" /> Sign Up
              </Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
           <Button asChild variant="ghost" className="text-sm text-primary hover:underline">
             <Link href="/app/dashboard">
                Access App (Demo)
             </Link>
           </Button>
        </CardFooter>
      </Card>
      <footer className="mt-8 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} MarketEase. All rights reserved.</p>
        <p>Designed for simplicity and efficiency.</p>
      </footer>
    </div>
  );
}
