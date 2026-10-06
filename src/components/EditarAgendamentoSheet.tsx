import { Play, Trash2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { atualizarAgendamento, excluirAgendamento } from '../api/agendamentos'
import { linkIniciar, useCancelarAgendamento } from '../hooks/agendamento'
import { obterOuCriarCliente } from '../api/clientes'
import { useClientes, useInvalidar } from '../hooks/dados'
import { horaCurta } from '../lib/datas'
import type { Agendamento } from '../types'
import { BottomSheet } from './BottomSheet'
import { ClienteAutocomplete, type EscolhaCliente } from './ClienteAutocomplete'
import { mensagemErro, useFeedback } from './Feedback'
import { Botao, Campo, inputCls, labelCls } from './ui'

export function EditarAgendamentoSheet({ agendamento, onFechar }: { agendamento: Agendamento | null; onFechar: () => void }) {
  return (
    <BottomSheet aberto={Boolean(agendamento)} onFechar={onFechar} titulo="Agendamento">
      {agendamento && <Formulario key={agendamento.id} agendamento={agendamento} onFechar={onFechar} />}
    </BottomSheet>
  )
}

function Formulario({ agendamento, onFechar }: { agendamento: Agendamento; onFechar: () => void }) {
  const navigate = useNavigate()
  const { avisar, confirmar } = useFeedback()
  const invalidar = useInvalidar()
  const cancelarAgendamento = useCancelarAgendamento()
  const { data: clientes = [] } = useClientes()
  const [cliente, setCliente] = useState<EscolhaCliente>({ id: agendamento.cliente_id, nome: agendamento.cliente?.nome ?? '' })
  const [data, setData] = useState(agendamento.data)
  const [hora, setHora] = useState(horaCurta(agendamento.hora))
  const [descricao, setDescricao] = useState(agendamento.descricao)
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    setSalvando(true)
    try {
      const clienteId = await obterOuCriarCliente(cliente, clientes)
      await atualizarAgendamento(agendamento.id, { cliente_id: clienteId, data, hora, descricao: descricao.trim() })
      await invalidar()
      avisar('Agendamento atualizado')
      onFechar()
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async () => {
    const ok = await confirmar({
      titulo: 'Excluir agendamento?',
      mensagem: 'Ele some da agenda de vez. Para só desmarcar, use "Cancelar".',
      confirmar: 'Excluir',
      perigo: true,
    })
    if (!ok) return
    try {
      await excluirAgendamento(agendamento.id)
      await invalidar()
      avisar('Agendamento excluído')
      onFechar()
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
    }
  }

  return (
    <div className="space-y-4">
      <Botao onClick={() => navigate(linkIniciar(agendamento))}>
        <Play className="size-5" fill="currentColor" /> Iniciar serviço
      </Botao>
      <div>
        <span className={labelCls}>Cliente</span>
        <ClienteAutocomplete valor={cliente} onChange={setCliente} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Data">
          <input type="date" className={inputCls} value={data} onChange={(e) => e.target.value && setData(e.target.value)} />
        </Campo>
        <Campo label="Hora">
          <input type="time" step={300} className={inputCls} value={hora} onChange={(e) => e.target.value && setHora(e.target.value)} />
        </Campo>
      </div>
      <Campo label="Serviço">
        <textarea className={`${inputCls} min-h-20 resize-none`} rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </Campo>
      <Botao variante="secundario" onClick={salvar} carregando={salvando} disabled={!cliente.nome.trim() || !descricao.trim()}>
        Salvar alterações
      </Botao>
      <div className="grid grid-cols-2 gap-3">
        <Botao variante="perigoSuave" onClick={async () => (await cancelarAgendamento(agendamento)) && onFechar()}>
          <XCircle className="size-5" /> Cancelar
        </Botao>
        <Botao variante="perigoSuave" onClick={excluir}>
          <Trash2 className="size-5" /> Excluir
        </Botao>
      </div>
    </div>
  )
}
