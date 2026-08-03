/**
 * Funciones puras de parseo de extractos bancarios.
 *
 * Están aquí (y no dentro del componente) para poder testearlas.
 * Si tocas algo de este archivo, ejecuta `npm test` antes de dar nada por bueno.
 */

/** Categorías que maneja el importador. */
export const CATEGORIES = [
  { name: 'Alimentación',   icon: '🛒', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { name: 'Suplementación', icon: '💪', color: 'bg-lime-500/20 text-lime-300 border-lime-500/30' },
  { name: 'Transporte',     icon: '🚌', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { name: 'Suscripción',    icon: '📺', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { name: 'Viajes',         icon: '✈️', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { name: 'Salud',          icon: '💊', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { name: 'Ocio',           icon: '🎮', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { name: 'Vivienda',       icon: '🏠', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { name: 'Servicios',      icon: '💡', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  { name: 'Compras',        icon: '🛍️', color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' },
  { name: 'Ropa',           icon: '👕', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { name: 'Otros',          icon: '📁', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
] as const;

export type CategoryName = typeof CATEGORIES[number]['name'];

export const getCategoryMeta = (name: string) =>
  CATEGORIES.find(c => c.name === name) ?? CATEGORIES[CATEGORIES.length - 1];

export const CATEGORY_KEYWORDS: Record<Exclude<CategoryName, 'Otros'>, string[]> = {
  'Alimentación':   ['mercadona', 'alimentacion', 'alimentación', 'dia, s.a', 'dia,s.a', 'uber eats', 'ubereats', 'glovo', 'just eat', 'carrefour', 'lidl', 'aldi', 'supermercado', 'panaderia', 'panadería', 'fruteria', 'frutería'],
  'Suplementación': ['m i nutrition', 'mi nutrition', 'myprotein', 'prozis', 'suplementos', 'suplementacion', 'suplementación', 'nutricion', 'nutrición'],
  'Transporte':     ['gasolina', 'moeve', 'repsol', 'cepsa', 'shell', 'galp', 'gasolinera', 'combustible', 'repostaje', 'taxi', 'metro', 'renfe', 'cabify', 'villargordo cab', 'bolt', 'peaje', 'autopista', 'parking', 'aparcamiento', 'itv'],
  'Suscripción':    ['netflix', 'crunchyroll', 'disney', 'spotify', 'hbo', 'prime video', 'apple tv', 'apple music', 'apple.com/bill', 'youtube premium', 'streaming'],
  'Viajes':         ['nuitee', 'booking', 'airbnb', 'hotel', 'trivago', 'expedia', 'iberia', 'ryanair', 'vueling'],
  'Salud':          ['farmacia', 'clinica', 'clínica', 'medico', 'médico', 'hospital', 'dentista', 'salud'],
  'Ocio':           ['acorde cafe', 'acorde café', 'cafe', 'café', 'duo barbers', 'barbers', 'barberia', 'barbería', 'peluqueria', 'peluquería', 'mcdonald', 'burger king', 'kfc', 'restaurante', 'bar ', 'cine', 'teatro', 'concierto', 'gym', 'gimnasio'],
  'Vivienda':       ['alquiler', 'hipoteca', 'arrendamientos', 'arrendamiento', 'recibo ay', 'comunidad propietarios'],
  'Servicios':      ['internet', 'movistar', 'vodafone', 'orange ', 'telefonica', 'telefónica', 'endesa', 'iberdrola', 'naturgy', 'aguas', 'canal isabel', 'cetelem', 'recibo ', ' luz ', ' gas ', ' agua '],
  'Compras':        ['amazon', 'ebay', 'aliexpress', 'fnac', 'mediamarkt', 'leroy merlin', 'ikea', 'bricomart'],
  'Ropa':           ['zara', 'zalando', 'shein', 'mango', 'primark', 'h&m', 'pull&bear', 'bershka', 'decathlon'],
};

/**
 * Convierte el importe de texto del banco a número.
 *
 * Maneja formato español (1.234,56) y anglosajón (1234.56), y el caso
 * ambiguo de los miles sin decimales (1.234 -> 1234).
 */
export const parseImporte = (raw: string): number => {
  if (!raw) return 0;
  let str = String(raw).trim();
  str = str.replace(/[€\s]/g, '');
  if (str.includes(',')) {
    // Formato español: los puntos son miles, la coma es decimal
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    // Sin coma: un punto seguido de 3 dígitos es separador de miles (1.234)
    const parts = str.split('.');
    if (parts.length === 2 && parts[1].length === 3) {
      str = str.replace('.', '');
    }
  }
  return parseFloat(str) || 0;
};

/**
 * Convierte una fecha a texto ISO SIN que se desplace de día.
 *
 * Ojo: usar d.toISOString() directamente es un bug. En España (UTC+1/+2)
 * una fecha creada a medianoche local se convierte al día ANTERIOR a las
 * 22:00/23:00 UTC, y el gasto acaba contando en el mes equivocado.
 * Por eso construimos el texto con los componentes locales y fijamos
 * la hora a mediodía UTC, que es inmune a cualquier zona horaria.
 */
export const toSafeISODate = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T12:00:00.000Z`;
};

/**
 * Interpreta la celda de fecha de un Excel bancario.
 *
 * Acepta: objeto Date (cellDates), texto DD/MM/AAAA o DD-MM-AA,
 * y número de serie de Excel. Devuelve null si no es una fecha válida
 * (importante: null significa "no se sabe", NO "hoy").
 */
export const parseFechaCelda = (valor: unknown): string | null => {
  if (valor === null || valor === undefined || valor === '') return null;

  // 1) Objeto Date (xlsx con cellDates: true)
  if (valor instanceof Date) {
    return isNaN(valor.getTime()) ? null : toSafeISODate(valor);
  }

  // 2) Número de serie de Excel (días desde 30/12/1899)
  if (typeof valor === 'number' && isFinite(valor) && valor > 0) {
    const d = new Date(Date.UTC(1899, 11, 30));
    d.setUTCDate(d.getUTCDate() + Math.floor(valor));
    return isNaN(d.getTime())
      ? null
      : `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}T12:00:00.000Z`;
  }

  // 3) Texto: DD/MM/AAAA, DD-MM-AA, DD.MM.AAAA
  const str = String(valor).trim();
  const m = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (!m) return null;

  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const anio = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);

  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) return null;

  // Construimos con componentes numéricos (nunca desde cadena) y
  // comprobamos que la fecha existe de verdad (31 de febrero, etc.)
  const d = new Date(anio, mes - 1, dia);
  if (d.getFullYear() !== anio || d.getMonth() !== mes - 1 || d.getDate() !== dia) {
    return null;
  }
  return toSafeISODate(d);
};

/** Asigna categoría automáticamente según el concepto del movimiento. */
export const categorizarGasto = (concepto: string): { categoria: CategoryName; auto: boolean } => {
  const raw = ` ${(concepto || '').toLowerCase()} `;
  // Guardas específicas: "Uber Eats" gana a "Uber"
  if (/uber\s*eats|uber-eats|ubereats/.test(raw)) return { categoria: 'Alimentación', auto: true };
  if (/\buber\b/.test(raw) && !/eats/.test(raw)) return { categoria: 'Transporte', auto: true };
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS) as [CategoryName, string[]][]) {
    if (kws.some(k => raw.includes(k))) return { categoria: cat, auto: true };
  }
  return { categoria: 'Otros', auto: false };
};

/** ¿Es un gasto? En los extractos los gastos son importes negativos. */
export const esGasto = (importe: number): boolean =>
  !isNaN(importe) && isFinite(importe) && importe < 0;
