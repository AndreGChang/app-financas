import type React from "react";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Home, Package, ShoppingCart, BarChart3, LogOut, Store, Settings } from "lucide-react";
import { logout } from "@/lib/actions/auth";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: Home },
  { href: "/app/products", label: "Products", icon: Package },
  { href: "/app/sales", label: "Sales", icon: ShoppingCart },
  // { href: "/app/reports", label: "Reports", icon: BarChart3 }, // Example for future
  // { href: "/app/settings", label: "Settings", icon: Settings }, // Example for future
];

export default function AppLayout({ children, }: { children: React.ReactNode; }) {
  // This state would typically come from a session/auth context
  const pageTitle = "MarketEase"; // Placeholder, should be dynamic

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4 flex items-center gap-2 justify-center group-data-[collapsible=icon]:justify-center">
           <Link href="/app/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
             <Button variant="ghost" size="icon" className="h-10 w-10 text-primary group-data-[collapsible=icon]:mx-auto">
                <Store className="h-7 w-7" />
             </Button>
             <h1 className="text-2xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                MarketEase
             </h1>
           </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  tooltip={{ children: item.label, className: "group-data-[collapsible=icon]:block hidden" }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
           <form action={logout} className="w-full">
             <SidebarMenuButton
                tooltip={{ children: "Logout", className: "group-data-[collapsible=icon]:block hidden" }}
                className="w-full"
                type="submit"
              >
                <LogOut />
                <span>Logout</span>
             </SidebarMenuButton>
           </form>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <AppHeader pageTitle={pageTitle} /> {/* pageTitle needs to be dynamic based on route */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
