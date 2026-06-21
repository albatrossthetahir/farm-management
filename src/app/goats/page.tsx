"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  DollarSign,
  Heart,
  Skull,
  User,
  Activity,
  Egg,
  Coins,
  FileText,
  Calendar,
  AlertCircle
} from "lucide-react";

interface Goat {
  id: string;
  tagNumber: string;
  breed: string;
  gender: string;
  age: number;
  weight: number;
  purchaseCost: number;
  status: string;
  purchaseId: string | null;
  createdAt: string;
  purchase?: GoatPurchase | null;
  deaths?: any[];
  sales?: any[];
}

interface Kid {
  id: string;
  birthDate: string;
  motherGoatId: string | null;
  mother?: Goat | null;
  breed: string;
  gender: string;
  weight: number;
  status: string;
  purchaseCost: number;
  sale?: {
    saleAmount: number;
    customerName: string;
    date: string;
  } | null;
}

interface GoatPurchase {
  id: string;
  purchaseDate: string;
  supplier: string;
  quantity: number;
  totalCost: number;
  costPerGoat: number;
  fundingSource: string;
  notes: string | null;
}

interface GoatSale {
  id: string;
  date: string;
  customerName: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  notes: string | null;
}

interface Loan {
  id: string;
  provider: string;
  totalAmount: number;
}

export default function GoatsPage() {
  const { user } = useAuth();
  const role = user?.role || "STAFF";
  const canEdit = role === "ADMIN" || role === "MANAGER";

  const [activeTab, setActiveTab] = useState<"inventory" | "kids" | "purchases" | "sales">("inventory");
  const [goats, setGoats] = useState<Goat[]>([]);
  const [kids, setKids] = useState<Kid[]>([]);
  const [purchases, setPurchases] = useState<GoatPurchase[]>([]);
  const [sales, setSales] = useState<GoatSale[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [breedFilter, setBreedFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  const [loading, setLoading] = useState(true);

  // Modals state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isDeathModalOpen, setIsDeathModalOpen] = useState(false);
  const [isBirthModalOpen, setIsBirthModalOpen] = useState(false);
  const [isKidSaleModalOpen, setIsKidSaleModalOpen] = useState(false);

  // Selected items for bulk sales
  const [selectedGoatIds, setSelectedGoatIds] = useState<string[]>([]);
  
  // Single action items
  const [selectedGoatForDeath, setSelectedGoatForDeath] = useState<Goat | null>(null);
  const [selectedKidForSale, setSelectedKidForSale] = useState<Kid | null>(null);

  // Form Fields State
  const [purchaseForm, setPurchaseForm] = useState({
    purchaseDate: new Date().toISOString().split("T")[0],
    supplier: "",
    quantity: "5",
    totalCost: "25000",
    fundingSource: "PERSONAL",
    loanId: "",
    notes: "",
    breed: "Boer",
    gender: "DOE",
    age: "12",
    weight: "25",
  });

  const [saleForm, setSaleForm] = useState({
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    paymentMethod: "CASH",
    paymentStatus: "PAID",
    notes: "",
    salePricePerGoat: "7000",
  });

  const [deathForm, setDeathForm] = useState({
    date: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const [birthForm, setBirthForm] = useState({
    birthDate: new Date().toISOString().split("T")[0],
    motherGoatId: "",
    breed: "Boer",
    gender: "DOE",
    weight: "2.5",
  });

  const [kidSaleForm, setKidSaleForm] = useState({
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    saleAmount: "3000",
    paymentMethod: "CASH",
    paymentStatus: "PAID",
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const gRes = await fetch("/api/goats");
      if (gRes.ok) {
        const data = await gRes.json();
        setGoats(data.goats);
      }

      const kRes = await fetch("/api/kids");
      if (kRes.ok) {
        const data = await kRes.json();
        setKids(data.kids);
      }

      // Fetch loans for the purchase form dropdown
      const lRes = await fetch("/api/loans");
      if (lRes.ok) {
        const data = await lRes.json();
        setLoans(data.loans);
        if (data.loans.length > 0) {
          setPurchaseForm((prev) => ({ ...prev, loanId: data.loans[0].id }));
        }
      }

      // Extract purchases and sales from goats API metadata or fetch separately if needed
      // To keep it simple, we can retrieve them from goats include or query directly
      const pRes = await fetch("/api/goats"); // Wait, we can find unique purchases from goats, or query details
      if (pRes.ok) {
        // Find all purchases from the goats database
        const res = await fetch("/api/dashboard"); // wait, let's fetch dashboard or finance details
        // To make it simple, let's extract unique purchases and sales from our database
        // Actually, let's do a direct endpoint or extract from list:
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchasesAndSales = async () => {
    try {
      // Let's fetch finances directly to list purchases
      const fRes = await fetch("/api/finance");
      if (fRes.ok) {
        // Purchases log can also be derived, or we can fetch unique purchases
      }
      // Let's query db via custom endpoints or extract
    } catch (err) {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Goats list
  const filteredGoats = goats.filter((g) => {
    const matchesSearch = g.tagNumber.toLowerCase().includes(search.toLowerCase());
    const matchesBreed = breedFilter ? g.breed === breedFilter : true;
    const matchesStatus = statusFilter ? g.status === statusFilter : true;
    const matchesGender = genderFilter ? g.gender === genderFilter : true;
    return matchesSearch && matchesBreed && matchesStatus && matchesGender;
  });

  // Unique breeds for filter dropdown
  const uniqueBreeds = Array.from(new Set(goats.map((g) => g.breed)));

  // Form Submissions
  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/goats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "purchase",
          ...purchaseForm,
        }),
      });
      if (res.ok) {
        setIsPurchaseModalOpen(false);
        fetchData();
        // Reset form
        setPurchaseForm((prev) => ({
          ...prev,
          supplier: "",
          notes: "",
        }));
      } else {
        const err = await res.json();
        alert(err.error || "Purchase failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGoatIds.length === 0) {
      alert("Please select at least one goat to sell");
      return;
    }

    const items = selectedGoatIds.map((id) => ({
      goatId: id,
      salePrice: parseFloat(saleForm.salePricePerGoat),
    }));

    try {
      const res = await fetch("/api/goats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sell",
          customerName: saleForm.customerName,
          paymentMethod: saleForm.paymentMethod,
          paymentStatus: saleForm.paymentStatus,
          notes: saleForm.notes,
          date: saleForm.date,
          items,
        }),
      });
      if (res.ok) {
        setIsSaleModalOpen(false);
        setSelectedGoatIds([]);
        fetchData();
        setSaleForm((prev) => ({
          ...prev,
          customerName: "",
          notes: "",
        }));
      } else {
        const err = await res.json();
        alert(err.error || "Sale failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeathSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoatForDeath) return;

    try {
      const res = await fetch("/api/goats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "die",
          goatId: selectedGoatForDeath.id,
          date: deathForm.date,
          reason: deathForm.reason,
        }),
      });
      if (res.ok) {
        setIsDeathModalOpen(false);
        setSelectedGoatForDeath(null);
        setDeathForm((prev) => ({ ...prev, reason: "" }));
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to record death");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBirthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/kids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          ...birthForm,
        }),
      });
      if (res.ok) {
        setIsBirthModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Logging birth failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleKidSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKidForSale) return;

    try {
      const res = await fetch("/api/kids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sell",
          kidId: selectedKidForSale.id,
          customerName: kidSaleForm.customerName,
          saleAmount: kidSaleForm.saleAmount,
          paymentMethod: kidSaleForm.paymentMethod,
          paymentStatus: kidSaleForm.paymentStatus,
          notes: kidSaleForm.notes,
          date: kidSaleForm.date,
        }),
      });
      if (res.ok) {
        setIsKidSaleModalOpen(false);
        setSelectedKidForSale(null);
        setKidSaleForm((prev) => ({
          ...prev,
          customerName: "",
          notes: "",
        }));
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Kid sale failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGoatStatus = async (goatId: string, status: string) => {
    try {
      const res = await fetch("/api/goats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: goatId,
          status,
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSelectGoat = (id: string) => {
    setSelectedGoatIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Group items by purchases and sales for the historical tabs
  // Find all purchases referenced in goats
  const uniquePurchasedList: GoatPurchase[] = [];
  const pMap = new Map();
  goats.forEach((g) => {
    if (g.purchase && !pMap.has(g.purchase.id)) {
      pMap.set(g.purchase.id, true);
      uniquePurchasedList.push(g.purchase as unknown as GoatPurchase);
    }
  });

  // Gather unique Sales
  const uniqueSalesList: any[] = [];
  const sMap = new Map();
  goats.forEach((g) => {
    g.sales?.forEach((s: any) => {
      // s has sale details
      if (s.sale && !sMap.has(s.sale.id)) {
        sMap.set(s.sale.id, true);
        uniqueSalesList.push({
          ...s.sale,
          itemCount: goats.filter((goat) => goat.sales?.some((sl: any) => sl.saleId === s.sale.id)).length,
        });
      }
    });
  });

  // Candidate mothers (female goats that are active/breeding)
  const candidateMothers = goats.filter((g) => g.gender === "DOE" && g.status !== "SOLD" && g.status !== "DEAD");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Tabs */}
        <div className="flex border-b border-border overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "inventory" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Active Goats Stock
          </button>
          <button
            onClick={() => setActiveTab("kids")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "kids" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Kids Births (Baby Goats)
          </button>
          <button
            onClick={() => setActiveTab("purchases")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "purchases" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Purchases Log
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

        {/* Tab 1: Active Goats Inventory */}
        {activeTab === "inventory" && (
          <div className="space-y-4">
            
            {/* Filter Toolbar */}
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                
                {/* Search Box */}
                <div className="relative w-full max-w-xs">
                  <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search Tag Number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input pl-9 pr-4 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                  />
                </div>

                {/* Breed Filter */}
                <select
                  value={breedFilter}
                  onChange={(e) => setBreedFilter(e.target.value)}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                >
                  <option value="">All Breeds</option>
                  {uniqueBreeds.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                {/* Gender Filter */}
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                >
                  <option value="">All Genders</option>
                  <option value="BUCK">Buck (Male)</option>
                  <option value="DOE">Doe (Female)</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="BREEDING">Breeding</option>
                  <option value="SOLD">Sold</option>
                  <option value="DEAD">Dead</option>
                </select>

              </div>

              {/* Action Buttons */}
              {canEdit && (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedGoatIds.length > 0 && (
                    <button
                      onClick={() => setIsSaleModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition-all animate-pulse"
                    >
                      <DollarSign className="h-4 w-4" />
                      Sell Selected ({selectedGoatIds.length})
                    </button>
                  )}
                  <button
                    onClick={() => setIsPurchaseModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Purchase Batch
                  </button>
                </div>
              )}
            </div>

            {/* Goats Data Table */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full border-collapse text-left text-xs text-foreground">
                <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    {canEdit && (
                      <th className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedGoatIds.length === filteredGoats.filter(g => g.status !== "SOLD" && g.status !== "DEAD").length && filteredGoats.filter(g => g.status !== "SOLD" && g.status !== "DEAD").length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const activeIds = filteredGoats
                                .filter((g) => g.status !== "SOLD" && g.status !== "DEAD")
                                .map((g) => g.id);
                              setSelectedGoatIds(activeIds);
                            } else {
                              setSelectedGoatIds([]);
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-gray-300 accent-primary"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3">Tag Number</th>
                    <th className="px-4 py-3">Breed</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">Age (m)</th>
                    <th className="px-4 py-3">Weight (kg)</th>
                    <th className="px-4 py-3">Cost (₹)</th>
                    <th className="px-4 py-3">Status</th>
                    {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredGoats.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground font-medium">
                        No goats matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredGoats.map((goat) => {
                      const isSoldOrDead = goat.status === "SOLD" || goat.status === "DEAD";
                      return (
                        <tr
                          key={goat.id}
                          className={`hover:bg-secondary/20 transition-colors ${
                            goat.status === "DEAD" ? "bg-red-500/5 text-muted-foreground" : ""
                          }`}
                        >
                          {canEdit && (
                            <td className="px-4 py-3 text-center">
                              {!isSoldOrDead && (
                                <input
                                  type="checkbox"
                                  checked={selectedGoatIds.includes(goat.id)}
                                  onChange={() => handleToggleSelectGoat(goat.id)}
                                  className="h-3.5 w-3.5 rounded border-gray-300 accent-primary"
                                />
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3 font-semibold">{goat.tagNumber}</td>
                          <td className="px-4 py-3">{goat.breed}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${goat.gender === "BUCK" ? "bg-blue-500/10 text-blue-500" : "bg-pink-500/10 text-pink-500"}`}>
                              {goat.gender === "BUCK" ? "Buck ♂" : "Doe ♀"}
                            </span>
                          </td>
                          <td className="px-4 py-3">{goat.age}</td>
                          <td className="px-4 py-3">{goat.weight} kg</td>
                          <td className="px-4 py-3">₹{goat.purchaseCost.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                goat.status === "ACTIVE"
                                  ? "bg-primary/10 text-primary"
                                  : goat.status === "BREEDING"
                                  ? "bg-purple-500/10 text-purple-500"
                                  : goat.status === "SOLD"
                                  ? "bg-secondary-foreground/10 text-secondary-foreground/60"
                                  : "bg-destructive/10 text-destructive font-semibold"
                              }`}
                            >
                              {goat.status}
                            </span>
                          </td>
                          {canEdit && (
                            <td className="px-4 py-3 text-right">
                              {!isSoldOrDead && (
                                <div className="flex justify-end gap-1.5">
                                  {goat.status === "ACTIVE" && (
                                    <button
                                      onClick={() => handleUpdateGoatStatus(goat.id, "BREEDING")}
                                      className="rounded bg-purple-500/10 p-1 text-purple-500 hover:bg-purple-500/20"
                                      title="Mark Breeding"
                                    >
                                      <Heart className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {goat.status === "BREEDING" && (
                                    <button
                                      onClick={() => handleUpdateGoatStatus(goat.id, "ACTIVE")}
                                      className="rounded bg-primary/10 p-1 text-primary hover:bg-primary/20"
                                      title="Mark Active"
                                    >
                                      <Activity className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedGoatForDeath(goat);
                                      setIsDeathModalOpen(true);
                                    }}
                                    className="rounded bg-destructive/10 p-1 text-destructive hover:bg-destructive/20"
                                    title="Log Death"
                                  >
                                    <Skull className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Kid Births (Baby Goats) */}
        {activeTab === "kids" && (
          <div className="space-y-4">
            
            {/* Log Birth Toolbar */}
            {canEdit && (
              <div className="flex justify-end rounded-xl border border-border bg-card p-4 shadow-sm">
                <button
                  onClick={() => setIsBirthModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Log Baby Kid Birth
                </button>
              </div>
            )}

            {/* Kids List */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full border-collapse text-left text-xs text-foreground">
                <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Birth Date</th>
                    <th className="px-4 py-3">Mother Tag</th>
                    <th className="px-4 py-3">Breed</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">Birth Weight</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sale Details</th>
                    {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {kids.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground font-medium">
                        No kids births recorded yet.
                      </td>
                    </tr>
                  ) : (
                    kids.map((kid) => (
                      <tr key={kid.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 font-semibold">
                          {new Date(kid.birthDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {kid.mother?.tagNumber ? (
                            <span className="font-semibold text-primary">{kid.mother.tagNumber}</span>
                          ) : (
                            <span className="text-muted-foreground">Not logged</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{kid.breed}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${kid.gender === "BUCK" ? "bg-blue-500/10 text-blue-500" : "bg-pink-500/10 text-pink-500"}`}>
                            {kid.gender === "BUCK" ? "Male ♂" : "Female ♀"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{kid.weight} kg</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              kid.status === "GROWING"
                                ? "bg-primary/10 text-primary"
                                : kid.status === "SOLD"
                                ? "bg-secondary-foreground/10 text-secondary-foreground/60"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {kid.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {kid.status === "SOLD" && kid.sale ? (
                            <div className="text-[10px] font-medium text-muted-foreground">
                              Sold to <span className="text-foreground font-semibold">{kid.sale.customerName}</span> for <span className="text-emerald-600 font-bold">₹{kid.sale.saleAmount.toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3 text-right">
                            {kid.status === "GROWING" && (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedKidForSale(kid);
                                    setIsKidSaleModalOpen(true);
                                  }}
                                  className="rounded bg-emerald-500/10 p-1 text-emerald-500 hover:bg-emerald-500/25"
                                  title="Log Sale"
                                >
                                  <DollarSign className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Purchase Batches */}
        {activeTab === "purchases" && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full border-collapse text-left text-xs text-foreground">
                <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Total Cost</th>
                    <th className="px-4 py-3">Cost Per Goat</th>
                    <th className="px-4 py-3">Funding Source</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {uniquePurchasedList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground font-medium">
                        No bulk purchases logged.
                      </td>
                    </tr>
                  ) : (
                    uniquePurchasedList.map((p) => (
                      <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 font-semibold">
                          {new Date(p.purchaseDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">{p.supplier}</td>
                        <td className="px-4 py-3">{p.quantity} head</td>
                        <td className="px-4 py-3 font-bold text-destructive">₹{p.totalCost.toLocaleString()}</td>
                        <td className="px-4 py-3">₹{p.costPerGoat.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${p.fundingSource === "LOAN" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
                            {p.fundingSource}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{p.notes || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Sales Ledger */}
        {activeTab === "sales" && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full border-collapse text-left text-xs text-foreground">
                <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Sale Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Goats Sold</th>
                    <th className="px-4 py-3">Total Revenue</th>
                    <th className="px-4 py-3">Payment Method</th>
                    <th className="px-4 py-3">Payment Status</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {uniqueSalesList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground font-medium">
                        No sales ledger entries.
                      </td>
                    </tr>
                  ) : (
                    uniqueSalesList.map((s) => (
                      <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 font-semibold">
                          {new Date(s.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">{s.customerName}</td>
                        <td className="px-4 py-3">{s.itemCount} goats</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">₹{s.totalAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 font-medium uppercase">{s.paymentMethod}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${s.paymentStatus === "PAID" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500 animate-pulse"}`}>
                            {s.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{s.notes || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL 1: Purchase Batch */}
        {isPurchaseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-bold text-foreground mb-4">Record Bulk Goat Purchase</h3>
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
                    <label className="font-semibold text-muted-foreground">Supplier Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Green Valley Breeders"
                      value={purchaseForm.supplier}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Quantity Purchased (Head)</label>
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

                <div className="border border-dashed border-border rounded p-3 bg-muted/20">
                  <span className="block font-semibold text-foreground mb-2">Default Specifications (Assigned to batch)</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground uppercase font-bold">Breed</label>
                      <input
                        type="text"
                        value={purchaseForm.breed}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, breed: e.target.value })}
                        className="w-full rounded border border-border bg-input px-2 py-1 outline-none text-foreground text-[11px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground uppercase font-bold">Gender</label>
                      <select
                        value={purchaseForm.gender}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, gender: e.target.value })}
                        className="w-full rounded border border-border bg-input px-2 py-1 outline-none text-foreground text-[11px]"
                      >
                        <option value="DOE">Doe (Female)</option>
                        <option value="BUCK">Buck (Male)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground uppercase font-bold">Age (Months)</label>
                      <input
                        type="number"
                        value={purchaseForm.age}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, age: e.target.value })}
                        className="w-full rounded border border-border bg-input px-2 py-1 outline-none text-foreground text-[11px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground uppercase font-bold">Avg Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={purchaseForm.weight}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, weight: e.target.value })}
                        className="w-full rounded border border-border bg-input px-2 py-1 outline-none text-foreground text-[11px]"
                      />
                    </div>
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
                      <option value="PERSONAL">Personal Investment</option>
                      <option value="LOAN">Bank Loan</option>
                      <option value="MIXED">Mixed Funding</option>
                    </select>
                  </div>
                  {(purchaseForm.fundingSource === "LOAN" || purchaseForm.fundingSource === "MIXED") && (
                    <div className="space-y-1.5">
                      <label className="font-semibold text-muted-foreground">Select Loan Account</label>
                      <select
                        value={purchaseForm.loanId}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, loanId: e.target.value })}
                        className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                      >
                        {loans.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.provider} (₹{l.totalAmount.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Purchase Notes</label>
                  <textarea
                    placeholder="Provide batch details..."
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
                    Record Purchase
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Record Goat Sale */}
        {isSaleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-foreground mb-2">Record Goat Sale</h3>
              <p className="text-[11px] text-muted-foreground mb-4">
                Selling <span className="font-bold text-primary">{selectedGoatIds.length}</span> selected goats.
              </p>
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
                      placeholder="e.g. John Doe"
                      value={saleForm.customerName}
                      onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Sale Price Per Goat (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={saleForm.salePricePerGoat}
                      onChange={(e) => setSaleForm({ ...saleForm, salePricePerGoat: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Est. Total: ₹{(parseInt(saleForm.salePricePerGoat || "0") * selectedGoatIds.length).toLocaleString()}</label>
                    <div className="rounded border border-border bg-muted/20 px-3 py-2 text-muted-foreground font-semibold text-center select-none">
                      ₹{(parseInt(saleForm.salePricePerGoat || "0") * selectedGoatIds.length).toLocaleString()}
                    </div>
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
                      <option value="BANK_TRANSFER">Bank Transfer / UPI</option>
                      <option value="CHEQUE">Cheque</option>
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
                      <option value="PENDING">Pending / Balance Due</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Sales Notes</label>
                  <textarea
                    placeholder="Provide invoice details..."
                    value={saleForm.notes}
                    onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground h-16"
                  />
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
                    className="rounded bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700 shadow"
                  >
                    Record Sale
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: Record Goat Death */}
        {isDeathModalOpen && selectedGoatForDeath && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-destructive mb-2 flex items-center gap-1.5">
                <AlertCircle className="h-5 w-5" />
                Report Goat Death
              </h3>
              <p className="text-[11px] text-muted-foreground mb-4">
                Flagging goat <span className="font-bold text-foreground">{selectedGoatForDeath.tagNumber}</span> as dead. This removes the animal from active inventory and registers a financial loss of ₹{selectedGoatForDeath.purchaseCost.toLocaleString()} (its purchase cost).
              </p>
              <form onSubmit={handleDeathSubmit} className="space-y-4 text-xs">
                
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Date of Death</label>
                  <input
                    type="date"
                    required
                    value={deathForm.date}
                    onChange={(e) => setDeathForm({ ...deathForm, date: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Reason / Symptoms</label>
                  <textarea
                    required
                    placeholder="Describe cause of death e.g. Pneumonia, fever..."
                    value={deathForm.reason}
                    onChange={(e) => setDeathForm({ ...deathForm, reason: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground h-20"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeathModalOpen(false);
                      setSelectedGoatForDeath(null);
                    }}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-destructive px-4 py-2 text-white font-semibold hover:bg-destructive/90"
                  >
                    Log Death
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: Log Kid Birth */}
        {isBirthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-foreground mb-4">Log Baby Kid Birth</h3>
              <form onSubmit={handleBirthSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Birth Date</label>
                    <input
                      type="date"
                      required
                      value={birthForm.birthDate}
                      onChange={(e) => setBirthForm({ ...birthForm, birthDate: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Mother Goat</label>
                    <select
                      value={birthForm.motherGoatId}
                      onChange={(e) => setBirthForm({ ...birthForm, motherGoatId: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    >
                      <option value="">Select Mother Tag (Optional)</option>
                      {candidateMothers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.tagNumber} ({m.breed})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Breed</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Boer"
                      value={birthForm.breed}
                      onChange={(e) => setBirthForm({ ...birthForm, breed: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Gender</label>
                    <select
                      value={birthForm.gender}
                      onChange={(e) => setBirthForm({ ...birthForm, gender: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    >
                      <option value="DOE">Doe (Female)</option>
                      <option value="BUCK">Buck (Male)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Birth Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={birthForm.weight}
                    onChange={(e) => setBirthForm({ ...birthForm, weight: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsBirthModalOpen(false)}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-primary px-4 py-2 text-primary-foreground font-semibold hover:bg-primary/95"
                  >
                    Log Birth
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 5: Sell Kid */}
        {isKidSaleModalOpen && selectedKidForSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-foreground mb-2">Sell Baby Kid</h3>
              <p className="text-[11px] text-muted-foreground mb-4">
                Selling baby kid (Breed: {selectedKidForSale.breed}, born {new Date(selectedKidForSale.birthDate).toLocaleDateString()}).
              </p>
              <form onSubmit={handleKidSaleSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Sale Date</label>
                    <input
                      type="date"
                      required
                      value={kidSaleForm.date}
                      onChange={(e) => setKidSaleForm({ ...kidSaleForm, date: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Customer Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Kumar"
                      value={kidSaleForm.customerName}
                      onChange={(e) => setKidSaleForm({ ...kidSaleForm, customerName: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Sale Amount (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={kidSaleForm.saleAmount}
                      onChange={(e) => setKidSaleForm({ ...kidSaleForm, saleAmount: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Payment Method</label>
                    <select
                      value={kidSaleForm.paymentMethod}
                      onChange={(e) => setKidSaleForm({ ...kidSaleForm, paymentMethod: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank/UPI</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Payment Status</label>
                  <select
                    value={kidSaleForm.paymentStatus}
                    onChange={(e) => setKidSaleForm({ ...kidSaleForm, paymentStatus: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  >
                    <option value="PAID">Paid / Cleared</option>
                    <option value="PENDING">Pending / Balance Due</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Sales Notes</label>
                  <textarea
                    placeholder="Provide notes..."
                    value={kidSaleForm.notes}
                    onChange={(e) => setKidSaleForm({ ...kidSaleForm, notes: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground h-16"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsKidSaleModalOpen(false);
                      setSelectedKidForSale(null);
                    }}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700"
                  >
                    Record Kid Sale
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
