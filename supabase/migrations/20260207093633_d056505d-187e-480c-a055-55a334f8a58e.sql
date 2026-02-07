-- Add installment/part payment tracking columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_part_payment boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS total_expected_amount numeric,
ADD COLUMN IF NOT EXISTS linked_transaction_id uuid REFERENCES transactions(id);

-- Add index for efficient querying of linked transactions
CREATE INDEX IF NOT EXISTS idx_transactions_linked_id ON transactions(linked_transaction_id) WHERE linked_transaction_id IS NOT NULL;

-- Add index for finding part payments
CREATE INDEX IF NOT EXISTS idx_transactions_part_payment ON transactions(is_part_payment) WHERE is_part_payment = true;