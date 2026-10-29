import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import {
  UserRole,
  type Employee,
  type EmploymentStatus,
  type PayType,
} from '../types';
import { useAppData } from '../context/AppDataContext';
import {
  dollarsToCents,
  formatCurrencyCents,
  formatDisplayDate,
  formatDisplayTime,
  sortAppointmentsChronologically,
} from '../utils/format';
import { WorkspaceHeader } from '../components/AppShell';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  StatusBadge,
  Surface,
} from '../components/ui';
import { AppointmentDetailModal } from '../components/AppointmentDetailModal';
import { AccessDeniedScreen } from './AccessDeniedScreen';

interface EmployeeFormErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  jobTitle?: string;
  basicPay?: string;
  general?: string;
}

export const StaffScreen: React.FC = () => {
  const {
    currentUser,
    employees,
    appointments,
    todayStr,
    saveEmployee,
    setEmployeeStatus,
  } = useAppData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmploymentStatus | 'ALL'>(
    'ALL'
  );

  // Add / Edit modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [employmentStatus, setEmploymentStatus] =
    useState<EmploymentStatus>('Active');
  const [payType, setPayType] = useState<PayType>('Hourly Rate');
  const [basicPayInput, setBasicPayInput] = useState('32.00');
  const [errors, setErrors] = useState<EmployeeFormErrors>({});

  // Detail & Assigned Appointments modal state
  const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(
    null
  );
  const [viewingAppointmentId, setViewingAppointmentId] = useState<
    string | null
  >(null);

  // Deactivate confirmation state
  const [deactivatingEmp, setDeactivatingEmp] = useState<Employee | null>(null);

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return employees.filter((emp) => {
      if (statusFilter !== 'ALL' && emp.employmentStatus !== statusFilter)
        return false;
      if (q) {
        const hay = `${emp.fullName} ${emp.email} ${emp.phone} ${emp.jobTitle} ${emp.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [employees, searchQuery, statusFilter]);

  const viewingEmployee =
    employees.find((e) => e.id === viewingEmployeeId) ?? null;

  const viewingEmployeeAppointments = useMemo(() => {
    if (!viewingEmployeeId) return [];
    return sortAppointmentsChronologically(
      appointments.filter((a) => a.assignedWorkerId === viewingEmployeeId)
    );
  }, [appointments, viewingEmployeeId]);

  if (currentUser?.role !== UserRole.Manager) {
    return <AccessDeniedScreen attemptedRoute="manager-staff" />;
  }

  const openAddEmployee = () => {
    setEditingEmployee(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setJobTitle('');
    setEmploymentStatus('Active');
    setPayType('Hourly Rate');
    setBasicPayInput('32.00');
    setErrors({});
    setFormOpen(true);
  };

  const openEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setFullName(emp.fullName);
    setPhone(emp.phone);
    setEmail(emp.email);
    setJobTitle(emp.jobTitle);
    setEmploymentStatus(emp.employmentStatus);
    setPayType(emp.payType);
    setBasicPayInput((emp.basicPayCents / 100).toFixed(2));
    setErrors({});
    setFormOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: EmployeeFormErrors = {};
    if (!fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 7) {
      nextErrors.phone = 'Enter a valid phone number.';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!jobTitle.trim()) {
      nextErrors.jobTitle = 'Job title is required.';
    }
    const parsedDollars = Number(basicPayInput);
    if (!Number.isFinite(parsedDollars) || parsedDollars <= 0) {
      nextErrors.basicPay = 'Enter a positive pay amount.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const res = saveEmployee({
      id: editingEmployee?.id,
      fullName,
      phone,
      email,
      jobTitle,
      employmentStatus,
      payType,
      basicPayCents: dollarsToCents(parsedDollars),
    });

    if (!res.ok) {
      setErrors({ general: res.error });
      return;
    }

    setFormOpen(false);
  };

  const formatEmployeePay = (emp: Employee) => {
    const amount = formatCurrencyCents(emp.basicPayCents);
    return emp.payType === 'Hourly Rate' ? `${amount} / hr` : `${amount} / mo`;
  };

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Staff management"
        subtitle="Manage field technicians, employment status, pay rates, and assigned appointments"
        actions={
          <Button tone="primary" onClick={openAddEmployee}>
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Add Employee</span>
          </Button>
        }
      />

      <Surface className="divide-y divide-border/70">
        {/* Filter Bar */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <Field
            label="Search staff"
            htmlFor="staff-search"
            className="w-full sm:max-w-xs"
          >
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <Input
                id="staff-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, title, email, phone…"
                className="pl-9"
              />
            </div>
          </Field>

          <div
            role="group"
            aria-label="Filter by employment status"
            className="flex flex-wrap items-center gap-2"
          >
            {(['ALL', 'Active', 'Inactive'] as const).map((st) => {
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  aria-pressed={active}
                  className={`inline-flex min-h-10 items-center whitespace-nowrap rounded-control border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-surface text-foreground hover:bg-background'
                  }`}
                >
                  {st === 'ALL' ? 'All staff' : st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Employee Table */}
        {filteredEmployees.length === 0 ? (
          <EmptyState
            title="No employees match your search"
            description="Adjust the status filter or add a new technician to the staff directory."
            actionLabel="Add Employee"
            onAction={openAddEmployee}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-xs font-medium tracking-[0.05em] text-muted uppercase">
                    <th className="px-5 py-3">Employee name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Job title</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Basic pay rate / salary</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredEmployees.map((emp) => {
                    const assignedCount = appointments.filter(
                      (a) =>
                        a.assignedWorkerId === emp.id &&
                        a.status !== 'Cancelled'
                    ).length;

                    return (
                      <tr key={emp.id} className="hover:bg-background/50">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-foreground">
                            {emp.fullName}
                          </p>
                          <p className="text-xs text-muted">
                            <span className="font-mono">{emp.id}</span> ·{' '}
                            {assignedCount} active job{assignedCount === 1 ? '' : 's'}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-foreground tabular-nums">
                          {emp.phone}
                        </td>
                        <td className="px-4 py-3.5 text-muted">{emp.email}</td>
                        <td className="px-4 py-3.5 text-foreground">
                          {emp.jobTitle}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <StatusBadge status={emp.employmentStatus} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right tabular-nums">
                          <p className="font-medium text-foreground">
                            {formatEmployeePay(emp)}
                          </p>
                          <p className="text-xs text-muted">{emp.payType}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <Button
                              tone="quiet"
                              size="sm"
                              onClick={() => setViewingEmployeeId(emp.id)}
                            >
                              View
                            </Button>
                            <Button
                              tone="ghost"
                              size="sm"
                              onClick={() => openEditEmployee(emp)}
                            >
                              Edit
                            </Button>
                            {emp.employmentStatus === 'Active' ? (
                              <Button
                                tone="ghost"
                                size="sm"
                                className="text-danger hover:text-danger"
                                onClick={() => setDeactivatingEmp(emp)}
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                tone="quiet"
                                size="sm"
                                onClick={() =>
                                  setEmployeeStatus(emp.id, 'Active')
                                }
                              >
                                Activate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Staff List */}
            <div className="divide-y divide-border/70 lg:hidden">
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className="space-y-2.5 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {emp.fullName}
                      </p>
                      <p className="text-xs text-muted">{emp.jobTitle}</p>
                    </div>
                    <StatusBadge status={emp.employmentStatus} />
                  </div>

                  <div className="space-y-0.5 text-xs text-muted tabular-nums">
                    <p>
                      {emp.phone} · {emp.email}
                    </p>
                    <p>
                      {emp.payType}:{' '}
                      <span className="font-medium text-foreground">
                        {formatEmployeePay(emp)}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      tone="quiet"
                      size="sm"
                      onClick={() => setViewingEmployeeId(emp.id)}
                    >
                      View &amp; jobs
                    </Button>
                    <Button
                      tone="quiet"
                      size="sm"
                      onClick={() => openEditEmployee(emp)}
                    >
                      Edit
                    </Button>
                    {emp.employmentStatus === 'Active' ? (
                      <Button
                        tone="dangerQuiet"
                        size="sm"
                        onClick={() => setDeactivatingEmp(emp)}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        tone="primary"
                        size="sm"
                        onClick={() => setEmployeeStatus(emp.id, 'Active')}
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Surface>

      {/* Add / Edit Employee Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={
          editingEmployee
            ? `Edit employee · ${editingEmployee.fullName}`
            : 'Add employee'
        }
        subtitle="Record technician contact details, status, and compensation rate."
        maxWidthClass="max-w-xl"
        footer={
          <>
            <Button tone="quiet" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button tone="primary" type="submit" form="employee-form">
              {editingEmployee ? 'Save changes' : 'Add employee'}
            </Button>
          </>
        }
      >
        <form
          id="employee-form"
          onSubmit={handleSaveEmployee}
          className="space-y-4"
          noValidate
        >
          {errors.general ? (
            <p role="alert" className="text-sm font-medium text-danger">
              {errors.general}
            </p>
          ) : null}

          <Field
            label="Full name"
            htmlFor="emp-fullname"
            required
            error={errors.fullName}
          >
            <Input
              id="emp-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jordan Alvarez"
              hasError={Boolean(errors.fullName)}
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Phone"
              htmlFor="emp-phone"
              required
              error={errors.phone}
            >
              <Input
                id="emp-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 017-2200"
                hasError={Boolean(errors.phone)}
              />
            </Field>

            <Field
              label="Email"
              htmlFor="emp-email"
              required
              error={errors.email}
            >
              <Input
                id="emp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan.alvarez@homeservice.demo"
                hasError={Boolean(errors.email)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Job title"
              htmlFor="emp-jobtitle"
              required
              error={errors.jobTitle}
            >
              <Input
                id="emp-jobtitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. HVAC Service Technician"
                hasError={Boolean(errors.jobTitle)}
              />
            </Field>

            <Field
              label="Employment status"
              htmlFor="emp-status"
              required
              hint="Inactive staff cannot receive new assignments."
            >
              <Select
                id="emp-status"
                value={employmentStatus}
                onChange={(e) =>
                  setEmploymentStatus(e.target.value as EmploymentStatus)
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Pay type" htmlFor="emp-paytype" required>
              <Select
                id="emp-paytype"
                value={payType}
                onChange={(e) => {
                  const nextType = e.target.value as PayType;
                  setPayType(nextType);
                  if (!editingEmployee) {
                    setBasicPayInput(
                      nextType === 'Monthly Salary' ? '4800.00' : '32.00'
                    );
                  }
                }}
              >
                <option value="Hourly Rate">Hourly Rate</option>
                <option value="Monthly Salary">Monthly Salary</option>
              </Select>
            </Field>

            <Field
              label={
                payType === 'Hourly Rate'
                  ? 'Hourly rate (USD)'
                  : 'Basic monthly salary (USD)'
              }
              htmlFor="emp-basicpay"
              required
              error={errors.basicPay}
            >
              <Input
                id="emp-basicpay"
                type="number"
                min="1"
                step="0.50"
                value={basicPayInput}
                onChange={(e) => setBasicPayInput(e.target.value)}
                hasError={Boolean(errors.basicPay)}
              />
            </Field>
          </div>
        </form>
      </Modal>

      {/* View Employee Details & Assigned Appointments Modal */}
      <Modal
        open={Boolean(viewingEmployee)}
        onClose={() => setViewingEmployeeId(null)}
        title={viewingEmployee?.fullName ?? 'Employee details'}
        subtitle={
          viewingEmployee
            ? `${viewingEmployee.jobTitle} · ${viewingEmployee.id}`
            : ''
        }
        maxWidthClass="max-w-2xl"
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            {viewingEmployee ? (
              <Button
                tone="quiet"
                size="sm"
                onClick={() => {
                  const emp = viewingEmployee;
                  setViewingEmployeeId(null);
                  openEditEmployee(emp);
                }}
              >
                Edit profile
              </Button>
            ) : (
              <span />
            )}
            <Button tone="primary" onClick={() => setViewingEmployeeId(null)}>
              Close
            </Button>
          </div>
        }
      >
        {viewingEmployee ? (
          <div className="divide-y divide-border/70">
            <dl className="grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted">
                  Employment status
                </dt>
                <dd className="mt-1">
                  <StatusBadge status={viewingEmployee.employmentStatus} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted">
                  Compensation ({viewingEmployee.payType})
                </dt>
                <dd className="mt-1 text-sm font-semibold text-foreground tabular-nums">
                  {formatEmployeePay(viewingEmployee)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted">Phone</dt>
                <dd className="mt-1 text-sm text-foreground tabular-nums">
                  {viewingEmployee.phone}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted">Email</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {viewingEmployee.email}
                </dd>
              </div>
            </dl>

            <div className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Assigned appointments ({viewingEmployeeAppointments.length})
                </h3>
              </div>

              {viewingEmployeeAppointments.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  No appointments are currently assigned to{' '}
                  {viewingEmployee.fullName}.
                </p>
              ) : (
                <div className="mt-3 divide-y divide-border/60 border-t border-border/60">
                  {viewingEmployeeAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          <span className="font-mono text-xs">{apt.id}</span> ·{' '}
                          {apt.customerName} ({apt.serviceType})
                        </p>
                        <p className="text-xs text-muted tabular-nums">
                          {formatDisplayDate(apt.date, todayStr)} at{' '}
                          {formatDisplayTime(apt.time)} · {apt.serviceAddress}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <StatusBadge status={apt.status} />
                        <Button
                          tone="quiet"
                          size="sm"
                          onClick={() => setViewingAppointmentId(apt.id)}
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <AppointmentDetailModal
        appointmentId={viewingAppointmentId}
        onClose={() => setViewingAppointmentId(null)}
      />

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        open={Boolean(deactivatingEmp)}
        title={
          deactivatingEmp
            ? `Deactivate ${deactivatingEmp.fullName}?`
            : 'Deactivate employee?'
        }
        description={
          deactivatingEmp
            ? `${deactivatingEmp.fullName} will be marked Inactive and prevented from receiving any new appointment assignments until reactivated.`
            : ''
        }
        confirmLabel="Deactivate employee"
        tone="danger"
        onCancel={() => setDeactivatingEmp(null)}
        onConfirm={() => {
          if (deactivatingEmp) {
            setEmployeeStatus(deactivatingEmp.id, 'Inactive');
          }
          setDeactivatingEmp(null);
        }}
      />
    </div>
  );
};
