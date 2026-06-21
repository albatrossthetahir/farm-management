"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  Users,
  CreditCard,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  FileDown,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  Coins,
  ArrowRightLeft
} from "lucide-react";

interface SalaryPayment {
  id: string;
  date: string;
  amountPaid: number;
  amountPending: number;
  advanceTaken: number;
  notes: string | null;
}

interface Labour {
  id: string;
  fullName: string;
  mobileNumber: string;
  address: string;
  idProof: string;
  joiningDate: string;
  salaryType: string;
  monthlySalary: number;
  aadhaarDoc: string | null;
  panDoc: string | null;
  otherDoc: string | null;
  status: string;
  salaries: SalaryPayment[];
}

export default function LabourPage() {
  const { user } = useAuth();
  const role = user?.role || "STAFF";
  const isAuthorized = role === "ADMIN" || role === "MANAGER";

  const [activeTab, setActiveTab] = useState<"profiles" | "payroll">("profiles");
  const [workers, setWorkers] = useState<Labour[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [totalSalaryOutflow, setTotalSalaryOutflow] = useState(0);
  const [pendingSalaries, setPendingSalaries] = useState(0);

  const [loading, setLoading] = useState(true);

  // Modals state
  const [isLabourModalOpen, setIsLabourModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Selection states
  const [selectedWorker, setSelectedWorker] = useState<Labour | null>(null);

  // Form Fields State
  const [labourForm, setLabourForm] = useState({
    fullName: "",
    mobileNumber: "",
    address: "",
    idProof: "Aadhaar",
    joiningDate: new Date().toISOString().split("T")[0],
    salaryType: "MONTHLY",
    monthlySalary: "12000",
    aadhaarDoc: "",
    panDoc: "",
    otherDoc: "",
  });

  const [payForm, setPayForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amountPaid: "12000",
    amountPending: "0",
    advanceTaken: "0",
    notes: "",
  });

  const fetchLabourData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/labour");
      if (res.ok) {
        const data = await res.json();
        setWorkers(data.workers);
        setActiveCount(data.summary.activeCount);
        setTotalSalaryOutflow(data.summary.totalLabourExpense);
        setPendingSalaries(data.summary.pendingSalaries);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchLabourData();
    }
  }, [isAuthorized]);

  const handleLabourSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/labour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          ...labourForm,
        }),
      });
      if (res.ok) {
        setIsLabourModalOpen(false);
        setLabourForm({
          fullName: "",
          mobileNumber: "",
          address: "",
          idProof: "Aadhaar",
          joiningDate: new Date().toISOString().split("T")[0],
          salaryType: "MONTHLY",
          monthlySalary: "12000",
          aadhaarDoc: "",
          panDoc: "",
          otherDoc: "",
        });
        fetchLabourData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add worker");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    try {
      const res = await fetch("/api/labour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: selectedWorker.id,
          ...labourForm,
        }),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setSelectedWorker(null);
        fetchLabourData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;

    try {
      const res = await fetch("/api/labour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pay",
          labourId: selectedWorker.id,
          ...payForm,
        }),
      });
      if (res.ok) {
        setIsPayModalOpen(false);
        setSelectedWorker(null);
        setPayForm((prev) => ({ ...prev, notes: "", amountPending: "0", advanceTaken: "0" }));
        fetchLabourData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to record payment");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWorker = async (id: string) => {
    if (!confirm("Are you sure you want to suspend this worker?")) return;
    try {
      const res = await fetch("/api/labour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id,
        }),
      });
      if (res.ok) {
        fetchLabourData();
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
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">Access Restricted</h3>
            <p className="text-xs text-muted-foreground mt-1">
              You do not have permission to view the Labour payroll module. This section is restricted to Admin and Manager roles.
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
            <span className="text-sm text-muted-foreground font-semibold">Loading HR Registry...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Combined salary list for the second tab
  const combinedSalaries: any[] = [];
  workers.forEach((w) => {
    w.salaries.forEach((s) => {
      combinedSalaries.push({
        ...s,
        workerName: w.fullName,
      });
    });
  });
  combinedSalaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Tab Switcher */}
        <div className="flex border-b border-border gap-2">
          <button
            onClick={() => setActiveTab("profiles")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "profiles" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Staff Profiles
          </button>
          <button
            onClick={() => setActiveTab("payroll")}
            className={`px-4 py-2 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "payroll" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Salary Ledger & Payroll
          </button>
        </div>

        {/* Tab 1: Profiles */}
        {activeTab === "profiles" && (
          <div className="space-y-6">
            
            {/* Summary widgets */}
            <div className="grid gap-4 grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Staff</span>
                <span className="block text-xl font-bold mt-1 text-primary">{activeCount} workers</span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Payroll Paid</span>
                <span className="block text-xl font-bold mt-1">₹{totalSalaryOutflow.toLocaleString()}</span>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm bg-amber-500/5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-amber-600 dark:text-amber-400">Salary Due liability</span>
                <span className="block text-xl font-bold mt-1 text-amber-500">₹{pendingSalaries.toLocaleString()}</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex justify-end rounded-xl border border-border bg-card p-4 shadow-sm">
              <button
                onClick={() => setIsLabourModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Recruit New Worker
              </button>
            </div>

            {/* Profiles Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {workers.length === 0 ? (
                <div className="col-span-3 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">
                  No staff profiles found.
                </div>
              ) : (
                workers.map((w) => (
                  <div
                    key={w.id}
                    className={`rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between overflow-hidden ${
                      w.status === "INACTIVE" ? "opacity-60 bg-muted/20" : ""
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {w.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-semibold text-sm">{w.fullName}</span>
                            <span className="block text-[10px] text-muted-foreground font-medium">Joined {new Date(w.joiningDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                          w.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        }`}>
                          {w.status}
                        </span>
                      </div>
                    </div>

                    {/* Card Body Info */}
                    <div className="p-4 space-y-2.5 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{w.mobileNumber}</span>
                      </div>
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mt-0.5" />
                        <span className="line-clamp-1">{w.address || "No address logged"}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-2.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">Monthly Salary</span>
                        <span className="font-bold text-foreground">₹{w.monthlySalary.toLocaleString()} ({w.salaryType.toLowerCase()})</span>
                      </div>
                      {/* Document uploads info */}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 pt-1 border-t border-border mt-1">
                        <span className="font-bold uppercase">ID IDProof:</span>
                        <span>{w.idProof}</span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="bg-secondary/20 border-t border-border p-3 flex justify-between items-center">
                      <div className="flex gap-2">
                        {w.status === "ACTIVE" && (
                          <button
                            onClick={() => {
                              setSelectedWorker(w);
                              setPayForm((prev) => ({
                                ...prev,
                                amountPaid: String(w.monthlySalary),
                              }));
                              setIsPayModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-primary text-primary-foreground rounded text-[10px] font-bold hover:bg-primary/95 transition-all shadow-sm"
                          >
                            Pay Payroll
                          </button>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedWorker(w);
                            setLabourForm({
                              fullName: w.fullName,
                              mobileNumber: w.mobileNumber,
                              address: w.address,
                              idProof: w.idProof,
                              joiningDate: w.joiningDate.split("T")[0],
                              salaryType: w.salaryType,
                              monthlySalary: String(w.monthlySalary),
                              aadhaarDoc: w.aadhaarDoc || "",
                              panDoc: w.panDoc || "",
                              otherDoc: w.otherDoc || "",
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {w.status === "ACTIVE" && (
                          <button
                            onClick={() => handleDeleteWorker(w.id)}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* Tab 2: Payroll Payouts */}
        {activeTab === "payroll" && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full border-collapse text-left text-xs text-foreground">
                <thead className="border-b border-border bg-secondary/50 font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Paid Date</th>
                    <th className="px-4 py-3">Worker Name</th>
                    <th className="px-4 py-3">Salary Paid</th>
                    <th className="px-4 py-3">Salary Pending</th>
                    <th className="px-4 py-3">Advance Taken</th>
                    <th className="px-4 py-3">Notes / Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {combinedSalaries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-medium">
                        No payroll payouts logged.
                      </td>
                    </tr>
                  ) : (
                    combinedSalaries.map((s) => (
                      <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 font-semibold">{new Date(s.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-semibold text-primary">{s.workerName}</td>
                        <td className="px-4 py-3 font-bold text-destructive">₹{s.amountPaid.toLocaleString()}</td>
                        <td className={`px-4 py-3 font-semibold ${s.amountPending > 0 ? "text-amber-500 animate-pulse" : "text-muted-foreground"}`}>
                          ₹{s.amountPending.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-medium">₹{s.advanceTaken.toLocaleString()}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.notes || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL 1: Recruit Labour */}
        {isLabourModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-bold text-foreground mb-4">Recruit New Worker</h3>
              <form onSubmit={handleLabourSubmit} className="space-y-4 text-xs">
                
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patil"
                    value={labourForm.fullName}
                    onChange={(e) => setLabourForm({ ...labourForm, fullName: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="10 digit number"
                      value={labourForm.mobileNumber}
                      onChange={(e) => setLabourForm({ ...labourForm, mobileNumber: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Joining Date</label>
                    <input
                      type="date"
                      required
                      value={labourForm.joiningDate}
                      onChange={(e) => setLabourForm({ ...labourForm, joiningDate: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Worker Address</label>
                  <input
                    type="text"
                    placeholder="Residential address"
                    value={labourForm.address}
                    onChange={(e) => setLabourForm({ ...labourForm, address: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Salary type</label>
                    <select
                      value={labourForm.salaryType}
                      onChange={(e) => setLabourForm({ ...labourForm, salaryType: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    >
                      <option value="MONTHLY">Monthly Salary</option>
                      <option value="DAILY">Daily Wage</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Salary Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={labourForm.monthlySalary}
                      onChange={(e) => setLabourForm({ ...labourForm, monthlySalary: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">ID IDProof Type</label>
                    <select
                      value={labourForm.idProof}
                      onChange={(e) => setLabourForm({ ...labourForm, idProof: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    >
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Voter ID">Voter ID</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Mock Doc Link</label>
                    <input
                      type="text"
                      placeholder="e.g. /uploads/aadhaar.pdf"
                      value={labourForm.aadhaarDoc}
                      onChange={(e) => setLabourForm({ ...labourForm, aadhaarDoc: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsLabourModalOpen(false)}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-primary px-4 py-2 text-primary-foreground font-semibold hover:bg-primary/95"
                  >
                    Save Profile
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Edit Worker */}
        {isEditModalOpen && selectedWorker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-base font-bold text-foreground mb-4">Edit Staff Profile</h3>
              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    value={labourForm.fullName}
                    onChange={(e) => setLabourForm({ ...labourForm, fullName: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={labourForm.mobileNumber}
                      onChange={(e) => setLabourForm({ ...labourForm, mobileNumber: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Joined Date</label>
                    <input
                      type="date"
                      required
                      value={labourForm.joiningDate}
                      onChange={(e) => setLabourForm({ ...labourForm, joiningDate: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Address</label>
                  <input
                    type="text"
                    value={labourForm.address}
                    onChange={(e) => setLabourForm({ ...labourForm, address: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Salary Type</label>
                    <select
                      value={labourForm.salaryType}
                      onChange={(e) => setLabourForm({ ...labourForm, salaryType: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="DAILY">Daily</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Salary (₹)</label>
                    <input
                      type="number"
                      required
                      value={labourForm.monthlySalary}
                      onChange={(e) => setLabourForm({ ...labourForm, monthlySalary: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedWorker(null);
                    }}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-primary px-4 py-2 text-primary-foreground font-semibold hover:bg-primary/95"
                  >
                    Update Profile
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: Pay Salary */}
        {isPayModalOpen && selectedWorker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-base font-bold text-foreground mb-2">Record Salary Payout</h3>
              <p className="text-[11px] text-muted-foreground mb-4">
                Paying salary for worker <span className="font-bold text-primary">{selectedWorker.fullName}</span>. Custom base rate: ₹{selectedWorker.monthlySalary.toLocaleString()}.
              </p>
              <form onSubmit={handlePaySubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Payout Date</label>
                    <input
                      type="date"
                      required
                      value={payForm.date}
                      onChange={(e) => setPayForm({ ...payForm, date: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Amount Paid (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={payForm.amountPaid}
                      onChange={(e) => setPayForm({ ...payForm, amountPaid: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Amount Pending (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={payForm.amountPending}
                      onChange={(e) => setPayForm({ ...payForm, amountPending: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-muted-foreground">Advance Taken (₹)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={payForm.advanceTaken}
                      onChange={(e) => setPayForm({ ...payForm, advanceTaken: e.target.value })}
                      className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Notes / Narration</label>
                  <textarea
                    placeholder="e.g. Salary payout for Month of June 2026..."
                    value={payForm.notes}
                    onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                    className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground h-16"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPayModalOpen(false);
                      setSelectedWorker(null);
                    }}
                    className="rounded border border-border px-4 py-2 text-foreground hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700 shadow"
                  >
                    Confirm Payout
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
