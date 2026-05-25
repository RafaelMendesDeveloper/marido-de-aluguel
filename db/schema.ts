import { int, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const sessao = sqliteTable('sessao', {
  chave: text('chave').primaryKey(),
  valor: text('valor'),
});

export const usuarios = sqliteTable('usuarios', {
  id: text('id').primaryKey().notNull(),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  senha: text('senha').notNull(),
  criado_em: text('criado_em'),
});

export const clientes = sqliteTable('clientes', {
  id: text('id').primaryKey().notNull(),
  nome: text('nome').notNull(),
  telefone: text('telefone'),
  criado_em: text('criado_em'),
  usuario_id: text('usuario_id')
    .notNull()
    .references(() => usuarios.id),
});

export const servicos = sqliteTable('servicos', {
  id: text('id').primaryKey().notNull(),
  cliente_id: text('cliente_id')
    .notNull()
    .references(() => clientes.id),
  data: text('data').notNull(),
  valor: real('valor').notNull(),
  pago: int('pago').notNull().default(0),
  observacao: text('observacao'),
  criado_em: text('criado_em'),
  usuario_id: text('usuario_id')
    .notNull()
    .references(() => usuarios.id),
});

export const agendamentos = sqliteTable('agendamentos', {
  id: text('id').primaryKey().notNull(),
  cliente_id: text('cliente_id')
    .notNull()
    .references(() => clientes.id),
  data: text('data').notNull(),
  hora: text('hora').notNull(),
  descricao: text('descricao').notNull(),
  // 'agendado' | 'concluido' | 'cancelado'
  status: text('status').notNull().default('agendado'),
  criado_em: text('criado_em'),
  usuario_id: text('usuario_id')
    .notNull()
    .references(() => usuarios.id),
});
