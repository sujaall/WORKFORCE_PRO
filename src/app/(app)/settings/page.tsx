"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Save, Settings as SettingsIcon, Building2, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CompanySettings {
  id: string;
  companyName: string;
  address: string | null;
  salaryDivisor: number;
  holidaySalaryPaid: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: settings.companyName,
          address: settings.address,
          salaryDivisor: settings.salaryDivisor,
          holidaySalaryPaid: settings.holidaySalaryPaid,
        }),
      });
      if (res.ok) {
        toast.success("Settings saved");
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure company and salary settings</p>
      </div>

      {/* Company Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={settings.address || ""}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              placeholder="Company address"
            />
          </div>
        </CardContent>
      </Card>

      {/* Salary Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-gray-400" />
            Salary Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Salary Divisor</Label>
            <p className="text-xs text-gray-500 mb-2">
              Daily Salary = Monthly Salary ÷ Divisor
            </p>
            <Select
              value={settings.salaryDivisor.toString()}
              onValueChange={(v) => setSettings({ ...settings, salaryDivisor: parseInt(v) })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Days (Default)</SelectItem>
                <SelectItem value="26">26 Working Days</SelectItem>
                <SelectItem value="28">28 Days</SelectItem>
                <SelectItem value="31">31 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Holiday Salary</Label>
            <Select
              value={settings.holidaySalaryPaid ? "true" : "false"}
              onValueChange={(v) => setSettings({ ...settings, holidaySalaryPaid: v === "true" })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Unpaid (Default)</SelectItem>
                <SelectItem value="true">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Calculation Preview</p>
            <p className="text-xs text-gray-500">
              Monthly Salary: ₹15,000<br />
              Daily Salary: ₹15,000 ÷ {settings.salaryDivisor} = ₹{(15000 / settings.salaryDivisor).toFixed(2)}<br />
              Holiday: {settings.holidaySalaryPaid ? "Paid (full daily salary)" : "Unpaid (₹0)"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
