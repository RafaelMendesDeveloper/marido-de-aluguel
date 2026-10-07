import { addDays } from 'date-fns'
import { AlertTriangle, CalendarPlus, CalendarX2, Play } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAcoes } from '../components/Acoes'
import { Calendario } from '../components/Calendario'
import { ItemAgendamento } from '../components/Itens'
import { Botao, CabecalhoCartao, CabecalhoPagina, Cartao, ErroCarregar, Esqueleto, Vazio } from '../components/ui'
import { useAgendados } from '../hooks/dados'
import { dataCurta, dataPorExtenso, deISO, hojeISO, intervaloMes, paraISO } from '../lib/datas'
import type { Agendamento } from '../types'

function agrupar(lista: Agendamento[]): [string, Agendamento[]][] {
  const mapa = new Map<string, Agendamento[]>()
  for (const a of lista) mapa.set(a.data, [...(mapa.get(a.data) ?? []), a])
  return [...mapa.entries()]
}

export function Agenda() {
  const acoes = useAcoes()
  const hoje = hojeISO()
  const [selecionado, setSelecionado] = useState(hoje)
  const [visivel, setVisivel] = useState(() => ({ ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 }))

  const doMes = useAgendados(intervaloMes(visivel.ano, visivel.mes))
  const doDia = useAgendados({ inicio: selecionado, fim: paraISO(addDays(deISO(selecionado), 1)) })
  const proximos = useAgendados({ inicio: hoje, fim: paraISO(addDays(deISO(hoje), 15)) })
  const atrasados = useAgendados({ fim: hoje })

  const marcados = useMemo(() => new Set((doMes.data ?? []).map((a) => a.data)), [doMes.data])
  const proximosAgrupados = useMemo(() => agrupar((proximos.data ?? []).filter((a) => a.data !== selecionado)), [proximos.data, selecionado])
  const qtdSemana = (proximos.data ?? []).filter((a) => a.data < paraISO(addDays(deISO(hoje), 7))).length

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

  const botaoIniciar = (a: Agendamento) => (
    <Botao tamanho="sm" onClick={() => acoes.iniciarAgendamento(a)}>
      <Play className="size-3.5" fill="currentColor" /> Iniciar
    </Botao>
  )

  return (
    <>
      <CabecalhoPagina
        titulo="Agenda"
        subtitulo={proximos.data ? `${qtdSemana} visita${qtdSemana === 1 ? '' : 's'} nos próximos 7 dias` : ' '}
        acoes={
          <>
            {selecionado !== hoje && (
              <Botao variante="secundario" onClick={() => irPara(hoje)}>
                Hoje
              </Botao>
            )}
            <Botao className="hidden sm:inline-flex" onClick={() => acoes.novoAgendamento({ data: selecionado })}>
              <CalendarPlus className="size-4" /> Agendar visita
            </Botao>
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-6">
        <div className="space-y-5 lg:sticky lg:top-6">
          <Calendario
            ano={visivel.ano}
            mes={visivel.mes}
            selecionado={selecionado}
            hoje={hoje}
            marcados={marcados}
            onSelecionar={setSelecionado}
            onMudarMes={mudarMes}
          />

          {(atrasados.data?.length ?? 0) > 0 && (
            <section className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60">
              <h2 className="flex items-center gap-2 px-5 pt-4 pb-2 text-[15px] font-bold text-amber-900">
                <AlertTriangle className="size-4 text-amber-600" /> Atrasadas
              </h2>
              <div className="divide-y divide-amber-100 pb-2">
                {atrasados.data!.map((a) => (
                  <ItemAgendamento
                    key={a.id}
                    agendamento={{ ...a, descricao: `${dataCurta(a.data).slice(0, 5)} · ${a.descricao}` }}
                    atrasado
                    onClick={() => acoes.editarAgendamento(a)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-5 lg:space-y-6">
          <Cartao>
            <CabecalhoCartao
              titulo={selecionado === hoje ? `Hoje · ${dataPorExtenso(selecionado)}` : dataPorExtenso(selecionado)}
              acao={
                <Botao variante="suave" tamanho="sm" onClick={() => acoes.novoAgendamento({ data: selecionado })}>
                  <CalendarPlus className="size-4" /> Agendar
                </Botao>
              }
            />
            {doDia.isPending ? (
              <Esqueleto linhas={2} />
            ) : doDia.isError ? (
              <ErroCarregar erro={doDia.error} tentar={() => doDia.refetch()} />
            ) : doDia.data.length === 0 ? (
              <Vazio icone={<CalendarX2 />} titulo="Dia livre" texto={selecionado < hoje ? 'Nenhuma visita pendente neste dia.' : 'Nenhuma visita marcada para este dia.'} />
            ) : (
              <div className="divide-y divide-ink-100 pb-2">
                {doDia.data.map((a) => (
                  <ItemAgendamento key={a.id} agendamento={a} atrasado={a.data < hoje} onClick={() => acoes.editarAgendamento(a)} direita={botaoIniciar(a)} />
                ))}
              </div>
            )}
          </Cartao>

          {proximosAgrupados.length > 0 && (
            <Cartao>
              <CabecalhoCartao titulo="Próximas visitas" />
              <div className="pb-2">
                {proximosAgrupados.map(([data, itens]) => (
                  <div key={data}>
                    <button
                      type="button"
                      onClick={() => irPara(data)}
                      className="w-full bg-ink-50/70 px-5 py-1.5 text-left text-xs font-bold tracking-wide text-ink-500 uppercase hover:text-ink-800"
                    >
                      {data === hoje ? 'Hoje' : dataPorExtenso(data)}
                    </button>
                    <div className="divide-y divide-ink-100">
                      {itens.map((a) => (
                        <ItemAgendamento key={a.id} agendamento={a} onClick={() => acoes.editarAgendamento(a)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Cartao>
          )}
        </div>
      </div>
    </>
  )
}
