import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatInputCurrency, parseInputCurrency } from '@/lib/currency';

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface Props {
  monthlyIncome: number;
  savingsGoal: number;
  rent: number;
  onUpdateProfile: (
    data: { monthly_income?: number; savings_goal?: number; rent?: number },
  ) => Promise<void> | void;
}

const toInput = (n: number) =>
  formatInputCurrency(String((n ?? 0).toFixed(2)).replace('.', ','));

export const EditMonthlyFinances = ({
  monthlyIncome,
  savingsGoal,
  rent,
  onUpdateProfile,
}: Props) => {
  const now = new Date();
  const monthLabel = `${MONTHS_ES[now.getMonth()]} ${now.getFullYear()}`;

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [income, setIncome] = useState('');
  const [goal, setGoal] = useState('');
  const [rentStr, setRentStr] = useState('');

  useEffect(() => {
    if (open) {
      setIncome(toInput(monthlyIncome));
      setGoal(toInput(savingsGoal));
      setRentStr(toInput(rent));
    }
  }, [open, monthlyIncome, savingsGoal, rent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateProfile({
        monthly_income: parseInputCurrency(income),
        savings_goal: parseInputCurrency(goal),
        rent: parseInputCurrency(rentStr),
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex justify-end">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar finanzas de {MONTHS_ES[now.getMonth()]}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar finanzas de {monthLabel}</DialogTitle>
            <DialogDescription>
              Ajusta los importes de este mes. Los cálculos se actualizarán
              automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Field
              id="income"
              label="Nómina mensual"
              value={income}
              onChange={setIncome}
            />
            <Field
              id="goal"
              label="Ahorro mensual"
              value={goal}
              onChange={setGoal}
            />
            <Field
              id="rent"
              label="Alquiler / Hipoteca"
              value={rentStr}
              onChange={setRentStr}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Input
        id={id}
        inputMode="decimal"
        placeholder="0,00"
        value={value}
        onChange={(e) => onChange(formatInputCurrency(e.target.value))}
        className="pr-8 font-mono"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        €
      </span>
    </div>
  </div>
);
