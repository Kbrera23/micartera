import { LayoutDashboard, Receipt, Gift, User, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'gastos', label: 'Gastos', icon: Receipt },
  { id: 'objetivos', label: 'Metas', icon: Gift },
  { id: 'categorias', label: 'Categorías', icon: Tag },
  { id: 'perfil', label: 'Perfil', icon: User },
];

export const BottomNav = ({ currentSection, onSectionChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb"
      style={{
        background: 'hsl(var(--card) / 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid hsl(var(--border) / 0.4)',
      }}
    >
      <div className="flex justify-around items-center h-16 px-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-2xl transition-all duration-200 min-w-[56px]',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-xl transition-all duration-300',
                  isActive && 'bg-primary/10'
                )}
                style={isActive ? { boxShadow: '0 2px 12px hsl(158 64% 48% / 0.15)' } : {}}
              >
                <Icon className={cn('h-5 w-5 transition-all', isActive && 'scale-110')} />
              </div>
              <span className={cn(
                'text-[10px] font-semibold tracking-tight transition-all',
                isActive ? 'text-primary' : 'text-muted-foreground/70'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
