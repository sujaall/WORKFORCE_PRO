"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Search,
  Plus,
  Loader2,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ExpenseSheet } from "@/components/expenses/ExpenseSheet";
import Link from "next/link";

interface Worker {
  id: string;
  workerId: string;
  fullName: string;
  department: string;
  monthlySalary: number;
  profilePhoto: string | null;
}

interface WorkerFinancial {
  pendingBalance: number;
  advance: number;
}

interface WorkerWithFinancials extends Worker {
  financial: WorkerFinancial;
}

export default function ExpensesPage() {
  const [workers, setWorkers] = useState<WorkerWithFinancials[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workers?limit=200&status=ACTIVE`);
      const data = await res.json();
      const workerList: Worker[] = data.workers || [];

      // Fetch financials for each worker
      const withFinancials = await Promise.all(
        workerList.map(async (w) => {
          try {
            const fRes = await fetch(`/api/financials/${w.id}`);
            const fData = await fRes.json();
            return {
              ...w,
              financial: {
                pendingBalance: fData.pendingBalance || 0,
                advance: fData.advance || 0,
              },
            };
          } catch {
            return {
              ...w,
              financial: { pendingBalance: 0, advance: 0 },
            };
          }
        })
      );

      setWorkers(withFinancials);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch workers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const filteredWorkers = workers.filter(
    (w) =>
      w.fullName.toLowerCase().includes(search.toLowerCase()) ||
      w.workerId.toLowerCase().includes(search.toLowerCase()) ||
      w.department.toLowerCase().includes(search.toLowerCase())
  );

  const getBorderColor = (w: WorkerWithFinancials) => {
    if (w.financial.advance > 0) return "border-l-red-500";
    if (w.financial.pendingBalance > 0) return "border-l-amber-500";
    return "border-l-emerald-500";
  };

  const getStatusLabel = (w: WorkerWithFinancials) => {
    if (w.financial.advance > 0)
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">
          Advance: {formatCurrency(Math.round(w.financial.advance))}
        </Badge>
      );
    if (w.financial.pendingBalance > 0)
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
          Pending: {formatCurrency(Math.round(w.financial.pendingBalance))}
        </Badge>
      );
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
        Clean
      </Badge>
    );
  };

  const handleWorkerClick = (worker: Worker) => {
    setSelectedWorker(worker);
    setSheetOpen(true);
  };

  const handleFabClick = () => {
    setSelectedWorker(null);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900">Expenses</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track worker expenses and advances
        </p>
      </div>

      {/* Quick Links */}
      <div className="flex gap-3">
        <Link
          href="/expenses/history"
          className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-all active:scale-[0.98]"
        >
          <Receipt className="w-4 h-4" />
          View History
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search workers by name, ID, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-[52px] text-[16px] rounded-xl border-gray-200 bg-white w-full"
        />
      </div>

      {/* Workers List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            No workers found
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {search ? "Try a different search term" : "Add workers first"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWorkers.map((worker) => (
            <Card
              key={worker.id}
              className={`border-l-4 ${getBorderColor(worker)} cursor-pointer hover:shadow-md transition-all active:scale-[0.99]`}
              onClick={() => handleWorkerClick(worker)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-bold text-white">
                        {worker.fullName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-[16px] text-gray-900">
                        {worker.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {worker.workerId} • {worker.department}
                      </p>
                    </div>
                  </div>
                  {getStatusLabel(worker)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={handleFabClick}
        className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-40 w-14 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl flex items-center justify-center transition-all active:scale-[0.92] hover:shadow-2xl"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Expense Sheet */}
      <ExpenseSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSelectedWorker(null);
        }}
        worker={selectedWorker}
        workers={workers}
        onSuccess={() => {
          fetchWorkers();
          toast.success("Expense added successfully");
        }}
      />
    </div>
  );
}
