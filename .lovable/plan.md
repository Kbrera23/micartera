

## Plan: Corregir cálculo de Dinero Libre (solo descontar pagos realizados)

### Problema
El `dineroLibre` resta `reserveFund` (provisiones trimestrales/anuales) siempre, incluso antes de que se paguen. Lo mismo con la provisión mensual de Revolut. El usuario quiere que solo se descuenten cuando se marcan como "Hecho" o "Pagado".

### Cambios

**1. Migración SQL** — Crear tabla `monthly_payments_tracking`
- Columnas: `id`, `user_id`, `payment_type` (text), `amount` (numeric), `month` (int), `year` (int), `paid_date` (date), `created_at`
- Constraint UNIQUE en `(user_id, payment_type, month, year)` para evitar duplicados
- RLS: SELECT e INSERT con `auth.uid() = user_id`

**2. Modificar `useSupabaseFinances.ts`**
- Añadir fetch de `monthly_payments_tracking` del mes actual en `fetchData`
- Guardar en nuevo estado `paidThisMonth` (suma de amounts del mes actual)
- Cambiar línea 385 de:
  ```
  dineroLibre = monthlyIncome - rent - totalFixedExpenses - savingsGoal - reserveFund - totalPurchaseGoalQuotas
  ```
  a:
  ```
  dineroLibre = monthlyIncome - rent - totalFixedExpenses - savingsGoal - totalPurchaseGoalQuotas - paidThisMonth
  ```
- Seguir exponiendo `reserveFund` y `quarterlyProvision` para que el recordatorio mensual sepa qué cantidad mostrar

**3. Modificar `MonthlyReminder.tsx`**
- Además de insertar en `monthly_reminders_completed`, insertar en `monthly_payments_tracking` con `payment_type: 'quarterly_provision'` y `amount: quarterlyProvision`
- Recibir y llamar `refetch` como prop para que el dashboard se actualice inmediatamente

**4. Modificar `UpcomingLargePayments.tsx`**
- En `handleMarkAsPaid`, además de la lógica actual, insertar en `monthly_payments_tracking` con `payment_type: 'expense_payment'` y el amount del gasto
- Esto hace que el dinero libre se reduzca solo cuando se marca como pagado

**5. Actualizar `MinimalDashboard.tsx`**
- Pasar `refetch` como prop a `MonthlyReminder`

### Archivos afectados
- `supabase/migrations/` — nueva migración
- `src/hooks/useSupabaseFinances.ts` — fetch tracking + cálculo dineroLibre
- `src/components/dashboard/MonthlyReminder.tsx` — insertar tracking + recibir refetch
- `src/components/dashboard/UpcomingLargePayments.tsx` — insertar tracking
- `src/components/sections/MinimalDashboard.tsx` — pasar refetch a MonthlyReminder

### Nota sobre logos de bancos
Ya están implementados con URLs de Wikimedia Commons en `BankCard.tsx` y `MinimalBankCards.tsx`. No requiere cambios adicionales.

