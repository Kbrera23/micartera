import { Badge } from '@/components/ui/badge';
import { ExpenseFrequency } from '@/types/expense';
import { cn } from '@/lib/utils';

interface FrequencyBadgeProps {
  frequency: ExpenseFrequency;
  className?: string;
}

const frequencyConfig: Record<ExpenseFrequency, { label: string; className: string }> = {
  monthly: {
    label: 'Mensual',
    className: 'bg-recurring/20 text-recurring border-recurring/30'
  },
  quarterly: {
    label: 'Trimestral',
    className: 'bg-goal/20 text-goal border-goal/30'
  },
  annual: {
    label: 'Anual',
    className: 'bg-orange-500/20 text-orange-600 border-orange-500/30'
  }
};

export const FrequencyBadge = ({ frequency, className }: FrequencyBadgeProps) => {
  const config = frequencyConfig[frequency];

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] px-2 py-0.5 rounded-full font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
};
