import { History } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EditarServicoSheet } from '../components/EditarServicoSheet'
import { ItemServico } from '../components/Itens'
import { Botao, CabecalhoPagina, ErroCarregar, Esqueleto, Vazio, cx } from '../components/ui'
import { useServicos, useTodosServicos } from '../hooks/dados'
import { addDays } from 'date-fns'
import { dataGrupo, deISO, hojeISO, horaDoRegistro, inicioSemanaISO, intervaloMes, paraISO } from '../lib/datas'
import { fmtBRL, somar } from '../lib/moeda'
import type { Servico } from '../types'

type Filtro = 'hoje' | 'semana' | 'mes' | 'tudo'

const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: 'hoje', rotulo: 'Hoje' },
  { id: 'semana', rotulo: 'Semana' },
  { id: 'mes', rotulo: 'Mês' },
  { id: 'tudo', rotulo: 'Tudo' },
]

function periodoDo(filtro: Filtro): { inicio?: string; fim?: string } {
  const hoje = hojeISO()
  const agora = new Date()
  if (filtro === 'hoje') return { inicio: hoje, fim: paraISO(addDays(deISO(hoje), 1)) }
  if (filtro === 'semana') return { inicio: inicioSemanaISO() }
  return intervaloMes(agora.getFullYear(), agora.getMonth() + 1)
}

export function Historico() {
  const [filtro, setFiltro] = useState<Filtro>('mes')
  const [editando, setEditando] = useState<Servico | null>(null)
  const periodo = useServicos(periodoDo(filtro === 'tudo' ? 'mes' : filtro))
  const tudo = useTodosServicos(filtro === 'tudo')

  const consulta = filtro === 'tudo' ? tudo : periodo
  const servicos = useMemo(() => (filtro === 'tudo' ? (tudo.data?.pages.flat() ?? []) : (periodo.data ?? [])), [filtro, tudo.data, periodo.data])

  const grupos = useMemo(() => {
    const mapa = new Map<string, Servico[]>()
    for (const s of servicos) {
      const lista = mapa.get(s.data)
      if (lista) lista.push(s)
      else mapa.set(s.data, [s])
    }
    return [...mapa.entries()]
  }, [servicos])

  return (
    <div>
      <CabecalhoPagina titulo="Histórico">
        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5" role="tablist">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filtro === f.id}
              onClick={() => setFiltro(f.id)}
              className={cx(
                'min-h-10 shrink-0 rounded-full px-5 text-sm font-bold transition-colors',
                filtro === f.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 active:bg-gray-200',
              )}
            >
              {f.rotulo}
            </button>
          ))}
        </div>
      </CabecalhoPagina>

      <div className="space-y-4 p-4">
        {consulta.isPending ? (
          <div className="rounded-2xl bg-white">
            <Esqueleto linhas={5} />
          </div>
        ) : consulta.isError ? (
          <ErroCarregar erro={consulta.error} tentar={() => consulta.refetch()} />
        ) : grupos.length === 0 ? (
          <Vazio icone={<History className="size-12" />} titulo="Nenhum serviço encontrado" texto="Os serviços registrados aparecem aqui" />
        ) : (
          <>
            {grupos.map(([data, itens]) => (
              <section key={data}>
                <div className="flex items-baseline justify-between px-1 pb-2">
                  <h2 className="text-sm font-bold text-gray-600">{dataGrupo(data)}</h2>
                  <span className="text-sm font-bold text-gray-900">{fmtBRL(somar(itens))}</span>
                </div>
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  {itens.map((s) => (
                    <li key={s.id}>
                      <ItemServico servico={s} detalhe={horaDoRegistro(s.criado_em, s.data) ?? s.observacao} onClick={() => setEditando(s)} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {filtro === 'tudo' && tudo.hasNextPage && (
              <Botao variante="secundario" onClick={() => tudo.fetchNextPage()} carregando={tudo.isFetchingNextPage}>
                Carregar mais
              </Botao>
            )}
          </>
        )}
      </div>

      <EditarServicoSheet servico={editando} onFechar={() => setEditando(null)} />
    </div>
  )
}
