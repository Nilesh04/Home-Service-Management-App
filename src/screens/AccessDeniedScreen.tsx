import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { Button, Surface } from '../components/ui';

const RESTRICTED_LABELS: Record<string, string> = {
  'manager-dashboard': 'Manager Operations Dashboard',
  'manager-appointments': 'All-Company Appointment Management',
  'manager-staff': 'Staff & Pay Directory',
  'manager-payroll': 'Payroll & Overtime Records',
};

export const AccessDeniedScreen: React.FC<{ attemptedRoute: string }> = ({
  attemptedRoute,
}) => {
  const { currentUser, navigate } = useAppData();
  const [secondsRemaining, setSecondsRemaining] = useState(5);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          navigate('worker-dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [navigate]);

  const targetName = RESTRICTED_LABELS[attemptedRoute] ?? 'Manager View';

  return (
    <div className="mx-auto flex max-w-lg flex-col justify-center py-12">
      <Surface className="p-6 sm:p-8">
        <div role="alert" className="space-y-4">
          <div className="flex items-center gap-2.5 text-danger">
            <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
            <h1 className="text-lg font-semibold text-foreground">
              Access denied
            </h1>
          </div>

          <p className="text-sm leading-relaxed text-muted">
            Your active account (<strong className="font-medium text-foreground">{currentUser?.name}</strong> ·{' '}
            <strong className="font-medium text-foreground">{currentUser?.role}</strong>) does not have permission to open{' '}
            <strong className="font-medium text-foreground">{targetName}</strong>. Staff directory, pay rates, and company-wide dispatch views are restricted to the Manager role.
          </p>

          <p className="text-xs text-muted tabular-nums">
            Redirecting to My Dashboard in {secondsRemaining} second{secondsRemaining === 1 ? '' : 's'}…
          </p>

          <div className="pt-2">
            <Button
              tone="primary"
              onClick={() => navigate('worker-dashboard')}
            >
              Return to My Dashboard now
            </Button>
          </div>
        </div>
      </Surface>
    </div>
  );
};
