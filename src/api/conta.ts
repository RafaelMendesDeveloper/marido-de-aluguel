import { supabase } from '../lib/supabase'
import { checar } from './base'

/** Apaga todos os clientes do usuário; serviços e agendamentos vão junto (cascade). */
export async function apagarTodosOsDados(usuarioId: string): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('usuario_id', usuarioId)
  checar(error)
}

export async function atualizarNome(usuarioId: string, nome: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ nome }).eq('id', usuarioId)
  checar(error)
}
