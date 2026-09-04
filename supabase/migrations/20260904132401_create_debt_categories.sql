CREATE TABLE debt_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE debt_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories" ON debt_categories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON debt_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON debt_categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON debt_categories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE debts
ADD COLUMN category_id UUID REFERENCES debt_categories(id) ON DELETE SET NULL;
