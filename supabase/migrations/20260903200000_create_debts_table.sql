-- Create enum for debt types
CREATE TYPE debt_type AS ENUM ('owed_to_me', 'i_owe');

-- Create debts table
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type debt_type NOT NULL,
  counterpart_name TEXT NOT NULL,
  amount BIGINT NOT NULL CHECK (amount >= 0),
  note TEXT,
  due_date DATE,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only select their own debts
CREATE POLICY "Users can view their own debts" ON debts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own debts
CREATE POLICY "Users can insert their own debts" ON debts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own debts
CREATE POLICY "Users can update their own debts" ON debts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own debts
CREATE POLICY "Users can delete their own debts" ON debts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_debts_updated_at
  BEFORE UPDATE ON debts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
