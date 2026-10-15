import { describe, it, expect } from 'vitest';
import { detectarTransferencia, normalizarBanco, TransferRule } from './transferRules';

const reglas: TransferRule[] = [
  { patron_concepto: 'TRASPASO A CAIXA', banco_destino: 'lacaixa', etiqueta: 'ahorro_personal' },
  { patron_concepto: 'ENTRENADOR', banco_destino: 'revolut', etiqueta: 'entrenador' },
  { patron_concepto: 'NETFLIX', banco_destino: 'ing', etiqueta: 'domiciliacion' },
  { patron_concepto: 'DIGI', banco_destino: 'ing', etiqueta: 'domiciliacion' },
];

describe('normalizarBanco', () => {
  it('mapea variantes de Caixa a lacaixa', () => {
    expect(normalizarBanco('caixa')).toBe('lacaixa');
    expect(normalizarBanco('CaixaBank')).toBe('lacaixa');
    expect(normalizarBanco('lacaixa')).toBe('lacaixa');
  });
  it('reconoce el resto de bancos', () => {
    expect(normalizarBanco('Revolut')).toBe('revolut');
    expect(normalizarBanco('ING')).toBe('ing');
    expect(normalizarBanco('BBVA')).toBe('bbva');
  });
});

describe('detectarTransferencia', () => {
  it('detecta un traspaso a ahorro', () => {
    const m = detectarTransferencia('Transferencia a Caixa, concepto Traspaso a Caixa ahorro', reglas);
    expect(m).toEqual({ banco: 'lacaixa', tipo: 'ahorro_personal' });
  });

  it('detecta la provision del entrenador', () => {
    const m = detectarTransferencia('BIZUM A ENTRENADOR PERSONAL', reglas);
    expect(m).toEqual({ banco: 'revolut', tipo: 'entrenador' });
  });

  it('detecta domiciliaciones a ING', () => {
    expect(detectarTransferencia('Pago Netflix suscripcion', reglas)?.banco).toBe('ing');
    expect(detectarTransferencia('Recibo DIGI movil', reglas)?.tipo).toBe('domiciliacion');
  });

  it('ignora conceptos que no coinciden', () => {
    expect(detectarTransferencia('Compra en Mercadona', reglas)).toBeNull();
    expect(detectarTransferencia('', reglas)).toBeNull();
  });

  it('respeta reglas desactivadas', () => {
    const r: TransferRule[] = [{ patron_concepto: 'CAIXA', banco_destino: 'lacaixa', etiqueta: 'ahorro_personal', activa: false }];
    expect(detectarTransferencia('Traspaso a Caixa', r)).toBeNull();
  });

  it('es insensible a tildes y mayusculas', () => {
    expect(detectarTransferencia('entrenadór', reglas)?.banco).toBe('revolut');
  });

  it('con varias coincidencias gana el patron mas especifico', () => {
    const r: TransferRule[] = [
      { patron_concepto: 'PAGO', banco_destino: 'ing', etiqueta: 'domiciliacion' },
      { patron_concepto: 'PAGO ENTRENADOR', banco_destino: 'revolut', etiqueta: 'entrenador' },
    ];
    expect(detectarTransferencia('Pago Entrenador trimestre', r)?.banco).toBe('revolut');
  });
});
