import React, { useEffect, useState } from 'react';
import {
  APPOINTMENT_STATUSES,
  ESTIMATED_DURATIONS,
  SERVICE_TYPES,
  type Appointment,
  type AppointmentStatus,
  type ServiceType,
} from '../types';
import { useAppData } from '../context/AppDataContext';
import { Button, Field, Input, Modal, Select, Textarea } from './ui';

interface AppointmentFormModalProps {
  open: boolean;
  editingAppointment: Appointment | null;
  onClose: () => void;
}

interface FormErrors {
  customerName?: string;
  customerPhone?: string;
  serviceAddress?: string;
  date?: string;
  time?: string;
  assignedWorkerId?: string;
  estimatedDuration?: string;
  general?: string;
}

export const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({
  open,
  editingAppointment,
  onClose,
}) => {
  const { employees, todayStr, saveAppointment } = useAppData();

  const activeWorkers = employees.filter((e) => e.employmentStatus === 'Active');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Plumbing');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('09:00');
  const [assignedWorkerId, setAssignedWorkerId] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('2 hours');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('Scheduled');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editingAppointment) {
      setCustomerName(editingAppointment.customerName);
      setCustomerPhone(editingAppointment.customerPhone);
      setServiceAddress(editingAppointment.serviceAddress);
      setServiceType(editingAppointment.serviceType);
      setDate(editingAppointment.date);
      setTime(editingAppointment.time);
      setAssignedWorkerId(editingAppointment.assignedWorkerId);
      setEstimatedDuration(editingAppointment.estimatedDuration);
      setNotes(editingAppointment.notes);
      setStatus(editingAppointment.status);
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setServiceAddress('');
      setServiceType('Plumbing');
      setDate(todayStr);
      setTime('10:00');
      setAssignedWorkerId(activeWorkers[0]?.id ?? '');
      setEstimatedDuration('2 hours');
      setNotes('');
      setStatus('Scheduled');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingAppointment, todayStr]);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!customerName.trim()) {
      nextErrors.customerName = 'Customer name is required.';
    }
    const digitCount = customerPhone.replace(/\D/g, '').length;
    if (!customerPhone.trim()) {
      nextErrors.customerPhone = 'Customer phone number is required.';
    } else if (digitCount < 7) {
      nextErrors.customerPhone = 'Enter a valid phone number (at least 7 digits).';
    }
    if (!serviceAddress.trim()) {
      nextErrors.serviceAddress = 'Service address is required.';
    }
    if (!date) {
      nextErrors.date = 'Appointment date is required.';
    }
    if (!time) {
      nextErrors.time = 'Appointment time is required.';
    }
    if (!assignedWorkerId) {
      nextErrors.assignedWorkerId = 'Select an active employee to assign.';
    }
    if (!estimatedDuration.trim()) {
      nextErrors.estimatedDuration = 'Estimated duration is required.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const result = saveAppointment({
      id: editingAppointment?.id,
      customerName,
      customerPhone,
      serviceAddress,
      serviceType,
      date,
      time,
      assignedWorkerId,
      estimatedDuration,
      notes,
      status,
    });

    if (!result.ok) {
      setErrors({ general: result.error ?? 'Unable to save appointment.' });
      return;
    }

    onClose();
  };

  const inactiveCount = employees.filter(
    (e) => e.employmentStatus === 'Inactive'
  ).length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingAppointment ? `Edit appointment ${editingAppointment.id}` : 'Create appointment'}
      subtitle={
        editingAppointment
          ? 'Update customer schedule, technician assignment, or service notes.'
          : 'Schedule a customer service call and assign an active technician.'
      }
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <Button tone="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button
            tone="primary"
            type="submit"
            form="appointment-form"
            disabled={activeWorkers.length === 0 && !editingAppointment}
          >
            {editingAppointment ? 'Save changes' : 'Create appointment'}
          </Button>
        </>
      }
    >
      <form id="appointment-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.general ? (
          <p role="alert" className="text-sm font-medium text-danger">
            {errors.general}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Customer name"
            htmlFor="apt-customer-name"
            required
            error={errors.customerName}
          >
            <Input
              id="apt-customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Clara Jenkins"
              hasError={Boolean(errors.customerName)}
              autoFocus
            />
          </Field>

          <Field
            label="Customer phone number"
            htmlFor="apt-customer-phone"
            required
            error={errors.customerPhone}
          >
            <Input
              id="apt-customer-phone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="(555) 014-8920"
              hasError={Boolean(errors.customerPhone)}
            />
          </Field>
        </div>

        <Field
          label="Service address"
          htmlFor="apt-address"
          required
          error={errors.serviceAddress}
        >
          <Input
            id="apt-address"
            value={serviceAddress}
            onChange={(e) => setServiceAddress(e.target.value)}
            placeholder="e.g. 742 Maple Crest Ave, Oakridge"
            hasError={Boolean(errors.serviceAddress)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Service type" htmlFor="apt-service-type" required>
            <Select
              id="apt-service-type"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
            >
              {SERVICE_TYPES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Appointment date"
            htmlFor="apt-date"
            required
            error={errors.date}
          >
            <Input
              id="apt-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              hasError={Boolean(errors.date)}
            />
          </Field>

          <Field
            label="Appointment time"
            htmlFor="apt-time"
            required
            error={errors.time}
          >
            <Input
              id="apt-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              hasError={Boolean(errors.time)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            label="Assigned worker"
            htmlFor="apt-worker"
            required
            error={errors.assignedWorkerId}
            hint={
              inactiveCount > 0
                ? `${inactiveCount} deactivated employee${inactiveCount > 1 ? 's' : ''} excluded from new dispatch.`
                : 'Active technicians available for dispatch.'
            }
            className="sm:col-span-2"
          >
            <Select
              id="apt-worker"
              value={assignedWorkerId}
              onChange={(e) => setAssignedWorkerId(e.target.value)}
              hasError={Boolean(errors.assignedWorkerId)}
            >
              {activeWorkers.length === 0 && !editingAppointment ? (
                <option value="">No active employees available</option>
              ) : null}
              {employees.map((emp) => {
                const isCurrentOnEdit =
                  editingAppointment?.assignedWorkerId === emp.id;
                const isInactive = emp.employmentStatus === 'Inactive';
                if (isInactive && !isCurrentOnEdit) {
                  return (
                    <option key={emp.id} value={emp.id} disabled>
                      {emp.fullName} — Inactive (unavailable)
                    </option>
                  );
                }
                return (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} · {emp.jobTitle}
                    {isInactive ? ' (Currently Inactive)' : ''}
                  </option>
                );
              })}
            </Select>
          </Field>

          <Field
            label="Estimated duration"
            htmlFor="apt-duration"
            required
            error={errors.estimatedDuration}
          >
            <Select
              id="apt-duration"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              hasError={Boolean(errors.estimatedDuration)}
            >
              {ESTIMATED_DURATIONS.map((dur) => (
                <option key={dur} value={dur}>
                  {dur}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Status" htmlFor="apt-status" required>
            <Select
              id="apt-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
            >
              {APPOINTMENT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Notes"
          htmlFor="apt-notes"
          hint="Include access codes, symptom details, or required parts."
        >
          <Textarea
            id="apt-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Side gate code 4821; customer noted breaker trips after 10 minutes."
          />
        </Field>
      </form>
    </Modal>
  );
};
