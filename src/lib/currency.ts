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
  // European format: '.' = thousands separator, ',' = decimal separator.
  // Strip everything except digits, dots and commas.
  const cleaned = value.replace(/[^\d.,]/g, '');
  if (!cleaned) return '';

  // Split on the FIRST comma → decimals. Everything before = integer part (may contain dots as thousands).
  const firstComma = cleaned.indexOf(',');
  let intRaw = '';
  let decPart = '';
  if (firstComma === -1) {
    intRaw = cleaned;
  } else {
    intRaw = cleaned.slice(0, firstComma);
    // Drop any further commas/dots in decimal portion, keep max 2 digits.
    decPart = cleaned.slice(firstComma + 1).replace(/[^\d]/g, '').slice(0, 2);
  }

  // Remove dots from integer part (they were just thousand separators) and strip leading zeros.
  const intDigits = intRaw.replace(/\./g, '').replace(/^0+(?=\d)/, '');
  const intFormatted = intDigits ? new Intl.NumberFormat('es-ES').format(Number(intDigits)) : '0';

  if (firstComma === -1) return intFormatted;
  return `${intFormatted},${decPart}`;
};

export const parseInputCurrency = (value: string): number => {
  if (!value) return 0;
  // Remove currency symbols/spaces, drop dots (thousands), convert comma → dot.
  const cleaned = value.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};
