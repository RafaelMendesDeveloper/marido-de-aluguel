import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { listarAgendados, obterAgendamento } from '../api/agendamentos'
import { listarClientes, obterCliente } from '../api/clientes'
import { listarServicos, paginaServicos, servicosDoCliente } from '../api/servicos'

export function useClientes() {
  return useQuery({ queryKey: ['clientes'], queryFn: listarClientes })
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: ['clientes', id],
    queryFn: () => obterCliente(id!),
    enabled: Boolean(id),
  })
}

export function useServicos(periodo: { inicio?: string; fim?: string }) {
  return useQuery({
    queryKey: ['servicos', periodo.inicio ?? null, periodo.fim ?? null],
    queryFn: () => listarServicos(periodo),
  })
}

/** Tudo que ainda não foi pago, de qualquer data. */
export function useAReceber() {
  return useQuery({ queryKey: ['servicos', 'a-receber'], queryFn: () => listarServicos({ pago: false }) })
}

export function useServicosDoCliente(clienteId: string | undefined) {
  return useQuery({
    queryKey: ['servicos', 'cliente', clienteId],
    queryFn: () => servicosDoCliente(clienteId!),
    enabled: Boolean(clienteId),
  })
}

export const TAMANHO_PAGINA = 200

export function useTodosServicos(ativo: boolean) {
  return useInfiniteQuery({
    queryKey: ['servicos', 'tudo'],
    queryFn: ({ pageParam }) => paginaServicos(pageParam, TAMANHO_PAGINA),
    initialPageParam: 0,
    getNextPageParam: (ultima, paginas) => (ultima.length < TAMANHO_PAGINA ? undefined : paginas.length),
    enabled: ativo,
  })
}

export function useAgendados(periodo: { inicio?: string; fim?: string }, ativo = true) {
  return useQuery({
    queryKey: ['agendamentos', periodo.inicio ?? null, periodo.fim ?? null],
    queryFn: () => listarAgendados(periodo),
    enabled: ativo,
  })
}

export function useAgendamento(id: string | null) {
  return useQuery({
    queryKey: ['agendamentos', 'id', id],
    queryFn: () => obterAgendamento(id!),
    enabled: Boolean(id),
  })
}

/** Depois de qualquer escrita: recarrega tudo (volume pequeno, simples e correto). */
export function useInvalidar() {
  const qc = useQueryClient()
  return useCallback(() => qc.invalidateQueries(), [qc])
}
