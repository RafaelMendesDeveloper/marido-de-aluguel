import { ChevronRight, Contact, Search, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClienteFormSheet } from '../components/ClienteFormSheet'
import { filtrarClientes } from '../components/ClienteAutocomplete'
import { ImportarContatosSheet } from '../components/ImportarContatosSheet'
import { Avatar, CabecalhoPagina, ErroCarregar, Esqueleto, Fab, Vazio, inputCls } from '../components/ui'
import { useClientes } from '../hooks/dados'
import { formatarTelefone } from '../lib/telefone'

export function Clientes() {
  const navigate = useNavigate()
  const clientes = useClientes()
  const [busca, setBusca] = useState('')
  const [novo, setNovo] = useState(false)
  const [importar, setImportar] = useState(false)

  const lista = useMemo(() => filtrarClientes(clientes.data ?? [], busca), [clientes.data, busca])

  return (
    <div>
      <CabecalhoPagina
        titulo="Clientes"
        direita={
          <button
            type="button"
            onClick={() => setImportar(true)}
            className="flex min-h-10 items-center gap-1.5 rounded-full bg-green-50 px-3.5 text-sm font-bold text-green-700 active:bg-green-100"
          >
            <Contact className="size-4" /> Importar contatos
          </button>
        }
      >
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-gray-400" />
          <input
            className={`${inputCls} bg-gray-50 pr-11 pl-11`}
            type="search"
            placeholder="Buscar cliente"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            autoComplete="off"
          />
          {busca && (
            <button type="button" aria-label="Limpar busca" onClick={() => setBusca('')} className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 active:bg-gray-100">
              <X className="size-5" />
            </button>
          )}
        </div>
        {clientes.data && (
          <p className="mt-2 text-xs text-gray-400">
            {busca ? `${lista.length} de ${clientes.data.length}` : clientes.data.length} cliente{clientes.data.length === 1 ? '' : 's'}
          </p>
        )}
      </CabecalhoPagina>

      <div className="p-4">
        {clientes.isPending ? (
          <div className="rounded-2xl bg-white">
            <Esqueleto linhas={6} />
          </div>
        ) : clientes.isError ? (
          <ErroCarregar erro={clientes.error} tentar={() => clientes.refetch()} />
        ) : lista.length === 0 ? (
          <Vazio
            icone={<Users className="size-12" />}
            titulo={busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            texto={busca ? undefined : 'Toque em + para adicionar um cliente'}
          />
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {lista.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => navigate(`/clientes/${c.id}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-gray-50">
                  <Avatar nome={c.nome} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-semibold text-gray-900">{c.nome}</span>
                    {(c.telefone || c.endereco) && (
                      <span className="block truncate text-sm text-gray-500">{c.telefone ? formatarTelefone(c.telefone) : c.endereco}</span>
                    )}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-gray-300" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Fab rotulo="Novo cliente" onClick={() => setNovo(true)} />
      <ClienteFormSheet aberto={novo} onFechar={() => setNovo(false)} />
      <ImportarContatosSheet aberto={importar} onFechar={() => setImportar(false)} />
    </div>
  )
}
