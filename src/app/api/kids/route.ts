import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const kids = await prisma.kid.findMany({
      include: {
        mother: true,
        sale: true,
      },
      orderBy: {
        birthDate: "desc",
      },
    });

    const total = kids.length;
    const growing = kids.filter((k) => k.status === "GROWING").length;
    const sold = kids.filter((k) => k.status === "SOLD").length;
    const dead = kids.filter((k) => k.status === "DEAD").length;

    return NextResponse.json({
      kids,
      summary: {
        total,
        growing,
        sold,
        dead,
      },
    });
  } catch (error: any) {
    console.error("GET Kids error:", error);
    return NextResponse.json({ error: "Failed to fetch kids" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Log New Kid Birth
    if (action === "create") {
      const { birthDate, motherGoatId, breed, gender, weight, status } = body;
      if (!birthDate || !breed || !gender || !weight) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const kid = await prisma.kid.create({
        data: {
          birthDate: new Date(birthDate),
          motherGoatId: motherGoatId || null,
          breed,
          gender,
          weight: parseFloat(weight),
          status: status || "GROWING",
          purchaseCost: 0, // Farm-born kids have 0 initial cost
        },
      });

      return NextResponse.json({ success: true, data: kid });
    }

    // 2. Update Kid Details
    if (action === "update") {
      const { id, birthDate, motherGoatId, breed, gender, weight, status } = body;
      if (!id) {
        return NextResponse.json({ error: "Missing kid ID" }, { status: 400 });
      }

      // Check if status is transitioning to DEAD
      const currentKid = await prisma.kid.findUnique({ where: { id } });
      if (!currentKid) {
        return NextResponse.json({ error: "Kid not found" }, { status: 404 });
      }

      const updatedKid = await prisma.kid.update({
        where: { id },
        data: {
          birthDate: birthDate ? new Date(birthDate) : undefined,
          motherGoatId: motherGoatId !== undefined ? (motherGoatId || null) : undefined,
          breed,
          gender,
          weight: weight !== undefined ? parseFloat(weight) : undefined,
          status,
        },
      });

      // If marked dead, create a notification
      if (status === "DEAD" && currentKid.status !== "DEAD") {
        await prisma.notification.create({
          data: {
            type: "LOW_INVENTORY",
            title: "Kid Death Logged",
            message: `Baby goat (${breed}) birthdate ${new Date(currentKid.birthDate).toLocaleDateString()} died.`,
          },
        });
      }

      return NextResponse.json({ success: true, data: updatedKid });
    }

    // 3. Sell Kid
    if (action === "sell") {
      const { kidId, customerName, customerId, saleAmount, paymentMethod, paymentStatus, date, notes } = body;
      if (!kidId || !customerName || !saleAmount || !paymentMethod || !paymentStatus || !date) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const amountVal = parseFloat(saleAmount);

      const result = await prisma.$transaction(async (tx) => {
        const kid = await tx.kid.findUnique({ where: { id: kidId } });
        if (!kid) {
          throw new Error("Kid not found");
        }
        if (kid.status === "SOLD" || kid.status === "DEAD") {
          throw new Error("Kid is already sold or dead");
        }

        // Create Kid Sale record
        const sale = await tx.kidSale.create({
          data: {
            date: new Date(date),
            customerName,
            customerId: customerId || null,
            kidId,
            saleAmount: amountVal,
            paymentMethod,
            paymentStatus,
            notes,
          },
        });

        // Update Kid status to SOLD
        await tx.kid.update({
          where: { id: kidId },
          data: { status: "SOLD" },
        });

        // Add to Income ledger
        await tx.income.create({
          data: {
            date: new Date(date),
            category: "KID_SALE",
            amount: amountVal,
            notes: `Kid Sale to ${customerName} (Breed: ${kid.breed})`,
            refId: sale.id,
          },
        });

        if (paymentStatus === "PENDING") {
          await tx.notification.create({
            data: {
              type: "OUTSTANDING_PAYMENT",
              title: "Outstanding Payment Alert",
              message: `Customer ${customerName} has an outstanding balance of ₹${amountVal.toLocaleString()} for baby goat sale.`,
            },
          });
        }

        return sale;
      });

      return NextResponse.json({ success: true, data: result });
    }

    // 4. Delete Kid Birth Record
    if (action === "delete") {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: "Missing kid ID" }, { status: 400 });
      }

      await prisma.kid.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST Kids error:", error);
    return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
  }
}
