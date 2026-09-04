"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Wallet,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface Worker {
  id: string;
  workerId: string;
  fullName: string;
  department: string;
  profilePhoto: string | null;
  monthlySalary: number;
}

interface Financial {
  pendingBalance: number;
  advance: number;
}

interface Expense {
  id: string;
  amount: number;
  date: string;
  weekNumber: number;
  note: string | null;
}

interface Payout {
  id: string;
  amount: number;
  date: string;
  type: string;
  month: number | null;
  year: number | null;
  note: string | null;
  createdAt: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function WorkerFinancePage() {
  const params = useParams();
  const workerId = params.workerId as string;

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [worker, setWorker] = useState<Worker | null>(null);
  const [financial, setFinancial] = useState<Financial>({
    pendingBalance: 0,
    advance: 0,
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch worker details
      const workerRes = await fetch(`/api/workers/${workerId}`);
      if (workerRes.ok) {
        const workerData = await workerRes.json();
        setWorker(workerData);
      }

      // Fetch financials
      const finRes = await fetch(`/api/financials/${workerId}`);
      const finData = await finRes.json();
      setFinancial({
        pendingBalance: finData.pendingBalance || 0,
        advance: finData.advance || 0,
      });

      // Fetch expenses for selected month
      const expRes = await fetch(
        `/api/expenses?workerId=${workerId}&month=${month}&year=${year}`
      );
      const expData = await expRes.json();
      setExpenses(expData.expenses || []);

      // Fetch payout history
      const payRes = await fetch(`/api/payouts/${workerId}`);
      const payData = await payRes.json();
      setPayouts((payData.payouts || []).slice(0, 10));
    } catch {
      toast.error("Failed to load worker data");
    } finally {
      setLoading(false);
    }
  }, [workerId, month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading && !worker) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Link
        href="/finance"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 min-h-[48px] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Finance
      </Link>

      {/* Worker Header */}
      {worker && (
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-white">
              {worker.fullName.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-gray-900">
              {worker.fullName}
            </h1>
            <p className="text-sm text-gray-500">
              {worker.workerId} • {worker.department}
            </p>
          </div>
        </div>
      )}

      {/* Financial Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-amber-600" />
            <p className="text-xs text-amber-600 uppercase tracking-wide font-medium">
              Pending Balance
            </p>
          </div>
          <p className="text-[24px] font-bold text-amber-700">
            {formatCurrency(Math.round(financial.pendingBalance))}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-red-600" />
            <p className="text-xs text-red-600 uppercase tracking-wide font-medium">
              Advance
            </p>
          </div>
          <p className="text-[24px] font-bold text-red-700">
            {formatCurrency(Math.round(financial.advance))}
          </p>
        </Card>
      </div>

      {/* Month Selector */}
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors active:scale-[0.95]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-[16px] font-bold text-gray-900">
              {MONTHS[month - 1]} {year}
            </p>
          </div>
          <button
            onClick={nextMonth}
            className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors active:scale-[0.95]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </Card>

      {/* Expense History for Selected Month */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Expenses
          </h2>
          <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-sm font-bold">
            {formatCurrency(Math.round(expenseTotal))}
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : expenses.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-gray-400">
              No expenses for {MONTHS[month - 1]} {year}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <Card key={expense.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(expense.date)}
                      </p>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                        Week {expense.weekNumber}
                      </Badge>
                    </div>
                    {expense.note && (
                      <p className="text-xs text-gray-400 mt-0.5 italic">
                        {expense.note}
                      </p>
                    )}
                  </div>
                  <p className="text-[16px] font-bold text-gray-900">
                    {formatCurrency(Math.round(expense.amount))}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payout History */}
      <div>
        <h2 className="text-[18px] font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Payout History
        </h2>

        {payouts.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-gray-400">No payouts recorded yet</p>
          </Card>
        ) : (
          <div className="space-y-2 pb-8">
            {payouts.map((payout) => (
              <Card key={payout.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(payout.createdAt)}
                      </p>
                      <Badge
                        className={`text-[10px] ${
                          payout.type === "SALARY"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {payout.type === "SALARY" ? "Salary" : "Balance"}
                      </Badge>
                    </div>
                    {payout.note && (
                      <p className="text-xs text-gray-400 mt-0.5 italic max-w-[220px] truncate">
                        {payout.note}
                      </p>
                    )}
                  </div>
                  <p className="text-[16px] font-bold text-emerald-700">
                    {formatCurrency(Math.round(payout.amount))}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
