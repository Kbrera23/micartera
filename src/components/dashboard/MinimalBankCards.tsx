import { formatCurrencyCompact } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { BankType } from '@/hooks/useSupabaseFinances';

interface BankData {
  id: BankType;
  name: string;
  amount: number;
  bgColor: string;
}

interface MinimalBankCardsProps {
  userBanks: { bank: BankType; initial_balance: number }[];
  monthlyIncome: number;
  savingsGoal: number;
  totalSubscriptions: number;
  reserveFund: number;
  rent: number;
}

// SVGs inline para cada banco — sin dependencia de URLs externas
const BANK_TEXT_COLOR: Record<BankType, string> = {
  santander: 'white',
  lacaixa: 'white',
  ing: 'white',
  revolut: '#0a0a0a',
  bbva: 'white',
};

export const BankLogo = ({ bankId }: { bankId: BankType }) => {
  const color = BANK_TEXT_COLOR[bankId];
  switch (bankId) {
    case 'santander':
      return (
        <svg viewBox="0 0 130 26" className="h-5 w-auto">
          <text x="0" y="20" fontSize="18" fontWeight="700" fontFamily="Arial, sans-serif" fill={color}>Santander</text>
        </svg>
      );
    case 'lacaixa':
      return (
        <svg viewBox="0 0 110 26" className="h-5 w-auto">
          <text x="0" y="20" fontSize="18" fontWeight="700" fontFamily="Arial, sans-serif" fill={color}>CaixaBank</text>
        </svg>
      );
    case 'ing':
      return (
        <svg viewBox="0 0 52 26" className="h-5 w-auto">
          <rect width="52" height="26" rx="4" fill={color} opacity="0.2"/>
          <text x="6" y="19" fontSize="16" fontWeight="900" fontFamily="Arial, sans-serif" fill={color}>ING</text>
        </svg>
      );
    case 'revolut':
      return (
        <svg viewBox="0 0 90 26" className="h-5 w-auto">
          <text x="0" y="20" fontSize="18" fontWeight="700" fontFamily="Arial, sans-serif" fill={color}>Revolut</text>
        </svg>
      );
    case 'bbva':
      return (
        <svg viewBox="0 0 65 26" className="h-5 w-auto">
          <text x="0" y="20" fontSize="18" fontWeight="900" fontFamily="Arial, sans-serif" fill={color}>BBVA</text>
        </svg>
      );
    default:
      return null;
  }
};

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
    { id: 'santander', name: 'Santander', amount: santanderBalance, bgColor: 'bg-santander' },
    { id: 'lacaixa', name: 'La Caixa', amount: lacaixaBalance, bgColor: 'bg-lacaixa' },
    { id: 'ing', name: 'ING', amount: totalSubscriptions, bgColor: 'bg-ing' },
    { id: 'revolut', name: 'Revolut', amount: revolutBalance, bgColor: 'bg-revolut' },
    { id: 'bbva', name: 'BBVA', amount: getInitialBalance('bbva'), bgColor: 'bg-bbva' },
  ];

  const activeBankIds = userBanks.map(b => b.bank);
  const activeBanks = allBanks.filter(b => activeBankIds.includes(b.id));

  if (activeBanks.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
      {activeBanks.map((bank, idx) => (
        <div
          key={bank.id}
          className={cn(
            'flex-shrink-0 rounded-2xl min-w-[150px] p-4 transition-all duration-300 ease-out',
            'shadow-[0_8px_24px_-8px_hsl(200_45%_4%/0.6),0_2px_8px_-2px_hsl(200_45%_4%/0.4)]',
            'hover:scale-[1.04] hover:-translate-y-1',
            'hover:shadow-[0_20px_40px_-12px_hsl(200_45%_4%/0.7),0_8px_16px_-4px_hsl(186_100%_50%/0.15)]',
            'animate-fade-in',
            bank.bgColor
          )}
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className="mb-3 h-6 flex items-center">
            <BankLogo bankId={bank.id} />
          </div>
          <p className={cn(
            'text-xl font-bold font-mono tracking-tight',
            bank.id === 'revolut' ? 'text-gray-900' : 'text-white',
            bank.amount < 0 && 'text-red-400'
          )}>
            {formatCurrencyCompact(bank.amount)}
          </p>
        </div>
      ))}
    </div>
  );
};