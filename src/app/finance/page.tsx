"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  Coins,
  TrendingDown,
  TrendingUp,
  Percent,
  PlusCircle,
  Calendar,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  FileText
} from "lucide-react";

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  fundingSource: string;
  notes: string | null;
}

interface Income {
  id: string;
  date: string;
  category: string;
  amount: number;
  notes: string | null;
}

interface LoanRepayment {
  id: string;
  amount: number;
  interestComponent: number;
  principalComponent: number;
  date: string;
  notes: string | null;
}

interface LoanUtilization {
  id: string;
  amount: number;
  purpose: string;
  date: string;
}

interface Loan {
  id: string;
  provider: string;
  totalAmount: number;
  interestRate: number;
  receivedDate: string;
  notes: string | null;
  repayments: LoanRepayment[];
  utilizations: LoanUtilization[];
}

export default function FinancePage() {
  const { user } = useAuth();
  const role = user?.role || "STAFF";
  const isAuthorized = role === "ADMIN" || role === "ACCOUNTANT";

  const [activeTab, setActiveTab] = useState<"ledger" | "loans">("ledger");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  
  const [loanSummary, setLoanSummary] = useState({
    totalReceived: 0,
    totalUsed: 0,
    totalRepaid: 0,
    remainingLoan: 0,
    remainingCash: 0,
  });

  const [ledgerSummary, setLedgerSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netPosition: 0,
  });

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // INCOME or EXPENSE

  const [loading, setLoading] = useState(true);

  // Modals state
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [isUtilizeModalOpen, setIsUtilizeModalOpen] = useState(false);

  // Single Action Selected Loan
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Form Fields State
  const [incomeForm, setIncomeForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "OTHER",
    amount: "5000",
    notes: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "FEED",
    amount: "10000",
    fundingSource: "PERSONAL",
    loanId: "",
    notes: "",
  });

  const [loanForm, setLoanForm] = useState({
    provider: "",
    totalAmount: "100000",
    interestRate: "7.5",
    receivedDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [repayForm, setRepayForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "10000",
    interestComponent: "1500",
    principalComponent: "8500",
    notes: "",
  });

  const [utilizeForm, setUtilizeForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "5000",
    purpose: "",
  });

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const lRes = await fetch("/api/loans");
      if (lRes.ok) {
        const data = await lRes.json();
        setLoans(data.loans);
        setLoanSummary(data.summary);
        if (data.loans.length > 0) {
          setExpenseForm((prev) => ({ ...prev, loanId: data.loans[0].id }));
        }
      }

      const fRes = await fetch("/api/finance");
      if (fRes.ok) {
        const data = await fRes.json();
        setExpenses(data.expenses);
        setIncomes(data.incomes);
        setLedgerSummary({
          totalIncome: data.summary.totalIncome,
          totalExpense: data.summary.totalExpense,
          netPosition: data.summary.netPosition,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchFinanceData();
    }
  }, [isAuthorized]);

  // Combined and sorted transactions list for Cash Book
  const combinedTransactions = [
    ...incomes.map((i) => ({ ...i, type: "INCOME" })),
    ...expenses.map((e) => ({ ...e, type: "EXPENSE" })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter transactions
  const filteredTransactions = combinedTransactions.filter((t) => {
    const matchesType = typeFilter ? t.type === typeFilter : true;
    const matchesCategory = categoryFilter ? t.category === categoryFilter : true;
    return matchesType && matchesCategory;
  });

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_income",
          ...incomeForm,
        }),
      });
      if (res.ok) {
        setIsIncomeModalOpen(false);
        setIncomeForm((prev) => ({ ...prev, notes: "" }));
        fetchFinanceData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to record income");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_expense",
          ...expenseForm,
        }),
      });
      if (res.ok) {
        setIsExpenseModalOpen(false);
        setExpenseForm((prev) => ({ ...prev, notes: "" }));
        fetchFinanceData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to record expense");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          ...loanForm,
        }),
      });
      if (res.ok) {
        setIsLoanModalOpen(false);
        setLoanForm((prev) => ({ ...prev, provider: "", notes: "" }));
        fetchFinanceData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create loan");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "repay",
          loanId: selectedLoan.id,
          ...repayForm,
        }),
      });
      if (res.ok) {
        setIsRepayModalOpen(false);
        setSelectedLoan(null);
        setRepayForm((prev) => ({ ...prev, notes: "" }));
        fetchFinanceData();
      } else {
        const err = await res.json();
        alert(err.error || "Repayment failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUtilizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "utilize",
          loanId: selectedLoan.id,
          ...utilizeForm,
        }),
      });
      if (res.ok) {
        setIsUtilizeModalOpen(false);
        setSelectedLoan(null);
        setUtilizeForm((prev) => ({ ...prev, purpose: "" }));
        fetchFinanceData();
      } else {
        const err = await res.json();
        alert(err.error || "Utilization failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthorized) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center text-center">
          <div className="max-w-md p-6 bg-card border border-border rounded-2xl shadow-sm">
            <Coins className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">Access Restricted</h3>
            <p className="text-xs text-muted-foreground mt-1">
              You do not have permission to view the financial ledgers. This section is restricted to Admin and Accountant roles.
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
            <span className="text-sm text-muted-foreground font-semibold">Loading Financial Records...</span>
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
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "ledger" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Cash Book Ledger
          </button>
          <button
            onClick={() => setActiveTab("loans")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "loans" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Loan Management & Debt
          </button>
        </div>

        {/* Tab 1: Cash Ledger */}
        {activeTab === "ledger" && (
          <div className="space-y-6">
            
            {/* Cash Summary Panel */}
            <div className="grid gap-4 grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
                  Total Cash In
                </span>
                <span className="block text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  ₹{ledgerSummary.totalIncome.toLocaleString()}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
                  Total Cash Out
                </span>
                <span className="block text-lg md:text-xl font-bold text-destructive mt-1">
                  ₹{ledgerSummary.totalExpense.toLocaleString()}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Net Cash Position
                </span>
                <span className={`block text-lg md:text-xl font-bold mt-1 ${ledgerSummary.netPosition >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                  ₹{ledgerSummary.netPosition.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Filter and Add Toolbar */}
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                >
                  <option value="">All Transactions</option>
                  <option value="INCOME">Income Only</option>
                  <option value="EXPENSE">Expense Only</option>
                </select>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                >
                  <option value="">All Categories</option>
                  {/* Income Categories */}
                  <option value="GOAT_SALE">Goat Sales</option>
                  <option value="CHICKEN_SALE">Chicken Sales</option>
                  <option value="KID_SALE">Kid Sales</option>
                  <option value="EGG_SALE">Egg Sales</option>
                  {/* Expense Categories */}
                  <option value="FEED">Feed Purchases</option>
                  <option value="MEDICINE">Medicines & Vaccines</option>
                  <option value="SALARY">Labour Salaries</option>
                  <option value="EQUIPMENT">Equipment Purchases</option>
                  <option value="MAINTENANCE">Farm Maintenance</option>
                  <option value="UTILITY">Utility Bills</option>
                  <option value="TRANSPORT">Transportation</option>
                  <option value="PERSONAL">Personal Draw / Investment</option>
                  <option value="OTHER">Other Ledger Entries</option>
                </select>

              </div>

              {/* Add Entry Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsIncomeModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Record Income
                </button>
                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-destructive px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90 transition-all shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Record Expense
                </button>
              </div>
            </div>

            {/* Transactions Ledger table */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full border-collapse text-left text-xs text-foreground">
                <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Amount (₹)</th>
                    <th className="px-4 py-3">Funding Source</th>
                    <th className="px-4 py-3">Notes / Narration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-medium">
                        No transactions found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => {
                      const isIncome = t.type === "INCOME";
                      return (
                        <tr key={t.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 font-semibold">{new Date(t.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isIncome ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium uppercase tracking-wider text-[10px]">{t.category}</td>
                          <td className={`px-4 py-3 font-bold ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                            {isIncome ? "+" : "-"} ₹{t.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-semibold uppercase text-[10px]">
                            {(t as any).fundingSource || "PERSONAL"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-medium">{t.notes || "-"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 2: Loan Manager */}
        {activeTab === "loans" && (
          <div className="space-y-6">
            
            {/* Debt Widgets Panel */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Borrowed</span>
                <span className="block text-lg md:text-xl font-bold mt-1">₹{loanSummary.totalReceived.toLocaleString()}</span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Repaid</span>
                <span className="block text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  ₹{loanSummary.totalRepaid.toLocaleString()}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding Debt</span>
                <span className="block text-lg md:text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                  ₹{loanSummary.remainingLoan.toLocaleString()}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unused Loan Cash</span>
                <span className="block text-lg md:text-xl font-bold text-primary mt-1">
                  ₹{loanSummary.remainingCash.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end rounded-xl border border-border bg-card p-4 shadow-sm">
              <button
                onClick={() => setIsLoanModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Setup New Loan Account
              </button>
            </div>

            {/* Loan Accounts List */}
            <div className="grid gap-6 md:grid-cols-2">
              {loans.length === 0 ? (
                <div className="col-span-2 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground font-medium">
                  No bank loans configured.
                </div>
              ) : (
                loans.map((loan) => {
                  const used = loan.utilizations.reduce((acc, u) => acc + u.amount, 0);
                  const repaid = loan.repayments.reduce((acc, r) => acc + r.amount, 0);
                  const debt = loan.totalAmount - repaid;
                  
                  return (
                    <div key={loan.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col justify-between">
                      {/* Header */}
                      <div className="border-b border-border bg-secondary/30 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{loan.provider}</h4>
                            <span className="block text-[10px] text-muted-foreground mt-0.5">
                              Rate: <span className="font-bold text-foreground">{loan.interestRate}% P.A.</span> | Received: {new Date(loan.receivedDate).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="inline-block bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[11px]">
                            ₹{loan.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Info body */}
                      <div className="p-4 space-y-4 text-xs">
                        {/* Utilization Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                            <span>Utilized: ₹{used.toLocaleString()}</span>
                            <span>Remaining Cash: ₹{(loan.totalAmount - used).toLocaleString()}</span>
                          </div>
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.min(100, (used / loan.totalAmount) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Repayment Stats */}
                        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
                          <div>
                            <span className="block text-[10px] text-muted-foreground font-medium">Total Repaid</span>
                            <span className="block font-bold text-emerald-600 mt-0.5">₹{repaid.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-muted-foreground font-medium">Outstanding</span>
                            <span className="block font-bold text-red-600 mt-0.5">₹{debt.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setIsRepayModalOpen(true);
                              }}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-semibold hover:bg-emerald-700 self-center"
                            >
                              Repay
                            </button>
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setIsUtilizeModalOpen(true);
                              }}
                              className="px-2 py-1 bg-secondary border border-border text-foreground rounded text-[10px] font-semibold hover:bg-muted self-center"
                            >
                              Utilize
                            </button>
                          </div>
                        </div>

                        {/* Logs section */}
                        <div className="border-t border-border pt-3 space-y-2">
                          <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Repayments & Utilizations history</span>
                          <div className="max-h-[120px] overflow-y-auto space-y-1 pr-1">
                            {/* Repayments list */}
                            {loan.repayments.map((r) => (
                              <div key={r.id} className="flex justify-between items-center text-[10px] bg-emerald-500/5 border border-emerald-500/10 rounded px-2 py-1">
                                <span className="font-semibold text-emerald-600">Repayment (P: ₹{r.principalComponent}, I: ₹{r.interestComponent})</span>
                                <span className="text-muted-foreground">{new Date(r.date).toLocaleDateString()}</span>
                              </div>
                            ))}
                            {/* Utilizations list */}
                            {loan.utilizations.map((u) => (
                              <div key={u.id} className="flex justify-between items-center text-[10px] bg-primary/5 border border-primary/10 rounded px-2 py-1">
                                <span className="font-semibold text-primary truncate max-w-[160px]">{u.purpose}</span>
                                <span className="font-bold text-destructive">- ₹{u.amount.toLocaleString()}</span>
                              </div>
                            ))}
                            {loan.repayments.length === 0 && loan.utilizations.length === 0 && (
                              <span className="block text-center text-[10px] text-muted-foreground">No ledger history.</span>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* MODAL 1: Record Income */}
        {isIncomeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-foreground mb-4">Record Direct Income Entry</h3>
              <form onSubmit={handleIncomeSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Income Date</label>
                    <input
                      type="date"
                      required
                      value={incomeForm.date}
                      onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Income Category</label>
                    <select
                      value={incomeForm.category}
                      onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    >
                      <option value="PERSONAL">Personal Sales</option>
                      <option value="OTHER">Other Inflows</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Income Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={incomeForm.amount}
                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Income Notes / Reference</label>
                  <textarea
                    placeholder="Provide details..."
                    value={incomeForm.notes}
                    onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground h-16"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsIncomeModalOpen(false)}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700 shadow"
                  >
                    Save Income
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Record Expense */}
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-foreground mb-4">Record Direct Expense Entry</h3>
              <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Expense Date</label>
                    <input
                      type="date"
                      required
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Expense Category</label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    >
                      <option value="FEED">Feed Expenses</option>
                      <option value="MEDICINE">Medicine & Vaccines</option>
                      <option value="MAINTENANCE">Farm Maintenance</option>
                      <option value="UTILITY">Utility Bills</option>
                      <option value="TRANSPORT">Transportation</option>
                      <option value="PERSONAL">Personal Expenses</option>
                      <option value="OTHER">Other Expenses</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Expense Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Funding Source</label>
                    <select
                      value={expenseForm.fundingSource}
                      onChange={(e) => setExpenseForm({ ...expenseForm, fundingSource: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    >
                      <option value="PERSONAL">Personal cash</option>
                      <option value="LOAN">Bank Loan</option>
                    </select>
                  </div>
                  {expenseForm.fundingSource === "LOAN" && (
                    <div className="space-y-1.5">
                      <label className="font-semibold text-muted-foreground">Select Loan Account</label>
                      <select
                        value={expenseForm.loanId}
                        onChange={(e) => setExpenseForm({ ...expenseForm, loanId: e.target.value })}
                        className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                      >
                        {loans.map((l) => (
                          <option key={l.id} value={l.id}>{l.provider}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Narration / Notes</label>
                  <textarea
                    placeholder="Provide details..."
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground h-16"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-destructive px-4 py-2 text-white font-semibold hover:bg-destructive/90"
                  >
                    Save Expense
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: Setup Loan Account */}
        {isLoanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-foreground mb-4">Setup New Loan Account</h3>
              <form onSubmit={handleLoanSubmit} className="space-y-4 text-xs">
                
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Bank Provider Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. State Bank Agricultural Loan"
                    value={loanForm.provider}
                    onChange={(e) => setLoanForm({ ...loanForm, provider: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Loan Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={loanForm.totalAmount}
                      onChange={(e) => setLoanForm({ ...loanForm, totalAmount: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Interest Rate (% P.A.)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={loanForm.interestRate}
                      onChange={(e) => setLoanForm({ ...loanForm, interestRate: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Received Date</label>
                  <input
                    type="date"
                    required
                    value={loanForm.receivedDate}
                    onChange={(e) => setLoanForm({ ...loanForm, receivedDate: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Loan Details / Notes</label>
                  <textarea
                    placeholder="Provide details..."
                    value={loanForm.notes}
                    onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground h-16"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsLoanModalOpen(false)}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-primary px-4 py-2 text-primary-foreground font-semibold hover:bg-primary/95"
                  >
                    Setup Account
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: Log Loan Repayment */}
        {isRepayModalOpen && selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-foreground mb-2">Record Repayment</h3>
              <p className="text-[11px] text-muted-foreground mb-4">
                Repaying loan from <span className="font-bold text-foreground">{selectedLoan.provider}</span>. Outstanding debt: ₹{(selectedLoan.totalAmount - selectedLoan.repayments.reduce((acc, r) => acc + r.amount, 0)).toLocaleString()}.
              </p>
              <form onSubmit={handleRepaySubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Repayment Date</label>
                    <input
                      type="date"
                      required
                      value={repayForm.date}
                      onChange={(e) => setRepayForm({ ...repayForm, date: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Total Paid (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={repayForm.amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRepayForm({
                          ...repayForm,
                          amount: val,
                          principalComponent: val, // Default all to principal
                          interestComponent: "0",
                        });
                      }}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Principal Component (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={repayForm.principalComponent}
                      onChange={(e) => {
                        const p = parseFloat(e.target.value || "0");
                        const tot = parseFloat(repayForm.amount || "0");
                        setRepayForm({
                          ...repayForm,
                          principalComponent: e.target.value,
                          interestComponent: String(Math.max(0, tot - p)),
                        });
                      }}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Interest Component (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={repayForm.interestComponent}
                      onChange={(e) => {
                        const i = parseFloat(e.target.value || "0");
                        const tot = parseFloat(repayForm.amount || "0");
                        setRepayForm({
                          ...repayForm,
                          interestComponent: e.target.value,
                          principalComponent: String(Math.max(0, tot - i)),
                        });
                      }}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Repayment Notes</label>
                  <textarea
                    placeholder="Provide details..."
                    value={repayForm.notes}
                    onChange={(e) => setRepayForm({ ...repayForm, notes: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground h-16"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRepayModalOpen(false);
                      setSelectedLoan(null);
                    }}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700"
                  >
                    Log Repayment
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 5: Log Loan Utilization */}
        {isUtilizeModalOpen && selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-foreground mb-2">Record Loan Utilization</h3>
              <p className="text-[11px] text-muted-foreground mb-4">
                Charging spent amount to <span className="font-bold text-foreground">{selectedLoan.provider}</span>. Available credit: ₹{(selectedLoan.totalAmount - selectedLoan.utilizations.reduce((acc, u) => acc + u.amount, 0)).toLocaleString()}.
              </p>
              <form onSubmit={handleUtilizeSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Date of Usage</label>
                    <input
                      type="date"
                      required
                      value={utilizeForm.date}
                      onChange={(e) => setUtilizeForm({ ...utilizeForm, date: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Amount Spent (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={utilizeForm.amount}
                      onChange={(e) => setUtilizeForm({ ...utilizeForm, amount: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Purpose of Spending</label>
                  <textarea
                    required
                    placeholder="e.g. Purchased feed bags, deworming meds batch..."
                    value={utilizeForm.purpose}
                    onChange={(e) => setUtilizeForm({ ...utilizeForm, purpose: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground h-16"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUtilizeModalOpen(false);
                      setSelectedLoan(null);
                    }}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-primary px-4 py-2 text-primary-foreground font-semibold hover:bg-primary/95"
                  >
                    Log Utilization
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
