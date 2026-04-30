import { useState, useEffect } from 'react';
import { X, Save, DollarSign, Repeat } from 'lucide-react';
import { ExpenseFrequency, BankType, Category } from '@/hooks/useSupabaseFinances';

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

interface Expense {
  id: string;
  name: string;
  amount: number;
  is_recurring: boolean;
  frequency: ExpenseFrequency;
  bank: BankType | null;
  created_at: string;
  category_id?: string | null;
}

interface EditExpenseModalProps {
  expense: Expense;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Expense>) => Promise<void>;
  categories?: Category[];
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

export const EditExpenseModal = ({ expense, isOpen, onClose, onSave, categories = [] }: EditExpenseModalProps) => {
  const [name, setName] = useState(expense.name);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [isRecurring, setIsRecurring] = useState(expense.is_recurring);
  const [frequency, setFrequency] = useState<ExpenseFrequency>(expense.frequency);
  const [bank, setBank] = useState<BankType | null>(expense.bank);
  const [categoryId, setCategoryId] = useState<string | null>(expense.category_id ?? null);
  const [saving, setSaving] = useState(false);
  const uniqueCategories = getUniqueCategories(categories);

  useEffect(() => {
    setName(expense.name);
    setAmount(expense.amount.toString());
    setIsRecurring(expense.is_recurring);
    setFrequency(expense.frequency);
    setBank(expense.bank);
    setCategoryId(expense.category_id ?? null);
  }, [expense]);

  if (!isOpen) return null;

  const handleSave = async () => {
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
        bank,
        category_id: categoryId,
      });
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar el gasto');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-secondary/70 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all";
  const selectClass = "w-full px-4 py-3 bg-secondary/70 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all";

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="glass-card-elevated rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Editar Gasto</h3>
          </div>
          <button
            onClick={() => { if (!saving) onClose(); }}
            disabled={saving}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Descripción del gasto</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Netflix, Supermercado, Gasolina..."
              className={inputClass}
              disabled={saving}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Monto</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className={`${inputClass} pr-12`}
                disabled={saving}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">€</span>
            </div>
          </div>

          {/* Recurring toggle */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
            <div className="flex items-center gap-3">
              <Repeat className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium text-foreground">Gasto recurrente</div>
                <div className="text-xs text-muted-foreground">Se repite periódicamente</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="sr-only peer"
                disabled={saving}
              />
              <div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Frequency */}
          {isRecurring && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Frecuencia</label>
              <div className="grid grid-cols-3 gap-2">
                {FREQUENCIES.map(freq => (
                  <button
                    key={freq.value}
                    onClick={() => setFrequency(freq.value)}
                    disabled={saving}
                    className={`px-4 py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-50 ${
                      frequency === freq.value
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bank */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Banco (opcional)</label>
            <select
              value={bank || ''}
              onChange={e => setBank(e.target.value as BankType || null)}
              disabled={saving}
              className={selectClass}
            >
              <option value="">Sin banco específico</option>
              {BANKS.map(b => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          {uniqueCategories.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Categoría (opcional)</label>
              <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-border bg-secondary/40 p-2">
                <button
                  type="button"
                  onClick={() => setCategoryId(null)}
                  disabled={saving}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all disabled:opacity-50 ${
                    !categoryId ? 'border-primary bg-primary/15 text-primary' : 'border-border/70 bg-card/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-muted">—</span>
                  <span className="truncate">Sin categoría</span>
                </button>
                {uniqueCategories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    disabled={saving}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all disabled:opacity-50 ${
                      categoryId === cat.id ? 'border-primary bg-primary/15 text-primary' : 'border-border/70 bg-card/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-muted">{cat.icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-primary">
            💡 Los cambios se guardarán inmediatamente y afectarán tus cálculos
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-border flex-shrink-0">
          <button
            onClick={() => { if (!saving) onClose(); }}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-background border border-border hover:bg-muted text-foreground rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
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
