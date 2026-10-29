import {
  UserRole,
  type Appointment,
  type AuthUser,
  type Employee,
  type OvertimeEntry,
} from '../types';
import { getLocalDateString } from '../utils/format';

export const DEMO_WORKER_EMPLOYEE_ID = 'EMP-101';

export interface DemoCredentialRecord {
  email: string;
  password: string;
  user: AuthUser;
}

export const DEMO_ACCOUNTS: Record<'manager' | 'worker', DemoCredentialRecord> = {
  manager: {
    email: 'manager@homeservice.demo',
    password: 'Demo123!',
    user: {
      id: 'USR-MGR-01',
      name: 'Claire Bennett',
      email: 'manager@homeservice.demo',
      role: UserRole.Manager,
      jobTitle: 'Operations Manager',
    },
  },
  worker: {
    email: 'worker@homeservice.demo',
    password: 'Demo123!',
    user: {
      id: 'USR-WRK-01',
      name: 'Marcus Vance',
      email: 'worker@homeservice.demo',
      role: UserRole.Worker,
      jobTitle: 'Senior HVAC & Plumbing Tech',
      employeeId: DEMO_WORKER_EMPLOYEE_ID,
    },
  },
};

export function createInitialEmployees(): Employee[] {
  return [
    {
      id: DEMO_WORKER_EMPLOYEE_ID,
      fullName: 'Marcus Vance',
      phone: '(555) 014-2890',
      email: 'worker@homeservice.demo',
      jobTitle: 'Senior HVAC & Plumbing Tech',
      employmentStatus: 'Active',
      payType: 'Hourly Rate',
      basicPayCents: 3800, // $38.00 / hr
    },
    {
      id: 'EMP-102',
      fullName: 'Elena Rostova',
      phone: '(555) 018-4412',
      email: 'elena.rostova@homeservice.demo',
      jobTitle: 'Licensed Residential Electrician',
      employmentStatus: 'Active',
      payType: 'Monthly Salary',
      basicPayCents: 540000, // $5,400.00 / mo
    },
    {
      id: 'EMP-103',
      fullName: 'Devon Brooks',
      phone: '(555) 019-7731',
      email: 'devon.brooks@homeservice.demo',
      jobTitle: 'Home Cleaning Specialist',
      employmentStatus: 'Active',
      payType: 'Hourly Rate',
      basicPayCents: 2850, // $28.50 / hr
    },
    {
      id: 'EMP-104',
      fullName: 'Tomas Herrera',
      phone: '(555) 012-6309',
      email: 'tomas.herrera@homeservice.demo',
      jobTitle: 'General Maintenance Technician',
      employmentStatus: 'Active',
      payType: 'Monthly Salary',
      basicPayCents: 465000, // $4,650.00 / mo
    },
  ];
}

export function createInitialAppointments(): Appointment[] {
  const today = getLocalDateString(0);
  const tomorrow = getLocalDateString(1);
  const dayAfter = getLocalDateString(2);
  const threeDaysOut = getLocalDateString(3);

  return [
    {
      id: 'APT-1001',
      customerName: 'Nadia Kowalski',
      customerPhone: '(555) 013-8821',
      serviceAddress: '418 Sycamore Ridge Rd, Unit B, Oakridge',
      serviceType: 'Plumbing',
      date: today,
      time: '08:00',
      assignedWorkerId: DEMO_WORKER_EMPLOYEE_ID,
      estimatedDuration: '1.5 hours',
      notes: 'Kitchen sink slow drain and weeping cold-water angle stop valve.',
      completionNotes:
        'Replaced quarter-turn compression angle stop and cleared P-trap buildup. Pressure tested for 15 minutes with zero leaks.',
      status: 'Completed',
      updatedAt: `${today}T09:35:00`,
    },
    {
      id: 'APT-1002',
      customerName: 'Hannah Sterling',
      customerPhone: '(555) 017-3490',
      serviceAddress: '1290 Alderbrook Way, Westview',
      serviceType: 'AC Repair',
      date: today,
      time: '10:30',
      assignedWorkerId: DEMO_WORKER_EMPLOYEE_ID,
      estimatedDuration: '2 hours',
      notes:
        'Upstairs split-system blowing warm air; outdoor condenser fan hums intermittently. Side gate unlocked.',
      completionNotes: '',
      status: 'In Progress',
      updatedAt: `${today}T10:32:00`,
    },
    {
      id: 'APT-1003',
      customerName: 'Gregory Whitaker',
      customerPhone: '(555) 015-9044',
      serviceAddress: '742 Cedar Hollow Ln, Brookside',
      serviceType: 'Electrical',
      date: today,
      time: '11:00',
      assignedWorkerId: 'EMP-102',
      estimatedDuration: '2 hours',
      notes:
        'Install two GFCI outlets in garage workshop and inspect flickering recessed fixture in hallway.',
      completionNotes: '',
      status: 'In Progress',
      updatedAt: `${today}T11:05:00`,
    },
    {
      id: 'APT-1004',
      customerName: 'Arthur Pendelton',
      customerPhone: '(555) 011-6278',
      serviceAddress: '88 Harborview Terrace, Crestwood',
      serviceType: 'Plumbing',
      date: today,
      time: '14:00',
      assignedWorkerId: DEMO_WORKER_EMPLOYEE_ID,
      estimatedDuration: '1.5 hours',
      notes:
        'Guest bathroom toilet fill valve running continuously; bring universal flapper and braided supply line.',
      completionNotes: '',
      status: 'Scheduled',
      updatedAt: `${today}T07:45:00`,
    },
    {
      id: 'APT-1005',
      customerName: 'Mei-Ling Zhou',
      customerPhone: '(555) 016-5102',
      serviceAddress: '305 Hawthorne Ave, Apt 4C, Oakridge',
      serviceType: 'Home Cleaning',
      date: today,
      time: '13:30',
      assignedWorkerId: 'EMP-103',
      estimatedDuration: '3 hours',
      notes:
        'Move-in deep clean for 2-bedroom apartment. Focus on kitchen cabinetry interiors and balcony glass tracks.',
      completionNotes: '',
      status: 'Scheduled',
      updatedAt: `${today}T08:00:00`,
    },
    {
      id: 'APT-1006',
      customerName: 'Samuel Okafor',
      customerPhone: '(555) 019-2045',
      serviceAddress: '19 Birchwood Ct, Westview',
      serviceType: 'General Maintenance',
      date: today,
      time: '09:00',
      assignedWorkerId: 'EMP-104',
      estimatedDuration: '2 hours',
      notes:
        'Re-align sticking front storm door closer and replace torn patio screen mesh.',
      completionNotes:
        'Adjusted pneumatic door closer tension, shimmed bottom hinge, and re-splined fiberglass patio screen.',
      status: 'Completed',
      updatedAt: `${today}T11:00:00`,
    },
    {
      id: 'APT-1007',
      customerName: 'Priya Nair',
      customerPhone: '(555) 014-7923',
      serviceAddress: '512 Meadowlark Dr, Brookside',
      serviceType: 'AC Repair',
      date: tomorrow,
      time: '09:30',
      assignedWorkerId: DEMO_WORKER_EMPLOYEE_ID,
      estimatedDuration: '2 hours',
      notes:
        'Seasonal heat-pump coil cleaning, condensate drain flush, and thermostat calibration.',
      completionNotes: '',
      status: 'Scheduled',
      updatedAt: `${today}T08:15:00`,
    },
    {
      id: 'APT-1008',
      customerName: 'Leonard Vance-Miller',
      customerPhone: '(555) 018-3319',
      serviceAddress: '2204 Pinecrest Blvd, Crestwood',
      serviceType: 'Electrical',
      date: tomorrow,
      time: '13:00',
      assignedWorkerId: 'EMP-102',
      estimatedDuration: '2.5 hours',
      notes:
        'Dedicated 20A circuit check for basement sump pump backup and surge protector panel inspection.',
      completionNotes: '',
      status: 'Scheduled',
      updatedAt: `${today}T08:20:00`,
    },
    {
      id: 'APT-1009',
      customerName: 'Claire Fontaine',
      customerPhone: '(555) 012-9984',
      serviceAddress: '640 Elmwood Park Rd, Oakridge',
      serviceType: 'Home Cleaning',
      date: dayAfter,
      time: '10:00',
      assignedWorkerId: 'EMP-103',
      estimatedDuration: '3 hours',
      notes:
        'Customer requested postponement due to flooring refinishing contractors running behind schedule.',
      completionNotes: '',
      status: 'Cancelled',
      updatedAt: `${today}T08:30:00`,
    },
    {
      id: 'APT-1010',
      customerName: 'Victor Alvarez',
      customerPhone: '(555) 016-7410',
      serviceAddress: '95 Quarry Stone Ln, Westview',
      serviceType: 'General Maintenance',
      date: threeDaysOut,
      time: '11:00',
      assignedWorkerId: 'EMP-104',
      estimatedDuration: '2.5 hours',
      notes:
        'Drywall patch in upstairs stairwell, caulking around tub surround, and attic ladder hinge inspection.',
      completionNotes: '',
      status: 'Scheduled',
      updatedAt: `${today}T08:40:00`,
    },
  ];
}

export function createInitialOvertimeEntries(): OvertimeEntry[] {
  const today = getLocalDateString(0);
  const twoDaysAgo = getLocalDateString(-2);
  const fiveDaysAgo = getLocalDateString(-5);
  const eightDaysAgo = getLocalDateString(-8);

  return [
    {
      id: 'OT-301',
      employeeId: DEMO_WORKER_EMPLOYEE_ID,
      date: twoDaysAgo,
      hours: 3.5,
      amountCents: 19950, // $199.50 (1.5x $38/hr)
      notes: 'Emergency evening main water shutoff replacement on Maple St.',
      approvalStatus: 'Pending',
    },
    {
      id: 'OT-302',
      employeeId: 'EMP-102',
      date: fiveDaysAgo,
      hours: 2.0,
      amountCents: 11000, // $110.00
      notes: 'After-hours breaker panel fault isolation after storm surge.',
      approvalStatus: 'Approved',
    },
    {
      id: 'OT-303',
      employeeId: 'EMP-103',
      date: today,
      hours: 2.5,
      amountCents: 10688, // $106.88
      notes: 'Extended post-renovation dust extraction for Oakridge townhouse.',
      approvalStatus: 'Pending',
    },
    {
      id: 'OT-304',
      employeeId: 'EMP-104',
      date: eightDaysAgo,
      hours: 4.0,
      amountCents: 18000, // $180.00
      notes: 'Weekend weatherstripping and exterior boarding repair.',
      approvalStatus: 'Approved',
    },
  ];
}

const STORAGE_VERSION = 'copperline_mvp_v1';

export const STORAGE_KEYS = {
  session: `${STORAGE_VERSION}_session`,
  employees: `${STORAGE_VERSION}_employees`,
  appointments: `${STORAGE_VERSION}_appointments`,
  overtime: `${STORAGE_VERSION}_overtime`,
} as const;

export function readStorage<T>(key: string, fallback: () => T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback();
    const parsed = JSON.parse(raw) as T;
    if (parsed === null || parsed === undefined) return fallback();
    return parsed;
  } catch {
    return fallback();
  }
}

export function writeStorage<T>(key: string, value: T): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage access failure in restricted private contexts
  }
}
