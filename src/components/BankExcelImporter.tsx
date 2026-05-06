import { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Check, X, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

// ====== CATEGORÍAS DISPONIBLES ======
const CATEGORIES = [
  { name: 'Alimentación', icon: '🛒', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { name: 'Transporte', icon: '🚌', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { name: 'Suscripciones', icon: '📺', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { name: 'Salud', icon: '💊', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { name: 'Ocio', icon: '🎮', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { name: 'Ropa', icon: '👕', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { name: 'Otros', icon: '📁', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
] as const;

type CategoryName = typeof CATEGORIES[number]['name'];

const getCategoryMeta = (name: string) =>
  CATEGORIES.find(c => c.name === name) ?? CATEGORIES[CATEGORIES.length - 1];

// ====== MOTOR DE CATEGORIZACIÓN ======
// Devuelve la categoría detectada y si fue auto-categorizada (no "Otros")
const categorizarGasto = (concepto: string): { categoria: CategoryName; auto: boolean } => {
  const texto = (concepto || '').toLowerCase();

  if (/mercadona|lidl|carrefour|alimentacion|alimentación|supermercado|\bdia\b|aldi/.test(texto))
    return { categoria: 'Alimentación', auto: true };

  if (/uber|cabify|renfe|taxi|gasolina|repsol|\bbp\b|cepsa|shell|galp|gasolinera/.test(texto))
    return { categoria: 'Transporte', auto: true };

  if (/netflix|spotify|\bhbo\b|disney|amazon/.test(texto))
    return { categoria: 'Suscripciones', auto: true };

  if (/farmacia|clinica|clínica|medico|médico|salud|hospital/.test(texto))
    return { categoria: 'Salud', auto: true };

  if (/\bgym\b|gimnasio|decathlon/.test(texto))
    return { categoria: 'Ocio', auto: true };

  if (/zara|mango|primark|ropa|h&m|hm\b/.test(texto))
    return { categoria: 'Ropa', auto: true };

  return { categoria: 'Otros', auto: false };
};

// ====== LIMPIEZA DE NOMBRE ======
const limpiarConcepto = (concepto: string): string => {
  let t = (concepto || '').trim();
  // Quitar referencia de tarjeta: Tarj.:*1234, Tarj:*1234, TARJ.:*1234, etc.
  t = t.replace(/,?\s*tarj\.?:?\s*\*?\d+/gi, '');
  // Quitar prefijos comunes
  t = t.replace(/\b(pago movil en|pago móvil en|compra en|compra\s+|pago\s+en|recibo\s+de|recibo\s+)\b/gi, '');
  // Limpiar comas/espacios extra
  t = t.replace(/\s{2,}/g, ' ').replace(/\s*,\s*/g, ', ').replace(/^[,\s]+|[,\s]+$/g, '');
  // Capitalización: lowercase y luego capitalizar palabras
  t = t.toLowerCase().replace(/\b([a-záéíóúñ])/g, m => m.toUpperCase());
  // Máx 40 chars
  if (t.length > 40) t = t.slice(0, 39).trimEnd() + '…';
  return t || concepto.slice(0, 40);
};

// ====== TIPOS ======
interface Movimiento {
  id: string;
  concepto: string;
  importe: number;
  fecha: string | null;
  categoria: CategoryName;
}

// ====== PARSER EXCEL ======
const parseExcelFile = async (file: File): Promise<Movimiento[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });

  if (!rows.length) throw new Error('El archivo no contiene movimientos');

  // Buscar fila de encabezados
  let headerRowIdx = -1;
  let conceptoIdx = -1;
  let importeIdx = -1;
  let fechaIdx = -1;

  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i].map(c => String(c || '').toUpperCase().trim());
    const cIdx = row.findIndex(c => c.includes('CONCEPTO') || c.includes('DESCRIPCI'));
    const iIdx = row.findIndex(c => c.includes('IMPORTE'));
    if (cIdx !== -1 && iIdx !== -1) {
      headerRowIdx = i;
      conceptoIdx = cIdx;
      importeIdx = iIdx;
      fechaIdx = row.findIndex(c => c.includes('FECHA'));
      break;
    }
  }

  if (headerRowIdx === -1) throw new Error('Formato de Excel no reconocido');

  const movimientos: Movimiento[] = [];

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.length) continue;

    const concepto = String(row[conceptoIdx] || '').trim();
    const importeRaw = String(row[importeIdx] || '').trim();
    if (!concepto || !importeRaw) continue;

    // Parse importe español: "-123,45" o "-1.234,56"
    const cleaned = importeRaw.replace(/[€\s]/g, '').replace(/\./g, '').replace(',', '.');
    const importe = parseFloat(cleaned);
    if (isNaN(importe) || importe >= 0) continue; // solo gastos (negativos)

    let fecha: string | null = null;
    if (fechaIdx !== -1) {
      const f = row[fechaIdx];
      if (f instanceof Date && !isNaN(f.getTime())) {
        fecha = f.toISOString();
      } else if (typeof f === 'string' && f) {
        // dd/mm/yyyy
        const m = f.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if (m) {
          const yr = m[3].length === 2 ? `20${m[3]}` : m[3];
          const d = new Date(`${yr}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
          if (!isNaN(d.getTime())) fecha = d.toISOString();
        }
      }
    }

    movimientos.push({
      id: `${i}-${Math.random().toString(36).slice(2, 8)}`,
      concepto,
      importe: Math.abs(importe),
      fecha,
      categoria: categorizarGasto(concepto),
    });
  }

  if (!movimientos.length) throw new Error('El archivo no contiene movimientos');
  return movimientos;
};

// ====== COMPONENTE ======
interface Props {
  onImported?: () => void;
}

export const BankExcelImporter = ({ onImported }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setMovimientos([]);
    setProcessing(false);
    setSaving(false);
  };

  const handleClose = (o: boolean) => {
    setOpen(o);
    if (!o) reset();
  };

  const validateAndSetFile = (f: File) => {
    const name = f.name.toLowerCase();
    if (!name.endsWith('.xls') && !name.endsWith('.xlsx')) {
      toast.error('Error: Solo se permiten archivos .xls o .xlsx');
      return;
    }
    setFile(f);
    setMovimientos([]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSetFile(f);
  }, []);

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const movs = await parseExcelFile(file);
      setMovimientos(movs);
      toast.success(`${movs.length} movimientos detectados`);
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el archivo');
    } finally {
      setProcessing(false);
    }
  };

  const updateCategoria = (id: string, categoria: CategoryName) => {
    setMovimientos(prev => prev.map(m => (m.id === id ? { ...m, categoria } : m)));
  };

  const removeRow = (id: string) => {
    setMovimientos(prev => prev.filter(m => m.id !== id));
  };

  const handleConfirmar = async () => {
    if (!user || !movimientos.length) return;
    setSaving(true);
    try {
      const rows = movimientos.map(m => {
        const meta = getCategoryMeta(m.categoria);
        return {
          user_id: user.id,
          name: `${meta.icon} ${m.concepto} — [${m.categoria}]`,
          amount: m.importe,
          is_recurring: false,
          frequency: 'monthly' as const,
          bank: null,
          created_at: m.fecha || new Date().toISOString(),
        };
      });

      const { error } = await supabase.from('expenses').insert(rows);
      if (error) throw error;

      toast.success(`✅ ${movimientos.length} movimientos importados correctamente`);
      onImported?.();
      handleClose(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Error: No se pudieron guardar los movimientos');
    } finally {
      setSaving(false);
    }
  };

  const total = movimientos.reduce((s, m) => s + m.importe, 0);

  return (
    <>
      <Button
        variant="outline"
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg h-12"
        onClick={() => setOpen(true)}
      >
        <Upload className="w-5 h-5 mr-2" />
        Importar Movimientos Bancarios
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-slate-100 p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl text-white flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-blue-400" />
              Importar Movimientos Bancarios
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Sube un archivo Excel del banco y categoriza automáticamente tus gastos.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
            {/* DROPZONE / FILE PICKER */}
            {!movimientos.length && (
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
                  dragActive
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-slate-600 hover:border-blue-500 hover:bg-slate-800/50'
                )}
              >
                <Upload className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <p className="text-slate-200 font-medium">
                  {file ? file.name : 'Arrastra tu archivo Excel aquí'}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  o haz click para seleccionar (.xls, .xlsx)
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xls,.xlsx"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) validateAndSetFile(f);
                  }}
                />
              </div>
            )}

            {file && !movimientos.length && (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
                  onClick={handleProcess}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4 mr-2" /> Procesar archivo
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  onClick={reset}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* TABLA PREVIEW */}
            {movimientos.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-800/60 rounded-lg px-4 py-3 border border-slate-700">
                  <div className="text-sm text-slate-300">
                    <span className="font-semibold text-white">{movimientos.length}</span> movimientos
                  </div>
                  <div className="text-sm text-slate-300">
                    Total:{' '}
                    <span className="font-semibold text-white">{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900/50">
                  <div className="max-h-[45vh] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-800 sticky top-0 z-10">
                        <tr className="text-left text-slate-300">
                          <th className="px-4 py-3 font-medium">Concepto</th>
                          <th className="px-4 py-3 font-medium text-right">Importe</th>
                          <th className="px-4 py-3 font-medium">Categoría</th>
                          <th className="px-4 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {movimientos.map((m, i) => {
                          const meta = getCategoryMeta(m.categoria);
                          return (
                            <tr
                              key={m.id}
                              className={cn(
                                'border-t border-slate-800 transition-colors hover:bg-slate-700/40',
                                i % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-800/40'
                              )}
                            >
                              <td className="px-4 py-3 text-slate-100 max-w-xs truncate" title={m.concepto}>
                                {m.concepto}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-slate-100">
                                {formatCurrency(m.importe)}
                              </td>
                              <td className="px-4 py-3">
                                <Select
                                  value={m.categoria}
                                  onValueChange={v => updateCategoria(m.id, v as CategoryName)}
                                >
                                  <SelectTrigger
                                    className={cn(
                                      'w-[170px] h-8 border text-xs',
                                      meta.color
                                    )}
                                  >
                                    <SelectValue>
                                      <span className="flex items-center gap-1.5">
                                        <span>{meta.icon}</span>
                                        <span>{m.categoria}</span>
                                      </span>
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                                    {CATEGORIES.map(c => (
                                      <SelectItem key={c.name} value={c.name}>
                                        <span className="flex items-center gap-2">
                                          <span>{c.icon}</span>
                                          <span>{c.name}</span>
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-2 py-3">
                                <button
                                  onClick={() => removeRow(m.id)}
                                  className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                  title="Quitar"
                                >
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

                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-base font-semibold shadow-xl h-12"
                  onClick={handleConfirmar}
                  disabled={saving || !movimientos.length}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Confirmar y Guardar {movimientos.length} Movimientos
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
