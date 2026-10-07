import { addDays } from 'date-fns'
import { AlertTriangle, CalendarClock, CalendarDays, ChevronRight, Clock, MapPin, MessageCircle, Play, Receipt, TrendingUp, Upload, UserPlus, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useAcoes } from '../components/Acoes'
import { ItemAgendamento, ItemServico } from '../components/Itens'
import { Avatar, Botao, CabecalhoCartao, CabecalhoPagina, Cartao, ErroCarregar, Esqueleto, Indicador, LinkCartao, Vazio } from '../components/ui'
import { useAgendados, useAReceber, useClientes, useServicos } from '../hooks/dados'
import { dataPorExtenso, deISO, hojeISO, horaCurta, intervaloMes, paraISO } from '../lib/datas'
import { devedores, fmtBRL, fmtBRLInteiro, mensagemCobranca, somar } from '../lib/moeda'
import { linkMaps, linkWhatsApp } from '../lib/telefone'
import { primeiroNome } from '../lib/texto'
import type { Agendamento } from '../types'

function saudacao(d: Date): string {
  const h = d.getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

function quandoRelativo(iso: string, hoje: string): string {
  if (iso === hoje) return 'Hoje'
  if (iso === paraISO(addDays(deISO(hoje), 1))) return 'Amanhã'
  return dataPorExtenso(iso)
}

export function Inicio() {
  const { perfil } = useAuth()
  const acoes = useAcoes()
  const [agora] = useState(() => new Date())
  const hoje = hojeISO()
  const mes = intervaloMes(agora.getFullYear(), agora.getMonth() + 1)

  const servicosMes = useServicos(mes)
  const proximos = useAgendados({ inicio: hoje })
  const atrasados = useAgendados({ fim: hoje })
  const aReceber = useAReceber()
  const clientes = useClientes()

  const doMes = useMemo(() => servicosMes.data ?? [], [servicosMes.data])
  const deHoje = useMemo(() => doMes.filter((s) => s.data === hoje), [doMes, hoje])
  const agendaHoje = (proximos.data ?? []).filter((a) => a.data === hoje)
  const proximo = proximos.data?.[0]
  const listaDevedores = useMemo(() => devedores(aReceber.data ?? []), [aReceber.data])
  const qtdAtrasados = atrasados.data?.length ?? 0
  const semClientes = clientes.data?.length === 0

  return (
    <>
      <CabecalhoPagina
        titulo={`${saudacao(agora)}, ${primeiroNome(perfil?.nome ?? '') || 'tudo bem'}`}
        subtitulo={dataPorExtenso(agora)}
        acoes={
          <div className="hidden gap-2 sm:flex">
            <Botao variante="secundario" onClick={() => acoes.novoAgendamento()}>
              <CalendarDays className="size-4" /> Agendar
            </Botao>
            <Botao onClick={() => acoes.novoServico()}>
              <Receipt className="size-4" /> Registrar serviço
            </Botao>
          </div>
        }
      />

      <div className="space-y-5 lg:space-y-6">
        {semClientes && <PrimeirosPassos />}

        {qtdAtrasados > 0 && (
          <Link
            to="/agenda"
            className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 transition hover:bg-amber-100"
          >
            <AlertTriangle className="size-5 shrink-0 text-amber-600" />
            <span className="flex-1 text-sm">
              <strong>
                {qtdAtrasados} visita{qtdAtrasados > 1 ? 's' : ''} atrasada{qtdAtrasados > 1 ? 's' : ''}
              </strong>{' '}
              — conclua, remarque ou cancele.
            </span>
            <ChevronRight className="size-5" />
          </Link>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <Indicador
            rotulo="Recebido hoje"
            tom="verde"
            icone={<Wallet />}
            carregando={servicosMes.isPending}
            valor={fmtBRLInteiro(somar(deHoje.filter((s) => s.pago)))}
            detalhe={`${deHoje.length} serviço${deHoje.length === 1 ? '' : 's'} hoje`}
          />
          <Indicador
            rotulo="No mês"
            tom="azul"
            icone={<TrendingUp />}
            carregando={servicosMes.isPending}
            valor={fmtBRLInteiro(somar(doMes.filter((s) => s.pago)))}
            detalhe="recebido"
            to="/financeiro"
          />
          <Indicador
            rotulo="A receber"
            tom="ambar"
            icone={<Clock />}
            carregando={aReceber.isPending}
            valor={fmtBRLInteiro(somar(aReceber.data ?? []))}
            detalhe={listaDevedores.length ? `de ${listaDevedores.length} cliente${listaDevedores.length === 1 ? '' : 's'}` : 'ninguém devendo 🎉'}
            to="/historico?filtro=areceber"
          />
          <Indicador
            rotulo="Visitas hoje"
            icone={<CalendarClock />}
            carregando={proximos.isPending}
            valor={agendaHoje.length}
            detalhe={agendaHoje[0] ? `próxima às ${horaCurta(agendaHoje[0].hora)}` : 'agenda livre'}
            to="/agenda"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-5 lg:gap-6">
          <div className="space-y-5 lg:col-span-3 lg:space-y-6">
            {proximo && <ProximoAtendimento agendamento={proximo} quando={quandoRelativo(proximo.data, hoje)} />}

            <Cartao>
              <CabecalhoCartao titulo="Agenda de hoje" acao={<LinkCartao to="/agenda">Ver agenda</LinkCartao>} />
              {proximos.isPending ? (
                <Esqueleto linhas={2} />
              ) : proximos.isError ? (
                <ErroCarregar erro={proximos.error} tentar={() => proximos.refetch()} />
              ) : agendaHoje.length === 0 ? (
                <Vazio
                  icone={<CalendarDays />}
                  titulo="Nenhuma visita hoje"
                  acao={
                    <Botao variante="suave" tamanho="sm" onClick={() => acoes.novoAgendamento({ data: hoje })}>
                      Agendar para hoje
                    </Botao>
                  }
                />
              ) : (
                <div className="divide-y divide-ink-100 pb-2">
                  {agendaHoje.map((a) => (
                    <ItemAgendamento
                      key={a.id}
                      agendamento={a}
                      onClick={() => acoes.editarAgendamento(a)}
                      direita={
                        <Botao tamanho="sm" onClick={() => acoes.iniciarAgendamento(a)}>
                          <Play className="size-3.5" fill="currentColor" /> Iniciar
                        </Botao>
                      }
                    />
                  ))}
                </div>
              )}
            </Cartao>

            <Cartao>
              <CabecalhoCartao titulo="Serviços de hoje" acao={<LinkCartao to="/historico">Histórico</LinkCartao>} />
              {servicosMes.isPending ? (
                <Esqueleto linhas={2} />
              ) : servicosMes.isError ? (
                <ErroCarregar erro={servicosMes.error} tentar={() => servicosMes.refetch()} />
              ) : deHoje.length === 0 ? (
                <Vazio
                  icone={<Receipt />}
                  titulo="Nada registrado hoje"
                  texto="Terminou um serviço? Registre em segundos."
                  acao={
                    <Botao variante="suave" tamanho="sm" onClick={() => acoes.novoServico()}>
                      Registrar serviço
                    </Botao>
                  }
                />
              ) : (
                <div className="divide-y divide-ink-100 pb-2">
                  {deHoje.map((s) => (
                    <ItemServico key={s.id} servico={s} detalhe={s.observacao} onClick={() => acoes.editarServico(s)} />
                  ))}
                </div>
              )}
            </Cartao>
          </div>

          <div className="lg:col-span-2">
            <Cartao className="lg:sticky lg:top-6">
              <CabecalhoCartao
                titulo="Quem está devendo"
                acao={listaDevedores.length > 0 && <LinkCartao to="/historico?filtro=areceber">Ver tudo</LinkCartao>}
              />
              {aReceber.isPending ? (
                <Esqueleto linhas={3} />
              ) : listaDevedores.length === 0 ? (
                <Vazio icone={<Wallet />} titulo="Tudo recebido" texto="Quando um serviço ficar a receber, ele aparece aqui para você cobrar." />
              ) : (
                <ul className="divide-y divide-ink-100 pb-2">
                  {listaDevedores.slice(0, 6).map((d) => (
                    <li key={d.clienteId} className="flex items-center gap-3 px-5 py-3">
                      <Link to={`/clientes/${d.clienteId}`} className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar nome={d.nome} />
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-semibold text-ink-900 hover:underline">{d.nome}</span>
                          <span className="tabular block text-sm text-amber-700">
                            {fmtBRL(d.total)} · {d.qtd} serv.
                          </span>
                        </span>
                      </Link>
                      {d.telefone ? (
                        <a
                          href={linkWhatsApp(d.telefone, mensagemCobranca(d.nome, d.total, d.qtd))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#25d366]/12 px-3 text-sm font-bold text-[#128c4a] hover:bg-[#25d366]/20"
                        >
                          <MessageCircle className="size-4" /> Cobrar
                        </a>
                      ) : (
                        <Link to={`/clientes/${d.clienteId}`} className="text-xs font-semibold text-ink-400 hover:text-ink-600">
                          sem telefone
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Cartao>
          </div>
        </div>
      </div>
    </>
  )
}

function ProximoAtendimento({ agendamento: a, quando }: { agendamento: Agendamento; quando: string }) {
  const acoes = useAcoes()
  const c = a.cliente
  return (
    <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-700 via-brand-600 to-emerald-500 p-5 text-white shadow-marca sm:p-6">
      <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/10 blur-2xl" />
      <p className="text-xs font-bold tracking-wider text-brand-100 uppercase">Próximo atendimento · {quando}</p>
      <div className="mt-2 flex items-end gap-4">
        <span className="tabular text-4xl font-extrabold tracking-tight">{horaCurta(a.hora)}</span>
        <div className="min-w-0 pb-1">
          <p className="truncate text-lg font-bold">{c?.nome}</p>
          <p className="truncate text-sm text-brand-50">{a.descricao}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => acoes.iniciarAgendamento(a)}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-brand-800 hover:bg-brand-50"
        >
          <Play className="size-4" fill="currentColor" /> Iniciar
        </button>
        {c?.telefone && (
          <a
            href={linkWhatsApp(c.telefone)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-bold hover:bg-white/25"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
        )}
        {c?.endereco && (
          <a
            href={linkMaps(c.endereco)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-bold hover:bg-white/25"
          >
            <MapPin className="size-4" /> Rota
          </a>
        )}
        <button type="button" onClick={() => acoes.editarAgendamento(a)} className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold text-brand-50 hover:bg-white/10">
          Detalhes
        </button>
      </div>
    </section>
  )
}

function PrimeirosPassos() {
  const acoes = useAcoes()
  return (
    <Cartao className="overflow-hidden">
      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div>
          <p className="text-xs font-bold tracking-wider text-brand-700 uppercase">Primeiro passo</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-ink-900">Traga seus clientes para o Orça!</h2>
          <p className="mt-1 text-[15px] text-ink-500">Com os clientes cadastrados, agendar e registrar serviço vira questão de 2 toques.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Botao onClick={acoes.importarContatos}>
            <Upload className="size-4" /> Importar contatos
          </Botao>
          <Botao variante="secundario" onClick={() => acoes.novoCliente()}>
            <UserPlus className="size-4" /> Adicionar um
          </Botao>
        </div>
      </div>
    </Cartao>
  )
}
