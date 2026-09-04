import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workerId, month, year, action } = body;

    if (!workerId || !month || !year) {
      return NextResponse.json(
        { error: "workerId, month, and year are required" },
        { status: 400 }
      );
    }

    // Check if already settled
    const existingPayout = await prisma.payoutRecord.findFirst({
      where: {
        workerId,
        type: "SALARY",
        month,
        year,
      },
    });

    if (existingPayout) {
      return NextResponse.json(
        { error: "Already settled" },
        { status: 400 }
      );
    }

    // Get salary record
    const salaryRecord = await prisma.salaryHistory.findUnique({
      where: {
        workerId_month_year: { workerId, month, year },
      },
    });

    if (!salaryRecord) {
      return NextResponse.json(
        { error: "No salary record" },
        { status: 400 }
      );
    }

    const totalEarnedSalary = salaryRecord.totalEarnedSalary;

    // Sum all expenses for that worker+month+year
    const expensesAgg = await prisma.workerExpense.aggregate({
      where: { workerId, month, year },
      _sum: { amount: true },
    });
    const totalExpenses = expensesAgg._sum.amount || 0;

    // Get current financial record
    const financial = await prisma.workerFinancial.findUnique({
      where: { workerId },
    });
    const currentAdvance = financial?.advance || 0;

    const netPayable = Math.round(totalEarnedSalary - totalExpenses - currentAdvance);

    // If no action provided, return the calculation for admin review
    if (!action) {
      return NextResponse.json({
        workerId,
        month,
        year,
        totalEarnedSalary,
        totalExpenses,
        advance: currentAdvance,
        netPayable,
        requiresAction: netPayable >= 0,
        deficit: netPayable < 0 ? Math.abs(netPayable) : 0,
      });
    }

    // Handle negative netPayable: add deficit to advance, no payout
    if (netPayable < 0) {
      const deficit = Math.round(Math.abs(netPayable));

      await prisma.workerFinancial.upsert({
        where: { workerId },
        create: {
          workerId,
          advance: deficit,
          pendingBalance: 0,
        },
        update: {
          advance: deficit,
        },
      });

      // Create a record noting the deficit carry-forward
      await prisma.payoutRecord.create({
        data: {
          workerId,
          amount: 0,
          date: new Date(),
          type: "SALARY",
          month,
          year,
          note: `Deficit of ₹${deficit} carried forward as advance. Earned: ₹${Math.round(totalEarnedSalary)}, Expenses: ₹${Math.round(totalExpenses)}, Prior Advance: ₹${Math.round(currentAdvance)}`,
        },
      });

      return NextResponse.json({
        message: `Deficit of ₹${deficit} added as advance for next month`,
        netPayable: 0,
        deficit,
        totalEarnedSalary,
        totalExpenses,
        priorAdvance: currentAdvance,
      });
    }

    // netPayable >= 0
    if (action === "PAY") {
      // Create payout record
      await prisma.payoutRecord.create({
        data: {
          workerId,
          amount: Math.round(netPayable),
          date: new Date(),
          type: "SALARY",
          month,
          year,
          note: `Salary settlement. Earned: ₹${Math.round(totalEarnedSalary)}, Expenses: ₹${Math.round(totalExpenses)}, Advance Deducted: ₹${Math.round(currentAdvance)}`,
        },
      });

      // Reset advance to 0
      await prisma.workerFinancial.upsert({
        where: { workerId },
        create: {
          workerId,
          advance: 0,
          pendingBalance: 0,
        },
        update: {
          advance: 0,
        },
      });

      return NextResponse.json({
        message: `₹${netPayable} paid to worker`,
        amountPaid: netPayable,
        totalEarnedSalary,
        totalExpenses,
        advanceDeducted: currentAdvance,
      });
    }

    if (action === "HOLD") {
      const roundedNet = Math.round(netPayable);
      // Add to pending balance, reset advance to 0
      await prisma.workerFinancial.upsert({
        where: { workerId },
        create: {
          workerId,
          pendingBalance: roundedNet,
          advance: 0,
        },
        update: {
          pendingBalance: { increment: roundedNet },
          advance: 0,
        },
      });

      // Create payout record marking it as held
      await prisma.payoutRecord.create({
        data: {
          workerId,
          amount: roundedNet,
          date: new Date(),
          type: "SALARY",
          month,
          year,
          note: `Salary held as pending balance. Earned: ₹${Math.round(totalEarnedSalary)}, Expenses: ₹${Math.round(totalExpenses)}, Advance Deducted: ₹${Math.round(currentAdvance)}`,
        },
      });

      return NextResponse.json({
        message: `₹${roundedNet} added to pending balance`,
        amountHeld: roundedNet,
        totalEarnedSalary,
        totalExpenses,
        advanceDeducted: currentAdvance,
      });
    }


    return NextResponse.json(
      { error: "Invalid action. Use PAY or HOLD" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Settlements POST error:", error);
    return NextResponse.json(
      { error: "Failed to process settlement" },
      { status: 500 }
    );
  }
}
