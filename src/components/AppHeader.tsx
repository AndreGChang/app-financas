"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, UserCircle, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar"; // Assuming sidebar has useSidebar hook
import { logout } from "@/lib/actions/auth"; // Placeholder action

interface AppHeaderProps {
  pageTitle: string;
}

export function AppHeader({ pageTitle }: AppHeaderProps) {
  const { toggleSidebar, isMobile } = useSidebar(); // Get toggle function from sidebar context

  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      {isMobile && (
         <Button variant="outline" size="icon" className="shrink-0 md:hidden" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
      )}
      <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
      <div className="ml-auto flex items-center gap-4">
        {/* Future: Search bar or notifications */}
        {/* <Search className="h-5 w-5 text-muted-foreground" />
        <Bell className="h-5 w-5 text-muted-foreground" /> */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://placehold.co/100x100.png" alt="User avatar" data-ai-hint="person user" />
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin User</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@marketease.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={handleLogout} className="w-full">
              <Button variant="ghost" type="submit" className="w-full justify-start px-2 py-1.5 text-sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
