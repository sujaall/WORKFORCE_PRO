"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface WorkerFinance {
  id: string;
  fullName: string;
  salary: {
    totalEarnedSalary: number;
  } | null;
  totalExpenses: number;
  financial: {
    pendingBalance: number;
    advance: number;
  };
  netPayable: number;
}

interface SettlementSheetProps {
  open: boolean;
  onClose: () => void;
  worker: WorkerFinance;
  month: number;
  year: number;
  onSuccess: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function SettlementSheet({
  open,
  onClose,
  worker,
  month,
  year,
  onSuccess,
}: SettlementSheetProps) {
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const grossEarned = worker.salary?.totalEarnedSalary || 0;
  const expenses = worker.totalExpenses;
  const advance = worker.financial.advance;
  const netPayable = worker.netPayable;
  const isDeficit = netPayable < 0;

  const handleAction = async (action: string) => {
    setProcessing(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: worker.id,
          month,
          year,
          action,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setSuccessMessage(data.message || "Settlement completed");
        onSuccess();
      } else {
        const msg = data.error || "Settlement failed";
        setErrorMessage(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to process settlement";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeficitConfirm = async () => {
    // For deficit, we send action as PAY which will trigger the deficit logic on backend
    await handleAction("PAY");
  };

  const handleClose = () => {
    setSuccess(false);
    setSuccessMessage("");
    setErrorMessage("");
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="text-[22px] font-bold text-gray-900">
              Settle Month
            </h2>
            <p className="text-sm text-gray-500">
              {worker.fullName} — {MONTHS[month - 1]} {year}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {success ? (
            /* Success State */
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-[18px] font-bold text-gray-900 text-center">
                Settlement Complete
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-[280px]">
                {successMessage}
              </p>
              <Button
                onClick={handleClose}
                className="w-full min-h-[48px] text-[16px] font-semibold rounded-xl mt-4"
              >
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* Error Banner */}
              {errorMessage && (
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">{errorMessage}</p>
                </div>
              )}

              {/* Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-[16px] text-gray-600">Gross Earned</span>
                  <span className="text-[18px] font-bold text-gray-900">
                    {formatCurrency(Math.round(grossEarned))}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-[16px] text-red-600">− Expenses</span>
                  <span className="text-[18px] font-bold text-red-700">
                    {formatCurrency(Math.round(expenses))}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-[16px] text-amber-600">− Advance</span>
                  <span className="text-[18px] font-bold text-amber-700">
                    {formatCurrency(Math.round(advance))}
                  </span>
                </div>
                <div
                  className={`flex items-center justify-between py-4 rounded-xl px-4 ${
                    isDeficit
                      ? "bg-red-50 border border-red-200"
                      : "bg-emerald-50 border border-emerald-200"
                  }`}
                >
                  <span className="text-[16px] font-semibold text-gray-700">
                    = Net Payable
                  </span>
                  <span
                    className={`text-[24px] font-bold ${
                      isDeficit ? "text-red-700" : "text-emerald-700"
                    }`}
                  >
                    {formatCurrency(Math.round(netPayable))}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {isDeficit ? (
                /* Deficit: Carry forward */
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      Worker expenses and advance exceed earned salary.
                      The deficit of{" "}
                      <strong>
                        {formatCurrency(Math.round(Math.abs(netPayable)))}
                      </strong>{" "}
                      will be carried forward as advance for next month.
                    </p>
                  </div>
                  <Button
                    onClick={handleDeficitConfirm}
                    disabled={processing}
                    className="w-full min-h-[56px] text-[16px] font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {processing ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : null}
                    {processing
                      ? "Processing..."
                      : `Confirm — Carry ₹${Math.round(Math.abs(netPayable))} as Advance`}
                  </Button>
                </div>
              ) : (
                /* Net >= 0: Pay or Hold */
                <div className="space-y-3">
                  <Button
                    onClick={() => handleAction("PAY")}
                    disabled={processing}
                    className="w-full min-h-[56px] text-[16px] font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                  >
                    {processing ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : null}
                    Pay {formatCurrency(Math.round(netPayable))} Now
                  </Button>
                  <Button
                    onClick={() => handleAction("HOLD")}
                    disabled={processing}
                    variant="outline"
                    className="w-full min-h-[56px] text-[16px] font-bold rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    Hold to Balance
                  </Button>
                </div>
              )}

              <div className="h-6" />
            </>
          )}
        </div>
      </div>
    </>
  );
}
