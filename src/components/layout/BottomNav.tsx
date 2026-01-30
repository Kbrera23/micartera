import { LayoutDashboard, Receipt, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'gastos', label: 'Gastos', icon: Receipt },
  { id: 'objetivos', label: 'Objetivos', icon: Gift },
  { id: 'perfil', label: 'Perfil', icon: User },
];

export const BottomNav = ({ currentSection, onSectionChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 safe-area-pb">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all duration-200 min-w-[64px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'p-2 rounded-xl transition-all duration-200',
                  isActive ? 'bg-primary/10 scale-110' : ''
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              </div>
              <span className={cn('text-[10px] font-medium', isActive && 'text-primary')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
