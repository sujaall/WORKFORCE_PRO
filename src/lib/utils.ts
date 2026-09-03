import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, differenceInMinutes } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyDecimal(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy");
}

export function formatDateLong(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEEE, MMMM d, yyyy");
}

export function formatTime(time: string): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${minutes} ${ampm}`;
}

export function calculateWorkingMinutes(
  checkIn: string | null,
  checkOut: string | null
): number | null {
  if (!checkIn || !checkOut) return null;
  const today = format(new Date(), "yyyy-MM-dd");
  const checkInDate = new Date(`${today}T${checkIn}`);
  const checkOutDate = new Date(`${today}T${checkOut}`);
  const mins = differenceInMinutes(checkOutDate, checkInDate);
  return mins > 0 ? mins : null;
}

export function formatWorkingHours(minutes: number | null): string {
  if (!minutes || minutes <= 0) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function calculateDailySalary(
  monthlySalary: number,
  divisor: number = 30
): number {
  return Math.round((monthlySalary / divisor) * 100) / 100;
}

export function calculateEarnedSalary(
  dailySalary: number,
  status: string
): number {
  switch (status) {
    case "PRESENT":
      return dailySalary;
    case "HALF_DAY":
      return Math.round(dailySalary * 0.5 * 100) / 100;
    case "ABSENT":
    case "LEAVE":
    case "HOLIDAY":
    default:
      return 0;
  }
}

export function generateWorkerId(lastId: string | null): string {
  if (!lastId) return "WRK-0001";
  const num = parseInt(lastId.replace("WRK-", ""));
  return `WRK-${String(num + 1).padStart(4, "0")}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "PRESENT":
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "ABSENT":
      return "text-red-600 bg-red-50 border-red-200";
    case "LEAVE":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "HOLIDAY":
      return "text-slate-600 bg-slate-100 border-slate-200";
    case "HALF_DAY":
      return "text-blue-600 bg-blue-50 border-blue-200";
    default:
      return "text-gray-400 bg-gray-50 border-gray-200";
  }
}

export function getStatusDot(status: string): string {
  switch (status) {
    case "PRESENT":
      return "bg-emerald-500";
    case "ABSENT":
      return "bg-red-500";
    case "LEAVE":
      return "bg-amber-500";
    case "HOLIDAY":
      return "bg-slate-400";
    case "HALF_DAY":
      return "bg-blue-500";
    default:
      return "bg-gray-300";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "PRESENT":
      return "Present";
    case "ABSENT":
      return "Absent";
    case "LEAVE":
      return "Leave";
    case "HOLIDAY":
      return "Holiday";
    case "HALF_DAY":
      return "Half Day";
    default:
      return "Not Marked";
  }
}
