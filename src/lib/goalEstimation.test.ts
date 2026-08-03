/**
 * Tests del cálculo de estimaciones de objetivos.
 * Ejecutar con: bun run test
 */
import { describe, it, expect } from 'vitest';
import {
  gastoMedioMensual,
  ahorroMensual,
  estimarObjetivo,
  mesesHasta,
} from './goalEstimation';

describe('gastoMedioMensual', () => {
  it('promedia entre los meses distintos con datos', () => {
    const gastos = [
      { amount: 100, created_at: '2026-01-05T12:00:00Z' },
      { amount: 200, created_at: '2026-01-20T12:00:00Z' }, // enero: 300
      { amount: 500, created_at: '2026-02-10T12:00:00Z' }, // febrero: 500
    ];
    const r = gastoMedioMensual(gastos);
    expect(r.meses).toBe(2);
    expect(r.medio).toBe(400); // (300 + 500) / 2
  });

  it('usa el valor absoluto de los importes', () => {
    const gastos = [{ amount: -50, created_at: '2026-01-01T12:00:00Z' }];
    expect(gastoMedioMensual(gastos).medio).toBe(50);
  });

  it('sin gastos devuelve 0 meses', () => {
    expect(gastoMedioMensual([])).toEqual({ medio: 0, meses: 0 });
  });
});

describe('ahorroMensual', () => {
  it('ingresos menos gasto medio', () => {
    expect(ahorroMensual(1800, 1200)).toBe(600);
  });
  it('puede ser negativo si se gasta de más', () => {
    expect(ahorroMensual(1000, 1300)).toBe(-300);
  });
});

describe('estimarObjetivo', () => {
  it('iPhone de 1200€ ahorrando 200/mes → 6 meses', () => {
    const e = estimarObjetivo(1200, 0, 200, 6);
    expect(e.mesesNecesarios).toBe(6);
    expect(e.alcanzable).toBe(true);
    expect(e.faltante).toBe(1200);
  });

  it('descuenta lo ya reunido', () => {
    const e = estimarObjetivo(1200, 400, 200, 6);
    expect(e.faltante).toBe(800);
    expect(e.mesesNecesarios).toBe(4);
  });

  it('redondea meses hacia arriba', () => {
    const e = estimarObjetivo(1000, 0, 300, 6);
    expect(e.mesesNecesarios).toBe(4); // 1000/300 = 3,33 → 4
  });

  it('si no se ahorra (ahorro ≤ 0), no es alcanzable y meses null', () => {
    const e = estimarObjetivo(1200, 0, -100, 6);
    expect(e.alcanzable).toBe(false);
    expect(e.mesesNecesarios).toBeNull();
  });

  it('objetivo ya cubierto → 0 meses', () => {
    const e = estimarObjetivo(500, 500, 200, 6);
    expect(e.faltante).toBe(0);
    expect(e.mesesNecesarios).toBe(0);
  });

  it('calcula la cuota para una fecha concreta', () => {
    const e = estimarObjetivo(1200, 0, 200, 6, 4);
    expect(e.cuotaParaFecha).toBe(300); // 1200 / 4 meses
  });

  it('marca pocosData con menos de 3 meses de histórico', () => {
    expect(estimarObjetivo(1200, 0, 200, 2).pocosData).toBe(true);
    expect(estimarObjetivo(1200, 0, 200, 5).pocosData).toBe(false);
  });
});

describe('mesesHasta', () => {
  it('calcula meses hasta una fecha futura', () => {
    const hoy = new Date('2026-01-01T00:00:00Z');
    expect(mesesHasta('2026-07-01', hoy)).toBe(7); // ~181 días / 30 → 7
  });
  it('fecha pasada o de hoy → 0', () => {
    const hoy = new Date('2026-07-01T00:00:00Z');
    expect(mesesHasta('2026-01-01', hoy)).toBe(0);
  });
  it('fecha inválida → null', () => {
    expect(mesesHasta('')).toBeNull();
    expect(mesesHasta('no es fecha')).toBeNull();
  });
});
