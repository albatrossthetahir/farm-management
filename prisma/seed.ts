import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Seed Users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const managerPassword = await bcrypt.hash("manager123", 10);
  const accountantPassword = await bcrypt.hash("accountant123", 10);
  const staffPassword = await bcrypt.hash("staff123", 10);

  // Clear existing data in reverse order of dependencies
  await prisma.user.deleteMany({});
  await prisma.loanUtilization.deleteMany({});
  await prisma.loanRepayment.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.chickenInventory.deleteMany({});
  await prisma.goatDeath.deleteMany({});
  await prisma.goatSaleItem.deleteMany({});
  await prisma.goatSale.deleteMany({});
  await prisma.kidSale.deleteMany({});
  await prisma.kid.deleteMany({});
  await prisma.goat.deleteMany({});
  await prisma.goatPurchase.deleteMany({});
  await prisma.chickenPurchase.deleteMany({});
  await prisma.chickenDeath.deleteMany({});
  await prisma.chickenSale.deleteMany({});
  await prisma.eggProduction.deleteMany({});
  await prisma.eggSale.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.income.deleteMany({});
  await prisma.salaryPayment.deleteMany({});
  await prisma.labour.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.closingLog.deleteMany({});
  await prisma.notification.deleteMany({});

  await prisma.user.createMany({
    data: [
      { username: "admin", name: "Admin User", password: adminPassword, role: "ADMIN" },
      { username: "manager", name: "Manager User", password: managerPassword, role: "MANAGER" },
      { username: "accountant", name: "Accountant User", password: accountantPassword, role: "ACCOUNTANT" },
      { username: "staff", name: "Staff User", password: staffPassword, role: "STAFF" },
    ],
  });
  console.log("Users seeded.");

  // 2. Seed Loan
  const initialLoan = await prisma.loan.create({
    data: {
      provider: "Rural Agricultural Development Bank",
      totalAmount: 500000.0,
      interestRate: 7.5,
      receivedDate: new Date("2026-01-15T00:00:00Z"),
      notes: "Starter business loan for farm setup and initial livestock inventory",
    },
  });
  console.log("Initial Loan seeded.");

  // 3. Seed Chicken Inventory
  await prisma.chickenInventory.create({
    data: {
      active: 0,
      sold: 0,
      dead: 0,
    },
  });
  console.log("Chicken inventory initialized.");

  // 4. Seed Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: "Ramesh Kumar",
      mobile: "9876543210",
      address: "12, Main Street, Village Block A",
    },
  });
  const customer2 = await prisma.customer.create({
    data: {
      name: "Suresh Patel",
      mobile: "8765432109",
      address: "Plot 45, Market Area, City Center",
    },
  });
  console.log("Customers seeded.");

  // 5. Seed Goat Purchase
  const goatPurchase1 = await prisma.goatPurchase.create({
    data: {
      purchaseDate: new Date("2026-02-10T00:00:00Z"),
      supplier: "Alpha Breeding Farm",
      quantity: 10,
      totalCost: 50000.0,
      costPerGoat: 5000.0,
      fundingSource: "LOAN",
      loanId: initialLoan.id,
      notes: "First batch of breeding does",
    },
  });

  // Track loan utilization
  await prisma.loanUtilization.create({
    data: {
      loanId: initialLoan.id,
      amount: 50000.0,
      purpose: "Purchased 10 Goats from Alpha Breeding Farm",
      date: new Date("2026-02-10T00:00:00Z"),
      expenseId: null,
    },
  });

  // Create Goats
  const breeds = ["Boer", "Beetal", "Sirohi"];
  for (let i = 0; i < 10; i++) {
    const isDoe = i < 8; // 8 females, 2 males
    await prisma.goat.create({
      data: {
        tagNumber: `GT-${1000 + i}`,
        breed: breeds[i % breeds.length],
        gender: isDoe ? "DOE" : "BUCK",
        age: 18,
        weight: isDoe ? 35.5 + i : 45.0 + i,
        purchaseCost: 5000.0,
        status: isDoe ? "BREEDING" : "ACTIVE",
        purchaseId: goatPurchase1.id,
      },
    });
  }
  console.log("Goats seeded.");

  // Seed a Chicken Purchase
  const chickenPurchase1 = await prisma.chickenPurchase.create({
    data: {
      purchaseDate: new Date("2026-03-01T00:00:00Z"),
      supplier: "Sun Hatcheries",
      quantity: 500,
      totalCost: 40000.0,
      costPerChicken: 80.0,
      fundingSource: "LOAN",
      loanId: initialLoan.id,
      notes: "Batch 1 - Day old chicks",
    },
  });

  await prisma.loanUtilization.create({
    data: {
      loanId: initialLoan.id,
      amount: 40000.0,
      purpose: "Purchased 500 Chickens from Sun Hatcheries",
      date: new Date("2026-03-01T00:00:00Z"),
      expenseId: null,
    },
  });

  // Update Chicken Inventory
  await prisma.chickenInventory.updateMany({
    data: {
      active: 500,
    },
  });
  console.log("Chicken purchase and inventory updated.");

  // Seed some expenses
  await prisma.expense.create({
    data: {
      date: new Date("2026-03-15T00:00:00Z"),
      category: "FEED",
      amount: 8000.0,
      fundingSource: "PERSONAL",
      notes: "Poultry and Goat starter feed bag purchase",
    },
  });

  await prisma.expense.create({
    data: {
      date: new Date("2026-03-20T00:00:00Z"),
      category: "MEDICINE",
      amount: 2500.0,
      fundingSource: "PERSONAL",
      notes: "Deworming medications and vaccines",
    },
  });

  // Seed some income
  await prisma.income.create({
    data: {
      date: new Date("2026-04-05T00:00:00Z"),
      category: "OTHER",
      amount: 3500.0,
      notes: "Sale of organic manure compost",
    },
  });

  // Seed some labour
  const labour1 = await prisma.labour.create({
    data: {
      fullName: "Mahesh Shinde",
      mobileNumber: "9876123456",
      address: "House 34, Sector 2, Agri-Town",
      idProof: "Aadhaar",
      joiningDate: new Date("2026-02-01T00:00:00Z"),
      salaryType: "MONTHLY",
      monthlySalary: 12000.0,
      status: "ACTIVE",
    },
  });

  console.log("Labour seeded.");
  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
