import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PiggyBank, Check, Undo2, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrencyCompact, parseCurrencyInput } from '@/lib/currency';
import { toast } from 'sonner';

interface PersonalSavingsCardProps {
  refetch: () => void;
}

export const PersonalSavingsCard = ({ refetch }: PersonalSavingsCardProps) => {
  const { user } = useAuth();
  const [value, setValue] = useState('');
  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const mes = today.getMonth() + 1;
  const anio = today.getFullYear();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('savings_log')
        .select('cantidad')
        .eq('user_id', user.id)
        .eq('tipo', 'ahorro_personal')
        .eq('mes', mes)
        .eq('anio', anio)
        .maybeSingle();
      if (data) {
        setConfirmedAmount(Number(data.cantidad || 0));
        setValue(String(data.cantidad ?? ''));
      }
      setLoading(false);
    };
    load();
  }, [user, mes, anio]);

  const handleConfirm = async () => {
    if (!user) return;
    const cantidad = parseCurrencyInput(value);
    if (!cantidad || cantidad <= 0) {
      toast.error('Introduce una cantidad válida');
      return;
    }
    try {
      const { error } = await supabase.from('savings_log').upsert(
        {
          user_id: user.id,
          tipo: 'ahorro_personal',
          destino: 'caixa',
          cantidad,
          mes,
          anio,
        },
        { onConflict: 'user_id,tipo,mes,anio' }
      );
      if (error) throw error;
      setConfirmedAmount(cantidad);
      setEditing(false);
      toast.success('✅ Ahorro personal confirmado');
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el ahorro');
    }
  };

  const handleUndo = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('savings_log')
        .delete()
        .eq('user_id', user.id)
        .eq('tipo', 'ahorro_personal')
        .eq('mes', mes)
        .eq('anio', anio);
      if (error) throw error;
      setConfirmedAmount(null);
      setValue('');
      setEditing(false);
      toast.success('Ahorro deshecho');
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Error al deshacer');
    }
  };

  if (loading) return null;

  const isConfirmed = confirmedAmount !== null && !editing;

  return (
    <Card className="glass-card border-0 rounded-2xl animate-fade-in">
      <CardContent className="p-4 flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-recurring/10 text-recurring">
          <PiggyBank className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-[160px]">
          <p className="text-sm font-medium text-foreground">Ahorro personal</p>
          <p className="text-xs text-muted-foreground">
            {isConfirmed ? 'Confirmado este mes → La Caixa' : 'Este mes quiero ahorrar'}
          </p>
        </div>

        {isConfirmed ? (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-mono text-recurring">
              {formatCurrencyCompact(confirmedAmount!)}
            </span>
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleUndo}>
              <Undo2 className="w-3.5 h-3.5" />
              Deshacer
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              inputMode="decimal"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="0,00"
              className="w-28 h-9 text-right font-mono"
            />
            <span className="text-sm text-muted-foreground">€</span>
            <Button
              size="sm"
              onClick={handleConfirm}
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 text-xs gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              Confirmar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
