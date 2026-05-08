import { useEffect, useState } from 'react';
import { LayoutDashboard, Receipt, Gift, User as UserIcon, Wallet, Tag, ChevronsUpDown, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'gastos', label: 'Gastos', icon: Receipt },
  { id: 'objetivos', label: 'Objetivos', icon: Gift },
  { id: 'categorias', label: 'Categorías', icon: Tag },
  { id: 'perfil', label: 'Perfil', icon: UserIcon },
];

export const Sidebar = ({ currentSection, onSectionChange }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        className={cn(
          'min-h-screen flex flex-col transition-all duration-300 ease-out overflow-hidden',
          isCollapsed ? 'w-[76px]' : 'w-[260px]'
        )}
        style={{
          background: 'hsl(200 45% 8% / 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid hsl(186 60% 60% / 0.08)',
          boxShadow: '1px 0 32px -12px hsl(200 45% 4% / 0.6)',
        }}
      >
        {/* Logo Header - clickable to open Perfil */}
        <div className={cn('p-4 pb-6', !isCollapsed && 'p-6 pb-8')}>
          {(() => {
            const logoButton = (
              <button
                onClick={() => onSectionChange('perfil')}
                aria-label="Abrir Perfil y configuración"
                className={cn(
                  'w-full flex items-center gap-3 rounded-2xl transition-all duration-200 group',
                  'hover:bg-white/5 active:scale-[0.98]',
                  isCollapsed ? 'justify-center p-1' : 'p-1.5 -m-1.5',
                  currentSection === 'perfil' && 'bg-white/5'
                )}
              >
                <div
                  className="p-2.5 rounded-2xl bg-primary text-primary-foreground shrink-0 transition-transform group-hover:scale-105"
                  style={{ boxShadow: '0 6px 20px -6px hsl(var(--primary) / 0.45)' }}
                >
                  <Wallet className="h-5 w-5" />
                </div>
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300 text-left',
                    isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                  )}
                >
                  <h1 className="text-base font-bold tracking-tight whitespace-nowrap text-foreground">MiCartera</h1>
                  <p className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">Gestión Financiera</p>
                </div>
              </button>
            );

            return isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{logoButton}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  Perfil y configuración
                </TooltipContent>
              </Tooltip>
            ) : (
              logoButton
            );
          })()}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2">
          <p
            className={cn(
              'text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-3 transition-all duration-300 overflow-hidden whitespace-nowrap',
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
                      ? 'glass-card text-foreground'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  )}
                  style={
                    isActive
                      ? {
                          color: 'hsl(186 100% 70%)',
                          borderColor: 'hsl(186 100% 50% / 0.25)',
                          boxShadow: '0 6px 20px -8px hsl(186 100% 50% / 0.35), inset 0 0 0 1px hsl(186 100% 50% / 0.15)',
                        }
                      : {}
                  }
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
              'px-3 py-3 rounded-xl bg-secondary text-center transition-all duration-300 overflow-hidden',
              isCollapsed ? 'px-1' : ''
            )}
          >
            <p className="text-[10px] text-muted-foreground font-medium tracking-wide whitespace-nowrap">
              {isCollapsed ? 'v3' : 'v3.0 · Premium'}
            </p>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};
