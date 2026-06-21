"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  FileDown,
  Lock,
  Calendar,
  Layers,
  Archive,
  TrendingUp,
  TrendingDown,
  Coins,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

interface ClosingLog {
  id: string;
  type: string;
  closeDate: string;
  periodLabel: string;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  loanBalance: number;
  inventorySummary: string;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const role = user?.role || "STAFF";
  const canClose = role === "ADMIN" || role === "MANAGER";
  const canSeeFinance = role === "ADMIN" || role === "ACCOUNTANT";

  const [activeTab, setActiveTab] = useState<"monthly" | "yearly" | "archives">("monthly");

  // Date selections
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Ledger data
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [deathLosses, setDeathLosses] = useState<number>(0);
  const [archives, setArchives] = useState<ClosingLog[]>([]);

  const [loading, setLoading] = useState(true);

  // Modal State
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [closeType, setCloseType] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  const fetchData = async () => {
    setLoading(true);
    try {
      const fRes = await fetch("/api/finance");
      if (fRes.ok) {
        const data = await fRes.json();
        setIncomes(data.incomes);
        setExpenses(data.expenses);
        setDeathLosses(data.summary.goatDeathLoss + data.summary.chickenDeathLoss);
      }

      const cRes = await fetch("/api/finance/closing");
      if (cRes.ok) {
        const data = await cRes.json();
        setArchives(data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canSeeFinance) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [canSeeFinance]);

  // Filter ledgers by selected period
  const filterByPeriod = (itemDate: string) => {
    const d = new Date(itemDate);
    if (activeTab === "monthly") {
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    } else {
      return d.getFullYear() === selectedYear;
    }
  };

  const periodIncomes = incomes.filter((i) => filterByPeriod(i.date));
  const periodExpenses = expenses.filter((e) => filterByPeriod(e.date));

  // Compute breakdown totals
  const getCategoryTotal = (ledger: any[], category: string) => {
    return ledger
      .filter((item) => item.category === category)
      .reduce((acc, item) => acc + item.amount, 0);
  };

  const totalPeriodIncome = periodIncomes.reduce((acc, item) => acc + item.amount, 0);
  const totalPeriodExpense = periodExpenses.reduce((acc, item) => acc + item.amount, 0);
  const netProfitLoss = totalPeriodIncome - totalPeriodExpense;

  // Render month list helper
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = [2025, 2026, 2027, 2028];

  // Export data as Excel-compatible CSV file
  const handleExportCSV = () => {
    const periodLabel = activeTab === "monthly"
      ? `${months[selectedMonth]}_${selectedYear}`
      : `${selectedYear}`;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Farm Financial Statement - ${periodLabel}\n\n`;

    csvContent += "SUMMARY METRICS\n";
    csvContent += `Total Revenue,INR ${totalPeriodIncome.toFixed(2)}\n`;
    csvContent += `Total Expense,INR ${totalPeriodExpense.toFixed(2)}\n`;
    csvContent += `Net Cash Profit/Loss,INR ${netProfitLoss.toFixed(2)}\n\n`;

    csvContent += "REVENUE BREAKDOWN\n";
    csvContent += "Category,Amount (INR)\n";
    csvContent += `Goat Sales,${getCategoryTotal(periodIncomes, "GOAT_SALE").toFixed(2)}\n`;
    csvContent += `Chicken Sales,${getCategoryTotal(periodIncomes, "CHICKEN_SALE").toFixed(2)}\n`;
    csvContent += `Kid Sales,${getCategoryTotal(periodIncomes, "KID_SALE").toFixed(2)}\n`;
    csvContent += `Egg Sales,${getCategoryTotal(periodIncomes, "EGG_SALE").toFixed(2)}\n`;
    csvContent += `Personal Inflow,${getCategoryTotal(periodIncomes, "PERSONAL").toFixed(2)}\n`;
    csvContent += `Other Income,${getCategoryTotal(periodIncomes, "OTHER").toFixed(2)}\n\n`;

    csvContent += "EXPENSE BREAKDOWN\n";
    csvContent += "Category,Amount (INR)\n";
    csvContent += `Feed Expenses,${getCategoryTotal(periodExpenses, "FEED").toFixed(2)}\n`;
    csvContent += `Medicine Expenses,${getCategoryTotal(periodExpenses, "MEDICINE").toFixed(2)}\n`;
    csvContent += `Labour Salary,${getCategoryTotal(periodExpenses, "SALARY").toFixed(2)}\n`;
    csvContent += `Equipment Purchases,${getCategoryTotal(periodExpenses, "EQUIPMENT").toFixed(2)}\n`;
    csvContent += `Farm Maintenance,${getCategoryTotal(periodExpenses, "MAINTENANCE").toFixed(2)}\n`;
    csvContent += `Utility Bills,${getCategoryTotal(periodExpenses, "UTILITY").toFixed(2)}\n`;
    csvContent += `Transportation,${getCategoryTotal(periodExpenses, "TRANSPORT").toFixed(2)}\n`;
    csvContent += `Personal Draw,${getCategoryTotal(periodExpenses, "PERSONAL").toFixed(2)}\n`;
    csvContent += `Other Expenses,${getCategoryTotal(periodExpenses, "OTHER").toFixed(2)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Farm_Statement_${periodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClosePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const date = new Date(selectedYear, closeType === "MONTHLY" ? selectedMonth : 0, 15);

    try {
      const res = await fetch("/api/finance/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: closeType,
          date: date.toISOString(),
        }),
      });
      if (res.ok) {
        setIsClosingModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Closing period failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!canSeeFinance) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center text-center">
          <div className="max-w-md p-6 bg-card border border-border rounded-2xl shadow-sm">
            <Archive className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">Access Restricted</h3>
            <p className="text-xs text-muted-foreground mt-1">
              You do not have permission to view the Financial Statements & Closing archives. Restricted to Admin and Accountant roles.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <span className="text-sm text-muted-foreground font-semibold">Compiling Financial Reports...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Tab Headers */}
        <div className="flex border-b border-border gap-2">
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === "monthly" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            Monthly Reports
          </button>
          <button
            onClick={() => setActiveTab("yearly")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === "yearly" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            Yearly Reports
          </button>
          <button
            onClick={() => setActiveTab("archives")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === "archives" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            Closing Logs Archive
          </button>
        </div>

        {/* Filters and Actions Bar (Hidden on Archives tab) */}
        {activeTab !== "archives" && (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between text-xs">
            <div className="flex flex-wrap items-center gap-2">

              {/* Month Selector */}
              {activeTab === "monthly" && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="rounded border border-border bg-card px-2.5 py-1.5 outline-none focus:border-primary text-foreground font-medium"
                >
                  {months.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
              )}

              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="rounded border border-border bg-card px-2.5 py-1.5 outline-none focus:border-primary text-foreground font-medium"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-1.5 font-semibold hover:bg-secondary transition-all"
              >
                <FileDown className="h-4 w-4 text-primary" />
                Export Statement (CSV)
              </button>
              {canClose && (
                <button
                  onClick={() => {
                    setCloseType(activeTab === "monthly" ? "MONTHLY" : "YEARLY");
                    setIsClosingModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-destructive px-3.5 py-1.5 font-semibold text-white hover:bg-destructive/90 transition-all"
                >
                  <Lock className="h-4 w-4" />
                  Close Accounts Period
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 1 & 2: Statements view */}
        {activeTab !== "archives" && (
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Summary Cards */}
            <div className="lg:col-span-1 space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Statement Summary</span>

                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-muted-foreground text-xs">Total Inflow</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{totalPeriodIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <span className="text-muted-foreground text-xs">Total Outflow</span>
                  <span className="font-bold text-destructive">₹{totalPeriodExpense.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="font-semibold text-xs">Net Position</span>
                  <span className={`font-bold ${netProfitLoss >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    ₹{netProfitLoss.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Income & Expense Breakdown Details */}
            <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">

              {/* Income breakdown */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Revenue Breakdown</span>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Goat Sales</span>
                    <span className="font-semibold">₹{getCategoryTotal(periodIncomes, "GOAT_SALE").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Chicken Sales</span>
                    <span className="font-semibold">₹{getCategoryTotal(periodIncomes, "CHICKEN_SALE").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Kid Sales</span>
                    <span className="font-semibold">₹{getCategoryTotal(periodIncomes, "KID_SALE").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Egg Sales</span>
                    <span className="font-semibold">₹{getCategoryTotal(periodIncomes, "EGG_SALE").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Personal Sales</span>
                    <span className="font-semibold">₹{getCategoryTotal(periodIncomes, "PERSONAL").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Other Income</span>
                    <span className="font-semibold">₹{getCategoryTotal(periodIncomes, "OTHER").toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Expense Breakdown */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Expense Breakdown</span>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Feed Purchases</span>
                    <span className="font-semibold">₹{getCategoryTotal(periodExpenses, "FEED").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Medicines & Vaccines</span>
                    <span className="font-semibold">₹{getCategoryTotal(periodExpenses, "MEDICINE").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Labour Salary</span>
                    <span className="font-semibold">₹{getCategoryTotal(periodExpenses, "SALARY").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Equipment Purchases</span>
                    <span className="font-semibold">₹{getCategoryTotal(periodExpenses, "EQUIPMENT").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Utility Bills</span>
                    <span className="font-semibold">₹{getCategoryTotal(periodExpenses, "UTILITY").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Farm Maintenance</span>
                    <span className="font-semibold">₹{getCategoryTotal(periodExpenses, "MAINTENANCE").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Transportation</span>
                    <span className="font-semibold">₹{getCategoryTotal(periodExpenses, "TRANSPORT").toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Personal / Others</span>
                    <span className="font-semibold">₹{getCategoryTotal(periodExpenses, "PERSONAL").toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Archives List */}
        {activeTab === "archives" && (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full border-collapse text-left text-xs text-foreground">
              <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Closing Date</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Archived Revenue</th>
                  <th className="px-4 py-3">Archived Expense</th>
                  <th className="px-4 py-3">Archived Net Profit</th>
                  <th className="px-4 py-3">Loan Balance</th>
                  <th className="px-4 py-3">Flock Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {archives.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground font-medium">
                      No archived periods closed yet.
                    </td>
                  </tr>
                ) : (
                  archives.map((log) => {
                    const snap = JSON.parse(log.inventorySummary || "{}");
                    return (
                      <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 font-semibold">{new Date(log.closeDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-bold text-primary">{log.periodLabel}</td>
                        <td className="px-4 py-3 font-semibold uppercase text-[10px]">{log.type}</td>
                        <td className="px-4 py-3 text-emerald-600 font-bold">₹{log.totalIncome.toLocaleString()}</td>
                        <td className="px-4 py-3 text-destructive">₹{log.totalExpense.toLocaleString()}</td>
                        <td className={`px-4 py-3 font-bold ${log.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                          ₹{log.netProfit.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-red-500 font-semibold">₹{log.loanBalance.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            Goats: {snap.goats || 0} | Chickens: {snap.chickens || 0} | Kids: {snap.kids || 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PERIOD CLOSING CONFIRMATION MODAL */}
        {isClosingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-destructive mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-5 w-5" />
                Close accounting ledger
              </h3>
              <p className="text-[11px] text-muted-foreground mb-4">
                You are about to close the accounts for the period <span className="font-bold text-primary">{activeTab === "monthly" ? months[selectedMonth] + " " + selectedYear : selectedYear}</span>. This will archive the period's financial snapshots and inventories. Historical records will remain accessible in logs.
              </p>
              <form onSubmit={handleClosePeriodSubmit} className="space-y-4 text-xs">

                <div className="rounded-lg bg-secondary/50 border border-border p-3 text-[10px] text-muted-foreground space-y-1">
                  <div>Period Label: <span className="font-bold text-foreground">{activeTab === "monthly" ? `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}` : selectedYear}</span></div>
                  <div>Estimated Income: <span className="font-bold text-foreground">₹{totalPeriodIncome.toLocaleString()}</span></div>
                  <div>Estimated Expense: <span className="font-bold text-foreground">₹{totalPeriodExpense.toLocaleString()}</span></div>
                  <div>Estimated Net: <span className="font-bold text-foreground">₹{netProfitLoss.toLocaleString()}</span></div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsClosingModalOpen(false)}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-destructive text-white px-4 py-2 font-semibold hover:bg-destructive/90 shadow"
                  >
                    Archive & Close
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
