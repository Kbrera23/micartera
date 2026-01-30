import { BankCard } from './BankCard';

interface BankDistributionProps {
  monthlyIncome: number;
  savingsGoal: number;
  totalSubscriptions: number;
  reserveFund: number;
  rent: number;
}

export const BankDistribution = ({
  monthlyIncome,
  savingsGoal,
  totalSubscriptions,
  reserveFund,
  rent
}: BankDistributionProps) => {
  // Santander = Income - Savings - Subscriptions (ING) - Reserve (Revolut) - Rent
  const santanderBalance = monthlyIncome - savingsGoal - totalSubscriptions - reserveFund - rent;

  const banks = [
    {
      name: 'santander',
      displayName: 'Santander',
      amount: santanderBalance,
      description: 'Saldo disponible para gasto diario',
      colorClass: 'bg-santander',
      bgClass: 'bg-gradient-to-br from-red-600 to-red-700'
    },
    {
      name: 'lacaixa',
      displayName: 'La Caixa',
      amount: savingsGoal,
      description: 'Objetivo de ahorro mensual',
      colorClass: 'bg-lacaixa',
      bgClass: 'bg-gradient-to-br from-blue-600 to-blue-700'
    },
    {
      name: 'ing',
      displayName: 'ING',
      amount: totalSubscriptions,
      description: 'Suscripciones digitales',
      colorClass: 'bg-ing',
      bgClass: 'bg-gradient-to-br from-orange-500 to-orange-600'
    },
    {
      name: 'revolut',
      displayName: 'Revolut',
      amount: reserveFund,
      description: 'Fondo de reserva (provisiones)',
      colorClass: 'bg-revolut',
      bgClass: 'bg-gradient-to-br from-gray-700 to-gray-800'
    }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        💳 Distribución Bancaria
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {banks.map((bank) => (
          <BankCard key={bank.name} {...bank} />
        ))}
      </div>
    </div>
  );
};
