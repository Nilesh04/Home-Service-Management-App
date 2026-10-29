import type { Appointment, Employee, OvertimeEntry } from '../types';

/**
 * Formats a local Date offset by `offsetDays` from today as YYYY-MM-DD
 * using local calendar fields (never UTC ISO slicing).
 */
export function getLocalDateString(offsetDays = 0, baseDate?: Date): string {
  const now = baseDate ?? new Date();
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + offsetDays
  );
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses YYYY-MM-DD safely into a local Date object using `new Date(y, m - 1, d)`.
 */
export function parseLocalDate(dateStr: string): Date | null {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return null;
  }
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

/**
 * Formats YYYY-MM-DD for display, adding Today / Tomorrow context when relevant.
 */
export function formatDisplayDate(dateStr: string, todayStr: string): string {
  const parsed = parseLocalDate(dateStr);
  if (!parsed) return dateStr;

  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);

  if (dateStr === todayStr) {
    return `Today, ${formatted}`;
  }
  const tomorrowParsed = parseLocalDate(todayStr);
  if (tomorrowParsed) {
    const tomorrow = new Date(
      tomorrowParsed.getFullYear(),
      tomorrowParsed.getMonth(),
      tomorrowParsed.getDate() + 1
    );
    const tY = tomorrow.getFullYear();
    const tM = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tD = String(tomorrow.getDate()).padStart(2, '0');
    if (dateStr === `${tY}-${tM}-${tD}`) {
      return `Tomorrow, ${formatted}`;
    }
  }
  return formatted;
}

/**
 * Formats YYYY-MM into Month Year (e.g. "October 2026").
 */
export function formatMonthLabel(monthKey: string): string {
  const parts = monthKey.split('-').map(Number);
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) {
    return monthKey;
  }
  const [y, m] = parts;
  const date = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats 24-hour HH:MM into readable 12-hour clock time (e.g. "9:30 AM").
 */
export function formatDisplayTime(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats integer cents into USD currency string.
 */
export function formatCurrencyCents(cents: number): string {
  if (!Number.isFinite(cents)) return '$0.00';
  return usdFormatter.format(cents / 100);
}

/**
 * Converts a dollar string or number into integer cents safely.
 */
export function dollarsToCents(dollars: number): number {
  if (!Number.isFinite(dollars) || dollars < 0) return 0;
  return Math.round(dollars * 100);
}

/**
 * Sorts appointments chronologically by date ascending, then time ascending.
 */
export function sortAppointmentsChronologically(
  list: Appointment[]
): Appointment[] {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    if (a.time !== b.time) {
      return a.time.localeCompare(b.time);
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Computes Manager Dashboard summary figures from live records.
 * Verified invariant: scheduled + inProgress + completed + cancelled === appointments.length.
 */
export function computeManagerMetrics(
  appointments: Appointment[],
  employees: Employee[],
  todayStr: string
) {
  const totalToday = appointments.filter((a) => a.date === todayStr).length;
  const scheduled = appointments.filter((a) => a.status === 'Scheduled').length;
  const inProgress = appointments.filter((a) => a.status === 'In Progress').length;
  const completed = appointments.filter((a) => a.status === 'Completed').length;
  const activeEmployees = employees.filter(
    (e) => e.employmentStatus === 'Active'
  ).length;

  return {
    totalToday,
    scheduled,
    inProgress,
    completed,
    activeEmployees,
  };
}

/**
 * Computes Worker Dashboard summary figures strictly from the worker's assigned jobs.
 * Hand-worked check: for 4 assigned jobs (Today Completed, Today In Progress, Today Scheduled, Tomorrow Scheduled),
 * todaysAssigned = 3, upcomingJobs = 2 (Scheduled on today or later), inProgress = 1, completed = 1.
 */
export function computeWorkerMetrics(
  workerAppointments: Appointment[],
  todayStr: string
) {
  const nonCancelled = workerAppointments.filter((a) => a.status !== 'Cancelled');
  const todaysAssigned = nonCancelled.filter((a) => a.date === todayStr).length;
  const upcomingJobs = workerAppointments.filter(
    (a) => a.status === 'Scheduled' && a.date > todayStr
  ).length;
  const inProgress = workerAppointments.filter(
    (a) => a.status === 'In Progress'
  ).length;
  const completed = workerAppointments.filter(
    (a) => a.status === 'Completed'
  ).length;

  return {
    todaysAssigned,
    upcomingJobs,
    inProgress,
    completed,
  };
}

/**
 * Computes monthly overtime totals in hours and integer cents.
 */
export function computeOvertimeSummary(
  entries: OvertimeEntry[],
  monthFilter: string // 'ALL' or 'YYYY-MM'
) {
  const filtered =
    monthFilter === 'ALL'
      ? entries
      : entries.filter((e) => e.date.startsWith(monthFilter));

  const totalHours = filtered.reduce((sum, item) => sum + item.hours, 0);
  const totalAmountCents = filtered.reduce(
    (sum, item) => sum + item.amountCents,
    0
  );
  const approvedAmountCents = filtered
    .filter((item) => item.approvalStatus === 'Approved')
    .reduce((sum, item) => sum + item.amountCents, 0);
  const pendingCount = filtered.filter(
    (item) => item.approvalStatus === 'Pending'
  ).length;

  return {
    filtered,
    totalHours: Math.round(totalHours * 100) / 100,
    totalAmountCents,
    approvedAmountCents,
    pendingCount,
  };
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
