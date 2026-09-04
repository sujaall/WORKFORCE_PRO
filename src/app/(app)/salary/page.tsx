"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, IndianRupee, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface SalaryWorker {
  id: string;
  workerId: string;
  fullName: string;
  department: string;
  monthlySalary: number;
  dailySalary: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  holidayDays: number;
  totalEarned: number;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DEPARTMENTS = ["Production", "Assembly", "Quality Control", "Maintenance", "Packaging", "Warehouse", "Administration"];

export default function SalaryPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [department, setDepartment] = useState("");
  const [workers, setWorkers] = useState<SalaryWorker[]>([]);
  const [totalPayroll, setTotalPayroll] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<SalaryWorker | null>(null);

  const fetchSalary = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: month.toString(),
        year: year.toString(),
      });
      if (department) params.set("department", department);

      const res = await fetch(`/api/salary?${params}`);
      const data = await res.json();
      setWorkers(data.workers || []);
      setTotalPayroll(data.totalPayroll || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year, department]);

  useEffect(() => {
    fetchSalary();
  }, [fetchSalary]);

  const generateSalary = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to generate salary");
    } finally {
      setGenerating(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Salary Management</h1>
          <p className="page-subtitle">Monthly salary calculations based on attendance</p>
        </div>
        <Button onClick={generateSalary} disabled={generating} className="gap-2">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Generate Monthly Report
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
            <SelectTrigger className="sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={department || "all"} onValueChange={(v) => setDepartment(v === "all" ? "" : v)}>
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Total Payroll */}
      <div className="stat-card stat-card-success">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Payroll — {MONTHS[month - 1]} {year}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(totalPayroll)}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <IndianRupee className="w-7 h-7 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Salary Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : workers.length === 0 ? (
        <div className="empty-state">
          <IndianRupee className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No salary data</h3>
          <p className="text-sm text-gray-500 mt-1">Mark attendance to see salary calculations</p>
        </div>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th>Worker</th>
                    <th className="hidden md:table-cell">Monthly</th>
                    <th className="hidden md:table-cell">Daily</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th className="hidden sm:table-cell">Half</th>
                    <th className="hidden sm:table-cell">Leave</th>
                    <th>Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker) => (
                    <tr
                      key={worker.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedWorker(worker)}
                    >
                      <td>
                        <div>
                          <p className="font-medium text-sm">{worker.fullName}</p>
                          <p className="text-xs text-gray-400">{worker.workerId}</p>
                        </div>
                      </td>
                      <td className="hidden md:table-cell text-sm">{formatCurrency(worker.monthlySalary)}</td>
                      <td className="hidden md:table-cell text-sm">{formatCurrency(worker.dailySalary)}</td>
                      <td><Badge variant="success">{worker.presentDays}</Badge></td>
                      <td><Badge variant="destructive">{worker.absentDays}</Badge></td>
                      <td className="hidden sm:table-cell"><Badge variant="info">{worker.halfDays}</Badge></td>
                      <td className="hidden sm:table-cell"><Badge variant="warning">{worker.leaveDays}</Badge></td>
                      <td className="font-semibold text-emerald-600">{formatCurrency(worker.totalEarned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Selected Worker Detail */}
          {selectedWorker && (
            <Card className="border-indigo-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">{selectedWorker.fullName}</CardTitle>
                  <p className="text-sm text-gray-500">{selectedWorker.workerId} • {selectedWorker.department}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedWorker(null)}>✕</Button>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-gray-400">Monthly Salary</p>
                    <p className="text-lg font-bold">{formatCurrency(selectedWorker.monthlySalary)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Daily Salary</p>
                    <p className="text-lg font-bold">{formatCurrency(selectedWorker.dailySalary)}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(selectedWorker.monthlySalary)} ÷ 30</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Attendance</p>
                    <p className="text-sm mt-1">
                      Present: <span className="font-semibold text-emerald-600">{selectedWorker.presentDays}</span>
                      {" • "}Absent: <span className="font-semibold text-red-600">{selectedWorker.absentDays}</span>
                      {selectedWorker.halfDays > 0 && <>{" • "}Half: <span className="font-semibold text-blue-600">{selectedWorker.halfDays}</span></>}
                      {selectedWorker.leaveDays > 0 && <>{" • "}Leave: <span className="font-semibold text-amber-600">{selectedWorker.leaveDays}</span></>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Salary Breakdown</p>
                    <div className="text-sm mt-1 space-y-0.5">
                      <p>Present: {selectedWorker.presentDays} × {formatCurrency(selectedWorker.dailySalary)} = {formatCurrency(selectedWorker.presentDays * selectedWorker.dailySalary)}</p>
                      {selectedWorker.halfDays > 0 && (
                        <p>Half Day: {selectedWorker.halfDays} × {formatCurrency(selectedWorker.dailySalary * 0.5)} = {formatCurrency(selectedWorker.halfDays * selectedWorker.dailySalary * 0.5)}</p>
                      )}
                      <p className="font-bold text-emerald-600 pt-1 border-t">Total: {formatCurrency(selectedWorker.totalEarned)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
