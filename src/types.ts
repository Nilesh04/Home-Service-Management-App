export enum UserRole {
  Manager = 'Manager',
  Worker = 'Worker',
}

export type ServiceType =
  | 'Plumbing'
  | 'Electrical'
  | 'AC Repair'
  | 'Home Cleaning'
  | 'General Maintenance';

export type AppointmentStatus =
  | 'Scheduled'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export type EmploymentStatus = 'Active' | 'Inactive';

export type PayType = 'Monthly Salary' | 'Hourly Rate';

export type OvertimeApprovalStatus = 'Pending' | 'Approved';

export type RouteId =
  | 'manager-dashboard'
  | 'manager-appointments'
  | 'manager-staff'
  | 'manager-payroll'
  | 'worker-dashboard'
  | 'worker-appointments';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  jobTitle: string;
  employeeId?: string; // Linked Employee record for Worker role
}

export interface Employee {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  jobTitle: string;
  employmentStatus: EmploymentStatus;
  payType: PayType;
  basicPayCents: number; // Stored in integer cents for exact currency formatting
}

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceAddress: string;
  serviceType: ServiceType;
  date: string; // YYYY-MM-DD in local time
  time: string; // HH:MM (24-hour)
  assignedWorkerId: string;
  estimatedDuration: string;
  notes: string;
  completionNotes: string;
  status: AppointmentStatus;
  updatedAt: string;
}

export interface OvertimeEntry {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD in local time
  hours: number;
  amountCents: number; // Stored in integer cents
  notes: string;
  approvalStatus: OvertimeApprovalStatus;
}

export const SERVICE_TYPES: ServiceType[] = [
  'Plumbing',
  'Electrical',
  'AC Repair',
  'Home Cleaning',
  'General Maintenance',
];

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'Scheduled',
  'In Progress',
  'Completed',
  'Cancelled',
];

export const ESTIMATED_DURATIONS: string[] = [
  '1 hour',
  '1.5 hours',
  '2 hours',
  '2.5 hours',
  '3 hours',
  '4 hours',
];
