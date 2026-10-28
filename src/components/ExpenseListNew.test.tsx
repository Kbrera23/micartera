import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExpenseListNew } from './ExpenseListNew';
import type { Expense } from '@/hooks/useSupabaseFinances';

const expenses: Expense[] = ['a', 'b', 'c'].map((id, index) => ({
  id,
  user_id: 'test-user',
  name: `Gasto ${id}`,
  amount: index + 1,
  is_recurring: false,
  frequency: 'monthly',
  bank: null,
  created_at: '2026-10-28T10:00:00Z',
}));

afterEach(cleanup);

const setup = () => {
  const onRemove = vi.fn();
  const props = { title: 'Gastos Únicos', expenses, total: 6, isRecurring: false, onRemove };
  const view = render(<ExpenseListNew {...props} />);
  const openList = () => fireEvent.click(screen.getByRole('button', { name: /Gastos Únicos/ }));
  return { ...view, props, onRemove, openList };
};

describe('selección y borrado de gastos', () => {
  it('no elimina ningún gasto al cancelar la confirmación', () => {
    const { onRemove, openList } = setup();
    openList();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar Gasto a' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar seleccionados' }));
    expect(onRemove).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }));
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('elimina una vez cada id seleccionado y ninguno sin seleccionar al confirmar', () => {
    const { onRemove, openList } = setup();
    openList();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar Gasto a' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar Gasto c' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar seleccionados' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }));
    expect(onRemove.mock.calls).toEqual([['a'], ['c']]);
    fireEvent.click(screen.getByRole('button', { name: /Gastos Únicos/ }));
    openList();
    expect(screen.getByRole('checkbox', { name: 'Seleccionar Gasto a' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Seleccionar Gasto c' })).not.toBeChecked();
  });

  it('seleccionar todo incluye todos los gastos de esta lista', () => {
    const { onRemove, openList } = setup();
    openList();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar todo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar seleccionados' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }));
    expect(onRemove.mock.calls).toEqual([['a'], ['b'], ['c']]);
  });

  it('quitar selección vacía los ids sin borrar gastos', () => {
    const { onRemove, openList } = setup();
    openList();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar todo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Quitar selección' }));
    for (const expense of expenses) {
      expect(screen.getByRole('checkbox', { name: `Seleccionar ${expense.name}` })).not.toBeChecked();
    }
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('retira de la selección los gastos que ya no están en la lista', () => {
    const { onRemove, openList, rerender, props } = setup();
    openList();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar todo' }));
    rerender(<ExpenseListNew {...props} expenses={expenses.slice(1)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar seleccionados' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }));
    expect(onRemove.mock.calls).toEqual([['b'], ['c']]);
  });
});