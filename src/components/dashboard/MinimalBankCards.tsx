import { Card, CardContent } from '@/components/ui/card';
import { Flame, Star, Zap, CreditCard, Building2 } from 'lucide-react';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { BankType } from '@/hooks/useSupabaseFinances';

interface BankData {
  id: BankType;
  name: string;
  amount: number;
  bgColor: string;
  icon: typeof Building2;
}

interface MinimalBankCardsProps {
  userBanks: { bank: BankType }[];
  monthlyIncome: number;
  savingsGoal: number;
  totalSubscriptions: number;
  reserveFund: number;
  rent: number;
}

export const MinimalBankCards = ({
  userBanks,
  monthlyIncome,
  savingsGoal,
  totalSubscriptions,
  reserveFund,
  rent
}: MinimalBankCardsProps) => {
  // Calculate Santander balance (main spending account)
  const santanderBalance = monthlyIncome - savingsGoal - totalSubscriptions - reserveFund - rent;

  const allBanks: BankData[] = [
    { id: 'santander', name: 'Santander', amount: santanderBalance, bgColor: 'bg-[#EC0000]', icon: Flame },
    { id: 'lacaixa', name: 'La Caixa', amount: savingsGoal, bgColor: 'bg-[#00ABD1]', icon: Star },
    { id: 'ing', name: 'ING', amount: totalSubscriptions, bgColor: 'bg-[#FF6200]', icon: Zap },
    { id: 'revolut', name: 'Revolut', amount: reserveFund, bgColor: 'bg-[#191C1F]', icon: CreditCard },
    { id: 'bbva', name: 'BBVA', amount: 0, bgColor: 'bg-[#004481]', icon: Building2 },
  ];

  // Filter to only show user's selected banks
  const activeBankIds = userBanks.map(b => b.bank);
  const activeBanks = allBanks.filter(b => activeBankIds.includes(b.id));

  if (activeBanks.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      {activeBanks.map((bank) => {
        const Icon = bank.icon;
        return (
          <Card 
            key={bank.id}
            className={cn(
              'flex-shrink-0 border-none shadow-md rounded-2xl min-w-[120px]',
              bank.bgColor
            )}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-white/90" />
                <span className="text-xs font-medium text-white/90">{bank.name}</span>
              </div>
              <p className={cn(
                'text-lg font-bold text-white',
                bank.amount < 0 && 'text-red-200'
              )}>
                {formatCurrencyCompact(bank.amount)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
