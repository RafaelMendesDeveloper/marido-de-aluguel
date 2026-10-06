# Orça! 💸 — Marido de Aluguel (web)

App web **mobile-first** para o profissional de pequenos reparos controlar agenda, serviços, clientes e quanto recebeu.
Multiusuário: cada conta vê só os próprios dados, garantido pelo banco (Row Level Security do Supabase).

- **Produção:** https://rafaelmendesdeveloper.github.io/marido-de-aluguel/
- **Stack:** Vite + React + TypeScript · Tailwind CSS · Supabase (Auth + Postgres + RLS) · TanStack Query · date-fns · PWA
- **Hospedagem:** GitHub Pages (deploy automático a cada push na `main`)
- **Especificação de referência:** [legacy/README.md](legacy/README.md) — análise completa do app Expo antigo (que fica em [legacy/](legacy/)).

## Funcionalidades (V1)

| Tela | O que faz |
|---|---|
| Landing / Entrar / Criar conta | Supabase Auth (e-mail + senha). Sessão persistente; botão de sair em *Minha conta*. |
| Início | Saudação, cards (recebido hoje, pendente hoje, recebido no mês, nº de serviços hoje), agenda de hoje, serviços de hoje, aviso de agendamentos atrasados. |
| Agenda | Calendário mensal (semana começa na segunda), lista do dia com **Iniciar** / **Cancelar** (com confirmação), editar/remarcar/excluir agendamento, seção de atrasados. |
| Novo agendamento | Autocomplete de cliente (cria o cliente se não existir e reaproveita nome igual), data (padrão amanhã), hora (padrão 09:00), descrição. |
| Novo serviço | Valor com máscara de centavos, Pago/Pendente, observação, **data escolhível** (padrão hoje). Vindo de um agendamento: cliente travado, observação = descrição e o agendamento é concluído na mesma transação. |
| Clientes | Busca **sem acento**, cadastro, importação de contatos (Contact Picker no Android/Chrome ou arquivo **.vcf** em qualquer aparelho, com dedup). |
| Perfil do cliente | Dados, editar, excluir, recebido/pendente total, histórico, WhatsApp (com DDI 55), Maps, atalhos para novo serviço/agendamento. |
| Histórico | Filtros Hoje / Semana / Mês / Tudo (paginado), agrupado por dia com total; editar/excluir serviço (inclusive trocar o cliente e a data). |
| Financeiro | Mês ou ano, cards, gráfico de receita (só pagos), top 5 clientes, últimos 8 serviços. |
| Minha conta | Editar nome, sair, apagar todos os dados (exige digitar `APAGAR`). |

Os bugs do app antigo listados na seção 11 da especificação foram corrigidos (datas em fuso local, senha com hash via Supabase Auth, WhatsApp sem DDI, cliente duplicado, etc.).

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:5173/marido-de-aluguel/
```

Outros scripts: `npm run build`, `npm run lint`, `npm run typecheck`, `npm run preview`.

## Configurar o Supabase (uma vez)

1. Crie um projeto em [supabase.com](https://supabase.com) (plano free).
2. **SQL Editor** → cole e rode [supabase/schema.sql](supabase/schema.sql) (tabelas, triggers e RLS).
3. **Authentication → URL Configuration**
   - *Site URL:* `https://rafaelmendesdeveloper.github.io/marido-de-aluguel/`
   - *Redirect URLs:* a URL acima e `http://localhost:5173/marido-de-aluguel/`
4. **Authentication → Sign In / Providers → Email:** para poucos usuários, desligar *Confirm email* evita o limite de e-mails do SMTP embutido (o app funciona com ou sem confirmação).
5. **Project Settings → API:** copie a *Project URL* e a chave **anon / publishable**.

> A chave anon/publishable é pública por design — quem protege os dados é o RLS.
> A chave **service_role / secret nunca** vai para o front nem para o repositório.

## Deploy (GitHub Pages)

O workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) faz lint, build e publica a cada push na `main`.

1. **Settings → Secrets and variables → Actions → New repository secret:**
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
2. **Settings → Pages → Source:** *GitHub Actions*.
3. Rode o workflow *Deploy* (ou faça um push).

Sem os secrets o site sobe mostrando a tela "Configuração pendente".

O workflow [keepalive.yml](.github/workflows/keepalive.yml) faz uma consulta leve por dia para o projeto free do Supabase não ser pausado por inatividade.

Rotas usam `HashRouter` (`/#/clientes`) porque o GitHub Pages não reescreve URLs de SPA.

## Migrar os dados históricos do app antigo

O arquivo `legacy/import.json` (448 clientes, 2103 serviços) pertence a **um** usuário. Ele não é versionado (contém dados de clientes).

1. O dono cria a conta normalmente no app.
2. Pegue o UUID dele em **Authentication → Users**.
3. Rode localmente, com a chave **service_role** (ignora o RLS — não commite):

```bash
SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
  npm run migrar -- <uuid-do-usuario> legacy/import.json
```

O script usa `upsert` por id (pode rodar de novo sem duplicar) e no fim mostra a contagem para conferência.

## Estrutura

```
src/
├── main.tsx / App.tsx        # providers, HashRouter, rotas protegidas
├── lib/                      # supabase, datas (fuso local), moeda, telefone, texto, vcard
├── api/                      # acesso a dados por entidade (supabase-js, paginação > 1000 linhas)
├── hooks/                    # queries do TanStack Query + ações de agendamento
├── auth/AuthContext.tsx      # sessão + perfil
├── components/               # BottomSheet, diálogos/toasts, autocomplete, calendário, gráfico, sheets de edição
└── pages/                    # telas
supabase/schema.sql           # schema + RLS
scripts/migrar.ts             # migração do import.json
legacy/                       # app Expo antigo + especificação (README)
```
