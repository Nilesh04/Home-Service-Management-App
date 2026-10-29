import React, { useMemo, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import {
  UserRole,
  type Employee,
  type OvertimeApprovalStatus,
  type OvertimeEntry,
} from '../types';
import { useAppData } from '../context/AppDataContext';
import {
  computeOvertimeSummary,
  dollarsToCents,
  formatCurrencyCents,
  formatDisplayDate,
  formatMonthLabel,
} from '../utils/format';
import { WorkspaceHeader } from '../components/AppShell';
import {
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  StatusBadge,
  Surface,
  Textarea,
} from '../components/ui';
import { AccessDeniedScreen } from './AccessDeniedScreen';

interface OvertimeFormErrors {
  employeeId?: string;
  date?: string;
  hours?: string;
  amount?: string;
  general?: string;
}

export const PayrollScreen: React.FC = () => {
  const {
    currentUser,
    employees,
    overtimeEntries,
    todayStr,
    saveOvertimeEntry,
    approveOvertimeEntry,
  } = useAppData();

  const currentMonthKey = todayStr.slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  // Add / Edit Overtime Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OvertimeEntry | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(todayStr);
  const [hoursInput, setHoursInput] = useState('2');
  const [amountInput, setAmountInput] = useState('');
  const [notes, setNotes] = useState('');
  const [approvalStatus, setApprovalStatus] =
    useState<OvertimeApprovalStatus>('Pending');
  const [errors, setErrors] = useState<OvertimeFormErrors>({});

  const availableMonths = useMemo(() => {
    const set = new Set<string>([currentMonthKey]);
    for (const item of overtimeEntries) {
      if (item.date.length >= 7) {
        set.add(item.date.slice(0, 7));
      }
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [currentMonthKey, overtimeEntries]);

  const summary = useMemo(
    () => computeOvertimeSummary(overtimeEntries, selectedMonth),
    [overtimeEntries, selectedMonth]
  );

  const employeeMap = useMemo(
    () => new Map<string, Employee>(employees.map((e) => [e.id, e])),
    [employees]
  );

  // Per-employee monthly compensation & overtime rollup
  const employeePayrollRollup = useMemo(() => {
    return employees.map((emp) => {
      const empEntries = summary.filtered.filter(
        (item) => item.employeeId === emp.id
      );
      const totalHours = empEntries.reduce((sum, e) => sum + e.hours, 0);
      const totalCents = empEntries.reduce((sum, e) => sum + e.amountCents, 0);
      const hasPending = empEntries.some((e) => e.approvalStatus === 'Pending');
      const rollupStatus: OvertimeApprovalStatus | null =
        empEntries.length === 0
          ? null
          : hasPending
            ? 'Pending'
            : 'Approved';

      return {
        employee: emp,
        totalHours: Math.round(totalHours * 100) / 100,
        totalCents,
        entryCount: empEntries.length,
        rollupStatus,
      };
    });
  }, [employees, summary.filtered]);

  if (currentUser?.role !== UserRole.Manager) {
    return <AccessDeniedScreen attemptedRoute="manager-payroll" />;
  }

  const suggestOvertimeDollars = (empId: string, hrsStr: string): string => {
    const emp = employeeMap.get(empId);
    const hrs = Number(hrsStr);
    if (!emp || !Number.isFinite(hrs) || hrs <= 0) return '';
    const baseHourlyDollars =
      emp.payType === 'Hourly Rate'
        ? emp.basicPayCents / 100
        : emp.basicPayCents / 100 / 160;
    const suggested = baseHourlyDollars * 1.5 * hrs;
    return suggested.toFixed(2);
  };

  const openAddModal = () => {
    const defaultEmpId = employees[0]?.id ?? '';
    setEditingEntry(null);
    setEmployeeId(defaultEmpId);
    setDate(todayStr);
    setHoursInput('2');
    setAmountInput(suggestOvertimeDollars(defaultEmpId, '2'));
    setNotes('');
    setApprovalStatus('Pending');
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (entry: OvertimeEntry) => {
    setEditingEntry(entry);
    setEmployeeId(entry.employeeId);
    setDate(entry.date);
    setHoursInput(String(entry.hours));
    setAmountInput((entry.amountCents / 100).toFixed(2));
    setNotes(entry.notes);
    setApprovalStatus(entry.approvalStatus);
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: OvertimeFormErrors = {};
    if (!employeeId) {
      nextErrors.employeeId = 'Select an employee.';
    }
    if (!date) {
      nextErrors.date = 'Date is required.';
    }
    const hrs = Number(hoursInput);
    if (!Number.isFinite(hrs) || hrs <= 0 || hrs > 24) {
      nextErrors.hours = 'Enter overtime hours between 0.5 and 24.';
    }
    const amt = Number(amountInput);
    if (!Number.isFinite(amt) || amt <= 0) {
      nextErrors.amount = 'Enter a valid overtime amount in USD.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const res = saveOvertimeEntry({
      id: editingEntry?.id,
      employeeId,
      date,
      hours: Math.round(hrs * 100) / 100,
      amountCents: dollarsToCents(amt),
      notes,
      approvalStatus,
    });

    if (!res.ok) {
      setErrors({ general: res.error });
      return;
    }

    setModalOpen(false);
  };

  const formatPayRate = (emp?: Employee) => {
    if (!emp) return '—';
    const base = formatCurrencyCents(emp.basicPayCents);
    return emp.payType === 'Hourly Rate' ? `${base} / hr` : `${base} / mo`;
  };

  const periodDescription =
    selectedMonth === 'ALL'
      ? 'All recorded months'
      : formatMonthLabel(selectedMonth);

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Payroll &amp; overtime records"
        subtitle="Record base pay rates, track technician overtime hours, and approve overtime entries"
        actions={
          <Button tone="primary" onClick={openAddModal}>
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Add Overtime Entry</span>
          </Button>
        }
      />

      {/* Period Filter & Monthly Summary Strip */}
      <Surface className="divide-y divide-border/70">
        <div className="flex flex-wrap items-end justify-between gap-4 p-4 sm:p-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Monthly overtime summary
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Totals computed from overtime records in {periodDescription}
            </p>
          </div>

          <Field
            label="Selected month"
            htmlFor="payroll-month-select"
            className="w-full sm:w-56"
          >
            <Select
              id="payroll-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {availableMonths.map((mKey) => (
                <option key={mKey} value={mKey}>
                  {formatMonthLabel(mKey)}
                </option>
              ))}
              <option value="ALL">All recorded months</option>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-muted">
              Total overtime hours
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-foreground tabular-nums">
              {summary.totalHours} hrs
            </p>
            <p className="mt-1 text-xs text-muted">{periodDescription}</p>
          </div>

          <div className="border-t border-border/70 p-4 sm:border-t-0 sm:border-l sm:p-5 lg:border-l-0">
            <p className="text-xs font-medium text-muted">
              Total overtime amount
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-foreground tabular-nums">
              {formatCurrencyCents(summary.totalAmountCents)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Pending + Approved ({periodDescription})
            </p>
          </div>

          <div className="border-t border-border/70 p-4 sm:p-5 lg:border-t-0">
            <p className="text-xs font-medium text-muted">Approved overtime</p>
            <p className="mt-1.5 text-2xl font-semibold text-success tabular-nums">
              {formatCurrencyCents(summary.approvedAmountCents)}
            </p>
            <p className="mt-1 text-xs text-muted">Cleared for payroll</p>
          </div>

          <div className="border-t border-border/70 p-4 sm:border-l sm:p-5 lg:border-t-0 lg:border-l-0">
            <p className="text-xs font-medium text-muted">Pending approvals</p>
            <p className="mt-1.5 text-2xl font-semibold text-warning tabular-nums">
              {summary.pendingCount}
            </p>
            <p className="mt-1 text-xs text-muted">
              Entries awaiting manager sign-off
            </p>
          </div>
        </div>
      </Surface>

      {/* Overtime Entries Log Table */}
      <Surface className="divide-y divide-border/70">
        <div className="p-4 sm:p-5">
          <h2 className="text-base font-semibold text-foreground">
            Overtime entries ({summary.filtered.length})
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Individual overtime submissions with employee base compensation, hours, amounts, and approval controls.
          </p>
        </div>

        {summary.filtered.length === 0 ? (
          <EmptyState
            title="No overtime entries for this period"
            description="Record a technician overtime entry to track extra hours and approval status."
            actionLabel="Add Overtime Entry"
            onAction={openAddModal}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-xs font-medium tracking-[0.05em] text-muted uppercase">
                    <th className="px-5 py-3">Employee name</th>
                    <th className="px-4 py-3">Pay type</th>
                    <th className="px-4 py-3 text-right">
                      Basic salary / rate
                    </th>
                    <th className="px-4 py-3">Date &amp; notes</th>
                    <th className="px-4 py-3 text-right">Overtime hours</th>
                    <th className="px-4 py-3 text-right">Overtime amount</th>
                    <th className="px-4 py-3">Approval status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {summary.filtered.map((entry) => {
                    const emp = employeeMap.get(entry.employeeId);
                    return (
                      <tr key={entry.id} className="hover:bg-background/50">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-foreground">
                            {emp?.fullName ?? entry.employeeId}
                          </p>
                          <p className="font-mono text-xs text-muted">
                            {entry.id}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                          {emp?.payType ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right text-foreground tabular-nums">
                          {formatPayRate(emp)}
                        </td>
                        <td className="max-w-xs px-4 py-3.5">
                          <p className="text-foreground tabular-nums">
                            {formatDisplayDate(entry.date, todayStr)}
                          </p>
                          {entry.notes ? (
                            <p
                              className="truncate text-xs text-muted"
                              title={entry.notes}
                            >
                              {entry.notes}
                            </p>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium text-foreground tabular-nums">
                          {entry.hours} hrs
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-foreground tabular-nums">
                          {formatCurrencyCents(entry.amountCents)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <StatusBadge status={entry.approvalStatus} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {entry.approvalStatus === 'Pending' ? (
                              <Button
                                tone="primary"
                                size="sm"
                                onClick={() => approveOvertimeEntry(entry.id)}
                              >
                                <Check
                                  className="h-3.5 w-3.5 shrink-0"
                                  aria-hidden="true"
                                />
                                <span>Approve</span>
                              </Button>
                            ) : null}
                            <Button
                              tone="quiet"
                              size="sm"
                              onClick={() => openEditModal(entry)}
                            >
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Overtime List */}
            <div className="divide-y divide-border/70 lg:hidden">
              {summary.filtered.map((entry) => {
                const emp = employeeMap.get(entry.employeeId);
                return (
                  <div key={entry.id} className="space-y-2.5 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {emp?.fullName ?? entry.employeeId}
                        </p>
                        <p className="text-xs text-muted tabular-nums">
                          {emp?.payType} · {formatPayRate(emp)}
                        </p>
                      </div>
                      <StatusBadge status={entry.approvalStatus} />
                    </div>

                    <div className="space-y-1 text-xs text-muted">
                      <p className="tabular-nums">
                        {formatDisplayDate(entry.date, todayStr)} ·{' '}
                        <strong className="font-semibold text-foreground">
                          {entry.hours} hrs
                        </strong>{' '}
                        ·{' '}
                        <strong className="font-semibold text-foreground">
                          {formatCurrencyCents(entry.amountCents)}
                        </strong>
                      </p>
                      {entry.notes ? <p>{entry.notes}</p> : null}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {entry.approvalStatus === 'Pending' ? (
                        <Button
                          tone="primary"
                          size="sm"
                          onClick={() => approveOvertimeEntry(entry.id)}
                        >
                          Approve
                        </Button>
                      ) : null}
                      <Button
                        tone="quiet"
                        size="sm"
                        onClick={() => openEditModal(entry)}
                      >
                        Edit entry
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Surface>

      {/* Staff Base Compensation & Period Overtime Overview */}
      <Surface className="divide-y divide-border/70">
        <div className="p-4 sm:p-5">
          <h2 className="text-base font-semibold text-foreground">
            Staff compensation &amp; monthly overtime rollup
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Base salary or hourly rate alongside recorded overtime for{' '}
            {periodDescription}.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 text-xs font-medium tracking-[0.05em] text-muted uppercase">
                <th className="px-5 py-3">Employee name</th>
                <th className="px-4 py-3">Pay type</th>
                <th className="px-4 py-3 text-right">
                  Basic salary / hourly rate
                </th>
                <th className="px-4 py-3 text-right">Overtime hours</th>
                <th className="px-4 py-3 text-right">Overtime amount</th>
                <th className="px-5 py-3">Approval status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {employeePayrollRollup.map((row) => (
                <tr key={row.employee.id} className="hover:bg-background/50">
                  <td className="px-5 py-3.5 font-medium text-foreground">
                    {row.employee.fullName}
                  </td>
                  <td className="px-4 py-3.5 text-muted">
                    {row.employee.payType}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right text-foreground tabular-nums">
                    {formatPayRate(row.employee)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right text-foreground tabular-nums">
                    {row.totalHours} hrs
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium text-foreground tabular-nums">
                    {formatCurrencyCents(row.totalCents)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    {row.rollupStatus ? (
                      <StatusBadge status={row.rollupStatus} />
                    ) : (
                      <span className="text-xs text-muted">No overtime logged</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      {/* Add / Edit Overtime Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingEntry
            ? `Edit overtime entry · ${editingEntry.id}`
            : 'Add overtime entry'
        }
        subtitle="Record overtime hours, compensation amount, and approval status."
        maxWidthClass="max-w-lg"
        footer={
          <>
            <Button tone="quiet" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button tone="primary" type="submit" form="overtime-form">
              {editingEntry ? 'Save changes' : 'Save overtime entry'}
            </Button>
          </>
        }
      >
        <form
          id="overtime-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          {errors.general ? (
            <p role="alert" className="text-sm font-medium text-danger">
              {errors.general}
            </p>
          ) : null}

          <Field
            label="Employee"
            htmlFor="ot-employee"
            required
            error={errors.employeeId}
          >
            <Select
              id="ot-employee"
              value={employeeId}
              onChange={(e) => {
                const nextEmpId = e.target.value;
                setEmployeeId(nextEmpId);
                if (!editingEntry) {
                  setAmountInput(suggestOvertimeDollars(nextEmpId, hoursInput));
                }
              }}
              hasError={Boolean(errors.employeeId)}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({formatPayRate(emp)})
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date" htmlFor="ot-date" required error={errors.date}>
              <Input
                id="ot-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                hasError={Boolean(errors.date)}
              />
            </Field>

            <Field
              label="Overtime hours"
              htmlFor="ot-hours"
              required
              error={errors.hours}
            >
              <Input
                id="ot-hours"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={hoursInput}
                onChange={(e) => {
                  const nextHours = e.target.value;
                  setHoursInput(nextHours);
                  if (!editingEntry) {
                    setAmountInput(
                      suggestOvertimeDollars(employeeId, nextHours)
                    );
                  }
                }}
                hasError={Boolean(errors.hours)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Overtime amount (USD)"
              htmlFor="ot-amount"
              required
              error={errors.amount}
              hint="Editable recorded overtime payout."
            >
              <Input
                id="ot-amount"
                type="number"
                min="1"
                step="0.01"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="150.00"
                hasError={Boolean(errors.amount)}
              />
            </Field>

            <Field
              label="Approval status"
              htmlFor="ot-approval-status"
              required
            >
              <Select
                id="ot-approval-status"
                value={approvalStatus}
                onChange={(e) =>
                  setApprovalStatus(e.target.value as OvertimeApprovalStatus)
                }
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
              </Select>
            </Field>
          </div>

          <Field
            label="Notes"
            htmlFor="ot-notes"
            hint="Reason for extra hours or customer emergency reference."
          >
            <Textarea
              id="ot-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Evening call-out to isolate leaking water heater valve."
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
};
