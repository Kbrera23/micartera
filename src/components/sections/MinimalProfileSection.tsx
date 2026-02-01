import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { BankType } from '@/hooks/useSupabaseFinances';
import { formatInputCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { LogOut, Wallet, PiggyBank, Home, Flame, Star, Zap, CreditCard, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MinimalProfileSectionProps {
  monthlyIncome: number;
  savingsGoal: number;
  rent: number;
  userBanks: { bank: BankType }[];
  onUpdateProfile: (data: { monthly_income?: number; savings_goal?: number; rent?: number }) => void;
  onToggleBank: (bankId: BankType) => void;
}

const BANKS: { id: BankType; name: string; color: string; icon: typeof Building2 }[] = [
  { id: 'santander', name: 'Santander', color: 'bg-[#EC0000]', icon: Flame },
  { id: 'lacaixa', name: 'La Caixa', color: 'bg-[#00ABD1]', icon: Star },
  { id: 'ing', name: 'ING', color: 'bg-[#FF6200]', icon: Zap },
  { id: 'revolut', name: 'Revolut', color: 'bg-[#191C1F]', icon: CreditCard },
  { id: 'bbva', name: 'BBVA', color: 'bg-[#004481]', icon: Building2 },
];

export const MinimalProfileSection = ({
  monthlyIncome,
  savingsGoal,
  rent,
  userBanks,
  onUpdateProfile,
  onToggleBank
}: MinimalProfileSectionProps) => {
  const { signOut, user } = useAuth();
  const [income, setIncome] = useState('');
  const [savings, setSavings] = useState('');
  const [rentValue, setRentValue] = useState('');

  useEffect(() => {
    setIncome(monthlyIncome > 0 ? formatInputCurrency(monthlyIncome.toString()) : '');
    setSavings(savingsGoal > 0 ? formatInputCurrency(savingsGoal.toString()) : '');
    setRentValue(rent > 0 ? formatInputCurrency(rent.toString()) : '');
  }, [monthlyIncome, savingsGoal, rent]);

  const parseValue = (value: string) => Number(value.replace(/[^\d]/g, '')) || 0;

  const handleSaveIncome = () => {
    onUpdateProfile({ monthly_income: parseValue(income) });
  };

  const handleSaveSavings = () => {
    onUpdateProfile({ savings_goal: parseValue(savings) });
  };

  const handleSaveRent = () => {
    onUpdateProfile({ rent: parseValue(rentValue) });
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Sesión cerrada');
  };

  const activeBankIds = userBanks.map(b => b.bank);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Perfil</h1>

      {/* User Info */}
      <Card className="border-none shadow-md rounded-2xl">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Conectado como</p>
          <p className="font-medium truncate">{user?.email}</p>
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
                inputMode="numeric"
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
                inputMode="numeric"
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
                inputMode="numeric"
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
        <CardContent>
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
        </CardContent>
      </Card>

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
