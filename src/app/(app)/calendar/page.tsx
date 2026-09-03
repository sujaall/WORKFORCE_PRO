"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
  Clock,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  formatCurrency,
  formatTime,
  formatWorkingHours,
  getStatusLabel,
  getStatusDot,
  formatDate,
} from "@/lib/utils";

interface Worker {
  id: string;
  workerId: string;
  fullName: string;
  department: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workingMinutes: number | null;
  earnedSalary: number | null;
  dailySalary: number | null;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const preselectedWorker = searchParams.get("worker") || "";

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState(preselectedWorker);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<AttendanceRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (selectedWorker) {
      fetchAttendance();
    }
  }, [selectedWorker, currentMonth]);

  const fetchWorkers = async () => {
    const res = await fetch("/api/workers?status=ACTIVE&limit=500");
    const data = await res.json();
    setWorkers(data.workers || []);
    if (!selectedWorker && data.workers?.length > 0) {
      setSelectedWorker(data.workers[0].id);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const month = (currentMonth.getMonth() + 1).toString();
      const year = currentMonth.getFullYear().toString();
      const res = await fetch(
        `/api/attendance?workerId=${selectedWorker}&month=${month}&year=${year}`
      );
      const data = await res.json();
      setAttendance(data.attendance || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const attendanceMap: Record<string, AttendanceRecord> = {};
  attendance.forEach((a) => {
    const day = format(new Date(a.date), "yyyy-MM-dd");
    attendanceMap[day] = a;
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const handleDayClick = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    const record = attendanceMap[key];
    if (record) {
      setSelectedDate(record);
      setDialogOpen(true);
    }
  };

  // Stats for the month
  const stats = {
    present: attendance.filter((a) => a.status === "PRESENT").length,
    absent: attendance.filter((a) => a.status === "ABSENT").length,
    leave: attendance.filter((a) => a.status === "LEAVE").length,
    halfDay: attendance.filter((a) => a.status === "HALF_DAY").length,
    holiday: attendance.filter((a) => a.status === "HOLIDAY").length,
  };

  const selectedWorkerData = workers.find((w) => w.id === selectedWorker);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Attendance Calendar</h1>
        <p className="page-subtitle">View individual worker attendance history</p>
      </div>

      {/* Worker Selector */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedWorker} onValueChange={setSelectedWorker}>
            <SelectTrigger className="sm:w-[300px]">
              <SelectValue placeholder="Select a worker" />
            </SelectTrigger>
            <SelectContent>
              {workers.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.fullName} ({w.workerId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedWorkerData && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{selectedWorkerData.department}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Calendar */}
      {selectedWorker && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-base">
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* Day names */}
                <div className="grid grid-cols-7 mb-2">
                  {DAY_NAMES.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for start offset */}
                  {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {/* Day cells */}
                  {days.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const record = attendanceMap[key];
                    const today = isToday(day);

                    let bgClass = "bg-gray-50 text-gray-400 hover:bg-gray-100";
                    if (record) {
                      switch (record.status) {
                        case "PRESENT":
                          bgClass = "cal-day-present";
                          break;
                        case "ABSENT":
                          bgClass = "cal-day-absent";
                          break;
                        case "LEAVE":
                          bgClass = "cal-day-leave";
                          break;
                        case "HOLIDAY":
                          bgClass = "cal-day-holiday";
                          break;
                        case "HALF_DAY":
                          bgClass = "cal-day-half-day";
                          break;
                      }
                    }

                    return (
                      <button
                        key={key}
                        onClick={() => handleDayClick(day)}
                        className={`cal-day ${bgClass} ${today ? "cal-day-today" : ""}`}
                      >
                        {format(day, "d")}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-100 justify-center">
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>Leave</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                    <span>Holiday</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>Half Day</span>
                  </div>
                </div>

                {/* Monthly stats */}
                <div className="grid grid-cols-5 gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">{stats.present}</p>
                    <p className="text-xs text-gray-500">Present</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-600">{stats.absent}</p>
                    <p className="text-xs text-gray-500">Absent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-600">{stats.leave}</p>
                    <p className="text-xs text-gray-500">Leave</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-600">{stats.halfDay}</p>
                    <p className="text-xs text-gray-500">Half Day</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-500">{stats.holiday}</p>
                    <p className="text-xs text-gray-500">Holiday</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Date Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
            <DialogDescription>
              {selectedDate && formatDate(selectedDate.date)}
            </DialogDescription>
          </DialogHeader>
          {selectedDate && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    selectedDate.status === "PRESENT"
                      ? "success"
                      : selectedDate.status === "ABSENT"
                      ? "destructive"
                      : selectedDate.status === "LEAVE"
                      ? "warning"
                      : "info"
                  }
                  className="text-sm px-3 py-1"
                >
                  {getStatusLabel(selectedDate.status)}
                </Badge>
              </div>

              {(selectedDate.status === "PRESENT" || selectedDate.status === "HALF_DAY") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Check-In</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {selectedDate.checkInTime
                        ? formatTime(selectedDate.checkInTime)
                        : "Not recorded"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Check-Out</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {selectedDate.checkOutTime
                        ? formatTime(selectedDate.checkOutTime)
                        : "Not recorded"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Working Hours</p>
                    <p className="text-sm font-medium">
                      {formatWorkingHours(selectedDate.workingMinutes)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Salary Earned</p>
                    <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {selectedDate.earnedSalary != null
                        ? formatCurrency(selectedDate.earnedSalary)
                        : "₹0"}
                    </p>
                  </div>
                </div>
              )}

              {selectedDate.status === "ABSENT" && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Salary Earned</p>
                  <p className="text-sm font-medium text-red-600">₹0</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
