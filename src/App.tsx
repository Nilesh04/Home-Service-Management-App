import React from 'react';
import { MotionConfig } from 'motion/react';
import { UserRole } from './types';
import {
  AppDataProvider,
  isManagerOnlyRoute,
  useAppData,
} from './context/AppDataContext';
import { ErrorBoundary } from './components/ui';
import { AppShell } from './components/AppShell';
import { LoginScreen } from './screens/LoginScreen';
import { ManagerDashboard } from './screens/ManagerDashboard';
import { AppointmentsScreen } from './screens/AppointmentsScreen';
import { StaffScreen } from './screens/StaffScreen';
import { PayrollScreen } from './screens/PayrollScreen';
import { WorkerDashboard } from './screens/WorkerDashboard';
import { AccessDeniedScreen } from './screens/AccessDeniedScreen';

const RouterView: React.FC = () => {
  const { currentUser, route, navigate } = useAppData();

  if (!currentUser) {
    return <LoginScreen />;
  }

  // Enforce role-based route protection before rendering any manager-only screen
  if (currentUser.role === UserRole.Worker && isManagerOnlyRoute(route)) {
    return (
      <AppShell>
        <AccessDeniedScreen attemptedRoute={route} />
      </AppShell>
    );
  }

  // If a Manager navigates to a worker-specific route, route them to Manager Dashboard
  if (
    currentUser.role === UserRole.Manager &&
    (route === 'worker-dashboard' || route === 'worker-appointments')
  ) {
    return (
      <AppShell>
        <div className="space-y-4">
          <ManagerDashboard />
        </div>
      </AppShell>
    );
  }

  let content: React.ReactNode;
  switch (route) {
    case 'manager-dashboard':
      content = <ManagerDashboard />;
      break;
    case 'manager-appointments':
      content = <AppointmentsScreen />;
      break;
    case 'manager-staff':
      content = <StaffScreen />;
      break;
    case 'manager-payroll':
      content = <PayrollScreen />;
      break;
    case 'worker-dashboard':
      content = <WorkerDashboard mode="dashboard" />;
      break;
    case 'worker-appointments':
      content = <WorkerDashboard mode="appointments" />;
      break;
    default:
      navigate(
        currentUser.role === UserRole.Manager
          ? 'manager-dashboard'
          : 'worker-dashboard'
      );
      content = null;
  }

  return <AppShell>{content}</AppShell>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AppDataProvider>
          <RouterView />
        </AppDataProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
