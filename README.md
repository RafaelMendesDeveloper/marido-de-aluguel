# Orça! 💸 — Marido de Aluguel (web)

App web **mobile-first** para o profissional de pequenos reparos controlar agenda, serviços, clientes e quanto recebeu.
Multiusuário: cada conta vê só os próprios dados, garantido pelo banco (Row Level Security do Supabase).

- **Produção:** https://rafaelmendesdeveloper.github.io/marido-de-aluguel/
- **Stack:** Vite + React + TypeScript · Tailwind CSS · Supabase (Auth + Postgres + RLS) · TanStack Query · date-fns · PWA
- **Hospedagem:** GitHub Pages (deploy automático a cada push na `main`)
- **Especificação de referência:** [legacy/README.md](legacy/README.md) — análise completa do app Expo antigo (que fica em [legacy/](legacy/)).

## Funcionalidades

**Layout:** mobile-first. No celular, barra inferior com botão **+** central (registrar serviço, agendar, novo cliente). A partir de 1024px, barra lateral com atalhos e telas em várias colunas. Formulários abrem como gaveta no celular e como janela no desktop, sem trocar de tela. No desktop: tecla **S** registra serviço, **A** agenda, **C** cria cliente.

| Tela | O que faz |
|---|---|
| Landing | Página de apresentação com mockup do app, recursos, como funciona e dúvidas. |
| Entrar / Criar conta | Supabase Auth (e-mail + senha), com botão de mostrar senha. |
| Boas-vindas (onboarding) | 3 passos no primeiro acesso: profissão → serviços frequentes (viram atalhos) → importar clientes. Termina oferecendo agendar ou registrar o primeiro serviço. |
| Início | Saudação, 4 indicadores (recebido hoje, no mês, **a receber**, visitas hoje), card do **próximo atendimento** (Iniciar, WhatsApp, Rota), agenda e serviços de hoje, **quem está devendo** com botão **Cobrar** (mensagem pronta no WhatsApp). |
| Agenda | Calendário (semana começa na segunda), visitas do dia com **Iniciar**, próximas visitas, atrasadas em destaque; editar, remarcar, cancelar (com confirmação) e excluir. |
| Registrar serviço / Agendar | Autocomplete de cliente (cria se não existir e reaproveita nome igual), **atalhos** de valor (R$ 50…300), dia (Hoje, Amanhã, próximos dias), horário e serviços frequentes. Ao iniciar uma visita, cliente e descrição já vêm preenchidos e a visita é concluída na mesma transação. |
| Clientes | Lista com busca **sem acento** e perfil ao lado (desktop). Perfil: WhatsApp, ligar, rota, já pagou / a receber, **Cobrar** e **Recebi tudo**, histórico. Importação pela agenda do celular, arquivo **.vcf** ou lista digitada. |
| Histórico | Filtros Hoje / Semana / Mês / **A receber** / Tudo (paginado), busca por cliente ou serviço, totais do filtro, agrupado por dia. |
| Financeiro | Mês ou ano, indicadores, gráfico de recebido, melhores clientes, últimos serviços. No celular, divide a aba "Finanças" com o Histórico. |
| Minha conta | Nome, profissão e serviços frequentes, importar contatos, sair, apagar todos os dados (exige digitar `APAGAR`). |

Profissão, serviços frequentes e o status do onboarding ficam no `user_metadata` do Supabase Auth — não exigem tabela nova.

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
├── lib/                      # supabase, datas (fuso local), moeda/cobrança, telefone, texto, vcard, profissões
├── api/                      # acesso a dados por entidade (supabase-js, paginação > 1000 linhas)
├── hooks/                    # queries do TanStack Query, importação de contatos, ações de agendamento
├── auth/AuthContext.tsx      # sessão + perfil
├── components/               # AppShell (menu lateral/inferior), Modal, Acoes (modais globais + atalhos), formulários, calendário, gráfico
└── pages/                    # telas
supabase/schema.sql           # schema + RLS
scripts/migrar.ts             # migração do import.json
legacy/                       # app Expo antigo + especificação (README)
```
