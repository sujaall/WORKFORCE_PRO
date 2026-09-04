"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit2,
  Calendar,
  IndianRupee,
  Phone,
  MapPin,
  Briefcase,
  CalendarDays,
  Loader2,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getStatusLabel, getStatusDot } from "@/lib/utils";

interface WorkerProfile {
  id: string;
  workerId: string;
  fullName: string;
  mobileNumber: string;
  alternateMobile: string | null;
  department: string;
  designation: string | null;
  workerType: string;
  joiningDate: string;
  monthlySalary: number;
  dailySalary: number;
  employmentStatus: string;
  gender: string | null;
  address: string | null;
  dateOfBirth: string | null;
  stats: {
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    halfDays: number;
    holidayDays: number;
    totalMarked: number;
    attendancePercentage: number;
  };
}

export default function WorkerProfilePage() {
  const params = useParams();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorker();
  }, [fetchWorker]);

  const fetchWorker = useCallback(async () => {
    try {
      const res = await fetch(`/api/workers/${params.id}`);
      const data = await res.json();
      setWorker(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Worker not found</p>
        <Link href="/workers">
          <Button variant="outline" className="mt-4">Back to Workers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/workers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="page-title">Worker Profile</h1>
        </div>
        <Link href={`/workers/${worker.id}/edit`}>
          <Button variant="outline" className="gap-2">
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-6 py-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
              {worker.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{worker.fullName}</h2>
              <p className="text-white/70 text-sm">{worker.workerId}</p>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant={worker.employmentStatus === "ACTIVE" ? "success" : "destructive"}>
                  {worker.employmentStatus}
                </Badge>
                <span className="text-white/60 text-sm">{worker.department}</span>
                {worker.designation && (
                  <span className="text-white/60 text-sm">• {worker.designation}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Mobile</p>
                <p className="text-sm font-medium">{worker.mobileNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Worker Type</p>
                <p className="text-sm font-medium">{worker.workerType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Joining Date</p>
                <p className="text-sm font-medium">{formatDate(worker.joiningDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IndianRupee className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Monthly Salary</p>
                <p className="text-sm font-medium">{formatCurrency(worker.monthlySalary)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat-card stat-card-primary">
          <p className="text-2xl font-bold text-gray-900">{worker.stats.totalMarked}</p>
          <p className="text-xs text-gray-500 mt-1">Total Marked Days</p>
        </div>
        <div className="stat-card stat-card-success">
          <p className="text-2xl font-bold text-emerald-600">{worker.stats.presentDays}</p>
          <p className="text-xs text-gray-500 mt-1">Present Days</p>
        </div>
        <div className="stat-card stat-card-danger">
          <p className="text-2xl font-bold text-red-600">{worker.stats.absentDays}</p>
          <p className="text-xs text-gray-500 mt-1">Absent Days</p>
        </div>
        <div className="stat-card stat-card-warning">
          <p className="text-2xl font-bold text-amber-600">{worker.stats.leaveDays + worker.stats.holidayDays}</p>
          <p className="text-xs text-gray-500 mt-1">Leave / Holiday</p>
        </div>
        <div className="stat-card stat-card-info col-span-2 lg:col-span-1">
          <p className="text-2xl font-bold text-blue-600">{worker.stats.attendancePercentage}%</p>
          <p className="text-xs text-gray-500 mt-1">Attendance</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Link href={`/calendar?worker=${worker.id}`}>
          <Button variant="outline" className="w-full h-12 gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            View Calendar
          </Button>
        </Link>
        <Link href={`/salary?worker=${worker.id}`}>
          <Button variant="outline" className="w-full h-12 gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            View Salary
          </Button>
        </Link>
        <Link href={`/attendance?worker=${worker.id}`}>
          <Button variant="outline" className="w-full h-12 gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            View Attendance
          </Button>
        </Link>
      </div>

      {/* Salary Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Salary Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-1">Monthly Salary</p>
              <p className="text-lg font-bold">{formatCurrency(worker.monthlySalary)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Daily Salary</p>
              <p className="text-lg font-bold">{formatCurrency(worker.dailySalary)}</p>
              <p className="text-xs text-gray-400">{formatCurrency(worker.monthlySalary)} ÷ 30</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Earned This Month</p>
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(
                  worker.stats.presentDays * worker.dailySalary +
                    worker.stats.halfDays * worker.dailySalary * 0.5
                )}
              </p>
              <p className="text-xs text-gray-400">
                {worker.stats.presentDays} × {formatCurrency(worker.dailySalary)}
                {worker.stats.halfDays > 0 &&
                  ` + ${worker.stats.halfDays} × ${formatCurrency(worker.dailySalary * 0.5)}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
