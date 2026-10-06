import { CalendarPlus, MapPin, MessageCircle, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { excluirCliente } from '../api/clientes'
import { ClienteFormSheet } from '../components/ClienteFormSheet'
import { EditarServicoSheet } from '../components/EditarServicoSheet'
import { mensagemErro, useFeedback } from '../components/Feedback'
import { Avatar, BadgePago, BarraTopo, Carregando, ErroCarregar, Esqueleto, Vazio } from '../components/ui'
import { useCliente, useInvalidar, useServicosDoCliente } from '../hooks/dados'
import { dataCurta } from '../lib/datas'
import { fmtBRL, somar } from '../lib/moeda'
import { formatarTelefone, linkMaps, linkWhatsApp } from '../lib/telefone'
import type { Servico } from '../types'

export function ClientePerfil() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { avisar, confirmar } = useFeedback()
  const invalidar = useInvalidar()
  const cliente = useCliente(id)
  const servicos = useServicosDoCliente(id)
  const [editandoCliente, setEditandoCliente] = useState(false)
  const [editandoServico, setEditandoServico] = useState<Servico | null>(null)

  if (cliente.isPending) {
    return (
      <div>
        <BarraTopo titulo="Cliente" />
        <Carregando />
      </div>
    )
  }
  if (cliente.isError || !cliente.data) {
    return (
      <div>
        <BarraTopo titulo="Cliente" />
        {cliente.isError ? <ErroCarregar erro={cliente.error} /> : <Vazio titulo="Cliente não encontrado" />}
      </div>
    )
  }

  const c = cliente.data
  const lista = servicos.data ?? []
  const recebido = somar(lista.filter((s) => s.pago))
  const pendente = somar(lista.filter((s) => !s.pago))

  const excluir = async () => {
    const ok = await confirmar({
      titulo: `Excluir ${c.nome}?`,
      mensagem:
        lista.length > 0
          ? `Os ${lista.length} serviço(s) e os agendamentos deste cliente também serão apagados. Não tem volta.`
          : 'Essa ação não pode ser desfeita.',
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

  return (
    <div className="pb-24">
      <BarraTopo
        titulo="Cliente"
        direita={
          <button type="button" aria-label="Excluir cliente" onClick={excluir} className="flex size-11 items-center justify-center rounded-full text-red-500 active:bg-red-50">
            <Trash2 className="size-5" />
          </button>
        }
      />

      <section className="flex flex-col items-center bg-white px-5 pt-6 pb-5 text-center">
        <Avatar nome={c.nome} tamanho="lg" />
        <h2 className="mt-3 text-2xl font-extrabold text-gray-900">{c.nome}</h2>
        {c.telefone && (
          <p className="mt-1.5 flex items-center gap-1.5 text-gray-600">
            <Phone className="size-4" /> {formatarTelefone(c.telefone)}
          </p>
        )}
        {c.endereco && (
          <p className="mt-1 flex items-start gap-1.5 text-gray-600">
            <MapPin className="mt-0.5 size-4 shrink-0" /> <span className="whitespace-pre-line">{c.endereco}</span>
          </p>
        )}
        <button
          type="button"
          onClick={() => setEditandoCliente(true)}
          className="mt-4 flex min-h-10 items-center gap-1.5 rounded-full border border-gray-200 px-4 text-sm font-semibold text-gray-700 active:bg-gray-50"
        >
          <Pencil className="size-4" /> Editar dados
        </button>

        <div className="mt-5 grid w-full grid-cols-2 gap-2">
          <a
            href={c.telefone ? linkWhatsApp(c.telefone) : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!c.telefone}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl font-bold ${c.telefone ? 'bg-[#25d366] text-white active:opacity-90' : 'pointer-events-none bg-gray-100 text-gray-400'}`}
          >
            <MessageCircle className="size-5" /> WhatsApp
          </a>
          <a
            href={c.endereco ? linkMaps(c.endereco) : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!c.endereco}
            className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl font-bold ${c.endereco ? 'bg-blue-600 text-white active:opacity-90' : 'pointer-events-none bg-gray-100 text-gray-400'}`}
          >
            <MapPin className="size-5" /> Maps
          </a>
          <button type="button" onClick={() => navigate(`/servicos/novo?clienteId=${c.id}`)} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-600 font-bold text-white active:bg-green-700">
            <Plus className="size-5" /> Serviço
          </button>
          <button type="button" onClick={() => navigate(`/agendamentos/novo?clienteId=${c.id}`)} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-50 font-bold text-green-700 active:bg-green-100">
            <CalendarPlus className="size-5" /> Agendar
          </button>
        </div>
      </section>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-[11px] font-bold tracking-wider text-green-700 uppercase">Recebido</p>
            <p className="mt-1 text-xl font-extrabold tracking-tight text-green-800">{fmtBRL(recebido)}</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-[11px] font-bold tracking-wider text-red-600 uppercase">Pendente</p>
            <p className="mt-1 text-xl font-extrabold tracking-tight text-red-700">{fmtBRL(pendente)}</p>
          </div>
        </div>

        <section>
          <h3 className="px-1 pb-2 text-xs font-bold tracking-wider text-gray-500 uppercase">
            Histórico · {lista.length} serviço{lista.length === 1 ? '' : 's'}
          </h3>
          {servicos.isPending ? (
            <div className="rounded-2xl bg-white">
              <Esqueleto />
            </div>
          ) : servicos.isError ? (
            <ErroCarregar erro={servicos.error} tentar={() => servicos.refetch()} />
          ) : lista.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white">
              <Vazio titulo="Nenhum serviço registrado" />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {lista.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => setEditandoServico({ ...s, cliente: c })} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-gray-50">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-500">{dataCurta(s.data)}</span>
                      <span className="block truncate text-[15px] text-gray-900">{s.observacao || '—'}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`font-bold ${s.pago ? 'text-green-800' : 'text-red-600'}`}>{s.valor == null ? '—' : fmtBRL(s.valor)}</span>
                      <BadgePago pago={s.pago} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ClienteFormSheet aberto={editandoCliente} onFechar={() => setEditandoCliente(false)} cliente={c} />
      <EditarServicoSheet servico={editandoServico} onFechar={() => setEditandoServico(null)} />
    </div>
  )
}
