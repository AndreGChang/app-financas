
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
import { useSidebar } from "@/components/ui/sidebar"; 
import { logout } from "@/lib/actions/auth"; 
import type { User } from "@/types";

interface AppHeaderProps {
  pageTitle: string;
  currentUser: User | null;
}

export function AppHeader({ pageTitle, currentUser }: AppHeaderProps) {
  const { toggleSidebar, isMobile } = useSidebar(); 

  const handleLogout = async () => {
    await logout();
  };
  
  const getAvatarFallback = (name?: string | null) => {
    if (!name) return "ME";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                {/* Idealmente, aqui viria a URL da imagem do avatar do usuário, se existir */}
                <AvatarImage src="" alt="User avatar" data-ai-hint="person user" />
                <AvatarFallback>{getAvatarFallback(currentUser?.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser?.name || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser?.email || "No email"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled> {/* Funcionalidade de perfil não implementada */}
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled> {/* Funcionalidade de settings não implementada */}
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
