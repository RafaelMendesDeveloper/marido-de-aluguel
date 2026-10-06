import { Check, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useClientes } from '../hooks/dados'
import { formatarTelefone } from '../lib/telefone'
import { normalizar } from '../lib/texto'
import type { Cliente } from '../types'
import { Avatar, cx, inputCls } from './ui'

export type EscolhaCliente = { id: string | null; nome: string }

type Props = {
  valor: EscolhaCliente
  onChange: (v: EscolhaCliente) => void
  travado?: boolean
  autoFocus?: boolean
}

export function filtrarClientes(clientes: Cliente[], busca: string, limite = Infinity): Cliente[] {
  const q = normalizar(busca)
  if (!q) return clientes.slice(0, limite)
  const comeca: Cliente[] = []
  const contem: Cliente[] = []
  for (const c of clientes) {
    const n = normalizar(c.nome)
    if (n.startsWith(q)) comeca.push(c)
    else if (n.includes(q) || (c.telefone && q.replace(/\D/g, '') && c.telefone.includes(q.replace(/\D/g, '')))) contem.push(c)
    if (comeca.length >= limite) break
  }
  return [...comeca, ...contem].slice(0, limite)
}

export function ClienteAutocomplete({ valor, onChange, travado, autoFocus }: Props) {
  const { data: clientes = [] } = useClientes()
  const [focado, setFocado] = useState(false)

  const sugestoes = useMemo(
    () => (valor.id || !valor.nome.trim() ? [] : filtrarClientes(clientes, valor.nome, 6)),
    [clientes, valor.id, valor.nome],
  )
  const igual = useMemo(
    () => (valor.id ? null : clientes.find((c) => normalizar(c.nome) === normalizar(valor.nome)) ?? null),
    [clientes, valor.id, valor.nome],
  )

  return (
    <div>
      <div className="relative">
        <input
          className={cx(inputCls, valor.id && 'border-green-600 pr-11 font-semibold')}
          placeholder="Nome do cliente"
          value={valor.nome}
          disabled={travado}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCapitalize="words"
          onFocus={() => setFocado(true)}
          onBlur={() => setTimeout(() => setFocado(false), 150)}
          onChange={(e) => onChange({ id: null, nome: e.target.value })}
        />
        {valor.id && (
          <Check className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-green-600" strokeWidth={3} />
        )}
      </div>

      {!travado && !valor.id && valor.nome.trim() && (focado || sugestoes.length > 0) && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {sugestoes.map((c) => (
            <li key={c.id} className="border-b border-gray-100 last:border-0">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onChange({ id: c.id, nome: c.nome })}
                className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left active:bg-gray-50"
              >
                <Avatar nome={c.nome} tamanho="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-gray-900">{c.nome}</span>
                  {c.telefone && <span className="block text-xs text-gray-500">{formatarTelefone(c.telefone)}</span>}
                </span>
              </button>
            </li>
          ))}
          {!igual && (
            <li className="flex items-center gap-3 px-3 py-3 text-sm text-green-700">
              <UserPlus className="size-5 shrink-0" />
              <span>
                <strong>Novo cliente:</strong> {valor.nome.trim()} <span className="text-gray-400">(criado ao salvar)</span>
              </span>
            </li>
          )}
        </ul>
      )}
      {!valor.id && igual && (
        <p className="mt-1.5 text-xs text-gray-500">Já existe um cliente com esse nome — ele será usado.</p>
      )}
    </div>
  )
}
