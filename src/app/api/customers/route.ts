import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        goatSales: true,
        chickenSales: true,
        eggSales: true,
        kidSales: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const customersWithSummaries = customers.map((c) => {
      let totalPurchasedAmount = 0;
      let outstandingAmount = 0;

      // 1. Goat Sales
      c.goatSales.forEach((s) => {
        totalPurchasedAmount += s.totalAmount;
        if (s.paymentStatus === "PENDING") {
          outstandingAmount += s.totalAmount;
        }
      });

      // 2. Chicken Sales
      c.chickenSales.forEach((s) => {
        totalPurchasedAmount += s.totalAmount;
        if (s.paymentStatus === "PENDING") {
          outstandingAmount += s.totalAmount;
        }
      });

      // 3. Egg Sales
      c.eggSales.forEach((s) => {
        totalPurchasedAmount += s.totalAmount;
        if (s.paymentStatus === "PENDING") {
          outstandingAmount += s.totalAmount;
        }
      });

      // 4. Kid Sales
      c.kidSales.forEach((s) => {
        totalPurchasedAmount += s.saleAmount;
        if (s.paymentStatus === "PENDING") {
          outstandingAmount += s.saleAmount;
        }
      });

      return {
        id: c.id,
        name: c.name,
        mobile: c.mobile,
        address: c.address,
        createdAt: c.createdAt,
        totalPurchases: totalPurchasedAmount,
        outstandingBalance: outstandingAmount,
        purchaseCount: c.goatSales.length + c.chickenSales.length + c.eggSales.length + c.kidSales.length,
      };
    });

    return NextResponse.json({ customers: customersWithSummaries });
  } catch (error: any) {
    console.error("GET Customers error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Add Customer
    if (action === "create") {
      const { name, mobile, address } = body;
      if (!name || !mobile) {
        return NextResponse.json({ error: "Name and mobile number are required" }, { status: 400 });
      }

      const customer = await prisma.customer.create({
        data: {
          name,
          mobile,
          address: address || "",
        },
      });

      return NextResponse.json({ success: true, data: customer });
    }

    // 2. Update Customer
    if (action === "update") {
      const { id, name, mobile, address } = body;
      if (!id) {
        return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });
      }

      const customer = await prisma.customer.update({
        where: { id },
        data: {
          name,
          mobile,
          address,
        },
      });

      return NextResponse.json({ success: true, data: customer });
    }

    // 3. Delete Customer
    if (action === "delete") {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });
      }

      await prisma.customer.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST Customers error:", error);
    return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
  }
}
