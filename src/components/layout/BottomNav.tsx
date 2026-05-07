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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb"
      style={{
        background: 'hsl(200 45% 8% / 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid hsl(186 60% 60% / 0.08)',
        boxShadow: '0 -8px 32px -8px hsl(200 45% 4% / 0.6), 0 -1px 0 hsl(186 100% 80% / 0.04) inset',
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
                'flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-2xl transition-all duration-200 min-w-[56px] relative',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Indicador activo */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'hsl(186 100% 50%)', boxShadow: '0 0 8px hsl(186 100% 50% / 0.6)' }}
                />
              )}

              <div
                className={cn(
                  'p-1.5 rounded-xl transition-all duration-300',
                )}
                style={isActive ? {
                  background: 'hsl(186 30% 16%)',
                  border: '1px solid hsl(186 100% 50% / 0.20)',
                  boxShadow: '0 0 16px -4px hsl(186 100% 50% / 0.25)',
                } : {}}
              >
                <Icon className={cn(
                  'h-5 w-5 transition-all duration-200',
                  isActive && 'scale-110'
                )} />
              </div>
              <span className={cn(
                'text-[10px] font-semibold tracking-tight transition-all',
                isActive ? 'text-primary' : 'text-muted-foreground'
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