// GoalCreationModal.tsx
// Modal mejorado para crear objetivos con opción fecha/cuota y calendario moderno

import { useState } from 'react';
import { X, Calendar, Euro, TrendingUp, DollarSign } from 'lucide-react';
import { ModernCalendar } from './ModernCalendar';

interface GoalCreationModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (name: string, targetAmount: number, targetDate: Date) => void;
  dineroLibre: number;
}

type CalculationMode = 'date' | 'quota';

export const GoalCreationModal = ({ 
  show, 
  onClose, 
  onSubmit,
  dineroLibre 
}: GoalCreationModalProps) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [calculationMode, setCalculationMode] = useState<CalculationMode>('date');
  
  // Para modo fecha (ahora es Date | null)
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  
  // Para modo cuota
  const [monthlyQuota, setMonthlyQuota] = useState('');

  if (!show) return null;

  // Calcular meses basado en fecha seleccionada
  const getMonthsFromDate = (date: Date | null): number => {
    if (!date) return 0;
    const now = new Date();
    const months = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
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
    : targetDate;

  // Meses calculados
  const monthsNeeded = calculationMode === 'date'
    ? getMonthsFromDate(targetDate)
    : targetAmount && monthlyQuota 
      ? Math.ceil(parseFloat(targetAmount) / parseFloat(monthlyQuota))
      : 0;

  const handleSubmit = () => {
    if (!name?.trim() || !targetAmount) {
      alert('⚠️ Por favor completa el nombre y monto');
      return;
    }

    const amount = parseFloat(targetAmount);
    if (amount <= 0) {
      alert('⚠️ El monto debe ser mayor a 0');
      return;
    }

    let finalDate: Date;

    if (calculationMode === 'date') {
      if (!targetDate) {
        alert('⚠️ Por favor selecciona una fecha');
        return;
      }
      finalDate = targetDate;
      if (finalDate <= new Date()) {
        alert('⚠️ La fecha debe ser futura');
        return;
      }
    } else {
      if (!monthlyQuota || parseFloat(monthlyQuota) <= 0) {
        alert('⚠️ La cuota mensual debe ser mayor a 0');
        return;
      }
      finalDate = getDateFromQuota(amount, parseFloat(monthlyQuota));
    }

    onSubmit(name, amount, finalDate);
    
    // Reset
    setName('');
    setTargetAmount('');
    setTargetDate(null);
    setMonthlyQuota('');
    setCalculationMode('date');
    onClose();
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Nuevo Objetivo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Nombre del objetivo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ¿Qué quieres conseguir?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Viaje a Japón, MacBook Pro, Coche..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Monto objetivo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ¿Cuánto necesitas?
            </label>
            <div className="relative">
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                €
              </span>
            </div>
          </div>

          {/* Toggle: Fecha vs Cuota */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              ¿Cómo quieres calcularlo?
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setCalculationMode('date')}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  calculationMode === 'date'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Por fecha
              </button>
              <button
                onClick={() => setCalculationMode('quota')}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  calculationMode === 'quota'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Euro className="w-4 h-4 inline mr-2" />
                Por cuota
              </button>
            </div>
          </div>

          {/* Modo FECHA */}
          {calculationMode === 'date' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                ¿Para cuándo lo necesitas?
              </label>
              <ModernCalendar
                selectedDate={targetDate}
                onSelectDate={setTargetDate}
                minDate={new Date()}
              />
            </div>
          )}

          {/* Modo CUOTA */}
          {calculationMode === 'quota' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ¿Cuánto puedes ahorrar al mes?
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={monthlyQuota}
                  onChange={(e) => setMonthlyQuota(e.target.value)}
                  placeholder="0"
                  max={dineroLibre}
                  className="w-full px-4 py-3 pr-16 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  € / mes
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tienes {dineroLibre.toFixed(0)}€ disponibles al mes
              </p>
            </div>
          )}

          {/* Preview de cálculos */}
          {targetAmount && ((calculationMode === 'date' && targetDate) || (calculationMode === 'quota' && monthlyQuota)) && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 border-2 border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Resumen del objetivo</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Cuota mensual</div>
                  <div className="text-xl font-bold text-blue-600">
                    {calculatedQuota.toFixed(0)}€
                  </div>
                  <div className="text-xs text-gray-500">por mes</div>
                </div>
                
                <div>
                  <div className="text-xs text-gray-600 mb-1">Duración</div>
                  <div className="text-xl font-bold text-purple-600">
                    {monthsNeeded}
                  </div>
                  <div className="text-xs text-gray-500">
                    {monthsNeeded === 1 ? 'mes' : 'meses'}
                  </div>
                </div>
              </div>

              {calculatedDate && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="text-xs text-gray-600 mb-1">Fecha estimada</div>
                  <div className="text-sm font-semibold text-gray-900">
                    📅 {formatDate(calculatedDate)}
                  </div>
                </div>
              )}

              {/* Advertencia si excede dinero libre */}
              {calculatedQuota > dineroLibre && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    ⚠️ La cuota ({calculatedQuota.toFixed(0)}€) excede tu dinero libre ({dineroLibre.toFixed(0)}€)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30"
          >
            Crear Objetivo
          </button>
        </div>
      </div>
    </div>
  );
};