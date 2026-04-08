import { Building2 } from 'lucide-react';
import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { BankType } from '@/hooks/useSupabaseFinances';

const BANK_LOGOS: Record<BankType, string> = {
  santander: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Banco_Santander_Logotipo.svg/1200px-Banco_Santander_Logotipo.svg.png',
  lacaixa: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/CaixaBank%2C_S.A._logo.svg/1200px-CaixaBank%2C_S.A._logo.svg.png',
  ing: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/ING_Group_N.V._Logo.svg/1200px-ING_Group_N.V._Logo.svg.png',
  revolut: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Revolut_Logo.svg/1200px-Revolut_Logo.svg.png',
  bbva: '',
};

interface BankData {
  id: BankType;
  name: string;
  amount: number;
  bgColor: string;
  logo: string;
}

interface MinimalBankCardsProps {
  userBanks: { bank: BankType; initial_balance: number }[];
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
  const getInitialBalance = (bankId: BankType) => {
    const bank = userBanks.find(b => b.bank === bankId);
    return bank?.initial_balance || 0;
  };

  const santanderBalance = monthlyIncome - savingsGoal - totalSubscriptions - reserveFund - rent;
  const lacaixaBalance = savingsGoal + getInitialBalance('lacaixa');
  const revolutBalance = reserveFund + getInitialBalance('revolut');

  const allBanks: BankData[] = [
    { id: 'santander', name: 'Santander', amount: santanderBalance, bgColor: 'bg-santander', logo: BANK_LOGOS.santander },
    { id: 'lacaixa', name: 'La Caixa', amount: lacaixaBalance, bgColor: 'bg-lacaixa', logo: BANK_LOGOS.lacaixa },
    { id: 'ing', name: 'ING', amount: totalSubscriptions, bgColor: 'bg-ing', logo: BANK_LOGOS.ing },
    { id: 'revolut', name: 'Revolut', amount: revolutBalance, bgColor: 'bg-revolut', logo: BANK_LOGOS.revolut },
    { id: 'bbva', name: 'BBVA', amount: getInitialBalance('bbva'), bgColor: 'bg-bbva', logo: BANK_LOGOS.bbva },
  ];

  const activeBankIds = userBanks.map(b => b.bank);
  const activeBanks = allBanks.filter(b => activeBankIds.includes(b.id));

  if (activeBanks.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
      {activeBanks.map((bank) => (
        <div
          key={bank.id}
          className={cn(
            'flex-shrink-0 rounded-2xl min-w-[140px] p-4 shadow-lg transition-all duration-200 hover:scale-[1.02]',
            bank.bgColor
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            {bank.logo ? (
              <div className="w-5 h-5 flex items-center justify-center">
                <img
                  src={bank.logo}
                  alt={`${bank.name} logo`}
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </div>
            ) : (
              <Building2 className="w-4 h-4 text-white/80" />
            )}
            <span className="text-[11px] font-semibold text-white/70 tracking-wide">{bank.name}</span>
          </div>
          <p className={cn(
            'text-xl font-bold text-white font-mono tracking-tight',
            bank.amount < 0 && 'text-red-200'
          )}>
            {formatCurrencyCompact(bank.amount)}
          </p>
        </div>
      ))}
    </div>
  );
};
