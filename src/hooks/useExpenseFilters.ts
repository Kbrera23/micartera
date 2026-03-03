// useExpenseFilters.ts
// Hook personalizado para filtrar y ordenar gastos

import { useMemo, useState } from 'react';
import { Expense, ExpenseFrequency, BankType } from '@/hooks/useSupabaseFinances';

export interface ExpenseFiltersState {
  searchQuery: string;
  banks: BankType[];
  types: ('recurring' | 'oneTime')[];
  frequencies: ExpenseFrequency[];
  sortBy: 'date' | 'amount' | 'name';
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_FILTERS: ExpenseFiltersState = {
  searchQuery: '',
  banks: [],
  types: [],
  frequencies: [],
  sortBy: 'date',
  sortOrder: 'desc',
};

export const useExpenseFilters = (expenses: Expense[]) => {
  const [filters, setFilters] = useState<ExpenseFiltersState>(DEFAULT_FILTERS);

  const filteredAndSortedExpenses = useMemo(() => {
    let result = [...expenses];

    // Filtrar por búsqueda
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(expense => 
        expense.name.toLowerCase().includes(query)
      );
    }

    // Filtrar por bancos
    if (filters.banks.length > 0) {
      result = result.filter(expense => 
        expense.bank && filters.banks.includes(expense.bank)
      );
    }

    // Filtrar por tipo (recurrente/único)
    if (filters.types.length > 0) {
      result = result.filter(expense => {
        if (filters.types.includes('recurring') && expense.is_recurring) return true;
        if (filters.types.includes('oneTime') && !expense.is_recurring) return true;
        return false;
      });
    }

    // Filtrar por frecuencia (solo para recurrentes)
    if (filters.frequencies.length > 0) {
      result = result.filter(expense => 
        expense.is_recurring && filters.frequencies.includes(expense.frequency)
      );
    }

    // Ordenar
    result.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case 'amount':
          comparison = b.amount - a.amount;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }

      return filters.sortOrder === 'asc' ? -comparison : comparison;
    });

    return result;
  }, [expenses, filters]);

  return {
    filters,
    setFilters,
    filteredExpenses: filteredAndSortedExpenses,
    totalCount: expenses.length,
    filteredCount: filteredAndSortedExpenses.length,
  };
};