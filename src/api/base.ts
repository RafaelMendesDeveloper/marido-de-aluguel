import type { PostgrestError } from '@supabase/supabase-js'

type Resposta<T> = { data: T[] | null; error: PostgrestError | null }

export function checar(error: PostgrestError | null): void {
  if (error) throw new Error(error.message)
}

/**
 * O PostgREST devolve no máximo 1000 linhas por requisição; busca página a
 * página até acabar. `montar` recebe o intervalo (inclusivo) e devolve a query.
 */
export async function buscarTodos<T>(
  montar: (de: number, ate: number) => PromiseLike<Resposta<T>>,
  tamanho = 1000,
): Promise<T[]> {
  const todos: T[] = []
  for (let de = 0; ; de += tamanho) {
    const { data, error } = await montar(de, de + tamanho - 1)
    checar(error)
    const pagina = data ?? []
    todos.push(...pagina)
    if (pagina.length < tamanho) return todos
  }
}

export function emLotes<T>(itens: T[], tamanho: number): T[][] {
  const lotes: T[][] = []
  for (let i = 0; i < itens.length; i += tamanho) lotes.push(itens.slice(i, i + tamanho))
  return lotes
}
