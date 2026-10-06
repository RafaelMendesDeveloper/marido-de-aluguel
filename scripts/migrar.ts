/**
 * Migra os dados históricos do app antigo (legacy/import.json) para a conta
 * do dono no Supabase, mantendo os UUIDs originais. Idempotente (upsert por id).
 *
 * Uso (rodar LOCALMENTE — a service_role ignora o RLS, nunca commite a chave):
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/migrar.ts <usuario_uuid> [legacy/import.json]
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

type ClienteAntigo = { id: string; nome: string }
type ServicoAntigo = {
  id: string
  cliente_id: string
  data: string
  valor: number | null
  pago: number
  observacao: string | null
  criado_em: string | null
}

const [usuarioId, arquivo = 'legacy/import.json'] = process.argv.slice(2)
const url = process.env.SUPABASE_URL
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!usuarioId || !/^[0-9a-f-]{36}$/i.test(usuarioId)) {
  console.error('Informe o UUID do usuário dono dos dados (Authentication → Users).')
  process.exit(1)
}
if (!url || !chave) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.')
  process.exit(1)
}

const supabase = createClient(url, chave, { auth: { persistSession: false } })
const dados = JSON.parse(readFileSync(arquivo, 'utf8')) as { clientes: ClienteAntigo[]; servicos: ServicoAntigo[] }

const { data: dono, error: erroDono } = await supabase.auth.admin.getUserById(usuarioId)
if (erroDono || !dono.user) {
  console.error(`Usuário ${usuarioId} não encontrado no Supabase Auth.`)
  process.exit(1)
}
console.log(`Migrando para ${dono.user.email}…`)

async function emLotes(tabela: string, linhas: Record<string, unknown>[], tamanho = 500) {
  for (let i = 0; i < linhas.length; i += tamanho) {
    const { error } = await supabase.from(tabela).upsert(linhas.slice(i, i + tamanho), { onConflict: 'id' })
    if (error) throw new Error(`${tabela}: ${error.message}`)
  }
  console.log(`  ${tabela}: ${linhas.length}`)
}

await emLotes(
  'clientes',
  dados.clientes.map((c) => ({ id: c.id, usuario_id: usuarioId, nome: c.nome.trim() })),
)

await emLotes(
  'servicos',
  dados.servicos.map((s) => ({
    id: s.id,
    usuario_id: usuarioId,
    cliente_id: s.cliente_id,
    data: s.data,
    valor: s.valor, // há registros nulos — a coluna aceita
    pago: s.pago === 1,
    observacao: s.observacao,
    criado_em: s.criado_em ?? `${s.data}T12:00:00.000Z`,
  })),
)

const { count: qtdClientes } = await supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('usuario_id', usuarioId)
const { count: qtdServicos } = await supabase.from('servicos').select('*', { count: 'exact', head: true }).eq('usuario_id', usuarioId)
console.log(`Conferência: ${qtdClientes} clientes, ${qtdServicos} serviços na conta.`)
