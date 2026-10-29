import React, { useMemo, useState } from 'react';
import { Calendar, MapPin, Phone, Search } from 'lucide-react';
import { UserRole, type Appointment, type AppointmentStatus } from '../types';
import { useAppData } from '../context/AppDataContext';
import {
  computeWorkerMetrics,
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
  StatusBadge,
  Surface,
  Textarea,
} from '../components/ui';
import { AppointmentDetailModal } from '../components/AppointmentDetailModal';

type WorkerTabFilter =
  | 'ALL'
  | 'TODAY'
  | 'Scheduled'
  | 'In Progress'
  | 'Completed';

export const WorkerDashboard: React.FC<{
  mode: 'dashboard' | 'appointments';
}> = ({ mode }) => {
  const {
    currentUser,
    appointments,
    todayStr,
    startWorkerJob,
    completeWorkerJob,
  } = useAppData();

  const [tabFilter, setTabFilter] = useState<WorkerTabFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingAptId, setViewingAptId] = useState<string | null>(null);

  // Quick completion confirmation dialog state
  const [completingApt, setCompletingApt] = useState<Appointment | null>(null);
  const [completionNotesDraft, setCompletionNotesDraft] = useState('');

  const myAppointments = useMemo(() => {
    if (!currentUser?.employeeId) return [];
    const assigned = appointments.filter(
      (apt) => apt.assignedWorkerId === currentUser.employeeId
    );
    return sortAppointmentsChronologically(assigned);
  }, [appointments, currentUser?.employeeId]);

  const metrics = useMemo(
    () => computeWorkerMetrics(myAppointments, todayStr),
    [myAppointments, todayStr]
  );

  const visibleAppointments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return myAppointments.filter((apt) => {
      if (mode === 'appointments') {
        if (tabFilter === 'TODAY' && apt.date !== todayStr) return false;
        if (
          tabFilter !== 'ALL' &&
          tabFilter !== 'TODAY' &&
          apt.status !== (tabFilter as AppointmentStatus)
        ) {
          return false;
        }
        if (q) {
          const hay =
            `${apt.id} ${apt.customerName} ${apt.serviceType} ${apt.serviceAddress} ${apt.notes} ${apt.completionNotes}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
      }
      return true;
    });
  }, [mode, myAppointments, searchQuery, tabFilter, todayStr]);

  if (!currentUser || currentUser.role !== UserRole.Worker) {
    return null;
  }

  const openConfirmComplete = (apt: Appointment) => {
    setCompletingApt(apt);
    setCompletionNotesDraft(apt.completionNotes);
  };

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title={mode === 'dashboard' ? 'My field dashboard' : 'My appointments'}
        subtitle={
          mode === 'dashboard'
            ? `Assigned schedule for ${currentUser.name}`
            : 'Chronological list of your assigned customer service jobs'
        }
      />

      {mode === 'dashboard' ? (
        <Surface className="grid grid-cols-2 divide-x divide-y divide-border/70 lg:grid-cols-4 lg:divide-y-0">
          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-muted">
              Today&apos;s assigned jobs
            </p>
            <p className="mt-1.5 text-3xl font-semibold text-foreground tabular-nums">
              {metrics.todaysAssigned}
            </p>
            <p className="mt-1 text-xs text-muted">Active for {todayStr}</p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-muted">Upcoming jobs</p>
            <p className="mt-1.5 text-3xl font-semibold text-primary tabular-nums">
              {metrics.upcomingJobs}
            </p>
            <p className="mt-1 text-xs text-muted">Scheduled after today</p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-muted">Jobs in progress</p>
            <p className="mt-1.5 text-3xl font-semibold text-warning tabular-nums">
              {metrics.inProgress}
            </p>
            <p className="mt-1 text-xs text-muted">Currently started</p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-muted">Completed jobs</p>
            <p className="mt-1.5 text-3xl font-semibold text-success tabular-nums">
              {metrics.completed}
            </p>
            <p className="mt-1 text-xs text-muted">Finished by you</p>
          </div>
        </Surface>
      ) : (
        <Surface className="space-y-4 p-4 sm:p-5">
          <div
            role="group"
            aria-label="Filter your appointments"
            className="flex flex-wrap items-center gap-2"
          >
            {(
              [
                { id: 'ALL', label: 'All assigned' },
                { id: 'TODAY', label: 'Today' },
                { id: 'Scheduled', label: 'Scheduled' },
                { id: 'In Progress', label: 'In Progress' },
                { id: 'Completed', label: 'Completed' },
              ] as const
            ).map((tab) => {
              const active = tabFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTabFilter(tab.id)}
                  aria-pressed={active}
                  className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-control border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-surface text-foreground hover:bg-background'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <Field label="Search your assigned jobs" htmlFor="worker-job-search">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <Input
                id="worker-job-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Customer name, address, service type…"
                className="pl-9"
              />
            </div>
          </Field>
        </Surface>
      )}

      {/* Chronological Appointment Cards */}
      <section aria-label="Assigned appointments" className="space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">
            Assigned schedule ({visibleAppointments.length})
          </h2>
          <p className="text-xs text-muted">Chronological order</p>
        </div>

        {visibleAppointments.length === 0 ? (
          <Surface>
            <EmptyState
              title="No assigned jobs match this view"
              description={
                mode === 'appointments'
                  ? 'Try switching status filters or clearing your search query.'
                  : 'New jobs assigned to you by dispatch will appear here automatically.'
              }
              actionLabel={
                mode === 'appointments' &&
                (tabFilter !== 'ALL' || Boolean(searchQuery))
                  ? 'Show all assigned jobs'
                  : undefined
              }
              onAction={
                mode === 'appointments'
                  ? () => {
                      setTabFilter('ALL');
                      setSearchQuery('');
                    }
                  : undefined
              }
            />
          </Surface>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {visibleAppointments.map((apt) => (
              <Surface
                key={apt.id}
                className="flex flex-col justify-between divide-y divide-border/70"
              >
                <div className="space-y-3 p-4 sm:p-5">
                  {/* Card Top Row: Customer, Service Type, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground">
                        {apt.customerName}
                      </h3>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                        <span className="font-medium text-foreground">
                          {apt.serviceType}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-xs">{apt.id}</span>
                      </p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>

                  {/* Schedule, Address, Phone */}
                  <dl className="space-y-2 border-t border-border/60 pt-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Calendar
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted"
                        aria-hidden="true"
                      />
                      <dd className="font-medium text-foreground tabular-nums">
                        {formatDisplayDate(apt.date, todayStr)} at{' '}
                        {formatDisplayTime(apt.time)}{' '}
                        <span className="font-normal text-muted">
                          ({apt.estimatedDuration})
                        </span>
                      </dd>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted"
                        aria-hidden="true"
                      />
                      <dd className="text-foreground">{apt.serviceAddress}</dd>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone
                        className="h-4 w-4 shrink-0 text-muted"
                        aria-hidden="true"
                      />
                      <dd className="tabular-nums">
                        <a
                          href={`tel:${apt.customerPhone.replace(/[^\d+]/g, '')}`}
                          className="font-medium text-primary underline decoration-primary/35 underline-offset-4 hover:brightness-90"
                        >
                          {apt.customerPhone}
                        </a>
                      </dd>
                    </div>
                  </dl>

                  {/* Notes */}
                  <div className="space-y-2 border-t border-border/60 pt-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-muted">
                        Dispatch notes
                      </p>
                      <p className="mt-0.5 leading-relaxed text-foreground">
                        {apt.notes || 'No special dispatch instructions.'}
                      </p>
                    </div>

                    {apt.completionNotes ? (
                      <div className="border-t border-border/50 pt-2">
                        <p className="text-xs font-medium text-success">
                          Completion notes
                        </p>
                        <p className="mt-0.5 leading-relaxed text-foreground">
                          {apt.completionNotes}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Action Footer (touch-friendly 44px+ buttons) */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3.5 sm:px-5">
                  <Button
                    tone="quiet"
                    onClick={() => setViewingAptId(apt.id)}
                  >
                    View details
                  </Button>

                  {apt.status === 'Scheduled' ? (
                    <Button
                      tone="primary"
                      onClick={() => startWorkerJob(apt.id)}
                    >
                      Start job
                    </Button>
                  ) : apt.status === 'In Progress' ? (
                    <Button
                      tone="primary"
                      onClick={() => openConfirmComplete(apt)}
                    >
                      Mark completed
                    </Button>
                  ) : null}
                </div>
              </Surface>
            ))}
          </div>
        )}
      </section>

      <AppointmentDetailModal
        appointmentId={viewingAptId}
        onClose={() => setViewingAptId(null)}
      />

      {/* Confirmation Dialog before marking a job Completed */}
      <ConfirmDialog
        open={Boolean(completingApt)}
        title={
          completingApt
            ? `Mark ${completingApt.id} as Completed?`
            : 'Mark job as Completed?'
        }
        description={
          completingApt
            ? `Confirm completion for ${completingApt.customerName} (${completingApt.serviceType}). Add or review your completion notes below before finishing.`
            : ''
        }
        confirmLabel="Confirm completed"
        tone="primary"
        onCancel={() => setCompletingApt(null)}
        onConfirm={() => {
          if (completingApt) {
            completeWorkerJob(completingApt.id, completionNotesDraft);
          }
          setCompletingApt(null);
        }}
      >
        <Field
          label="Job completion notes"
          htmlFor="card-completion-notes"
          hint="Shared immediately with the manager dashboard."
        >
          <Textarea
            id="card-completion-notes"
            rows={3}
            value={completionNotesDraft}
            onChange={(e) => setCompletionNotesDraft(e.target.value)}
            placeholder="Describe work completed, parts installed, or system checks..."
          />
        </Field>
      </ConfirmDialog>
    </div>
  );
};
