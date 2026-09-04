"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface WorkerFinance {
  id: string;
  fullName: string;
  financial: {
    pendingBalance: number;
    advance: number;
  };
}

interface PayBalanceSheetProps {
  open: boolean;
  onClose: () => void;
  worker: WorkerFinance;
  onSuccess: () => void;
}

export function PayBalanceSheet({
  open,
  onClose,
  worker,
  onSuccess,
}: PayBalanceSheetProps) {
  const [amount, setAmount] = useState(
    Math.round(worker.financial.pendingBalance).toString()
  );
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const pendingBalance = worker.financial.pendingBalance;

  const handlePay = async () => {
    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (payAmount > pendingBalance) {
      toast.error("Amount exceeds pending balance");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: worker.id,
          amount: payAmount,
          note: `Balance payout of ₹${Math.round(payAmount)}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        onSuccess();
      } else {
        toast.error(data.error || "Payout failed");
      }
    } catch {
      toast.error("Failed to process payout");
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setAmount(Math.round(pendingBalance).toString());
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
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <h2 className="text-[22px] font-bold text-gray-900">
              Pay Balance
            </h2>
            <p className="text-sm text-gray-500">{worker.fullName}</p>
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
                Payment Successful
              </h3>
              <p className="text-sm text-gray-500 text-center">
                {formatCurrency(Math.round(parseFloat(amount)))} paid from
                pending balance
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
              {/* Current Pending Balance */}
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                <p className="text-sm text-amber-600 uppercase tracking-wide font-medium">
                  Current Pending Balance
                </p>
                <p className="text-[28px] font-bold text-amber-700 mt-1">
                  {formatCurrency(Math.round(pendingBalance))}
                </p>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Amount to Pay
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="h-[56px] text-[20px] font-bold rounded-xl w-full text-center"
                  inputMode="numeric"
                />
                <p className="text-xs text-gray-400 text-center">
                  Enter full balance or a partial amount
                </p>
              </div>

              {/* Pay Button */}
              <Button
                onClick={handlePay}
                disabled={processing}
                className="w-full min-h-[56px] text-[16px] font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                {processing
                  ? "Processing..."
                  : `Pay ₹${Math.round(parseFloat(amount) || 0)} Now`}
              </Button>

              <div className="h-6" />
            </>
          )}
        </div>
      </div>
    </>
  );
}
