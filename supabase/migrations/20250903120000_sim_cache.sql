/*
  Create simulation cache table to store generated results per user/prompt

  - Table: sim_cache
    - id (uuid, primary key)
    - user_id (uuid, required) -> references auth.users(id)
    - subject (text, required)
    - prompt_hash (text, required)
    - canvas_html (text, required)
    - js_code (text, required)
    - explanation (text, required)
    - created_at (timestamptz, default now())

  - RLS: users can read/write only their own cache rows
  - Unique: (user_id, subject, prompt_hash)
*/

CREATE TABLE IF NOT EXISTS sim_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  prompt_hash text NOT NULL,
  canvas_html text NOT NULL,
  js_code text NOT NULL,
  explanation text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sim_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own sim cache"
  ON sim_cache FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sim_cache_user_subject_hash
  ON sim_cache(user_id, subject, prompt_hash);

CREATE INDEX IF NOT EXISTS idx_sim_cache_user_id ON sim_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_sim_cache_created_at ON sim_cache(created_at);

