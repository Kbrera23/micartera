/**
 * Extracción del "comercio" a partir del concepto sucio de un extracto bancario,
 * y utilidades para las reglas de categorización aprendidas del usuario.
 *
 * La idea: cuando el usuario corrige a mano la categoría de un gasto, la app
 * propone recordar una regla "comercio -> categoría". Esta función saca el
 * comercio del concepto. No es perfecta (los extractos son un caos), por eso
 * en la interfaz el usuario confirma o ajusta la propuesta antes de guardarla.
 *
 * Si tocas este archivo, ejecuta los tests antes de dar nada por bueno.
 */

/** Palabras de relleno que NO identifican al comercio. */
const RUIDO = new Set([
  'pago', 'tarjeta', 'tarj', 'compra', 'en', 'con', 'recibo', 'domiciliacion',
  'domiciliación', 'transferencia', 'transf', 'bizum', 'favor', 'de', 'del',
  'la', 'el', 'los', 'las', 'op', 'ref', 'movimiento', 'cargo', 'adeudo',
  'liquidacion', 'liquidación', 'comision', 'comisión', 'sa', 'sl', 'sau',
  'slu', 'www', 'http', 'https', 'com', 'es', 'cliente', 'clientes', 'online',
  'contactless',
]);

/** Lugares frecuentes que ensucian el concepto (muestra ampliable). */
const LUGARES = new Set([
  'sevilla', 'madrid', 'barcelona', 'valencia', 'malaga', 'málaga', 'nervion',
  'nervión', 'este', 'oeste', 'centro', 'sur', 'norte', 'espana', 'españa',
]);

/**
 * Extrae el nombre del comercio de un concepto bancario.
 * Devuelve hasta dos palabras en MAYÚSCULAS, o cadena vacía si no encuentra nada.
 */
export const extraerComercio = (concepto: string): string => {
  let s = (concepto || '').toLowerCase();
  s = s.replace(/https?:\/\/\S+/g, ' ');           // urls
  s = s.replace(/\.(com|es|net|org)\b/g, ' ');      // dominios (deja la palabra de delante)
  s = s.replace(/\d{1,2}[/\-.]\d{1,2}([/\-.]\d{2,4})?/g, ' '); // fechas
  s = s.replace(/\d{1,2}:\d{2}/g, ' ');             // horas
  s = s.replace(/\d{2,}/g, ' ');                     // números largos (refs, tarjetas)
  s = s.replace(/[^a-záéíóúñ ]/gi, ' ');            // signos
  const tokens = s.split(/\s+/).filter(Boolean)
    .filter(t => !RUIDO.has(t) && !LUGARES.has(t) && t.length > 2);
  return tokens.slice(0, 2).join(' ').toUpperCase().trim();
};

/** Una regla aprendida: si el concepto contiene `comercio`, es de `categoria`. */
export interface CategoryRule {
  comercio: string;   // en mayúsculas, ya normalizado
  categoria: string;
}

/**
 * Busca entre las reglas del usuario una que aplique al concepto dado.
 * Las reglas del usuario tienen prioridad sobre la categorización genérica.
 * Devuelve la categoría aprendida o null si ninguna regla coincide.
 */
export const categoriaPorReglas = (
  concepto: string,
  reglas: CategoryRule[]
): string | null => {
  const c = (concepto || '').toUpperCase();
  for (const r of reglas) {
    if (r.comercio && c.includes(r.comercio.toUpperCase())) return r.categoria;
  }
  return null;
};
