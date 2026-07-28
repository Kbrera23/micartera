/**
 * Tests de la detección de duplicados del importador bancario.
 * Ejecutar con:  npm test
 */
import { describe, it, expect } from 'vitest';
import {
  normalizarConcepto,
  diaDe,
  esMismoMovimiento,
} from './duplicateDetection';

describe('normalizarConcepto', () => {
  it('quita tildes, signos y mayúsculas', () => {
    expect(normalizarConcepto('COMPRA en MERCADóna')).toBe('compra en mercadona');
    expect(normalizarConcepto('Farmacia, S.L.')).toBe('farmacia s l');
  });

  it('colapsa espacios múltiples', () => {
    expect(normalizarConcepto('pago    con   tarjeta')).toBe('pago con tarjeta');
  });

  it('no revienta con vacío o null', () => {
    expect(normalizarConcepto('')).toBe('');
    // @ts-expect-error probamos entrada inválida a propósito
    expect(normalizarConcepto(null)).toBe('');
  });
});

describe('diaDe', () => {
  it('extrae el día de una fecha ISO', () => {
    expect(diaDe('2026-03-01T12:00:00.000Z')).toBe('2026-03-01');
  });
  it('devuelve null si no hay fecha', () => {
    expect(diaDe(null)).toBeNull();
    expect(diaDe(undefined)).toBeNull();
  });
});

describe('esMismoMovimiento — detección de duplicados', () => {
  const base = { concepto: 'COMPRA MERCADONA', importe: -45.9, fecha: '2026-03-01T12:00:00.000Z' };

  it('mismo importe, día y concepto = duplicado', () => {
    expect(esMismoMovimiento(base, { ...base })).toBe(true);
  });

  it('detecta concepto truncado por el banco (15 primeros caracteres)', () => {
    const largo = { ...base, concepto: 'COMPRA MERCADONA CENTRO SEVILLA 4021' };
    const corto = { ...base, concepto: 'COMPRA MERCADONA' };
    expect(esMismoMovimiento(largo, corto)).toBe(true);
  });

  it('ignora tildes y mayúsculas al comparar conceptos', () => {
    const a = { ...base, concepto: 'FARMÁCIA CENTRAL' };
    const b = { ...base, concepto: 'farmacia central' };
    expect(esMismoMovimiento(a, b)).toBe(true);
  });

  it('distinto importe = NO duplicado', () => {
    expect(esMismoMovimiento(base, { ...base, importe: -45.91 })).toBe(false);
  });

  it('tolera diferencia de medio céntimo por redondeo', () => {
    expect(esMismoMovimiento(base, { ...base, importe: -45.904 })).toBe(true);
  });

  it('distinto día = NO duplicado (criterio conservador)', () => {
    expect(esMismoMovimiento(base, { ...base, fecha: '2026-03-02T12:00:00.000Z' })).toBe(false);
  });

  it('mismo día aunque la hora difiera', () => {
    const a = { ...base, fecha: '2026-03-01T08:00:00.000Z' };
    const b = { ...base, fecha: '2026-03-01T22:00:00.000Z' };
    expect(esMismoMovimiento(a, b)).toBe(true);
  });

  it('sin fecha en alguno = NO duplicado (no arriesga)', () => {
    expect(esMismoMovimiento(base, { ...base, fecha: null })).toBe(false);
    expect(esMismoMovimiento({ ...base, fecha: null }, { ...base, fecha: null })).toBe(false);
  });

  it('conceptos totalmente distintos = NO duplicado', () => {
    expect(esMismoMovimiento(base, { ...base, concepto: 'NETFLIX' })).toBe(false);
  });

  it('dos cafés reales del mismo importe en días distintos NO se confunden', () => {
    const dia1 = { concepto: 'CAFETERIA ACORDE', importe: -3.5, fecha: '2026-03-01T12:00:00.000Z' };
    const dia2 = { concepto: 'CAFETERIA ACORDE', importe: -3.5, fecha: '2026-03-02T12:00:00.000Z' };
    expect(esMismoMovimiento(dia1, dia2)).toBe(false);
  });
});
