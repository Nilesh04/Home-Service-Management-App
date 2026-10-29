import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  APPOINTMENT_STATUSES,
  UserRole,
  type Appointment,
  type AppointmentStatus,
} from '../types';
import { useAppData } from '../context/AppDataContext';
import {
  computeManagerMetrics,
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
  Select,
  StatusBadge,
  Surface,
} from '../components/ui';
import { AppointmentFormModal } from '../components/AppointmentFormModal';
import { AppointmentDetailModal } from '../components/AppointmentDetailModal';
import { AccessDeniedScreen } from './AccessDeniedScreen';

export const ManagerDashboard: React.FC = () => {
  const {
    currentUser,
    appointments,
    employees,
    todayStr,
    navigate,
    cancelAppointment,
  } = useAppData();

  const [dateFilter, setDateFilter] = useState<string>(todayStr);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [workerFilter, setWorkerFilter] = useState<string>('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [viewingAptId, setViewingAptId] = useState<string | null>(null);
  const [cancellingApt, setCancellingApt] = useState<Appointment | null>(null);

  const metrics = useMemo(
    () => computeManagerMetrics(appointments, employees, todayStr),
    [appointments, employees, todayStr]
  );

  const filteredAppointments = useMemo(() => {
    const matching = appointments.filter((apt) => {
      if (dateFilter && apt.date !== dateFilter) return false;
      if (statusFilter !== 'ALL' && apt.status !== statusFilter) return false;
      if (workerFilter !== 'ALL' && apt.assignedWorkerId !== workerFilter)
        return false;
      return true;
    });
    return sortAppointmentsChronologically(matching);
  }, [appointments, dateFilter, statusFilter, workerFilter]);

  const employeeMap = useMemo(
    () => new Map(employees.map((e) => [e.id, e])),
    [employees]
  );

  if (currentUser?.role !== UserRole.Manager) {
    return <AccessDeniedScreen attemptedRoute="manager-dashboard" />;
  }

  const hasActiveFilters =
    dateFilter !== todayStr || statusFilter !== 'ALL' || workerFilter !== 'ALL';

  const openCreateModal = () => {
    setEditingApt(null);
    setFormOpen(true);
  };

  const openEditModal = (apt: Appointment) => {
    setEditingApt(apt);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Operations dashboard"
        subtitle={`Dispatch summary as of ${formatDisplayDate(todayStr, todayStr).replace('Today, ', '')}`}
        actions={
          <Button tone="primary" onClick={openCreateModal}>
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Create Appointment</span>
          </Button>
        }
      />

      {/* Summary Figures Strip (single border level, hairline dividers) */}
      <Surface className="grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x">
        <div className="p-4 sm:p-5">
          <p className="text-xs font-medium text-muted">
            Total appointments today
          </p>
          <p className="mt-1.5 text-3xl font-semibold text-foreground tabular-nums">
            {metrics.totalToday}
          </p>
          <p className="mt-1 text-xs text-muted">
            All jobs dated {todayStr}
          </p>
        </div>

        <div className="border-t border-border/70 p-4 sm:border-t-0 sm:border-l sm:p-5 lg:border-l-0">
          <p className="text-xs font-medium text-muted">
            Scheduled appointments
          </p>
          <p className="mt-1.5 text-3xl font-semibold text-primary tabular-nums">
            {metrics.scheduled}
          </p>
          <p className="mt-1 text-xs text-muted">
            Awaiting technician start
          </p>
        </div>

        <div className="border-t border-border/70 p-4 sm:p-5 lg:border-t-0">
          <p className="text-xs font-medium text-muted">Jobs in progress</p>
          <p className="mt-1.5 text-3xl font-semibold text-warning tabular-nums">
            {metrics.inProgress}
          </p>
          <p className="mt-1 text-xs text-muted">
            Active on customer sites
          </p>
        </div>

        <div className="border-t border-border/70 p-4 sm:border-l sm:p-5 lg:border-t-0 lg:border-l-0">
          <p className="text-xs font-medium text-muted">Completed jobs</p>
          <p className="mt-1.5 text-3xl font-semibold text-success tabular-nums">
            {metrics.completed}
          </p>
          <p className="mt-1 text-xs text-muted">
            Finished service orders
          </p>
        </div>

        <div className="border-t border-border/70 p-4 sm:col-span-2 sm:p-5 lg:col-span-1 lg:border-t-0">
          <p className="text-xs font-medium text-muted">
            Total active employees
          </p>
          <p className="mt-1.5 text-3xl font-semibold text-foreground tabular-nums">
            {metrics.activeEmployees}
          </p>
          <p className="mt-1 text-xs text-muted">
            Out of {employees.length} staff records
          </p>
        </div>
      </Surface>

      {/* Appointments Panel */}
      <Surface className="divide-y divide-border/70">
        {/* Panel Header & Filter Controls */}
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {dateFilter === todayStr
                  ? "Today's appointment schedule"
                  : dateFilter
                    ? `Appointments for ${formatDisplayDate(dateFilter, todayStr)}`
                    : 'All scheduled dates'}
              </h2>
              <p className="mt-0.5 text-xs text-muted tabular-nums">
                Showing {filteredAppointments.length}{' '}
                {filteredAppointments.length === 1
                  ? 'appointment'
                  : 'appointments'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                tone={dateFilter === todayStr ? 'primary' : 'quiet'}
                size="sm"
                onClick={() => setDateFilter(todayStr)}
              >
                Today
              </Button>
              <Button
                tone={dateFilter === '' ? 'primary' : 'quiet'}
                size="sm"
                onClick={() => setDateFilter('')}
              >
                All dates
              </Button>
              <Button
                tone="quiet"
                size="sm"
                onClick={() => navigate('manager-appointments')}
              >
                Full appointment manager
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Filter by date" htmlFor="dash-filter-date">
              <Input
                id="dash-filter-date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </Field>

            <Field label="Filter by status" htmlFor="dash-filter-status">
              <Select
                id="dash-filter-status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as AppointmentStatus | 'ALL')
                }
              >
                <option value="ALL">All statuses</option>
                {APPOINTMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Filter by assigned worker" htmlFor="dash-filter-worker">
              <Select
                id="dash-filter-worker"
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
              >
                <option value="ALL">All workers</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName}
                    {emp.employmentStatus === 'Inactive' ? ' (Inactive)' : ''}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {hasActiveFilters ? (
            <div className="flex justify-end">
              <Button
                tone="ghost"
                size="sm"
                onClick={() => {
                  setDateFilter(todayStr);
                  setStatusFilter('ALL');
                  setWorkerFilter('ALL');
                }}
              >
                Reset to today&apos;s view
              </Button>
            </div>
          ) : null}
        </div>

        {/* Appointment Table (Desktop) & Structured List (Mobile) */}
        {filteredAppointments.length === 0 ? (
          <EmptyState
            title="No appointments match these filters"
            description="Adjust the date, status, or assigned worker filter, or create a new customer appointment."
            actionLabel="Create Appointment"
            onAction={openCreateModal}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-xs font-medium tracking-[0.05em] text-muted uppercase">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Service type</th>
                    <th className="px-4 py-3">Date &amp; time</th>
                    <th className="px-4 py-3">Assigned worker</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredAppointments.map((apt) => {
                    const worker = employeeMap.get(apt.assignedWorkerId);
                    return (
                      <tr key={apt.id} className="hover:bg-background/50">
                        <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs font-medium text-foreground">
                          {apt.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-foreground">
                            {apt.customerName}
                          </p>
                          <p className="text-xs text-muted tabular-nums">
                            {apt.customerPhone}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-foreground">
                          {apt.serviceType}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">
                          <p className="text-foreground">
                            {formatDisplayDate(apt.date, todayStr)}
                          </p>
                          <p className="text-xs text-muted">
                            {formatDisplayTime(apt.time)} · {apt.estimatedDuration}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-medium text-foreground">
                            {worker?.fullName ?? 'Unassigned'}
                          </span>
                          {worker?.employmentStatus === 'Inactive' ? (
                            <span className="ml-1.5 text-xs text-muted">
                              (Inactive)
                            </span>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <StatusBadge status={apt.status} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <Button
                              tone="quiet"
                              size="sm"
                              onClick={() => setViewingAptId(apt.id)}
                            >
                              View
                            </Button>
                            <Button
                              tone="ghost"
                              size="sm"
                              onClick={() => openEditModal(apt)}
                            >
                              Edit
                            </Button>
                            {apt.status !== 'Cancelled' ? (
                              <Button
                                tone="ghost"
                                size="sm"
                                className="text-danger hover:text-danger"
                                onClick={() => setCancellingApt(apt)}
                              >
                                Cancel
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="divide-y divide-border/70 md:hidden">
              {filteredAppointments.map((apt) => {
                const worker = employeeMap.get(apt.assignedWorkerId);
                return (
                  <div key={apt.id} className="space-y-2.5 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">
                          {apt.customerName}
                        </p>
                        <p className="text-xs text-muted">
                          <span className="font-mono text-foreground">{apt.id}</span> ·{' '}
                          {apt.serviceType}
                        </p>
                      </div>
                      <StatusBadge status={apt.status} />
                    </div>

                    <div className="text-xs text-muted tabular-nums">
                      <p>
                        {formatDisplayDate(apt.date, todayStr)} at{' '}
                        {formatDisplayTime(apt.time)} ({apt.estimatedDuration})
                      </p>
                      <p className="mt-0.5">
                        Assigned:{' '}
                        <span className="font-medium text-foreground">
                          {worker?.fullName ?? 'Unassigned'}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        tone="quiet"
                        size="sm"
                        onClick={() => setViewingAptId(apt.id)}
                      >
                        View details
                      </Button>
                      <Button
                        tone="quiet"
                        size="sm"
                        onClick={() => openEditModal(apt)}
                      >
                        Edit
                      </Button>
                      {apt.status !== 'Cancelled' ? (
                        <Button
                          tone="dangerQuiet"
                          size="sm"
                          onClick={() => setCancellingApt(apt)}
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Surface>

      <AppointmentFormModal
        open={formOpen}
        editingAppointment={editingApt}
        onClose={() => setFormOpen(false)}
      />

      <AppointmentDetailModal
        appointmentId={viewingAptId}
        onClose={() => setViewingAptId(null)}
        onEditRequest={(apt) => openEditModal(apt)}
      />

      <ConfirmDialog
        open={Boolean(cancellingApt)}
        title={
          cancellingApt
            ? `Cancel appointment ${cancellingApt.id}?`
            : 'Cancel appointment?'
        }
        description={
          cancellingApt
            ? `Are you sure you want to cancel ${cancellingApt.customerName}'s ${cancellingApt.serviceType.toLowerCase()} appointment on ${formatDisplayDate(cancellingApt.date, todayStr)}?`
            : ''
        }
        confirmLabel="Confirm cancellation"
        tone="danger"
        onCancel={() => setCancellingApt(null)}
        onConfirm={() => {
          if (cancellingApt) {
            cancelAppointment(cancellingApt.id);
          }
          setCancellingApt(null);
        }}
      />
    </div>
  );
};
