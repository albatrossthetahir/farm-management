"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import {
  Printer,
  Download,
  FileText,
  User,
  ShoppingBag,
  CreditCard,
  Plus,
  Trash2,
  Calendar
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Customer {
  id: string;
  name: string;
  mobile: string;
  address: string;
}

export default function InvoicesPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  // Custom billing inputs if not selecting database customer
  const [customCustomer, setCustomCustomer] = useState({
    name: "",
    mobile: "",
    address: "",
  });

  const [invoiceType, setInvoiceType] = useState<"Goat" | "Chicken" | "Kid" | "Egg">("Goat");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);

  const [items, setItems] = useState<Array<{ desc: string; qty: number; rate: number }>>([
    { desc: "Breeding Doe (Sirohi Breed)", qty: 2, rate: 8500 },
  ]);

  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentStatus, setPaymentStatus] = useState("PAID");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
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
    fetchCustomers();
  }, []);

  // Update default descriptions depending on selected category
  useEffect(() => {
    if (invoiceType === "Goat") {
      setItems([{ desc: "Breeding Doe (Sirohi Breed)", qty: 2, rate: 8500 }]);
    } else if (invoiceType === "Chicken") {
      setItems([{ desc: "Broiler Chickens (Live weight)", qty: 100, rate: 120 }]);
    } else if (invoiceType === "Kid") {
      setItems([{ desc: "Growing Kid (Boer cross)", qty: 1, rate: 4500 }]);
    } else if (invoiceType === "Egg") {
      setItems([{ desc: "Fresh Organic Eggs (Coop Harvest)", qty: 300, rate: 6 }]);
    }
  }, [invoiceType]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { desc: "", qty: 1, rate: 100 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            [field]: field === "desc" ? value : parseFloat(value || 0),
          };
        }
        return item;
      })
    );
  };

  // Find billing target profile
  const dbCustomer = customers.find((c) => c.id === selectedCustomerId);
  const activeBilling = dbCustomer
    ? { name: dbCustomer.name, mobile: dbCustomer.mobile, address: dbCustomer.address }
    : customCustomer;

  const totalAmount = items.reduce((acc, item) => acc + item.qty * item.rate, 0);

  // PDF Compilation & Download using jsPDF vector table
  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Header Branding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(5, 150, 105); // primary forest green
    doc.text("FARM ERP", 14, 20);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("High-quality Livestock & Poultry Breeding", 14, 25);
    doc.text("Agri-Town Sector 4, Maharashtra, IN", 14, 29);
    doc.text("Email: billing@farm.com | Tel: +91 98765 43210", 14, 33);

    // Invoice Meta
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("TAX INVOICE", 140, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Invoice No: ${invoiceNumber}`, 140, 26);
    doc.text(`Date: ${new Date(invoiceDate).toLocaleDateString()}`, 140, 31);
    doc.text(`Status: ${paymentStatus.toUpperCase()}`, 140, 36);

    doc.line(14, 42, 196, 42); // spacer line

    // Billing info block
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO (CUSTOMER):", 14, 50);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${activeBilling.name || "Walk-in Buyer"}`, 14, 56);
    doc.text(`Mobile: ${activeBilling.mobile || "-"}`, 14, 61);
    doc.text(`Address: ${activeBilling.address || "Counter Sale"}`, 14, 66);

    // Items table rows
    const tableBody = items.map((item, index) => [
      index + 1,
      item.desc || `${invoiceType} Product`,
      item.qty,
      `INR ${item.rate.toFixed(2)}`,
      `INR ${(item.qty * item.rate).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 72,
      head: [["S.No", "Description", "Quantity", "Unit Rate", "Total Cost"]],
      body: tableBody,
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });

    // Summary calculations below table
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "normal");
    doc.text(`Payment Method: ${paymentMethod}`, 14, finalY);
    doc.text(`Generated By: ${user?.name || "System Staff"}`, 14, finalY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`TOTAL AMOUNT DUE: INR ${totalAmount.toLocaleString()}`, 120, finalY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Thank you for your business! This is a system-generated document.", 14, finalY + 25);

    doc.save(`${invoiceNumber}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <span className="text-sm text-muted-foreground font-semibold">Opening Invoice Terminal...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-1 print:p-0">

        {/* Left Side: Invoice Builder Input Forms (HIDDEN during window.print) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5 print:hidden">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground">Invoice Editor</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Product Category</label>
              <select
                value={invoiceType}
                onChange={(e) => setInvoiceType(e.target.value as any)}
                className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
              >
                <option value="Goat">Goats Invoice</option>
                <option value="Chicken">Chickens Invoice</option>
                <option value="Kid">Baby Kids Invoice</option>
                <option value="Egg">Eggs Production Invoice</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Invoice Number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Select Customer CRM</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
              >
                <option value="">-- Custom / Walk-in Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
              />
            </div>
          </div>

          {/* Custom Billing Inputs if no customer chosen */}
          {!selectedCustomerId && (
            <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3 text-xs">
              <span className="block font-bold text-muted-foreground">Walk-in Customer Details</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Buyer Name</label>
                  <input
                    type="text"
                    placeholder="Buyer Full Name"
                    value={customCustomer.name}
                    onChange={(e) => setCustomCustomer({ ...customCustomer, name: e.target.value })}
                    className="w-full rounded border border-border bg-input px-2 py-1 outline-none text-foreground text-[11px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Contact mobile</label>
                  <input
                    type="tel"
                    placeholder="Mobile number"
                    value={customCustomer.mobile}
                    onChange={(e) => setCustomCustomer({ ...customCustomer, mobile: e.target.value })}
                    className="w-full rounded border border-border bg-input px-2 py-1 outline-none text-foreground text-[11px]"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Billing Address</label>
                <input
                  type="text"
                  placeholder="Billing address details"
                  value={customCustomer.address}
                  onChange={(e) => setCustomCustomer({ ...customCustomer, address: e.target.value })}
                  className="w-full rounded border border-border bg-input px-2 py-1 outline-none text-foreground text-[11px]"
                />
              </div>
            </div>
          )}

          {/* Itemized list inputs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Itemized Line Products</label>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item Line
              </button>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-center text-xs">
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      placeholder="Product Description"
                      value={item.desc}
                      onChange={(e) => handleItemChange(index, "desc", e.target.value)}
                      className="w-full rounded border border-border bg-input px-2 py-1 outline-none text-foreground"
                    />
                  </div>
                  <div className="w-16 space-y-1">
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                      className="w-full rounded border border-border bg-input px-2 py-1 outline-none text-foreground text-center"
                    />
                  </div>
                  <div className="w-20 space-y-1">
                    <input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                      className="w-full rounded border border-border bg-input px-2 py-1 outline-none text-foreground text-right"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    className="p-1 rounded bg-secondary hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Terms */}
          <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-border">
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
              >
                <option value="CASH">CASH</option>
                <option value="BANK_TRANSFER">BANK TRANSFER / UPI</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full rounded border border-border bg-input px-3 py-2 outline-none text-foreground"
              >
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING (BALANCE DUE)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Right Side: Professional Invoice Preview */}
        <div className="flex flex-col gap-4">

          {/* Actions toolbar (Hidden during print) */}
          <div className="flex justify-end gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow hover:bg-secondary transition-all"
            >
              <Printer className="h-4 w-4" />
              Print Invoice
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>

          {/* Print preview Card container */}
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm flex flex-col justify-between min-h-[500px] text-xs text-foreground print:border-none print:shadow-none print:p-0">
            {/* Header */}
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-extrabold text-primary uppercase tracking-wider">FARM ERP</h2>
                  <span className="block text-[9px] text-muted-foreground font-medium mt-1">High-quality Livestock & Poultry Breeding</span>
                  <span className="block text-[9px] text-muted-foreground">Agri-Town Sector 4, Maharashtra, IN</span>
                  <span className="block text-[9px] text-muted-foreground">billing@farm.com | +91 98765 43210</span>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-bold text-foreground">TAX INVOICE</h3>
                  <div className="mt-2 space-y-0.5 text-[9px] text-muted-foreground font-medium">
                    <div><span className="font-bold text-foreground">Invoice No:</span> {invoiceNumber}</div>
                    <div><span className="font-bold text-foreground">Date:</span> {new Date(invoiceDate).toLocaleDateString()}</div>
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-bold text-foreground">Status:</span>
                      <span className={`inline-block px-1.5 py-0.2 rounded font-bold uppercase text-[8px] ${paymentStatus === "PAID" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500 animate-pulse"
                        }`}>
                        {paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-b border-border my-6" />

              {/* Billing Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5">Bill To:</span>
                  <span className="block font-bold text-foreground text-sm">{activeBilling.name || "Walk-in Customer"}</span>
                  <span className="block text-muted-foreground font-medium mt-1">{activeBilling.mobile || "-"}</span>
                  <span className="block text-muted-foreground font-medium mt-0.5">{activeBilling.address || "Counter Cash Sale"}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="mt-8 border border-border rounded-lg overflow-hidden">
                <table className="w-full border-collapse text-left text-[11px]">
                  <thead className="bg-secondary/40 border-b border-border font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-center w-12">S.No</th>
                      <th className="px-4 py-2">Product Description</th>
                      <th className="px-4 py-2 text-center w-16">Qty</th>
                      <th className="px-4 py-2 text-right w-24">Unit Rate</th>
                      <th className="px-4 py-2 text-right w-24">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-center text-muted-foreground">{index + 1}</td>
                        <td className="px-4 py-2 font-medium">{item.desc || `${invoiceType} Stock`}</td>
                        <td className="px-4 py-2 text-center">{item.qty}</td>
                        <td className="px-4 py-2 text-right">₹{item.rate.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-bold text-foreground">₹{(item.qty * item.rate).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Footer Summary */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex flex-col gap-1 items-end">
                <div className="flex gap-4 justify-between w-64 text-sm">
                  <span className="font-semibold text-muted-foreground">Total Amount Due:</span>
                  <span className="font-extrabold text-primary text-base">₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex gap-4 justify-between w-64 text-[10px] text-muted-foreground mt-1 border-t border-border pt-1 font-semibold">
                  <span>Payment Method:</span>
                  <span className="uppercase">{paymentMethod}</span>
                </div>
              </div>
              <div className="mt-8 text-[9px] text-muted-foreground text-center font-medium border-t border-border border-dashed pt-4">
                Thank you for your business! This is a system-verified tax invoice.
              </div>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
