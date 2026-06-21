"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If auth verification finished and user is not present, redirect to login
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          {/* Animated Spinner with primary theme */}
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <span className="text-sm font-semibold text-muted-foreground animate-pulse">
            Verifying Credentials...
          </span>
        </div>
      </div>
    );
  }

  // If user session loading completed and user is not verified, return empty container to prevent flickering while redirecting
  if (!user && pathname !== "/login") {
    return <div className="min-h-screen bg-background" />;
  }

  // Determine beautiful page titles depending on routes
  const getPageTitle = () => {
    if (pathname === "/") return "Overview Dashboard";
    if (pathname.startsWith("/goats")) return "Goat & Breeding Stock Management";
    if (pathname.startsWith("/chickens")) return "Chicken & Egg Inventory";
    if (pathname.startsWith("/finance")) return "Financial Ledger & Cash Book";
    if (pathname.startsWith("/labour")) return "Labour Management & Payroll";
    if (pathname.startsWith("/customers")) return "Customer Ledger & Accounts";
    if (pathname.startsWith("/invoices")) return "Invoice Generator & Printer";
    if (pathname.startsWith("/reports")) return "Historical Closing & Reports";
    return "Farm Management";
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex flex-1 flex-col lg:pl-72">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={getPageTitle()} />

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
