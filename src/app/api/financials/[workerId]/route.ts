import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { workerId: string } }
) {
  try {
    const { workerId } = params;

    const financial = await prisma.workerFinancial.findUnique({
      where: { workerId },
    });

    if (!financial) {
      return NextResponse.json({
        workerId,
        pendingBalance: 0,
        advance: 0,
      });
    }

    return NextResponse.json(financial);
  } catch (error) {
    console.error("Financials GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial record" },
      { status: 500 }
    );
  }
}
