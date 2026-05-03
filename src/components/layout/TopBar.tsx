"use client";

import { Bell, Search, User as UserIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function TopBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Don't show topbar on the actual screen view page, portal, or login page
  if (pathname.startsWith("/screen/") || pathname === "/screen" || pathname === "/login") return null;

  return (
    <div className="h-20 w-full glassmorphism-light border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search media, screens..."
          className="w-full bg-black/20 border border-white/5 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-white placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_5px_rgba(228,0,43,0.8)]"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-white">Client Admin</p>
            <p className="text-xs text-muted-foreground">{user?.email || "admin@adcast.com"}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
