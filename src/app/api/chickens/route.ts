import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const inventory = await prisma.chickenInventory.findFirst();
    const purchases = await prisma.chickenPurchase.findMany({
      orderBy: { purchaseDate: "desc" },
    });
    const deaths = await prisma.chickenDeath.findMany({
      orderBy: { date: "desc" },
    });
    const sales = await prisma.chickenSale.findMany({
      orderBy: { date: "desc" },
    });

    return NextResponse.json({
      inventory: inventory || { active: 0, sold: 0, dead: 0 },
      purchases,
      deaths,
      sales,
    });
  } catch (error: any) {
    console.error("GET Chickens error:", error);
    return NextResponse.json({ error: "Failed to fetch chicken data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Purchase Batch of Chickens
    if (action === "purchase") {
      const { purchaseDate, supplier, quantity, totalCost, fundingSource, loanId, notes } = body;
      if (!purchaseDate || !supplier || !quantity || !totalCost || !fundingSource) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const qtyVal = parseInt(quantity);
      const costVal = parseFloat(totalCost);
      const costPerChicken = costVal / qtyVal;

      const result = await prisma.$transaction(async (tx) => {
        // Record purchase
        const purchase = await tx.chickenPurchase.create({
          data: {
            purchaseDate: new Date(purchaseDate),
            supplier,
            quantity: qtyVal,
            totalCost: costVal,
            costPerChicken,
            fundingSource,
            loanId: fundingSource === "LOAN" || fundingSource === "MIXED" ? loanId : null,
            notes,
          },
        });

        // Track loan utilization
        if ((fundingSource === "LOAN" || fundingSource === "MIXED") && loanId) {
          await tx.loanUtilization.create({
            data: {
              loanId,
              amount: costVal,
              purpose: `Bulk Chicken Purchase: ${qtyVal} chickens from ${supplier}`,
              date: new Date(purchaseDate),
            },
          });
        }

        // Update inventory
        const inv = await tx.chickenInventory.findFirst();
        if (inv) {
          await tx.chickenInventory.update({
            where: { id: inv.id },
            data: {
              active: inv.active + qtyVal,
            },
          });
        } else {
          await tx.chickenInventory.create({
            data: {
              active: qtyVal,
              sold: 0,
              dead: 0,
            },
          });
        }

        // Add expense cash outflow
        await tx.expense.create({
          data: {
            date: new Date(purchaseDate),
            category: "EQUIPMENT",
            amount: costVal,
            fundingSource,
            loanId: fundingSource === "LOAN" || fundingSource === "MIXED" ? loanId : null,
            notes: `Bulk Chicken Purchase (${qtyVal} head) from ${supplier}`,
          },
        });

        return purchase;
      });

      return NextResponse.json({ success: true, data: result });
    }

    // 2. Log Chicken Death
    if (action === "die") {
      const { date, quantity, reason } = body;
      if (!date || !quantity) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const qtyVal = parseInt(quantity);

      const result = await prisma.$transaction(async (tx) => {
        // Check current inventory
        const inv = await tx.chickenInventory.findFirst();
        if (!inv || inv.active < qtyVal) {
          throw new Error(`Insufficient active chickens in inventory. Available: ${inv?.active || 0}`);
        }

        // Fetch latest purchase cost per chicken
        const latestPurchase = await tx.chickenPurchase.findFirst({
          orderBy: { purchaseDate: "desc" },
        });
        const costPerChicken = latestPurchase ? latestPurchase.costPerChicken : 0;
        const lossAmount = qtyVal * costPerChicken;

        // Record Death
        const death = await tx.chickenDeath.create({
          data: {
            date: new Date(date),
            quantity: qtyVal,
            costPerChicken,
            lossAmount,
            reason,
          },
        });

        // Update inventory
        await tx.chickenInventory.update({
          where: { id: inv.id },
          data: {
            active: inv.active - qtyVal,
            dead: inv.dead + qtyVal,
          },
        });

        // Low inventory alert if it falls below 50 chickens
        const updatedActive = inv.active - qtyVal;
        if (updatedActive < 50) {
          await tx.notification.create({
            data: {
              type: "LOW_INVENTORY",
              title: "Low Chicken Inventory",
              message: `Active chicken stock has fallen to ${updatedActive} birds. Consider re-ordering soon.`,
            },
          });
        }

        return death;
      });

      return NextResponse.json({ success: true, data: result });
    }

    // 3. Sell Chickens (Individual or Bulk)
    if (action === "sell") {
      const { date, customerName, customerId, quantity, unitPrice, totalAmount, paymentMethod, paymentStatus, notes } = body;
      if (!date || !customerName || !quantity || !unitPrice || !totalAmount || !paymentMethod || !paymentStatus) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const qtyVal = parseInt(quantity);
      const unitVal = parseFloat(unitPrice);
      const totalVal = parseFloat(totalAmount);

      const result = await prisma.$transaction(async (tx) => {
        // Check current inventory
        const inv = await tx.chickenInventory.findFirst();
        if (!inv || inv.active < qtyVal) {
          throw new Error(`Insufficient active chickens in inventory. Available: ${inv?.active || 0}`);
        }

        // Fetch latest purchase cost to calculate profit
        const latestPurchase = await tx.chickenPurchase.findFirst({
          orderBy: { purchaseDate: "desc" },
        });
        const costPerChicken = latestPurchase ? latestPurchase.costPerChicken : 0;
        const totalCost = qtyVal * costPerChicken;
        const profit = totalVal - totalCost;

        // Record Sale
        const sale = await tx.chickenSale.create({
          data: {
            date: new Date(date),
            customerName,
            customerId: customerId || null,
            quantity: qtyVal,
            unitPrice: unitVal,
            totalAmount: totalVal,
            costPerChicken,
            totalCost,
            profit,
            paymentMethod,
            paymentStatus,
            notes,
          },
        });

        // Update inventory
        await tx.chickenInventory.update({
          where: { id: inv.id },
          data: {
            active: inv.active - qtyVal,
            sold: inv.sold + qtyVal,
          },
        });

        // Record Income entry
        await tx.income.create({
          data: {
            date: new Date(date),
            category: "CHICKEN_SALE",
            amount: totalVal,
            notes: `Chicken Sale to ${customerName} (${qtyVal} chickens)`,
            refId: sale.id,
          },
        });

        if (paymentStatus === "PENDING") {
          await tx.notification.create({
            data: {
              type: "OUTSTANDING_PAYMENT",
              title: "Outstanding Payment Alert",
              message: `Customer ${customerName} has an outstanding balance of ₹${totalVal.toLocaleString()} for chicken purchase.`,
            },
          });
        }

        return sale;
      });

      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST Chickens error:", error);
    return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
  }
}
