"use client";

import { useState } from "react";
import { format } from "date-fns";
import { X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Worker {
  id: string;
  workerId: string;
  fullName: string;
  department: string;
}

interface ExpenseSheetProps {
  open: boolean;
  onClose: () => void;
  worker: Worker | null;
  workers: Worker[];
  onSuccess: () => void;
}

function getWeekNumber(day: number): number {
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

function getWeekLabel(weekNum: number): string {
  return `Week ${weekNum} (Day ${(weekNum - 1) * 7 + 1}–${weekNum === 4 ? "31" : weekNum * 7})`;
}

export function ExpenseSheet({
  open,
  onClose,
  worker,
  workers,
  onSuccess,
}: ExpenseSheetProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState(worker?.id || "");
  const [workerSearch, setWorkerSearch] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showWorkerList, setShowWorkerList] = useState(false);

  const selectedWorkerObj =
    worker || workers.find((w) => w.id === selectedWorkerId);

  const parsedDate = new Date(date);
  const dayOfMonth = parsedDate.getUTCDate() || new Date().getDate();
  const weekNumber = getWeekNumber(dayOfMonth);

  const quickAmounts = [500, 1000, 1500, 2000];

  const filteredWorkers = workers.filter(
    (w) =>
      w.fullName.toLowerCase().includes(workerSearch.toLowerCase()) ||
      w.workerId.toLowerCase().includes(workerSearch.toLowerCase())
  );

  const handleSave = async () => {
    const finalWorkerId = worker?.id || selectedWorkerId;
    if (!finalWorkerId) {
      toast.error("Please select a worker");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: finalWorkerId,
          amount: parseFloat(amount),
          date,
          note: note || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess();
        resetForm();
        onClose();
      } else {
        toast.error(data.error || "Failed to save expense");
      }
    } catch {
      toast.error("Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setNote("");
    setSelectedWorkerId("");
    setWorkerSearch("");
    setShowWorkerList(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-[22px] font-bold text-gray-900">Add Expense</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Worker Selector (only if no pre-selected worker) */}
          {!worker && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Worker
              </label>
              {selectedWorkerObj ? (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {selectedWorkerObj.fullName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[16px] text-gray-900">
                        {selectedWorkerObj.fullName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedWorkerObj.workerId}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedWorkerId("");
                      setShowWorkerList(true);
                    }}
                    className="text-sm text-slate-600 font-medium min-h-[48px] px-3"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Search worker by name or ID..."
                    value={workerSearch}
                    onChange={(e) => {
                      setWorkerSearch(e.target.value);
                      setShowWorkerList(true);
                    }}
                    onFocus={() => setShowWorkerList(true)}
                    className="h-[52px] text-[16px] rounded-xl w-full"
                  />
                  {showWorkerList && (
                    <div className="max-h-[200px] overflow-y-auto border border-gray-200 rounded-xl bg-white">
                      {filteredWorkers.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => {
                            setSelectedWorkerId(w.id);
                            setShowWorkerList(false);
                            setWorkerSearch("");
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left min-h-[52px] border-b border-gray-50 last:border-b-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-white">
                              {w.fullName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">
                              {w.fullName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {w.workerId} • {w.department}
                            </p>
                          </div>
                        </button>
                      ))}
                      {filteredWorkers.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">
                          No workers found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selected worker info (when pre-selected) */}
          {worker && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {worker.fullName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-[16px] text-gray-900">
                  {worker.fullName}
                </p>
                <p className="text-xs text-gray-500">
                  {worker.workerId} • {worker.department}
                </p>
              </div>
            </div>
          )}

          {/* Quick Amount Chips */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Amount
            </label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((qa) => (
                <button
                  key={qa}
                  onClick={() => setAmount(qa.toString())}
                  className={`min-h-[64px] rounded-xl font-bold text-[16px] transition-all active:scale-[0.96] ${
                    amount === qa.toString()
                      ? "bg-slate-900 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  ₹{qa.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Or enter custom amount..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-[52px] text-[16px] rounded-xl w-full mt-2"
              inputMode="numeric"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-[52px] text-[16px] rounded-xl w-full"
            />
          </div>

          {/* Week Number (read-only) */}
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
            <span className="text-sm font-medium text-blue-700">
              📅 {getWeekLabel(weekNumber)}
            </span>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Note{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Tea, snacks, transport..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-[52px] text-[16px] rounded-xl w-full"
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-[56px] text-[16px] font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            {saving ? "Saving..." : "Save Expense"}
          </Button>

          {/* Bottom safe area for mobile */}
          <div className="h-6" />
        </div>
      </div>
    </>
  );
}
