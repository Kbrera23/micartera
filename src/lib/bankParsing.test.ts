/**
 * Tests del parseo de extractos bancarios.
 *
 * Ejecutar con:  npm test
 *
 * Estos tests existen porque los errores de parseo NO dan pantalla de error:
 * simplemente hacen que los números salgan mal sin que nadie se entere.
 */
import { describe, it, expect } from 'vitest';
import {
  parseImporte,
  toSafeISODate,
  parseFechaCelda,
  categorizarGasto,
  esGasto,
} from './bankParsing';

describe('parseImporte — importes del banco', () => {
  it('formato español con miles y decimales', () => {
    expect(parseImporte('1.234,56')).toBe(1234.56);
    expect(parseImporte('2.500,00')).toBe(2500);
    expect(parseImporte('-1.234,56')).toBe(-1234.56);
  });

  it('formato español solo con decimales', () => {
    expect(parseImporte('45,90')).toBe(45.9);
    expect(parseImporte('-45,90')).toBe(-45.9);
    expect(parseImporte('0,99')).toBe(0.99);
    expect(parseImporte('950,00')).toBe(950);
  });

  it('miles sin decimales: 1.234 son mil doscientos treinta y cuatro', () => {
    expect(parseImporte('1.234')).toBe(1234);
    expect(parseImporte('-2.500')).toBe(-2500);
  });

  it('formato anglosajón (Revolut, N26)', () => {
    expect(parseImporte('1234.56')).toBe(1234.56);
    expect(parseImporte('12.50')).toBe(12.5);
    expect(parseImporte('-45.90')).toBe(-45.9);
  });

  it('limpia el símbolo de euro y los espacios', () => {
    expect(parseImporte('1.234,56 €')).toBe(1234.56);
    expect(parseImporte(' -45,90€ ')).toBe(-45.9);
  });

  it('valores vacíos o basura devuelven 0, nunca NaN', () => {
    expect(parseImporte('')).toBe(0);
    expect(parseImporte('   ')).toBe(0);
    expect(parseImporte('sin importe')).toBe(0);
  });

  // Este es el bug que tenía el importador antiguo: 12.50 se convertía en 1250
  it('NO multiplica por cien los decimales anglosajones', () => {
    expect(parseImporte('12.50')).not.toBe(1250);
    expect(parseImporte('0.99')).not.toBe(99);
  });
});

describe('toSafeISODate — el bug del cambio de mes', () => {
  it('el día 1 de marzo se guarda como marzo, no como febrero', () => {
    // Fecha creada en hora local (como la devuelve Excel con cellDates)
    const uno_de_marzo = new Date(2026, 2, 1);
    expect(toSafeISODate(uno_de_marzo)).toBe('2026-03-01T12:00:00.000Z');
    // Lo que hacía el código antiguo: .toISOString() -> 2026-02-28T23:00Z
    expect(toSafeISODate(uno_de_marzo).slice(0, 7)).toBe('2026-03');
  });

  it('el día 1 de enero se guarda en el año correcto', () => {
    const anio_nuevo = new Date(2026, 0, 1);
    expect(toSafeISODate(anio_nuevo)).toBe('2026-01-01T12:00:00.000Z');
    expect(toSafeISODate(anio_nuevo).slice(0, 4)).toBe('2026');
  });

  it('rellena con ceros los días y meses de una cifra', () => {
    expect(toSafeISODate(new Date(2026, 4, 7))).toBe('2026-05-07T12:00:00.000Z');
  });

  it('la hora es mediodía UTC, inmune a la zona horaria', () => {
    const d = new Date(2026, 6, 15);
    expect(toSafeISODate(d)).toContain('T12:00:00.000Z');
    // Mediodía UTC sigue siendo el mismo día en cualquier zona horaria
    expect(new Date(toSafeISODate(d)).getUTCDate()).toBe(15);
  });
});

describe('parseFechaCelda — fechas tal y como vienen del Excel', () => {
  it('acepta un objeto Date sin desplazar el día', () => {
    expect(parseFechaCelda(new Date(2026, 2, 1))).toBe('2026-03-01T12:00:00.000Z');
  });

  it('acepta texto DD/MM/AAAA', () => {
    expect(parseFechaCelda('01/03/2026')).toBe('2026-03-01T12:00:00.000Z');
    expect(parseFechaCelda('19/03/2026')).toBe('2026-03-19T12:00:00.000Z');
    expect(parseFechaCelda('20/03/2026')).toBe('2026-03-20T12:00:00.000Z');
  });

  it('acepta guiones y puntos como separador', () => {
    expect(parseFechaCelda('01-03-2026')).toBe('2026-03-01T12:00:00.000Z');
    expect(parseFechaCelda('01.03.2026')).toBe('2026-03-01T12:00:00.000Z');
  });

  it('acepta año de dos cifras', () => {
    expect(parseFechaCelda('01/03/26')).toBe('2026-03-01T12:00:00.000Z');
  });

  it('acepta el número de serie de Excel', () => {
    // 45717 = 1 de marzo de 2025 en el calendario de Excel
    const r = parseFechaCelda(45717);
    expect(r).not.toBeNull();
    expect(r!.slice(0, 10)).toBe('2025-03-01');
  });

  it('devuelve null (no la fecha de hoy) si no hay fecha válida', () => {
    expect(parseFechaCelda('')).toBeNull();
    expect(parseFechaCelda(null)).toBeNull();
    expect(parseFechaCelda(undefined)).toBeNull();
    expect(parseFechaCelda('sin fecha')).toBeNull();
    expect(parseFechaCelda('N/A')).toBeNull();
  });

  it('rechaza fechas imposibles en vez de inventárselas', () => {
    expect(parseFechaCelda('32/03/2026')).toBeNull();
    expect(parseFechaCelda('01/13/2026')).toBeNull();
    expect(parseFechaCelda('31/02/2026')).toBeNull(); // febrero no tiene 31
  });

  // Los días 19 y 20 fallaban en el importador antiguo
  it('los días 19 y 20 no se pierden', () => {
    expect(parseFechaCelda('19/03/2026')).not.toBeNull();
    expect(parseFechaCelda('20/03/2026')).not.toBeNull();
  });
});

describe('categorizarGasto — categorías automáticas', () => {
  it('reconoce comercios habituales', () => {
    expect(categorizarGasto('COMPRA EN MERCADONA').categoria).toBe('Alimentación');
    expect(categorizarGasto('NETFLIX.COM').categoria).toBe('Suscripción');
    expect(categorizarGasto('GASOLINERA REPSOL').categoria).toBe('Transporte');
    expect(categorizarGasto('FARMACIA CENTRAL').categoria).toBe('Salud');
    expect(categorizarGasto('ZARA ESPAÑA').categoria).toBe('Ropa');
  });

  it('Uber Eats es comida, Uber a secas es transporte', () => {
    expect(categorizarGasto('UBER EATS MADRID').categoria).toBe('Alimentación');
    expect(categorizarGasto('UBER TRIP').categoria).toBe('Transporte');
  });

  it('lo desconocido va a Otros y se marca como no automático', () => {
    const r = categorizarGasto('PAGO XYZ 4839');
    expect(r.categoria).toBe('Otros');
    expect(r.auto).toBe(false);
  });

  it('lo reconocido se marca como automático', () => {
    expect(categorizarGasto('MERCADONA').auto).toBe(true);
  });

  it('no revienta con concepto vacío', () => {
    expect(categorizarGasto('').categoria).toBe('Otros');
  });
});

describe('esGasto — solo importamos gastos, no ingresos', () => {
  it('los importes negativos son gastos', () => {
    expect(esGasto(-45.9)).toBe(true);
    expect(esGasto(-0.01)).toBe(true);
  });

  it('la nómina y las devoluciones NO son gastos', () => {
    expect(esGasto(1800)).toBe(false);
    expect(esGasto(0)).toBe(false);
  });

  it('los valores inválidos no son gastos', () => {
    expect(esGasto(NaN)).toBe(false);
    expect(esGasto(Infinity)).toBe(false);
  });
});
