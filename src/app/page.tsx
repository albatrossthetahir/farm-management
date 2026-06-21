"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import {
  TrendingUp,
  TrendingDown,
  Coins,
  Shield,
  Activity,
  Egg,
  Users,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  HelpCircle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import Link from "next/link";

interface DashboardMetrics {
  totalGoats: number;
  totalChickens: number;
  totalKids: number;
  totalEggsProduced: number;
  totalSales: number;
  totalExpenses: number;
  currentProfitLoss: number;
  outstandingLoan: number;
  labourExpenses: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
}

interface ChartItem {
  name: string;
  Income: number;
  Expense: number;
  ProfitLoss: number;
  GoatsCount: number;
  ChickensCount: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setCharts(data.charts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <span className="text-sm text-muted-foreground font-semibold">Loading Dashboard Data...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Format currency helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const isPLPositive = metrics ? metrics.currentProfitLoss >= 0 : true;

  // Access control checks for card visibility
  const role = user?.role || "STAFF";
  const canSeeFinance = role === "ADMIN" || role === "ACCOUNTANT";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Welcome Section */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Hello, {user?.name || "User"}!
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">
              Here is your farm inventory and financial overview for today.
            </p>
          </div>
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {(role === "ADMIN" || role === "MANAGER") && (
              <Link
                href="/goats"
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                Manage Livestock
              </Link>
            )}
            {canSeeFinance && (
              <Link
                href="/finance"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-secondary transition-all"
              >
                <Coins className="h-4 w-4 text-primary" />
                New Expense
              </Link>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          
          {/* Total Goats */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Goats
              </span>
              <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl md:text-2xl font-bold">{metrics?.totalGoats || 0}</span>
              <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">
                Active Breeding Stock
              </span>
            </div>
          </div>

          {/* Total Chickens */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Chickens
              </span>
              <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-500">
                <Egg className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl md:text-2xl font-bold">{metrics?.totalChickens || 0}</span>
              <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">
                Flock Count in Coop
              </span>
            </div>
          </div>

          {/* Kids (Growing) */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Kids
              </span>
              <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-500">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl md:text-2xl font-bold">{metrics?.totalKids || 0}</span>
              <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">
                Growing Kids Born on Farm
              </span>
            </div>
          </div>

          {/* Eggs Produced */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Eggs Produced
              </span>
              <div className="rounded-lg bg-teal-500/10 p-1.5 text-teal-500">
                <Egg className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-xl md:text-2xl font-bold">{metrics?.totalEggsProduced || 0}</span>
              <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">
                Cumulative Egg Harvest
              </span>
            </div>
          </div>

          {/* Financial Cards (Visible to Admin/Accountant/Manager depending on access) */}
          {canSeeFinance ? (
            <>
              {/* Total Sales */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Revenue
                  </span>
                  <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-500">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(metrics?.totalSales || 0)}
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">
                    Accumulated Income
                  </span>
                </div>
              </div>

              {/* Total Expenses */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Expense
                  </span>
                  <div className="rounded-lg bg-destructive/10 p-1.5 text-destructive">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xl font-bold text-destructive">
                    {formatCurrency(metrics?.totalExpenses || 0)}
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">
                    Operating & Asset Outlays
                  </span>
                </div>
              </div>

              {/* Profit / Loss */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Net Profit / Loss
                  </span>
                  <div className={`rounded-lg p-1.5 ${isPLPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
                    {isPLPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`text-xl font-bold ${isPLPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    {formatCurrency(metrics?.currentProfitLoss || 0)}
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">
                    Net Accounting Position
                  </span>
                </div>
              </div>

              {/* Outstanding Loan */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Outstanding Debt
                  </span>
                  <div className="rounded-lg bg-red-500/10 p-1.5 text-red-500">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(metrics?.outstandingLoan || 0)}
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">
                    Remaining Loan Balance
                  </span>
                </div>
              </div>

              {/* Labour Expense */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Labour Expenses
                  </span>
                  <div className="rounded-lg bg-blue-500/10 p-1.5 text-blue-500">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xl font-bold">
                    {formatCurrency(metrics?.labourExpenses || 0)}
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">
                    Total Salary Outflow
                  </span>
                </div>
              </div>

              {/* Monthly Revenue */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Monthly Revenue
                  </span>
                  <div className="rounded-lg bg-green-500/10 p-1.5 text-green-500">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xl font-bold">
                    {formatCurrency(metrics?.monthlyRevenue || 0)}
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">
                    This Calendar Month
                  </span>
                </div>
              </div>

              {/* Yearly Revenue */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm col-span-2 md:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Yearly Revenue
                  </span>
                  <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-500">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xl font-bold">
                    {formatCurrency(metrics?.yearlyRevenue || 0)}
                  </span>
                  <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">
                    This Calendar Year
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-border border-dashed bg-muted/20 p-4 col-span-2 md:col-span-3 flex items-center justify-center text-center">
              <div className="max-w-xs py-2">
                <Coins className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-foreground">Financial summary hidden</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Financial details are accessible to Accountant and Admin roles only.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Charts Section */}
        {canSeeFinance ? (
          <div className="grid gap-6 lg:grid-cols-2">
            
            {/* Monthly Income vs Expense Bar Chart */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="font-semibold text-sm mb-4 text-foreground uppercase tracking-wider">
                Monthly Income & Expense Trend
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(Number(value)), ""]}
                      contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px" }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Profit & Loss Trend Area Chart */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="font-semibold text-sm mb-4 text-foreground uppercase tracking-wider">
                Monthly Net Profit Trend
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts}>
                    <defs>
                      <linearGradient id="colorPL" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(Number(value)), "Net Profit"]}
                      contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px" }}
                    />
                    <Area type="monotone" dataKey="ProfitLoss" stroke="#10b981" fillOpacity={1} fill="url(#colorPL)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        ) : null}

        {/* Inventory History Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* Goat Inventory Trend */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="font-semibold text-sm mb-4 text-foreground uppercase tracking-wider">
              Goat Inventory Trend (Historical)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(value: any) => [value, "Goats Count"]}
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px" }}
                  />
                  <Line type="monotone" dataKey="GoatsCount" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chicken Inventory Trend */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="font-semibold text-sm mb-4 text-foreground uppercase tracking-wider">
              Chicken Inventory Trend (Historical)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(value: any) => [value, "Chickens Count"]}
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px" }}
                  />
                  <Line type="monotone" dataKey="ChickensCount" stroke="#d97706" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
