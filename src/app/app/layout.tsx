
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
import { Home, Package, ShoppingCart, BarChart3, LogOut, Store, Settings, ShieldCheck, Activity } from "lucide-react";
import { logout, getSimulatedCurrentUser } from "@/lib/actions/auth"; // Importar função para pegar usuário
import type { User, Role } from "@/types";

const navItemsBase = [
  { href: "/app/dashboard", label: "Dashboard", icon: Home },
  { href: "/app/products", label: "Products", icon: Package },
  { href: "/app/sales", label: "Sales", icon: ShoppingCart },
];

const adminNavItems = [
  { href: "/app/admin/audit-logs", label: "Audit Logs", icon: Activity, roles: ["ADMIN"] as Role[] }, // Exemplo de painel admin
  // Adicionar mais links de admin aqui
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const pageTitle = "MarketEase"; // Placeholder, deveria ser dinâmico

  // Simular obtenção do usuário atual e sua role
  // Em um aplicativo real, isso viria de uma sessão/contexto de autenticação
  const currentUser = await getSimulatedCurrentUser();
  const userRole = currentUser?.role || "USER";

  const navItems = [
    ...navItemsBase,
    ...adminNavItems.filter(item => item.roles.includes(userRole)),
  ];

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
             {/* Link de Admin Panel Condicional (Exemplo mais direto) */}
             {userRole === 'ADMIN' && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={{ children: "Admin Settings", className: "group-data-[collapsible=icon]:block hidden" }}
                >
                  <Link href="/app/admin/settings">
                    <ShieldCheck />
                    <span>Admin Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
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
        <AppHeader pageTitle={pageTitle} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
