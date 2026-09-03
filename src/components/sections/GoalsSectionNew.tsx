import { useState, useMemo, useEffect } from 'react';
import { Plus, Target, Play, Pause, Trash2, Calendar, TrendingUp, PiggyBank, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { PurchaseGoal } from '@/hooks/useSupabaseFinances';
import { GoalCreationModal } from '@/components/GoalCreationModal';
import { supabase } from '@/integrations/supabase/client';
import { gastoMedioMensual, ahorroMensual, estimarObjetivo } from '@/lib/goalEstimation';

interface GoalsSectionProps {
  goals: PurchaseGoal[];
  totalActiveQuotas: number;
  dineroLibre: number;
  hasInsufficientFunds: boolean;
  onAddGoal: (name: string, targetAmount: number, targetDate: Date) => void;
  onRemoveGoal: (id: string) => void;
  onToggleGoalStatus: (goalId: string, newStatus: 'active' | 'pending') => void;
}

const calculateMonthsRemaining = (targetDate: string): number => {
  const now = new Date();
  const target = new Date(targetDate);
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(1, months);
};

interface GoalCardProps {
  goal: PurchaseGoal;
  onToggleGoalStatus: (goalId: string, newStatus: 'active' | 'pending') => void;
  onRemoveGoal: (id: string) => void;
  ahorro: number;
  mesesData: number;
}

const GoalCard = ({ goal, onToggleGoalStatus, onRemoveGoal, ahorro, mesesData }: GoalCardProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!confirmDelete) return;
    const timer = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmDelete]);

  const progressPct = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
  const daysLeft = Math.ceil(
    (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const monthsLeft = Math.ceil(daysLeft / 30);
  const isActive = goal.status === 'active';
  const isCompleted = progressPct >= 100;
  const isUrgent = monthsLeft <= 1 && !isCompleted;
  const remaining = goal.target_amount - goal.current_amount;
  const monthlyQuota = remaining > 0 ? remaining / calculateMonthsRemaining(goal.target_date) : 0;

  return (
    <div className={cn(
      "relative rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl",
      "border backdrop-filter backdrop-blur-xl",
      isCompleted
        ? "bg-green-500/10 border-green-500/30 shadow-green-500/10"
        : isActive
        ? "glass-card border-primary/15 hover:border-primary/30"
        : "glass-card border-muted/30 opacity-75"
    )}>
      {/* Glow superior sutil */}
      {isActive && !isCompleted && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-3">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{goal.name}</h3>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
              isCompleted
                ? "bg-green-500/20 text-green-400"
                : isActive
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {isCompleted ? '✓ Completado' : isActive ? 'Activo' : 'Pausado'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {isCompleted ? (
              <span className="text-green-400 font-medium">Meta alcanzada</span>
            ) : isUrgent ? (
              <span className="text-orange-400 font-medium">¡Faltan {daysLeft} días!</span>
            ) : (
              <span>Faltan {monthsLeft} {monthsLeft === 1 ? 'mes' : 'meses'}</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={cn(
            "text-lg font-bold",
            isCompleted ? "text-green-400" : "text-primary"
          )}>
            {formatCurrencyCompact(goal.current_amount)}
          </p>
          <p className="text-xs text-muted-foreground">de {formatCurrencyCompact(goal.target_amount)}</p>
        </div>
      </div>

      {/* Progress bar mejorada */}
      <div className="space-y-1.5 mb-4">
        <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
          {/* Fondo animado */}
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-all duration-1000 ease-out",
              isCompleted
                ? "bg-gradient-to-r from-green-500 to-green-400"
                : "bg-gradient-to-r from-primary via-primary/80 to-primary/60"
            )}
            style={{ width: `${progressPct}%` }}
          />
          {/* Shimmer */}
          {isActive && !isCompleted && (
            <div
              className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              style={{ left: `${progressPct - 4}%` }}
            />
          )}
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className={cn(
            "font-bold",
            isCompleted ? "text-green-400" : "text-primary"
          )}>
            {progressPct.toFixed(0)}%
          </span>
          {!isCompleted && (
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {formatCurrencyCompact(monthlyQuota)}/mes
            </span>
          )}
        </div>
      </div>

      {/* Falta por ahorrar */}
      {!isCompleted && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-muted/30 flex justify-between text-xs">
          <span className="text-muted-foreground">Pendiente</span>
          <span className="font-semibold text-foreground">{formatCurrencyCompact(remaining)}</span>
        </div>
      )}

      {/* Estimación real */}
      {!isCompleted && (
        <div className="mb-3 p-2.5 rounded-xl bg-muted border border-border/50 space-y-1">
          <div className="flex items-center gap-2">
            {(() => {
              const est = estimarObjetivo(goal.target_amount, goal.current_amount, ahorro, mesesData);
              return est.alcanzable ? (
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              );
            })()}
            <span className="text-sm font-medium text-foreground">Estimación real</span>
          </div>
          {(() => {
            const est = estimarObjetivo(goal.target_amount, goal.current_amount, ahorro, mesesData);
            if (est.faltante === 0) {
              return <p className="text-xs text-muted-foreground">Ya has alcanzado este objetivo.</p>;
            }
            if (est.alcanzable) {
              return (
                <p className="text-xs text-muted-foreground">
                  A tu ritmo de ahorro ({formatCurrencyCompact(est.ahorroMensual)}/mes), lo alcanzas en{' '}
                  <span className="font-semibold text-foreground">{est.mesesNecesarios}</span>{' '}
                  {est.mesesNecesarios === 1 ? 'mes' : 'meses'}.
                </p>
              );
            }
            return (
              <p className="text-xs text-amber-500">
                Con tu ahorro actual no llegarías a este objetivo. Revisa gastos o ingresos.
              </p>
            );
          })()}
          {(() => {
            const est = estimarObjetivo(goal.target_amount, goal.current_amount, ahorro, mesesData);
            return est.pocosData ? (
              <p className="text-[11px] text-muted-foreground">
                Estimación provisional (pocos meses de datos)
              </p>
            ) : null;
          })()}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/30">
        {isActive ? (
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs rounded-xl border-border/50" onClick={() => onToggleGoalStatus(goal.id, 'pending')}>
            <Pause className="w-3 h-3 mr-1.5" />Pausar
          </Button>
        ) : (
          <Button variant="default" size="sm" className="flex-1 h-8 text-xs rounded-xl" onClick={() => onToggleGoalStatus(goal.id, 'active')}>
            <Play className="w-3 h-3 mr-1.5" />Activar
          </Button>
        )}

        {confirmDelete ? (
          <div className="flex items-center gap-1.5 animate-fade-in">
            <span className="text-xs text-muted-foreground">¿Eliminar?</span>
            <Button variant="destructive" size="sm" className="h-7 px-2 text-xs rounded-lg"
              onClick={() => { onRemoveGoal(goal.id); setConfirmDelete(false); }}>
              Sí
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs rounded-lg"
              onClick={() => setConfirmDelete(false)}>
              No
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
            onClick={() => setConfirmDelete(true)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const GoalsSection = ({
  goals,
  totalActiveQuotas,
  dineroLibre,
  hasInsufficientFunds,
  onAddGoal,
  onRemoveGoal,
  onToggleGoalStatus
}: GoalsSectionProps) => {
  const [showAddModal, setShowAddModal] = useState(false);

  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active'), [goals]);
  const pendingGoals = useMemo(() => goals.filter(g => g.status === 'pending'), [goals]);

  const totalActiveAmount = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalPendingAmount = pendingGoals.reduce((sum, g) => sum + g.target_amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Summary */}
      <div className="glass-card-elevated rounded-2xl p-5 relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Mis Objetivos</h2>
            </div>
            <p className="text-xs text-muted-foreground ml-8">
              {activeGoals.length > 0
                ? `Ahorrando ${formatCurrencyCompact(totalActiveQuotas)}/mes`
                : 'Sin objetivos activos'}
            </p>
          </div>
          <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Nuevo
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl p-3 text-center" style={{ background: 'hsl(200 35% 16%)' }}>
            <div className="text-xs text-muted-foreground mb-1">Activos</div>
            <div className="text-2xl font-bold text-foreground">{activeGoals.length}</div>
            <div className="text-xs text-muted-foreground">{formatCurrencyCompact(totalActiveAmount)}</div>
          </div>
          <div className="rounded-xl p-3 text-center border border-primary/15" style={{ background: 'hsl(186 30% 14%)' }}>
            <div className="text-xs text-muted-foreground mb-1">Cuota/mes</div>
            <div className="text-2xl font-bold text-primary">{formatCurrencyCompact(totalActiveQuotas)}</div>
            <div className="text-xs text-muted-foreground">mensual</div>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: 'hsl(200 35% 16%)' }}>
            <div className="text-xs text-muted-foreground mb-1">Pausados</div>
            <div className="text-2xl font-bold text-muted-foreground">{pendingGoals.length}</div>
            <div className="text-xs text-muted-foreground">{formatCurrencyCompact(totalPendingAmount)}</div>
          </div>
        </div>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="stagger-1">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Activos ({activeGoals.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} onToggleGoalStatus={onToggleGoalStatus} onRemoveGoal={onRemoveGoal} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Goals */}
      {pendingGoals.length > 0 && (
        <div className="stagger-2">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            Pausados ({pendingGoals.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} onToggleGoalStatus={onToggleGoalStatus} onRemoveGoal={onRemoveGoal} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {goals.length === 0 && (
        <div className="glass-card rounded-2xl py-14 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Target className="w-8 h-8 text-primary/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No tienes objetivos aún</h3>
          <p className="text-muted-foreground text-sm mb-5">Crea tu primer objetivo y empieza a ahorrar</p>
          <Button onClick={() => setShowAddModal(true)} className="rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-1.5" />
            Crear Objetivo
          </Button>
        </div>
      )}

      <GoalCreationModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={onAddGoal}
        dineroLibre={dineroLibre}
      />
    </div>
  );
};