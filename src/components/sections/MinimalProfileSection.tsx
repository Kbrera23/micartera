import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { BankType } from '@/hooks/useSupabaseFinances';
import { formatInputCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { LogOut, Building2, Camera, Loader2, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { NotificationSettings } from '@/components/NotificationSettings';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MinimalProfileSectionProps {
  monthlyIncome: number;
  savingsGoal: number;
  rent: number;
  userBanks: { bank: BankType; initial_balance: number }[];
  onUpdateProfile: (data: { monthly_income?: number; savings_goal?: number; rent?: number }) => void;
  onToggleBank: (bankId: BankType) => void;
  onUpdateBankBalance: (bankId: BankType, balance: number) => void;
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

// Reusable inline-save row
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
  <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
    <span className="text-sm text-muted-foreground w-36 shrink-0">{label}</span>
    <Input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(formatInputCurrency(e.target.value))}
      className="h-9 rounded-xl text-sm font-semibold flex-1"
      onBlur={onSave}
      onKeyDown={(e) => e.key === 'Enter' && onSave()}
    />
    <Button size="sm" onClick={onSave} className="rounded-xl h-9 w-9 p-0 shrink-0">
      <Check className="w-4 h-4" />
    </Button>
  </div>
);

export const MinimalProfileSection = ({
  monthlyIncome,
  savingsGoal,
  rent,
  userBanks,
  onUpdateProfile,
  onToggleBank,
  onUpdateBankBalance,
}: MinimalProfileSectionProps) => {
  const { signOut, user } = useAuth();
  const [income, setIncome] = useState('');
  const [savings, setSavings] = useState('');
  const [rentValue, setRentValue] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
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
    userBanks.forEach(b => {
      if (b.initial_balance > 0) nb[b.bank] = formatInputCurrency(b.initial_balance.toString());
    });
    setBankBalances(nb);
  }, [userBanks]);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('avatar_url').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.avatar_url) setAvatarUrl(data.avatar_url); });
  }, [user]);

  const parseValue = (v: string) => Number(v.replace(/[^\d]/g, '')) || 0;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Solo JPG, PNG, WEBP o GIF'); return;
    }
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB'); return; }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
      setAvatarUrl(url);
      toast.success('Foto actualizada');
    } catch { toast.error('Error al subir la imagen'); }
    finally { setUploadingAvatar(false); e.target.value = ''; }
  };

  const activeBankIds = userBanks.map(b => b.bank);
  const userInitials = user?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <div className="space-y-4">
      {/* ── Header: avatar + email + sign out ── */}
      <div className="flex items-center gap-4 py-2">
        <div className="relative shrink-0">
          <Avatar className="w-14 h-14">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">{userInitials}</AvatarFallback>
          </Avatar>
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow disabled:opacity-60"
          >
            {uploadingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{user?.email}</p>
          <button onClick={() => avatarInputRef.current?.click()} className="text-xs text-primary hover:underline">
            Cambiar foto
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => { await signOut(); toast.success('Sesión cerrada'); }}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* ── Finanzas ── */}
      <div className="bg-card rounded-2xl shadow-sm px-4 py-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">Finanzas</p>
        <FieldRow label="Nómina mensual" value={income} onChange={setIncome} onSave={() => onUpdateProfile({ monthly_income: parseValue(income) })} />
        <FieldRow label="Ahorro mensual" value={savings} onChange={setSavings} onSave={() => onUpdateProfile({ savings_goal: parseValue(savings) })} />
        <FieldRow label="Alquiler / Hipoteca" value={rentValue} onChange={setRentValue} onSave={() => onUpdateProfile({ rent: parseValue(rentValue) })} />
      </div>

      {/* ── Bancos ── */}
      <div className="bg-card rounded-2xl shadow-sm p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Mis Bancos</p>
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
                  isActive ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/40'
                )}
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

        {/* Saldos iniciales inline */}
        {activeBankIds.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50 space-y-0">
            <p className="text-xs text-muted-foreground mb-2">Saldos iniciales (El Colchón)</p>
            {BANKS.filter(b => activeBankIds.includes(b.id)).map((bank) => {
              const logo = BANK_LOGOS[bank.id];
              return (
                <div key={bank.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                  <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0', bank.color)}>
                    {logo ? (
                      <img src={logo} alt={bank.name} className="w-4 h-4 object-contain brightness-0 invert" />
                    ) : (
                      <Building2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground w-24 shrink-0">{bank.name}</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={bankBalances[bank.id]}
                    onChange={(e) => setBankBalances(prev => ({ ...prev, [bank.id]: formatInputCurrency(e.target.value) }))}
                    onBlur={() => onUpdateBankBalance(bank.id, parseValue(bankBalances[bank.id]))}
                    onKeyDown={(e) => e.key === 'Enter' && onUpdateBankBalance(bank.id, parseValue(bankBalances[bank.id]))}
                    className="h-8 rounded-xl text-sm flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateBankBalance(bank.id, parseValue(bankBalances[bank.id]))}
                    className="rounded-xl h-8 w-8 p-0 shrink-0"
                  ><Check className="w-3.5 h-3.5" /></Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Notificaciones (colapsable) ── */}
      <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setShowNotifications(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left"
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Notificaciones</span>
          </div>
          {showNotifications ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showNotifications && (
          <div className="px-4 pb-4 border-t border-border/50">
            <NotificationSettings />
          </div>
        )}
      </div>
    </div>
  );
};