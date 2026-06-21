"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  Egg,
  TrendingDown,
  TrendingUp,
  DollarSign,
  PlusCircle,
  AlertCircle,
  Calendar,
  Layers,
  Activity,
  Coins
} from "lucide-react";

interface ChickenInventory {
  active: number;
  sold: number;
  dead: number;
}

interface ChickenPurchase {
  id: string;
  purchaseDate: string;
  supplier: string;
  quantity: number;
  totalCost: number;
  costPerChicken: number;
  fundingSource: string;
  notes: string | null;
}

interface ChickenDeath {
  id: string;
  date: string;
  quantity: number;
  costPerChicken: number;
  lossAmount: number;
  reason: string | null;
}

interface ChickenSale {
  id: string;
  date: string;
  customerName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  profit: number;
  paymentMethod: string;
  paymentStatus: string;
}

interface EggProduction {
  id: string;
  date: string;
  totalProduced: number;
  damaged: number;
  sold: number;
}

interface EggSale {
  id: string;
  date: string;
  customerName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
}

interface Loan {
  id: string;
  provider: string;
  totalAmount: number;
}

export default function ChickensPage() {
  const { user } = useAuth();
  const role = user?.role || "STAFF";
  const canEdit = role === "ADMIN" || role === "MANAGER";

  const [activeTab, setActiveTab] = useState<"inventory" | "eggs" | "purchases" | "sales">("inventory");
  const [inventory, setInventory] = useState<ChickenInventory>({ active: 0, sold: 0, dead: 0 });
  const [purchases, setPurchases] = useState<ChickenPurchase[]>([]);
  const [deaths, setDeaths] = useState<ChickenDeath[]>([]);
  const [chickenSales, setChickenSales] = useState<ChickenSale[]>([]);
  const [eggLogs, setEggLogs] = useState<EggProduction[]>([]);
  const [eggSales, setEggSales] = useState<EggSale[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);

  const [loading, setLoading] = useState(true);

  // Modals state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isDeathModalOpen, setIsDeathModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isEggLogModalOpen, setIsEggLogModalOpen] = useState(false);
  const [isEggSaleModalOpen, setIsEggSaleModalOpen] = useState(false);

  // Form Fields State
  const [purchaseForm, setPurchaseForm] = useState({
    purchaseDate: new Date().toISOString().split("T")[0],
    supplier: "",
    quantity: "100",
    totalCost: "8000",
    fundingSource: "PERSONAL",
    loanId: "",
    notes: "",
  });

  const [deathForm, setDeathForm] = useState({
    date: new Date().toISOString().split("T")[0],
    quantity: "5",
    reason: "",
  });

  const [saleForm, setSaleForm] = useState({
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    quantity: "50",
    unitPrice: "120",
    paymentMethod: "CASH",
    paymentStatus: "PAID",
    notes: "",
  });

  const [eggLogForm, setEggLogForm] = useState({
    date: new Date().toISOString().split("T")[0],
    totalProduced: "80",
    damaged: "2",
  });

  const [eggSaleForm, setEggSaleForm] = useState({
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    quantity: "60",
    unitPrice: "6",
    paymentMethod: "CASH",
    paymentStatus: "PAID",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const cRes = await fetch("/api/chickens");
      if (cRes.ok) {
        const data = await cRes.json();
        setInventory(data.inventory);
        setPurchases(data.purchases);
        setDeaths(data.deaths);
        setChickenSales(data.sales);
      }

      const eRes = await fetch("/api/eggs");
      if (eRes.ok) {
        const data = await eRes.json();
        setEggLogs(data.logs);
        setEggSales(data.sales);
      }

      const lRes = await fetch("/api/loans");
      if (lRes.ok) {
        const data = await lRes.json();
        setLoans(data.loans);
        if (data.loans.length > 0) {
          setPurchaseForm((prev) => ({ ...prev, loanId: data.loans[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Form handlers
  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/chickens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "purchase",
          ...purchaseForm,
        }),
      });
      if (res.ok) {
        setIsPurchaseModalOpen(false);
        setPurchaseForm((prev) => ({ ...prev, supplier: "", notes: "" }));
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Purchase failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeathSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/chickens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "die",
          ...deathForm,
        }),
      });
      if (res.ok) {
        setIsDeathModalOpen(false);
        setDeathForm((prev) => ({ ...prev, reason: "", quantity: "5" }));
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Death logging failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyVal = parseInt(saleForm.quantity);
    const unitVal = parseFloat(saleForm.unitPrice);
    const totalAmount = qtyVal * unitVal;

    try {
      const res = await fetch("/api/chickens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sell",
          ...saleForm,
          totalAmount,
        }),
      });
      if (res.ok) {
        setIsSaleModalOpen(false);
        setSaleForm((prev) => ({ ...prev, customerName: "", notes: "" }));
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Sale failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEggLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/eggs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log",
          ...eggLogForm,
        }),
      });
      if (res.ok) {
        setIsEggLogModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Log failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEggSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyVal = parseInt(eggSaleForm.quantity);
    const unitVal = parseFloat(eggSaleForm.unitPrice);
    const totalAmount = qtyVal * unitVal;

    try {
      const res = await fetch("/api/eggs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sell",
          ...eggSaleForm,
          totalAmount,
        }),
      });
      if (res.ok) {
        setIsEggSaleModalOpen(false);
        setEggSaleForm((prev) => ({ ...prev, customerName: "", notes: "" }));
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Sale failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <span className="text-sm text-muted-foreground font-semibold">Loading Coop Registry...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Tabs Bar */}
        <div className="flex border-b border-border overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "inventory" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Coop Inventory
          </button>
          <button
            onClick={() => setActiveTab("eggs")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "eggs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Egg Harvest Log
          </button>
          <button
            onClick={() => setActiveTab("purchases")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "purchases" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Chicken Purchases
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "sales" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Sales Ledger
          </button>
        </div>

        {/* Tab 1: Coop Stock Inventory */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            
            {/* Quick Summary Cards */}
            <div className="grid gap-4 grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Chickens</span>
                <span className="block text-xl md:text-2xl font-bold text-primary mt-1">{inventory.active} birds</span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sold Birds</span>
                <span className="block text-xl md:text-2xl font-bold text-muted-foreground mt-1">{inventory.sold} head</span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dead Birds</span>
                <span className="block text-xl md:text-2xl font-bold text-destructive mt-1">{inventory.dead} head</span>
              </div>
            </div>

            {/* Actions Bar */}
            {canEdit && (
              <div className="flex flex-wrap gap-2 justify-end rounded-xl border border-border bg-card p-4 shadow-sm">
                <button
                  onClick={() => setIsPurchaseModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Purchase Chicken Batch
                </button>
                <button
                  onClick={() => setIsSaleModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm"
                >
                  <DollarSign className="h-4 w-4" />
                  Log Chicken Sale
                </button>
                <button
                  onClick={() => setIsDeathModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90 transition-all shadow-sm"
                >
                  <TrendingDown className="h-4 w-4" />
                  Log Death Loss
                </button>
              </div>
            )}

            {/* Chicken Deaths Log Table */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-foreground uppercase tracking-wider">Flock Mortality Log</h3>
              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full border-collapse text-left text-xs text-foreground">
                  <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Quantity Dead</th>
                      <th className="px-4 py-3">Cost Per Chicken (₹)</th>
                      <th className="px-4 py-3">Total Financial Loss</th>
                      <th className="px-4 py-3">Mortality Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {deaths.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground font-medium">
                          No mortality losses logged.
                        </td>
                      </tr>
                    ) : (
                      deaths.map((d) => (
                        <tr key={d.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 font-semibold">{new Date(d.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-bold text-destructive">{d.quantity} birds</td>
                          <td className="px-4 py-3">₹{d.costPerChicken.toFixed(2)}</td>
                          <td className="px-4 py-3 font-bold text-destructive">₹{d.lossAmount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-muted-foreground">{d.reason || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Egg Harvest Log */}
        {activeTab === "eggs" && (
          <div className="space-y-4">
            
            {/* Eggs Actions */}
            {canEdit && (
              <div className="flex flex-wrap gap-2 justify-end rounded-xl border border-border bg-card p-4 shadow-sm">
                <button
                  onClick={() => setIsEggLogModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Log Daily Harvest
                </button>
                <button
                  onClick={() => setIsEggSaleModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm"
                >
                  <DollarSign className="h-4 w-4" />
                  Log Egg Sale
                </button>
              </div>
            )}

            {/* Daily Harvest table */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full border-collapse text-left text-xs text-foreground">
                <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Total Produced</th>
                    <th className="px-4 py-3">Damaged Eggs</th>
                    <th className="px-4 py-3">Sold Eggs</th>
                    <th className="px-4 py-3">Available Eggs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {eggLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground font-medium">
                        No egg harvests logged.
                      </td>
                    </tr>
                  ) : (
                    eggLogs.map((log) => {
                      const available = log.totalProduced - log.damaged - log.sold;
                      return (
                        <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 font-semibold">
                            {new Date(log.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-bold">{log.totalProduced} pcs</td>
                          <td className={`px-4 py-3 font-semibold ${log.damaged > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                            {log.damaged} pcs
                          </td>
                          <td className="px-4 py-3">{log.sold} pcs</td>
                          <td className="px-4 py-3 font-bold text-primary">{available} pcs</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Coop Purchases */}
        {activeTab === "purchases" && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full border-collapse text-left text-xs text-foreground">
                <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Purchase Date</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Total Cost</th>
                    <th className="px-4 py-3">Cost Per Bird</th>
                    <th className="px-4 py-3">Funding</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground font-medium">
                        No purchase records.
                      </td>
                    </tr>
                  ) : (
                    purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 font-semibold">
                          {new Date(p.purchaseDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">{p.supplier}</td>
                        <td className="px-4 py-3">{p.quantity} birds</td>
                        <td className="px-4 py-3 font-bold text-destructive">₹{p.totalCost.toLocaleString()}</td>
                        <td className="px-4 py-3">₹{p.costPerChicken.toFixed(2)}</td>
                        <td className="px-4 py-3 font-medium uppercase text-[10px]">{p.fundingSource}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.notes || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Livestock & Eggs Sales */}
        {activeTab === "sales" && (
          <div className="space-y-6">
            
            {/* Chicken Sales Log */}
            <div className="space-y-3">
              <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">Chicken Sales</h4>
              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full border-collapse text-left text-xs text-foreground">
                  <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Quantity Sold</th>
                      <th className="px-4 py-3">Unit Price (₹)</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3">Profit (₹)</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {chickenSales.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground font-medium">
                          No chicken sales.
                        </td>
                      </tr>
                    ) : (
                      chickenSales.map((s) => (
                        <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 font-semibold">{new Date(s.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">{s.customerName}</td>
                          <td className="px-4 py-3">{s.quantity} birds</td>
                          <td className="px-4 py-3">₹{s.unitPrice}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600">₹{s.totalAmount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-emerald-500 font-semibold">₹{s.profit.toLocaleString()}</td>
                          <td className="px-4 py-3 uppercase text-[10px]">{s.paymentMethod}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${s.paymentStatus === "PAID" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                              {s.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Egg Sales Log */}
            <div className="space-y-3">
              <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">Egg Sales</h4>
              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full border-collapse text-left text-xs text-foreground">
                  <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Quantity Sold</th>
                      <th className="px-4 py-3">Unit Price (₹)</th>
                      <th className="px-4 py-3">Total Revenue</th>
                      <th className="px-4 py-3">Payment Method</th>
                      <th className="px-4 py-3">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {eggSales.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground font-medium">
                          No egg sales.
                        </td>
                      </tr>
                    ) : (
                      eggSales.map((s) => (
                        <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 font-semibold">{new Date(s.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">{s.customerName}</td>
                          <td className="px-4 py-3">{s.quantity} pcs</td>
                          <td className="px-4 py-3">₹{s.unitPrice}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600">₹{s.totalAmount.toLocaleString()}</td>
                          <td className="px-4 py-3 uppercase text-[10px]">{s.paymentMethod}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${s.paymentStatus === "PAID" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                              {s.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* MODAL 1: Purchase Coop Batch */}
        {isPurchaseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-foreground mb-4">Record Coop Batch Purchase</h3>
              <form onSubmit={handlePurchaseSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Purchase Date</label>
                    <input
                      type="date"
                      required
                      value={purchaseForm.purchaseDate}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Supplier</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hatchery Center"
                      value={purchaseForm.supplier}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Quantity (Birds)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={purchaseForm.quantity}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Total Cost (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={purchaseForm.totalCost}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, totalCost: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Funding Source</label>
                    <select
                      value={purchaseForm.fundingSource}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, fundingSource: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    >
                      <option value="PERSONAL">Personal cash</option>
                      <option value="LOAN">Bank Loan</option>
                    </select>
                  </div>
                  {purchaseForm.fundingSource === "LOAN" && (
                    <div className="space-y-1.5">
                      <label className="font-semibold text-muted-foreground">Select Loan Account</label>
                      <select
                        value={purchaseForm.loanId}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, loanId: e.target.value })}
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
                  <label className="font-semibold text-muted-foreground">Purchase Notes</label>
                  <textarea
                    placeholder="Batch specs (e.g. Day old broiler)..."
                    value={purchaseForm.notes}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground h-16"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsPurchaseModalOpen(false)}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-primary px-4 py-2 text-primary-foreground font-semibold hover:bg-primary/95"
                  >
                    Record Batch
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Record Chicken Death */}
        {isDeathModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-destructive mb-2 flex items-center gap-1.5">
                <AlertCircle className="h-5 w-5" />
                Log Chicken Coop Loss
              </h3>
              <p className="text-[11px] text-muted-foreground mb-4">
                Record birds death count. Loss is auto-computed based on the latest purchase cost per bird.
              </p>
              <form onSubmit={handleDeathSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Loss Date</label>
                    <input
                      type="date"
                      required
                      value={deathForm.date}
                      onChange={(e) => setDeathForm({ ...deathForm, date: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Birds Quantity</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={deathForm.quantity}
                      onChange={(e) => setDeathForm({ ...deathForm, quantity: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Cause / Symptoms</label>
                  <textarea
                    required
                    placeholder="Describe e.g. Heat stress, viral outbreak..."
                    value={deathForm.reason}
                    onChange={(e) => setDeathForm({ ...deathForm, reason: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground h-16"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsDeathModalOpen(false)}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-destructive px-4 py-2 text-white font-semibold hover:bg-destructive/90"
                  >
                    Record Loss
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: Chicken Sale */}
        {isSaleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-foreground mb-4">Record Chicken Sale</h3>
              <form onSubmit={handleSaleSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Sale Date</label>
                    <input
                      type="date"
                      required
                      value={saleForm.date}
                      onChange={(e) => setSaleForm({ ...saleForm, date: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Customer Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Central Market Poultry"
                      value={saleForm.customerName}
                      onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Quantity Sold</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={saleForm.quantity}
                      onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Unit Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={saleForm.unitPrice}
                      onChange={(e) => setSaleForm({ ...saleForm, unitPrice: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Payment Method</label>
                    <select
                      value={saleForm.paymentMethod}
                      onChange={(e) => setSaleForm({ ...saleForm, paymentMethod: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">UPI/Bank</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Payment Status</label>
                    <select
                      value={saleForm.paymentStatus}
                      onChange={(e) => setSaleForm({ ...saleForm, paymentStatus: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    >
                      <option value="PAID">Paid / Cleared</option>
                      <option value="PENDING">Pending / Due</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsSaleModalOpen(false)}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700"
                  >
                    Record Sale (₹{(parseInt(saleForm.quantity || "0") * parseFloat(saleForm.unitPrice || "0")).toLocaleString()})
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: Log Egg Production */}
        {isEggLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-foreground mb-4">Log Daily Egg Production</h3>
              <form onSubmit={handleEggLogSubmit} className="space-y-4 text-xs">
                
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Production Date</label>
                  <input
                    type="date"
                    required
                    value={eggLogForm.date}
                    onChange={(e) => setEggLogForm({ ...eggLogForm, date: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Total Produced</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={eggLogForm.totalProduced}
                      onChange={(e) => setEggLogForm({ ...eggLogForm, totalProduced: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Damaged Eggs</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={eggLogForm.damaged}
                      onChange={(e) => setEggLogForm({ ...eggLogForm, damaged: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEggLogModalOpen(false)}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-primary px-4 py-2 text-primary-foreground font-semibold hover:bg-primary/95"
                  >
                    Log Production
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 5: Log Egg Sale */}
        {isEggSaleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-foreground mb-4">Record Egg Sale</h3>
              <form onSubmit={handleEggSaleSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Sale Date</label>
                    <input
                      type="date"
                      required
                      value={eggSaleForm.date}
                      onChange={(e) => setEggSaleForm({ ...eggSaleForm, date: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Customer Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Local Bakery Shop"
                      value={eggSaleForm.customerName}
                      onChange={(e) => setEggSaleForm({ ...eggSaleForm, customerName: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Quantity Sold (Pcs)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={eggSaleForm.quantity}
                      onChange={(e) => setEggSaleForm({ ...eggSaleForm, quantity: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Unit Price per Egg (₹)</label>
                    <input
                      type="number"
                      required
                      min="0.1"
                      step="0.01"
                      value={eggSaleForm.unitPrice}
                      onChange={(e) => setEggSaleForm({ ...eggSaleForm, unitPrice: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Payment Method</label>
                    <select
                      value={eggSaleForm.paymentMethod}
                      onChange={(e) => setEggSaleForm({ ...eggSaleForm, paymentMethod: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">UPI/Bank</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Payment Status</label>
                    <select
                      value={eggSaleForm.paymentStatus}
                      onChange={(e) => setEggSaleForm({ ...eggSaleForm, paymentStatus: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    >
                      <option value="PAID">Paid / Cleared</option>
                      <option value="PENDING">Pending / Balance Due</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEggSaleModalOpen(false)}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700"
                  >
                    Record Sale (₹{(parseInt(eggSaleForm.quantity || "0") * parseFloat(eggSaleForm.unitPrice || "0")).toLocaleString()})
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
