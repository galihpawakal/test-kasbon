-- 1. Create debt status ENUM
CREATE TYPE debt_status_type AS ENUM ('unpaid', 'partial', 'paid');

-- 2. Add columns to debts table
ALTER TABLE debts ADD COLUMN status debt_status_type DEFAULT 'unpaid' NOT NULL;
ALTER TABLE debts ADD COLUMN total_paid BIGINT DEFAULT 0 NOT NULL;

-- 3. Add constraint to prevent overpayment at DB level
ALTER TABLE debts ADD CONSTRAINT check_total_paid_valid CHECK (total_paid >= 0 AND total_paid <= amount);

-- 4. Migrate existing data
UPDATE debts
SET status = 'paid', total_paid = amount
WHERE settled_at IS NOT NULL;

-- 5. Create installments table
CREATE TABLE installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  paid_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for installments
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own installments
CREATE POLICY "Users can view their own installments" ON installments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own installments
CREATE POLICY "Users can insert their own installments" ON installments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own installments
CREATE POLICY "Users can update their own installments" ON installments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own installments
CREATE POLICY "Users can delete their own installments" ON installments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Trigger to recalculate total_paid and update status
CREATE OR REPLACE FUNCTION update_debt_total_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_debt_id UUID;
  v_total BIGINT;
  v_amount BIGINT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_debt_id := OLD.debt_id;
  ELSE
    v_debt_id := NEW.debt_id;
  END IF;

  -- Calculate total paid safely using SUM (prevents race conditions compared to incrementing)
  SELECT COALESCE(SUM(amount), 0) INTO v_total 
  FROM installments 
  WHERE debt_id = v_debt_id;

  -- Get debt amount
  SELECT amount INTO v_amount 
  FROM debts 
  WHERE id = v_debt_id;

  -- Ensure we don't violate the constraint (though API should catch this first)
  IF v_total > v_amount THEN
    RAISE EXCEPTION 'Total paid (%) exceeds debt amount (%)', v_total, v_amount;
  END IF;

  -- Update debts based on the new total
  IF v_total >= v_amount THEN
    UPDATE debts 
    SET total_paid = v_total, 
        status = 'paid', 
        settled_at = COALESCE(settled_at, now()) 
    WHERE id = v_debt_id;
  ELSIF v_total > 0 THEN
    UPDATE debts 
    SET total_paid = v_total, 
        status = 'partial', 
        settled_at = NULL 
    WHERE id = v_debt_id;
  ELSE
    UPDATE debts 
    SET total_paid = v_total, 
        status = 'unpaid', 
        settled_at = NULL 
    WHERE id = v_debt_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER on_installment_changed
  AFTER INSERT OR UPDATE OR DELETE ON installments
  FOR EACH ROW EXECUTE PROCEDURE update_debt_total_paid();
