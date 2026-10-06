import { addDays } from 'date-fns'
import { AlertTriangle, CalendarX2, Play, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendario } from '../components/Calendario'
import { EditarAgendamentoSheet } from '../components/EditarAgendamentoSheet'
import { linkIniciar, useCancelarAgendamento } from '../hooks/agendamento'
import { CabecalhoPagina, ErroCarregar, Esqueleto, Fab, Vazio } from '../components/ui'
import { useAgendados } from '../hooks/dados'
import { dataCurta, dataPorExtenso, deISO, hojeISO, horaCurta, intervaloMes, paraISO } from '../lib/datas'
import type { Agendamento } from '../types'

export function Agenda() {
  const navigate = useNavigate()
  const hoje = hojeISO()
  const [selecionado, setSelecionado] = useState(hoje)
  const [visivel, setVisivel] = useState(() => ({ ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 }))
  const [editando, setEditando] = useState<Agendamento | null>(null)
  const cancelar = useCancelarAgendamento()

  const doMes = useAgendados(intervaloMes(visivel.ano, visivel.mes))
  const doDia = useAgendados({ inicio: selecionado, fim: paraISO(addDays(deISO(selecionado), 1)) })
  const atrasados = useAgendados({ inicio: undefined, fim: hoje })

  const marcados = useMemo(() => new Set((doMes.data ?? []).map((a) => a.data)), [doMes.data])

  const mudarMes = (delta: number) =>
    setVisivel(({ ano, mes }) => {
      const d = new Date(ano, mes - 1 + delta, 1)
      return { ano: d.getFullYear(), mes: d.getMonth() + 1 }
    })

  const irPara = (iso: string) => {
    const d = deISO(iso)
    setSelecionado(iso)
    setVisivel({ ano: d.getFullYear(), mes: d.getMonth() + 1 })
  }

  const novo = () => navigate(`/agendamentos/novo${selecionado > hoje ? `?data=${selecionado}` : ''}`)

  return (
    <div>
      <CabecalhoPagina
        titulo="Agenda"
        direita={
          selecionado !== hoje && (
            <button type="button" onClick={() => irPara(hoje)} className="rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700 active:bg-green-100">
              Hoje
            </button>
          )
        }
      />
      <div className="space-y-4 p-4">
        {(atrasados.data?.length ?? 0) > 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <h2 className="mb-2 flex items-center gap-2 px-1 text-xs font-bold tracking-wider text-amber-800 uppercase">
              <AlertTriangle className="size-4" /> Atrasados
            </h2>
            <ul className="space-y-2">
              {atrasados.data!.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => setEditando(a)} className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left active:bg-amber-100/50">
                    <span className="w-20 shrink-0 text-xs font-bold text-amber-700">
                      {dataCurta(a.data).slice(0, 5)} · {horaCurta(a.hora)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-gray-900">{a.cliente?.nome}</span>
                      <span className="block truncate text-sm text-gray-500">{a.descricao}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 px-1 text-xs text-amber-700">Toque para iniciar, remarcar ou cancelar.</p>
          </section>
        )}

        <Calendario
          ano={visivel.ano}
          mes={visivel.mes}
          selecionado={selecionado}
          hoje={hoje}
          marcados={marcados}
          onSelecionar={setSelecionado}
          onMudarMes={mudarMes}
        />

        <section>
          <h2 className="px-1 pb-2 text-xs font-bold tracking-wider text-gray-500 uppercase">
            {selecionado === hoje ? 'Hoje' : dataPorExtenso(selecionado)}
          </h2>
          {doDia.isPending ? (
            <div className="rounded-2xl bg-white">
              <Esqueleto linhas={2} />
            </div>
          ) : doDia.isError ? (
            <ErroCarregar erro={doDia.error} tentar={() => doDia.refetch()} />
          ) : doDia.data.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white">
              <Vazio icone={<CalendarX2 className="size-10" />} titulo="Nenhum agendamento" />
            </div>
          ) : (
            <ul className="space-y-3">
              {doDia.data.map((a) => (
                <li key={a.id} className="flex overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                  <span className={`w-1 shrink-0 ${a.data < hoje ? 'bg-amber-500' : 'bg-green-600'}`} />
                  <button type="button" onClick={() => setEditando(a)} className="min-w-0 flex-1 p-4 text-left active:bg-gray-50">
                    <span className={`block text-lg font-extrabold ${a.data < hoje ? 'text-amber-600' : 'text-green-600'}`}>{horaCurta(a.hora)}</span>
                    <span className="block truncate text-[16px] font-semibold text-gray-900">{a.cliente?.nome}</span>
                    <span className="line-clamp-2 text-sm text-gray-500">{a.descricao}</span>
                  </button>
                  <div className="flex shrink-0 flex-col justify-center gap-2 p-3">
                    <button
                      type="button"
                      onClick={() => navigate(linkIniciar(a))}
                      className="flex min-h-10 items-center gap-1.5 rounded-xl bg-green-600 px-3.5 text-sm font-bold text-white active:bg-green-700"
                    >
                      <Play className="size-4" fill="currentColor" /> Iniciar
                    </button>
                    <button
                      type="button"
                      onClick={() => void cancelar(a)}
                      className="flex min-h-10 items-center gap-1.5 rounded-xl bg-red-50 px-3.5 text-sm font-bold text-red-600 active:bg-red-100"
                    >
                      <X className="size-4" /> Cancelar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <Fab rotulo="Novo agendamento" onClick={novo} />
      <EditarAgendamentoSheet agendamento={editando} onFechar={() => setEditando(null)} />
    </div>
  )
}
