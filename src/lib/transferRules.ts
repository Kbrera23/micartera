/**
 * Detección de transferencias internas (Modelo A).
 *
 * Una "transferencia interna" es un movimiento de salida del extracto de Santander
 * que NO es un gasto, sino dinero que mueves a otra de tus cuentas (ahorro en La Caixa,
 * provisión del entrenador en Revolut, domiciliaciones en ING...).
 *
 * Se reconoce por coincidencia de texto en el concepto contra las reglas que el
 * usuario ha guardado en `transfer_rules`. Cada regla dice, además del banco destino,
 * a qué "cubo" (tipo) alimenta: ese tipo es el que usa `savings_log` y el que la
 * fórmula del Dinero Libre resta.
 */

export type BancoDestino = 'lacaixa' | 'revolut' | 'ing' | 'bbva';

export interface TransferRule {
  patron_concepto: string;
  banco_destino: string;
  /** Cubo de savings_log al que alimenta: 'ahorro_personal' | 'entrenador' | 'domiciliacion' | ... */
  etiqueta: string | null;
  activa?: boolean;
}

export interface TransferMatch {
  banco: string;
  /** tipo/cubo de savings_log */
  tipo: string;
}

const norm = (s: string): string =>
  (s || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Normaliza el nombre de un banco a las claves canónicas usadas en toda la app
 * (las mismas de BankType). Admite variantes como 'caixa'/'caixabank' → 'lacaixa'.
 */
export const normalizarBanco = (banco: string | null | undefined): string => {
  const b = norm(String(banco || ''));
  if (b.includes('CAIXA')) return 'lacaixa';
  if (b.includes('REVOLUT')) return 'revolut';
  if (b === 'ING' || b.includes('ING')) return 'ing';
  if (b.includes('BBVA')) return 'bbva';
  if (b.includes('SANTANDER')) return 'santander';
  return b.toLowerCase();
};

/**
 * Devuelve la transferencia detectada para un concepto, o null si no coincide
 * con ninguna regla activa. Si varias reglas coinciden, gana la de patrón más
 * largo (la más específica).
 */
export const detectarTransferencia = (
  concepto: string,
  reglas: TransferRule[],
): TransferMatch | null => {
  const c = norm(concepto);
  if (!c) return null;

  let mejor: { regla: TransferRule; len: number } | null = null;
  for (const regla of reglas) {
    if (regla.activa === false) continue;
    const patron = norm(regla.patron_concepto);
    if (!patron) continue;
    if (c.includes(patron)) {
      if (!mejor || patron.length > mejor.len) {
        mejor = { regla, len: patron.length };
      }
    }
  }

  if (!mejor) return null;
  return {
    banco: normalizarBanco(mejor.regla.banco_destino),
    tipo: (mejor.regla.etiqueta || 'transferencia').trim() || 'transferencia',
  };
};
