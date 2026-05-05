import { useState, useMemo } from 'react';
import { Plus, Target, Play, Pause, Trash2, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PurchaseGoal } from '@/hooks/useSupabaseFinances';
import { GoalCreationModal } from '@/components/GoalCreationModal';
 
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
}

const GoalCard = ({ goal, onToggleGoalStatus, onRemoveGoal }: GoalCardProps) => {
  const progressPct = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
  const daysLeft = Math.ceil(
    (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const monthsLeft = Math.ceil(daysLeft / 30);
  const isActive = goal.status === 'active';
  const isCompleted = progressPct >= 100;
  const isUrgent = monthsLeft <= 1 && !isCompleted;
  const remaining = goal.target_amount - goal.current_amount;

  return (
    <Card className={cn(
      "rounded-2xl transition-all duration-300",
      isCompleted
        ? "border-green-500/50 bg-green-500/5"
        : isActive ? "border-primary/20" : "border-muted/50 opacity-75"
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{goal.name}</h3>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
                isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {isActive ? 'Activo' : 'Pausado'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {isCompleted ? (
                <span className="text-green-600 dark:text-green-400 font-medium">✓ Meta alcanzada</span>
              ) : isUrgent ? (
                <span className="text-orange-500 font-medium">Faltan {daysLeft} días</span>
              ) : (
                <span>Faltan {monthsLeft} {monthsLeft === 1 ? 'mes' : 'meses'}</span>
              )}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-primary">{formatCurrencyCompact(goal.current_amount)}</p>
            <p className="text-xs text-muted-foreground">de {formatCurrencyCompact(goal.target_amount)}</p>
          </div>
        </div>

        {/* Animated progress bar */}
        <div className="space-y-1.5 mb-4">
          <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-1000 ease-out rounded-full",
                isCompleted ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-primary">{progressPct.toFixed(0)}%</span>
            {!isCompleted && (
              <span className="text-muted-foreground">Faltan {formatCurrencyCompact(remaining)}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          {isActive ? (
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onToggleGoalStatus(goal.id, 'pending')}>
              <Pause className="w-3.5 h-3.5 mr-1.5" />Pausar
            </Button>
          ) : (
            <Button variant="default" size="sm" className="flex-1" onClick={() => onToggleGoalStatus(goal.id, 'active')}>
              <Play className="w-3.5 h-3.5 mr-1.5" />Activar
            </Button>
          )}
          <Button
            variant="ghost" size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => { if (confirm(`¿Eliminar "${goal.name}"?`)) onRemoveGoal(goal.id); }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
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

  // Separate active and pending goals
  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active'), [goals]);
  const pendingGoals = useMemo(() => goals.filter(g => g.status === 'pending'), [goals]);

  // Calculate totals
  const totalActiveAmount = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalPendingAmount = pendingGoals.reduce((sum, g) => sum + g.target_amount, 0);
  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <Card className="glass-card rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Mis Objetivos
            </h2>
            <Button size="sm" className="rounded-xl" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Nuevo
            </Button>
          </div>
 
           <div className="grid grid-cols-3 gap-3">
             <div className="bg-card/50 rounded-xl p-3 text-center">
               <div className="text-xs text-muted-foreground mb-1">Activos</div>
               <div className="text-xl font-bold text-foreground">{activeGoals.length}</div>
               <div className="text-xs text-muted-foreground">{formatCurrencyCompact(totalActiveAmount)}</div>
             </div>
             <div className="bg-card/50 rounded-xl p-3 text-center">
               <div className="text-xs text-muted-foreground mb-1">Cuota Total</div>
               <div className="text-xl font-bold text-primary">{formatCurrencyCompact(totalActiveQuotas)}</div>
               <div className="text-xs text-muted-foreground">mensual</div>
             </div>
             <div className="bg-card/50 rounded-xl p-3 text-center">
               <div className="text-xs text-muted-foreground mb-1">Pendientes</div>
               <div className="text-xl font-bold text-muted-foreground">{pendingGoals.length}</div>
               <div className="text-xs text-muted-foreground">{formatCurrencyCompact(totalPendingAmount)}</div>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Active Goals */}
       {activeGoals.length > 0 && (
         <div>
           <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
             <Play className="w-4 h-4 text-primary" />
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
         <div>
           <h3 className="text-base font-semibold text-muted-foreground mb-3 flex items-center gap-2">
             <Pause className="w-4 h-4" />
             Pendientes ({pendingGoals.length})
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
        <Card className="glass-card rounded-2xl">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No tienes objetivos aún
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Crea tu primer objetivo y empieza a ahorrar
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Crear Objetivo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de creación mejorado */}
      <GoalCreationModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={onAddGoal}
        dineroLibre={dineroLibre}
      />
    </div>
  );
};
