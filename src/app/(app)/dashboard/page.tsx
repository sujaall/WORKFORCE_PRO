"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Users,
  UserCheck,
  UserX,
  Sun,
  TrendingUp,
  UserPlus,
  CalendarCheck,
  IndianRupee,
  BarChart3,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getGreeting, getStatusLabel, formatTime } from "@/lib/utils";

interface DashboardData {
  totalWorkers: number;
  presentToday: number;
  absentToday: number;
  onLeave: number;
  onHoliday: number;
  notMarked: number;
  attendancePercentage: number;
  recentActivity: Array<{
    id: string;
    workerName: string;
    workerId: string;
    status: string;
    checkIn: string | null;
    checkOut: string | null;
    date: string;
    updatedAt: string;
  }>;
  departmentStats: Array<{
    department: string;
    total: number;
    present: number;
  }>;
  monthlyTrend: Array<{
    date: string;
    present: number;
    absent: number;
    leave: number;
  }>;
}

const DONUT_COLORS = ["#10b981", "#ef4444", "#f59e0b", "#94a3b8", "#6b7280"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500">
        Failed to load dashboard data.
      </div>
    );
  }

  const donutData = [
    { name: "Present", value: data.presentToday, color: "#10b981" },
    { name: "Absent", value: data.absentToday, color: "#ef4444" },
    { name: "Leave", value: data.onLeave, color: "#f59e0b" },
    { name: "Holiday", value: data.onHoliday, color: "#94a3b8" },
    { name: "Not Marked", value: data.notMarked, color: "#d1d5db" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="animate-fade-up">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {getGreeting()}, Admin
        </h1>
        <p className="text-gray-500 mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="stat-card stat-card-primary animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.totalWorkers}</p>
              <p className="text-xs text-gray-500">Total Workers</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-success animate-fade-up-delay-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.presentToday}</p>
              <p className="text-xs text-gray-500">Present</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-danger animate-fade-up-delay-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.absentToday}</p>
              <p className="text-xs text-gray-500">Absent</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-warning animate-fade-up-delay-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Sun className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{data.onLeave}</p>
              <p className="text-xs text-gray-500">On Leave</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-info animate-fade-up-delay-4 col-span-2 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {data.attendancePercentage}%
              </p>
              <p className="text-xs text-gray-500">Attendance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/workers/new">
          <Button variant="outline" className="w-full h-14 text-sm font-medium gap-2 hover:shadow-md transition-all">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            Add Worker
          </Button>
        </Link>
        <Link href="/attendance">
          <Button variant="outline" className="w-full h-14 text-sm font-medium gap-2 hover:shadow-md transition-all">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            Mark Attendance
          </Button>
        </Link>
        <Link href="/salary">
          <Button variant="outline" className="w-full h-14 text-sm font-medium gap-2 hover:shadow-md transition-all">
            <IndianRupee className="w-5 h-5 text-amber-600" />
            View Salary
          </Button>
        </Link>
        <Link href="/reports">
          <Button variant="outline" className="w-full h-14 text-sm font-medium gap-2 hover:shadow-md transition-all">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Generate Report
          </Button>
        </Link>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Attendance Donut */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {donutData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {donutData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-gray-600">
                        {d.name}: {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                No attendance data for today
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">30-Day Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="present" fill="#10b981" radius={[2, 2, 0, 0]} name="Present" />
                  <Bar dataKey="absent" fill="#ef4444" radius={[2, 2, 0, 0]} name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                No trend data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department Stats & Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Department Attendance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Department Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {data.departmentStats.length > 0 ? (
              <div className="space-y-4">
                {data.departmentStats.map((dept) => {
                  const pct = dept.total > 0 ? Math.round((dept.present / dept.total) * 100) : 0;
                  return (
                    <div key={dept.department} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium">{dept.department}</span>
                        <span className="text-gray-500">
                          {dept.present}/{dept.total} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">
                No department data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length > 0 ? (
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {data.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-gray-600">
                        {activity.workerName.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">
                        <span className="font-medium">{activity.workerName}</span>
                        {activity.status === "PRESENT" && activity.checkIn && (
                          <span className="text-gray-500"> checked in at {formatTime(activity.checkIn)}</span>
                        )}
                        {activity.status === "PRESENT" && activity.checkOut && (
                          <span className="text-gray-500"> checked out at {formatTime(activity.checkOut)}</span>
                        )}
                        {activity.status === "ABSENT" && (
                          <span className="text-gray-500"> marked absent</span>
                        )}
                        {activity.status === "LEAVE" && (
                          <span className="text-gray-500"> on leave</span>
                        )}
                        {activity.status === "HALF_DAY" && (
                          <span className="text-gray-500"> half day</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{activity.date}</p>
                    </div>
                    <Badge
                      variant={
                        activity.status === "PRESENT"
                          ? "success"
                          : activity.status === "ABSENT"
                          ? "destructive"
                          : "warning"
                      }
                    >
                      {getStatusLabel(activity.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
