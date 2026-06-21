import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const logs = await prisma.closingLog.findMany({
      orderBy: { closeDate: "desc" },
    });
    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("GET Closing logs error:", error);
    return NextResponse.json({ error: "Failed to fetch closing archives" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { type, date } = await request.json(); // type is "MONTHLY" or "YEARLY"
    if (!type || !date) {
      return NextResponse.json({ error: "Type and date are required" }, { status: 400 });
    }

    const closeDate = new Date(date);
    const periodLabel = type === "MONTHLY" 
      ? `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, "0")}`
      : `${closeDate.getFullYear()}`;

    // Check if closing log already exists for this period
    const existing = await prisma.closingLog.findFirst({
      where: { type, periodLabel },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Closing log for ${periodLabel} (${type.toLowerCase()}) already exists.` },
        { status: 400 }
      );
    }

    // 1. Gather Finance Stats
    const expenses = await prisma.expense.findMany();
    const incomes = await prisma.income.findMany();
    const goatDeaths = await prisma.goatDeath.findMany();
    const chickenDeaths = await prisma.chickenDeath.findMany();

    // Filter based on period
    const filterByPeriod = (itemDate: Date) => {
      const d = new Date(itemDate);
      if (type === "MONTHLY") {
        return d.getFullYear() === closeDate.getFullYear() && d.getMonth() === closeDate.getMonth();
      } else {
        return d.getFullYear() === closeDate.getFullYear();
      }
    };

    let totalIncome = 0;
    incomes.filter((i) => filterByPeriod(i.date)).forEach((i) => {
      totalIncome += i.amount;
    });

    let totalExpense = 0;
    expenses.filter((e) => filterByPeriod(e.date)).forEach((e) => {
      totalExpense += e.amount;
    });

    let deadLoss = 0;
    goatDeaths.filter((d) => filterByPeriod(d.date)).forEach((d) => {
      deadLoss += d.lossAmount;
    });
    chickenDeaths.filter((d) => filterByPeriod(d.date)).forEach((d) => {
      deadLoss += d.lossAmount;
    });

    const netProfit = totalIncome - totalExpense - deadLoss;

    // 2. Gather Outstanding Loan balance
    const loans = await prisma.loan.findMany({
      include: { repayments: true },
    });
    let totalReceived = 0;
    let totalRepaid = 0;
    loans.forEach((l) => {
      totalReceived += l.totalAmount;
      l.repayments.forEach((r) => {
        totalRepaid += r.amount;
      });
    });
    const outstandingLoan = totalReceived - totalRepaid;

    // 3. Gather Stock Inventory Summary
    const totalGoats = await prisma.goat.count({ where: { status: { in: ["ACTIVE", "BREEDING"] } } });
    const totalKids = await prisma.kid.count({ where: { status: "GROWING" } });
    
    const chickenInv = await prisma.chickenInventory.findFirst();
    const totalChickens = chickenInv ? chickenInv.active : 0;

    const inventorySummary = JSON.stringify({
      goats: totalGoats,
      kids: totalKids,
      chickens: totalChickens,
    });

    // 4. Archive in ClosingLog
    const log = await prisma.closingLog.create({
      data: {
        type,
        closeDate,
        periodLabel,
        totalIncome,
        totalExpense,
        netProfit,
        loanBalance: outstandingLoan,
        inventorySummary,
      },
    });

    // 5. Create a notification of the closing
    await prisma.notification.create({
      data: {
        type: "LOAN_DUE", // standard info type
        title: `${type === "MONTHLY" ? "Monthly" : "Yearly"} Accounts Closed`,
        message: `Accounts closed for period ${periodLabel}. Income: ₹${totalIncome.toLocaleString()}, Expense: ₹${totalExpense.toLocaleString()}, Net Profit: ₹${netProfit.toLocaleString()}.`,
      },
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error: any) {
    console.error("POST Closing error:", error);
    return NextResponse.json({ error: error.message || "Closing operation failed" }, { status: 500 });
  }
}
