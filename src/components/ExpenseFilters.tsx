import { useState } from 'react';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';
import { ExpenseFrequency, BankType } from '@/hooks/useSupabaseFinances';

export interface ExpenseFiltersState {
  searchQuery: string;
  banks: BankType[];
  types: ('recurring' | 'oneTime')[];
  frequencies: ExpenseFrequency[];
  sortBy: 'date' | 'amount' | 'name';
  sortOrder: 'asc' | 'desc';
}

interface ExpenseFiltersProps {
  filters: ExpenseFiltersState;
  onFiltersChange: (filters: ExpenseFiltersState) => void;
  totalExpenses: number;
  filteredCount: number;
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

const SORT_OPTIONS = [
  { value: 'date', label: 'Fecha' },
  { value: 'amount', label: 'Monto' },
  { value: 'name', label: 'Nombre' },
] as const;

export const ExpenseFilters = ({ 
  filters, 
  onFiltersChange, 
  totalExpenses, 
  filteredCount 
}: ExpenseFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (updates: Partial<ExpenseFiltersState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleBank = (bank: BankType) => {
    const newBanks = filters.banks.includes(bank)
      ? filters.banks.filter(b => b !== bank)
      : [...filters.banks, bank];
    updateFilters({ banks: newBanks });
  };

  const toggleType = (type: 'recurring' | 'oneTime') => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    updateFilters({ types: newTypes });
  };

  const toggleFrequency = (freq: ExpenseFrequency) => {
    const newFreqs = filters.frequencies.includes(freq)
      ? filters.frequencies.filter(f => f !== freq)
      : [...filters.frequencies, freq];
    updateFilters({ frequencies: newFreqs });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      banks: [],
      types: [],
      frequencies: [],
      sortBy: 'date',
      sortOrder: 'desc',
    });
    setShowAdvanced(false);
  };

  const hasActiveFilters = 
    filters.searchQuery !== '' ||
    filters.banks.length > 0 ||
    filters.types.length > 0 ||
    filters.frequencies.length > 0 ||
    filters.sortBy !== 'date' ||
    filters.sortOrder !== 'desc';

  const activeFiltersCount = 
    (filters.searchQuery ? 1 : 0) +
    filters.banks.length +
    filters.types.length +
    filters.frequencies.length +
    (filters.sortBy !== 'date' || filters.sortOrder !== 'desc' ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Búsqueda y controles principales */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Barra de búsqueda */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            placeholder="Buscar gastos..."
            className="w-full pl-10 pr-10 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background text-foreground placeholder:text-muted-foreground"
          />
          {filters.searchQuery && (
            <button
              onClick={() => updateFilters({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Botón filtros avanzados */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
            showAdvanced || activeFiltersCount > 0
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 bg-primary-foreground text-primary rounded-full text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Ordenar */}
        <div className="flex gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
            className="px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-foreground bg-background font-medium"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => updateFilters({ 
              sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
            })}
            className="px-3 py-3 bg-muted hover:bg-accent rounded-xl transition-colors"
            title={filters.sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
          >
            {filters.sortOrder === 'asc' ? (
              <SortAsc className="w-5 h-5 text-muted-foreground" />
            ) : (
              <SortDesc className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div className="bg-muted rounded-xl p-4 space-y-4 animate-in slide-in-from-top duration-200">
          {/* Tipo de gasto */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Tipo de gasto
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => toggleType('recurring')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filters.types.includes('recurring')
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-background text-muted-foreground hover:bg-accent border-2 border-border'
                }`}
              >
                Recurrentes
              </button>
              <button
                onClick={() => toggleType('oneTime')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filters.types.includes('oneTime')
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-background text-muted-foreground hover:bg-accent border-2 border-border'
                }`}
              >
                Únicos
              </button>
            </div>
          </div>

          {/* Frecuencia */}
          {filters.types.includes('recurring') && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Frecuencia
              </label>
              <div className="flex flex-wrap gap-2">
                {FREQUENCIES.map(freq => (
                  <button
                    key={freq.value}
                    onClick={() => toggleFrequency(freq.value)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      filters.frequencies.includes(freq.value)
                        ? 'bg-secondary text-secondary-foreground shadow-md'
                        : 'bg-background text-muted-foreground hover:bg-accent border-2 border-border'
                    }`}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bancos */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Banco
            </label>
            <div className="flex flex-wrap gap-2">
              {BANKS.map(bank => (
                <button
                  key={bank.value}
                  onClick={() => toggleBank(bank.value)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    filters.banks.includes(bank.value)
                      ? 'bg-accent text-accent-foreground shadow-md'
                      : 'bg-background text-muted-foreground hover:bg-accent border-2 border-border'
                  }`}
                >
                  {bank.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chips de filtros activos y contador */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-muted-foreground font-medium">
          {filteredCount === totalExpenses ? (
            <span>Mostrando {totalExpenses} {totalExpenses === 1 ? 'gasto' : 'gastos'}</span>
          ) : (
            <span>
              Mostrando <span className="text-primary font-bold">{filteredCount}</span> de {totalExpenses} gastos
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Chips de filtros activos (visual) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.searchQuery && (
            <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              "{filters.searchQuery}"
              <button
                onClick={() => updateFilters({ searchQuery: '' })}
                className="hover:bg-primary/20 rounded p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {filters.banks.map(bank => (
            <div key={bank} className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium flex items-center gap-2">
              {BANKS.find(b => b.value === bank)?.label}
              <button
                onClick={() => toggleBank(bank)}
                className="hover:bg-accent/80 rounded p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {filters.types.map(type => (
            <div key={type} className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium flex items-center gap-2">
              {type === 'recurring' ? 'Recurrentes' : 'Únicos'}
              <button
                onClick={() => toggleType(type)}
                className="hover:bg-secondary/80 rounded p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {filters.frequencies.map(freq => (
            <div key={freq} className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium flex items-center gap-2">
              {FREQUENCIES.find(f => f.value === freq)?.label}
              <button
                onClick={() => toggleFrequency(freq)}
                className="hover:bg-muted/80 rounded p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
