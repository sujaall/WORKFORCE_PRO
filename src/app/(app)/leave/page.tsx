"use client";

import { useCallback, useEffect, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Plus, Loader2, Sun, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface LeaveRecord {
  id: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string | null;
  paidStatus: string;
  status: string;
  worker: { fullName: string; workerId: string; department: string };
}

interface Worker {
  id: string;
  workerId: string;
  fullName: string;
}

export default function LeavePage() {
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    workerId: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    leaveType: "PERSONAL" as string,
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [lRes, wRes] = await Promise.all([
        fetch("/api/leave"),
        fetch("/api/workers?status=ACTIVE&limit=500"),
      ]);
      const lData = await lRes.json();
      const wData = await wRes.json();
      setLeaves(lData.leaves || []);
      setWorkers(wData.workers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Leave recorded and attendance updated");
        setDialogOpen(false);
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to create leave");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/leave?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Leave deleted");
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const leaveTypeLabel = (type: string) => {
    switch (type) {
      case "PERSONAL": return "Personal";
      case "SICK": return "Sick";
      case "EMERGENCY": return "Emergency";
      case "OTHER": return "Other";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">Record and track worker leave</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Leave
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : leaves.length === 0 ? (
        <div className="empty-state">
          <Sun className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No leave records</h3>
          <p className="text-sm text-gray-500 mt-1 mb-6">Add leave to track worker absences</p>
          <Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="w-4 h-4" />Add Leave</Button>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="bg-gray-50/50">
                  <th>Worker</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th className="hidden sm:table-cell">Days</th>
                  <th className="hidden md:table-cell">Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => {
                  const days = differenceInDays(new Date(leave.endDate), new Date(leave.startDate)) + 1;
                  return (
                    <tr key={leave.id}>
                      <td>
                        <p className="font-medium text-sm">{leave.worker.fullName}</p>
                        <p className="text-xs text-gray-400">{leave.worker.workerId}</p>
                      </td>
                      <td><Badge variant="warning">{leaveTypeLabel(leave.leaveType)}</Badge></td>
                      <td className="text-sm">{formatDate(leave.startDate)}</td>
                      <td className="text-sm">{formatDate(leave.endDate)}</td>
                      <td className="hidden sm:table-cell text-sm font-medium">{days}</td>
                      <td className="hidden md:table-cell text-sm text-gray-500 max-w-[200px] truncate">{leave.reason || "-"}</td>
                      <td>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon-sm"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Leave?</AlertDialogTitle>
                              <AlertDialogDescription>This will remove the leave record. Attendance records will not be automatically reverted.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(leave.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Leave Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Leave</DialogTitle>
            <DialogDescription>Record a new leave and auto-mark attendance</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Worker *</Label>
              <Select value={form.workerId} onValueChange={(v) => setForm({ ...form, workerId: v })}>
                <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                <SelectContent>
                  {workers.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.fullName} ({w.workerId})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={form.leaveType} onValueChange={(v) => setForm({ ...form, leaveType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERSONAL">Personal Leave</SelectItem>
                  <SelectItem value="SICK">Sick Leave</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency Leave</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Optional reason" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.workerId}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Add Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
