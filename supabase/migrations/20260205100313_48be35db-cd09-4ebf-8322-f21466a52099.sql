-- Add status column to purchase_goals
ALTER TABLE purchase_goals 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'pending'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_goals_status 
ON purchase_goals(status);

-- Update existing goals to active
UPDATE purchase_goals 
SET status = 'active' 
WHERE status IS NULL;