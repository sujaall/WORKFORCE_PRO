import { z } from "zod";

export const workerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  mobileNumber: z
    .string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number is too long"),
  alternateMobile: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  department: z.string().min(1, "Department is required"),
  designation: z.string().optional().nullable(),
  workerType: z.string().default("Labourer"),
  joiningDate: z.string().min(1, "Joining date is required"),
  monthlySalary: z
    .number()
    .min(0, "Salary cannot be negative")
    .max(10000000, "Salary is too high"),
});

export const attendanceSchema = z.object({
  workerId: z.string().min(1, "Worker ID is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["PRESENT", "ABSENT", "LEAVE", "HOLIDAY", "HALF_DAY"]),
  checkInTime: z.string().optional().nullable(),
  checkOutTime: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const bulkAttendanceSchema = z.object({
  date: z.string().min(1, "Date is required"),
  records: z.array(
    z.object({
      workerId: z.string(),
      status: z.enum(["PRESENT", "ABSENT", "LEAVE", "HOLIDAY", "HALF_DAY"]),
      checkInTime: z.string().optional().nullable(),
      checkOutTime: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
  ),
});

export const leaveSchema = z.object({
  workerId: z.string().min(1, "Worker is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  leaveType: z.enum(["PERSONAL", "SICK", "EMERGENCY", "OTHER"]),
  reason: z.string().optional().nullable(),
});

export const holidaySchema = z.object({
  holidayName: z.string().min(1, "Holiday name is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional().nullable(),
});

export const settingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().optional().nullable(),
  salaryDivisor: z.number().min(1).max(31),
  holidaySalaryPaid: z.boolean(),
});

export type WorkerFormData = z.infer<typeof workerSchema>;
export type AttendanceFormData = z.infer<typeof attendanceSchema>;
export type BulkAttendanceFormData = z.infer<typeof bulkAttendanceSchema>;
export type LeaveFormData = z.infer<typeof leaveSchema>;
export type HolidayFormData = z.infer<typeof holidaySchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
