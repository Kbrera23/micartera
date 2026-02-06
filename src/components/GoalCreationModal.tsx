// GoalCreationModal.tsx
// Modal mejorado para crear objetivos con opción fecha/cuota

import { useState } from 'react';
import { X, Calendar, Euro, TrendingUp, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatCurrencyCompact } from '@/lib/currency';

interface GoalCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, targetAmount: number, targetDate: Date) => void;
  dineroLibre: number;
}

type CalculationMode = 'date' | 'quota';

export const GoalCreationModal = ({ 
  open, 
  onOpenChange, 
  onSubmit,
  dineroLibre 
}: GoalCreationModalProps) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [calculationMode, setCalculationMode] = useState<CalculationMode>('date');
  
  // Para modo fecha
  const [targetDate, setTargetDate] = useState('');
  
  // Para modo cuota
  const [monthlyQuota, setMonthlyQuota] = useState('');

  // Calcular meses basado en fecha seleccionada
  const getMonthsFromDate = (date: string): number => {
    if (!date) return 0;
    const target = new Date(date);
    const now = new Date();
    const months = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return Math.max(1, months);
  };

  // Calcular fecha basada en cuota mensual
  const getDateFromQuota = (amount: number, quota: number): Date => {
    if (!quota || quota <= 0) return new Date();
    const months = Math.ceil(amount / quota);
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date;
  };

  // Cuota mensual calculada
  const calculatedQuota = calculationMode === 'date' && targetAmount && targetDate
    ? parseFloat(targetAmount) / getMonthsFromDate(targetDate)
    : parseFloat(monthlyQuota) || 0;

  // Fecha calculada
  const calculatedDate = calculationMode === 'quota' && targetAmount && monthlyQuota
    ? getDateFromQuota(parseFloat(targetAmount), parseFloat(monthlyQuota))
    : targetDate ? new Date(targetDate) : null;

  // Meses calculados
  const monthsNeeded = calculationMode === 'date'
    ? getMonthsFromDate(targetDate)
    : targetAmount && monthlyQuota 
      ? Math.ceil(parseFloat(targetAmount) / parseFloat(monthlyQuota))
      : 0;

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setTargetDate('');
    setMonthlyQuota('');
    setCalculationMode('date');
  };

  const handleSubmit = () => {
    if (!name?.trim() || !targetAmount) {
      return;
    }

    const amount = parseFloat(targetAmount);
    if (amount <= 0) return;

    let finalDate: Date;

    if (calculationMode === 'date') {
      if (!targetDate) return;
      finalDate = new Date(targetDate);
      if (finalDate <= new Date()) return;
    } else {
      if (!monthlyQuota || parseFloat(monthlyQuota) <= 0) return;
      finalDate = getDateFromQuota(amount, parseFloat(monthlyQuota));
    }

    onSubmit(name, amount, finalDate);
    resetForm();
    onOpenChange(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Obtener fecha mínima (mañana)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const isValid = name?.trim() && targetAmount && parseFloat(targetAmount) > 0 &&
    ((calculationMode === 'date' && targetDate) || 
     (calculationMode === 'quota' && monthlyQuota && parseFloat(monthlyQuota) > 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            Nuevo Objetivo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Nombre del objetivo */}
          <div>
            <Label className="text-sm font-semibold">
              ¿Qué quieres conseguir?
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Viaje a Japón, MacBook Pro..."
              className="mt-1.5"
            />
          </div>

          {/* Monto objetivo */}
          <div>
            <Label className="text-sm font-semibold">
              ¿Cuánto necesitas?
            </Label>
            <div className="relative mt-1.5">
              <Input
                type="number"
                inputMode="decimal"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0"
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                €
              </span>
            </div>
          </div>

          {/* Toggle: Fecha vs Cuota */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">
              ¿Cómo quieres calcularlo?
            </Label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => setCalculationMode('date')}
                className={cn(
                  "px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2",
                  calculationMode === 'date'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Calendar className="w-4 h-4" />
                Por fecha
              </button>
              <button
                type="button"
                onClick={() => setCalculationMode('quota')}
                className={cn(
                  "px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2",
                  calculationMode === 'quota'
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Euro className="w-4 h-4" />
                Por cuota
              </button>
            </div>
          </div>

          {/* Modo FECHA */}
          {calculationMode === 'date' && (
            <div>
              <Label className="text-sm font-semibold">
                ¿Para cuándo lo necesitas?
              </Label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={getMinDate()}
                className="mt-1.5"
              />
            </div>
          )}

          {/* Modo CUOTA */}
          {calculationMode === 'quota' && (
            <div>
              <Label className="text-sm font-semibold">
                ¿Cuánto puedes ahorrar al mes?
              </Label>
              <div className="relative mt-1.5">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={monthlyQuota}
                  onChange={(e) => setMonthlyQuota(e.target.value)}
                  placeholder="0"
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  €/mes
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tienes {formatCurrencyCompact(dineroLibre)} disponibles al mes
              </p>
            </div>
          )}

          {/* Preview de cálculos */}
          {targetAmount && ((calculationMode === 'date' && targetDate) || (calculationMode === 'quota' && monthlyQuota)) && (
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-5 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">Resumen del objetivo</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card/50 rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-1">Cuota mensual</div>
                  <div className="text-xl font-bold text-primary">
                    {formatCurrencyCompact(calculatedQuota)}
                  </div>
                  <div className="text-xs text-muted-foreground">por mes</div>
                </div>
                
                <div className="bg-card/50 rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-1">Duración</div>
                  <div className="text-xl font-bold text-foreground">
                    {monthsNeeded}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {monthsNeeded === 1 ? 'mes' : 'meses'}
                  </div>
                </div>
              </div>

              {calculatedDate && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Fecha estimada</div>
                  <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {formatDate(calculatedDate)}
                  </div>
                </div>
              )}

              {/* Advertencia si excede dinero libre */}
              {calculatedQuota > dineroLibre && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ La cuota ({formatCurrencyCompact(calculatedQuota)}) excede tu dinero libre ({formatCurrencyCompact(dineroLibre)})
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleSubmit}
              disabled={!isValid}
            >
              Crear Objetivo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
