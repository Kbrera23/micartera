import { useState } from 'react';
import { LayoutDashboard, Receipt, Gift, User, Wallet, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'gastos', label: 'Gastos', icon: Receipt },
  { id: 'objetivos', label: 'Objetivos', icon: Gift },
  { id: 'categorias', label: 'Categorías', icon: Tag },
  { id: 'perfil', label: 'Perfil', icon: User },
];

export const Sidebar = ({ currentSection, onSectionChange }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        className={cn(
          'min-h-screen bg-card/50 backdrop-blur-xl border-r border-border/50 flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        {/* Logo Header */}
        <div className={cn('p-4 pb-6', !isCollapsed && 'p-6 pb-8')}>
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl bg-primary text-primary-foreground shadow-lg shrink-0"
              style={{ boxShadow: '0 4px 20px hsl(158 64% 48% / 0.25)' }}
            >
              <Wallet className="h-5 w-5" />
            </div>
            <div
              className={cn(
                'overflow-hidden transition-all duration-300',
                isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
              )}
            >
              <h1 className="text-base font-bold tracking-tight whitespace-nowrap">MiCartera</h1>
              <p className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">Gestión Financiera</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2">
          <p
            className={cn(
              'text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 mb-3 transition-all duration-300 overflow-hidden whitespace-nowrap',
              isCollapsed ? 'opacity-0 h-0 mb-0' : 'opacity-100 h-auto'
            )}
          >
            Menú
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;

              const button = (
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl transition-all duration-200',
                    isCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                  style={isActive ? { boxShadow: '0 4px 16px hsl(158 64% 48% / 0.2)' } : {}}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span
                    className={cn(
                      'text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden',
                      isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );

              return (
                <li key={item.id}>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    button
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3">
          <div
            className={cn(
              'px-3 py-3 rounded-xl bg-muted/30 text-center transition-all duration-300 overflow-hidden',
              isCollapsed ? 'px-1' : ''
            )}
          >
            <p className="text-[10px] text-muted-foreground/50 font-medium tracking-wide whitespace-nowrap">
              {isCollapsed ? 'v3' : 'v3.0 · Premium'}
            </p>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};
