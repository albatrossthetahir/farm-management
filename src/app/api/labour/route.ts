import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const workers = await prisma.labour.findMany({
      include: {
        salaries: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: {
        joiningDate: "desc",
      },
    });

    // Compute totals
    let totalLabourExpense = 0;
    let pendingSalaries = 0;

    workers.forEach((worker) => {
      worker.salaries.forEach((sal) => {
        totalLabourExpense += sal.amountPaid;
        pendingSalaries += sal.amountPending;
      });
    });

    return NextResponse.json({
      workers,
      summary: {
        activeCount: workers.filter((w) => w.status === "ACTIVE").length,
        totalLabourExpense,
        pendingSalaries,
      },
    });
  } catch (error: any) {
    console.error("GET Labour error:", error);
    return NextResponse.json({ error: "Failed to fetch workers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Add Labour Worker
    if (action === "create") {
      const { fullName, mobileNumber, address, idProof, joiningDate, salaryType, monthlySalary, aadhaarDoc, panDoc, otherDoc } = body;
      if (!fullName || !mobileNumber || !idProof || !joiningDate || !salaryType || monthlySalary === undefined) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const worker = await prisma.labour.create({
        data: {
          fullName,
          mobileNumber,
          address: address || "",
          idProof,
          joiningDate: new Date(joiningDate),
          salaryType,
          monthlySalary: parseFloat(monthlySalary),
          aadhaarDoc: aadhaarDoc || null,
          panDoc: panDoc || null,
          otherDoc: otherDoc || null,
          status: "ACTIVE",
        },
      });

      return NextResponse.json({ success: true, data: worker });
    }

    // 2. Edit Worker
    if (action === "update") {
      const { id, fullName, mobileNumber, address, idProof, joiningDate, salaryType, monthlySalary, status, aadhaarDoc, panDoc, otherDoc } = body;
      if (!id) {
        return NextResponse.json({ error: "Missing worker ID" }, { status: 400 });
      }

      const worker = await prisma.labour.update({
        where: { id },
        data: {
          fullName,
          mobileNumber,
          address,
          idProof,
          joiningDate: joiningDate ? new Date(joiningDate) : undefined,
          salaryType,
          monthlySalary: monthlySalary !== undefined ? parseFloat(monthlySalary) : undefined,
          status,
          aadhaarDoc,
          panDoc,
          otherDoc,
        },
      });

      return NextResponse.json({ success: true, data: worker });
    }

    // 3. Delete Worker
    if (action === "delete") {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: "Missing worker ID" }, { status: 400 });
      }

      // We can soft delete by marking INACTIVE, or delete from DB. Let's do soft delete first!
      const worker = await prisma.labour.update({
        where: { id },
        data: { status: "INACTIVE" },
      });

      return NextResponse.json({ success: true, data: worker });
    }

    // 4. Pay Salary
    if (action === "pay") {
      const { labourId, amountPaid, amountPending, advanceTaken, date, notes } = body;
      if (!labourId || amountPaid === undefined || !date) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const paidVal = parseFloat(amountPaid);
      const pendingVal = parseFloat(amountPending || 0);
      const advanceVal = parseFloat(advanceTaken || 0);

      const result = await prisma.$transaction(async (tx) => {
        const worker = await tx.labour.findUnique({ where: { id: labourId } });
        if (!worker) {
          throw new Error("Worker not found");
        }

        // Create Salary Payment record
        const payment = await tx.salaryPayment.create({
          data: {
            labourId,
            date: new Date(date),
            amountPaid: paidVal,
            amountPending: pendingVal,
            advanceTaken: advanceVal,
            notes,
          },
        });

        // Add corresponding financial expense outflow
        const expense = await tx.expense.create({
          data: {
            date: new Date(date),
            category: "SALARY",
            amount: paidVal,
            fundingSource: "PERSONAL", // Paid out of cash flow
            notes: `Salary payout to ${worker.fullName}. Paid: ₹${paidVal.toLocaleString()}. Pending: ₹${pendingVal.toLocaleString()}.`,
            salaryPaymentId: payment.id,
          },
        });

        // If pending salary is left, create alert
        if (pendingVal > 0) {
          await tx.notification.create({
            data: {
              type: "SALARY_DUE",
              title: "Pending Salary Payment",
              message: `Worker ${worker.fullName} has a pending salary balance of ₹${pendingVal.toLocaleString()}.`,
            },
          });
        }

        return payment;
      });

      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST Labour error:", error);
    return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
  }
}
