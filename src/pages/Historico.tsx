import { addDays } from 'date-fns'
import { History, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AbasFinancas } from '../components/AbasFinancas'
import { useAcoes } from '../components/Acoes'
import { LinhaChips } from '../components/Atalhos'
import { ItemServico } from '../components/Itens'
import { Botao, CabecalhoPagina, Cartao, Chip, ErroCarregar, Esqueleto, Vazio, cx, inputCls } from '../components/ui'
import { useAReceber, useServicos, useTodosServicos } from '../hooks/dados'
import { dataGrupo, deISO, hojeISO, horaDoRegistro, inicioSemanaISO, intervaloMes, paraISO } from '../lib/datas'
import { fmtBRL, somar } from '../lib/moeda'
import { normalizar } from '../lib/texto'
import type { Servico } from '../types'

type Filtro = 'hoje' | 'semana' | 'mes' | 'areceber' | 'tudo'

const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: 'hoje', rotulo: 'Hoje' },
  { id: 'semana', rotulo: 'Esta semana' },
  { id: 'mes', rotulo: 'Este mês' },
  { id: 'areceber', rotulo: 'A receber' },
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
  const acoes = useAcoes()
  const [params, setParams] = useSearchParams()
  const filtro = (FILTROS.some((f) => f.id === params.get('filtro')) ? params.get('filtro') : 'mes') as Filtro
  const [busca, setBusca] = useState('')

  const periodo = useServicos(periodoDo(filtro === 'tudo' || filtro === 'areceber' ? 'mes' : filtro))
  const aReceber = useAReceber()
  const tudo = useTodosServicos(filtro === 'tudo')
  const consulta = filtro === 'tudo' ? tudo : filtro === 'areceber' ? aReceber : periodo

  const servicos = useMemo(() => {
    const base = filtro === 'tudo' ? (tudo.data?.pages.flat() ?? []) : filtro === 'areceber' ? (aReceber.data ?? []) : (periodo.data ?? [])
    const q = normalizar(busca)
    return q ? base.filter((s) => normalizar(`${s.cliente?.nome ?? ''} ${s.observacao ?? ''}`).includes(q)) : base
  }, [filtro, tudo.data, aReceber.data, periodo.data, busca])

  const grupos = useMemo(() => {
    const mapa = new Map<string, Servico[]>()
    for (const s of servicos) mapa.set(s.data, [...(mapa.get(s.data) ?? []), s])
    return [...mapa.entries()]
  }, [servicos])

  const recebido = somar(servicos.filter((s) => s.pago))
  const pendente = somar(servicos.filter((s) => !s.pago))

  return (
    <>
      <CabecalhoPagina titulo="Histórico" subtitulo="Tudo o que você já fez, dia a dia.">
        <AbasFinancas />
      </CabecalhoPagina>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <LinhaChips className="!mx-0 !px-0">
          {FILTROS.map((f) => (
            <Chip key={f.id} ativo={filtro === f.id} onClick={() => setParams(f.id === 'mes' ? {} : { filtro: f.id }, { replace: true })}>
              {f.rotulo}
            </Chip>
          ))}
        </LinhaChips>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-ink-400" />
          <input className={cx(inputCls, 'py-2.5 pl-10')} type="search" placeholder="Filtrar por cliente ou serviço" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      {!consulta.isPending && !consulta.isError && servicos.length > 0 && (
        <div className="mb-5 grid grid-cols-3 divide-x divide-ink-100 rounded-2xl border border-ink-200/80 bg-white shadow-card">
          {[
            { rotulo: 'Total', valor: recebido + pendente, cor: 'text-ink-900' },
            { rotulo: 'Recebido', valor: recebido, cor: 'text-brand-700' },
            { rotulo: 'A receber', valor: pendente, cor: 'text-amber-700' },
          ].map((r) => (
            <div key={r.rotulo} className="px-3 py-3 sm:px-5">
              <p className="text-xs font-semibold text-ink-500">
                {r.rotulo}
                {filtro === 'tudo' && tudo.hasNextPage ? '*' : ''}
              </p>
              <p className={cx('tabular mt-0.5 truncate text-[15px] font-extrabold sm:text-lg', r.cor)}>{fmtBRL(r.valor)}</p>
            </div>
          ))}
        </div>
      )}

      {consulta.isPending ? (
        <Cartao>
          <Esqueleto linhas={5} />
        </Cartao>
      ) : consulta.isError ? (
        <ErroCarregar erro={consulta.error} tentar={() => consulta.refetch()} />
      ) : grupos.length === 0 ? (
        <Cartao>
          <Vazio
            icone={<History />}
            titulo={filtro === 'areceber' ? 'Ninguém te devendo' : 'Nenhum serviço aqui'}
            texto={busca ? 'Nada combina com a busca.' : 'Os serviços registrados aparecem neste histórico.'}
            acao={
              !busca && filtro !== 'areceber' && (
                <Botao variante="suave" tamanho="sm" onClick={() => acoes.novoServico()}>
                  Registrar serviço
                </Botao>
              )
            }
          />
        </Cartao>
      ) : (
        <div className="space-y-4">
          {grupos.map(([data, itens]) => (
            <Cartao key={data} className="overflow-hidden">
              <div className="flex items-baseline justify-between border-b border-ink-100 bg-ink-50/60 px-5 py-2.5">
                <h2 className="text-sm font-bold text-ink-700">{dataGrupo(data)}</h2>
                <span className="tabular text-sm font-bold text-ink-900">{fmtBRL(somar(itens))}</span>
              </div>
              <div className="divide-y divide-ink-100">
                {itens.map((s) => (
                  <ItemServico
                    key={s.id}
                    servico={s}
                    detalhe={s.observacao ?? horaDoRegistro(s.criado_em, s.data)}
                    extra={horaDoRegistro(s.criado_em, s.data)}
                    onClick={() => acoes.editarServico(s)}
                  />
                ))}
              </div>
            </Cartao>
          ))}
          {filtro === 'tudo' && tudo.hasNextPage && (
            <Botao variante="secundario" largo onClick={() => tudo.fetchNextPage()} carregando={tudo.isFetchingNextPage}>
              Carregar mais
            </Botao>
          )}
          {filtro === 'tudo' && tudo.hasNextPage && <p className="text-center text-xs text-ink-400">* totais dos serviços já carregados</p>}
        </div>
      )}
    </>
  )
}
