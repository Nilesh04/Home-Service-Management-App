import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import {
  APPOINTMENT_STATUSES,
  SERVICE_TYPES,
  UserRole,
  type Appointment,
  type AppointmentStatus,
  type ServiceType,
} from '../types';
import { useAppData } from '../context/AppDataContext';
import {
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

export const AppointmentsScreen: React.FC = () => {
  const {
    currentUser,
    appointments,
    employees,
    todayStr,
    assignAppointmentWorker,
    updateAppointmentStatusAsManager,
    cancelAppointment,
  } = useAppData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>(
    'ALL'
  );
  const [serviceFilter, setServiceFilter] = useState<ServiceType | 'ALL'>('ALL');
  const [workerFilter, setWorkerFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [viewingAptId, setViewingAptId] = useState<string | null>(null);
  const [cancellingApt, setCancellingApt] = useState<Appointment | null>(null);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: appointments.length };
    for (const st of APPOINTMENT_STATUSES) {
      counts[st] = appointments.filter((a) => a.status === st).length;
    }
    return counts;
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = appointments.filter((apt) => {
      if (statusFilter !== 'ALL' && apt.status !== statusFilter) return false;
      if (serviceFilter !== 'ALL' && apt.serviceType !== serviceFilter)
        return false;
      if (workerFilter !== 'ALL' && apt.assignedWorkerId !== workerFilter)
        return false;
      if (dateFilter && apt.date !== dateFilter) return false;

      if (q) {
        const workerName =
          employees
            .find((e) => e.id === apt.assignedWorkerId)
            ?.fullName.toLowerCase() ?? '';
        const haystack = [
          apt.id,
          apt.customerName,
          apt.customerPhone,
          apt.serviceAddress,
          apt.serviceType,
          apt.notes,
          apt.completionNotes,
          workerName,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return sortAppointmentsChronologically(list);
  }, [
    appointments,
    dateFilter,
    employees,
    searchQuery,
    serviceFilter,
    statusFilter,
    workerFilter,
  ]);

  if (currentUser?.role !== UserRole.Manager) {
    return <AccessDeniedScreen attemptedRoute="manager-appointments" />;
  }

  const hasFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== 'ALL' ||
    serviceFilter !== 'ALL' ||
    workerFilter !== 'ALL' ||
    Boolean(dateFilter);

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
        title="Appointment management"
        subtitle="Search, schedule, assign active technicians, and manage service statuses"
        actions={
          <Button tone="primary" onClick={openCreateModal}>
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Create Appointment</span>
          </Button>
        }
      />

      <Surface className="divide-y divide-border/70">
        {/* Status Filter Controls & Search */}
        <div className="space-y-4 p-4 sm:p-5">
          <div
            role="group"
            aria-label="Filter appointments by status"
            className="flex flex-wrap items-center gap-2"
          >
            {(['ALL', ...APPOINTMENT_STATUSES] as const).map((st) => {
              const active = statusFilter === st;
              const label = st === 'ALL' ? 'All' : st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  aria-pressed={active}
                  className={`inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-control border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-surface text-foreground hover:bg-background'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-xs tabular-nums ${
                      active ? 'text-primary-foreground/85' : 'text-muted'
                    }`}
                  >
                    ({statusCounts[st] ?? 0})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Search appointments" htmlFor="apt-search">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <Input
                  id="apt-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Customer, ID, phone, address…"
                  className="pl-9"
                />
              </div>
            </Field>

            <Field label="Service type" htmlFor="apt-filter-service">
              <Select
                id="apt-filter-service"
                value={serviceFilter}
                onChange={(e) =>
                  setServiceFilter(e.target.value as ServiceType | 'ALL')
                }
              >
                <option value="ALL">All service types</option>
                {SERVICE_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Assigned worker" htmlFor="apt-filter-worker">
              <Select
                id="apt-filter-worker"
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

            <Field label="Appointment date" htmlFor="apt-filter-date">
              <Input
                id="apt-filter-date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </Field>
          </div>

          {hasFilters ? (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted tabular-nums">
                Showing {filteredAppointments.length} of {appointments.length}{' '}
                appointments
              </p>
              <Button
                tone="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setServiceFilter('ALL');
                  setWorkerFilter('ALL');
                  setDateFilter('');
                }}
              >
                Clear all filters
              </Button>
            </div>
          ) : null}
        </div>

        {/* Results */}
        {filteredAppointments.length === 0 ? (
          <EmptyState
            title="No matching appointments found"
            description="Clear search or filter criteria, or create a new customer appointment."
            actionLabel="Create Appointment"
            onAction={openCreateModal}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-xs font-medium tracking-[0.05em] text-muted uppercase">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-4 py-3">Customer &amp; address</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3">Assigned worker</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-background/50">
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs font-medium text-foreground">
                        {apt.id}
                      </td>
                      <td className="max-w-xs px-4 py-3.5">
                        <p className="font-medium text-foreground">
                          {apt.customerName}
                        </p>
                        <p className="text-xs text-muted tabular-nums">
                          {apt.customerPhone}
                        </p>
                        <p
                          className="truncate text-xs text-muted"
                          title={apt.serviceAddress}
                        >
                          {apt.serviceAddress}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <p className="font-medium text-foreground">
                          {apt.serviceType}
                        </p>
                        <p className="text-xs text-muted">
                          {apt.estimatedDuration}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 tabular-nums">
                        <p className="text-foreground">
                          {formatDisplayDate(apt.date, todayStr)}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDisplayTime(apt.time)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <Select
                          aria-label={`Assign worker for ${apt.id}`}
                          value={apt.assignedWorkerId}
                          onChange={(e) =>
                            assignAppointmentWorker(apt.id, e.target.value)
                          }
                          className="min-h-9 max-w-[13rem] py-1 text-xs"
                        >
                          {employees.map((emp) => {
                            const isInactive =
                              emp.employmentStatus === 'Inactive';
                            const isCurrent = emp.id === apt.assignedWorkerId;
                            return (
                              <option
                                key={emp.id}
                                value={emp.id}
                                disabled={isInactive && !isCurrent}
                              >
                                {emp.fullName}
                                {isInactive ? ' (Inactive)' : ''}
                              </option>
                            );
                          })}
                        </Select>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1.5">
                          <StatusBadge status={apt.status} />
                          <Select
                            aria-label={`Change status for ${apt.id}`}
                            value={apt.status}
                            onChange={(e) => {
                              const next = e.target.value as AppointmentStatus;
                              if (next === 'Cancelled') {
                                setCancellingApt(apt);
                              } else {
                                updateAppointmentStatusAsManager(apt.id, next);
                              }
                            }}
                            className="min-h-8 max-w-[9.5rem] py-1 text-xs"
                          >
                            {APPOINTMENT_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Button
                            tone="quiet"
                            size="sm"
                            onClick={() => setViewingAptId(apt.id)}
                          >
                            Details
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet List */}
            <div className="divide-y divide-border/70 lg:hidden">
              {filteredAppointments.map((apt) => {
                const assignedEmp = employees.find(
                  (e) => e.id === apt.assignedWorkerId
                );
                return (
                  <div key={apt.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">
                          {apt.customerName}
                        </p>
                        <p className="text-xs text-muted">
                          <span className="font-mono text-foreground">
                            {apt.id}
                          </span>{' '}
                          · {apt.serviceType} · {apt.estimatedDuration}
                        </p>
                      </div>
                      <StatusBadge status={apt.status} />
                    </div>

                    <div className="space-y-1 text-xs text-muted">
                      <p className="tabular-nums">
                        {formatDisplayDate(apt.date, todayStr)} at{' '}
                        {formatDisplayTime(apt.time)}
                      </p>
                      <p>{apt.serviceAddress}</p>
                      <p>
                        Technician:{' '}
                        <span className="font-medium text-foreground">
                          {assignedEmp?.fullName ?? 'Unassigned'}
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
            ? `Confirm cancelling ${cancellingApt.customerName}'s ${cancellingApt.serviceType.toLowerCase()} appointment scheduled for ${formatDisplayDate(cancellingApt.date, todayStr)}.`
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
