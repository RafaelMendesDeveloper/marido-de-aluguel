import { supabase } from '../lib/supabase'
import { normalizar } from '../lib/texto'
import type { Cliente } from '../types'
import { buscarTodos, checar, emLotes } from './base'

export type DadosCliente = { nome: string; telefone: string | null; endereco: string | null }

export function listarClientes(): Promise<Cliente[]> {
  return buscarTodos<Cliente>((de, ate) =>
    supabase.from('clientes').select('*').order('nome').order('id').range(de, ate),
  )
}

export async function obterCliente(id: string): Promise<Cliente | null> {
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).maybeSingle()
  checar(error)
  return data as Cliente | null
}

export async function criarCliente(dados: DadosCliente): Promise<Cliente> {
  const { data, error } = await supabase.from('clientes').insert(dados).select().single()
  checar(error)
  return data as Cliente
}

export async function atualizarCliente(id: string, dados: DadosCliente): Promise<void> {
  const { error } = await supabase.from('clientes').update(dados).eq('id', id)
  checar(error)
}

/** Apaga o cliente e (em cascata) seus serviços e agendamentos. */
export async function excluirCliente(id: string): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  checar(error)
}

export async function inserirClientes(dados: DadosCliente[]): Promise<void> {
  for (const lote of emLotes(dados, 500)) {
    const { error } = await supabase.from('clientes').insert(lote)
    checar(error)
  }
}

/**
 * Cliente escolhido no autocomplete, ou — se só o nome foi digitado — um
 * cliente existente com o mesmo nome (sem acento/maiúsculas), ou um novo.
 * Evita os duplicados que o app antigo criava.
 */
export async function obterOuCriarCliente(
  escolha: { id: string | null; nome: string },
  existentes: Cliente[],
): Promise<string> {
  if (escolha.id) return escolha.id
  const alvo = normalizar(escolha.nome)
  const igual = existentes.find((c) => normalizar(c.nome) === alvo)
  if (igual) return igual.id
  const novo = await criarCliente({ nome: escolha.nome.trim(), telefone: null, endereco: null })
  return novo.id
}
