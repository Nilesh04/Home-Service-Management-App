import React, { useState, type ReactNode } from 'react';
import {
  CalendarCheck,
  ClipboardList,
  DollarSign,
  Info,
  LayoutDashboard,
  LogOut,
  RotateCcw,
  Users,
  Wrench,
} from 'lucide-react';
import { UserRole, type RouteId } from '../types';
import { useAppData } from '../context/AppDataContext';
import { getInitials } from '../utils/format';
import { Button, ConfirmDialog, Modal, StatusBanner } from './ui';

interface NavItem {
  id: RouteId;
  label: string;
  mobileLabel: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const MANAGER_NAV: NavItem[] = [
  {
    id: 'manager-dashboard',
    label: 'Dashboard',
    mobileLabel: 'Dashboard',
    Icon: LayoutDashboard,
  },
  {
    id: 'manager-appointments',
    label: 'Appointments',
    mobileLabel: 'Jobs',
    Icon: CalendarCheck,
  },
  {
    id: 'manager-staff',
    label: 'Staff',
    mobileLabel: 'Staff',
    Icon: Users,
  },
  {
    id: 'manager-payroll',
    label: 'Payroll & Overtime',
    mobileLabel: 'Payroll',
    Icon: DollarSign,
  },
];

const WORKER_NAV: NavItem[] = [
  {
    id: 'worker-dashboard',
    label: 'My Dashboard',
    mobileLabel: 'Dashboard',
    Icon: LayoutDashboard,
  },
  {
    id: 'worker-appointments',
    label: 'My Appointments',
    mobileLabel: 'My Jobs',
    Icon: ClipboardList,
  },
];

export const AppShell: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    currentUser,
    route,
    navigate,
    logout,
    resetDemoData,
    feedback,
    setFeedback,
  } = useAppData();

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);

  if (!currentUser) return null;

  const navItems =
    currentUser.role === UserRole.Manager ? MANAGER_NAV : WORKER_NAV;

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground md:flex-row">
      {/* Desktop Sidebar Navigation (no duplicate top nav on desktop) */}
      <aside
        aria-label="Primary navigation"
        className="hidden md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0 md:flex-col md:border-r md:border-border md:bg-surface"
      >
        <div className="flex items-center gap-2.5 border-b border-border/70 px-5 py-4">
          <Wrench className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="whitespace-nowrap text-base font-semibold tracking-tight text-foreground">
            Copperline Ops
          </span>
        </div>

        {/* Active User & Role Identity */}
        <div className="border-b border-border/70 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-border text-xs font-semibold text-foreground"
            >
              {getInitials(currentUser.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground" title={currentUser.name}>
                {currentUser.name}
              </p>
              <p className="text-xs text-muted">
                Role: <span className="font-medium text-primary">{currentUser.role}</span>
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const active = route === item.id;
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 w-full items-center gap-3 whitespace-nowrap rounded-control px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-background'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="divide-y divide-border/70 border-t border-border/70 px-3 py-3">
          <div className="space-y-1 pb-2">
            <button
              type="button"
              onClick={() => setNotesModalOpen(true)}
              className="flex min-h-10 w-full items-center gap-2.5 whitespace-nowrap rounded-control px-3 py-2 text-xs font-medium text-muted hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Architecture &amp; role guard</span>
            </button>
            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              className="flex min-h-10 w-full items-center gap-2.5 whitespace-nowrap rounded-control px-3 py-2 text-xs font-medium text-muted hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            >
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Reset records</span>
            </button>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={logout}
              className="flex min-h-11 w-full items-center gap-2.5 whitespace-nowrap rounded-control px-3 py-2 text-sm font-medium text-danger hover:bg-danger/5 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sticky Top Header (< md only) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-surface px-4 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <Wrench className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="whitespace-nowrap text-sm font-semibold text-foreground">
            Copperline Ops
          </span>
          <span className="text-muted" aria-hidden="true">·</span>
          <span className="truncate text-xs font-medium text-primary">
            {currentUser.name} ({currentUser.role})
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setNotesModalOpen(true)}
            aria-label="Architecture and role notes"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-muted hover:bg-background hover:text-foreground"
          >
            <Info className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-control px-2.5 text-xs font-medium text-danger hover:bg-danger/5"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 px-4 py-5 pb-24 sm:px-6 md:px-8 md:py-7 md:pb-10">
        {feedback ? (
          <div className="mb-5">
            <StatusBanner
              message={feedback.message}
              tone={feedback.tone}
              onDismiss={() => setFeedback(null)}
            />
          </div>
        ) : null}
        {children}
      </main>

      {/* Mobile Bottom Tab Bar (< md only) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
      >
        <div className="flex items-stretch justify-around gap-1">
          {navItems.map((item) => {
            const active = route === item.id;
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-control px-2 py-1 text-xs font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-primary ${
                  active ? 'text-primary' : 'text-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.mobileLabel}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-control px-2 py-1 text-xs font-medium whitespace-nowrap text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </nav>

      {/* Reset Data Confirmation */}
      <ConfirmDialog
        open={resetConfirmOpen}
        title="Reset all records to initial state?"
        description="Any newly created appointments, status updates, staff edits, or overtime approvals stored in this browser will be replaced with the original dataset."
        confirmLabel="Reset records"
        tone="danger"
        onCancel={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          resetDemoData();
          setResetConfirmOpen(false);
        }}
      />

      {/* Project Notes & Role Guard Tester Modal */}
      <Modal
        open={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        title="Security & authorization notes"
        subtitle="Role-based access design and production transition notes"
        maxWidthClass="max-w-lg"
        footer={
          <Button tone="primary" onClick={() => setNotesModalOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="divide-y divide-border/70 text-sm">
          <div className="space-y-2 pb-4">
            <h3 className="font-semibold text-foreground">
              Active session identity
            </h3>
            <p className="text-muted">
              Signed in as <strong className="font-medium text-foreground">{currentUser.name}</strong> ({currentUser.email}) with role{' '}
              <strong className="font-medium text-primary">{currentUser.role}</strong>.
            </p>
          </div>

          <div className="space-y-2 py-4">
            <h3 className="font-semibold text-foreground">
              Production security note
            </h3>
            <p className="leading-relaxed text-muted">
              This interactive prototype simulates authentication and persists state in browser{' '}
              <span className="font-mono text-xs text-foreground">localStorage</span> so workflows can be evaluated client-side. In a production system, hiding UI controls or client routes is never sufficient on its own: every API endpoint, server action, and database table must enforce server-side session verification and row-level authorization policies so workers can only query or mutate appointments assigned to their own employee ID, and staff/payroll records remain strictly isolated to authorized managers.
            </p>
          </div>

          {currentUser.role === UserRole.Worker ? (
            <div className="space-y-2.5 pt-4">
              <h3 className="font-semibold text-foreground">
                Verify restricted route protection
              </h3>
              <p className="text-muted">
                Test navigating directly to manager-only screens while signed in as a Worker to verify the route guard and redirect behavior:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  tone="quiet"
                  size="sm"
                  onClick={() => {
                    setNotesModalOpen(false);
                    navigate('manager-staff');
                  }}
                >
                  Attempt Staff screen
                </Button>
                <Button
                  tone="quiet"
                  size="sm"
                  onClick={() => {
                    setNotesModalOpen(false);
                    navigate('manager-payroll');
                  }}
                >
                  Attempt Payroll screen
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};

export const WorkspaceHeader: React.FC<{
  title: string;
  subtitle: string;
  actions?: ReactNode;
}> = ({ title, subtitle, actions }) => {
  const { currentUser } = useAppData();

  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[length:var(--text-display)] leading-[var(--text-display--line-height)] font-[var(--text-display--font-weight)] tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {currentUser ? (
          <span className="hidden items-center gap-1.5 text-xs text-muted lg:inline-flex">
            <span>Active user:</span>
            <strong className="font-medium text-foreground">
              {currentUser.name}
            </strong>
            <span aria-hidden="true">·</span>
            <strong className="font-medium text-primary">
              {currentUser.role}
            </strong>
          </span>
        ) : null}
        {actions}
      </div>
    </header>
  );
};
