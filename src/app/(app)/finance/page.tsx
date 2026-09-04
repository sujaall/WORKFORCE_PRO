"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { SettlementSheet } from "@/components/finance/SettlementSheet";
import { PayBalanceSheet } from "@/components/finance/PayBalanceSheet";
import Link from "next/link";

interface SalaryRecord {
  workerId: string;
  month: number;
  year: number;
  totalEarnedSalary: number;
}

interface WorkerFinance {
  id: string;
  workerId: string;
  fullName: string;
  department: string;
  monthlySalary: number;
  profilePhoto: string | null;
  salary: SalaryRecord | null;
  totalExpenses: number;
  financial: {
    pendingBalance: number;
    advance: number;
  };
  netPayable: number;
  isSettled: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function FinancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [workers, setWorkers] = useState<WorkerFinance[]>([]);
  const [loading, setLoading] = useState(true);

  // Settlement sheet
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [settlementWorker, setSettlementWorker] = useState<WorkerFinance | null>(null);

  // Pay balance sheet
  const [payBalanceOpen, setPayBalanceOpen] = useState(false);
  const [payBalanceWorker, setPayBalanceWorker] = useState<WorkerFinance | null>(null);

  const fetchFinanceData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all active workers
      const workersRes = await fetch("/api/workers?limit=200&status=ACTIVE");
      const workersData = await workersRes.json();
      const workerList = workersData.workers || [];

      // Fetch salary, expenses, financials, and settlement status for each
      const enriched: WorkerFinance[] = await Promise.all(
        workerList.map(async (w: any) => {
          try {
            // Check settlement (no action = just get calculation)
            const settlementRes = await fetch("/api/settlements", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ workerId: w.id, month, year }),
            });
            const settlementData = await settlementRes.json();

            // Get financials
            const finRes = await fetch(`/api/financials/${w.id}`);
            const finData = await finRes.json();

            const isSettled = settlementRes.status === 400 && settlementData.error === "Already settled";
            const hasSalary = settlementRes.status !== 400 || isSettled;

            return {
              id: w.id,
              workerId: w.workerId,
              fullName: w.fullName,
              department: w.department,
              monthlySalary: w.monthlySalary,
              profilePhoto: w.profilePhoto,
              salary: hasSalary
                ? {
                    workerId: w.id,
                    month,
                    year,
                    totalEarnedSalary: settlementData.totalEarnedSalary || 0,
                  }
                : null,
              totalExpenses: settlementData.totalExpenses || 0,
              financial: {
                pendingBalance: finData.pendingBalance || 0,
                advance: finData.advance || 0,
              },
              netPayable: settlementData.netPayable || 0,
              isSettled,
            };
          } catch {
            return {
              id: w.id,
              workerId: w.workerId,
              fullName: w.fullName,
              department: w.department,
              monthlySalary: w.monthlySalary,
              profilePhoto: w.profilePhoto,
              salary: null,
              totalExpenses: 0,
              financial: { pendingBalance: 0, advance: 0 },
              netPayable: 0,
              isSettled: false,
            };
          }
        })
      );

      setWorkers(enriched);
    } catch {
      toast.error("Failed to load finance data");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const getBorderColor = (w: WorkerFinance) => {
    if (w.financial.advance > 0) return "border-l-red-500";
    if (w.financial.pendingBalance > 0) return "border-l-amber-500";
    return "border-l-emerald-500";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900">Finance</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monthly salary settlements and payouts
        </p>
      </div>

      {/* Month/Year Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors active:scale-[0.95]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-[18px] font-bold text-gray-900">
              {MONTHS[month - 1]}
            </p>
            <p className="text-sm text-gray-500">{year}</p>
          </div>
          <button
            onClick={nextMonth}
            className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors active:scale-[0.95]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </Card>

      {/* Worker Finance Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : workers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Wallet className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            No workers found
          </h3>
        </div>
      ) : (
        <div className="space-y-4 pb-8">
          {workers.map((worker) => (
            <Card
              key={worker.id}
              className={`border-l-4 ${getBorderColor(worker)} overflow-hidden`}
            >
              <div className="p-4 space-y-4">
                {/* Worker Info */}
                <Link
                  href={`/finance/${worker.id}`}
                  className="flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-white">
                      {worker.fullName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[16px] text-gray-900">
                      {worker.fullName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {worker.workerId} • {worker.department}
                    </p>
                  </div>
                  {worker.isSettled && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Settled
                    </Badge>
                  )}
                </Link>

                {/* Finance Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Gross Earned
                    </p>
                    <p className="text-[18px] font-bold text-gray-900 mt-1">
                      {worker.salary
                        ? formatCurrency(Math.round(worker.salary.totalEarnedSalary))
                        : "—"}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3">
                    <p className="text-xs text-red-600 uppercase tracking-wide">
                      Expenses
                    </p>
                    <p className="text-[18px] font-bold text-red-700 mt-1">
                      {formatCurrency(Math.round(worker.totalExpenses))}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-xs text-amber-600 uppercase tracking-wide">
                      Advance
                    </p>
                    <p className="text-[18px] font-bold text-amber-700 mt-1">
                      {formatCurrency(Math.round(worker.financial.advance))}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3">
                    <p className="text-xs text-orange-600 uppercase tracking-wide">
                      Pending
                    </p>
                    <p className="text-[18px] font-bold text-orange-700 mt-1">
                      {formatCurrency(Math.round(worker.financial.pendingBalance))}
                    </p>
                  </div>
                </div>

                {/* Net Payable (highlighted) */}
                <div className={`rounded-xl p-4 ${
                  worker.netPayable >= 0
                    ? "bg-emerald-50 border border-emerald-200"
                    : "bg-red-50 border border-red-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600">
                      Net Payable
                    </p>
                    <p className={`text-[22px] font-bold ${
                      worker.netPayable >= 0 ? "text-emerald-700" : "text-red-700"
                    }`}>
                      {formatCurrency(Math.round(worker.netPayable))}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {worker.isSettled ? (
                    <div className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-gray-100 rounded-xl text-sm font-medium text-gray-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Already Settled
                    </div>
                  ) : !worker.salary ? (
                    <div className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-gray-100 rounded-xl text-sm font-medium text-gray-400">
                      <Ban className="w-4 h-4" />
                      No Salary Record
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setSettlementWorker(worker);
                        setSettlementOpen(true);
                      }}
                      className="flex-1 min-h-[48px] text-[16px] font-semibold rounded-xl bg-slate-900 hover:bg-slate-800"
                    >
                      Settle Month
                    </Button>
                  )}

                  {worker.financial.pendingBalance > 0 && (
                    <Button
                      onClick={() => {
                        setPayBalanceWorker(worker);
                        setPayBalanceOpen(true);
                      }}
                      variant="outline"
                      className="flex-1 min-h-[48px] text-[16px] font-semibold rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      Pay Balance
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Settlement Sheet */}
      {settlementWorker && (
        <SettlementSheet
          open={settlementOpen}
          onClose={() => {
            setSettlementOpen(false);
            setSettlementWorker(null);
          }}
          worker={settlementWorker}
          month={month}
          year={year}
          onSuccess={() => {
            fetchFinanceData();
          }}
        />
      )}

      {/* Pay Balance Sheet */}
      {payBalanceWorker && (
        <PayBalanceSheet
          open={payBalanceOpen}
          onClose={() => {
            setPayBalanceOpen(false);
            setPayBalanceWorker(null);
          }}
          worker={payBalanceWorker}
          onSuccess={() => {
            fetchFinanceData();
          }}
        />
      )}
    </div>
  );
}
