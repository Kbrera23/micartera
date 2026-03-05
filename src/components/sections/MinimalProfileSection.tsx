import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { BankType } from '@/hooks/useSupabaseFinances';
import { formatInputCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { LogOut, Wallet, PiggyBank, Home, Flame, Star, Zap, CreditCard, Building2, Camera, Loader2 } from 'lucide-react';
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

const BANKS: { id: BankType; name: string; color: string; icon: typeof Building2; description: string }[] = [
  { id: 'santander', name: 'Santander', color: 'bg-santander', icon: Flame, description: 'Cuenta principal' },
  { id: 'lacaixa', name: 'La Caixa', color: 'bg-lacaixa', icon: Star, description: 'Ahorros' },
  { id: 'ing', name: 'ING', color: 'bg-ing', icon: Zap, description: 'Suscripciones' },
  { id: 'revolut', name: 'Revolut', color: 'bg-revolut', icon: CreditCard, description: 'Provisiones trim.' },
  { id: 'bbva', name: 'BBVA', color: 'bg-bbva', icon: Building2, description: 'Otros' },
];

export const MinimalProfileSection = ({
  monthlyIncome,
  savingsGoal,
  rent,
  userBanks,
  onUpdateProfile,
  onToggleBank,
  onUpdateBankBalance
}: MinimalProfileSectionProps) => {
  const { signOut, user } = useAuth();
  const [income, setIncome] = useState('');
  const [savings, setSavings] = useState('');
  const [rentValue, setRentValue] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [bankBalances, setBankBalances] = useState<Record<BankType, string>>({
    santander: '',
    lacaixa: '',
    ing: '',
    revolut: '',
    bbva: ''
  });

  useEffect(() => {
    setIncome(monthlyIncome > 0 ? formatInputCurrency(monthlyIncome.toString()) : '');
    setSavings(savingsGoal > 0 ? formatInputCurrency(savingsGoal.toString()) : '');
    setRentValue(rent > 0 ? formatInputCurrency(rent.toString()) : '');
  }, [monthlyIncome, savingsGoal, rent]);

  useEffect(() => {
    const newBalances: Record<BankType, string> = {
      santander: '',
      lacaixa: '',
      ing: '',
      revolut: '',
      bbva: ''
    };
    userBanks.forEach(b => {
      if (b.initial_balance > 0) {
        newBalances[b.bank] = formatInputCurrency(b.initial_balance.toString());
      }
    });
    setBankBalances(newBalances);
  }, [userBanks]);

  // Load avatar from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      });
  }, [user]);

  const parseValue = (value: string) => Number(value.replace(/[^\d]/g, '')) || 0;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG, WEBP o GIF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBust })
        .eq('user_id', user.id);

      setAvatarUrl(urlWithCacheBust);
      toast.success('Foto de perfil actualizada');
    } catch {
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSaveIncome = () => {
    onUpdateProfile({ monthly_income: parseValue(income) });
  };

  const handleSaveSavings = () => {
    onUpdateProfile({ savings_goal: parseValue(savings) });
  };

  const handleSaveRent = () => {
    onUpdateProfile({ rent: parseValue(rentValue) });
  };

  const handleSaveBankBalance = (bankId: BankType) => {
    onUpdateBankBalance(bankId, parseValue(bankBalances[bankId]));
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Sesión cerrada');
  };

  const activeBankIds = userBanks.map(b => b.bank);
  const userInitials = user?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Perfil</h1>

      {/* User Info + Avatar */}
      <Card className="border-none shadow-md rounded-2xl">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="relative shrink-0">
            <Avatar className="w-16 h-16">
              <AvatarImage src={avatarUrl ?? undefined} alt="Foto de perfil" />
              <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {uploadingAvatar
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Camera className="w-3.5 h-3.5" />
              }
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Conectado como</p>
            <p className="font-medium truncate">{user?.email}</p>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="text-xs text-primary hover:underline mt-0.5"
            >
              Cambiar foto
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Income Settings */}
      <Card className="border-none shadow-md rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-income" />
            Ingresos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nómina Mensual (€)</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="decimal"
                value={income}
                onChange={(e) => setIncome(formatInputCurrency(e.target.value))}
                className="rounded-xl h-12 text-lg font-semibold"
              />
              <Button onClick={handleSaveIncome} className="rounded-xl h-12 px-6">
                Guardar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Savings Settings */}
      <Card className="border-none shadow-md rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-recurring" />
            Ahorro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Objetivo de Ahorro Mensual (€)</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="decimal"
                value={savings}
                onChange={(e) => setSavings(formatInputCurrency(e.target.value))}
                className="rounded-xl h-12 text-lg font-semibold"
              />
              <Button onClick={handleSaveSavings} className="rounded-xl h-12 px-6">
                Guardar
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Alquiler / Hipoteca (€)
            </Label>
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="decimal"
                value={rentValue}
                onChange={(e) => setRentValue(formatInputCurrency(e.target.value))}
                className="rounded-xl h-12 text-lg font-semibold"
              />
              <Button onClick={handleSaveRent} className="rounded-xl h-12 px-6">
                Guardar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Management */}
      <Card className="border-none shadow-md rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Mis Bancos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BANKS.map((bank) => {
              const Icon = bank.icon;
              const isActive = activeBankIds.includes(bank.id);
              return (
                <button
                  key={bank.id}
                  onClick={() => onToggleBank(bank.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                    isActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bank.color)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium">{bank.name}</span>
                </button>
              );
            })}
          </div>

          {/* Initial Balances for Active Banks */}
          {activeBankIds.length > 0 && (
            <div className="pt-4 border-t border-border space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Saldos Iniciales (El Colchón)
              </p>
              {BANKS.filter(b => activeBankIds.includes(b.id)).map((bank) => {
                const Icon = bank.icon;
                return (
                  <div key={bank.id} className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', bank.color)}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      {bank.name} - {bank.description}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={bankBalances[bank.id]}
                        onChange={(e) => setBankBalances(prev => ({
                          ...prev,
                          [bank.id]: formatInputCurrency(e.target.value)
                        }))}
                        className="rounded-xl h-10 text-sm font-medium"
                      />
                      <Button 
                        onClick={() => handleSaveBankBalance(bank.id)} 
                        variant="outline"
                        className="rounded-xl h-10 px-4"
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <NotificationSettings />

      {/* Sign Out */}
      <Button 
        variant="outline" 
        onClick={handleSignOut}
        className="w-full h-12 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Cerrar Sesión
      </Button>
    </div>
  );
};
