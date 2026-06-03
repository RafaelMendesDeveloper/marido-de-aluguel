import { and, desc, eq, gte, like } from 'drizzle-orm';
import { db } from './client';
import { agendamentos, clientes, servicos, sessao, usuarios } from './schema';

export type Usuario = typeof usuarios.$inferSelect;
export type Cliente = typeof clientes.$inferSelect;
export type Servico = typeof servicos.$inferSelect;
export type Agendamento = typeof agendamentos.$inferSelect;
export type ServicoComCliente = Servico & { cliente: Cliente };
export type AgendamentoComCliente = Agendamento & { cliente: Cliente };

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function hoje(): string {
  return new Date().toISOString().split('T')[0];
}

function agora(): string {
  return new Date().toISOString();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function getUsuarioById(id: string): Usuario | undefined {
  return db.select().from(usuarios).where(eq(usuarios.id, id)).get();
}

export function loginUsuario(email: string, senha: string): Usuario | null {
  return (
    db
      .select()
      .from(usuarios)
      .where(and(eq(usuarios.email, email.toLowerCase()), eq(usuarios.senha, senha)))
      .get() ?? null
  );
}

export function cadastrarUsuario(nome: string, email: string, senha: string): Usuario {
  const novo: Usuario = {
    id: uuid(),
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    senha,
    criado_em: agora(),
  };
  db.insert(usuarios).values(novo).run();
  return novo;
}

// ─── Sessão ───────────────────────────────────────────────────────────────────

export function getSessao(): string | null {
  const row = db.select().from(sessao).where(eq(sessao.chave, 'usuario_id')).get();
  return row?.valor ?? null;
}

export function setSessao(usuarioId: string): void {
  db.insert(sessao)
    .values({ chave: 'usuario_id', valor: usuarioId })
    .onConflictDoUpdate({ target: sessao.chave, set: { valor: usuarioId } })
    .run();
}

export function clearSessao(): void {
  db.delete(sessao).where(eq(sessao.chave, 'usuario_id')).run();
}

// ─── Clientes ─────────────────────────────────────────────────────────────────

export function getAllClientes(uid: string): Cliente[] {
  return db
    .select()
    .from(clientes)
    .where(eq(clientes.usuario_id, uid))
    .orderBy(clientes.nome)
    .all();
}

export function searchClientes(q: string, uid: string): Cliente[] {
  return db
    .select()
    .from(clientes)
    .where(and(like(clientes.nome, `%${q}%`), eq(clientes.usuario_id, uid)))
    .orderBy(clientes.nome)
    .all();
}

export function getClienteById(id: string): Cliente | undefined {
  return db.select().from(clientes).where(eq(clientes.id, id)).get();
}

export function getAgendamentoById(id: string): Agendamento | undefined {
  return db.select().from(agendamentos).where(eq(agendamentos.id, id)).get();
}

export function getClienteServicos(clienteId: string): Servico[] {
  return db
    .select()
    .from(servicos)
    .where(eq(servicos.cliente_id, clienteId))
    .orderBy(desc(servicos.data))
    .all();
}

export function getClienteByTelefone(telefone: string, uid: string): Cliente | undefined {
  return db
    .select()
    .from(clientes)
    .where(and(eq(clientes.telefone, telefone), eq(clientes.usuario_id, uid)))
    .get();
}

export function createCliente(params: {
  nome: string;
  usuarioId: string;
  telefone?: string;
  endereco?: string;
}): Cliente {
  const novo: Cliente = {
    id: uuid(),
    nome: params.nome.trim(),
    telefone: params.telefone?.trim() || null,
    endereco: params.endereco?.trim() || null,
    criado_em: agora(),
    usuario_id: params.usuarioId,
  };
  db.insert(clientes).values(novo).run();
  return novo;
}

export function updateCliente(
  id: string,
  params: { nome: string; telefone?: string; endereco?: string }
): void {
  db.update(clientes)
    .set({
      nome: params.nome.trim(),
      telefone: params.telefone?.trim() || null,
      endereco: params.endereco?.trim() || null,
    })
    .where(eq(clientes.id, id))
    .run();
}

export function updateClienteNome(id: string, nome: string): void {
  db.update(clientes).set({ nome: nome.trim() }).where(eq(clientes.id, id)).run();
}

// ─── Serviços ─────────────────────────────────────────────────────────────────

function mapJoin(rows: { servicos: Servico; clientes: Cliente }[]): ServicoComCliente[] {
  return rows.map((r) => ({ ...r.servicos, cliente: r.clientes }));
}

export function getTodayServicos(uid: string): ServicoComCliente[] {
  return mapJoin(
    db
      .select()
      .from(servicos)
      .innerJoin(clientes, eq(servicos.cliente_id, clientes.id))
      .where(and(eq(servicos.data, hoje()), eq(servicos.usuario_id, uid)))
      .orderBy(desc(servicos.criado_em))
      .all()
  );
}

export function getServicosFiltro(
  filtro: 'hoje' | 'semana' | 'mes' | 'tudo',
  uid: string
): ServicoComCliente[] {
  const now = new Date();

  if (filtro === 'hoje') {
    return mapJoin(
      db
        .select()
        .from(servicos)
        .innerJoin(clientes, eq(servicos.cliente_id, clientes.id))
        .where(and(eq(servicos.data, hoje()), eq(servicos.usuario_id, uid)))
        .orderBy(desc(servicos.criado_em))
        .all()
    );
  }

  if (filtro === 'semana') {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const seg = new Date(now);
    seg.setDate(now.getDate() + diff);
    const start = seg.toISOString().split('T')[0];
    return mapJoin(
      db
        .select()
        .from(servicos)
        .innerJoin(clientes, eq(servicos.cliente_id, clientes.id))
        .where(and(gte(servicos.data, start), eq(servicos.usuario_id, uid)))
        .orderBy(desc(servicos.data), desc(servicos.criado_em))
        .all()
    );
  }

  if (filtro === 'mes') {
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}%`;
    return mapJoin(
      db
        .select()
        .from(servicos)
        .innerJoin(clientes, eq(servicos.cliente_id, clientes.id))
        .where(and(like(servicos.data, prefix), eq(servicos.usuario_id, uid)))
        .orderBy(desc(servicos.data), desc(servicos.criado_em))
        .all()
    );
  }

  // 'tudo'
  return mapJoin(
    db
      .select()
      .from(servicos)
      .innerJoin(clientes, eq(servicos.cliente_id, clientes.id))
      .where(eq(servicos.usuario_id, uid))
      .orderBy(desc(servicos.data), desc(servicos.criado_em))
      .all()
  );
}

export function getServicosDoMes(ano: number, mes: number, uid: string): ServicoComCliente[] {
  const prefix = `${ano}-${String(mes).padStart(2, '0')}%`;
  return mapJoin(
    db
      .select()
      .from(servicos)
      .innerJoin(clientes, eq(servicos.cliente_id, clientes.id))
      .where(and(like(servicos.data, prefix), eq(servicos.usuario_id, uid)))
      .orderBy(desc(servicos.data), desc(servicos.criado_em))
      .all()
  );
}

export function getServicosDoAno(ano: number, uid: string): ServicoComCliente[] {
  return mapJoin(
    db
      .select()
      .from(servicos)
      .innerJoin(clientes, eq(servicos.cliente_id, clientes.id))
      .where(and(like(servicos.data, `${ano}%`), eq(servicos.usuario_id, uid)))
      .orderBy(desc(servicos.data), desc(servicos.criado_em))
      .all()
  );
}

export function createServico(params: {
  clienteId: string;
  usuarioId: string;
  valor: number;
  pago: boolean;
  observacao?: string;
  data?: string;
}): void {
  db.insert(servicos)
    .values({
      id: uuid(),
      cliente_id: params.clienteId,
      usuario_id: params.usuarioId,
      data: params.data ?? hoje(),
      valor: params.valor,
      pago: params.pago ? 1 : 0,
      observacao: params.observacao?.trim() || null,
      criado_em: agora(),
    })
    .run();
}

export function updateServico(
  id: string,
  params: {
    valor: number;
    pago: number;
    observacao: string | null;
    data?: string;
  }
): void {
  db.update(servicos).set(params).where(eq(servicos.id, id)).run();
}

export function togglePago(id: string, pago: boolean): void {
  db.update(servicos).set({ pago: pago ? 1 : 0 }).where(eq(servicos.id, id)).run();
}

export function deleteServico(id: string): void {
  db.delete(servicos).where(eq(servicos.id, id)).run();
}

// ─── Resumo financeiro ────────────────────────────────────────────────────────

export function getMonthSummary(uid: string, ano?: number, mes?: number) {
  const now = new Date();
  const y = ano ?? now.getFullYear();
  const m = mes ?? now.getMonth() + 1;
  const prefix = `${y}-${String(m).padStart(2, '0')}%`;

  const rows = db
    .select()
    .from(servicos)
    .where(and(like(servicos.data, prefix), eq(servicos.usuario_id, uid)))
    .all();

  return {
    totalRecebido: rows
      .filter((r) => r.pago === 1)
      .reduce((s, r) => s + (r.valor ?? 0), 0),
    totalPendente: rows
      .filter((r) => r.pago === 0)
      .reduce((s, r) => s + (r.valor ?? 0), 0),
    totalServicos: rows.length,
    clientesAtendidos: new Set(rows.map((r) => r.cliente_id)).size,
  };
}

export function getTopClientesDoPeriodo(
  itens: ServicoComCliente[],
  limite = 5
): { nome: string; total: number; qtd: number }[] {
  const mapa = new Map<string, { nome: string; total: number; qtd: number }>();
  for (const s of itens) {
    const entry = mapa.get(s.cliente_id) ?? { nome: s.cliente.nome, total: 0, qtd: 0 };
    entry.total += s.valor ?? 0;
    entry.qtd += 1;
    mapa.set(s.cliente_id, entry);
  }
  return [...mapa.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, limite);
}

// ─── Agendamentos ─────────────────────────────────────────────────────────────

export function getTodayAgendamentos(uid: string): AgendamentoComCliente[] {
  return db
    .select()
    .from(agendamentos)
    .innerJoin(clientes, eq(agendamentos.cliente_id, clientes.id))
    .where(
      and(
        eq(agendamentos.data, hoje()),
        eq(agendamentos.status, 'agendado'),
        eq(agendamentos.usuario_id, uid)
      )
    )
    .orderBy(agendamentos.hora)
    .all()
    .map((r) => ({ ...r.agendamentos, cliente: r.clientes }));
}

export function getAllAgendamentos(uid: string): AgendamentoComCliente[] {
  return db
    .select()
    .from(agendamentos)
    .innerJoin(clientes, eq(agendamentos.cliente_id, clientes.id))
    .where(and(eq(agendamentos.status, 'agendado'), eq(agendamentos.usuario_id, uid)))
    .orderBy(agendamentos.data, agendamentos.hora)
    .all()
    .map((r) => ({ ...r.agendamentos, cliente: r.clientes }));
}

export function createAgendamento(params: {
  clienteId: string;
  usuarioId: string;
  data: string;
  hora: string;
  descricao: string;
}): void {
  db.insert(agendamentos)
    .values({
      id: uuid(),
      cliente_id: params.clienteId,
      usuario_id: params.usuarioId,
      data: params.data,
      hora: params.hora,
      descricao: params.descricao.trim(),
      status: 'agendado',
      criado_em: agora(),
    })
    .run();
}

// ─── Dev / Manutenção ─────────────────────────────────────────────────────────

export function limparTudo(uid: string): void {
  db.delete(agendamentos).where(eq(agendamentos.usuario_id, uid)).run();
  db.delete(servicos).where(eq(servicos.usuario_id, uid)).run();
  db.delete(clientes).where(eq(clientes.usuario_id, uid)).run();
}

export function cancelarAgendamento(id: string): void {
  db.update(agendamentos).set({ status: 'cancelado' }).where(eq(agendamentos.id, id)).run();
}

export function concluirAgendamento(id: string): void {
  db.update(agendamentos).set({ status: 'concluido' }).where(eq(agendamentos.id, id)).run();
}
