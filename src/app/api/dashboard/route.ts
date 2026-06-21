import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // 1. Current Inventory Metrics
    const totalGoats = await prisma.goat.count({
      where: { status: { in: ["ACTIVE", "BREEDING"] } },
    });
    const totalKids = await prisma.kid.count({
      where: { status: "GROWING" },
    });
    const chickenInv = await prisma.chickenInventory.findFirst();
    const totalChickens = chickenInv ? chickenInv.active : 0;

    const eggProductionAggregate = await prisma.eggProduction.aggregate({
      _sum: { totalProduced: true },
    });
    const totalEggsProduced = eggProductionAggregate._sum.totalProduced || 0;

    // 2. Financial Metrics
    const totalSalesAggregate = await prisma.income.aggregate({
      _sum: { amount: true },
    });
    const totalSales = totalSalesAggregate._sum.amount || 0;

    const totalExpensesAggregate = await prisma.expense.aggregate({
      _sum: { amount: true },
    });
    const totalExpenses = totalExpensesAggregate._sum.amount || 0;

    const goatDeaths = await prisma.goatDeath.findMany();
    let goatDeathLoss = 0;
    goatDeaths.forEach((d) => {
      goatDeathLoss += d.lossAmount;
    });

    const chickenDeaths = await prisma.chickenDeath.findMany();
    let chickenDeathLoss = 0;
    chickenDeaths.forEach((d) => {
      chickenDeathLoss += d.lossAmount;
    });

    const currentProfitLoss = totalSales - totalExpenses - goatDeathLoss - chickenDeathLoss;

    // 3. Outstanding Loan
    const loans = await prisma.loan.findMany({
      include: { repayments: true },
    });
    let totalLoanReceived = 0;
    let totalLoanRepaid = 0;
    loans.forEach((l) => {
      totalLoanReceived += l.totalAmount;
      l.repayments.forEach((r) => {
        totalLoanRepaid += r.amount;
      });
    });
    const outstandingLoan = totalLoanReceived - totalLoanRepaid;

    // 4. Labour Expenses
    const salaryExpenses = await prisma.expense.aggregate({
      where: { category: "SALARY" },
      _sum: { amount: true },
    });
    const labourExpenses = salaryExpenses._sum.amount || 0;

    // 5. Monthly & Yearly Revenue (Current Month/Year)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const monthlyRevenueAggregate = await prisma.income.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { amount: true },
    });
    const monthlyRevenue = monthlyRevenueAggregate._sum.amount || 0;

    const yearlyRevenueAggregate = await prisma.income.aggregate({
      where: { date: { gte: startOfYear } },
      _sum: { amount: true },
    });
    const yearlyRevenue = yearlyRevenueAggregate._sum.amount || 0;

    // 6. Trend Charts Data (Last 6 Months)
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString("default", { month: "short" });
      const year = d.getFullYear();
      const monthStart = new Date(year, d.getMonth(), 1);
      const monthEnd = new Date(year, d.getMonth() + 1, 0, 23, 59, 59, 999);

      last6Months.push({
        monthName,
        year,
        start: monthStart,
        end: monthEnd,
      });
    }

    const chartsData = [];

    for (const m of last6Months) {
      // Direct Income & Expense
      const incAgg = await prisma.income.aggregate({
        where: { date: { gte: m.start, lte: m.end } },
        _sum: { amount: true },
      });
      const expAgg = await prisma.expense.aggregate({
        where: { date: { gte: m.start, lte: m.end } },
        _sum: { amount: true },
      });

      // Death Losses
      const gdAgg = await prisma.goatDeath.aggregate({
        where: { date: { gte: m.start, lte: m.end } },
        _sum: { lossAmount: true },
      });
      const cdAgg = await prisma.chickenDeath.aggregate({
        where: { date: { gte: m.start, lte: m.end } },
        _sum: { lossAmount: true },
      });

      const incomeVal = incAgg._sum.amount || 0;
      const expenseVal = expAgg._sum.amount || 0;
      const deathLossVal = (gdAgg._sum.lossAmount || 0) + (cdAgg._sum.lossAmount || 0);
      const netPL = incomeVal - expenseVal - deathLossVal;

      // Reconstruct Goat Inventory Count
      // Goats purchased on or before m.end
      const goatPurchasesCount = await prisma.goat.count({
        where: {
          purchase: {
            purchaseDate: { lte: m.end },
          },
        },
      });
      // Goats created individually on or before m.end
      const individualGoatsCount = await prisma.goat.count({
        where: {
          purchaseId: null,
          createdAt: { lte: m.end },
        },
      });
      const totalGoatsAdded = goatPurchasesCount + individualGoatsCount;

      // Goats sold on or before m.end
      const goatsSoldCount = await prisma.goatSaleItem.count({
        where: {
          sale: {
            date: { lte: m.end },
          },
        },
      });

      // Goats dead on or before m.end
      const goatsDeadCount = await prisma.goatDeath.count({
        where: {
          date: { lte: m.end },
        },
      });

      const goatInventoryAtEnd = Math.max(0, totalGoatsAdded - goatsSoldCount - goatsDeadCount);

      // Reconstruct Chicken Inventory Count
      // Purchases
      const chickenPurchasesAgg = await prisma.chickenPurchase.aggregate({
        where: { purchaseDate: { lte: m.end } },
        _sum: { quantity: true },
      });
      const totalChickensPurchased = chickenPurchasesAgg._sum.quantity || 0;

      // Sales
      const chickenSalesAgg = await prisma.chickenSale.aggregate({
        where: { date: { lte: m.end } },
        _sum: { quantity: true },
      });
      const totalChickensSold = chickenSalesAgg._sum.quantity || 0;

      // Deaths
      const chickenDeathsAgg = await prisma.chickenDeath.aggregate({
        where: { date: { lte: m.end } },
        _sum: { quantity: true },
      });
      const totalChickensDead = chickenDeathsAgg._sum.quantity || 0;

      const chickenInventoryAtEnd = Math.max(0, totalChickensPurchased - totalChickensSold - totalChickensDead);

      chartsData.push({
        name: `${m.monthName} ${String(m.year).slice(-2)}`,
        Income: incomeVal,
        Expense: expenseVal,
        ProfitLoss: netPL,
        GoatsCount: goatInventoryAtEnd,
        ChickensCount: chickenInventoryAtEnd,
      });
    }

    return NextResponse.json({
      metrics: {
        totalGoats,
        totalChickens,
        totalKids,
        totalEggsProduced,
        totalSales,
        totalExpenses,
        currentProfitLoss,
        outstandingLoan,
        labourExpenses,
        monthlyRevenue,
        yearlyRevenue,
      },
      charts: chartsData,
    });
  } catch (error: any) {
    console.error("GET Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to compile dashboard metrics" }, { status: 500 });
  }
}
