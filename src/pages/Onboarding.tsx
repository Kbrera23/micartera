import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Wallet, Building2, Flame, Star, Zap, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

type BankType = 'santander' | 'lacaixa' | 'ing' | 'revolut' | 'bbva';

const BANKS: { id: BankType; name: string; color: string; icon: typeof Building2 }[] = [
  { id: 'santander', name: 'Santander', color: 'bg-[#EC0000]', icon: Flame },
  { id: 'lacaixa', name: 'La Caixa', color: 'bg-[#00ABD1]', icon: Star },
  { id: 'ing', name: 'ING', color: 'bg-[#FF6200]', icon: Zap },
  { id: 'revolut', name: 'Revolut', color: 'bg-[#191C1F]', icon: CreditCard },
  { id: 'bbva', name: 'BBVA', color: 'bg-[#004481]', icon: Building2 },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [selectedBanks, setSelectedBanks] = useState<BankType[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const formatInputCurrency = (value: string) => {
    const num = value.replace(/[^\d]/g, '');
    if (!num) return '';
    return new Intl.NumberFormat('es-ES').format(Number(num));
  };

  const parseInputCurrency = (value: string) => {
    return Number(value.replace(/[^\d]/g, '')) || 0;
  };

  const toggleBank = (bankId: BankType) => {
    setSelectedBanks(prev => 
      prev.includes(bankId) 
        ? prev.filter(b => b !== bankId) 
        : [...prev, bankId]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          monthly_income: parseInputCurrency(monthlyIncome),
          savings_goal: parseInputCurrency(savingsGoal),
        });

      if (profileError) throw profileError;

      // Create bank entries
      if (selectedBanks.length > 0) {
        const bankEntries = selectedBanks.map(bank => ({
          user_id: user.id,
          bank: bank,
          is_active: true
        }));

        const { error: banksError } = await supabase
          .from('user_banks')
          .insert(bankEntries);

        if (banksError) throw banksError;
      }

      toast.success('¡Perfil configurado correctamente!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === 1 ? 'Configura tu Nómina' : 'Selecciona tus Bancos'}
          </CardTitle>
          <CardDescription>
            {step === 1 
              ? 'Define tus ingresos mensuales y objetivo de ahorro'
              : 'Elige los bancos que usas habitualmente'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="income">Nómina Mensual (€)</Label>
                <Input
                  id="income"
                  type="text"
                  inputMode="numeric"
                  placeholder="2.500"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(formatInputCurrency(e.target.value))}
                  className="rounded-xl h-14 text-xl font-semibold text-center"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="savings">Objetivo de Ahorro Mensual (€)</Label>
                <Input
                  id="savings"
                  type="text"
                  inputMode="numeric"
                  placeholder="500"
                  value={savingsGoal}
                  onChange={(e) => setSavingsGoal(formatInputCurrency(e.target.value))}
                  className="rounded-xl h-14 text-xl font-semibold text-center"
                />
              </div>
              <Button 
                onClick={() => setStep(2)}
                className="w-full h-12 rounded-xl text-base font-semibold"
                disabled={!monthlyIncome}
              >
                Continuar
              </Button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {BANKS.map((bank) => {
                  const Icon = bank.icon;
                  const isSelected = selectedBanks.includes(bank.id);
                  return (
                    <button
                      key={bank.id}
                      onClick={() => toggleBank(bank.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bank.color)}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-medium text-sm">{bank.name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 rounded-xl"
                >
                  Atrás
                </Button>
                <Button 
                  onClick={handleComplete}
                  className="flex-1 h-12 rounded-xl font-semibold"
                  disabled={loading || selectedBanks.length === 0}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Completar'}
                </Button>
              </div>
            </>
          )}
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 pt-2">
            <div className={cn('w-2 h-2 rounded-full', step >= 1 ? 'bg-primary' : 'bg-muted')} />
            <div className={cn('w-2 h-2 rounded-full', step >= 2 ? 'bg-primary' : 'bg-muted')} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
