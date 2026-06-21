"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Activity,
  Egg,
  Coins,
  Users,
  FileText,
  TrendingUp,
  X,
  UserCheck
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const role = user?.role || "STAFF";

  const allLinks = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      roles: ["ADMIN", "MANAGER", "ACCOUNTANT", "STAFF"],
    },
    {
      name: "Goat Stock",
      href: "/goats",
      icon: Activity,
      roles: ["ADMIN", "MANAGER", "STAFF"],
    },
    {
      name: "Chicken & Eggs",
      href: "/chickens",
      icon: Egg,
      roles: ["ADMIN", "MANAGER", "STAFF"],
    },
    {
      name: "Finance Ledger",
      href: "/finance",
      icon: Coins,
      roles: ["ADMIN", "ACCOUNTANT"],
    },
    {
      name: "Labour (HR)",
      href: "/labour",
      icon: Users,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      name: "Customers",
      href: "/customers",
      icon: UserCheck,
      roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
    },
    {
      name: "Billing Invoices",
      href: "/invoices",
      icon: FileText,
      roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
    },
    {
      name: "Reports & Closing",
      href: "/reports",
      icon: TrendingUp,
      roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
    },
  ];

  const filteredLinks = allLinks.filter((link) => link.roles.includes(role));

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card text-card-foreground transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              F
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight">Farm</span>
              <span className="block text-xs text-muted-foreground font-medium">Operations & Accounts</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-secondary lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="border-b border-border p-4 bg-muted/10">
          <div className="flex items-center gap-3 rounded-lg bg-card border border-border p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              {user?.name?.slice(0, 2).toUpperCase() || "US"}
            </div>
            <div className="overflow-hidden">
              <span className="block truncate font-medium text-sm">{user?.name || "User"}</span>
              <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase">
                {role}
              </span>
            </div>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold"
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Icon className="h-5 w-5" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4 text-center text-xs text-muted-foreground">
          v1.0.0 &copy; 2026 Farm
        </div>
      </aside>
    </>
  );
}
