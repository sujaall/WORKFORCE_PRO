"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Sun,
  Clock,
  Users,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatTime, formatWorkingHours, calculateWorkingMinutes, getStatusLabel } from "@/lib/utils";
import { toast } from "sonner";

interface WorkerAttendance {
  id: string;
  workerId: string;
  fullName: string;
  department: string;
  monthlySalary: number;
  dailySalary: number;
  profilePhoto: string | null;
  attendance: {
    id: string;
    status: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    workingMinutes: number | null;
    earnedSalary: number | null;
    notes: string | null;
  } | null;
}

interface LocalRecord {
  status: string;
  checkInTime: string;
  checkOutTime: string;
  notes: string;
  changed: boolean;
}

export default function AttendancePage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [workers, setWorkers] = useState<WorkerAttendance[]>([]);
  const [localRecords, setLocalRecords] = useState<Record<string, LocalRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${date}`);
      const data = await res.json();
      setWorkers(data.workers || []);

      // Initialize local records from server data
      const records: Record<string, LocalRecord> = {};
      (data.workers || []).forEach((w: WorkerAttendance) => {
        records[w.id] = {
          status: w.attendance?.status || "",
          checkInTime: w.attendance?.checkInTime || "",
          checkOutTime: w.attendance?.checkOutTime || "",
          notes: w.attendance?.notes || "",
          changed: false,
        };
      });
      setLocalRecords(records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const updateRecord = (workerId: string, field: string, value: string) => {
    setLocalRecords((prev) => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        [field]: value,
        changed: true,
      },
    }));
  };

  const setStatus = (workerId: string, status: string) => {
    const now = format(new Date(), "HH:mm");
    setLocalRecords((prev) => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        status,
        checkInTime:
          status === "PRESENT" && !prev[workerId]?.checkInTime
            ? now
            : prev[workerId]?.checkInTime || "",
        changed: true,
      },
    }));
  };

  const markAllPresent = () => {
    const now = format(new Date(), "HH:mm");
    setLocalRecords((prev) => {
      const updated = { ...prev };
      workers.forEach((w) => {
        if (!updated[w.id]?.status || updated[w.id]?.status === "") {
          updated[w.id] = {
            ...updated[w.id],
            status: "PRESENT",
            checkInTime: updated[w.id]?.checkInTime || now,
            checkOutTime: updated[w.id]?.checkOutTime || "",
            notes: updated[w.id]?.notes || "",
            changed: true,
          };
        }
      });
      return updated;
    });
    toast.info("All unmarked workers set to Present");
  };

  const markAllAbsent = () => {
    setLocalRecords((prev) => {
      const updated = { ...prev };
      workers.forEach((w) => {
        if (!updated[w.id]?.status || updated[w.id]?.status === "") {
          updated[w.id] = {
            ...updated[w.id],
            status: "ABSENT",
            checkInTime: "",
            checkOutTime: "",
            notes: "",
            changed: true,
          };
        }
      });
      return updated;
    });
    toast.info("All unmarked workers set to Absent");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const changedRecords = Object.entries(localRecords)
        .filter(([_, r]) => r.changed && r.status)
        .map(([workerId, r]) => ({
          workerId,
          status: r.status,
          checkInTime: r.checkInTime || null,
          checkOutTime: r.checkOutTime || null,
          notes: r.notes || null,
        }));

      if (changedRecords.length === 0) {
        toast.info("No changes to save");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, records: changedRecords }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.count} attendance records saved`);
        fetchAttendance();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (err) {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(format(d, "yyyy-MM-dd"));
  };

  // Stats
  const stats = {
    total: workers.length,
    present: Object.values(localRecords).filter(
      (r) => r.status === "PRESENT" || r.status === "HALF_DAY"
    ).length,
    absent: Object.values(localRecords).filter((r) => r.status === "ABSENT").length,
    leave: Object.values(localRecords).filter((r) => r.status === "LEAVE").length,
    notMarked: Object.values(localRecords).filter((r) => !r.status).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Daily Attendance</h1>
          <p className="page-subtitle">Mark attendance for all active workers</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Attendance
        </Button>
      </div>

      {/* Date Picker & Quick Stats */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-[180px] text-center"
            />
            <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500"><Users className="w-4 h-4 inline mr-1" />{stats.total}</span>
            <span className="text-emerald-600">✓ {stats.present}</span>
            <span className="text-red-600">✗ {stats.absent}</span>
            <span className="text-amber-600">☀ {stats.leave}</span>
            <span className="text-gray-400">◦ {stats.notMarked}</span>
          </div>
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="outline" size="sm" onClick={markAllPresent} className="text-xs">
              Mark All Present
            </Button>
            <Button variant="outline" size="sm" onClick={markAllAbsent} className="text-xs">
              Mark All Absent
            </Button>
          </div>
        </div>
      </Card>

      {/* Attendance List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : workers.length === 0 ? (
        <div className="empty-state">
          <CalendarCheck className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No active workers</h3>
          <p className="text-sm text-gray-500 mt-1">Add workers to start marking attendance</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workers.map((worker) => {
            const record = localRecords[worker.id] || {
              status: "",
              checkInTime: "",
              checkOutTime: "",
              notes: "",
              changed: false,
            };
            const workMins = calculateWorkingMinutes(
              record.checkInTime || null,
              record.checkOutTime || null
            );

            return (
              <Card
                key={worker.id}
                className={`transition-all duration-200 ${record.changed ? "border-indigo-200 shadow-sm" : ""
                  }`}
              >
                <div className="p-4">
                  {/* Worker info + Status buttons */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Avatar & Name */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-gray-600">
                          {worker.fullName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{worker.fullName}</p>
                        <p className="text-xs text-gray-400">
                          {worker.workerId} • {worker.department}
                        </p>
                      </div>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setStatus(worker.id, "PRESENT")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${record.status === "PRESENT"
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                          }`}
                      >
                        ✓ Present
                      </button>
                      <button
                        onClick={() => setStatus(worker.id, "ABSENT")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${record.status === "ABSENT"
                          ? "bg-red-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700"
                          }`}
                      >
                        ✗ Absent
                      </button>
                      <button
                        onClick={() => setStatus(worker.id, "HALF_DAY")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${record.status === "HALF_DAY"
                          ? "bg-blue-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                          }`}
                      >
                        ½ Half Day
                      </button>
                      <button
                        onClick={() => setStatus(worker.id, "LEAVE")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${record.status === "LEAVE"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700"
                          }`}
                      >
                        ☀ Leave
                      </button>
                    </div>

                    {/* Time inputs (only show when Present or Half Day) */}
                    {(record.status === "PRESENT" || record.status === "HALF_DAY") && (
                      <div className="flex items-center gap-2 md:ml-auto">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">In:</span>
                          <Input
                            type="time"
                            value={record.checkInTime}
                            onChange={(e) => updateRecord(worker.id, "checkInTime", e.target.value)}
                            className="w-[110px] h-8 text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">Out:</span>
                          <Input
                            type="time"
                            value={record.checkOutTime}
                            onChange={(e) => updateRecord(worker.id, "checkOutTime", e.target.value)}
                            className="w-[110px] h-8 text-xs"
                          />
                        </div>
                        {workMins && (
                          <Badge variant="info" className="text-xs whitespace-nowrap">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatWorkingHours(workMins)}
                          </Badge>
                        )}
                        <span className="text-xs font-medium text-emerald-600 whitespace-nowrap">
                          {record.status === "HALF_DAY"
                            ? formatCurrency(worker.dailySalary * 0.5)
                            : formatCurrency(worker.dailySalary)}
                        </span>
                      </div>
                    )}

                    {record.status === "ABSENT" && (
                      <span className="text-xs text-red-500 md:ml-auto">₹0</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating save button on mobile */}
      {workers.length > 0 && (
        <div className="fixed bottom-6 right-6 lg:hidden z-30">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="xl"
            className="rounded-full shadow-lg gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
