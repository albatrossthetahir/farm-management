import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const logs = await prisma.eggProduction.findMany({
      orderBy: { date: "desc" },
      take: 60, // Limit to last 60 days
    });

    const sales = await prisma.eggSale.findMany({
      orderBy: { date: "desc" },
    });

    // Compute monthly production summary
    let monthlyProduced = 0;
    let monthlyDamaged = 0;
    let monthlySold = 0;

    const now = new Date();
    const currentMonthLogs = logs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
    });

    currentMonthLogs.forEach((log) => {
      monthlyProduced += log.totalProduced;
      monthlyDamaged += log.damaged;
      monthlySold += log.sold;
    });

    return NextResponse.json({
      logs,
      sales,
      summary: {
        monthlyProduced,
        monthlyDamaged,
        monthlySold,
      },
    });
  } catch (error: any) {
    console.error("GET Eggs error:", error);
    return NextResponse.json({ error: "Failed to fetch egg logs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Log Daily Egg Production
    if (action === "log") {
      const { date, totalProduced, damaged } = body;
      if (!date || totalProduced === undefined || damaged === undefined) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const prodVal = parseInt(totalProduced);
      const dmgVal = parseInt(damaged);
      const logDate = new Date(date);

      // Reset time to midnight for exact unique date matching
      logDate.setUTCHours(0, 0, 0, 0);

      const result = await prisma.eggProduction.upsert({
        where: { date: logDate },
        update: {
          totalProduced: prodVal,
          damaged: dmgVal,
        },
        create: {
          date: logDate,
          totalProduced: prodVal,
          damaged: dmgVal,
          sold: 0,
        },
      });

      // Add a warning notification if damaged eggs exceeds a threshold
      if (dmgVal > 10) {
        await prisma.notification.create({
          data: {
            type: "LOW_INVENTORY",
            title: "High Number of Damaged Eggs",
            message: `Logged ${dmgVal} damaged eggs on ${logDate.toLocaleDateString()}. Please inspect chicken cages.`,
          },
        });
      }

      return NextResponse.json({ success: true, data: result });
    }

    // 2. Sell Eggs
    if (action === "sell") {
      const { date, customerName, customerId, quantity, unitPrice, totalAmount, paymentMethod, paymentStatus, notes } = body;
      if (!date || !customerName || !quantity || !unitPrice || !totalAmount || !paymentMethod || !paymentStatus) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const qtyVal = parseInt(quantity);
      const unitVal = parseFloat(unitPrice);
      const totalVal = parseFloat(totalAmount);
      const saleDate = new Date(date);
      saleDate.setUTCHours(0, 0, 0, 0);

      const result = await prisma.$transaction(async (tx) => {
        // Record the egg sale
        const sale = await tx.eggSale.create({
          data: {
            date: saleDate,
            customerName,
            customerId: customerId || null,
            quantity: qtyVal,
            unitPrice: unitVal,
            totalAmount: totalVal,
            paymentMethod,
            paymentStatus,
            notes,
          },
        });

        // Update daily production sold counter
        const prod = await tx.eggProduction.findUnique({
          where: { date: saleDate },
        });

        if (prod) {
          await tx.eggProduction.update({
            where: { date: saleDate },
            data: {
              sold: prod.sold + qtyVal,
            },
          });
        } else {
          // If no production log exists for this date, create a placeholder
          await tx.eggProduction.create({
            data: {
              date: saleDate,
              totalProduced: qtyVal, // Assume at least quantity sold was produced
              damaged: 0,
              sold: qtyVal,
            },
          });
        }

        // Add to Income ledger
        await tx.income.create({
          data: {
            date: saleDate,
            category: "EGG_SALE",
            amount: totalVal,
            notes: `Egg Sale to ${customerName} (${qtyVal} eggs)`,
            refId: sale.id,
          },
        });

        // Outstanding payment alert
        if (paymentStatus === "PENDING") {
          await tx.notification.create({
            data: {
              type: "OUTSTANDING_PAYMENT",
              title: "Outstanding Egg Payment Alert",
              message: `Customer ${customerName} has an outstanding balance of ₹${totalVal.toLocaleString()} for egg purchase.`,
            },
          });
        }

        return sale;
      });

      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST Eggs error:", error);
    return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
  }
}
