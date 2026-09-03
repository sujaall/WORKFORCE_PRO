"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const DEPARTMENTS = ["Production", "Assembly", "Quality Control", "Maintenance", "Packaging", "Warehouse", "Administration"];
const WORKER_TYPES = ["Labourer", "Machine Operator", "Helper", "Supervisor", "Technician"];

export default function EditWorkerPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "", mobileNumber: "", alternateMobile: "", dateOfBirth: "",
    gender: "", address: "", department: "", designation: "",
    workerType: "Labourer", joiningDate: "", monthlySalary: 0,
  });

  useEffect(() => {
    fetchWorker();
  }, [params.id]);

  const fetchWorker = async () => {
    try {
      const res = await fetch(`/api/workers/${params.id}`);
      const data = await res.json();
      setForm({
        fullName: data.fullName || "",
        mobileNumber: data.mobileNumber || "",
        alternateMobile: data.alternateMobile || "",
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
        gender: data.gender || "",
        address: data.address || "",
        department: data.department || "",
        designation: data.designation || "",
        workerType: data.workerType || "Labourer",
        joiningDate: data.joiningDate ? data.joiningDate.split("T")[0] : "",
        monthlySalary: data.monthlySalary || 0,
      });
    } catch (err) {
      toast.error("Failed to load worker");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/workers/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, monthlySalary: Number(form.monthlySalary) }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
        return;
      }
      toast.success("Worker updated successfully");
      router.push(`/workers/${params.id}`);
    } catch (err) {
      toast.error("Failed to update worker");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  const dailySalary = Math.round((form.monthlySalary / 30) * 100) / 100;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/workers/${params.id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="page-title">Edit Worker</h1>
          <p className="page-subtitle">Update worker information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number *</Label>
                <Input value={form.mobileNumber} onChange={(e) => handleChange("mobileNumber", e.target.value)} required />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alternate Mobile</Label>
                <Input value={form.alternateMobile} onChange={(e) => handleChange("alternateMobile", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.dateOfBirth} onChange={(e) => handleChange("dateOfBirth", e.target.value)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => handleChange("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Employment Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select value={form.department} onValueChange={(v) => handleChange("department", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input value={form.designation} onChange={(e) => handleChange("designation", e.target.value)} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Worker Type</Label>
                <Select value={form.workerType} onValueChange={(v) => handleChange("workerType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{WORKER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Joining Date *</Label>
                <Input type="date" value={form.joiningDate} onChange={(e) => handleChange("joiningDate", e.target.value)} required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Salary Information</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Salary (₹) *</Label>
                <Input type="number" min="0" value={form.monthlySalary} onChange={(e) => handleChange("monthlySalary", parseInt(e.target.value) || 0)} required />
              </div>
              <div className="space-y-2">
                <Label>Daily Salary</Label>
                <div className="h-10 flex items-center px-3 bg-gray-50 rounded-lg border text-sm font-medium text-gray-700">
                  {formatCurrency(dailySalary)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href={`/workers/${params.id}`}>
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
