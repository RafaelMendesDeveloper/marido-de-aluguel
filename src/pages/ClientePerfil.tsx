import { CalendarPlus, CheckCheck, MapPin, MessageCircle, Pencil, Phone, QrCode, Receipt, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { excluirCliente } from '../api/clientes'
import { marcarPagosDoCliente } from '../api/servicos'
import { useAcoes } from '../components/Acoes'
import { mensagemErro, useFeedback } from '../components/Feedback'
import { Avatar, BadgePago, Botao, CabecalhoCartao, Cartao, Carregando, ErroCarregar, Esqueleto, Vazio, Voltar, cx } from '../components/ui'
import { useCliente, useInvalidar, useServicosDoCliente } from '../hooks/dados'
import { dataCurta } from '../lib/datas'
import { fmtBRL, somar } from '../lib/moeda'
import { formatarTelefone, linkMaps, linkWhatsApp, soDigitos } from '../lib/telefone'

const acaoCls =
  'flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-ink-200 bg-white px-2 py-2 text-xs font-bold text-ink-700 transition hover:bg-ink-50 sm:flex-row sm:gap-2 sm:text-sm'

export function ClientePerfil() {
  const { id } = useParams()
  const navigate = useNavigate()
  const acoes = useAcoes()
  const { avisar, confirmar } = useFeedback()
  const invalidar = useInvalidar()
  const cliente = useCliente(id)
  const servicos = useServicosDoCliente(id)

  if (cliente.isPending) return <Carregando />
  if (cliente.isError || !cliente.data) {
    return (
      <div className="pt-5">
        <div className="lg:hidden">
          <Voltar para="/clientes" rotulo="Clientes" />
        </div>
        {cliente.isError ? <ErroCarregar erro={cliente.error} /> : <Vazio titulo="Cliente não encontrado" />}
      </div>
    )
  }

  const c = cliente.data
  const lista = servicos.data ?? []
  const recebido = somar(lista.filter((s) => s.pago))
  const pendentes = lista.filter((s) => !s.pago)
  const aReceber = somar(pendentes)

  const excluir = async () => {
    const ok = await confirmar({
      titulo: `Excluir ${c.nome}?`,
      mensagem: lista.length > 0 ? `Os ${lista.length} serviço(s) e os agendamentos deste cliente também serão apagados.` : 'Essa ação não pode ser desfeita.',
      confirmar: 'Excluir',
      perigo: true,
      digitar: lista.length > 0 ? 'EXCLUIR' : undefined,
    })
    if (!ok) return
    try {
      await excluirCliente(c.id)
      await invalidar()
      avisar('Cliente excluído')
      navigate('/clientes', { replace: true })
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
    }
  }

  const quitar = async () => {
    const ok = await confirmar({
      titulo: 'Marcar tudo como pago?',
      mensagem: `${pendentes.length} serviço(s) somando ${fmtBRL(aReceber)} passam para "Pago".`,
      confirmar: 'Marcar como pago',
    })
    if (!ok) return
    try {
      await marcarPagosDoCliente(c.id)
      await invalidar()
      avisar('Pagamento registrado')
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
    }
  }

  return (
    <div className="space-y-5 pt-4 lg:pt-0">
      <div className="lg:hidden">
        <Voltar para="/clientes" rotulo="Clientes" />
      </div>

      <Cartao className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <Avatar nome={c.nome} tamanho="xl" className="hidden sm:inline-flex" />
          <Avatar nome={c.nome} tamanho="lg" className="sm:hidden" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">{c.nome}</h1>
            <div className="mt-1.5 space-y-1 text-[15px] text-ink-600">
              {c.telefone && (
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-ink-400" /> {formatarTelefone(c.telefone)}
                </p>
              )}
              {c.endereco && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-1 size-4 shrink-0 text-ink-400" /> <span className="whitespace-pre-line">{c.endereco}</span>
                </p>
              )}
              {!c.telefone && !c.endereco && (
                <button type="button" onClick={() => acoes.editarCliente(c)} className="text-sm font-semibold text-brand-700 hover:underline">
                  + Adicionar WhatsApp e endereço
                </button>
              )}
            </div>
          </div>
          <button type="button" aria-label="Excluir cliente" onClick={excluir} className="flex size-10 items-center justify-center rounded-full text-ink-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="size-5" />
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          <a
            href={c.telefone ? linkWhatsApp(c.telefone) : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!c.telefone}
            className={cx(acaoCls, c.telefone ? 'text-[#128c4a]' : 'pointer-events-none opacity-40')}
          >
            <MessageCircle className="size-5" /> WhatsApp
          </a>
          <a href={c.telefone ? `tel:${soDigitos(c.telefone)}` : undefined} aria-disabled={!c.telefone} className={cx(acaoCls, !c.telefone && 'pointer-events-none opacity-40')}>
            <Phone className="size-5" /> Ligar
          </a>
          <a
            href={c.endereco ? linkMaps(c.endereco) : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!c.endereco}
            className={cx(acaoCls, !c.endereco && 'pointer-events-none opacity-40')}
          >
            <MapPin className="size-5" /> Rota
          </a>
          <button type="button" onClick={() => acoes.editarCliente(c)} className={acaoCls}>
            <Pencil className="size-5" /> Editar
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Botao onClick={() => acoes.novoServico({ clienteId: c.id })}>
            <Receipt className="size-4" /> Registrar serviço
          </Botao>
          <Botao variante="suave" onClick={() => acoes.novoAgendamento({ clienteId: c.id })}>
            <CalendarPlus className="size-4" /> Agendar
          </Botao>
        </div>
      </Cartao>

      <div className="grid grid-cols-3 gap-3">
        <Resumo rotulo="Já pagou" valor={fmtBRL(recebido)} carregando={servicos.isPending} />
        <Resumo rotulo="A receber" valor={fmtBRL(aReceber)} carregando={servicos.isPending} destaque={aReceber > 0} />
        <Resumo rotulo="Serviços" valor={String(lista.length)} carregando={servicos.isPending} />
      </div>

      {aReceber > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-amber-900">
            <strong className="tabular">{fmtBRL(aReceber)}</strong> em aberto ({pendentes.length} serviço{pendentes.length === 1 ? '' : 's'}).
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => acoes.cobrar({ clienteId: c.id })}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25d366] px-4 text-sm font-bold whitespace-nowrap text-white hover:brightness-95"
            >
              <QrCode className="size-4" /> Cobrar com Pix
            </button>
            <Botao variante="secundario" onClick={quitar} className="flex-1 whitespace-nowrap">
              <CheckCheck className="size-4" /> Recebi tudo
            </Botao>
          </div>
        </div>
      )}

      <Cartao>
        <CabecalhoCartao titulo={`Histórico · ${lista.length}`} />
        {servicos.isPending ? (
          <Esqueleto />
        ) : servicos.isError ? (
          <ErroCarregar erro={servicos.error} tentar={() => servicos.refetch()} />
        ) : lista.length === 0 ? (
          <Vazio icone={<Receipt />} titulo="Nenhum serviço ainda" texto="Os serviços registrados para este cliente aparecem aqui." />
        ) : (
          <ul className="divide-y divide-ink-100 pb-2">
            {lista.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => acoes.editarServico({ ...s, cliente: c })}
                  className="flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-ink-50"
                >
                  <span className="tabular w-20 shrink-0 text-sm font-semibold text-ink-500">{dataCurta(s.data)}</span>
                  <span className="min-w-0 flex-1 truncate text-[15px] text-ink-800">{s.observacao || '—'}</span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className={cx('tabular font-bold', s.pago ? 'text-ink-900' : 'text-amber-700')}>{s.valor == null ? '—' : fmtBRL(s.valor)}</span>
                    <BadgePago pago={s.pago} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  )
}

function Resumo({ rotulo, valor, carregando, destaque }: { rotulo: string; valor: string; carregando?: boolean; destaque?: boolean }) {
  return (
    <div className={cx('rounded-2xl border bg-white p-3 shadow-card sm:p-4', destaque ? 'border-amber-200' : 'border-ink-200/80')}>
      <p className="text-xs font-semibold text-ink-500">{rotulo}</p>
      <p className={cx('tabular mt-1 truncate text-base font-extrabold tracking-tight sm:text-xl', destaque ? 'text-amber-700' : 'text-ink-900')}>
        {carregando ? <span className="inline-block h-5 w-16 animate-pulse rounded bg-ink-100" /> : valor}
      </p>
    </div>
  )
}
