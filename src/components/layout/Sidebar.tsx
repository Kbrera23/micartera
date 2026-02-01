import { LayoutDashboard, Receipt, Gift, User, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'gastos', label: 'Gastos', icon: Receipt },
  { id: 'objetivos', label: 'Objetivos', icon: Gift },
  { id: 'perfil', label: 'Perfil', icon: User },
];

const BANK_COLORS = {
  santander: '#EC0000',
  lacaixa: '#00ABD1',
  ing: '#FF6200',
  revolut: '#191C1F',
  bbva: '#004481',
};

export const Sidebar = ({ currentSection, onSectionChange }: SidebarProps) => {
  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      {/* Logo Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl gradient-income">
            <Wallet className="h-6 w-6 text-income-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold">FinanceTracker</h1>
            <p className="text-xs text-muted-foreground">Gestión Financiera</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          v2.0 • Multi-Módulo
        </p>
      </div>
    </aside>
  );
};
