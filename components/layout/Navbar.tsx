"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Activity, History, LogOut, User } from "lucide-react";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold text-foreground">SymptomAI</span>
        </Link>

        {isAuthenticated && (
          <nav className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Check Symptoms</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </Link>
            </Button>
            <div className="ml-2 flex items-center gap-2 border-l border-border pl-4">
              <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                <User className="h-4 w-4" />
                <span>{user?.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
