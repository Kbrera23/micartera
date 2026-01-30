import { Card, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BankCardProps {
  name: string;
  displayName: string;
  amount: number;
  description: string;
  colorClass: string;
  bgClass: string;
}

export const BankCard = ({ 
  name, 
  displayName, 
  amount, 
  description, 
  colorClass, 
  bgClass 
}: BankCardProps) => {
  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Card className={cn(
      'overflow-hidden rounded-2xl border-none shadow-lg transition-transform hover:scale-[1.02]',
      bgClass
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-xl', colorClass.includes('santander') ? 'bg-white/20' : 'bg-white/30')}>
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">{displayName}</span>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className={cn(
            'text-2xl font-bold',
            amount < 0 ? 'text-red-200' : 'text-white'
          )}>
            {formatCurrency(amount)}
          </p>
          <p className="text-white/70 text-xs">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};
