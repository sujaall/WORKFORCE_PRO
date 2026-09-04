"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Loader2,
  Trash2,
  Receipt,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Expense {
  id: string;
  workerId: string;
  amount: number;
  date: string;
  weekNumber: number;
  month: number;
  year: number;
  note: string | null;
  worker: {
    fullName: string;
    workerId: string;
  };
}

interface Worker {
  id: string;
  workerId: string;
  fullName: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ExpenseHistoryPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/expenses?month=${month}&year=${year}`;
      if (selectedWorkerId) {
        url += `&workerId=${selectedWorkerId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setExpenses(data.expenses || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  }, [month, year, selectedWorkerId]);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch("/api/workers?limit=200&status=ACTIVE");
      const data = await res.json();
      setWorkers(data.workers || []);
    } catch {
      console.error("Failed to fetch workers");
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Expense deleted");
        fetchExpenses();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete expense");
    } finally {
      setDeleting(null);
    }
  };

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

  const getWeekLabel = (weekNum: number) => `Week ${weekNum}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900">
          Expense History
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage all recorded expenses
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

      {/* Worker Filter */}
      <select
        value={selectedWorkerId}
        onChange={(e) => setSelectedWorkerId(e.target.value)}
        className="w-full h-[52px] text-[16px] rounded-xl border border-gray-200 bg-white px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
      >
        <option value="">All Workers</option>
        {workers.map((w) => (
          <option key={w.id} value={w.id}>
            {w.fullName} ({w.workerId})
          </option>
        ))}
      </select>

      {/* Expense Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Receipt className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            No expenses found
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            No expenses recorded for {MONTHS[month - 1]} {year}
          </p>
        </div>
      ) : (
        <div className="space-y-3 pb-24">
          {expenses.map((expense) => (
            <Card key={expense.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[16px] text-gray-900">
                      {expense.worker.fullName}
                    </p>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      {getWeekLabel(expense.weekNumber)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDate(expense.date)}
                  </p>
                  {expense.note && (
                    <p className="text-sm text-gray-400 italic">
                      {expense.note}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-[18px] font-bold text-gray-900">
                    {formatCurrency(Math.round(expense.amount))}
                  </p>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={deleting === expense.id}
                    className="w-12 h-12 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 transition-colors active:scale-[0.95] disabled:opacity-50"
                  >
                    {deleting === expense.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pinned Total Bar */}
      {!loading && expenses.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-0 left-0 right-0 lg:left-[260px] z-20 bg-slate-900 text-white px-6 py-4 shadow-2xl">
          <div className="flex items-center justify-between max-w-[1400px] mx-auto">
            <span className="text-[16px] font-medium opacity-80">
              Total for {MONTHS[month - 1]}
            </span>
            <span className="text-[22px] font-bold">
              {formatCurrency(Math.round(total))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
