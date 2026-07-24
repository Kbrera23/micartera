import { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Check, X, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

import {
  CATEGORIES,
  CategoryName,
  getCategoryMeta,
  categorizarGasto,
  parseImporte,
  parseFechaCelda,
  esGasto,
} from '@/lib/bankParsing';
import { esMismoMovimiento } from '@/lib/duplicateDetection';


const STOPWORDS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'en', 'a', 'y', 'es']);
const capitalizeWords = (s: string) =>
  s.toLowerCase().split(/\s+/).map((w, i) => {
    if (!w) return w;
    if (i > 0 && STOPWORDS.has(w)) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');

const limpiarConcepto = (concepto: string): string => {
  let t = (concepto || '').trim();

  // Bizum: extract person name
  const bizumMatch = t.match(/bizum\s+(?:de|a|recibido de|enviado a)?\s*[:\-]?\s*([a-záéíóúñA-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s]{2,40})/i);
  if (/bizum/i.test(t) && bizumMatch) {
    const nombre = capitalizeWords(bizumMatch[1].trim().replace(/[,\.].*$/, '').trim());
    return `Bizum ${nombre}`.slice(0, 35);
  }

  // Remove card refs
  t = t.replace(/,?\s*tarj\.?:?\s*\*?\d+/gi, '');
  t = t.replace(/\btarj\s*\*?\d+/gi, '');

  // Remove common bank prefixes
  t = t.replace(/\b(pago\s+movil\s+en|pago\s+móvil\s+en|compra\s+en|pago\s+en|bizum\s+de|bizum\s+a|recibo\s+de|recibo|transferencia\s+a|transferencia\s+de|transferencia)\b/gi, '');

  // Remove the word "concepto" and stray "es," city codes
  t = t.replace(/\bconcepto\b[:\s]*/gi, '');
  t = t.replace(/\bes\s*,/gi, ',');
  t = t.replace(/\b[a-záéíóúñ]+\s+es\b\s*,?/gi, m => /,/.test(m) ? ',' : ' ');

  // Cleanup separators
  t = t.replace(/[,;]+/g, ' ');
  t = t.replace(/\s{2,}/g, ' ').trim();
  t = t.replace(/^[,\s\-]+|[,\s\-]+$/g, '');

  if (!t) return concepto.slice(0, 35);

  t = capitalizeWords(t);

  if (t.length > 35) t = t.slice(0, 34).trimEnd() + '…';
  return t;
};

interface Movimiento {
  id: string;
  concepto: string;
  conceptoOriginal: string;
  importe: number;
  fecha: string | null;
  categoria: CategoryName;
  autoCategorized: boolean;
  duplicado: boolean;
  incluir: boolean;
}

const parseExcelFile = async (file: File): Promise<Movimiento[]> => {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  if (!rows.length) throw new Error('El archivo no contiene movimientos');

  let headerRowIdx = -1, conceptoIdx = -1, importeIdx = -1, fechaIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i].map(c => String(c || '').toUpperCase().trim());
    const cIdx = row.findIndex(c => c.includes('CONCEPTO') || c.includes('DESCRIPCI'));
    const iIdx = row.findIndex(c => c.includes('IMPORTE'));
    if (cIdx !== -1 && iIdx !== -1) {
      headerRowIdx = i; conceptoIdx = cIdx; importeIdx = iIdx;
      fechaIdx = row.findIndex(c => c.includes('FECHA'));
      break;
    }
  }
  if (headerRowIdx === -1) throw new Error('Formato de Excel no reconocido');

  const movimientos: Movimiento[] = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row?.length) continue;
    const concepto = String(row[conceptoIdx] || '').trim();
    const importeRaw = String(row[importeIdx] || '').trim();
    if (!concepto || !importeRaw) continue;
    const importe = parseImporte(importeRaw);
    if (!esGasto(importe)) continue;

    const fecha = fechaIdx !== -1 ? parseFechaCelda(row[fechaIdx]) : null;

    const cat = categorizarGasto(concepto);
    movimientos.push({
      id: `${i}-${Math.random().toString(36).slice(2, 8)}`,
      concepto: limpiarConcepto(concepto),
      conceptoOriginal: concepto,
      importe: Math.abs(importe),
      fecha,
      categoria: cat.categoria,
      autoCategorized: cat.auto,
      duplicado: false,
      incluir: true,
    });
  }
  if (!movimientos.length) throw new Error('El archivo no contiene movimientos');
  return movimientos;
};


interface Props { onImported?: () => void; }

export const BankExcelImporter = ({ onImported }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => { setFile(null); setMovimientos([]); setProcessing(false); setSaving(false); };
  const handleClose = (o: boolean) => { setOpen(o); if (!o) reset(); };

  const validateAndSetFile = (f: File) => {
    const name = f.name.toLowerCase();
    if (!name.endsWith('.xls') && !name.endsWith('.xlsx')) { toast.error('Solo se permiten archivos .xls o .xlsx'); return; }
    setFile(f); setMovimientos([]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSetFile(f);
  }, []);

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const movs = await parseExcelFile(file);

      // Marcar duplicados dentro del propio archivo
      for (let i = 0; i < movs.length; i++) {
        if (movs[i].duplicado) continue;
        for (let j = i + 1; j < movs.length; j++) {
          if (movs[j].duplicado) continue;
          if (esMismoMovimiento(movs[i], movs[j])) {
            movs[j].duplicado = true;
            movs[j].incluir = false;
          }
        }
      }

      // Comprobar duplicados contra la BD
      if (user) {
        try {
          const fechas = movs.map(m => m.fecha).filter((f): f is string => !!f).sort();
          if (fechas.length) {
            const minDate = new Date(fechas[0]);
            const maxDate = new Date(fechas[fechas.length - 1]);
            minDate.setDate(minDate.getDate() - 1);
            maxDate.setDate(maxDate.getDate() + 1);
            const { data, error } = await supabase
              .from('expenses')
              .select('name, amount, created_at')
              .eq('user_id', user.id)
              .gte('created_at', minDate.toISOString())
              .lte('created_at', maxDate.toISOString());
            if (error) throw error;
            const existentes = (data || []).map(e => ({
              concepto: e.name as string,
              importe: Number(e.amount),
              fecha: e.created_at as string,
            }));
            for (const m of movs) {
              if (m.duplicado) continue;
              if (existentes.some(e => esMismoMovimiento(m, e))) {
                m.duplicado = true;
                m.incluir = false;
              }
            }
          }
        } catch (err) {
          console.error('Error comprobando duplicados', err);
        }
      }

      setMovimientos(movs);
      toast.success(`${movs.length} movimientos detectados`);
    }
    catch (err: any) { toast.error(err.message || 'Error al procesar el archivo'); }
    finally { setProcessing(false); }
  };

  const updateCategoria = (id: string, categoria: CategoryName) => setMovimientos(prev => prev.map(m => m.id === id ? { ...m, categoria } : m));
  const toggleIncluir = (id: string) => setMovimientos(prev => prev.map(m => m.id === id ? { ...m, incluir: !m.incluir } : m));
  const removeRow = (id: string) => setMovimientos(prev => prev.filter(m => m.id !== id));

  const handleConfirmar = async () => {
    if (!user || !movimientos.length) return;
    const seleccionados = movimientos.filter(m => m.incluir);
    if (!seleccionados.length) {
      toast.warning('No hay movimientos seleccionados para importar');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        fileName: file?.name || 'Archivo bancario',
        createdAt: new Date().toISOString(),
        movimientos: seleccionados.map(m => ({
          concepto: m.concepto,
          importe: m.importe,
          fecha: m.fecha,
          categoria: m.categoria,
          autoCategorized: m.autoCategorized,
        })),
      };
      localStorage.setItem(`pending_import_${user.id}`, JSON.stringify(payload));
      window.dispatchEvent(new Event('pending-import-updated'));
      toast.success(`${seleccionados.length} movimientos listos — confírmalos en el Dashboard`);
      onImported?.();
      handleClose(false);
    } catch (err: any) { toast.error('Error al preparar la importación'); }
    finally { setSaving(false); }
  };

  const incluidos = movimientos.filter(m => m.incluir);
  const total = incluidos.reduce((s, m) => s + m.importe, 0);
  const sinFecha = incluidos.filter(m => !m.fecha).length;
  const duplicadosCount = movimientos.filter(m => m.duplicado).length;

  const formatFechaES = (iso: string | null): string => {
    if (!iso) return '';
    const [y, mo, d] = iso.slice(0, 10).split('-');
    return `${d}/${mo}/${y}`;
  };


  return (
    <>
      <Button
        variant="outline"
        className="w-full h-11 rounded-xl font-medium gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
        style={{ background: 'hsl(186 30% 14%)', color: 'hsl(186 100% 65%)' }}
        onClick={() => setOpen(true)}
      >
        <Upload className="w-4 h-4" />
        Importar Movimientos Bancarios
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-0 rounded-2xl"
          style={{ background: 'hsl(200 40% 11%)', border: '1px solid hsl(186 60% 50% / 0.12)' }}
        >
          <DialogHeader className="px-6 pt-6 pb-3 border-b" style={{ borderColor: 'hsl(200 30% 18%)' }}>
            <DialogTitle className="text-xl text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'hsl(186 30% 16%)', border: '1px solid hsl(186 100% 50% / 0.20)' }}>
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
              Importar Movimientos Bancarios
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Sube un archivo Excel del banco y categoriza automáticamente tus gastos.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 mt-4">
            {/* Dropzone */}
            {!movimientos.length && (
              <div
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50 hover:bg-primary/3'
                )}
                style={{ borderColor: dragActive ? 'hsl(186 100% 50%)' : 'hsl(200 30% 22%)' }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{ background: 'hsl(186 30% 16%)', border: '1px solid hsl(186 100% 50% / 0.15)' }}>
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <p className="text-foreground font-medium">
                  {file ? file.name : 'Arrastra tu archivo Excel aquí'}
                </p>
                <p className="text-muted-foreground text-sm mt-1">o haz click para seleccionar (.xls, .xlsx)</p>
                <input ref={inputRef} type="file" accept=".xls,.xlsx" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) validateAndSetFile(f); }} />
              </div>
            )}

            {file && !movimientos.length && (
              <div className="flex gap-2">
                <Button className="flex-1 h-11 rounded-xl shadow-lg shadow-primary/20" onClick={handleProcess} disabled={processing}>
                  {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</> : <><FileSpreadsheet className="w-4 h-4 mr-2" />Procesar archivo</>}
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={reset}><X className="w-4 h-4" /></Button>
              </div>
            )}

            {/* Tabla preview */}
            {movimientos.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-col gap-2 px-4 py-3 rounded-xl"
                  style={{ background: 'hsl(200 35% 15%)', border: '1px solid hsl(200 30% 20%)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{incluidos.length}</span> de {movimientos.length} movimientos seleccionados
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Total: <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
                    </span>
                  </div>
                  {duplicadosCount > 0 && (
                    <div className="text-xs text-amber-400">
                      ⚠ {duplicadosCount} {duplicadosCount === 1 ? 'movimiento ya existe' : 'movimientos ya existen'} — desmarcados, revísalos antes de confirmar.
                    </div>
                  )}
                  {sinFecha > 0 && (
                    <div className="text-xs text-amber-400">
                      ⚠ {sinFecha} {sinFecha === 1 ? 'movimiento sin fecha' : 'movimientos sin fecha'} — se registrarán con la fecha de hoy.
                    </div>
                  )}
                </div>


                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(200 30% 18%)' }}>
                  <div className="max-h-[45vh] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10" style={{ background: 'hsl(200 40% 13%)' }}>
                        <tr className="text-left text-muted-foreground">
                          <th className="px-3 py-3 font-medium w-10"></th>
                          <th className="px-4 py-3 font-medium">Concepto</th>
                          <th className="px-4 py-3 font-medium whitespace-nowrap">Fecha</th>
                          <th className="px-4 py-3 font-medium text-right">Importe</th>
                          <th className="px-4 py-3 font-medium">Categoría</th>
                          <th className="px-4 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {movimientos.map((m, i) => {
                          const meta = getCategoryMeta(m.categoria);
                          const baseBg = i % 2 === 0 ? 'hsl(200 40% 11%)' : 'hsl(200 35% 13%)';
                          return (
                            <tr key={m.id}
                              className={cn(
                                'border-t transition-colors hover:bg-white/3',
                                m.duplicado && 'bg-amber-500/10',
                                !m.incluir && 'opacity-60'
                              )}
                              style={{ borderColor: 'hsl(200 30% 17%)', background: m.duplicado ? undefined : baseBg }}>
                              <td className="px-3 py-3">
                                <Checkbox
                                  checked={m.incluir}
                                  onCheckedChange={() => toggleIncluir(m.id)}
                                  aria-label="Incluir movimiento"
                                />
                              </td>
                              <td className="px-4 py-3 text-foreground max-w-xs" title={m.concepto}>
                                <div className="flex items-center gap-2">
                                  <span className="truncate">{m.concepto}</span>
                                  {m.duplicado && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-400 bg-amber-500/10 shrink-0">
                                      Ya existe
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className={cn('px-4 py-3 font-mono whitespace-nowrap', m.fecha ? 'text-muted-foreground' : 'text-amber-400')}>
                                {m.fecha ? formatFechaES(m.fecha) : 'Sin fecha'}
                              </td>

                              <td className="px-4 py-3 text-right font-mono text-foreground">{formatCurrency(m.importe)}</td>
                              <td className="px-4 py-3">
                                <Select value={m.categoria} onValueChange={v => updateCategoria(m.id, v as CategoryName)}>
                                  <SelectTrigger className={cn('w-[170px] h-8 border text-xs', meta.color)}>
                                    <SelectValue>
                                      <span className="flex items-center gap-1.5">
                                        <span>{meta.icon}</span><span>{m.categoria}</span>
                                      </span>
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent style={{ background: 'hsl(200 40% 13%)', borderColor: 'hsl(200 30% 20%)' }}>
                                    {CATEGORIES.map(c => (
                                      <SelectItem key={c.name} value={c.name}>
                                        <span className="flex items-center gap-2"><span>{c.icon}</span><span>{c.name}</span></span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-2 py-3">
                                <button onClick={() => removeRow(m.id)}
                                  className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10">
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Button size="lg" className="w-full h-12 rounded-xl text-base font-semibold shadow-xl shadow-income/20"
                  style={{ background: 'linear-gradient(135deg, hsl(158 64% 42%), hsl(158 64% 32%))', color: 'white' }}
                  onClick={handleConfirmar} disabled={saving || !incluidos.length}>
                  {saving
                    ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Guardando...</>
                    : <><Check className="w-5 h-5 mr-2" />Confirmar y Guardar {incluidos.length} Movimientos</>}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};