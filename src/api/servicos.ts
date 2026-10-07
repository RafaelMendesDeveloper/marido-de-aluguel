import { supabase } from '../lib/supabase'
import type { Servico } from '../types'
import { buscarTodos, checar } from './base'

const COM_CLIENTE = '*, cliente:clientes(id, nome, telefone, endereco)'

export type DadosServico = {
  cliente_id: string
  data: string
  valor: number | null
  pago: boolean
  observacao: string | null
}

function ajustar(s: Servico): Servico {
  return { ...s, valor: s.valor == null ? null : Number(s.valor) }
}

/** Serviços com data em [inicio, fim) (opcionalmente só pagos/não pagos). Mais recentes primeiro. */
export async function listarServicos(periodo: { inicio?: string; fim?: string; pago?: boolean } = {}): Promise<Servico[]> {
  const linhas = await buscarTodos<Servico>((de, ate) => {
    let q = supabase.from('servicos').select(COM_CLIENTE)
    if (periodo.inicio) q = q.gte('data', periodo.inicio)
    if (periodo.fim) q = q.lt('data', periodo.fim)
    if (periodo.pago !== undefined) q = q.eq('pago', periodo.pago)
    return q
      .order('data', { ascending: false })
      .order('criado_em', { ascending: false })
      .order('id')
      .range(de, ate)
  })
  return linhas.map(ajustar)
}

/** Página do filtro "Tudo" do Histórico. */
export async function paginaServicos(pagina: number, tamanho: number): Promise<Servico[]> {
  const de = pagina * tamanho
  const { data, error } = await supabase
    .from('servicos')
    .select(COM_CLIENTE)
    .order('data', { ascending: false })
    .order('criado_em', { ascending: false })
    .order('id')
    .range(de, de + tamanho - 1)
  checar(error)
  return (data as Servico[]).map(ajustar)
}

export async function servicosDoCliente(clienteId: string): Promise<Servico[]> {
  const linhas = await buscarTodos<Servico>((de, ate) =>
    supabase
      .from('servicos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('data', { ascending: false })
      .order('criado_em', { ascending: false })
      .range(de, ate),
  )
  return linhas.map(ajustar)
}

/** Com `agendamento_id`, o banco conclui o agendamento na mesma transação. */
export async function criarServico(dados: DadosServico & { agendamento_id?: string | null }): Promise<void> {
  const { error } = await supabase.from('servicos').insert(dados)
  checar(error)
}

export async function atualizarServico(id: string, dados: DadosServico): Promise<void> {
  const { error } = await supabase.from('servicos').update(dados).eq('id', id)
  checar(error)
}

export async function excluirServico(id: string): Promise<void> {
  const { error } = await supabase.from('servicos').delete().eq('id', id)
  checar(error)
}

export async function marcarComoPago(id: string): Promise<void> {
  const { error } = await supabase.from('servicos').update({ pago: true }).eq('id', id)
  checar(error)
}

/** Quita todos os serviços em aberto de um cliente. */
export async function marcarPagosDoCliente(clienteId: string): Promise<void> {
  const { error } = await supabase.from('servicos').update({ pago: true }).eq('cliente_id', clienteId).eq('pago', false)
  checar(error)
}
