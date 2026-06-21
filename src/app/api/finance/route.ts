import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
    });

    const incomes = await prisma.income.findMany({
      orderBy: { date: "desc" },
    });

    // Compute aggregations
    let totalExpense = 0;
    expenses.forEach((e) => {
      totalExpense += e.amount;
    });

    let totalIncome = 0;
    incomes.forEach((i) => {
      totalIncome += i.amount;
    });

    // Also calculate actual Goat/Chicken sale profit components and death losses
    const goatSales = await prisma.goatSaleItem.findMany({
      include: { goat: true },
    });
    let goatSalesProfit = 0;
    goatSales.forEach((item) => {
      goatSalesProfit += item.profit;
    });

    const goatDeaths = await prisma.goatDeath.findMany();
    let goatDeathLoss = 0;
    goatDeaths.forEach((death) => {
      goatDeathLoss += death.lossAmount;
    });

    const chickenSales = await prisma.chickenSale.findMany();
    let chickenSalesProfit = 0;
    chickenSales.forEach((sale) => {
      chickenSalesProfit += sale.profit;
    });

    const chickenDeaths = await prisma.chickenDeath.findMany();
    let chickenDeathLoss = 0;
    chickenDeaths.forEach((death) => {
      chickenDeathLoss += death.lossAmount;
    });

    const kidSales = await prisma.kidSale.findMany();
    let kidSalesProfit = 0;
    kidSales.forEach((sale) => {
      // profit is saleAmount - purchaseCost. Kid base cost is 0.
      kidSalesProfit += sale.saleAmount; 
    });

    // Net accounting position calculation (Net Profit)
    // Formula: Total direct incomes - Total direct expenses - Death losses
    const netPosition = totalIncome - totalExpense - goatDeathLoss - chickenDeathLoss;

    return NextResponse.json({
      expenses,
      incomes,
      summary: {
        totalIncome,
        totalExpense,
        goatSalesProfit,
        goatDeathLoss,
        chickenSalesProfit,
        chickenDeathLoss,
        kidSalesProfit,
        netPosition,
      },
    });
  } catch (error: any) {
    console.error("GET Finance error:", error);
    return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Add Expense
    if (action === "create_expense") {
      const { date, category, amount, fundingSource, loanId, notes } = body;
      if (!date || !category || amount === undefined || !fundingSource) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const amtVal = parseFloat(amount);

      const result = await prisma.$transaction(async (tx) => {
        const expense = await tx.expense.create({
          data: {
            date: new Date(date),
            category,
            amount: amtVal,
            fundingSource,
            loanId: fundingSource === "LOAN" || fundingSource === "MIXED" ? loanId : null,
            notes,
          },
        });

        // Track loan utilization if funded by loan
        if ((fundingSource === "LOAN" || fundingSource === "MIXED") && loanId) {
          await tx.loanUtilization.create({
            data: {
              loanId,
              amount: amtVal,
              purpose: `Expense payment (${category}): ${notes || "No notes"}`,
              date: new Date(date),
              expenseId: expense.id,
            },
          });
        }

        return expense;
      });

      return NextResponse.json({ success: true, data: result });
    }

    // 2. Add Income
    if (action === "create_income") {
      const { date, category, amount, notes } = body;
      if (!date || !category || amount === undefined) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const income = await prisma.income.create({
        data: {
          date: new Date(date),
          category,
          amount: parseFloat(amount),
          notes,
        },
      });

      return NextResponse.json({ success: true, data: income });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST Finance error:", error);
    return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
  }
}
