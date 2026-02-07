-- Add planned_installments column for storing future installment plans
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS planned_installments jsonb DEFAULT '[]'::jsonb;

-- Add index for querying part payments with pending installments
CREATE INDEX IF NOT EXISTS idx_transactions_part_payment 
ON transactions (user_id, is_part_payment) 
WHERE is_part_payment = true;