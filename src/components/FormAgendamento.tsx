import { Play, Trash2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { atualizarAgendamento, criarAgendamento, excluirAgendamento } from '../api/agendamentos'
import { obterOuCriarCliente } from '../api/clientes'
import { useClientes, useInvalidar } from '../hooks/dados'
import { useCancelarAgendamento } from '../hooks/agendamento'
import { amanhaISO, dataPorExtensoComAno, hojeISO, horaCurta } from '../lib/datas'
import type { Agendamento } from '../types'
import { DatasRapidas, HorasRapidas, TextosRapidos } from './Atalhos'
import { ClienteAutocomplete, type EscolhaCliente } from './ClienteAutocomplete'
import { mensagemErro, useFeedback } from './Feedback'
import { Modal } from './Modal'
import { Botao, inputCls, labelCls } from './ui'

export type AberturaAgendamento =
  | { modo: 'novo'; clienteId?: string; data?: string }
  | { modo: 'editar'; agendamento: Agendamento }

type Props = {
  abertura: AberturaAgendamento | null
  onFechar: () => void
  onIniciar: (a: Agendamento) => void
}

export function ModalAgendamento({ abertura, onFechar, onIniciar }: Props) {
  const chave = abertura ? (abertura.modo === 'editar' ? abertura.agendamento.id : `novo-${abertura.clienteId ?? ''}-${abertura.data ?? ''}`) : ''
  return abertura ? <Formulario key={chave} abertura={abertura} onFechar={onFechar} onIniciar={onIniciar} /> : null
}

function Formulario({ abertura, onFechar, onIniciar }: Props & { abertura: AberturaAgendamento }) {
  const { avisar, confirmar } = useFeedback()
  const invalidar = useInvalidar()
  const cancelarAgendamento = useCancelarAgendamento()
  const { data: clientes = [] } = useClientes()
  const editando = abertura.modo === 'editar' ? abertura.agendamento : null
  const clienteInicial = editando?.cliente_id ?? (abertura.modo === 'novo' ? abertura.clienteId : undefined)

  const [escolha, setCliente] = useState<EscolhaCliente>({ id: clienteInicial ?? null, nome: editando?.cliente?.nome ?? '' })
  const cliente = escolha.id && !escolha.nome ? { id: escolha.id, nome: clientes.find((c) => c.id === escolha.id)?.nome ?? '' } : escolha
  const [data, setData] = useState(() => {
    if (editando) return editando.data
    const d = abertura.modo === 'novo' ? abertura.data : undefined
    return d && d >= hojeISO() ? d : amanhaISO()
  })
  const [hora, setHora] = useState(editando ? horaCurta(editando.hora) : '09:00')
  const [descricao, setDescricao] = useState(editando?.descricao ?? '')
  const [salvando, setSalvando] = useState(false)

  const valido = Boolean(cliente.nome.trim() && descricao.trim())

  const salvar = async () => {
    if (!valido) return
    setSalvando(true)
    try {
      const clienteId = await obterOuCriarCliente(cliente, clientes)
      const dados = { cliente_id: clienteId, data, hora, descricao: descricao.trim() }
      if (editando) await atualizarAgendamento(editando.id, dados)
      else await criarAgendamento(dados)
      await invalidar()
      avisar(editando ? 'Agendamento atualizado' : 'Visita agendada')
      onFechar()
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
      setSalvando(false)
    }
  }

  const excluir = async () => {
    if (!editando) return
    const ok = await confirmar({
      titulo: 'Excluir agendamento?',
      mensagem: 'Ele some da agenda de vez. Para só desmarcar, use "Cancelar visita".',
      confirmar: 'Excluir',
      perigo: true,
    })
    if (!ok) return
    try {
      await excluirAgendamento(editando.id)
      await invalidar()
      avisar('Agendamento excluído')
      onFechar()
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
    }
  }

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={editando ? 'Agendamento' : 'Agendar visita'}
      subtitulo={`${dataPorExtensoComAno(data)} · ${hora}`}
      rodape={
        editando ? (
          <div className="flex gap-3">
            <Botao variante="secundario" tamanho="lg" largo onClick={salvar} disabled={!valido} carregando={salvando}>
              Salvar
            </Botao>
            <Botao tamanho="lg" largo onClick={() => onIniciar(editando)}>
              <Play className="size-4" fill="currentColor" /> Iniciar
            </Botao>
          </div>
        ) : (
          <Botao tamanho="lg" largo onClick={salvar} disabled={!valido} carregando={salvando}>
            Agendar
          </Botao>
        )
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          void salvar()
        }}
      >
        <div>
          <span className={labelCls}>Cliente</span>
          <ClienteAutocomplete valor={cliente} onChange={setCliente} autoFocus={!editando && !clienteInicial} />
        </div>

        <div>
          <span className={labelCls}>Dia</span>
          <DatasRapidas valor={data} onEscolher={setData} sentido="futuro" />
          <input type="date" aria-label="Dia" className={inputCls} value={data} min={editando ? undefined : hojeISO()} onChange={(e) => e.target.value && setData(e.target.value)} />
        </div>

        <div>
          <span className={labelCls}>Horário</span>
          <HorasRapidas valor={hora} onEscolher={setHora} />
          <input type="time" aria-label="Horário" step={300} className={inputCls} value={hora} onChange={(e) => e.target.value && setHora(e.target.value)} />
        </div>

        <div>
          <span className={labelCls}>Serviço</span>
          <TextosRapidos texto={descricao} onChange={setDescricao} />
          <textarea
            className={`${inputCls} min-h-20 resize-none`}
            rows={2}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex.: trocar registro, instalar chuveiro…"
          />
        </div>

        {editando && (
          <div className="grid grid-cols-2 gap-3 border-t border-ink-100 pt-5">
            <Botao variante="perigoSuave" onClick={async () => (await cancelarAgendamento(editando)) && onFechar()}>
              <XCircle className="size-4" /> Cancelar visita
            </Botao>
            <Botao variante="fantasma" onClick={excluir} className="text-red-600">
              <Trash2 className="size-4" /> Excluir
            </Botao>
          </div>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
