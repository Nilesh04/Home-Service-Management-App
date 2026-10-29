import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  UserRole,
  type Appointment,
  type AppointmentStatus,
  type AuthUser,
  type Employee,
  type OvertimeApprovalStatus,
  type OvertimeEntry,
  type PayType,
  type RouteId,
  type ServiceType,
} from '../types';
import {
  createInitialAppointments,
  createInitialEmployees,
  createInitialOvertimeEntries,
  DEMO_ACCOUNTS,
  readStorage,
  removeStorage,
  STORAGE_KEYS,
  writeStorage,
} from '../data/seedData';
import { getLocalDateString } from '../utils/format';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface AppointmentInput {
  id?: string;
  customerName: string;
  customerPhone: string;
  serviceAddress: string;
  serviceType: ServiceType;
  date: string;
  time: string;
  assignedWorkerId: string;
  estimatedDuration: string;
  notes: string;
  status: AppointmentStatus;
}

export interface EmployeeInput {
  id?: string;
  fullName: string;
  phone: string;
  email: string;
  jobTitle: string;
  employmentStatus: 'Active' | 'Inactive';
  payType: PayType;
  basicPayCents: number;
}

export interface OvertimeInput {
  id?: string;
  employeeId: string;
  date: string;
  hours: number;
  amountCents: number;
  notes: string;
  approvalStatus: OvertimeApprovalStatus;
}

export interface BannerFeedback {
  message: string;
  tone: 'success' | 'error' | 'info';
}

const ROUTE_HASH_MAP: Record<RouteId, string> = {
  'manager-dashboard': '#/manager/dashboard',
  'manager-appointments': '#/manager/appointments',
  'manager-staff': '#/manager/staff',
  'manager-payroll': '#/manager/payroll',
  'worker-dashboard': '#/worker/dashboard',
  'worker-appointments': '#/worker/appointments',
};

function parseHashToRoute(hash: string, fallbackRole?: UserRole): RouteId {
  const cleaned = hash.trim().toLowerCase();
  for (const [routeId, routeHash] of Object.entries(ROUTE_HASH_MAP) as [
    RouteId,
    string,
  ][]) {
    if (cleaned === routeHash) {
      return routeId;
    }
  }
  if (cleaned === '#/staff') return 'manager-staff';
  if (cleaned === '#/payroll') return 'manager-payroll';
  if (cleaned === '#/appointments') return 'manager-appointments';
  if (cleaned === '#/dashboard') return 'manager-dashboard';

  return fallbackRole === UserRole.Worker
    ? 'worker-dashboard'
    : 'manager-dashboard';
}

export function isManagerOnlyRoute(route: RouteId): boolean {
  return (
    route === 'manager-dashboard' ||
    route === 'manager-appointments' ||
    route === 'manager-staff' ||
    route === 'manager-payroll'
  );
}

interface AppDataContextValue {
  currentUser: AuthUser | null;
  route: RouteId;
  todayStr: string;
  employees: Employee[];
  appointments: Appointment[];
  overtimeEntries: OvertimeEntry[];
  feedback: BannerFeedback | null;
  setFeedback: (next: BannerFeedback | null) => void;
  navigate: (nextRoute: RouteId) => void;
  loginWithCredentials: (email: string, password: string) => ActionResult;
  loginAsDemo: (roleKey: 'manager' | 'worker') => void;
  logout: () => void;
  resetDemoData: () => void;
  // Manager Appointment operations
  saveAppointment: (input: AppointmentInput) => ActionResult;
  assignAppointmentWorker: (appointmentId: string, workerId: string) => ActionResult;
  updateAppointmentStatusAsManager: (
    appointmentId: string,
    status: AppointmentStatus
  ) => ActionResult;
  cancelAppointment: (appointmentId: string) => ActionResult;
  // Manager Staff operations
  saveEmployee: (input: EmployeeInput) => ActionResult;
  setEmployeeStatus: (
    employeeId: string,
    status: 'Active' | 'Inactive'
  ) => ActionResult;
  // Manager Overtime operations
  saveOvertimeEntry: (input: OvertimeInput) => ActionResult;
  approveOvertimeEntry: (entryId: string) => ActionResult;
  // Worker operations
  startWorkerJob: (appointmentId: string) => ActionResult;
  completeWorkerJob: (
    appointmentId: string,
    completionNotes: string
  ) => ActionResult;
  updateWorkerCompletionNotes: (
    appointmentId: string,
    completionNotes: string
  ) => ActionResult;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const todayStr = useMemo(() => getLocalDateString(0), []);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() =>
    readStorage<AuthUser | null>(STORAGE_KEYS.session, () => null)
  );

  const [employees, setEmployees] = useState<Employee[]>(() =>
    readStorage<Employee[]>(STORAGE_KEYS.employees, createInitialEmployees)
  );

  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    readStorage<Appointment[]>(
      STORAGE_KEYS.appointments,
      createInitialAppointments
    )
  );

  const [overtimeEntries, setOvertimeEntries] = useState<OvertimeEntry[]>(() =>
    readStorage<OvertimeEntry[]>(
      STORAGE_KEYS.overtime,
      createInitialOvertimeEntries
    )
  );

  const [route, setRoute] = useState<RouteId>(() =>
    parseHashToRoute(window.location.hash, currentUser?.role)
  );

  const [feedback, setFeedback] = useState<BannerFeedback | null>(null);

  useEffect(() => {
    if (currentUser) {
      writeStorage(STORAGE_KEYS.session, currentUser);
    } else {
      removeStorage(STORAGE_KEYS.session);
    }
  }, [currentUser]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.employees, employees);
  }, [employees]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.appointments, appointments);
  }, [appointments]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.overtime, overtimeEntries);
  }, [overtimeEntries]);

  useEffect(() => {
    const onHashChange = () => {
      if (!currentUser) return;
      const parsed = parseHashToRoute(window.location.hash, currentUser.role);
      setRoute(parsed);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [currentUser]);

  const navigate = useCallback((nextRoute: RouteId) => {
    setRoute(nextRoute);
    const targetHash = ROUTE_HASH_MAP[nextRoute];
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  }, []);

  const loginWithCredentials = useCallback(
    (email: string, password: string): ActionResult => {
      const normalizedEmail = email.trim().toLowerCase();
      const matched = Object.values(DEMO_ACCOUNTS).find(
        (acc) =>
          acc.email.toLowerCase() === normalizedEmail &&
          acc.password === password
      );

      if (!matched) {
        return {
          ok: false,
          error:
            'Invalid email or password. Use manager@homeservice.demo or worker@homeservice.demo with password Demo123!.',
        };
      }

      // Sync worker display name/job title in case manager edited the demo worker record
      let resolvedUser = matched.user;
      if (matched.user.employeeId) {
        const linkedEmp = employees.find(
          (emp) => emp.id === matched.user.employeeId
        );
        if (linkedEmp) {
          resolvedUser = {
            ...matched.user,
            name: linkedEmp.fullName,
            jobTitle: linkedEmp.jobTitle,
          };
        }
      }

      setCurrentUser(resolvedUser);
      setFeedback(null);
      const startRoute: RouteId =
        resolvedUser.role === UserRole.Manager
          ? 'manager-dashboard'
          : 'worker-dashboard';
      navigate(startRoute);
      return { ok: true };
    },
    [employees, navigate]
  );

  const loginAsDemo = useCallback(
    (roleKey: 'manager' | 'worker') => {
      const account = DEMO_ACCOUNTS[roleKey];
      loginWithCredentials(account.email, account.password);
    },
    [loginWithCredentials]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setFeedback(null);
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const resetDemoData = useCallback(() => {
    const freshEmployees = createInitialEmployees();
    const freshAppointments = createInitialAppointments();
    const freshOvertime = createInitialOvertimeEntries();
    setEmployees(freshEmployees);
    setAppointments(freshAppointments);
    setOvertimeEntries(freshOvertime);
    setFeedback({
      message: 'All appointments, staff records, and overtime entries have been restored to initial state.',
      tone: 'info',
    });
  }, []);

  const saveAppointment = useCallback(
    (input: AppointmentInput): ActionResult => {
      if (currentUser?.role !== UserRole.Manager) {
        return { ok: false, error: 'Access denied: Manager role is required to create or edit appointments.' };
      }

      const worker = employees.find((e) => e.id === input.assignedWorkerId);
      if (!worker) {
        return { ok: false, error: 'Please select a valid employee to assign.' };
      }

      const existing = input.id
        ? appointments.find((a) => a.id === input.id)
        : undefined;

      // Prevent assigning new appointments (or reassigning existing appointments) to deactivated employees
      const isChangingOrCreatingAssignment =
        !existing || existing.assignedWorkerId !== input.assignedWorkerId;

      if (
        isChangingOrCreatingAssignment &&
        worker.employmentStatus !== 'Active'
      ) {
        return {
          ok: false,
          error: `${worker.fullName} is currently inactive and cannot be assigned new appointments.`,
        };
      }

      const nowIso = new Date().toISOString();

      if (existing) {
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === existing.id
              ? {
                  ...apt,
                  customerName: input.customerName.trim(),
                  customerPhone: input.customerPhone.trim(),
                  serviceAddress: input.serviceAddress.trim(),
                  serviceType: input.serviceType,
                  date: input.date,
                  time: input.time,
                  assignedWorkerId: input.assignedWorkerId,
                  estimatedDuration: input.estimatedDuration,
                  notes: input.notes.trim(),
                  status: input.status,
                  updatedAt: nowIso,
                }
              : apt
          )
        );
        setFeedback({
          message: `Updated appointment ${existing.id} for ${input.customerName.trim()}.`,
          tone: 'success',
        });
      } else {
        const maxNum = appointments.reduce((max, item) => {
          const num = Number(item.id.replace('APT-', ''));
          return Number.isFinite(num) && num > max ? num : max;
        }, 1010);
        const newId = `APT-${maxNum + 1}`;
        const created: Appointment = {
          id: newId,
          customerName: input.customerName.trim(),
          customerPhone: input.customerPhone.trim(),
          serviceAddress: input.serviceAddress.trim(),
          serviceType: input.serviceType,
          date: input.date,
          time: input.time,
          assignedWorkerId: input.assignedWorkerId,
          estimatedDuration: input.estimatedDuration,
          notes: input.notes.trim(),
          completionNotes: '',
          status: input.status,
          updatedAt: nowIso,
        };
        setAppointments((prev) => [...prev, created]);
        setFeedback({
          message: `Created appointment ${newId} for ${created.customerName} and assigned ${worker.fullName}.`,
          tone: 'success',
        });
      }

      return { ok: true };
    },
    [appointments, currentUser, employees]
  );

  const assignAppointmentWorker = useCallback(
    (appointmentId: string, workerId: string): ActionResult => {
      if (currentUser?.role !== UserRole.Manager) {
        return { ok: false, error: 'Access denied: Only managers can assign workers.' };
      }
      const worker = employees.find((e) => e.id === workerId);
      if (!worker) {
        return { ok: false, error: 'Selected worker was not found.' };
      }
      if (worker.employmentStatus !== 'Active') {
        return {
          ok: false,
          error: `${worker.fullName} is deactivated and cannot receive new assignments.`,
        };
      }
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? {
                ...apt,
                assignedWorkerId: workerId,
                updatedAt: new Date().toISOString(),
              }
            : apt
        )
      );
      setFeedback({
        message: `Assigned ${appointmentId} to ${worker.fullName}.`,
        tone: 'success',
      });
      return { ok: true };
    },
    [currentUser, employees]
  );

  const updateAppointmentStatusAsManager = useCallback(
    (appointmentId: string, status: AppointmentStatus): ActionResult => {
      if (currentUser?.role !== UserRole.Manager) {
        return { ok: false, error: 'Access denied: Manager role required.' };
      }
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? { ...apt, status, updatedAt: new Date().toISOString() }
            : apt
        )
      );
      setFeedback({
        message: `Appointment ${appointmentId} status updated to ${status}.`,
        tone: 'success',
      });
      return { ok: true };
    },
    [currentUser]
  );

  const cancelAppointment = useCallback(
    (appointmentId: string): ActionResult => {
      if (currentUser?.role !== UserRole.Manager) {
        return { ok: false, error: 'Access denied: Only managers can cancel appointments.' };
      }
      const target = appointments.find((a) => a.id === appointmentId);
      if (!target) {
        return { ok: false, error: 'Appointment not found.' };
      }
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? { ...apt, status: 'Cancelled', updatedAt: new Date().toISOString() }
            : apt
        )
      );
      setFeedback({
        message: `Cancelled appointment ${appointmentId} for ${target.customerName}.`,
        tone: 'info',
      });
      return { ok: true };
    },
    [appointments, currentUser]
  );

  const saveEmployee = useCallback(
    (input: EmployeeInput): ActionResult => {
      if (currentUser?.role !== UserRole.Manager) {
        return { ok: false, error: 'Access denied: Manager role required to manage staff.' };
      }

      if (input.id) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === input.id
              ? {
                  ...emp,
                  fullName: input.fullName.trim(),
                  phone: input.phone.trim(),
                  email: input.email.trim(),
                  jobTitle: input.jobTitle.trim(),
                  employmentStatus: input.employmentStatus,
                  payType: input.payType,
                  basicPayCents: input.basicPayCents,
                }
              : emp
          )
        );
        setFeedback({
          message: `Updated staff profile for ${input.fullName.trim()}.`,
          tone: 'success',
        });
      } else {
        const maxNum = employees.reduce((max, item) => {
          const num = Number(item.id.replace('EMP-', ''));
          return Number.isFinite(num) && num > max ? num : max;
        }, 104);
        const newEmp: Employee = {
          id: `EMP-${maxNum + 1}`,
          fullName: input.fullName.trim(),
          phone: input.phone.trim(),
          email: input.email.trim(),
          jobTitle: input.jobTitle.trim(),
          employmentStatus: input.employmentStatus,
          payType: input.payType,
          basicPayCents: input.basicPayCents,
        };
        setEmployees((prev) => [...prev, newEmp]);
        setFeedback({
          message: `Added ${newEmp.fullName} (${newEmp.jobTitle}) to staff directory.`,
          tone: 'success',
        });
      }
      return { ok: true };
    },
    [currentUser, employees]
  );

  const setEmployeeStatus = useCallback(
    (employeeId: string, status: 'Active' | 'Inactive'): ActionResult => {
      if (currentUser?.role !== UserRole.Manager) {
        return { ok: false, error: 'Access denied: Manager role required.' };
      }
      const target = employees.find((e) => e.id === employeeId);
      if (!target) {
        return { ok: false, error: 'Employee not found.' };
      }
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === employeeId ? { ...emp, employmentStatus: status } : emp
        )
      );
      setFeedback({
        message:
          status === 'Inactive'
            ? `Deactivated ${target.fullName}. They can no longer be assigned new appointments.`
            : `Reactivated ${target.fullName} for dispatch assignments.`,
        tone: status === 'Inactive' ? 'info' : 'success',
      });
      return { ok: true };
    },
    [currentUser, employees]
  );

  const saveOvertimeEntry = useCallback(
    (input: OvertimeInput): ActionResult => {
      if (currentUser?.role !== UserRole.Manager) {
        return { ok: false, error: 'Access denied: Payroll & overtime requires Manager access.' };
      }
      const emp = employees.find((e) => e.id === input.employeeId);
      if (!emp) {
        return { ok: false, error: 'Please choose an employee.' };
      }

      if (input.id) {
        setOvertimeEntries((prev) =>
          prev.map((item) =>
            item.id === input.id
              ? {
                  ...item,
                  employeeId: input.employeeId,
                  date: input.date,
                  hours: input.hours,
                  amountCents: input.amountCents,
                  notes: input.notes.trim(),
                  approvalStatus: input.approvalStatus,
                }
              : item
          )
        );
        setFeedback({
          message: `Updated overtime entry ${input.id} for ${emp.fullName}.`,
          tone: 'success',
        });
      } else {
        const maxNum = overtimeEntries.reduce((max, item) => {
          const num = Number(item.id.replace('OT-', ''));
          return Number.isFinite(num) && num > max ? num : max;
        }, 304);
        const created: OvertimeEntry = {
          id: `OT-${maxNum + 1}`,
          employeeId: input.employeeId,
          date: input.date,
          hours: input.hours,
          amountCents: input.amountCents,
          notes: input.notes.trim(),
          approvalStatus: input.approvalStatus,
        };
        setOvertimeEntries((prev) => [created, ...prev]);
        setFeedback({
          message: `Recorded ${created.hours} overtime hrs for ${emp.fullName}.`,
          tone: 'success',
        });
      }
      return { ok: true };
    },
    [currentUser, employees, overtimeEntries]
  );

  const approveOvertimeEntry = useCallback(
    (entryId: string): ActionResult => {
      if (currentUser?.role !== UserRole.Manager) {
        return { ok: false, error: 'Access denied: Manager role required.' };
      }
      const entry = overtimeEntries.find((item) => item.id === entryId);
      if (!entry) {
        return { ok: false, error: 'Overtime entry not found.' };
      }
      const emp = employees.find((e) => e.id === entry.employeeId);
      setOvertimeEntries((prev) =>
        prev.map((item) =>
          item.id === entryId ? { ...item, approvalStatus: 'Approved' } : item
        )
      );
      setFeedback({
        message: `Approved overtime entry ${entryId}${emp ? ` for ${emp.fullName}` : ''}.`,
        tone: 'success',
      });
      return { ok: true };
    },
    [currentUser, employees, overtimeEntries]
  );

  const startWorkerJob = useCallback(
    (appointmentId: string): ActionResult => {
      if (currentUser?.role !== UserRole.Worker || !currentUser.employeeId) {
        return { ok: false, error: 'Access denied: Worker account required.' };
      }
      const apt = appointments.find((a) => a.id === appointmentId);
      if (!apt || apt.assignedWorkerId !== currentUser.employeeId) {
        return {
          ok: false,
          error: 'Access denied: You can only update appointments assigned to you.',
        };
      }
      if (apt.status !== 'Scheduled') {
        return {
          ok: false,
          error: 'Only Scheduled jobs can be started.',
        };
      }
      setAppointments((prev) =>
        prev.map((item) =>
          item.id === appointmentId
            ? {
                ...item,
                status: 'In Progress',
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
      setFeedback({
        message: `Started job ${apt.id} for ${apt.customerName} (In Progress).`,
        tone: 'success',
      });
      return { ok: true };
    },
    [appointments, currentUser]
  );

  const completeWorkerJob = useCallback(
    (appointmentId: string, completionNotes: string): ActionResult => {
      if (currentUser?.role !== UserRole.Worker || !currentUser.employeeId) {
        return { ok: false, error: 'Access denied: Worker account required.' };
      }
      const apt = appointments.find((a) => a.id === appointmentId);
      if (!apt || apt.assignedWorkerId !== currentUser.employeeId) {
        return {
          ok: false,
          error: 'Access denied: You can only complete appointments assigned to you.',
        };
      }
      if (apt.status !== 'In Progress') {
        return {
          ok: false,
          error: 'Only jobs currently In Progress can be marked Completed.',
        };
      }
      setAppointments((prev) =>
        prev.map((item) =>
          item.id === appointmentId
            ? {
                ...item,
                status: 'Completed',
                completionNotes: completionNotes.trim(),
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
      setFeedback({
        message: `Marked ${apt.id} (${apt.customerName}) as Completed.`,
        tone: 'success',
      });
      return { ok: true };
    },
    [appointments, currentUser]
  );

  const updateWorkerCompletionNotes = useCallback(
    (appointmentId: string, completionNotes: string): ActionResult => {
      if (currentUser?.role !== UserRole.Worker || !currentUser.employeeId) {
        return { ok: false, error: 'Access denied: Worker account required.' };
      }
      const apt = appointments.find((a) => a.id === appointmentId);
      if (!apt || apt.assignedWorkerId !== currentUser.employeeId) {
        return {
          ok: false,
          error: 'Access denied: You can only update notes on your own jobs.',
        };
      }
      setAppointments((prev) =>
        prev.map((item) =>
          item.id === appointmentId
            ? {
                ...item,
                completionNotes: completionNotes.trim(),
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
      setFeedback({
        message: `Saved job completion notes for ${apt.id}.`,
        tone: 'success',
      });
      return { ok: true };
    },
    [appointments, currentUser]
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      currentUser,
      route,
      todayStr,
      employees,
      appointments,
      overtimeEntries,
      feedback,
      setFeedback,
      navigate,
      loginWithCredentials,
      loginAsDemo,
      logout,
      resetDemoData,
      saveAppointment,
      assignAppointmentWorker,
      updateAppointmentStatusAsManager,
      cancelAppointment,
      saveEmployee,
      setEmployeeStatus,
      saveOvertimeEntry,
      approveOvertimeEntry,
      startWorkerJob,
      completeWorkerJob,
      updateWorkerCompletionNotes,
    }),
    [
      currentUser,
      route,
      todayStr,
      employees,
      appointments,
      overtimeEntries,
      feedback,
      navigate,
      loginWithCredentials,
      loginAsDemo,
      logout,
      resetDemoData,
      saveAppointment,
      assignAppointmentWorker,
      updateAppointmentStatusAsManager,
      cancelAppointment,
      saveEmployee,
      setEmployeeStatus,
      saveOvertimeEntry,
      approveOvertimeEntry,
      startWorkerJob,
      completeWorkerJob,
      updateWorkerCompletionNotes,
    ]
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
};

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used inside AppDataProvider');
  }
  return ctx;
}
