import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workerId, amount, note } = body;

    if (!workerId || !amount) {
      return NextResponse.json(
        { error: "workerId and amount are required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Get current financial record
    const financial = await prisma.workerFinancial.findUnique({
      where: { workerId },
    });

    const pendingBalance = financial?.pendingBalance || 0;

    if (amount > pendingBalance) {
      return NextResponse.json(
        { error: `Amount (₹${amount}) exceeds pending balance (₹${pendingBalance})` },
        { status: 400 }
      );
    }

    // Deduct from pending balance and create payout record
    const [updatedFinancial, payout] = await prisma.$transaction([
      prisma.workerFinancial.update({
        where: { workerId },
        data: {
          pendingBalance: { decrement: amount },
        },
      }),
      prisma.payoutRecord.create({
        data: {
          workerId,
          amount: Math.round(parseFloat(amount.toString())),
          date: new Date(),
          type: "BALANCE",
          note: note || `Balance payout of ₹${amount}`,
        },
      }),
    ]);

    return NextResponse.json({
      message: `₹${amount} paid from pending balance`,
      payout,
      remainingBalance: updatedFinancial.pendingBalance,
    });
  } catch (error) {
    console.error("Payouts POST error:", error);
    return NextResponse.json(
      { error: "Failed to process payout" },
      { status: 500 }
    );
  }
}
