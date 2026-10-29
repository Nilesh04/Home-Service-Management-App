import React, { useMemo, useState } from 'react';
import { ArrowRight, ShieldCheck, Wrench } from 'lucide-react';
import { DEMO_ACCOUNTS, DEMO_WORKER_EMPLOYEE_ID } from '../data/seedData';
import { useAppData } from '../context/AppDataContext';
import { computeManagerMetrics, formatDisplayDate } from '../utils/format';
import { Button, Field, Input, Surface } from '../components/ui';

export const LoginScreen: React.FC = () => {
  const {
    appointments,
    employees,
    todayStr,
    loginWithCredentials,
    loginAsDemo,
  } = useAppData();

  const [selectedRoleTab, setSelectedRoleTab] = useState<'manager' | 'worker'>(
    'manager'
  );
  const [email, setEmail] = useState(DEMO_ACCOUNTS.manager.email);
  const [password, setPassword] = useState(DEMO_ACCOUNTS.manager.password);
  const [error, setError] = useState<string | null>(null);

  const metrics = useMemo(
    () => computeManagerMetrics(appointments, employees, todayStr),
    [appointments, employees, todayStr]
  );

  const demoWorkerAssignedCount = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.assignedWorkerId === DEMO_WORKER_EMPLOYEE_ID &&
          a.status !== 'Cancelled'
      ).length,
    [appointments]
  );

  const handleSelectRolePreset = (roleKey: 'manager' | 'worker') => {
    setSelectedRoleTab(roleKey);
    setEmail(DEMO_ACCOUNTS[roleKey].email);
    setPassword(DEMO_ACCOUNTS[roleKey].password);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = loginWithCredentials(email, password);
    if (!result.ok) {
      setError(result.error ?? 'Sign-in failed.');
    }
  };

  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <div className="mx-auto grid min-h-dvh max-w-[90rem] grid-cols-1 lg:grid-cols-12">
        {/* Left Operational Context Column */}
        <section className="flex flex-col justify-between border-b border-border/70 px-6 py-8 sm:px-10 lg:col-span-7 lg:border-r lg:border-b-0 lg:py-12">
          <div>
            <div className="flex items-center gap-2.5">
              <Wrench className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-base font-semibold tracking-tight text-foreground">
                Copperline Service Ops
              </span>
            </div>

            <h1 className="mt-8 max-w-[20ch] text-[length:var(--text-display)] leading-[var(--text-display--line-height)] font-[var(--text-display--font-weight)] tracking-tight text-foreground [text-wrap:balance]">
              Dispatch, technician jobs, and staff operations in one workspace
            </h1>
            <p className="mt-3 max-w-[54ch] text-base leading-relaxed text-muted">
              Coordinate residential plumbing, electrical, AC repair, cleaning, and maintenance appointments between office dispatch and field technicians.
            </p>

            {/* Shared Live State Readout */}
            <Surface className="mt-8 divide-y divide-border/70 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="p-4 sm:p-5">
                <p className="text-xs font-medium text-muted">
                  Appointments today
                </p>
                <p className="mt-1.5 text-2xl font-semibold text-foreground tabular-nums">
                  {metrics.totalToday}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatDisplayDate(todayStr, todayStr).replace('Today, ', '')}
                </p>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-xs font-medium text-muted">
                  Active field staff
                </p>
                <p className="mt-1.5 text-2xl font-semibold text-foreground tabular-nums">
                  {metrics.activeEmployees}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Eligible for new dispatch
                </p>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-xs font-medium text-muted">
                  Assigned to Marcus Vance
                </p>
                <p className="mt-1.5 text-2xl font-semibold text-foreground tabular-nums">
                  {demoWorkerAssignedCount}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Active jobs on Worker view
                </p>
              </div>
            </Surface>
          </div>

          <div className="mt-10 border-t border-border/70 pt-5 text-xs leading-relaxed text-muted">
            <div className="flex items-start gap-2">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <p>
                <strong className="font-medium text-foreground">
                  Architecture &amp; role enforcement note:
                </strong>{' '}
                Both Manager and Worker roles share live appointment state persisted in browser storage. Restricted screens and actions validate the active role in code, while production deployment enforces authentication, API authorization, and row-level database policies on the server.
              </p>
            </div>
          </div>
        </section>

        {/* Right Sign-In & Role Selector Column */}
        <section className="flex flex-col justify-center px-6 py-8 sm:px-10 lg:col-span-5 lg:py-12">
          <div className="mx-auto w-full max-w-md">
            <Surface className="divide-y divide-border/70">
              {/* Instant Role Shortcut Section */}
              <div className="p-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Quick role launch
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Open either role directly to evaluate both experiences, or sign in with credentials below.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Button
                    tone="primary"
                    onClick={() => loginAsDemo('manager')}
                    className="w-full justify-between"
                  >
                    <span>Manager Demo</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </Button>
                  <Button
                    tone="quiet"
                    onClick={() => loginAsDemo('worker')}
                    className="w-full justify-between"
                  >
                    <span>Worker Demo</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              {/* Credential Sign-In Form */}
              <div className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    Sign in with credentials
                  </h3>
                  <div
                    role="group"
                    aria-label="Fill credentials by role"
                    className="inline-flex rounded-control border border-border p-0.5"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectRolePreset('manager')}
                      aria-pressed={selectedRoleTab === 'manager'}
                      className={`min-h-8 whitespace-nowrap rounded-control px-2.5 text-xs font-medium transition-colors ${
                        selectedRoleTab === 'manager'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      Fill Manager
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectRolePreset('worker')}
                      aria-pressed={selectedRoleTab === 'worker'}
                      className={`min-h-8 whitespace-nowrap rounded-control px-2.5 text-xs font-medium transition-colors ${
                        selectedRoleTab === 'worker'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      Fill Worker
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
                  {error ? (
                    <p role="alert" className="text-sm font-medium text-danger">
                      {error}
                    </p>
                  ) : null}

                  <Field label="Email address" htmlFor="login-email" required>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      hasError={Boolean(error)}
                    />
                  </Field>

                  <Field label="Password" htmlFor="login-password" required>
                    <Input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      hasError={Boolean(error)}
                    />
                  </Field>

                  <Button tone="primary" type="submit" className="w-full">
                    Sign in
                  </Button>
                </form>

                {/* Reference Credentials Directory */}
                <dl className="mt-5 divide-y divide-border/70 border-t border-border/70 pt-4 text-xs">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2.5">
                    <dt className="font-medium text-foreground">
                      Manager (Claire Bennett)
                    </dt>
                    <dd className="font-mono text-muted">
                      manager@homeservice.demo · Demo123!
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 pt-2.5">
                    <dt className="font-medium text-foreground">
                      Worker (Marcus Vance)
                    </dt>
                    <dd className="font-mono text-muted">
                      worker@homeservice.demo · Demo123!
                    </dd>
                  </div>
                </dl>
              </div>
            </Surface>
          </div>
        </section>
      </div>
    </div>
  );
};
