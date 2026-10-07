import { BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Clock, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AbasFinancas } from '../components/AbasFinancas'
import { useAcoes } from '../components/Acoes'
import { GraficoBarras } from '../components/GraficoBarras'
import { Avatar, BadgePago, CabecalhoCartao, CabecalhoPagina, Cartao, ErroCarregar, Esqueleto, Indicador, Segmentado, Vazio, cx } from '../components/ui'
import { useServicos } from '../hooks/dados'
import { dataDiaMes, deISO, intervaloAno, intervaloMes, mesAno } from '../lib/datas'
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
  const acoes = useAcoes()
  const [agora] = useState(() => new Date())
  const [modo, setModo] = useState<'mes' | 'ano'>('mes')
  const [ano, setAno] = useState(agora.getFullYear())
  const [mes, setMes] = useState(agora.getMonth() + 1)

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
    return totais.map((valor, i) => ({ rotulo: `Sem. ${i + 1}`, valor }))
  }, [servicos, modo])

  const top = useMemo(() => topClientes(servicos), [servicos])
  const carregando = consulta.isPending

  return (
    <>
      <CabecalhoPagina
        titulo="Financeiro"
        subtitulo="Quanto entrou, quanto falta e quem são seus melhores clientes."
        acoes={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-ink-200 bg-white shadow-card">
              <button type="button" aria-label="Período anterior" onClick={() => mover(-1)} className="flex size-10 items-center justify-center rounded-l-xl text-ink-600 hover:bg-ink-50">
                <ChevronLeft className="size-5" />
              </button>
              <span className="min-w-32 px-2 text-center text-[15px] font-bold text-ink-900">{modo === 'mes' ? mesAno(ano, mes) : ano}</span>
              <button type="button" aria-label="Próximo período" onClick={() => mover(1)} className="flex size-10 items-center justify-center rounded-r-xl text-ink-600 hover:bg-ink-50">
                <ChevronRight className="size-5" />
              </button>
            </div>
            <Segmentado
              valor={modo}
              onChange={setModo}
              opcoes={[
                { id: 'mes', rotulo: 'Mês' },
                { id: 'ano', rotulo: 'Ano' },
              ]}
            />
          </div>
        }
      >
        <AbasFinancas />
      </CabecalhoPagina>

      {consulta.isError ? (
        <ErroCarregar erro={consulta.error} tentar={() => consulta.refetch()} />
      ) : (
        <div className="space-y-5 lg:space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <Indicador rotulo="Recebido" tom="verde" icone={<CheckCircle2 />} valor={fmtBRL(recebido)} carregando={carregando} />
            <Indicador rotulo="A receber" tom="ambar" icone={<Clock />} valor={fmtBRL(pendente)} carregando={carregando} />
            <Indicador rotulo="Serviços" icone={<Wrench />} valor={servicos.length} carregando={carregando} />
            <Indicador rotulo="Média por serviço" icone={<BarChart3 />} valor={fmtBRL(media)} carregando={carregando} />
          </div>

          <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
            <Cartao className="flex flex-col lg:col-span-2">
              <CabecalhoCartao titulo={modo === 'mes' ? 'Recebido por semana' : 'Recebido por mês'} />
              <div className="flex flex-1 flex-col justify-end px-5 pb-5">{carregando ? <Esqueleto linhas={3} /> : <GraficoBarras itens={barras} />}</div>
            </Cartao>

            <Cartao>
              <CabecalhoCartao titulo="Melhores clientes" />
              {carregando ? (
                <Esqueleto />
              ) : top.length === 0 ? (
                <Vazio titulo="Sem serviços no período" />
              ) : (
                <ol className="space-y-4 px-5 pb-5">
                  {top.map((t, i) => (
                    <li key={t.id}>
                      <Link to={`/clientes/${t.id}`} className="group flex items-center gap-3">
                        <span className="w-4 text-center text-sm font-bold text-ink-400">{i + 1}</span>
                        <Avatar nome={t.nome} tamanho="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-ink-900 group-hover:underline">{t.nome}</span>
                            <span className="tabular shrink-0 text-sm font-bold text-ink-900">{fmtBRL(t.total)}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
                            <div className="h-full rounded-full bg-brand-500" style={{ width: `${top[0].total ? (t.total / top[0].total) * 100 : 0}%` }} />
                          </div>
                          <span className="mt-1 block text-xs text-ink-500">
                            {t.qtd} serviço{t.qtd === 1 ? '' : 's'}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </Cartao>
          </div>

          <Cartao>
            <CabecalhoCartao titulo="Últimos serviços do período" />
            {carregando ? (
              <Esqueleto />
            ) : servicos.length === 0 ? (
              <Vazio titulo="Sem serviços no período" />
            ) : (
              <ul className="divide-y divide-ink-100 pb-2">
                {servicos.slice(0, 8).map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => acoes.editarServico(s)} className="flex w-full items-center gap-4 px-5 py-3 text-left hover:bg-ink-50">
                      <span className="w-14 shrink-0 text-sm font-semibold text-ink-500">{dataDiaMes(s.data)}</span>
                      <span className="min-w-0 flex-1 truncate font-semibold text-ink-900">{s.cliente?.nome}</span>
                      <span className="hidden min-w-0 flex-1 truncate text-sm text-ink-500 md:block">{s.observacao}</span>
                      <span className={cx('tabular shrink-0 font-bold', s.pago ? 'text-ink-900' : 'text-amber-700')}>{s.valor == null ? '—' : fmtBRL(s.valor)}</span>
                      <span className="hidden sm:block">
                        <BadgePago pago={s.pago} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>
      )}
    </>
  )
}
