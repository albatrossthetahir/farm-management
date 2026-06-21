"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  Search,
  User,
  Phone,
  MapPin,
  Coins,
  Edit2,
  Trash2,
  DollarSign,
  AlertTriangle,
  History
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
  createdAt: string;
  totalPurchases: number;
  outstandingBalance: number;
  purchaseCount: number;
}

export default function CustomersPage() {
  const { user } = useAuth();
  const role = user?.role || "STAFF";
  const canEdit = role === "ADMIN" || role === "MANAGER" || role === "ACCOUNTANT";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form Fields State
  const [customerForm, setCustomerForm] = useState({
    name: "",
    mobile: "",
    address: "",
  });

  const fetchCustomersData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersData();
  }, []);

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          ...customerForm,
        }),
      });
      if (res.ok) {
        setIsCustomerModalOpen(false);
        setCustomerForm({ name: "", mobile: "", address: "" });
        fetchCustomersData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add customer");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: selectedCustomer.id,
          ...customerForm,
        }),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setSelectedCustomer(null);
        fetchCustomersData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update customer");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer record?")) return;
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id,
        }),
      });
      if (res.ok) {
        fetchCustomersData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete customer");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile.includes(search)
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <span className="text-sm text-muted-foreground font-semibold">Loading Customer CRM...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Toolbar */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          {/* Search Box */}
          <div className="relative w-full max-w-xs">
            <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search Name or Mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-input pl-9 pr-4 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          {/* Add Customer Button */}
          {canEdit && (
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          )}
        </div>

        {/* Customers list Cards grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-3 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground font-medium">
              No customer records found.
            </div>
          ) : (
            filteredCustomers.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="block font-semibold text-sm">{c.name}</span>
                        <span className="block text-[10px] text-muted-foreground font-medium">Customer CRM</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{c.mobile}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mt-0.5" />
                    <span className="line-clamp-1">{c.address || "No address logged"}</span>
                  </div>

                  {/* Summary items */}
                  <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium uppercase">Purchased</span>
                      <span className="block font-bold text-emerald-600 mt-0.5">₹{c.totalPurchases.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium uppercase">Outstanding</span>
                      <span className={`block font-bold mt-0.5 ${c.outstandingBalance > 0 ? "text-amber-500 animate-pulse" : "text-muted-foreground"}`}>
                        ₹{c.outstandingBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-secondary/20 border-t border-border p-3 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                    <History className="h-3.5 w-3.5" />
                    <span>{c.purchaseCount} invoice orders</span>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerForm({
                            name: c.name,
                            mobile: c.mobile,
                            address: c.address,
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(c.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

        {/* MODAL 1: Add Customer */}
        {isCustomerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-foreground mb-4">Add Customer Record</h3>
              <form onSubmit={handleCustomerSubmit} className="space-y-4 text-xs">
                
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Customer Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anil Sharma"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Mobile Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="10 digit number"
                    value={customerForm.mobile}
                    onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Billing Address</label>
                  <textarea
                    placeholder="Delivery/Billing address details..."
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground h-20"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(false)}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-primary px-4 py-2 text-primary-foreground font-semibold hover:bg-primary/95"
                  >
                    Save Record
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Edit Customer */}
        {isEditModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-foreground mb-4">Edit Customer Record</h3>
              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Customer Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Mobile Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={customerForm.mobile}
                    onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Billing Address</label>
                  <textarea
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground h-20"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedCustomer(null);
                    }}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-primary px-4 py-2 text-primary-foreground font-semibold hover:bg-primary/95"
                  >
                    Update Record
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
