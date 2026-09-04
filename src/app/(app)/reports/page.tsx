"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, BarChart3, Download, FileText, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DEPARTMENTS = ["Production", "Assembly", "Quality Control", "Maintenance", "Packaging", "Warehouse", "Administration"];

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
  totalEarned: number;
}

export default function ReportsPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [department, setDepartment] = useState("");
  const [reportType, setReportType] = useState("salary");
  const [data, setData] = useState<SalaryWorker[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: month.toString(),
        year: year.toString(),
      });
      if (department) params.set("department", department);

      const res = await fetch(`/api/salary?${params}`);
      const json = await res.json();
      setData(json.workers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year, department]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const exportCSV = () => {
    try {
      const headers = ["Worker ID", "Name", "Department", "Monthly Salary", "Daily Salary", "Present Days", "Absent Days", "Half Days", "Leave Days", "Total Earned"];
      const rows = data.map((w) => [
        w.workerId, w.fullName, w.department, w.monthlySalary, w.dailySalary,
        w.presentDays, w.absentDays, w.halfDays, w.leaveDays, w.totalEarned,
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `salary_report_${MONTHS[month - 1]}_${year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Salary Report — ${MONTHS[month - 1]} ${year}`, 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

      autoTable(doc, {
        startY: 38,
        head: [["ID", "Name", "Dept", "Monthly", "Present", "Absent", "Half", "Earned"]],
        body: data.map((w) => [
          w.workerId, w.fullName, w.department,
          `₹${w.monthlySalary.toLocaleString()}`,
          w.presentDays, w.absentDays, w.halfDays,
          `₹${w.totalEarned.toLocaleString()}`,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [31, 41, 55] },
      });

      const totalPayroll = data.reduce((s, w) => s + w.totalEarned, 0);
      const finalY = (doc as any).lastAutoTable.finalY || 100;
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Total Payroll: ₹${totalPayroll.toLocaleString()}`, 14, finalY + 10);

      doc.save(`salary_report_${MONTHS[month - 1]}_${year}.pdf`);
      toast.success("PDF exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  const totalPayroll = data.reduce((s, w) => s + w.totalEarned, 0);
  const totalPresent = data.reduce((s, w) => s + w.presentDays, 0);
  const totalAbsent = data.reduce((s, w) => s + w.absentDays, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate and export attendance & salary reports</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
            <SelectTrigger className="sm:w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="sm:w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027, 2028].map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={department || "all"} onValueChange={(v) => setDepartment(v === "all" ? "" : v)}>
            <SelectTrigger className="sm:w-[180px]"><SelectValue placeholder="All Departments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="sm:ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1">
              <Table2 className="w-4 h-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF} disabled={exporting} className="gap-1">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card stat-card-primary">
          <p className="text-2xl font-bold">{data.length}</p>
          <p className="text-xs text-gray-500">Workers</p>
        </div>
        <div className="stat-card stat-card-success">
          <p className="text-2xl font-bold text-emerald-600">{totalPresent}</p>
          <p className="text-xs text-gray-500">Total Present Days</p>
        </div>
        <div className="stat-card stat-card-danger">
          <p className="text-2xl font-bold text-red-600">{totalAbsent}</p>
          <p className="text-xs text-gray-500">Total Absent Days</p>
        </div>
        <div className="stat-card stat-card-info">
          <p className="text-2xl font-bold">{formatCurrency(totalPayroll)}</p>
          <p className="text-xs text-gray-500">Total Payroll</p>
        </div>
      </div>

      {/* Report Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="bg-gray-50/50">
                  <th>Worker</th>
                  <th>Department</th>
                  <th>Monthly</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th className="hidden sm:table-cell">Half</th>
                  <th className="hidden sm:table-cell">Leave</th>
                  <th>Earned</th>
                </tr>
              </thead>
              <tbody>
                {data.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <p className="font-medium text-sm">{w.fullName}</p>
                      <p className="text-xs text-gray-400">{w.workerId}</p>
                    </td>
                    <td className="text-sm">{w.department}</td>
                    <td className="text-sm">{formatCurrency(w.monthlySalary)}</td>
                    <td><Badge variant="success">{w.presentDays}</Badge></td>
                    <td><Badge variant="destructive">{w.absentDays}</Badge></td>
                    <td className="hidden sm:table-cell"><Badge variant="info">{w.halfDays}</Badge></td>
                    <td className="hidden sm:table-cell"><Badge variant="warning">{w.leaveDays}</Badge></td>
                    <td className="font-semibold text-emerald-600">{formatCurrency(w.totalEarned)}</td>
                  </tr>
                ))}
              </tbody>
              {data.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={2} className="py-3 px-4 text-sm">Total</td>
                    <td className="py-3 px-4 text-sm">{formatCurrency(data.reduce((s, w) => s + w.monthlySalary, 0))}</td>
                    <td className="py-3 px-4 text-sm">{totalPresent}</td>
                    <td className="py-3 px-4 text-sm">{totalAbsent}</td>
                    <td className="hidden sm:table-cell py-3 px-4 text-sm">{data.reduce((s, w) => s + w.halfDays, 0)}</td>
                    <td className="hidden sm:table-cell py-3 px-4 text-sm">{data.reduce((s, w) => s + w.leaveDays, 0)}</td>
                    <td className="py-3 px-4 text-sm text-emerald-600">{formatCurrency(totalPayroll)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
