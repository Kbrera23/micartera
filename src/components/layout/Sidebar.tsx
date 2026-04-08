import { LayoutDashboard, Receipt, Gift, User, Wallet, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  return (
    <aside className="w-[260px] min-h-screen bg-card/50 backdrop-blur-xl border-r border-border/50 flex flex-col">
      {/* Logo Header */}
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground shadow-lg"
            style={{ boxShadow: '0 4px 20px hsl(158 64% 48% / 0.25)' }}>
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">MiCartera</h1>
            <p className="text-[11px] text-muted-foreground font-medium">Gestión Financiera</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 mb-3">
          Menú
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                  style={isActive ? { boxShadow: '0 4px 16px hsl(158 64% 48% / 0.2)' } : {}}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4">
        <div className="px-3 py-3 rounded-xl bg-muted/30 text-center">
          <p className="text-[10px] text-muted-foreground/50 font-medium tracking-wide">
            v3.0 · Premium
          </p>
        </div>
      </div>
    </aside>
  );
};
