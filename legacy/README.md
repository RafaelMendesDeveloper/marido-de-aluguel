# Orça! — Marido de Aluguel (app Expo) · Documentação de referência

> **Para que serve este documento:** é a análise completa do app atual (React Native + Expo + SQLite local).
> Ele é a **especificação de referência** para construir um **novo projeto web, mobile-first, multiusuário**,
> hospedado no **GitHub Pages** e usando **Supabase (plano free)** como backend.
>
> - Parte 1 (seções 1–9): o que o app atual faz, exatamente como faz.
> - Parte 2 (seções 10–12): bugs e limitações a **não** copiar.
> - Parte 3 (seções 13–20): especificação do projeto novo (stack, schema Postgres com RLS, deploy, migração dos dados).

---

## Sumário

1. [Visão geral do produto](#1-visão-geral-do-produto)
2. [Stack atual](#2-stack-atual)
3. [Estrutura de pastas](#3-estrutura-de-pastas)
4. [Modelo de dados](#4-modelo-de-dados)
5. [Autenticação e sessão](#5-autenticação-e-sessão)
6. [Navegação](#6-navegação)
7. [Telas — comportamento detalhado](#7-telas--comportamento-detalhado)
8. [Regras de negócio e cálculos](#8-regras-de-negócio-e-cálculos)
9. [Design system](#9-design-system)
10. [Catálogo de funções de dados (queries)](#10-catálogo-de-funções-de-dados-queries)
11. [Bugs e limitações conhecidos](#11-bugs-e-limitações-conhecidos)
12. [Dados históricos (`import.json`)](#12-dados-históricos-importjson)
13. [Projeto novo — requisitos](#13-projeto-novo--requisitos)
14. [Projeto novo — stack recomendada](#14-projeto-novo--stack-recomendada)
15. [Projeto novo — schema Supabase (SQL completo com RLS)](#15-projeto-novo--schema-supabase-sql-completo-com-rls)
16. [Projeto novo — mapeamento das queries para supabase-js](#16-projeto-novo--mapeamento-das-queries-para-supabase-js)
17. [Projeto novo — adaptações de recursos nativos para web](#17-projeto-novo--adaptações-de-recursos-nativos-para-web)
18. [Projeto novo — deploy no GitHub Pages](#18-projeto-novo--deploy-no-github-pages)
19. [Projeto novo — migração dos dados históricos](#19-projeto-novo--migração-dos-dados-históricos)
20. [Checklist de paridade de funcionalidades](#20-checklist-de-paridade-de-funcionalidades)

---

## 1. Visão geral do produto

**Nome exibido:** `Orça! 💸` — tagline: *"Tempo é dinheiro, economize com Orça!"*
**Nome técnico:** `marido-de-aluguel`
**Público:** profissional autônomo de pequenos reparos ("marido de aluguel") que precisa:

| Necessidade | Como o app resolve |
|---|---|
| Saber o que tem para fazer hoje | Tela **Início** com agenda do dia + serviços feitos hoje |
| Agendar visitas | Tela **Agenda** (calendário mensal) + formulário **Novo Agendamento** |
| Registrar um serviço feito e quanto cobrou | Formulário **Novo Serviço** (valor, pago/pendente, observação) |
| Saber quem está devendo | Status **Pago / Pendente** em cada serviço, totais por cliente e por período |
| Ter a carteira de clientes | Tela **Clientes** (busca, cadastro, importação da agenda do celular) + **Perfil do cliente** |
| Ver quanto ganhou | Tela **Financeiro** (mês/ano, gráfico de barras, top clientes) e **Histórico** |
| Falar com o cliente / ir até ele | Botões de **WhatsApp** e **Google Maps** no perfil do cliente |

Fluxo principal do dia a dia:

```
Agendar (cliente + data + hora + descrição)
      │
      ▼
No dia: Início/Agenda → "Iniciar" no agendamento
      │
      ▼
Novo Serviço (cliente e observação pré-preenchidos) → informa valor e se foi pago
      │
      ▼
Agendamento vira "concluido"; serviço aparece no Início, Histórico, Financeiro e no Perfil do cliente
      │
      ▼
Se ficou "Pendente": quando o cliente pagar, abre o serviço e muda para "Pago"
```

---

## 2. Stack atual

| Item | Versão / detalhe |
|---|---|
| Expo SDK | `^54.0.34` (o `AGENTS.md` pede para consultar a doc v55) |
| React / React Native | 19.1.0 / 0.81.5 |
| Roteamento | `expo-router` ~6 (rotas por arquivo, Stack + Tabs) |
| Banco | `expo-sqlite` ~16 — arquivo local `marido.db` **no aparelho** |
| ORM | `drizzle-orm` 0.45 (`drizzle-orm/expo-sqlite`), `drizzle-kit` só configurado, migrações feitas à mão |
| Datas | `date-fns` 4 + `date-fns/locale/ptBR` (só no Histórico); no resto `toLocaleDateString('pt-BR')` |
| Contatos | `expo-contacts` (importar contatos do celular) |
| Date/time picker | `@react-native-community/datetimepicker` |
| Ícones | `@expo/vector-icons` (Ionicons) |
| Links externos | `Linking.openURL` (WhatsApp `wa.me`, Google Maps) |
| Orientação / tema | Retrato, somente tema claro |

**Consequência importante:** todos os dados vivem **só no aparelho**. Não existe servidor, sincronização nem backup.
Multiusuário existe apenas "no mesmo celular" (várias contas no mesmo SQLite).

---

## 3. Estrutura de pastas

```
.
├── index.ts                      # entry: import 'expo-router/entry'
├── App.tsx                       # SOBRA do template Expo, não é usado
├── app.json                      # config Expo (plugins sqlite, router, datetimepicker, contacts)
├── babel.config.js / metro.config.js / drizzle.config.ts  # suporte a .sql inline + drizzle
├── app/
│   ├── _layout.tsx               # Root Stack + AuthProvider + NavigationGuard
│   ├── auth/inicio.tsx           # Landing + Login + Cadastro (3 "views" no mesmo arquivo)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab bar inferior (5 abas)
│   │   ├── index.tsx             # Início (dashboard do dia)
│   │   ├── agenda.tsx            # Calendário + agendamentos do dia selecionado
│   │   ├── clientes.tsx          # Lista/busca de clientes + importar contatos
│   │   ├── historico.tsx         # Serviços agrupados por data, filtros
│   │   └── financeiro.tsx        # Resumo financeiro mês/ano + gráfico + top clientes
│   ├── cliente/[id].tsx          # Perfil do cliente
│   ├── novo-servico.tsx          # Modal: registrar serviço
│   └── novo-agendamento.tsx      # Modal: criar agendamento
├── components/
│   ├── EditarServicoModal.tsx    # Bottom sheet editar/excluir serviço
│   ├── EditarClienteModal.tsx    # Bottom sheet editar cliente
│   └── NovoClienteModal.tsx      # Bottom sheet novo cliente
├── contexts/AuthContext.tsx      # Estado do usuário logado
├── db/
│   ├── schema.ts                 # Tabelas Drizzle
│   ├── client.ts                 # Abre SQLite, CREATE TABLE IF NOT EXISTS + "migrações" ALTER TABLE
│   └── queries.ts                # TODAS as funções de acesso a dados
├── constants/theme.ts            # Paleta de cores + estilos compartilhados
├── scripts/
│   ├── importarDados.ts          # Importação antiga embutida (QUEBRADA, ver seção 12)
│   └── limparDados.ts            # Apaga clientes/serviços/agendamentos de TODOS os usuários
└── import.json                   # Dados históricos reais (448 clientes, 2103 serviços) de 1 usuário
```

---

## 4. Modelo de dados

Arquivos: [db/schema.ts](db/schema.ts) e [db/client.ts](db/client.ts).
Todos os IDs são **UUID v4 em texto** gerados no cliente (`Math.random`). Datas são **strings**.

### 4.1 `usuarios`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | TEXT PK | UUID |
| `nome` | TEXT NOT NULL | `trim()` |
| `email` | TEXT NOT NULL UNIQUE | `trim().toLowerCase()` |
| `senha` | TEXT NOT NULL | ⚠️ **texto puro**, sem hash |
| `criado_em` | TEXT | ISO 8601 (`new Date().toISOString()`) |

### 4.2 `sessao` (chave/valor)

| Coluna | Tipo | Uso |
|---|---|---|
| `chave` | TEXT PK | sempre `'usuario_id'` |
| `valor` | TEXT | id do usuário logado |

Substitui um "localStorage". No projeto novo isso é responsabilidade do **Supabase Auth** (sessão no `localStorage` do navegador).

### 4.3 `clientes`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | TEXT PK | UUID |
| `nome` | TEXT NOT NULL | `trim()` |
| `telefone` | TEXT NULL | `trim()`, vazio → `null`. Ao importar contatos é salvo **só dígitos** |
| `endereco` | TEXT NULL | `trim()`, vazio → `null` (texto livre multi-linha) |
| `criado_em` | TEXT | ISO 8601 |
| `usuario_id` | TEXT NOT NULL FK → usuarios | dono do registro |

### 4.4 `servicos`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | TEXT PK | UUID |
| `cliente_id` | TEXT NOT NULL FK → clientes | |
| `data` | TEXT NOT NULL | `YYYY-MM-DD` — **sempre a data de hoje** na criação (não dá para escolher) |
| `valor` | REAL NOT NULL | em reais (ex.: `150.5`). O código trata `null` como 0 (`valor ?? 0`) porque os dados históricos têm nulos |
| `pago` | INTEGER NOT NULL DEFAULT 0 | `1` = pago, `0` = pendente |
| `observacao` | TEXT NULL | descrição do que foi feito |
| `criado_em` | TEXT | ISO 8601 — usado para ordenar e para mostrar a **hora** no Histórico |
| `usuario_id` | TEXT NOT NULL FK → usuarios | |

### 4.5 `agendamentos`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | TEXT PK | UUID |
| `cliente_id` | TEXT NOT NULL FK → clientes | |
| `data` | TEXT NOT NULL | `YYYY-MM-DD` |
| `hora` | TEXT NOT NULL | `HH:MM` (24h) |
| `descricao` | TEXT NOT NULL | o que vai ser feito |
| `status` | TEXT NOT NULL DEFAULT `'agendado'` | `'agendado'` → `'concluido'` ou `'cancelado'` |
| `criado_em` | TEXT | ISO 8601 |
| `usuario_id` | TEXT NOT NULL FK → usuarios | |

### 4.6 Relacionamentos

```
usuarios 1 ──< clientes 1 ──< servicos
    │                │
    │                └──────< agendamentos
    └── (usuario_id em todas as tabelas, para isolar os dados por conta)
```

- Não há ligação direta `servico ↔ agendamento`. Ao "Iniciar" um agendamento, o serviço é criado e o agendamento só muda de status.
- Não existe exclusão de cliente nem de agendamento (só cancelar).
- `ON DELETE` não está definido; a "limpeza" apaga na ordem agendamentos → serviços → clientes.

### 4.7 Migrações

Em [db/client.ts](db/client.ts): `CREATE TABLE IF NOT EXISTS` para tudo e depois uma lista de `ALTER TABLE ... ADD COLUMN` dentro de `try/catch` (ignora erro se a coluna já existir). Foi assim que `usuario_id` e `clientes.endereco` foram adicionados depois.

---

## 5. Autenticação e sessão

Arquivos: [contexts/AuthContext.tsx](contexts/AuthContext.tsx), [app/_layout.tsx](app/_layout.tsx), [app/auth/inicio.tsx](app/auth/inicio.tsx).

### 5.1 Contexto

```ts
type AuthContextType = {
  usuario: Usuario | null;
  loading: boolean;
  login(email, senha): { success: true } | { success: false; erro: string };
  logout(): void;
  cadastrar(nome, email, senha): AuthResult;
};
```

- **Ao montar:** lê `sessao.usuario_id`; se existir, carrega o usuário; senão chama `logout()`. `loading` vira `false` no final.
- **login:** busca `email = lower(email) AND senha = senha`. Sucesso → grava sessão. Erro: *"E-mail ou senha incorretos"*.
- **cadastrar:** insere usuário; se o `INSERT` falhar (e-mail UNIQUE) → *"E-mail já cadastrado"*. Sucesso → já loga.
- **logout:** apaga a sessão e zera o usuário. ⚠️ **Não existe botão de logout na interface.**

### 5.2 Guarda de rotas (`NavigationGuard`)

```
se loading → não faz nada
se NÃO logado e fora de /auth  → replace('/auth/inicio')
se logado e dentro de /auth    → replace('/')
```

### 5.3 Tela `auth/inicio` — 3 estados internos (`landing | login | cadastro`)

**Landing**
- Título `Orça! 💸`, tagline.
- 3 cards de recursos (ícone emoji em quadrado verde claro + título + descrição):
  - 🗓️ **Controle sua agenda** — "De maneira rápida, organize seus serviços"
  - 📊 **Controle financeiro** — "Acompanhe suas finanças de forma prática e eficiente"
  - ⏰ **Economia de tempo** — "Realize suas tarefas de forma mais rápida e eficiente"
- Divisor com texto "COMECE AGORA".
- Botão primário verde **"Criar conta grátis"** → cadastro.
- Botão secundário branco **"Já tenho conta — Entrar"** → login.
- Rodapé: "Ao continuar, você aceita nossos Termos de Uso e Política de Privacidade" (links verdes **sem ação**).

**Login** — "← Voltar", título "Entrar", subtítulo "Acesse sua conta Orça!", campos E-mail e Senha.
Validação: ambos obrigatórios → *"Preencha e-mail e senha."* Link: "Não tem conta? **Criar conta grátis**".

**Cadastro** — "← Voltar", "Criar conta", "Comece a usar o Orça! gratuitamente", campos Nome, E-mail, Senha, Confirmar senha.
Validações (nesta ordem, mostra só a primeira):
1. nome vazio → *"Informe seu nome."*
2. e-mail vazio → *"Informe seu e-mail."*
3. senha < 6 caracteres → *"A senha deve ter pelo menos 6 caracteres."*
4. senhas diferentes → *"As senhas não coincidem."*

Link: "Já tem conta? **Entrar**". Erros aparecem em texto vermelho abaixo dos campos.

---

## 6. Navegação

```
Root Stack
├── auth/inicio                 (sem header)
├── (tabs)                      (sem header) — tab bar inferior
│   ├── index       "Início"      ícone home-outline
│   ├── agenda      "Agenda"      ícone calendar-outline
│   ├── clientes    "Clientes"    ícone people-outline
│   ├── historico   "Histórico"   ícone time-outline
│   └── financeiro  "Financeiro"  ícone cash-outline
├── novo-servico                (modal, título "Novo Serviço", tint verde)
├── novo-agendamento            (modal, título "Novo Agendamento", tint verde)
└── cliente/[id]                (push, título "Cliente", tint verde)
```

- Tab bar: fundo branco, borda superior `#e5e7eb`, altura 75, ativo `#16a34a`, inativo `#9ca3af`, label 10px peso 600.
- Todas as telas recarregam os dados **toda vez que ganham foco** (`useFocusEffect`). No web isso equivale a recarregar ao entrar na rota / após salvar um modal.

Parâmetros de rota usados:

| Rota | Params | Origem |
|---|---|---|
| `/novo-servico` | nenhum | FAB "+" do Início |
| `/novo-servico` | `clienteId`, `agendamentoId` | "Iniciar" na Agenda ou toque em agendamento no Início |
| `/novo-agendamento` | nenhum | FAB "+" da Agenda |
| `/cliente/:id` | `id` | toque em cliente na lista |

---

## 7. Telas — comportamento detalhado

### 7.1 Início — [app/(tabs)/index.tsx](app/(tabs)/index.tsx)

Fundo `#f2f2f7` (cinza iOS).

1. **Cabeçalho branco:** "Olá, {primeiro nome} 👋" (28px, peso 800) + data por extenso com inicial maiúscula (ex.: "Terça-feira, 6 de outubro"). À direita um ícone de sino **decorativo** (sem ação).
2. **Grid 2×2 de resumo** (cada card com fundo/borda/cores próprios):

   | Card | Valor | Cores (fundo / borda / label / valor) |
   |---|---|---|
   | RECEBIDO HOJE | soma `valor` dos serviços de hoje com `pago=1` | `#f0fdf4` / `#bbf7d0` / `#15803d` / `#166534` |
   | PENDENTE | soma dos serviços **de hoje** com `pago=0` | `#fff1f2` / `#fecdd3` / `#be123c` / `#9f1239` |
   | NO MÊS | total **recebido** (pago) no mês corrente | `#eff6ff` / `#bfdbfe` / `#1d4ed8` / `#1e40af` |
   | SERVIÇOS HOJE | quantidade de serviços de hoje | `#f9fafb` / `#e5e7eb` / `#6b7280` / `#111827` |

   Valores em BRL **sem centavos** (`R$ 1.250`).
3. **Card "AGENDA DE HOJE"** + link "Ver tudo" (→ aba Agenda). Lista agendamentos de hoje com `status='agendado'`, ordenados por hora. Cada linha: pílula verde com hora grande e minutos pequenos embaixo, nome do cliente, descrição, chevron. **Toque → Novo Serviço com `clienteId` + `agendamentoId`.** Vazio: "Nenhum agendamento para hoje".
4. **Card "SERVIÇOS DE HOJE"** + link "Ver histórico" (→ aba Histórico). Cada linha: avatar quadrado arredondado com a inicial (verde se pago, vermelho se pendente), nome, observação (1 linha), valor colorido e badge "Pago"/"Pendente". **Toque → EditarServicoModal.** Vazio: "Nenhum serviço registrado hoje".
5. **FAB** verde redondo "+" no canto inferior direito → Novo Serviço (sem parâmetros).

### 7.2 Agenda — [app/(tabs)/agenda.tsx](app/(tabs)/agenda.tsx)

1. Cabeçalho branco "Agenda".
2. **Calendário mensal** (card branco arredondado):
   - Navegação `‹  Outubro 2026  ›` (nomes dos meses em PT, botões redondos).
   - Linha de dias da semana começando no **domingo**: Dom Seg Ter Qua Qui Sex Sáb.
   - Grade 7 colunas; células vazias antes do dia 1.
   - Estados de cada dia:
     - **Selecionado:** círculo verde `#16a34a`, texto branco negrito.
     - **Hoje (não selecionado):** círculo verde claro `#dcfce7`, texto verde negrito.
     - **Passado:** texto cinza `#9ca3af`.
     - **Tem agendamento** (`status='agendado'`): pontinho verde de 4px abaixo do número (branco quando selecionado).
   - Data selecionada inicial: hoje.
3. **Lista do dia selecionado**: rótulo "HOJE" ou o dia por extenso (ex.: "QUINTA-FEIRA, 8 DE OUTUBRO"). Cada agendamento é um card com faixa verde de 4px à esquerda, hora em verde, nome do cliente, descrição e dois botões empilhados:
   - **Iniciar** (verde) → Novo Serviço com `clienteId` + `agendamentoId`.
   - **Cancelar** (vermelho claro) → `status='cancelado'` **imediatamente, sem confirmação**.
   - Vazio: ícone de calendário + "Nenhum agendamento".
4. **FAB** "+" → Novo Agendamento.

Somente agendamentos com `status='agendado'` são carregados (concluídos e cancelados somem da agenda).

### 7.3 Novo Agendamento — [app/novo-agendamento.tsx](app/novo-agendamento.tsx) (modal)

Campos:

1. **Cliente** (autocomplete, foco automático):
   - Ao digitar (≥ 1 caractere), mostra sugestões `nome LIKE %texto%` do usuário.
   - Tocar numa sugestão seleciona o cliente.
   - Se não há sugestões e nenhum cliente selecionado, mostra "**+ Novo cliente: {texto}**" (apenas informativo).
   - Digitar de novo desmarca o cliente selecionado.
2. **Data** — padrão **amanhã**; date picker com `minimumDate = hoje`. Exibido por extenso.
3. **Hora** — padrão **09:00**; time picker 24h.
4. **Serviço** (descrição) — placeholder "Ex: Trocar registro, instalar chuveiro...".
5. Botão **Agendar** — habilitado só com cliente (texto) e descrição preenchidos.

Ao salvar: se nenhum cliente foi selecionado da lista, **cria um cliente novo só com o nome digitado**; cria o agendamento com `status='agendado'`; volta.

### 7.4 Novo Serviço — [app/novo-servico.tsx](app/novo-servico.tsx) (modal)

- Mostra a data de hoje por extenso no topo (o serviço é sempre registrado com a data de hoje).
- **Cliente**: mesmo autocomplete do agendamento. Se veio com `clienteId`, o cliente já vem selecionado e o campo fica **bloqueado** para edição; o foco vai direto para o valor.
- **Valor**: máscara de moeda "estilo caixa registradora" — guarda só dígitos e interpreta como **centavos** (digitar `1`,`5`,`0`,`0`,`0` → `R$ 150,00`). Teclado numérico.
- **Status**: toggle de dois botões **Pendente** (vermelho quando ativo) / **Pago** (verde quando ativo). Padrão: **Pendente**.
- **Observação (opcional)**: multi-linha. Se veio com `agendamentoId`, é **pré-preenchida com a descrição do agendamento**.
- Botão **Salvar serviço** — habilitado com cliente preenchido e valor > 0.

Ao salvar: cria cliente se necessário → cria serviço (`data = hoje`) → se tinha `agendamentoId`, marca agendamento como `concluido` → volta.

### 7.5 Clientes — [app/(tabs)/clientes.tsx](app/(tabs)/clientes.tsx)

1. Cabeçalho "Clientes" + botão **"Importar contatos"** (ícone `people-circle-outline`; durante o processo vira "Sincronizando…" em verde).
2. **Busca** com ícone de lupa e botão "x" para limpar; filtra por `nome LIKE %q%` a cada tecla. Ao voltar para a aba a busca é zerada.
3. **Lista** ordenada por nome: avatar redondo com inicial, nome, e abaixo o telefone (ou o endereço, se não houver telefone), chevron. Toque → `/cliente/:id`.
4. Vazio: "Nenhum cliente cadastrado" + "Toque em + para adicionar um cliente" (ou "Nenhum cliente encontrado" quando há busca).
5. **FAB** "+" → `NovoClienteModal` (Nome *obrigatório*, Telefone, Endereço).

**Importar contatos** (`expo-contacts`):
1. Pede permissão; se negada: alerta "Permissão negada".
2. Lê todos os contatos (nome + telefones).
3. Para cada contato com nome: pega **só o primeiro telefone**, remove tudo que não é dígito.
4. Se tem telefone e já existe cliente do usuário com esse telefone exato → ignora; senão cria cliente.
5. Alerta final: "X contatos importados" + "Y já existiam".

### 7.6 Perfil do cliente — [app/cliente/[id].tsx](app/cliente/[id].tsx)

1. **Cabeçalho do perfil:** avatar grande com inicial, nome, telefone (ícone `call-outline`) e endereço (ícone `location-outline`) quando existirem, botão "✏️ Editar dados" → `EditarClienteModal`.
2. **Dois cards**: **Recebido** (verde, soma dos pagos) e **Pendente** (vermelho, soma dos pendentes) — de **todo o histórico** do cliente.
3. **"Histórico · N serviços"**: lista ordenada por data desc. Cada item: data `DD/MM/AAAA`, observação, valor, badge Pago/Pendente. Toque → `EditarServicoModal`. Vazio: "Nenhum serviço registrado".
4. **FABs flutuantes** (empilhados no canto):
   - **Maps** (só se tiver endereço): `https://www.google.com/maps/search/?api=1&query={endereço codificado}`
   - **WhatsApp** (só se tiver telefone): `https://wa.me/{telefone só dígitos}`

### 7.7 Histórico — [app/(tabs)/historico.tsx](app/(tabs)/historico.tsx)

1. Cabeçalho "Histórico".
2. **Chips de filtro** (rolagem horizontal): **Hoje · Semana · Mês · Tudo** — padrão **Mês**. Chip ativo fica verde.
   - *Hoje*: `data = hoje`
   - *Semana*: `data >= segunda-feira da semana atual` (inclui datas futuras, se houver)
   - *Mês*: `data LIKE 'AAAA-MM%'` do mês atual
   - *Tudo*: sem filtro de data
3. **Lista agrupada por data** (ordem: data desc, depois `criado_em` desc). Cabeçalho de cada grupo: data formatada `"Seg, 05 out 2026"` à esquerda e **total do dia** (pagos + pendentes) à direita.
4. Cada item: nome do cliente, hora (`HH:mm` de `criado_em`; se não houver, mostra a data), valor e badge Pago/Pendente. Itens do mesmo dia ficam num bloco com cantos arredondados no primeiro/último.
5. Toque → `EditarServicoModal`.
6. Vazio: "Nenhum serviço encontrado" / "Os serviços registrados aparecem aqui".

### 7.8 Financeiro — [app/(tabs)/financeiro.tsx](app/(tabs)/financeiro.tsx)

1. Cabeçalho "Financeiro".
2. **Seletor de período:** `‹  Out 2026  ›` + botão de modo **Mês/Ano** (alterna). Em modo Ano mostra só `2026` e as setas trocam o ano.
3. **Grid 2×2:**

   | Card | Cálculo | Ícone |
   |---|---|---|
   | Recebido (verde) | soma dos pagos do período | `checkmark-circle-outline` |
   | Pendente (vermelho) | soma dos pendentes do período | `time-outline` |
   | Serviços (cinza) | quantidade de serviços no período | `construct-outline` |
   | Média/serv. (cinza) | `(recebido + pendente) / quantidade` | `stats-chart-outline` |

4. **Gráfico de barras** feito com `View`s (sem biblioteca):
   - Modo Mês → "Receita por semana": 4 barras **S1 (dias 1–7), S2 (8–14), S3 (15–21), S4 (22–31)**.
   - Modo Ano → "Receita por mês": 12 barras **Jan…Dez**.
   - **Só conta serviços pagos.** Altura proporcional ao maior valor (máx. 110px; mínimo 4px se > 0, 2px se 0). Rótulo em cima: `R$850` ou `1.2k`. Barra cinza clara quando zero.
5. **Top clientes** (até 5): posição em círculo, nome, total (pagos **+** pendentes), barra horizontal proporcional ao 1º colocado, "N serviços".
6. **Últimos serviços** (8 primeiros do período, mais recentes): data curta `"5 out"`, cliente, valor, badge "Pago"/"Pend.". Toque → `EditarServicoModal`.
7. Botão vermelho **"Apagar todos os dados"** → confirmação "Apagar tudo? Remove todos os clientes, serviços e agendamentos. Sem volta." → apaga tudo **do usuário logado**.

### 7.9 Modais (bottom sheets)

Todos abrem deslizando de baixo, fundo escurecido, "alça" cinza no topo, título + botão "x".

**EditarServicoModal** — [components/EditarServicoModal.tsx](components/EditarServicoModal.tsx)
- Campos: **Cliente** (texto), **Valor** (prefixo "R$", aceita vírgula ou ponto), **Status** (Pago com ícone ✓ verde / Pendente com relógio vermelho), **Observação**.
- **Salvar:** valida número ≥ 0 (senão alerta "Valor inválido"). ⚠️ Se o nome do cliente foi alterado, **renomeia o cliente em todo o sistema** (não troca o cliente do serviço). Atualiza valor/pago/observação.
- **Excluir serviço:** confirmação "Tem certeza? Essa ação não pode ser desfeita." → apaga.
- Não permite alterar a data do serviço.

**EditarClienteModal** — [components/EditarClienteModal.tsx](components/EditarClienteModal.tsx)
- Nome (obrigatório), Telefone (teclado de telefone), Endereço (multi-linha). Salvar desabilitado sem nome.

**NovoClienteModal** — [components/NovoClienteModal.tsx](components/NovoClienteModal.tsx)
- "Nome *", Telefone, Endereço. Tocar fora fecha. Suporta `clienteInicial` (vira "Editar cliente"), mas hoje só é usado para criar.

---

## 8. Regras de negócio e cálculos

| Regra | Detalhe |
|---|---|
| Isolamento por usuário | Toda listagem filtra `usuario_id = usuário logado`. (Buscas por `id` — cliente, agendamento, serviços do cliente — **não** filtram; no Supabase o RLS resolve.) |
| Criação implícita de cliente | Novo Serviço e Novo Agendamento criam o cliente automaticamente se o nome digitado não foi escolhido da lista (pode gerar duplicados com nomes iguais). |
| Data do serviço | Sempre "hoje" na criação. |
| Valor | Entrada em centavos na criação; em reais (decimal) na edição. `null` conta como 0. |
| Status do serviço | Binário: pago/pendente. Padrão pendente. |
| Ciclo do agendamento | `agendado` → `concluido` (ao salvar serviço vindo dele) ou `cancelado` (botão). Não há volta, edição nem exclusão. |
| Agendamentos visíveis | Somente `agendado`, em qualquer data (passados não "vencem" sozinhos). |
| "Hoje" no Início | Agendamentos de hoje (`agendado`) ordenados por hora; serviços de hoje ordenados por `criado_em` desc. |
| Moeda | `toLocaleString('pt-BR', { style:'currency', currency:'BRL' })`. Início sem centavos; demais telas com centavos. |
| Semana do Histórico | Começa na **segunda-feira**. (O calendário da Agenda começa no **domingo**.) |
| Semanas do Financeiro | Faixas fixas de dias 1–7, 8–14, 15–21, 22–fim. |
| Gráficos | Só valores pagos. |
| Top clientes / média | Pagos **e** pendentes. |
| Busca | `LIKE %q%` (no SQLite é case-insensitive só para ASCII; acentos importam). |
| Dedup de contatos | Por telefone exato (só dígitos), apenas na importação. |

---

## 9. Design system

Fonte: [constants/theme.ts](constants/theme.ts) + estilos inline das telas. Fonte do sistema, sem fontes customizadas.

### 9.1 Cores

| Token | Hex | Uso |
|---|---|---|
| `green` | `#16a34a` | cor primária, botões, FAB, tab ativa, links |
| `greenLight` | `#dcfce7` | fundo de badge "Pago", hoje no calendário, ícones |
| `greenMid` | `#bbf7d0` | bordas verdes |
| `greenDark` | `#166534` | valores recebidos |
| `red` | `#dc2626` | pendente, erros, excluir |
| `redLight` | `#fee2e2` | fundo badge "Pendente", botão cancelar |
| `redMid` | `#fca5a5` | bordas vermelhas |
| `bg` | `#f9fafb` | fundo das telas (Início usa `#f2f2f7`) |
| `white` | `#ffffff` | cards, cabeçalhos |
| `border` | `#e5e7eb` | bordas |
| `borderLight` | `#f3f4f6` | separadores, barras vazias |
| `textPrimary` | `#111827` | texto principal |
| `textSecondary` | `#6b7280` | texto secundário |
| `textMuted` | `#9ca3af` | placeholders, rótulos |
| `textDark` | `#374151` | labels de formulário |
| azul (só Início) | `#eff6ff` / `#bfdbfe` / `#1d4ed8` / `#1e40af` | card "No mês" |

(É praticamente a paleta do **Tailwind**: green-600, green-100, red-600, gray-50…900 — dá para usar Tailwind direto no projeto novo.)

### 9.2 Tipografia e formas

| Elemento | Valor |
|---|---|
| Título de página | 28px, peso 700–800 |
| Rótulo de seção | 11–12px, peso 700, MAIÚSCULAS, letter-spacing ~1 |
| Corpo / nomes | 15–17px, peso 600 |
| Valores grandes | 22px, peso 800, letter-spacing negativo |
| Input | 17px, padding 14×16, raio 12, borda 1px `#e5e7eb` |
| Botão primário | verde, raio 14–16, padding vertical 18, texto 17px peso 700 branco; desabilitado `#d1d5db` |
| Cards | branco, raio 16–20, borda 1px, sombra suave (`0 1px 4px rgba(0,0,0,.06)`) |
| Badge | pílula raio 20, 10–13px peso 600–700 |
| FAB | 56–60px, círculo verde, sombra verde (`0 4px 10px rgba(22,163,74,.35)`), `bottom 20–28 / right 20` |
| Avatar | inicial do nome; quadrado arredondado (Início) ou círculo (Clientes/Perfil) |

---

## 10. Catálogo de funções de dados (queries)

Todas em [db/queries.ts](db/queries.ts). São **síncronas** (SQLite local). No Supabase todas viram `async`.

| Função | O que faz |
|---|---|
| `getUsuarioById(id)` | usuário por id |
| `loginUsuario(email, senha)` | usuário com e-mail (lower) e senha iguais |
| `cadastrarUsuario(nome, email, senha)` | insere usuário |
| `getSessao / setSessao / clearSessao` | sessão local (chave `usuario_id`) |
| `getAllClientes(uid)` | clientes do usuário por nome |
| `searchClientes(q, uid)` | `nome LIKE %q%` por nome |
| `getClienteById(id)` | cliente por id |
| `getClienteByTelefone(tel, uid)` | cliente por telefone exato (dedup na importação) |
| `getClienteServicos(clienteId)` | serviços do cliente, data desc |
| `createCliente({nome, usuarioId, telefone?, endereco?})` | cria e retorna o cliente |
| `updateCliente(id, {nome, telefone?, endereco?})` | atualiza |
| `updateClienteNome(id, nome)` | renomeia (usado no EditarServicoModal) |
| `getTodayServicos(uid)` | serviços de hoje + cliente, `criado_em` desc |
| `getServicosFiltro(filtro, uid)` | `hoje / semana / mes / tudo` + cliente |
| `getServicosDoMes(ano, mes, uid)` | serviços do mês + cliente |
| `getServicosDoAno(ano, uid)` | serviços do ano + cliente |
| `createServico({clienteId, usuarioId, valor, pago, observacao?, data?})` | cria (data padrão hoje) |
| `updateServico(id, {valor, pago, observacao, data?})` | atualiza |
| `togglePago(id, pago)` | alterna status (**não usada** na UI) |
| `deleteServico(id)` | exclui |
| `getMonthSummary(uid, ano?, mes?)` | `{ totalRecebido, totalPendente, totalServicos, clientesAtendidos }` |
| `getTopClientesDoPeriodo(itens, limite=5)` | agrega em memória: `{ nome, total, qtd }[]` por total desc |
| `getTodayAgendamentos(uid)` | hoje + `agendado` + cliente, por hora |
| `getAllAgendamentos(uid)` | todos `agendado` + cliente, por data e hora |
| `getAgendamentoById(id)` | por id |
| `createAgendamento({clienteId, usuarioId, data, hora, descricao})` | cria com status `agendado` |
| `cancelarAgendamento(id)` / `concluirAgendamento(id)` | muda status |
| `limparTudo(uid)` | apaga agendamentos, serviços e clientes do usuário |

---

## 11. Bugs e limitações conhecidos

> **Não replicar** no projeto novo. A coluna "No projeto novo" diz o que fazer.

| # | Problema | Onde | No projeto novo |
|---|---|---|---|
| 1 | Senhas em **texto puro** no banco | `usuarios.senha` | Supabase Auth (bcrypt, tokens JWT) |
| 2 | **"Hoje" calculado em UTC** (`toISOString().split('T')[0]`). No Brasil (UTC-3), depois das 21h o app considera que já é o dia seguinte | `queries.ts hoje()`, `agenda.tsx todayStr`, filtro "semana" | Usar data **local**: `format(new Date(), 'yyyy-MM-dd')` (date-fns) em todo lugar |
| 3 | Não existe botão de **logout** | — | Adicionar (ex.: menu no cabeçalho do Início) |
| 4 | Contatos **sem telefone** são importados de novo a cada sincronização (duplicados) | `clientes.tsx` | Dedup também por nome, ou ignorar contatos sem telefone |
| 5 | Importação usa só o **primeiro** telefone do contato | `clientes.tsx` | Ok manter, ou permitir escolher |
| 6 | Link do WhatsApp sem código do país (`wa.me/11999999999` não funciona; precisa `5511…`) | `cliente/[id].tsx` | Normalizar: se tiver 10–11 dígitos, prefixar `55` |
| 7 | Não dá para escolher a **data do serviço** (sempre hoje) e nem editar depois | `novo-servico`, `EditarServicoModal` | Campo data (padrão hoje) na criação e edição |
| 8 | Renomear cliente no EditarServicoModal renomeia o cliente **globalmente** e não permite trocar o cliente do serviço | `EditarServicoModal` | Trocar por seletor de cliente |
| 9 | Cancelar agendamento **sem confirmação** | `agenda.tsx` | Pedir confirmação |
| 10 | Agendamento não pode ser editado nem excluído; passados ficam "agendado" para sempre | — | Permitir editar/excluir; destacar atrasados |
| 11 | Sem exclusão de cliente | — | Excluir (com cascade ou bloqueio se tiver serviços) |
| 12 | Clientes duplicados quando o nome é digitado sem escolher a sugestão | Novo Serviço / Agendamento | Destacar sugestões; avisar quando já existe nome igual |
| 13 | Busca sensível a acentos ("jose" não acha "José") | `searchClientes` | `unaccent` no Postgres ou normalizar no cliente |
| 14 | Sino do Início e links de Termos/Política **sem ação** | Início, Landing | Remover ou implementar |
| 15 | `carregando` do Histórico nunca vira `true`; no Financeiro pisca a tela inteira | `historico.tsx`, `financeiro.tsx` | Skeleton/loading real (agora as chamadas são de rede) |
| 16 | "Apagar todos os dados" fica exposto no fim do Financeiro | `financeiro.tsx` | Mover para "Configurações/Conta" com confirmação digitada |
| 17 | `scripts/importarDados.ts` está **quebrado** (banco `maridor.db`, sem `usuario_id`, IDs diferentes do `import.json`) | `scripts/` | Ignorar; usar `import.json` (seção 19) |
| 18 | `scripts/limparDados.ts` apaga dados de **todos** os usuários | `scripts/` | Não portar |
| 19 | `servicos.valor` é NOT NULL no schema, mas os dados históricos têm 90 nulos | `import.json` | Coluna nullable ou converter para 0 na migração |
| 20 | `App.tsx` é sobra do template | raiz | — |
| 21 | Calendário começa no domingo e o filtro "Semana" começa na segunda | Agenda × Histórico | Padronizar (sugestão: segunda) |
| 22 | Card "PENDENTE" do Início mostra só o pendente **de hoje** (rótulo ambíguo) | Início | Renomear para "PENDENTE HOJE" ou mostrar pendente total |

---

## 12. Dados históricos (`import.json`)

> ⚠️ **Estes dados pertencem a UM único usuário** (o dono atual do app). O sistema novo é **multiusuário**:
> na migração, todos estes registros devem ser gravados com o `usuario_id` da conta desse usuário no Supabase.
> Os demais usuários começam com a base vazia.

Formato:

```jsonc
{
  "clientes": [ { "id": "uuid", "nome": "Leonora" } /* ... 448 itens */ ],
  "servicos": [
    {
      "id": "uuid",
      "cliente_id": "uuid",          // sempre existe em clientes (0 órfãos)
      "data": "2023-02-01",          // YYYY-MM-DD
      "valor": 100.0,                // 90 registros com null
      "pago": 1,                     // TODOS = 1
      "observacao": "Importado da planilha 2023",
      "criado_em": "2023-02-01T00:00:00.000Z"
    } /* ... 2103 itens */
  ]
}
```

| Métrica | Valor |
|---|---|
| Clientes | 448 (só `id` + `nome`; sem telefone/endereço; sem nomes repetidos) |
| Serviços | 2103 |
| Período | 2023-01-04 → 2026-05-18 |
| Por ano | 2023: 620 · 2024: 712 · 2025: 563 · 2026: 208 |
| `pago` | 100% pagos |
| `valor` nulo | 90 |
| `observacao` | sempre `"Importado da planilha AAAA"` |
| Agendamentos | nenhum |

Volume total é minúsculo para o Postgres (bem abaixo de 1 MB).

---

## 13. Projeto novo — requisitos

1. **Web, mobile-first**: pensado para o celular (tela ~360–430px), funcionando bem também em tablet/desktop (conteúdo centralizado com largura máxima ~480–640px).
2. **Hospedagem estática no GitHub Pages** (sem servidor próprio).
3. **Backend Supabase plano free**: Auth (e-mail/senha) + Postgres + Row Level Security.
4. **Multiusuário**: cada pessoa cria sua conta e vê **apenas os próprios** clientes, serviços e agendamentos — garantido pelo banco (RLS), não só pelo front.
5. **Paridade funcional** com o app atual (seção 20), corrigindo os bugs da seção 11.
6. Instalável como **PWA** (ícone na tela inicial, abre em tela cheia) — opcional, mas recomendado, já que o uso é no celular.
7. Idioma pt-BR, moeda BRL, datas no fuso local do aparelho.
8. Migração dos dados do `import.json` para a conta do usuário atual.

### Limites do Supabase free a ter em mente (conferir valores atuais em supabase.com/pricing)

| Limite | Valor aproximado | Impacto aqui |
|---|---|---|
| Banco | 500 MB | sobra muito |
| Usuários ativos/mês (Auth) | 50.000 | sobra muito |
| Egress | ~5 GB/mês | ok para poucos usuários |
| Projetos ativos | 2 | — |
| **Pausa por inatividade** | projeto pausa após ~7 dias sem requisições | reativa manualmente no painel; opcional: GitHub Action agendada que faz um `select` leve 1×/dia |
| **E-mails do Auth (SMTP embutido)** | poucos e-mails por hora | para poucos usuários: desligar "Confirm email" ou configurar SMTP próprio (ex.: Resend/Brevo free) |
| **Máx. linhas por requisição (PostgREST)** | 1000 por padrão | filtro "Tudo" e modo Ano precisam de **paginação** (`.range()`) — o usuário migrado já tem 2103 serviços |

---

## 14. Projeto novo — stack recomendada

| Camada | Escolha | Motivo |
|---|---|---|
| Build | **Vite + React + TypeScript** | gera site estático, ideal para GitHub Pages; reaproveita a lógica React do app atual |
| Rotas | **react-router** com **`HashRouter`** (`/#/clientes`) | GitHub Pages não tem rewrite de SPA; hash evita 404 ao recarregar. (Alternativa: `BrowserRouter` + cópia de `index.html` para `404.html`) |
| Estilo | **Tailwind CSS** | a paleta atual já é a do Tailwind (seção 9) |
| Backend | **@supabase/supabase-js** v2 | Auth + queries + RLS |
| Cache/estado de servidor | **TanStack Query** (opcional, recomendado) | substitui o "recarregar ao focar", dá loading/erro e invalidação após salvar |
| Datas | **date-fns** + `ptBR` | já usado no app; resolver "hoje" em fuso local |
| Ícones | **lucide-react** ou Ionicons web (`ionicons`) | equivalentes aos Ionicons |
| Gráfico | barras com `div` + Tailwind (como hoje) | sem dependência extra |
| PWA | `vite-plugin-pwa` | manifest + service worker |
| Deploy | **GitHub Actions** → GitHub Pages | seção 18 |

### Estrutura sugerida

```
src/
├── main.tsx / App.tsx           # HashRouter + AuthProvider + QueryClientProvider
├── lib/
│   ├── supabase.ts              # createClient(import.meta.env.VITE_SUPABASE_URL, ..._ANON_KEY)
│   ├── datas.ts                 # hojeLocal(), inicioSemana(), intervaloMes(), intervaloAno(), formatações
│   ├── moeda.ts                 # fmtBRL(), fmtBRLsemCentavos(), mascaraCentavos()
│   └── telefone.ts              # soDigitos(), linkWhatsApp()
├── api/                         # 1 arquivo por entidade, funções async (seção 16)
│   ├── clientes.ts
│   ├── servicos.ts
│   └── agendamentos.ts
├── auth/AuthContext.tsx         # session + profile via supabase.auth.onAuthStateChange
├── components/
│   ├── BottomSheet.tsx          # base dos modais
│   ├── EditarServicoSheet.tsx / EditarClienteSheet.tsx / NovoClienteSheet.tsx
│   ├── ClienteAutocomplete.tsx  # usado em Novo Serviço e Novo Agendamento
│   ├── TabBar.tsx / Fab.tsx / Badge.tsx / Avatar.tsx / Calendario.tsx / GraficoBarras.tsx
└── pages/
    ├── Landing.tsx / Login.tsx / Cadastro.tsx
    ├── Inicio.tsx / Agenda.tsx / Clientes.tsx / Historico.tsx / Financeiro.tsx
    ├── ClientePerfil.tsx        # /clientes/:id
    ├── NovoServico.tsx          # /servicos/novo?clienteId=&agendamentoId=
    └── NovoAgendamento.tsx      # /agendamentos/novo
```

### Diretrizes mobile-first

- Layout em coluna única, `max-w-md mx-auto`; tab bar fixa no rodapé com `padding-bottom: env(safe-area-inset-bottom)`.
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- Alvos de toque ≥ 44px; inputs com `font-size ≥ 16px` (evita zoom automático no iOS).
- Teclados certos: `inputMode="numeric"` (valor), `type="tel"` (telefone), `type="email"`.
- Data/hora com `<input type="date">` e `<input type="time">` (abre o seletor nativo do celular).
- Modais como bottom sheet (`fixed inset-x-0 bottom-0`, `rounded-t-3xl`, overlay escuro, fechar ao tocar fora).
- FAB acima da tab bar (`bottom: calc(tabbar + 16px)`).
- Confirmações destrutivas com diálogo próprio (substitui `Alert.alert`).

---

## 15. Projeto novo — schema Supabase (SQL completo com RLS)

Rodar no **SQL Editor** do Supabase. Decisões:
- IDs `uuid` gerados no banco; `usuario_id` com `default auth.uid()` (o front não precisa enviar).
- `data` como `date`, `hora` como `time`, `valor` como `numeric(10,2)`, `pago` como `boolean`.
- **FK composta** `(cliente_id, usuario_id)` → impede que um serviço/agendamento aponte para cliente de **outro** usuário.
- RLS em todas as tabelas: cada um só lê/escreve linhas com `usuario_id = auth.uid()`.
- Perfil (`profiles`) criado por trigger no cadastro, com o `nome` vindo de `options.data.nome` do `signUp`.

```sql
-- ============================================================
-- PERFIS (nome do usuário; e-mail/senha ficam em auth.users)
-- ============================================================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,
  criado_em  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- CLIENTES
-- ============================================================
create table public.clientes (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome        text not null check (length(trim(nome)) > 0),
  telefone    text,              -- só dígitos
  endereco    text,
  criado_em   timestamptz not null default now(),
  unique (id, usuario_id)        -- alvo da FK composta
);
create index clientes_usuario_nome_idx on public.clientes (usuario_id, nome);
create index clientes_usuario_tel_idx  on public.clientes (usuario_id, telefone);

-- ============================================================
-- AGENDAMENTOS
-- ============================================================
create table public.agendamentos (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente_id  uuid not null,
  data        date not null,
  hora        time not null,
  descricao   text not null,
  status      text not null default 'agendado'
              check (status in ('agendado', 'concluido', 'cancelado')),
  criado_em   timestamptz not null default now(),
  foreign key (cliente_id, usuario_id)
    references public.clientes (id, usuario_id) on delete cascade
);
create index agendamentos_usuario_status_data_idx
  on public.agendamentos (usuario_id, status, data, hora);

-- ============================================================
-- SERVIÇOS
-- ============================================================
create table public.servicos (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente_id      uuid not null,
  agendamento_id  uuid references public.agendamentos(id) on delete set null, -- novo (opcional): rastreia origem
  data            date not null default current_date,
  valor           numeric(10,2) check (valor is null or valor >= 0), -- nullable por causa do histórico
  pago            boolean not null default false,
  observacao      text,
  criado_em       timestamptz not null default now(),
  foreign key (cliente_id, usuario_id)
    references public.clientes (id, usuario_id) on delete cascade
);
create index servicos_usuario_data_idx    on public.servicos (usuario_id, data desc, criado_em desc);
create index servicos_cliente_idx         on public.servicos (cliente_id, data desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles     enable row level security;
alter table public.clientes     enable row level security;
alter table public.agendamentos enable row level security;
alter table public.servicos     enable row level security;

create policy "perfil: dono lê"      on public.profiles for select using (id = (select auth.uid()));
create policy "perfil: dono altera"  on public.profiles for update using (id = (select auth.uid()))
                                                               with check (id = (select auth.uid()));

create policy "clientes: dono" on public.clientes for all
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

create policy "agendamentos: dono" on public.agendamentos for all
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

create policy "servicos: dono" on public.servicos for all
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
```

Opcional — busca sem acento:

```sql
create extension if not exists unaccent;
-- e buscar via RPC: where unaccent(nome) ilike unaccent('%' || q || '%')
```

Configurações no painel do Supabase:
- **Authentication → Providers → Email**: habilitado. Para poucos usuários, considerar desligar *Confirm email* (ou configurar SMTP próprio).
- **Authentication → URL Configuration**: *Site URL* = `https://<usuario>.github.io/<repo>/`; incluir também `http://localhost:5173/` em *Redirect URLs*.
- A chave **anon/publishable** pode ir no front (é pública por design; quem protege os dados é o RLS). A **service_role/secret** **nunca** vai para o front nem para o repositório.

---

## 16. Projeto novo — mapeamento das queries para supabase-js

`hoje` = `format(new Date(), 'yyyy-MM-dd')` (fuso local). `CLIENTE` = `'*, cliente:clientes(id, nome, telefone, endereco)'`.
O filtro por `usuario_id` **não é necessário** nas consultas — o RLS já restringe. No insert também não (default `auth.uid()`).

| App atual | Supabase |
|---|---|
| `cadastrarUsuario` + `setSessao` | `supabase.auth.signUp({ email, password, options: { data: { nome } } })` |
| `loginUsuario` + `setSessao` | `supabase.auth.signInWithPassword({ email, password })` |
| `clearSessao` | `supabase.auth.signOut()` |
| `getSessao` + `getUsuarioById` | `supabase.auth.getSession()` + `onAuthStateChange` + `from('profiles').select().eq('id', user.id).single()` |
| `getAllClientes` | `from('clientes').select('*').order('nome')` |
| `searchClientes(q)` | `.select('*').ilike('nome', `%${q}%`).order('nome').limit(20)` |
| `getClienteById(id)` | `.select('*').eq('id', id).single()` |
| `getClienteByTelefone(tel)` | `.select('id').eq('telefone', tel).maybeSingle()` (na importação: buscar todos os telefones 1× e comparar em memória) |
| `createCliente` | `.insert({ nome, telefone, endereco }).select().single()` |
| `updateCliente` | `.update({ nome, telefone, endereco }).eq('id', id)` |
| `getClienteServicos(id)` | `from('servicos').select('*').eq('cliente_id', id).order('data', { ascending: false })` |
| `getTodayServicos` | `from('servicos').select(CLIENTE).eq('data', hoje).order('criado_em', { ascending: false })` |
| `getServicosFiltro('semana')` | `.gte('data', segundaFeira)` |
| `getServicosDoMes(a, m)` | `.gte('data', 'AAAA-MM-01').lt('data', primeiroDiaDoProximoMes)` |
| `getServicosDoAno(a)` | `.gte('data', 'AAAA-01-01').lt('data', '(AAAA+1)-01-01')` — **paginar** (> 1000 possível) |
| `getServicosFiltro('tudo')` | sem filtro, **paginado** com `.range(de, ate)` / scroll infinito |
| `createServico` | `.insert({ cliente_id, data, valor, pago, observacao, agendamento_id })` |
| `updateServico` | `.update({ valor, pago, observacao, data, cliente_id }).eq('id', id)` |
| `deleteServico` | `.delete().eq('id', id)` |
| `getMonthSummary` | buscar `valor, pago, cliente_id` do mês e agregar no front (volume pequeno) — ou uma view/RPC |
| `getTopClientesDoPeriodo` | igual: agregação em memória sobre os serviços do período |
| `getTodayAgendamentos` | `from('agendamentos').select(CLIENTE).eq('data', hoje).eq('status', 'agendado').order('hora')` |
| `getAllAgendamentos` | `.select(CLIENTE).eq('status', 'agendado').order('data').order('hora')` (melhor: só o mês visível ± 1) |
| `createAgendamento` | `.insert({ cliente_id, data, hora, descricao })` |
| `cancelarAgendamento` / `concluirAgendamento` | `.update({ status: 'cancelado' \| 'concluido' }).eq('id', id)` |
| `limparTudo` | `delete` em `clientes` com `.eq('usuario_id', uid)` (cascade apaga serviços e agendamentos) |

Observações:
- `hora` volta do Postgres como `"09:00:00"` → exibir `hora.slice(0, 5)`.
- `valor` (`numeric`) volta como número no JSON; tratar `null` como 0 nos cálculos e mostrar "—" na lista.
- "Salvar serviço a partir de agendamento" são 2 operações (insert + update). Para ficar atômico, criar uma RPC `concluir_agendamento_com_servico(...)` — opcional para o volume esperado.
- Após qualquer escrita, invalidar as queries afetadas (Início, Histórico, Financeiro, Perfil).

---

## 17. Projeto novo — adaptações de recursos nativos para web

| Recurso no app | Equivalente web |
|---|---|
| `expo-contacts` (importar agenda) | **Contact Picker API** (`navigator.contacts.select(['name','tel'], { multiple: true })`) — funciona no **Chrome Android**; não existe no iOS Safari. Fallback: **importar arquivo `.vcf`** (exportado da agenda do iPhone/Android) e/ou CSV. Esconder o botão quando nenhum dos dois for possível. |
| `DateTimePicker` | `<input type="date" min={hoje}>` e `<input type="time" step="300">` |
| `Linking.openURL` (WhatsApp/Maps) | `<a href="https://wa.me/55…" target="_blank" rel="noopener">` e `<a href="https://www.google.com/maps/search/?api=1&query=…">` |
| `Alert.alert` | componente `ConfirmDialog` próprio |
| `Modal` slide | `BottomSheet` com transição CSS |
| `useFocusEffect` | carregar ao montar a rota + invalidar cache após salvar (TanStack Query) |
| `SafeAreaView` | `env(safe-area-inset-*)` no CSS |
| `FlatList` / `SectionList` | `map` simples; paginação no "Tudo" |
| `KeyboardAvoidingView` | desnecessário na web; garantir que o botão salvar não fique escondido (sheet com `max-h-[90dvh] overflow-auto`) |
| SQLite offline | online via Supabase. (Offline-first fica fora do escopo inicial; o PWA pode cachear só o app shell.) |

---

## 18. Projeto novo — deploy no GitHub Pages

1. `vite.config.ts`: `base: '/<nome-do-repo>/'` (ou `'/'` se for `usuario.github.io`).
2. Usar `HashRouter` (recomendado) — senão, copiar `dist/index.html` para `dist/404.html` no build.
3. Variáveis em **Settings → Secrets and variables → Actions**: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (a anon/publishable é pública, mas fica organizada como variável).
4. **Settings → Pages → Source: GitHub Actions**.
5. Workflow `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

6. No Supabase, cadastrar a URL final do Pages em *Site URL / Redirect URLs* (seção 15).

---

## 19. Projeto novo — migração dos dados históricos

Objetivo: levar `import.json` (448 clientes, 2103 serviços) para a conta do **usuário dono desses dados**, mantendo os UUIDs originais.

Passos:
1. O usuário cria a conta normalmente no app novo.
2. Pegar o UUID dele em **Authentication → Users** no painel.
3. Rodar **localmente** um script Node com a chave **service_role** (ignora RLS — nunca commitar a chave nem pôr no front):

```ts
// scripts/migrar.ts  —  uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/migrar.ts <usuario_uuid> import.json
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const [usuarioId, arquivo = 'import.json'] = process.argv.slice(2);
if (!usuarioId) throw new Error('Informe o UUID do usuário dono dos dados');

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const dados = JSON.parse(readFileSync(arquivo, 'utf8'));

async function emLotes<T>(tabela: string, linhas: T[], tamanho = 500) {
  for (let i = 0; i < linhas.length; i += tamanho) {
    const { error } = await supabase.from(tabela).upsert(linhas.slice(i, i + tamanho), { onConflict: 'id' });
    if (error) throw error;
  }
  console.log(`${tabela}: ${linhas.length}`);
}

await emLotes('clientes', dados.clientes.map((c: any) => ({
  id: c.id,
  usuario_id: usuarioId,
  nome: c.nome.trim(),
})));

await emLotes('servicos', dados.servicos.map((s: any) => ({
  id: s.id,
  usuario_id: usuarioId,
  cliente_id: s.cliente_id,
  data: s.data,
  valor: s.valor,          // 90 nulos — coluna é nullable
  pago: s.pago === 1,
  observacao: s.observacao,
  criado_em: s.criado_em,
})));
```

- `upsert` por `id` torna o script **idempotente** (pode rodar de novo sem duplicar).
- Conferência pós-migração (SQL Editor):
  ```sql
  select count(*) from clientes where usuario_id = '<uuid>';   -- 448
  select count(*), sum(valor) from servicos where usuario_id = '<uuid>';  -- 2103
  ```
- Não usar `scripts/importarDados.ts` (quebrado; seção 11, item 17).

---

## 20. Checklist de paridade de funcionalidades

**Autenticação**
- [ ] Landing com nome, tagline, 3 cards de recursos, CTA "Criar conta grátis" e "Já tenho conta — Entrar"
- [ ] Cadastro (nome, e-mail, senha ≥ 6, confirmar senha) com as mesmas mensagens de erro
- [ ] Login com mensagem "E-mail ou senha incorretos"
- [ ] Sessão persistente; rotas protegidas; logado não vê landing
- [ ] **Novo:** botão de sair

**Início**
- [ ] Saudação com primeiro nome + data por extenso
- [ ] 4 cards: recebido hoje, pendente hoje, recebido no mês, nº de serviços hoje
- [ ] Agenda de hoje (toque → novo serviço pré-preenchido) + "Ver tudo"
- [ ] Serviços de hoje (toque → editar) + "Ver histórico"
- [ ] FAB → novo serviço

**Agenda**
- [ ] Calendário mensal navegável com hoje/selecionado/passado/marcador
- [ ] Lista do dia com "Iniciar" e "Cancelar" (**com confirmação**)
- [ ] FAB → novo agendamento

**Novo agendamento / Novo serviço**
- [ ] Autocomplete de cliente com criação implícita de cliente novo
- [ ] Agendamento: data (padrão amanhã, mín. hoje), hora (padrão 09:00), descrição
- [ ] Serviço: máscara de valor em centavos, toggle Pendente/Pago (padrão pendente), observação
- [ ] Serviço vindo de agendamento: cliente travado, observação = descrição, agendamento → `concluido`
- [ ] **Novo:** escolher data do serviço (padrão hoje)

**Clientes**
- [ ] Lista por nome com busca (de preferência sem acento)
- [ ] Novo cliente (nome, telefone, endereço)
- [ ] Importar contatos (Contact Picker / .vcf) com dedup por telefone
- [ ] Perfil: dados, editar, recebido/pendente total, histórico de serviços, WhatsApp (com `55`) e Maps
- [ ] **Novo:** excluir cliente

**Histórico**
- [ ] Filtros Hoje / Semana / Mês (padrão) / Tudo (paginado)
- [ ] Agrupado por data com total do dia; hora de criação; badge
- [ ] Toque → editar/excluir serviço

**Financeiro**
- [ ] Período mês/ano com setas
- [ ] Cards recebido, pendente, nº serviços, média por serviço
- [ ] Gráfico de barras (semanas S1–S4 ou 12 meses), só pagos
- [ ] Top 5 clientes com barra proporcional
- [ ] Últimos 8 serviços
- [ ] Apagar todos os dados (mover para área de conta, com confirmação forte)

**Infra**
- [ ] Schema + RLS da seção 15 aplicados; testado com 2 contas que uma não vê dados da outra
- [ ] Datas sempre no fuso local
- [ ] Deploy automático no GitHub Pages
- [ ] Dados do `import.json` migrados para a conta do dono
- [ ] PWA (manifest + ícones a partir de `assets/icon.png`)
