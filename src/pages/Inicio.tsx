import { AlertTriangle, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { linkIniciar } from '../hooks/agendamento'
import { EditarServicoSheet } from '../components/EditarServicoSheet'
import { ItemAgendamento, ItemServico } from '../components/Itens'
import { Avatar, Cartao, ErroCarregar, Esqueleto, Fab, TituloSecao, Vazio } from '../components/ui'
import { useAgendados, useServicos } from '../hooks/dados'
import { amanhaISO, dataPorExtenso, hojeISO, intervaloMes } from '../lib/datas'
import { fmtBRLInteiro, somar } from '../lib/moeda'
import { primeiroNome } from '../lib/texto'
import type { Servico } from '../types'

export function Inicio() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const hoje = hojeISO()
  const [agora] = useState(() => new Date())
  const mes = intervaloMes(agora.getFullYear(), agora.getMonth() + 1)
  const servicosMes = useServicos(mes)
  const agendaHoje = useAgendados({ inicio: hoje, fim: amanhaISO() })
  const atrasados = useAgendados({ inicio: undefined, fim: hoje })
  const [editando, setEditando] = useState<Servico | null>(null)

  const doMes = useMemo(() => servicosMes.data ?? [], [servicosMes.data])
  const deHoje = useMemo(() => doMes.filter((s) => s.data === hoje), [doMes, hoje])
  const agendadosHoje = agendaHoje.data ?? []
  const qtdAtrasados = atrasados.data?.length ?? 0

  const cards = [
    { rotulo: 'Recebido hoje', valor: fmtBRLInteiro(somar(deHoje.filter((s) => s.pago))), cor: 'border-green-200 bg-green-50 text-green-700', valorCor: 'text-green-800' },
    { rotulo: 'Pendente hoje', valor: fmtBRLInteiro(somar(deHoje.filter((s) => !s.pago))), cor: 'border-rose-200 bg-rose-50 text-rose-700', valorCor: 'text-rose-800' },
    { rotulo: 'Recebido no mês', valor: fmtBRLInteiro(somar(doMes.filter((s) => s.pago))), cor: 'border-blue-200 bg-blue-50 text-blue-700', valorCor: 'text-blue-800' },
    { rotulo: 'Serviços hoje', valor: String(deHoje.length), cor: 'border-gray-200 bg-gray-50 text-gray-500', valorCor: 'text-gray-900' },
  ]

  return (
    <div className="min-h-dvh bg-[#f2f2f7]">
      <header className="bg-white px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-[28px] font-extrabold tracking-tight text-gray-900">
              Olá, {primeiroNome(perfil?.nome ?? '') || 'tudo bem'} 👋
            </h1>
            <p className="mt-0.5 text-[15px] text-gray-500">{dataPorExtenso(agora)}</p>
          </div>
          <Link to="/conta" aria-label="Minha conta" className="rounded-full active:opacity-70">
            <Avatar nome={perfil?.nome ?? '?'} />
          </Link>
        </div>
      </header>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c) => (
            <div key={c.rotulo} className={`rounded-2xl border p-4 ${c.cor}`}>
              <p className="text-[11px] font-bold tracking-wider uppercase">{c.rotulo}</p>
              <p className={`mt-1 text-[22px] font-extrabold tracking-tight ${c.valorCor}`}>
                {servicosMes.isPending ? <span className="inline-block h-7 w-20 animate-pulse rounded bg-white/70" /> : c.valor}
              </p>
            </div>
          ))}
        </div>

        {qtdAtrasados > 0 && (
          <Link to="/agenda" className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 active:bg-amber-100">
            <AlertTriangle className="size-5 shrink-0" />
            <span className="flex-1 text-sm font-semibold">
              {qtdAtrasados} agendamento{qtdAtrasados > 1 ? 's' : ''} atrasado{qtdAtrasados > 1 ? 's' : ''}
            </span>
            <ChevronRight className="size-5" />
          </Link>
        )}

        <Cartao>
          <TituloSecao acao={<Link to="/agenda" className="text-sm font-semibold text-green-600">Ver tudo</Link>}>Agenda de hoje</TituloSecao>
          {agendaHoje.isPending ? (
            <Esqueleto linhas={2} />
          ) : agendaHoje.isError ? (
            <ErroCarregar erro={agendaHoje.error} tentar={() => agendaHoje.refetch()} />
          ) : agendadosHoje.length === 0 ? (
            <Vazio titulo="Nenhum agendamento para hoje" />
          ) : (
            <div className="divide-y divide-gray-100 pb-1">
              {agendadosHoje.map((a) => (
                <ItemAgendamento key={a.id} agendamento={a} onClick={() => navigate(linkIniciar(a))} />
              ))}
            </div>
          )}
        </Cartao>

        <Cartao>
          <TituloSecao acao={<Link to="/historico" className="text-sm font-semibold text-green-600">Ver histórico</Link>}>Serviços de hoje</TituloSecao>
          {servicosMes.isPending ? (
            <Esqueleto linhas={2} />
          ) : servicosMes.isError ? (
            <ErroCarregar erro={servicosMes.error} tentar={() => servicosMes.refetch()} />
          ) : deHoje.length === 0 ? (
            <Vazio titulo="Nenhum serviço registrado hoje" />
          ) : (
            <div className="divide-y divide-gray-100 pb-1">
              {deHoje.map((s) => (
                <ItemServico key={s.id} servico={s} detalhe={s.observacao} onClick={() => setEditando(s)} />
              ))}
            </div>
          )}
        </Cartao>
      </div>

      <Fab rotulo="Novo serviço" onClick={() => navigate('/servicos/novo')} />
      <EditarServicoSheet servico={editando} onFechar={() => setEditando(null)} />
    </div>
  )
}
