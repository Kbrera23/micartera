import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChartIcon } from 'lucide-react';

interface DistributionChartProps {
  fixedExpenses: number;
  savingsGoal: number;
  reserveFund: number;
  availableForHobbies: number;
}

export const DistributionChart = ({
  fixedExpenses,
  savingsGoal,
  reserveFund,
  availableForHobbies
}: DistributionChartProps) => {
  const data = [
    { name: 'Gastos Fijos', value: fixedExpenses, color: 'hsl(var(--expense))' },
    { name: 'Ahorro', value: savingsGoal, color: 'hsl(var(--income))' },
    { name: 'Provisiones', value: reserveFund, color: 'hsl(var(--recurring))' },
    { name: 'Ocio', value: Math.max(0, availableForHobbies), color: 'hsl(var(--goal))' },
  ].filter(item => item.value > 0);

  const formatCurrency = (value: number) => {
    return `€${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <div className="p-2 rounded-xl bg-muted">
            <PieChartIcon className="h-5 w-5 text-foreground" />
          </div>
          Distribución del Ingreso
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    padding: '8px 12px'
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Añade ingresos y gastos para ver la distribución
          </p>
        )}
      </CardContent>
    </Card>
  );
};
