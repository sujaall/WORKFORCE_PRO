"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Calendar,
  IndianRupee,
  Loader2,
  Users,
  Filter,
  UserX,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatCurrency, getStatusLabel, getStatusDot } from "@/lib/utils";
import { toast } from "sonner";

const DEPARTMENTS = [
  "Production",
  "Assembly",
  "Quality Control",
  "Maintenance",
  "Packaging",
  "Warehouse",
  "Administration",
];

interface Worker {
  id: string;
  workerId: string;
  fullName: string;
  department: string;
  designation: string | null;
  mobileNumber: string;
  monthlySalary: number;
  dailySalary: number;
  employmentStatus: string;
  todayStatus: string;
  profilePhoto: string | null;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (department) params.set("department", department);
      if (status) params.set("status", status);

      const res = await fetch(`/api/workers?${params}`);
      const data = await res.json();
      setWorkers(data.workers || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, department, status]);

  const handleDeactivate = async (id: string) => {
    try {
      const res = await fetch(`/api/workers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employmentStatus: "INACTIVE" }),
      });
      if (res.ok) {
        toast.success("Worker deactivated");
        fetchWorkers();
      }
    } catch (err) {
      toast.error("Failed to deactivate worker");
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const res = await fetch(`/api/workers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employmentStatus: "ACTIVE" }),
      });
      if (res.ok) {
        toast.success("Worker activated");
        fetchWorkers();
      }
    } catch (err) {
      toast.error("Failed to activate worker");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Workers</h1>
          <p className="page-subtitle">{total} workers in total</p>
        </div>
        <Link href="/workers/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Worker
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, ID, or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={department} onValueChange={(v) => setDepartment(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Workers Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : workers.length === 0 ? (
        <div className="empty-state">
          <Users className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No workers found</h3>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            {search || department
              ? "Try adjusting your search or filters"
              : "Add your first worker to start managing attendance"}
          </p>
          {!search && !department && (
            <Link href="/workers/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add First Worker
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="bg-gray-50/50">
                  <th>Worker</th>
                  <th className="hidden md:table-cell">Department</th>
                  <th className="hidden lg:table-cell">Mobile</th>
                  <th>Monthly Salary</th>
                  <th className="hidden sm:table-cell">Today</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => (
                  <tr key={worker.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-gray-600">
                            {worker.fullName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {worker.fullName}
                          </p>
                          <p className="text-xs text-gray-400">{worker.workerId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="text-sm">{worker.department}</span>
                    </td>
                    <td className="hidden lg:table-cell">
                      <span className="text-sm">{worker.mobileNumber}</span>
                    </td>
                    <td>
                      <span className="text-sm font-medium">
                        {formatCurrency(worker.monthlySalary)}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${getStatusDot(worker.todayStatus)}`} />
                        <span className="text-xs">{getStatusLabel(worker.todayStatus)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link href={`/workers/${worker.id}`}>
                          <Button variant="ghost" size="icon-sm" title="View">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/workers/${worker.id}/edit`}>
                          <Button variant="ghost" size="icon-sm" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        {worker.employmentStatus === "ACTIVE" ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon-sm" title="Deactivate">
                                <UserX className="w-4 h-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deactivate Worker?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will mark {worker.fullName} as inactive. They won&apos;t appear in attendance marking. You can reactivate them later.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeactivate(worker.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Deactivate
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Activate"
                            onClick={() => handleActivate(worker.id)}
                          >
                            <UserCheck className="w-4 h-4 text-emerald-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
