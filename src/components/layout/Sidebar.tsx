"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, MonitorPlay, Image as ImageIcon, Settings, LogOut, Database, Zap } from "lucide-react";
import clsx from "clsx";
import { auth, subscribeToStorageUsage } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "My Screens", href: "/screens", icon: MonitorPlay },
  { name: "Media Library", href: "/library", icon: ImageIcon },
  { name: "Settings", href: "/settings", icon: Settings },
];

const MAX_STORAGE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [usedBytes, setUsedBytes] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToStorageUsage(user.uid, (bytes) => {
      setUsedBytes(bytes);
    });
    return () => unsubscribe();
  }, [user]);

  // Don't show sidebar on the actual screen view page, portal, or login page
  if (pathname.startsWith("/screen/") || pathname === "/screen" || pathname === "/login") return null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  const usagePercentage = Math.min((usedBytes / MAX_STORAGE_BYTES) * 100, 100);

  return (
    <div className="flex flex-col w-64 h-screen border-r border-border glassmorphism sticky top-0">
      <div className="flex items-center justify-center h-20 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(228,0,43,0.5)]">
            <MonitorPlay className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-wider text-white">AdCast</span>
        </div>
      </div>

      <div className="flex-1 py-8 px-4 flex flex-col gap-2 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Menu</p>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive
                  ? "bg-primary/10 text-primary shadow-[inset_0_0_10px_rgba(228,0,43,0.1)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={clsx("w-5 h-5 transition-colors", isActive ? "text-primary" : "group-hover:text-white")} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}

        <div className="mt-8 px-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Storage</p>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Database className="w-4 h-4 text-primary" />
              <span>{formatBytes(usedBytes)} / 2.00 GB</span>
            </div>
            
            <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
              <div 
                className={clsx(
                  "h-full rounded-full transition-all duration-1000",
                  usagePercentage > 90 ? "bg-red-500" : "bg-primary"
                )}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            
            <button className="w-full flex items-center justify-center gap-2 py-2 mt-2 bg-gradient-to-r from-primary to-orange-500 hover:from-primary-dark hover:to-orange-600 text-white text-xs font-bold rounded-lg transition-all shadow-[0_0_10px_rgba(228,0,43,0.3)]">
              <Zap className="w-3 h-3 fill-white" />
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5 group-hover:text-primary transition-colors" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
