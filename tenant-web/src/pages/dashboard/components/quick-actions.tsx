import { Link } from 'react-router-dom';
import {
  ScrollText,
  Wallet,
  Send,
  FileText,
} from 'lucide-react';
import { tenantMessages } from '@/i18n';

function QuickActions() {
  const actions = [
    { href: '/utilities', icon: ScrollText, label: tenantMessages.dashboard.quickActions.waterElectricity },
    { href: '/bills?filter=unpaid', icon: Wallet, label: tenantMessages.dashboard.quickActions.collection },
    { href: '/bills/generate', icon: Send, label: tenantMessages.dashboard.quickActions.billing },
    { href: '/leases/new', icon: FileText, label: tenantMessages.dashboard.quickActions.signing },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            to={action.href}
            className="group flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-2 py-2 sm:px-3 transition-all hover:bg-accent/50"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-8 sm:w-8">
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span className="text-xs sm:text-sm font-medium truncate">{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export { QuickActions };
