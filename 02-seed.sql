-- ============================================================
-- SEED — Categorias + Histórico (últimos 3 meses)
-- Rodar APÓS o 01-schema.sql, UMA VEZ.
-- ============================================================

-- ---- CATEGORIAS ----
INSERT INTO categorias (nome, tipo, ordem, cor) VALUES
  ('ap', 'fixa', 10, '#7c8aa8'),
  ('aluguel curitiba', 'fixa', 20, '#7c8aa8'),
  ('aluguel divi', 'fixa', 25, '#7c8aa8'),
  ('condominio curitiba', 'fixa', 30, '#7c8aa8'),
  ('condominio divi', 'fixa', 35, '#7c8aa8'),
  ('iptu divi', 'fixa', 40, '#a8755e'),
  ('luz curitiba', 'fixa', 50, '#c89a4a'),
  ('luz divi', 'fixa', 55, '#c89a4a'),
  ('gas', 'fixa', 60, '#c89a4a'),
  ('internet', 'fixa', 70, '#5a8a8c'),
  ('tim', 'fixa', 75, '#5a8a8c'),
  ('babedina', 'fixa', 80, '#6b8e6b'),
  ('psi', 'fixa', 85, '#6b8e6b'),
  ('unicesumar', 'fixa', 90, '#5a8a8c'),
  ('mei', 'fixa', 100, '#a8755e'),
  ('imposto', 'fixa', 105, '#a8755e'),
  ('contabilidade', 'fixa', 110, '#a8755e'),
  ('iti', 'cartao', 200, '#9c6b8e'),
  ('c6 cpf', 'cartao', 210, '#9c6b8e'),
  ('c6 cnpj', 'cartao', 220, '#9c6b8e'),
  ('riachuelo', 'cartao', 230, '#9c6b8e'),
  ('mercado pago', 'cartao', 240, '#9c6b8e'),
  ('tilda', 'cartao', 250, '#9c6b8e'),
  ('faxina', 'pontual', 300, '#8a8a8a'),
  ('mudança', 'pontual', 310, '#8a8a8a'),
  ('palim', 'pontual', 320, '#8a8a8a')
ON CONFLICT (nome) DO NOTHING;

-- ---- HISTÓRICO (últimos 3 meses da planilha) ----
-- Os 'aluguel' soltos foram mapeados pra 'aluguel curitiba' (período pós-mudança).

-- === 2026-02 ===
INSERT INTO lancamentos (mes_referencia, tipo, descricao, valor, usuario) VALUES ('2026-02-01', 'entrada', 'Entrada (importado)', 17400.0, 'Histórico');
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'fixa', id, 700.0, 'Histórico' FROM categorias WHERE nome = 'ap';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'cartao', id, 529.36, 'Histórico' FROM categorias WHERE nome = 'iti';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'cartao', id, 10360.78, 'Histórico' FROM categorias WHERE nome = 'c6 cpf';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'cartao', id, 296.17, 'Histórico' FROM categorias WHERE nome = 'c6 cnpj';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'fixa', id, 4242.99, 'Histórico' FROM categorias WHERE nome = 'aluguel curitiba';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'cartao', id, 987.28, 'Histórico' FROM categorias WHERE nome = 'mercado pago';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'fixa', id, 1000.0, 'Histórico' FROM categorias WHERE nome = 'babedina';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'cartao', id, 302.9, 'Histórico' FROM categorias WHERE nome = 'tilda';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'fixa', id, 300.0, 'Histórico' FROM categorias WHERE nome = 'psi';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'fixa', id, 15376.29, 'Histórico' FROM categorias WHERE nome = 'imposto';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'fixa', id, 1211.98, 'Histórico' FROM categorias WHERE nome = 'condominio curitiba';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'fixa', id, 149.0, 'Histórico' FROM categorias WHERE nome = 'contabilidade';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'fixa', id, 152.33, 'Histórico' FROM categorias WHERE nome = 'gas';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'fixa', id, 234.03, 'Histórico' FROM categorias WHERE nome = 'luz curitiba';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'fixa', id, 124.9, 'Histórico' FROM categorias WHERE nome = 'internet';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-02-01', 'fixa', id, 33.61, 'Histórico' FROM categorias WHERE nome = 'tim';

-- === 2026-03 ===
INSERT INTO lancamentos (mes_referencia, tipo, descricao, valor, usuario) VALUES ('2026-03-01', 'entrada', 'Entrada (importado)', 18139.01, 'Histórico');
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-03-01', 'cartao', id, 394.42, 'Histórico' FROM categorias WHERE nome = 'iti';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-03-01', 'cartao', id, 10818.73, 'Histórico' FROM categorias WHERE nome = 'c6 cpf';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-03-01', 'cartao', id, 166.33, 'Histórico' FROM categorias WHERE nome = 'c6 cnpj';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-03-01', 'fixa', id, 4437.6, 'Histórico' FROM categorias WHERE nome = 'aluguel curitiba';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-03-01', 'cartao', id, 178.0, 'Histórico' FROM categorias WHERE nome = 'mercado pago';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-03-01', 'fixa', id, 1500.0, 'Histórico' FROM categorias WHERE nome = 'babedina';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-03-01', 'fixa', id, 180.0, 'Histórico' FROM categorias WHERE nome = 'psi';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-03-01', 'fixa', id, 1011.02, 'Histórico' FROM categorias WHERE nome = 'imposto';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-03-01', 'fixa', id, 1157.12, 'Histórico' FROM categorias WHERE nome = 'condominio curitiba';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-03-01', 'fixa', id, 136.32, 'Histórico' FROM categorias WHERE nome = 'gas';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-03-01', 'fixa', id, 231.66, 'Histórico' FROM categorias WHERE nome = 'luz curitiba';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-03-01', 'fixa', id, 124.9, 'Histórico' FROM categorias WHERE nome = 'internet';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-03-01', 'fixa', id, 32.99, 'Histórico' FROM categorias WHERE nome = 'tim';

-- === 2026-04 ===
INSERT INTO lancamentos (mes_referencia, tipo, descricao, valor, usuario) VALUES ('2026-04-01', 'entrada', 'Entrada (importado)', 18332.13, 'Histórico');
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-04-01', 'cartao', id, 336.29, 'Histórico' FROM categorias WHERE nome = 'iti';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-04-01', 'cartao', id, 12007.77, 'Histórico' FROM categorias WHERE nome = 'c6 cpf';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-04-01', 'fixa', id, 4586.94, 'Histórico' FROM categorias WHERE nome = 'aluguel curitiba';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-04-01', 'cartao', id, 224.26, 'Histórico' FROM categorias WHERE nome = 'mercado pago';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-04-01', 'fixa', id, 1500.0, 'Histórico' FROM categorias WHERE nome = 'babedina';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-04-01', 'pontual', id, 400.0, 'Histórico' FROM categorias WHERE nome = 'palim';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-04-01', 'fixa', id, 3519.97, 'Histórico' FROM categorias WHERE nome = 'aluguel divi';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-04-01', 'pontual', id, 7400.0, 'Histórico' FROM categorias WHERE nome = 'mudança';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-04-01', 'fixa', id, 1026.42, 'Histórico' FROM categorias WHERE nome = 'imposto';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-04-01', 'fixa', id, 1202.75, 'Histórico' FROM categorias WHERE nome = 'condominio curitiba';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-04-01', 'fixa', id, 149.0, 'Histórico' FROM categorias WHERE nome = 'contabilidade';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-04-01', 'fixa', id, 146.51, 'Histórico' FROM categorias WHERE nome = 'gas';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-04-01', 'fixa', id, 248.14, 'Histórico' FROM categorias WHERE nome = 'luz curitiba';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-04-01', 'fixa', id, 124.9, 'Histórico' FROM categorias WHERE nome = 'internet';
INSERT INTO lancamentos (mes_referencia, tipo, categoria_id, valor, usuario) SELECT '2026-04-01', 'fixa', id, 32.99, 'Histórico' FROM categorias WHERE nome = 'tim';
