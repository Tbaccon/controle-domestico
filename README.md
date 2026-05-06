# Controle Doméstico

App de controle financeiro pessoal. Frontend estático (HTML/CSS/JS) + Supabase (Postgres + Auth + Realtime).

## Arquivos

| Arquivo | O que é |
|---|---|
| `01-schema.sql` | Cria as tabelas, índices e regras de segurança. Roda **uma vez**. |
| `02-seed.sql` | Popula categorias + importa os 3 últimos meses (fev, mar, abr/26). Roda **uma vez** depois do schema. |
| `index.html`, `styles.css`, `app.js`, `config.js` | O app em si. Só os 4 precisam ir pro GitHub Pages. |

---

## Passo a passo

### 1. Rodar o schema no Supabase

No painel do Supabase do seu projeto:

1. Menu lateral → **SQL Editor** → **New query**
2. Cola o conteúdo de `01-schema.sql` inteiro
3. Clica em **Run**
4. Confere se rodou sem erro (vai ver "Success. No rows returned")

### 2. Popular categorias e histórico

1. **New query** de novo
2. Cola o conteúdo de `02-seed.sql`
3. **Run**
4. Confere: roda uma query `SELECT count(*) FROM lancamentos;` — deve retornar uns 50+ lançamentos.

### 3. Criar os usuários

A política de segurança bloqueia qualquer acesso sem login, mas o cadastro está aberto por padrão. Pra blindar:

1. **Authentication → Sign In / Providers → Email**
2. Desliga a opção **Enable Sign-ups** (assim ninguém de fora consegue se cadastrar)
3. **Authentication → Users → Add user → Send invitation**
4. Convida seu email e o da sua esposa
5. Cada um recebe um link, clica, define a senha, pronto

> Se quiser pular essa parte agora e testar primeiro, deixa "Enable Sign-ups" ligado, faz login uma vez pelo próprio app (vai ter que mexer no código pra adicionar um botão de cadastro — ou só usa o convite mesmo, é mais simples).

### 4. Testar localmente (opcional)

Se quiser rodar antes de publicar, abre um servidor estático na pasta:

```bash
# se tiver Python
python3 -m http.server 8000

# ou com node
npx serve .
```

Aí abre `http://localhost:8000`. Login usando o convite que você se mandou.

> ⚠ Abrir `index.html` direto (`file://`) pode dar problema com auth do Supabase. Use o servidor local.

### 5. Publicar no GitHub Pages

Mesmo esquema do CRM:

1. Cria um repo novo no GitHub (ex: `controle-domestico`) — pode ser **público**, a chave anon não dá acesso a nada sem autenticação
2. Sobe os 4 arquivos do app (não precisa subir os `.sql` nem este README, mas pode se quiser)
3. Settings → Pages → Source: **main** branch / root
4. Espera 1-2 min, vai estar em `tbaccon.github.io/controle-domestico/`

Manda o link pra sua esposa, ela faz login, e tá rodando nos dois computadores em tempo real.

---

## O que tem dentro

**Mês**: visão tipo a planilha original — fixas à esquerda, cartões à direita, entradas e pontuais separados, summary cards no topo (entrada, fixas, sobra, cartões+pontuais, FINAL).

**Recorrentes**: cadastra contas que se repetem todo mês com valor padrão e dia. Aparecem como pendentes (em itálico, opacas) no mês até você confirmar o valor — clica e o app já abre o lançamento prefilled.

**Categorias**: CRUD completo. Pode criar, editar cor/ordem, desativar (não dá pra excluir se tiver lançamento usando — RESTRICT no banco).

**Comparar**: gráfico de barras + linha do FINAL nos últimos 12 meses + tabela de detalhe.

**Config**: backup/restore em JSON.

**Tempo real**: qualquer mudança de um lado aparece no outro automaticamente (ela lança no PC, você vê na sua tela).

---

## Notas

- **Categoria "aluguel" do histórico**: meses 02/26 e 03/26 estavam com a categoria genérica "aluguel" — mapeei pra `aluguel curitiba` (período pós-mudança). Em abril/26 já estavam separados.
- **Imposto de R$15.376 em fev/26**: importado como tá. O FINAL daquele mês fica negativo em -R$18.601 — é o dado real da planilha.
- **Pontuais antigas** que não eram comuns (sofa e cama, telas, victor) não foram pré-cadastradas como categorias. Se precisar, cria na tela de Categorias.

---

## Se quebrar

- **Login não funciona**: cheque se rodou o schema (sem ele, login funciona mas não tem onde gravar nada).
- **"row violates row-level security policy"**: sessão expirou ou usuário não está autenticado. Faz logout/login.
- **Não aparece em tempo real**: confere em **Database → Replication** se as 3 tabelas estão habilitadas (o schema já faz isso, mas vale conferir).

Qualquer ajuste, é só voltar aqui.
