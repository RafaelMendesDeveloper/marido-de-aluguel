import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const expo = openDatabaseSync('marido.db');

expo.execSync(`
  CREATE TABLE IF NOT EXISTS sessao (
    chave TEXT PRIMARY KEY,
    valor TEXT
  );
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    criado_em TEXT
  );
  CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    telefone TEXT,
    endereco TEXT,
    criado_em TEXT,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id)
  );
  CREATE TABLE IF NOT EXISTS servicos (
    id TEXT PRIMARY KEY NOT NULL,
    cliente_id TEXT NOT NULL REFERENCES clientes(id),
    data TEXT NOT NULL,
    valor REAL NOT NULL,
    pago INTEGER NOT NULL DEFAULT 0,
    observacao TEXT,
    criado_em TEXT,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id)
  );
  CREATE TABLE IF NOT EXISTS agendamentos (
    id TEXT PRIMARY KEY NOT NULL,
    cliente_id TEXT NOT NULL REFERENCES clientes(id),
    data TEXT NOT NULL,
    hora TEXT NOT NULL,
    descricao TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'agendado',
    criado_em TEXT,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id)
  );
`);

// Migrations: adiciona colunas que podem não existir em bancos mais antigos
const migrations = [
  `ALTER TABLE agendamentos ADD COLUMN usuario_id TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE servicos ADD COLUMN usuario_id TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE clientes ADD COLUMN usuario_id TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE clientes ADD COLUMN endereco TEXT`,
];
for (const sql of migrations) {
  try { expo.execSync(sql); } catch { /* coluna já existe */ }
}

export const db = drizzle(expo, { schema });
