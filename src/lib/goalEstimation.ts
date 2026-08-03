/**
 * Cálculo de estimaciones para objetivos de compra.
 *
 * Todo son funciones puras: dados los ingresos, los gastos y un objetivo,
 * calculan cuánto se ahorra al mes y en cuánto tiempo se alcanza la meta.
 * La app hace el cálculo (exacto); la IA, si se añade luego, solo redacta
 * la recomendación en lenguaje natural sobre estos números.
 *
 * Si tocas este archivo, ejecuta los tests antes de dar nada por bueno.
 */

/** Un gasto tal como llega de la tabla `expenses`. */
export interface GastoInput {
  amount: number;      // importe (positivo)
  created_at: string;  // fecha ISO
}

/** Clave AAAA-MM de una fecha ISO. */
const mesDe = (iso: string): string => (iso || '').slice(0, 7);

/**
 * Gasto medio mensual a partir del historial real.
 * Promedia el total gastado entre el número de meses DISTINTOS con datos,
 * no entre un número fijo — así un mes sin gastos no distorsiona a la baja.
 * Devuelve { medio, meses } donde `meses` permite avisar si hay pocos datos.
 */
export const gastoMedioMensual = (gastos: GastoInput[]): { medio: number; meses: number } => {
  if (!gastos || gastos.length === 0) return { medio: 0, meses: 0 };
  const porMes = new Map<string, number>();
  for (const g of gastos) {
    const m = mesDe(g.created_at);
    if (!m) continue;
    porMes.set(m, (porMes.get(m) || 0) + Math.abs(g.amount || 0));
  }
  const meses = porMes.size;
  if (meses === 0) return { medio: 0, meses: 0 };
  const total = Array.from(porMes.values()).reduce((s, v) => s + v, 0);
  return { medio: total / meses, meses };
};

/**
 * Ahorro mensual estimado = ingresos − gasto medio mensual.
 * Puede ser negativo (gastas más de lo que ingresas), y eso hay que mostrarlo
 * tal cual, no ocultarlo.
 */
export const ahorroMensual = (ingresoMensual: number, gastoMedio: number): number =>
  (ingresoMensual || 0) - (gastoMedio || 0);

export interface EstimacionObjetivo {
  faltante: number;          // cuánto queda por reunir
  ahorroMensual: number;     // ahorro estimado al mes
  mesesNecesarios: number | null;  // meses para llegar (null si no se puede)
  alcanzable: boolean;       // ¿se puede llegar ahorrando?
  cuotaParaFecha: number | null;   // €/mes para llegar en target_date (si se dio)
  pocosData: boolean;        // aviso: estimación provisional
}

/**
 * Estima un objetivo de compra.
 * - target: importe total del objetivo
 * - actual: lo ya reunido (current_amount)
 * - ahorro: ahorro mensual estimado
 * - mesesData: nº de meses de histórico (para el aviso de pocos datos)
 * - mesesHastaFecha: opcional, meses hasta la fecha objetivo (para la cuota)
 */
export const estimarObjetivo = (
  target: number,
  actual: number,
  ahorro: number,
  mesesData: number,
  mesesHastaFecha?: number | null
): EstimacionObjetivo => {
  const faltante = Math.max(0, (target || 0) - (actual || 0));
  const alcanzable = ahorro > 0 && faltante > 0;
  const mesesNecesarios = faltante === 0
    ? 0
    : (ahorro > 0 ? Math.ceil(faltante / ahorro) : null);
  const cuotaParaFecha = (mesesHastaFecha && mesesHastaFecha > 0 && faltante > 0)
    ? faltante / mesesHastaFecha
    : (faltante === 0 ? 0 : null);
  return {
    faltante,
    ahorroMensual: ahorro,
    mesesNecesarios,
    alcanzable,
    cuotaParaFecha,
    pocosData: mesesData > 0 && mesesData < 3,
  };
};

/** Meses enteros (redondeando hacia arriba) entre hoy y una fecha objetivo. */
export const mesesHasta = (fechaObjetivoISO: string, hoy: Date = new Date()): number | null => {
  if (!fechaObjetivoISO) return null;
  const objetivo = new Date(fechaObjetivoISO);
  if (isNaN(objetivo.getTime())) return null;
  const dias = (objetivo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
  if (dias <= 0) return 0;
  return Math.ceil(dias / 30);
};
