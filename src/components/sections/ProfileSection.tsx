import { IncomeCard } from '@/components/IncomeCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Info } from 'lucide-react';

interface ProfileSectionProps {
  monthlyIncome: number;
  savingsGoal: number;
  onSetIncome: (amount: number) => void;
  onSetSavingsGoal: (amount: number) => void;
}

export const ProfileSection = ({
  monthlyIncome,
  savingsGoal,
  onSetIncome,
  onSetSavingsGoal
}: ProfileSectionProps) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Perfil y Ajustes</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income Card */}
        <IncomeCard
          monthlyIncome={monthlyIncome}
          savingsGoal={savingsGoal}
          onSetIncome={onSetIncome}
          onSetSavingsGoal={onSetSavingsGoal}
        />

        {/* Info Card */}
        <Card className="glass-card rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-medium">
              <div className="p-2 rounded-xl bg-muted">
                <Info className="h-5 w-5 text-foreground" />
              </div>
              Cómo Funciona
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="font-medium text-foreground mb-1">💰 Distribución Bancaria</p>
                <p>Tu nómina se distribuye automáticamente entre tus bancos según el tipo de gasto.</p>
              </div>
              
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="font-medium text-foreground mb-1">🏦 Fondo de Reserva</p>
                <p>Los gastos trimestrales y anuales se provisionan mensualmente para que no te pille desprevenido.</p>
              </div>
              
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="font-medium text-foreground mb-1">🎯 Objetivos de Compra</p>
                <p>Añade tus caprichos con fecha límite y la app calculará cuánto debes ahorrar al mes.</p>
              </div>
              
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="font-medium text-foreground mb-1">💾 Persistencia</p>
                <p>Todos tus datos se guardan en el navegador automáticamente.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
