// Spanish currency formatting utilities

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatCurrencyCompact = (value: number): string => {
  return `${new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)}€`;
};

export const parseSpanishCurrency = (value: string): number => {
  // Remove currency symbol and spaces, convert Spanish format to number
  const cleaned = value.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

export const formatInputCurrency = (value: string): string => {
  const num = value.replace(/[^\d]/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('es-ES').format(Number(num));
};
