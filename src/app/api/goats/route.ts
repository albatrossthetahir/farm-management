import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const breed = searchParams.get("breed") || undefined;
    const gender = searchParams.get("gender") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (breed) where.breed = breed;
    if (gender) where.gender = gender;
    if (status) where.status = status;
    if (search) {
      where.tagNumber = {
        contains: search,
      };
    }

    const goats = await prisma.goat.findMany({
      where,
      include: {
        purchase: true,
        deaths: true,
        sales: true,
      },
      orderBy: {
        tagNumber: "asc",
      },
    });

    // Get summary counts
    const totalCount = await prisma.goat.count();
    const activeCount = await prisma.goat.count({ where: { status: "ACTIVE" } });
    const breedingCount = await prisma.goat.count({ where: { status: "BREEDING" } });
    const soldCount = await prisma.goat.count({ where: { status: "SOLD" } });
    const deadCount = await prisma.goat.count({ where: { status: "DEAD" } });

    // Distinct breeds
    const distinctBreeds = await prisma.goat.findMany({
      select: { breed: true },
      distinct: ["breed"],
    });

    return NextResponse.json({
      goats,
      breeds: distinctBreeds.map((b) => b.breed),
      summary: {
        total: totalCount,
        active: activeCount + breedingCount, // Combined active flock
        onlyActive: activeCount,
        breeding: breedingCount,
        sold: soldCount,
        dead: deadCount,
      },
    });
  } catch (error: any) {
    console.error("GET Goats error:", error);
    return NextResponse.json({ error: "Failed to fetch goats" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Goat Purchase (Bulk)
    if (action === "purchase") {
      const { purchaseDate, supplier, quantity, totalCost, fundingSource, loanId, notes, breed, gender, age, weight } = body;

      if (!purchaseDate || !supplier || !quantity || !totalCost || !fundingSource) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const qtyVal = parseInt(quantity);
      const costVal = parseFloat(totalCost);
      const costPerGoat = costVal / qtyVal;

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        const purchase = await tx.goatPurchase.create({
          data: {
            purchaseDate: new Date(purchaseDate),
            supplier,
            quantity: qtyVal,
            totalCost: costVal,
            costPerGoat,
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
              amount: costVal,
              purpose: `Bulk Goat Purchase: ${qtyVal} goats from ${supplier}`,
              date: new Date(purchaseDate),
            },
          });
        }

        // Generate goats
        const timestamp = Date.now();
        const goatData = [];
        for (let i = 0; i < qtyVal; i++) {
          goatData.push({
            tagNumber: `GT-${timestamp}-${i + 1}`,
            breed: breed || "Boer",
            gender: gender || "DOE",
            age: parseInt(age || 12),
            weight: parseFloat(weight || 30),
            purchaseCost: costPerGoat,
            status: "ACTIVE",
            purchaseId: purchase.id,
          });
        }

        await tx.goat.createMany({
          data: goatData,
        });

        // Also record as a cash outflow in expenses (under EQUIPMENT category or a specific LIVESTOCK category)
        await tx.expense.create({
          data: {
            date: new Date(purchaseDate),
            category: "EQUIPMENT",
            amount: costVal,
            fundingSource,
            loanId: fundingSource === "LOAN" || fundingSource === "MIXED" ? loanId : null,
            notes: `Bulk Goat Purchase (${qtyVal} head) from ${supplier}`,
          },
        });

        return purchase;
      });

      return NextResponse.json({ success: true, data: result });
    }

    // 2. Create Individual Goat
    if (action === "create") {
      const { tagNumber, breed, gender, age, weight, purchaseCost, status } = body;
      if (!tagNumber || !breed || !gender || purchaseCost === undefined) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      // Check tag number uniqueness
      const existing = await prisma.goat.findUnique({ where: { tagNumber } });
      if (existing) {
        return NextResponse.json({ error: `Tag number ${tagNumber} already exists` }, { status: 400 });
      }

      const goat = await prisma.goat.create({
        data: {
          tagNumber,
          breed,
          gender,
          age: parseInt(age || 0),
          weight: parseFloat(weight || 0),
          purchaseCost: parseFloat(purchaseCost),
          status: status || "ACTIVE",
        },
      });

      return NextResponse.json({ success: true, data: goat });
    }

    // 3. Update Goat Details
    if (action === "update") {
      const { id, tagNumber, breed, gender, age, weight, purchaseCost, status } = body;
      if (!id) {
        return NextResponse.json({ error: "Missing goat ID" }, { status: 400 });
      }

      const goat = await prisma.goat.update({
        where: { id },
        data: {
          tagNumber,
          breed,
          gender,
          age: age !== undefined ? parseInt(age) : undefined,
          weight: weight !== undefined ? parseFloat(weight) : undefined,
          purchaseCost: purchaseCost !== undefined ? parseFloat(purchaseCost) : undefined,
          status,
        },
      });

      return NextResponse.json({ success: true, data: goat });
    }

    // 4. Record Goat Death
    if (action === "die") {
      const { goatId, date, reason } = body;
      if (!goatId || !date) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        const goat = await tx.goat.findUnique({ where: { id: goatId } });
        if (!goat) {
          throw new Error("Goat not found");
        }

        // Set status to dead
        await tx.goat.update({
          where: { id: goatId },
          data: { status: "DEAD" },
        });

        // Record loss
        const death = await tx.goatDeath.create({
          data: {
            goatId,
            date: new Date(date),
            lossAmount: goat.purchaseCost,
            reason,
          },
        });

        // Add a notification alert
        await tx.notification.create({
          data: {
            type: "LOW_INVENTORY",
            title: "Goat Death Registered",
            message: `Goat ${goat.tagNumber} (${goat.breed}) died. Registered a financial loss of ₹${goat.purchaseCost.toLocaleString()}.`,
          },
        });

        return death;
      });

      return NextResponse.json({ success: true, data: result });
    }

    // 5. Individual or Bulk Sales
    if (action === "sell") {
      const { customerName, customerId, paymentMethod, paymentStatus, items, date, notes } = body;
      // items should be [{ goatId, salePrice }]
      if (!customerName || !paymentMethod || !paymentStatus || !items || items.length === 0 || !date) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        let totalSaleAmount = 0;

        // Create Sale Record
        const sale = await tx.goatSale.create({
          data: {
            date: new Date(date),
            customerName,
            customerId: customerId || null,
            paymentMethod,
            paymentStatus,
            totalAmount: 0, // Will update below
            notes,
          },
        });

        for (const item of items) {
          const goat = await tx.goat.findUnique({ where: { id: item.goatId } });
          if (!goat) {
            throw new Error(`Goat with ID ${item.goatId} not found`);
          }
          if (goat.status === "SOLD" || goat.status === "DEAD") {
            throw new Error(`Goat ${goat.tagNumber} is already sold or dead`);
          }

          const salePrice = parseFloat(item.salePrice);
          const profit = salePrice - goat.purchaseCost;
          totalSaleAmount += salePrice;

          // Record Sale Item
          await tx.goatSaleItem.create({
            data: {
              saleId: sale.id,
              goatId: goat.id,
              salePrice,
              profit,
            },
          });

          // Update Goat status to SOLD
          await tx.goat.update({
            where: { id: goat.id },
            data: { status: "SOLD" },
          });
        }

        // Update total sale amount in the sale record
        const updatedSale = await tx.goatSale.update({
          where: { id: sale.id },
          data: { totalAmount: totalSaleAmount },
        });

        // Add to Income ledger
        await tx.income.create({
          data: {
            date: new Date(date),
            category: "GOAT_SALE",
            amount: totalSaleAmount,
            notes: `Goat Sale to ${customerName} (${items.length} goats)`,
            refId: sale.id,
          },
        });

        // If payment status is PENDING, notify about outstanding balance
        if (paymentStatus === "PENDING") {
          await tx.notification.create({
            data: {
              type: "OUTSTANDING_PAYMENT",
              title: "Outstanding Payment Alert",
              message: `Customer ${customerName} has an outstanding balance of ₹${totalSaleAmount.toLocaleString()} for goat purchase.`,
            },
          });
        }

        return updatedSale;
      });

      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST Goats error:", error);
    return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
  }
}
