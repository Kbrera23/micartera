-- Add initial_balance column to user_banks table for "El Colchón"
ALTER TABLE public.user_banks 
ADD COLUMN initial_balance numeric NOT NULL DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.user_banks.initial_balance IS 'Saldo inicial del banco (El Colchón) - se suma al fondo de reserva según el tipo de banco';