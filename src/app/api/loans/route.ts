import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const loans = await prisma.loan.findMany({
      include: {
        repayments: true,
        utilizations: true,
      },
      orderBy: {
        receivedDate: "desc",
      },
    });

    // Compute aggregations
    let totalReceived = 0;
    let totalUsed = 0;
    let totalRepaid = 0;

    loans.forEach((loan) => {
      totalReceived += loan.totalAmount;
      loan.utilizations.forEach((u) => {
        totalUsed += u.amount;
      });
      loan.repayments.forEach((r) => {
        totalRepaid += r.amount;
      });
    });

    const remainingLoan = totalReceived - totalRepaid;
    const remainingCash = totalReceived - totalUsed;

    return NextResponse.json({
      loans,
      summary: {
        totalReceived,
        totalUsed,
        totalRepaid,
        remainingLoan, // Outstanding debt
        remainingCash, // Cash available to spend from loan
      },
    });
  } catch (error: any) {
    console.error("GET Loans error:", error);
    return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "create") {
      const { provider, totalAmount, interestRate, receivedDate, notes } = body;
      if (!provider || !totalAmount || interestRate === undefined || !receivedDate) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const loan = await prisma.loan.create({
        data: {
          provider,
          totalAmount: parseFloat(totalAmount),
          interestRate: parseFloat(interestRate),
          receivedDate: new Date(receivedDate),
          notes,
        },
      });

      return NextResponse.json({ success: true, data: loan });
    }

    if (action === "repay") {
      const { loanId, amount, interestComponent, principalComponent, date, notes } = body;
      if (!loanId || !amount || !date) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const repayment = await prisma.loanRepayment.create({
        data: {
          loanId,
          amount: parseFloat(amount),
          interestComponent: parseFloat(interestComponent || 0),
          principalComponent: parseFloat(principalComponent || 0),
          date: new Date(date),
          notes,
        },
      });

      // Also record an expense entry for the interest component since it is a financial expense
      if (parseFloat(interestComponent || 0) > 0) {
        await prisma.expense.create({
          data: {
            date: new Date(date),
            category: "OTHER",
            amount: parseFloat(interestComponent),
            fundingSource: "PERSONAL", // Paid from farm revenue/personal
            notes: `Loan Interest Repayment (Loan Provider ID: ${loanId})`,
          },
        });
      }

      return NextResponse.json({ success: true, data: repayment });
    }

    if (action === "utilize") {
      const { loanId, amount, purpose, date } = body;
      if (!loanId || !amount || !purpose || !date) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const utilization = await prisma.loanUtilization.create({
        data: {
          loanId,
          amount: parseFloat(amount),
          purpose,
          date: new Date(date),
        },
      });

      return NextResponse.json({ success: true, data: utilization });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST Loans error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
