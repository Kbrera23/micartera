import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Building2, Bell, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BankType } from '@/hooks/useSupabaseFinances';
import { formatInputCurrency } from '@/lib/currency';
import { NotificationSettings } from '@/components/NotificationSettings';
import { BankLogo } from '@/components/dashboard/MinimalBankCards';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  monthlyIncome: number;
  savingsGoal: number;
  rent: number;
  userBanks: { bank: BankType; initial_balance: number }[];
  onUpdateProfile: (data: { monthly_income?: number; savings_goal?: number; rent?: number }) => void;
  onToggleBank: (bankId: BankType) => void;
  onUpdateBankBalance: (bankId: BankType, balance: number) => void;
  onBack: () => void;
}

const BANK_LOGOS: Record<BankType, string> = {
  santander: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Banco_Santander_Logotipo.svg/1200px-Banco_Santander_Logotipo.svg.png',
  lacaixa: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/CaixaBank%2C_S.A._logo.svg/1200px-CaixaBank%2C_S.A._logo.svg.png',
  ing: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/ING_Group_N.V._Logo.svg/1200px-ING_Group_N.V._Logo.svg.png',
  revolut: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Revolut_Logo.svg/1200px-Revolut_Logo.svg.png',
  bbva: '',
};

const BANKS: { id: BankType; name: string; color: string }[] = [
  { id: 'santander', name: 'Santander', color: 'bg-santander' },
  { id: 'lacaixa', name: 'La Caixa', color: 'bg-lacaixa' },
  { id: 'ing', name: 'ING', color: 'bg-ing' },
  { id: 'revolut', name: 'Revolut', color: 'bg-revolut' },
  { id: 'bbva', name: 'BBVA', color: 'bg-bbva' },
];

const cardStyle: React.CSSProperties = {
  background: 'hsl(200 40% 12% / 0.92)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid hsl(186 60% 50% / 0.12)',
  boxShadow: '0 20px 60px -20px hsl(200 45% 4% / 0.7)',
};

const inputStyle: React.CSSProperties = {
  background: 'hsl(200 35% 16%)',
  border: '1px solid hsl(186 60% 50% / 0.12)',
  color: 'white',
};

const FieldRow = ({
  label,
  value,
  onChange,
  onSave,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
}) => (
  <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
    <span className="text-sm text-muted-foreground w-40 shrink-0">{label}</span>
    <Input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(formatInputCurrency(e.target.value))}
      className="h-10 rounded-xl text-sm font-semibold flex-1"
      style={inputStyle}
      onBlur={onSave}
      onKeyDown={(e) => e.key === 'Enter' && onSave()}
    />
    <Button
      size="sm"
      onClick={onSave}
      className="rounded-xl h-10 w-10 p-0 shrink-0"
      style={{
        background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))',
        color: 'white',
      }}
    >
      <Check className="w-4 h-4" />
    </Button>
  </div>
);

export const SettingsSection = ({
  monthlyIncome,
  savingsGoal,
  rent,
  userBanks,
  onUpdateProfile,
  onToggleBank,
  onUpdateBankBalance,
  onBack,
}: SettingsSectionProps) => {
  const [income, setIncome] = useState('');
  const [savings, setSavings] = useState('');
  const [rentValue, setRentValue] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFinanzas, setShowFinanzas] = useState(true);
  const [showBancos, setShowBancos] = useState(true);
  const [bankBalances, setBankBalances] = useState<Record<BankType, string>>({
    santander: '', lacaixa: '', ing: '', revolut: '', bbva: '',
  });

  useEffect(() => {
    setIncome(monthlyIncome > 0 ? formatInputCurrency(monthlyIncome.toString()) : '');
    setSavings(savingsGoal > 0 ? formatInputCurrency(savingsGoal.toString()) : '');
    setRentValue(rent > 0 ? formatInputCurrency(rent.toString()) : '');
  }, [monthlyIncome, savingsGoal, rent]);

  useEffect(() => {
    const nb: Record<BankType, string> = { santander: '', lacaixa: '', ing: '', revolut: '', bbva: '' };
    userBanks.forEach((b) => {
      if (b.initial_balance > 0) nb[b.bank] = formatInputCurrency(b.initial_balance.toString());
    });
    setBankBalances(nb);
  }, [userBanks]);

  const parseValue = (v: string) => Number(v.replace(/[^\d]/g, '')) || 0;
  const activeBankIds = userBanks.map((b) => b.bank);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="rounded-xl h-10 w-10 p-0"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
          <p className="text-sm text-muted-foreground">Finanzas, bancos y notificaciones</p>
        </div>
      </div>

      {/* Finanzas */}
      <div className="rounded-3xl overflow-hidden" style={cardStyle}>
        <button
          onClick={() => setShowFinanzas((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))',
                boxShadow: '0 8px 24px hsl(186 100% 50% / 0.25)',
              }}
            >
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Finanzas</h2>
              <p className="text-xs text-muted-foreground">Ingresos y gastos fijos mensuales</p>
            </div>
          </div>
          {showFinanzas
            ? <ChevronUp className="w-5 h-5 text-muted-foreground" />
            : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </button>
        {showFinanzas && (
          <div className="px-6 pb-6 border-t border-white/5">
            <FieldRow label="Nómina mensual" value={income} onChange={setIncome} onSave={() => onUpdateProfile({ monthly_income: parseValue(income) })} />
            <FieldRow label="Ahorro mensual" value={savings} onChange={setSavings} onSave={() => onUpdateProfile({ savings_goal: parseValue(savings) })} />
            <FieldRow label="Alquiler / Hipoteca" value={rentValue} onChange={setRentValue} onSave={() => onUpdateProfile({ rent: parseValue(rentValue) })} />
          </div>
        )}
      </div>

      {/* Bancos */}
      <div className="rounded-3xl overflow-hidden" style={cardStyle}>
        <button
          onClick={() => setShowBancos((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))',
                boxShadow: '0 8px 24px hsl(186 100% 50% / 0.25)',
              }}
            >
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Mis Bancos</h2>
              <p className="text-xs text-muted-foreground">Activa los bancos que utilizas</p>
            </div>
          </div>
          {showBancos
            ? <ChevronUp className="w-5 h-5 text-muted-foreground" />
            : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </button>
        {showBancos && (
          <div className="px-6 pb-6 border-t border-white/5">
            <div className="flex gap-2 flex-wrap">
              {BANKS.map((bank) => {
                const isActive = activeBankIds.includes(bank.id);
                const logo = BANK_LOGOS[bank.id];
                return (
                  <button
                    key={bank.id}
                    onClick={() => onToggleBank(bank.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-sm font-medium',
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    style={
                      isActive
                        ? {
                            background: 'hsl(186 30% 16%)',
                            borderColor: 'hsl(186 100% 50% / 0.30)',
                            boxShadow: '0 0 12px -4px hsl(186 100% 50% / 0.30)',
                          }
                        : { background: 'hsl(200 35% 14%)', borderColor: 'hsl(186 60% 50% / 0.12)' }
                    }
                  >
                    <div className={cn('w-5 h-5 rounded-md flex items-center justify-center', bank.color)}>
                      {logo ? (
                        <img src={logo} alt={bank.name} className="w-3.5 h-3.5 object-contain brightness-0 invert" />
                      ) : (
                        <Building2 className="w-3 h-3 text-white" />
                      )}
                    </div>
                    {bank.name}
                  </button>
                );
              })}
            </div>

            {activeBankIds.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/5">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
                  Saldos iniciales
                </p>
                {BANKS.filter((b) => activeBankIds.includes(b.id)).map((bank) => {
                  const logo = BANK_LOGOS[bank.id];
                  return (
                    <div key={bank.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', bank.color)}>
                        {logo ? (
                          <img src={logo} alt={bank.name} className="w-4 h-4 object-contain brightness-0 invert" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground w-24 shrink-0">{bank.name}</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={bankBalances[bank.id]}
                        onChange={(e) => setBankBalances((prev) => ({ ...prev, [bank.id]: formatInputCurrency(e.target.value) }))}
                        onBlur={() => onUpdateBankBalance(bank.id, parseValue(bankBalances[bank.id]))}
                        onKeyDown={(e) => e.key === 'Enter' && onUpdateBankBalance(bank.id, parseValue(bankBalances[bank.id]))}
                        className="h-9 rounded-xl text-sm flex-1"
                        style={inputStyle}
                      />
                      <Button
                        size="sm"
                        onClick={() => onUpdateBankBalance(bank.id, parseValue(bankBalances[bank.id]))}
                        className="rounded-xl h-9 w-9 p-0 shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))',
                          color: 'white',
                        }}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notificaciones */}
      <div className="rounded-3xl overflow-hidden" style={cardStyle}>
        <button
          onClick={() => setShowNotifications((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(186 100% 45%), hsl(195 80% 35%))',
                boxShadow: '0 8px 24px hsl(186 100% 50% / 0.25)',
              }}
            >
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Notificaciones</h2>
              <p className="text-xs text-muted-foreground">Recordatorios y alertas</p>
            </div>
          </div>
          {showNotifications
            ? <ChevronUp className="w-5 h-5 text-muted-foreground" />
            : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </button>
        {showNotifications && (
          <div className="px-6 pb-6 border-t border-white/5">
            <NotificationSettings />
          </div>
        )}
      </div>
    </div>
  );
};
