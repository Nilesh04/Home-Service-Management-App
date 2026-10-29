import React, { useEffect, useState } from 'react';
import { Phone, MapPin, Clock, Calendar } from 'lucide-react';
import {
  APPOINTMENT_STATUSES,
  UserRole,
  type Appointment,
  type AppointmentStatus,
} from '../types';
import { useAppData } from '../context/AppDataContext';
import { formatDisplayDate, formatDisplayTime } from '../utils/format';
import {
  Button,
  ConfirmDialog,
  Field,
  Modal,
  Select,
  StatusBadge,
  Textarea,
} from './ui';

interface AppointmentDetailModalProps {
  appointmentId: string | null;
  onClose: () => void;
  onEditRequest?: (appointment: Appointment) => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointmentId,
  onClose,
  onEditRequest,
}) => {
  const {
    currentUser,
    appointments,
    employees,
    todayStr,
    assignAppointmentWorker,
    updateAppointmentStatusAsManager,
    cancelAppointment,
    startWorkerJob,
    completeWorkerJob,
    updateWorkerCompletionNotes,
  } = useAppData();

  const appointment =
    appointments.find((a) => a.id === appointmentId) ?? null;

  const [completionNotesDraft, setCompletionNotesDraft] = useState('');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [notesSavedNotice, setNotesSavedNotice] = useState(false);

  useEffect(() => {
    if (appointment) {
      setCompletionNotesDraft(appointment.completionNotes);
      setNotesSavedNotice(false);
    }
  }, [appointment]);

  if (!appointment || !currentUser) return null;

  const isManager = currentUser.role === UserRole.Manager;
  const isAssignedWorker =
    currentUser.role === UserRole.Worker &&
    currentUser.employeeId === appointment.assignedWorkerId;

  const assignedWorker = employees.find(
    (e) => e.id === appointment.assignedWorkerId
  );

  const handleSaveWorkerNotes = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateWorkerCompletionNotes(
      appointment.id,
      completionNotesDraft
    );
    if (res.ok) {
      setNotesSavedNotice(true);
    }
  };

  return (
    <>
      <Modal
        open={Boolean(appointment)}
        onClose={onClose}
        title={`${appointment.customerName}`}
        subtitle={`${appointment.serviceType} · ${appointment.id}`}
        maxWidthClass="max-w-2xl"
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {isManager && appointment.status !== 'Cancelled' ? (
                <Button
                  tone="dangerQuiet"
                  size="sm"
                  onClick={() => setConfirmCancelOpen(true)}
                >
                  Cancel appointment
                </Button>
              ) : null}
              {isManager && onEditRequest ? (
                <Button
                  tone="quiet"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onEditRequest(appointment);
                  }}
                >
                  Edit details
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button tone="quiet" onClick={onClose}>
                Close
              </Button>
              {isAssignedWorker && appointment.status === 'Scheduled' ? (
                <Button
                  tone="primary"
                  onClick={() => startWorkerJob(appointment.id)}
                >
                  Start job
                </Button>
              ) : null}
              {isAssignedWorker && appointment.status === 'In Progress' ? (
                <Button
                  tone="primary"
                  onClick={() => setConfirmCompleteOpen(true)}
                >
                  Mark completed
                </Button>
              ) : null}
            </div>
          </div>
        }
      >
        <div className="divide-y divide-border/70">
          {/* Status & Schedule Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className="font-mono text-xs text-foreground">
                {appointment.id}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-foreground">
                {appointment.serviceType}
              </span>
            </div>
            <StatusBadge status={appointment.status} />
          </div>

          {/* Core Customer & Schedule Details */}
          <dl className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Date &amp; time</span>
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground tabular-nums">
                {formatDisplayDate(appointment.date, todayStr)} at{' '}
                {formatDisplayTime(appointment.time)}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Estimated duration</span>
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {appointment.estimatedDuration}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Customer phone</span>
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground tabular-nums">
                <a
                  href={`tel:${appointment.customerPhone.replace(/[^\d+]/g, '')}`}
                  className="underline decoration-border underline-offset-4 hover:text-primary"
                >
                  {appointment.customerPhone}
                </a>
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="text-xs font-medium text-muted">Assigned technician</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {assignedWorker ? (
                  <>
                    {assignedWorker.fullName}
                    {assignedWorker.employmentStatus === 'Inactive' ? (
                      <span className="ml-1.5 text-xs text-muted">(Inactive)</span>
                    ) : null}
                  </>
                ) : (
                  'Unassigned'
                )}
              </dd>
            </div>

            <div className="min-w-0 sm:col-span-2">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Service address</span>
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {appointment.serviceAddress}
              </dd>
            </div>
          </dl>

          {/* Dispatch Notes */}
          <div className="py-4">
            <h3 className="text-xs font-medium text-muted">Dispatch &amp; service notes</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground">
              {appointment.notes || 'No dispatch notes recorded.'}
            </p>
          </div>

          {/* Manager Quick Controls */}
          {isManager ? (
            <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
              <Field
                label="Assign or change worker"
                htmlFor="detail-assign-worker"
                hint="Only active staff can be newly assigned."
              >
                <Select
                  id="detail-assign-worker"
                  value={appointment.assignedWorkerId}
                  onChange={(e) =>
                    assignAppointmentWorker(appointment.id, e.target.value)
                  }
                >
                  {employees.map((emp) => {
                    const isInactive = emp.employmentStatus === 'Inactive';
                    const isCurrent = emp.id === appointment.assignedWorkerId;
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
              </Field>

              <Field label="Update status" htmlFor="detail-update-status">
                <Select
                  id="detail-update-status"
                  value={appointment.status}
                  onChange={(e) => {
                    const nextStatus = e.target.value as AppointmentStatus;
                    if (nextStatus === 'Cancelled') {
                      setConfirmCancelOpen(true);
                    } else {
                      updateAppointmentStatusAsManager(
                        appointment.id,
                        nextStatus
                      );
                    }
                  }}
                >
                  {APPOINTMENT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : null}

          {/* Completion Notes: Read-only for Manager, Editable for Assigned Worker */}
          {isManager ? (
            <div className="pt-4">
              <h3 className="text-xs font-medium text-muted">
                Technician completion notes
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                {appointment.completionNotes ||
                  'No technician completion notes added yet.'}
              </p>
            </div>
          ) : isAssignedWorker ? (
            <form onSubmit={handleSaveWorkerNotes} className="space-y-3 pt-4">
              <Field
                label="Job completion notes"
                htmlFor="worker-completion-notes"
                hint="Record parts used, work performed, or follow-up observations for dispatch."
              >
                <Textarea
                  id="worker-completion-notes"
                  rows={3}
                  value={completionNotesDraft}
                  onChange={(e) => {
                    setCompletionNotesDraft(e.target.value);
                    setNotesSavedNotice(false);
                  }}
                  placeholder="Describe work completed, test results, or parts replaced..."
                />
              </Field>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-success" role="status">
                  {notesSavedNotice ? 'Notes saved to appointment record.' : ''}
                </span>
                <Button tone="quiet" size="sm" type="submit">
                  Save notes
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </Modal>

      {/* Manager Cancel Confirmation */}
      <ConfirmDialog
        open={confirmCancelOpen}
        title={`Cancel appointment ${appointment.id}?`}
        description={`This will mark ${appointment.customerName}'s ${appointment.serviceType.toLowerCase()} appointment on ${formatDisplayDate(appointment.date, todayStr)} as Cancelled.`}
        confirmLabel="Confirm cancellation"
        tone="danger"
        onCancel={() => setConfirmCancelOpen(false)}
        onConfirm={() => {
          cancelAppointment(appointment.id);
          setConfirmCancelOpen(false);
        }}
      />

      {/* Worker Complete Job Confirmation */}
      <ConfirmDialog
        open={confirmCompleteOpen}
        title={`Mark ${appointment.id} as Completed?`}
        description={`Confirm that service for ${appointment.customerName} (${appointment.serviceType}) is finished. Your completion notes below will be visible on the manager dashboard immediately.`}
        confirmLabel="Confirm completed"
        tone="primary"
        onCancel={() => setConfirmCompleteOpen(false)}
        onConfirm={() => {
          completeWorkerJob(appointment.id, completionNotesDraft);
          setConfirmCompleteOpen(false);
          onClose();
        }}
      >
        <Field
          label="Job completion notes"
          htmlFor="confirm-completion-notes"
        >
          <Textarea
            id="confirm-completion-notes"
            rows={3}
            value={completionNotesDraft}
            onChange={(e) => setCompletionNotesDraft(e.target.value)}
            placeholder="e.g. Replaced capacitor, verified 18°F delta-T across evaporator coil."
          />
        </Field>
      </ConfirmDialog>
    </>
  );
};
