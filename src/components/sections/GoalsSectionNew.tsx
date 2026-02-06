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
 
   const getMonthlyQuota = (goal: PurchaseGoal) => {
     const remaining = goal.target_amount - goal.current_amount;
     const months = calculateMonthsRemaining(goal.target_date);
     return remaining > 0 ? remaining / months : 0;
   };
 
   const getProgress = (goal: PurchaseGoal) => {
     return Math.min(100, (goal.current_amount / goal.target_amount) * 100);
   };
 
   const GoalCard = ({ goal }: { goal: PurchaseGoal }) => {
     const progress = getProgress(goal);
     const monthsLeft = calculateMonthsRemaining(goal.target_date);
     const monthlyQuota = getMonthlyQuota(goal);
     const isActive = goal.status === 'active';
 
     return (
       <Card className={cn(
         "glass-card rounded-2xl transition-all",
         isActive ? "border-primary/30" : "border-muted/50 opacity-75"
       )}>
         <CardContent className="p-4">
           {/* Header */}
           <div className="flex items-start justify-between mb-3">
             <div className="flex items-start gap-3 flex-1">
               <div className={cn(
                 "p-2 rounded-xl",
                 isActive ? "bg-primary/10" : "bg-muted"
               )}>
                 <Target className={cn(
                   "w-5 h-5",
                   isActive ? "text-primary" : "text-muted-foreground"
                 )} />
               </div>
               <div className="flex-1">
                 <h3 className="font-semibold text-foreground">{goal.name}</h3>
                 <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                   <span>{formatCurrencyCompact(goal.target_amount)}</span>
                   <span>•</span>
                   <span className="flex items-center gap-1">
                     <Calendar className="w-3.5 h-3.5" />
                     {format(new Date(goal.target_date), "d MMM yyyy", { locale: es })}
                   </span>
                 </div>
               </div>
             </div>
 
             {/* Status badge */}
             <span className={cn(
               "px-2.5 py-1 rounded-full text-xs font-medium",
               isActive 
                 ? "bg-primary/10 text-primary" 
                 : "bg-muted text-muted-foreground"
             )}>
               {isActive ? '✓ Activo' : '⏸ Pendiente'}
             </span>
           </div>
 
           {/* Progress bar */}
           <div className="mb-3">
             <div className="flex items-center justify-between text-sm mb-1.5">
               <span className="text-muted-foreground">
                 {formatCurrencyCompact(goal.current_amount)} / {formatCurrencyCompact(goal.target_amount)}
               </span>
               <span className="font-medium text-foreground">
                 {progress.toFixed(0)}%
               </span>
             </div>
             <div className="w-full bg-muted rounded-full h-1.5">
               <div 
                 className={cn(
                   "h-1.5 rounded-full transition-all",
                   isActive ? "bg-primary" : "bg-muted-foreground/50"
                 )}
                 style={{ width: `${progress}%` }}
               />
             </div>
           </div>
 
           {/* Stats (only for active) */}
           {isActive && (
             <div className="grid grid-cols-2 gap-2 mb-3">
               <div className="bg-primary/5 rounded-xl p-2.5">
                 <div className="text-xs text-muted-foreground">Cuota mensual</div>
                 <div className="font-semibold text-primary">
                   {formatCurrencyCompact(monthlyQuota)}/mes
                 </div>
               </div>
               <div className="bg-muted/50 rounded-xl p-2.5">
                 <div className="text-xs text-muted-foreground">Tiempo restante</div>
                 <div className="font-semibold text-foreground">
                   {monthsLeft} {monthsLeft === 1 ? 'mes' : 'meses'}
                 </div>
               </div>
             </div>
           )}
 
           {/* Actions */}
           <div className="flex items-center gap-2 pt-2 border-t border-border/50">
             {isActive ? (
               <Button
                 variant="outline"
                 size="sm"
                 className="flex-1"
                 onClick={() => onToggleGoalStatus(goal.id, 'pending')}
               >
                 <Pause className="w-4 h-4 mr-1.5" />
                 Pausar
               </Button>
             ) : (
               <Button
                 variant="default"
                 size="sm"
                 className="flex-1"
                 onClick={() => onToggleGoalStatus(goal.id, 'active')}
               >
                 <Play className="w-4 h-4 mr-1.5" />
                 Activar
               </Button>
             )}
             
             <Button
               variant="ghost"
               size="sm"
               className="text-destructive hover:text-destructive hover:bg-destructive/10"
               onClick={() => {
                 if (confirm(`¿Eliminar objetivo "${goal.name}"?`)) {
                   onRemoveGoal(goal.id);
                 }
               }}
             >
               <Trash2 className="w-4 h-4" />
             </Button>
           </div>
         </CardContent>
       </Card>
     );
   };
 
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
               <GoalCard key={goal.id} goal={goal} />
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
               <GoalCard key={goal.id} goal={goal} />
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
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSubmit={onAddGoal}
        dineroLibre={dineroLibre}
      />
    </div>
  );
};
