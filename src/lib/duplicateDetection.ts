/** Normaliza un concepto para poder compararlo: sin tildes, sin signos, en minúsculas. */
export const normalizarConcepto = (s: string): string =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Día (AAAA-MM-DD) de una fecha ISO, o null si no hay fecha. */
export const diaDe = (iso: string | null | undefined): string | null =>
  iso ? iso.slice(0, 10) : null;

export interface MovimientoComparable {
  concepto: string;
  importe: number;
  fecha: string | null;
}

/**
 * Dos movimientos son el mismo si coinciden importe y día,
 * y el concepto es igual o uno empieza por los 15 primeros
 * caracteres del otro (los bancos truncan de formas distintas).
 */
export const esMismoMovimiento = (
  a: MovimientoComparable,
  b: MovimientoComparable
): boolean => {
  if (Math.abs(a.importe - b.importe) > 0.005) return false;
  const da = diaDe(a.fecha);
  const db = diaDe(b.fecha);
  if (!da || !db || da !== db) return false;
  const na = normalizarConcepto(a.concepto);
  const nb = normalizarConcepto(b.concepto);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.startsWith(nb.slice(0, 15)) || nb.startsWith(na.slice(0, 15));
};
