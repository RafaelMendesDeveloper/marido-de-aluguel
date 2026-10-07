import { ChevronRight, Search, Upload, UserPlus, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useMatch } from 'react-router-dom'
import { useAcoes } from '../components/Acoes'
import { filtrarClientes } from '../components/ClienteAutocomplete'
import { Avatar, Botao, CabecalhoPagina, Cartao, ErroCarregar, Esqueleto, Vazio, cx, inputCls } from '../components/ui'
import { useClientes } from '../hooks/dados'
import { formatarTelefone } from '../lib/telefone'

/** Lista à esquerda e perfil à direita (desktop); no celular, uma coisa de cada vez. */
export function ClientesLayout() {
  const acoes = useAcoes()
  const clientes = useClientes()
  const detalhe = useMatch('/clientes/:id')
  const [busca, setBusca] = useState('')
  const lista = useMemo(() => filtrarClientes(clientes.data ?? [], busca), [clientes.data, busca])
  const total = clientes.data?.length ?? 0

  return (
    <>
      <div className={cx(detalhe && 'hidden lg:block')}>
        <CabecalhoPagina
          titulo="Clientes"
          subtitulo={clientes.data ? `${total} cliente${total === 1 ? '' : 's'} cadastrado${total === 1 ? '' : 's'}` : ' '}
          acoes={
            <>
              <Botao variante="secundario" onClick={acoes.importarContatos}>
                <Upload className="size-4" /> <span className="hidden sm:inline">Importar</span>
              </Botao>
              <Botao onClick={() => acoes.novoCliente()}>
                <UserPlus className="size-4" /> Novo<span className="hidden sm:inline"> cliente</span>
              </Botao>
            </>
          }
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Cartao className={cx('flex flex-col lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)]', detalhe && 'hidden lg:flex')}>
          <div className="border-b border-ink-100 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-ink-400" />
              <input
                className={cx(inputCls, 'border-transparent bg-ink-50 pr-10 pl-10 shadow-none hover:border-transparent')}
                type="search"
                placeholder="Buscar por nome ou telefone"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                autoComplete="off"
              />
              {busca && (
                <button
                  type="button"
                  aria-label="Limpar busca"
                  onClick={() => setBusca('')}
                  className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            {busca && <p className="mt-2 px-1 text-xs text-ink-500">{lista.length} encontrado{lista.length === 1 ? '' : 's'}</p>}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {clientes.isPending ? (
              <Esqueleto linhas={6} />
            ) : clientes.isError ? (
              <ErroCarregar erro={clientes.error} tentar={() => clientes.refetch()} />
            ) : lista.length === 0 ? (
              <Vazio
                icone={<Users />}
                titulo={busca ? 'Ninguém encontrado' : 'Nenhum cliente ainda'}
                texto={busca ? 'Tente outro nome — a busca ignora acentos.' : 'Importe da agenda do celular ou adicione um por um.'}
                acao={
                  !busca && (
                    <Botao variante="suave" tamanho="sm" onClick={acoes.importarContatos}>
                      Importar contatos
                    </Botao>
                  )
                }
              />
            ) : (
              <ul className="p-1.5">
                {lista.map((c) => (
                  <li key={c.id}>
                    <NavLink
                      to={`/clientes/${c.id}`}
                      className={({ isActive }) =>
                        cx('flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors', isActive ? 'bg-brand-50' : 'hover:bg-ink-50')
                      }
                    >
                      <Avatar nome={c.nome} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-ink-900">{c.nome}</span>
                        <span className="block truncate text-sm text-ink-500">
                          {c.telefone ? formatarTelefone(c.telefone) : c.endereco || 'Sem contato'}
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-ink-300 lg:hidden" />
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Cartao>

        <div className={cx(!detalhe && 'hidden lg:block')}>
          <Outlet />
        </div>
      </div>
    </>
  )
}

export function ClienteNenhumSelecionado() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 p-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-ink-400 shadow-card">
        <Users className="size-7" />
      </span>
      <p className="mt-4 font-bold text-ink-800">Selecione um cliente</p>
      <p className="mt-1 max-w-xs text-sm text-ink-500">Veja o histórico, quanto ele já pagou, o que falta receber e fale com ele em 1 clique.</p>
    </div>
  )
}
