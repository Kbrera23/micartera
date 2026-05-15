import { useEffect, useState } from 'react';
import { LayoutDashboard, Receipt, Gift, Tag, ChevronsUpDown, LogOut, Settings, User as UserIcon } from 'lucide-react';
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
];

export const Sidebar = ({ currentSection, onSectionChange }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { user, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('Usuario');

  // ✅ Cargar y escuchar cambios en el perfil
  useEffect(() => {
    if (!user) return;

    // Función para cargar datos del perfil
    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, full_name')
          .eq('id', user.id)  // ✅ CORREGIDO: usar 'id' no 'user_id'
          .maybeSingle();

        if (error) {
          console.error('Error cargando perfil:', error);
          return;
        }

        if (data) {
          // Actualizar avatar
          if (data.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
          
          // Actualizar nombre (prioridad: BD > metadata > email)
          const profileName = data.full_name || 
                            user.user_metadata?.full_name || 
                            user.user_metadata?.name || 
                            user.email?.split('@')[0] || 
                            'Usuario';
          setDisplayName(profileName);
        } else {
          // Si no hay perfil en BD, usar metadata
          const metaName = user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.email?.split('@')[0] || 
                          'Usuario';
          setDisplayName(metaName);
        }
      } catch (error) {
        console.error('Error en loadProfile:', error);
      }
    };

    // Cargar inmediatamente
    loadProfile();

    // ✅ Escuchar cambios en tiempo real
    const channel = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,  // ✅ CORREGIDO: usar 'id' no 'user_id'
        },
        (payload) => {
          console.log('✅ Perfil actualizado:', payload);
          loadProfile();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Calcular iniciales del nombre actualizado
  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

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
        {/* User Header */}
        <div className={cn('p-3', !isCollapsed && 'p-4')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Abrir menú de usuario"
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl transition-all duration-200 group',
                  'hover:bg-white/5 active:scale-[0.98] outline-none',
                  isCollapsed ? 'justify-center p-1.5' : 'p-2'
                )}
              >
                <Avatar className="h-9 w-9 shrink-0 rounded-xl">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : null}
                  <AvatarFallback
                    className="rounded-xl text-xs font-semibold text-primary-foreground"
                    style={{
                      background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))',
                    }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    'flex-1 min-w-0 text-left overflow-hidden transition-all duration-300',
                    isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                  )}
                >
                  <p className="text-sm font-semibold tracking-tight truncate text-foreground">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium truncate">
                    {user?.email ?? 'Usuario'}
                  </p>
                </div>
                <ChevronsUpDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground shrink-0 transition-all duration-300',
                    isCollapsed ? 'w-0 opacity-0' : 'opacity-100'
                  )}
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="start"
              sideOffset={12}
              className="w-56 glass-card border-white/10"
            >
              <DropdownMenuItem onClick={() => onSectionChange('perfil')} className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSectionChange('configuracion')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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