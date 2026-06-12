import { useMemo, useState } from 'react';
import { Plus, Trash2, Tag, TrendingUp, AlertTriangle, FolderOpen, Sparkles, Pencil, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Category, MonthlySaving, BankType } from '@/hooks/useSupabaseFinances';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';

const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const BANK_LABELS: Record<BankType, string> = { santander:'Santander', lacaixa:'La Caixa', ing:'ING', revolut:'Revolut', bbva:'BBVA' };
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface CategoryWithStats {
  category: Category;
  total: number;
  percentage: number;
  remaining: number;
  isOverBudget: boolean;
}

interface CategoriesSectionProps {
  categories: Category[];
  expensesByCategory: CategoryWithStats[];
  onAddCategory: (name: string, color: string, icon: string, budgetLimit: number) => Promise<void>;
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#6366f1', '#6b7280',
  '#14b8a6', '#f97316', '#84cc16', '#06b6d4',
];

const PRESET_ICONS = ['🛒', '🚗', '🎮', '📺', '🏠', '💊', '👕', '📁', '✈️', '🍕', '💪', '📚', '🎵', '💻', '🐾', '🌿'];

const normalizeCategoryName = (name: string) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-ES');

const getUniqueCategories = (items: Category[]) => {
  const seen = new Set<string>();
  return items.filter(category => {
    const key = normalizeCategoryName(category.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

interface CategoryModalProps {
  initial?: Partial<Category>;
  title: string;
  onClose: () => void;
  onSave: (name: string, color: string, icon: string, budgetLimit: number) => Promise<void>;
}

const CategoryModal = ({ initial, title, onClose, onSave }: CategoryModalProps) => {
  const [name, setName] = useState(initial?.name || '');
  const [color, setColor] = useState(initial?.color || '#10b981');
  const [icon, setIcon] = useState(initial?.icon || '📁');
  const [budgetLimit, setBudgetLimit] = useState(initial?.budget_limit?.toString() || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), color, icon, parseFloat(budgetLimit) || 0);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div className="glass-card-elevated rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'hsl(200 35% 16%)' }}>
            <span className="text-2xl grid h-11 w-11 place-items-center rounded-xl border border-border/50" style={{ background: 'hsl(200 40% 13%)' }}>{icon}</span>
            <div>
              <p className="font-semibold text-foreground">{name || 'Nombre categoría'}</p>
              <p className="text-xs text-muted-foreground">
                Presupuesto: {budgetLimit ? formatCurrencyCompact(parseFloat(budgetLimit)) : '—'}/mes
              </p>
            </div>
            <div className="ml-auto w-4 h-4 rounded-full ring-2 ring-border/30" style={{ backgroundColor: color }} />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Nombre</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ej: Restaurantes, Gym..."
              className="w-full px-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              style={{ background: 'hsl(200 35% 16%)', border: '1px solid hsl(200 30% 22%)' }} />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Icono</label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_ICONS.map(i => (
                <button key={i} onClick={() => setIcon(i)}
                  className={cn('text-xl p-2 rounded-lg transition-all border',
                    icon === i ? 'bg-primary/20 ring-2 ring-primary border-primary/30' : 'border-transparent hover:bg-muted/50'
                  )}>{i}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn('w-8 h-8 rounded-full transition-all',
                    color === c ? 'ring-2 ring-offset-2 ring-offset-card ring-white scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Presupuesto mensual (opcional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
              <input type="number" value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                style={{ background: 'hsl(200 35% 16%)', border: '1px solid hsl(200 30% 22%)' }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Deja en 0 para sin límite</p>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-border/50">
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1 rounded-xl">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1 rounded-xl shadow-lg shadow-primary/20">
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const CategoriesSection = ({
  categories,
  expensesByCategory,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoriesSectionProps) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const uniqueCategories = useMemo(() => getUniqueCategories(categories), [categories]);
  const statsMap = new Map(expensesByCategory.map(s => [s.category.id, s]));

  const totalBudget = uniqueCategories.reduce((sum, c) => sum + c.budget_limit, 0);
  const totalSpent = expensesByCategory.reduce((sum, s) => sum + s.total, 0);
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const isOverall = totalSpent > totalBudget;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card-elevated rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Control visual
            </div>
            <h1 className="text-2xl font-bold text-foreground">Categorías</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Organiza y controla tus gastos.</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="rounded-xl gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />Nueva
          </Button>
        </div>
      </div>

      {/* Summary */}
      {totalBudget > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">Resumen mensual</span>
            </div>
            <span className={cn('text-sm font-medium', isOverall ? 'text-destructive' : 'text-muted-foreground')}>
              {formatCurrencyCompact(totalSpent)} / {formatCurrencyCompact(totalBudget)}
            </span>
          </div>

          {/* Barra de progreso custom */}
          <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ background: 'hsl(200 35% 16%)' }}>
            <div
              className={cn('h-full rounded-full transition-all duration-700', isOverall ? 'bg-destructive' : 'bg-gradient-to-r from-primary to-primary/70')}
              style={{ width: `${Math.min(totalPct, 100)}%` }}
            />
          </div>
          <p className={cn('text-xs', isOverall ? 'text-destructive font-medium' : 'text-muted-foreground')}>
            {isOverall
              ? `⚠️ Excedido por ${formatCurrencyCompact(totalSpent - totalBudget)}`
              : `Quedan ${formatCurrencyCompact(totalBudget - totalSpent)} disponibles este mes`}
          </p>
        </div>
      )}

      {/* Category grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(() => {
          const withSpend = uniqueCategories.filter(cat => (statsMap.get(cat.id)?.total ?? 0) > 0);

          if (withSpend.length === 0) {
            return (
              <div className="col-span-full glass-card rounded-2xl py-14 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <FolderOpen className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No hay gastos categorizados</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Asigna categorías a tus gastos para ver el seguimiento aquí.</p>
              </div>
            );
          }

          return withSpend.map(cat => {
            const stats = statsMap.get(cat.id);
            const pct = stats?.percentage ?? 0;
            const spent = stats?.total ?? 0;
            const isOverBudget = stats?.isOverBudget ?? false;
            const isWarning = pct >= 80 && !isOverBudget;

            return (
              <div key={cat.id}
                className="glass-card rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden">

                {/* Glow de color de categoría */}
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: cat.color }} />

                <div className="relative flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-lg"
                      style={{ backgroundColor: cat.color + '25', border: `1px solid ${cat.color}30` }}>
                      {cat.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground leading-tight">{cat.name}</p>
                      {cat.budget_limit > 0 && (
                        <p className="text-xs text-muted-foreground">{formatCurrencyCompact(cat.budget_limit)}/mes</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isOverBudget && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    <button onClick={() => setEditingCategory(cat)}
                      className="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {!cat.is_default && (
                      <button onClick={() => onDeleteCategory(cat.id)}
                        className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-bold text-foreground">{formatCurrencyCompact(spent)}</span>
                  {cat.budget_limit > 0 && (
                    <span className={cn('text-sm font-bold',
                      isOverBudget ? 'text-destructive' : isWarning ? 'text-yellow-400' : 'text-primary'
                    )}>
                      {Math.round(pct)}%
                    </span>
                  )}
                </div>

                {cat.budget_limit > 0 && (
                  <>
                    <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'hsl(200 35% 18%)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: isOverBudget
                            ? 'hsl(0 72% 51%)'
                            : isWarning
                            ? 'hsl(45 93% 47%)'
                            : cat.color,
                        }}
                      />
                    </div>
                    <p className={cn('text-xs', isOverBudget ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                      {isOverBudget
                        ? `⚠️ Excedido: +${formatCurrencyCompact(Math.abs(stats?.remaining ?? 0))}`
                        : `Disponible: ${formatCurrencyCompact(Math.max(stats?.remaining ?? 0, 0))}`}
                    </p>
                  </>
                )}
              </div>
            );
          });
        })()}
      </div>

      {showAddModal && (
        <CategoryModal title="Nueva Categoría" onClose={() => setShowAddModal(false)} onSave={onAddCategory} />
      )}
      {editingCategory && (
        <CategoryModal
          title="Editar Categoría"
          initial={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={(name, color, icon, budgetLimit) =>
            onUpdateCategory(editingCategory.id, { name, color, icon, budget_limit: budgetLimit })
          }
        />
      )}
    </div>
  );
};