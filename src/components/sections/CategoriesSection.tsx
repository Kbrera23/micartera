import { useState } from 'react';
import { Plus, Trash2, Tag, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Category } from '@/hooks/useSupabaseFinances';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';

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
  onDeleteCategory: (id: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#6366f1', '#6b7280',
  '#14b8a6', '#f97316', '#84cc16', '#06b6d4',
];

const PRESET_ICONS = ['🛒', '🚗', '🎮', '📺', '🏠', '💊', '👕', '📁', '✈️', '🍕', '💪', '📚', '🎵', '💻', '🐾', '🌿'];

interface NewCategoryModalProps {
  onClose: () => void;
  onSave: (name: string, color: string, icon: string, budgetLimit: number) => Promise<void>;
}

const NewCategoryModal = ({ onClose, onSave }: NewCategoryModalProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('📁');
  const [budgetLimit, setBudgetLimit] = useState('');
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Nueva Categoría</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="font-semibold text-foreground">{name || 'Nombre categoría'}</p>
              <p className="text-xs text-muted-foreground">
                Presupuesto: {budgetLimit ? formatCurrencyCompact(parseFloat(budgetLimit)) : '—'}/mes
              </p>
            </div>
            <div className="ml-auto w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Restaurantes, Gym..."
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Icono</label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_ICONS.map(i => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className={cn(
                    'text-xl p-2 rounded-lg transition-all',
                    icon === i ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all',
                    color === c ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Budget limit */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Presupuesto mensual (opcional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              <input
                type="number"
                value={budgetLimit}
                onChange={e => setBudgetLimit(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Deja en 0 para sin límite</p>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1 rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 rounded-xl"
          >
            {saving ? 'Guardando...' : 'Crear Categoría'}
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
  onDeleteCategory,
}: CategoriesSectionProps) => {
  const [showModal, setShowModal] = useState(false);

  const statsMap = new Map(expensesByCategory.map(s => [s.category.id, s]));

  const totalBudget = categories.reduce((sum, c) => sum + c.budget_limit, 0);
  const totalSpent = expensesByCategory.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorías</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Organiza y controla tus gastos</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" />
          Nueva
        </Button>
      </div>

      {/* Summary */}
      {totalBudget > 0 && (
        <Card className="rounded-2xl border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Resumen mensual</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatCurrencyCompact(totalSpent)} / {formatCurrencyCompact(totalBudget)}
              </span>
            </div>
            <Progress
              value={Math.min((totalSpent / totalBudget) * 100, 100)}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {totalSpent > totalBudget
                ? `⚠️ Excedido por ${formatCurrencyCompact(totalSpent - totalBudget)}`
                : `Quedan ${formatCurrencyCompact(totalBudget - totalSpent)} disponibles`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Category grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(cat => {
          const stats = statsMap.get(cat.id);
          const pct = stats?.percentage ?? 0;
          const spent = stats?.total ?? 0;
          const isOverBudget = stats?.isOverBudget ?? false;
          const isWarning = pct >= 80 && !isOverBudget;

          const progressColor = isOverBudget
            ? 'bg-destructive'
            : isWarning
            ? 'bg-yellow-500'
            : 'bg-green-500';

          return (
            <Card
              key={cat.id}
              className="rounded-2xl border-border hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      {cat.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground leading-tight">{cat.name}</p>
                      {cat.budget_limit > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {formatCurrencyCompact(cat.budget_limit)}/mes
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isOverBudget && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    {!cat.is_default && (
                      <button
                        onClick={() => onDeleteCategory(cat.id)}
                        className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Spent amount */}
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-lg font-bold text-foreground">
                    {formatCurrencyCompact(spent)}
                  </span>
                  {cat.budget_limit > 0 && (
                    <span className={cn(
                      'text-xs font-medium',
                      isOverBudget ? 'text-destructive' : isWarning ? 'text-yellow-600' : 'text-muted-foreground'
                    )}>
                      {Math.round(pct)}%
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {cat.budget_limit > 0 && (
                  <>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                      <div
                        className={cn('h-full rounded-full transition-all', progressColor)}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <p className={cn(
                      'text-xs',
                      isOverBudget ? 'text-destructive font-medium' : 'text-muted-foreground'
                    )}>
                      {isOverBudget
                        ? `Excedido: +${formatCurrencyCompact(Math.abs(stats?.remaining ?? 0))}`
                        : `Disponible: ${formatCurrencyCompact(Math.max(stats?.remaining ?? 0, 0))}`}
                    </p>
                  </>
                )}

                {cat.budget_limit === 0 && spent === 0 && (
                  <p className="text-xs text-muted-foreground">Sin gastos asignados</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showModal && (
        <NewCategoryModal
          onClose={() => setShowModal(false)}
          onSave={onAddCategory}
        />
      )}
    </div>
  );
};
