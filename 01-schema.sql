-- ============================================================
-- Controle Financeiro Pessoal — Schema
-- Rodar UMA VEZ no SQL Editor do Supabase (Database → SQL Editor)
-- ============================================================

-- ---- CATEGORIAS ----
CREATE TABLE IF NOT EXISTS categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  tipo text NOT NULL CHECK (tipo IN ('fixa', 'cartao', 'pontual')),
  cor text NOT NULL DEFAULT '#6b7280',
  ordem int NOT NULL DEFAULT 100,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---- RECORRENTES ----
CREATE TABLE IF NOT EXISTS recorrentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid REFERENCES categorias(id) ON DELETE RESTRICT,
  descricao text,
  valor_padrao numeric(12,2),
  dia_mes int CHECK (dia_mes BETWEEN 1 AND 31),
  ativa boolean NOT NULL DEFAULT true,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---- LANÇAMENTOS ----
CREATE TABLE IF NOT EXISTS lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referencia date NOT NULL,            -- primeiro dia do mês de referência
  data date,                                -- data efetiva do lançamento (opcional)
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'fixa', 'cartao', 'pontual')),
  categoria_id uuid REFERENCES categorias(id) ON DELETE RESTRICT,
  descricao text,
  valor numeric(12,2) NOT NULL,
  recorrente_id uuid REFERENCES recorrentes(id) ON DELETE SET NULL,
  usuario text,                             -- nome de quem lançou (display)
  created_by uuid,                          -- auth.uid() de quem criou
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lancamentos_mes ON lancamentos (mes_referencia);
CREATE INDEX IF NOT EXISTS idx_lancamentos_categoria ON lancamentos (categoria_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_tipo ON lancamentos (tipo);

-- ============================================================
-- ROW LEVEL SECURITY
-- Apenas usuários autenticados (você + sua esposa) leem/escrevem.
-- Sem login válido, ninguém vê nada.
-- ============================================================

ALTER TABLE categorias  ENABLE ROW LEVEL SECURITY;
ALTER TABLE recorrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_categorias"  ON categorias;
DROP POLICY IF EXISTS "auth_all_recorrentes" ON recorrentes;
DROP POLICY IF EXISTS "auth_all_lancamentos" ON lancamentos;

CREATE POLICY "auth_all_categorias"  ON categorias  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_recorrentes" ON recorrentes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_lancamentos" ON lancamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- REALTIME
-- Habilita streaming de mudanças (ela lança → aparece no seu app)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE categorias;
ALTER PUBLICATION supabase_realtime ADD TABLE recorrentes;
ALTER PUBLICATION supabase_realtime ADD TABLE lancamentos;
