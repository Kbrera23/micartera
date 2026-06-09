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
  // Accept Spanish/European decimal format: digits and a single comma with up to 2 decimals.
  // Treat a dot as a comma (user convenience), then strip everything else.
  const cleaned = value.replace(/\./g, ',').replace(/[^\d,]/g, '');
  if (!cleaned) return '';

  // Keep only the first comma; drop the rest.
  const firstComma = cleaned.indexOf(',');
  let intPart = '';
  let decPart = '';
  if (firstComma === -1) {
    intPart = cleaned;
  } else {
    intPart = cleaned.slice(0, firstComma);
    decPart = cleaned.slice(firstComma + 1).replace(/,/g, '').slice(0, 2);
  }

  // Strip leading zeros on integer part but keep at least one digit.
  intPart = intPart.replace(/^0+(?=\d)/, '');
  const intFormatted = intPart ? new Intl.NumberFormat('es-ES').format(Number(intPart)) : '0';

  if (firstComma === -1) return intFormatted;
  return `${intFormatted},${decPart}`;
};

export const parseInputCurrency = (value: string): number => {
  if (!value) return 0;
  const cleaned = value.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};
