import { useMemo, useState } from 'react';
import { PiggyBank, Plus, Trash2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BankType, MonthlySaving } from '@/hooks/useSupabaseFinances';
import {
  formatCurrencyCompact,
  formatInputCurrency,
  parseInputCurrency,
} from '@/lib/currency';
import { cn } from '@/lib/utils';

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const BANK_LABELS: Record<BankType, string> = {
  santander: 'Santander',
  lacaixa: 'La Caixa',
  ing: 'ING',
  revolut: 'Revolut',
  bbva: 'BBVA',
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Props {
  userBanks: { bank: BankType }[];
  monthlySavings: MonthlySaving[];
  onAddSaving: (
    year: number,
    month: number,
    bank: BankType,
    amount: number,
    note?: string | null,
  ) => Promise<void> | void;
  onRemoveSaving: (id: string) => Promise<void> | void;
}

export const RegisterMonthlySaving = ({
  userBanks,
  monthlySavings,
  onAddSaving,
  onRemoveSaving,
}: Props) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthLabel = capitalize(MONTHS_ES[currentMonth - 1]);

  const [open, setOpen] = useState(false);
  const [amountStr, setAmountStr] = useState('');
  const [bank, setBank] = useState<BankType | ''>(
    (userBanks[0]?.bank as BankType) || '',
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const amount = parseInputCurrency(amountStr);
    if (!amount || amount <= 0 || !bank) return;
    setSaving(true);
    try {
      await onAddSaving(currentYear, currentMonth, bank as BankType, amount);
      setAmountStr('');
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const totalSaved = useMemo(
    () => monthlySavings.reduce((s, r) => s + Number(r.amount || 0), 0),
    [monthlySavings],
  );

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <PiggyBank className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                Registrar ahorro de {monthLabel}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Total ahorrado: {formatCurrencyCompact(totalSaved)}
              </p>
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="shrink-0">
                <Plus className="h-4 w-4" />
                Registrar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Ahorro de {monthLabel} {currentYear}
                </DialogTitle>
                <DialogDescription>
                  Indica cuánto has ahorrado realmente este mes y en qué banco
                  depositarlo.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="saving-amount">¿Cuánto has ahorrado?</Label>
                  <div className="relative">
                    <Input
                      id="saving-amount"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={amountStr}
                      onChange={(e) =>
                        setAmountStr(formatInputCurrency(e.target.value))
                      }
                      className="pr-8 font-mono text-lg"
                      autoFocus
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      €
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Depositar en</Label>
                  <Select
                    value={bank}
                    onValueChange={(v) => setBank(v as BankType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {userBanks.map((b) => (
                        <SelectItem key={b.bank} value={b.bank}>
                          {BANK_LABELS[b.bank]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    saving || !bank || parseInputCurrency(amountStr) <= 0
                  }
                >
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {monthlySavings.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Histórico de ahorros
          </p>
          <ul className="space-y-2">
            {monthlySavings.slice(0, 8).map((s) => (
              <li
                key={s.id}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-lg',
                  'px-3 py-2 bg-white/5 hover:bg-white/10 transition-colors',
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {capitalize(MONTHS_ES[s.month - 1])} {s.year}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {BANK_LABELS[s.bank] || s.bank}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-sm font-semibold">
                    +{formatCurrencyCompact(Number(s.amount || 0))}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveSaving(s.id)}
                    aria-label="Eliminar ahorro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
