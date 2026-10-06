import { supabase } from '../lib/supabase'
import type { Agendamento, StatusAgendamento } from '../types'
import { buscarTodos, checar } from './base'

const COM_CLIENTE = '*, cliente:clientes(id, nome, telefone, endereco)'

export type DadosAgendamento = {
  cliente_id: string
  data: string
  hora: string
  descricao: string
}

/** Agendamentos em aberto com data em [inicio, fim), por data e hora. */
export function listarAgendados(periodo: { inicio?: string; fim?: string }): Promise<Agendamento[]> {
  return buscarTodos<Agendamento>((de, ate) => {
    let q = supabase.from('agendamentos').select(COM_CLIENTE).eq('status', 'agendado')
    if (periodo.inicio) q = q.gte('data', periodo.inicio)
    if (periodo.fim) q = q.lt('data', periodo.fim)
    return q.order('data').order('hora').order('id').range(de, ate)
  })
}

export async function obterAgendamento(id: string): Promise<Agendamento | null> {
  const { data, error } = await supabase.from('agendamentos').select(COM_CLIENTE).eq('id', id).maybeSingle()
  checar(error)
  return data as Agendamento | null
}

export async function criarAgendamento(dados: DadosAgendamento): Promise<void> {
  const { error } = await supabase.from('agendamentos').insert(dados)
  checar(error)
}

export async function atualizarAgendamento(id: string, dados: DadosAgendamento): Promise<void> {
  const { error } = await supabase.from('agendamentos').update(dados).eq('id', id)
  checar(error)
}

export async function mudarStatusAgendamento(id: string, status: StatusAgendamento): Promise<void> {
  const { error } = await supabase.from('agendamentos').update({ status }).eq('id', id)
  checar(error)
}

export async function excluirAgendamento(id: string): Promise<void> {
  const { error } = await supabase.from('agendamentos').delete().eq('id', id)
  checar(error)
}
