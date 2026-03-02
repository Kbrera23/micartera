// EditExpenseModal.tsx
// Modal para editar gastos existentes

import { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, Repeat } from 'lucide-react';
import { ExpenseFrequency, BankType } from '@/hooks/useSupabaseFinances';

interface Expense {
  id: string;
  name: string;
  amount: number;
  is_recurring: boolean;
  frequency: ExpenseFrequency;
  bank: BankType | null;
  created_at: string;
}

interface EditExpenseModalProps {
  expense: Expense;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Expense>) => Promise<void>;
}

const BANKS: { value: BankType; label: string }[] = [
  { value: 'santander', label: 'Santander' },
  { value: 'lacaixa', label: 'La Caixa' },
  { value: 'ing', label: 'ING' },
  { value: 'revolut', label: 'Revolut' },
  { value: 'bbva', label: 'BBVA' },
];

const FREQUENCIES: { value: ExpenseFrequency; label: string }[] = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'annual', label: 'Anual' },
];

export const EditExpenseModal = ({ expense, isOpen, onClose, onSave }: EditExpenseModalProps) => {
  const [name, setName] = useState(expense.name);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [isRecurring, setIsRecurring] = useState(expense.is_recurring);
  const [frequency, setFrequency] = useState<ExpenseFrequency>(expense.frequency);
  const [bank, setBank] = useState<BankType | null>(expense.bank);
  const [saving, setSaving] = useState(false);

  // Reset form when expense changes
  useEffect(() => {
    setName(expense.name);
    setAmount(expense.amount.toString());
    setIsRecurring(expense.is_recurring);
    setFrequency(expense.frequency);
    setBank(expense.bank);
  }, [expense]);

  if (!isOpen) return null;

  const handleSave = async () => {
    // Validaciones
    if (!name.trim()) {
      alert('⚠️ El nombre es obligatorio');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('⚠️ El monto debe ser mayor a 0');
      return;
    }

    setSaving(true);
    try {
      await onSave(expense.id, {
        name: name.trim(),
        amount: parsedAmount,
        is_recurring: isRecurring,
        frequency: isRecurring ? frequency : 'monthly',
        bank: bank
      });
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar el gasto');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Editar Gasto
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción del gasto
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Netflix, Supermercado, Gasolina..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
              disabled={saving}
            />
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Monto
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                disabled={saving}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                €
              </span>
            </div>
          </div>

          {/* Gasto Recurrente */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Repeat className="w-5 h-5 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Gasto recurrente</div>
                <div className="text-xs text-gray-600">Se repite periódicamente</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="sr-only peer"
                disabled={saving}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Frecuencia (solo si es recurrente) */}
          {isRecurring && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Frecuencia
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FREQUENCIES.map((freq) => (
                  <button
                    key={freq.value}
                    onClick={() => setFrequency(freq.value)}
                    disabled={saving}
                    className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                      frequency === freq.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Banco */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Banco (opcional)
            </label>
            <select
              value={bank || ''}
              onChange={(e) => setBank(e.target.value as BankType || null)}
              disabled={saving}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 bg-white"
            >
              <option value="">Sin banco específico</option>
              {BANKS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          {/* Info de cambios */}
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
            💡 Los cambios se guardarán inmediatamente y afectarán tus cálculos
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};