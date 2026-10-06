import { BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Clock, Wrench } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { EditarServicoSheet } from '../components/EditarServicoSheet'
import { GraficoBarras } from '../components/GraficoBarras'
import { BadgePago, CabecalhoPagina, Cartao, ErroCarregar, Esqueleto, TituloSecao, Vazio } from '../components/ui'
import { useServicos } from '../hooks/dados'
import { dataDiaMes, deISO, intervaloAno, intervaloMes, mesAnoCurto } from '../lib/datas'
import { fmtBRL, somar } from '../lib/moeda'
import type { Servico } from '../types'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

type TopCliente = { id: string; nome: string; total: number; qtd: number }

function topClientes(servicos: Servico[], limite = 5): TopCliente[] {
  const mapa = new Map<string, TopCliente>()
  for (const s of servicos) {
    const atual = mapa.get(s.cliente_id) ?? { id: s.cliente_id, nome: s.cliente?.nome ?? 'Cliente', total: 0, qtd: 0 }
    atual.total += s.valor ?? 0
    atual.qtd += 1
    mapa.set(s.cliente_id, atual)
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total).slice(0, limite)
}

export function Financeiro() {
  const [agora] = useState(() => new Date())
  const [modo, setModo] = useState<'mes' | 'ano'>('mes')
  const [ano, setAno] = useState(agora.getFullYear())
  const [mes, setMes] = useState(agora.getMonth() + 1)
  const [editando, setEditando] = useState<Servico | null>(null)

  const consulta = useServicos(modo === 'mes' ? intervaloMes(ano, mes) : intervaloAno(ano))
  const servicos = useMemo(() => consulta.data ?? [], [consulta.data])

  const mover = (delta: number) => {
    if (modo === 'ano') return setAno((a) => a + delta)
    const d = new Date(ano, mes - 1 + delta, 1)
    setAno(d.getFullYear())
    setMes(d.getMonth() + 1)
  }

  const recebido = somar(servicos.filter((s) => s.pago))
  const pendente = somar(servicos.filter((s) => !s.pago))
  const media = servicos.length ? (recebido + pendente) / servicos.length : 0

  const barras = useMemo(() => {
    const pagos = servicos.filter((s) => s.pago)
    if (modo === 'ano') {
      const totais = Array<number>(12).fill(0)
      for (const s of pagos) totais[deISO(s.data).getMonth()] += s.valor ?? 0
      return totais.map((valor, i) => ({ rotulo: MESES[i], valor }))
    }
    // Semanas fixas: 1–7, 8–14, 15–21, 22–fim
    const totais = [0, 0, 0, 0]
    for (const s of pagos) totais[Math.min(3, Math.floor((deISO(s.data).getDate() - 1) / 7))] += s.valor ?? 0
    return totais.map((valor, i) => ({ rotulo: `S${i + 1}`, valor }))
  }, [servicos, modo])

  const top = useMemo(() => topClientes(servicos), [servicos])

  const cards: { rotulo: string; valor: string; icone: ReactNode; cor: string }[] = [
    { rotulo: 'Recebido', valor: fmtBRL(recebido), icone: <CheckCircle2 className="size-5" />, cor: 'border-green-200 bg-green-50 text-green-700 [&_strong]:text-green-800' },
    { rotulo: 'Pendente', valor: fmtBRL(pendente), icone: <Clock className="size-5" />, cor: 'border-red-200 bg-red-50 text-red-600 [&_strong]:text-red-700' },
    { rotulo: 'Serviços', valor: String(servicos.length), icone: <Wrench className="size-5" />, cor: 'border-gray-200 bg-white text-gray-500 [&_strong]:text-gray-900' },
    { rotulo: 'Média/serv.', valor: fmtBRL(media), icone: <BarChart3 className="size-5" />, cor: 'border-gray-200 bg-white text-gray-500 [&_strong]:text-gray-900' },
  ]

  return (
    <div>
      <CabecalhoPagina titulo="Financeiro">
        <div className="mt-4 flex items-center gap-2">
          <button type="button" aria-label="Período anterior" onClick={() => mover(-1)} className="flex size-11 items-center justify-center rounded-full bg-gray-100 text-gray-700 active:bg-gray-200">
            <ChevronLeft className="size-5" />
          </button>
          <span className="flex-1 text-center text-lg font-bold text-gray-900">{modo === 'mes' ? mesAnoCurto(ano, mes) : ano}</span>
          <button type="button" aria-label="Próximo período" onClick={() => mover(1)} className="flex size-11 items-center justify-center rounded-full bg-gray-100 text-gray-700 active:bg-gray-200">
            <ChevronRight className="size-5" />
          </button>
          <div className="ml-1 flex rounded-full bg-gray-100 p-1" role="tablist">
            {(['mes', 'ano'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={modo === m}
                onClick={() => setModo(m)}
                className={`min-h-9 rounded-full px-3.5 text-sm font-bold ${modo === m ? 'bg-green-600 text-white' : 'text-gray-500'}`}
              >
                {m === 'mes' ? 'Mês' : 'Ano'}
              </button>
            ))}
          </div>
        </div>
      </CabecalhoPagina>

      <div className="space-y-4 p-4">
        {consulta.isError ? (
          <ErroCarregar erro={consulta.error} tentar={() => consulta.refetch()} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {cards.map((c) => (
                <div key={c.rotulo} className={`rounded-2xl border p-4 ${c.cor}`}>
                  <div className="flex items-center gap-1.5">
                    {c.icone}
                    <span className="text-[11px] font-bold tracking-wider uppercase">{c.rotulo}</span>
                  </div>
                  <strong className="mt-1.5 block text-xl font-extrabold tracking-tight">
                    {consulta.isPending ? <span className="inline-block h-6 w-20 animate-pulse rounded bg-gray-200/60" /> : c.valor}
                  </strong>
                </div>
              ))}
            </div>

            <Cartao>
              <TituloSecao>{modo === 'mes' ? 'Receita por semana' : 'Receita por mês'}</TituloSecao>
              <div className="px-3 pb-4">{consulta.isPending ? <Esqueleto linhas={2} /> : <GraficoBarras itens={barras} />}</div>
            </Cartao>

            <Cartao>
              <TituloSecao>Top clientes</TituloSecao>
              {consulta.isPending ? (
                <Esqueleto />
              ) : top.length === 0 ? (
                <Vazio titulo="Sem serviços no período" />
              ) : (
                <ol className="space-y-4 px-4 pb-4">
                  {top.map((t, i) => (
                    <li key={t.id} className="flex items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-semibold text-gray-900">{t.nome}</span>
                          <span className="shrink-0 font-bold text-gray-900">{fmtBRL(t.total)}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-green-600" style={{ width: `${top[0].total ? (t.total / top[0].total) * 100 : 0}%` }} />
                        </div>
                        <span className="mt-1 block text-xs text-gray-500">
                          {t.qtd} serviço{t.qtd === 1 ? '' : 's'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Cartao>

            <Cartao>
              <TituloSecao>Últimos serviços</TituloSecao>
              {consulta.isPending ? (
                <Esqueleto />
              ) : servicos.length === 0 ? (
                <Vazio titulo="Sem serviços no período" />
              ) : (
                <ul className="divide-y divide-gray-100 pb-1">
                  {servicos.slice(0, 8).map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => setEditando(s)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-gray-50">
                        <span className="w-12 shrink-0 text-sm font-semibold text-gray-500">{dataDiaMes(s.data)}</span>
                        <span className="min-w-0 flex-1 truncate font-semibold text-gray-900">{s.cliente?.nome}</span>
                        <span className={`shrink-0 font-bold ${s.pago ? 'text-green-800' : 'text-red-600'}`}>{s.valor == null ? '—' : fmtBRL(s.valor)}</span>
                        <BadgePago pago={s.pago} curto />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Cartao>
          </>
        )}
      </div>

      <EditarServicoSheet servico={editando} onFechar={() => setEditando(null)} />
    </div>
  )
}
