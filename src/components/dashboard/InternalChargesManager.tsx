import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Check, Loader2, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/**
 * Gestor de cargos internos (Netflix, Digi, entrenador…) desde la app, sin SQL.
 * Permite listar, añadir, editar, activar/desactivar y borrar las filas de
 * `internal_charges`. Tras cualquier cambio llama a refetch() para refrescar
 * el dashboard (saldos y avisos).
 */

interface Charge {
  id: string;
  nombre: string;
  banco: string;
  cantidad: number;
  dia_mes: number | null;
  frecuencia: string;
  activa: boolean;
}

interface Props {
  refetch?: () => void;
}

const BANCOS = ['lacaixa', 'revolut', 'ing', 'santander', 'bbva', 'traderepublic'];
const FRECUENCIAS = ['mensual', 'trimestral', 'manual'];

const cardStyle: React.CSSProperties = {
  background: 'hsl(200 40% 11%)',
  border: '1px solid hsl(186 60% 50% / 0.12)',
};
const inputStyle: React.CSSProperties = {
  background: 'hsl(200 35% 14%)',
  border: '1px solid hsl(186 60% 50% / 0.12)',
};

export const InternalChargesManager = ({ refetch }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('internal_charges')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      setCharges((data || []) as Charge[]);
    } catch (e) {
      console.error('Error cargando cargos internos', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const setField = (id: string, campo: keyof Charge, valor: unknown) =>
    setCharges(prev => prev.map(c => (c.id === id ? { ...c, [campo]: valor } : c)));

  const guardar = async (c: Charge) => {
    if (!user) return;
    if (!c.nombre.trim() || !(c.cantidad > 0)) {
      toast.error('Pon un nombre y un importe válido');
      return;
    }
    setSavingId(c.id);
    try {
      const { error } = await supabase.from('internal_charges').update({
        nombre: c.nombre.trim(),
        banco: c.banco,
        cantidad: c.cantidad,
        dia_mes: c.frecuencia === 'mensual' ? (c.dia_mes || null) : null,
        frecuencia: c.frecuencia,
        activa: c.activa,
      }).eq('id', c.id);
      if (error) throw error;
      toast.success('Cargo guardado');
      refetch?.();
    } catch (e) {
      console.error('Error guardando cargo', e);
      toast.error('No se pudo guardar');
    } finally {
      setSavingId(null);
    }
  };

  const borrar = async (c: Charge) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('internal_charges').delete().eq('id', c.id);
      if (error) throw error;
      setCharges(prev => prev.filter(x => x.id !== c.id));
      toast.success(`${c.nombre} eliminado`);
      refetch?.();
    } catch (e) {
      console.error('Error borrando cargo', e);
      toast.error('No se pudo borrar');
    }
  };

  const añadir = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('internal_charges').insert({
        user_id: user.id, nombre: 'Nuevo cargo', banco: 'ing', cantidad: 0,
        dia_mes: null, frecuencia: 'mensual', activa: true,
      }).select().single();
      if (error) throw error;
      if (data) setCharges(prev => [...prev, data as Charge]);
    } catch (e) {
      console.error('Error añadiendo cargo', e);
      toast.error('No se pudo añadir');
    }
  };

  return (
    <div className="rounded-3xl overflow-hidden" style={cardStyle}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-5"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'hsl(186 30% 16%)', border: '1px solid hsl(186 100% 50% / 0.20)' }}>
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-semibold">Cargos fijos</h2>
            <p className="text-xs text-muted-foreground">Netflix, entrenador y otros cargos de tus cuentas</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-white/5 space-y-3 pt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : charges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes cargos fijos. Añade uno abajo.</p>
          ) : (
            charges.map(c => (
              <div key={c.id} className="rounded-xl p-3 space-y-2" style={inputStyle}>
                <div className="flex gap-2">
                  <Input
                    value={c.nombre}
                    onChange={e => setField(c.id, 'nombre', e.target.value)}
                    placeholder="Nombre"
                    className="h-9 rounded-lg text-sm flex-1"
                    style={cardStyle}
                  />
                  <Input
                    type="number"
                    value={c.cantidad || ''}
                    onChange={e => setField(c.id, 'cantidad', parseFloat(e.target.value) || 0)}
                    placeholder="€"
                    className="h-9 rounded-lg text-sm w-24"
                    style={cardStyle}
                  />
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    value={c.banco}
                    onChange={e => setField(c.id, 'banco', e.target.value)}
                    className="h-9 rounded-lg text-sm px-2 capitalize"
                    style={{ ...cardStyle, color: 'inherit' }}
                  >
                    {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <select
                    value={c.frecuencia}
                    onChange={e => setField(c.id, 'frecuencia', e.target.value)}
                    className="h-9 rounded-lg text-sm px-2 capitalize"
                    style={{ ...cardStyle, color: 'inherit' }}
                  >
                    {FRECUENCIAS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  {c.frecuencia === 'mensual' && (
                    <Input
                      type="number"
                      value={c.dia_mes ?? ''}
                      onChange={e => setField(c.id, 'dia_mes', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="día"
                      className="h-9 rounded-lg text-sm w-20"
                      style={cardStyle}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setField(c.id, 'activa', !c.activa)}
                    className={cn('h-9 px-3 rounded-lg text-xs font-medium border',
                      c.activa ? 'text-primary border-primary/40 bg-primary/10' : 'text-muted-foreground border-white/10')}
                  >
                    {c.activa ? 'Activo' : 'Inactivo'}
                  </button>

                  <div className="ml-auto flex gap-2">
                    <Button size="sm" className="h-9 rounded-lg gap-1" disabled={savingId === c.id} onClick={() => guardar(c)}>
                      {savingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Guardar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar "{c.nombre}"?</AlertDialogTitle>
                          <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => borrar(c)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))
          )}

          <Button variant="outline" className="w-full h-10 rounded-xl gap-2" onClick={añadir}>
            <Plus className="w-4 h-4" /> Añadir cargo
          </Button>
        </div>
      )}
    </div>
  );
};
