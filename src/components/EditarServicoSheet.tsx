import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { obterOuCriarCliente } from '../api/clientes'
import { atualizarServico, excluirServico } from '../api/servicos'
import { useClientes, useInvalidar } from '../hooks/dados'
import { vazioParaNull } from '../lib/texto'
import type { Servico } from '../types'
import { BottomSheet } from './BottomSheet'
import { ClienteAutocomplete, type EscolhaCliente } from './ClienteAutocomplete'
import { CampoValor } from './CampoValor'
import { mensagemErro, useFeedback } from './Feedback'
import { StatusPagamento } from './StatusPagamento'
import { Botao, Campo, inputCls, labelCls } from './ui'

export function EditarServicoSheet({ servico, onFechar }: { servico: Servico | null; onFechar: () => void }) {
  return (
    <BottomSheet aberto={Boolean(servico)} onFechar={onFechar} titulo="Editar serviço">
      {servico && <Formulario key={servico.id} servico={servico} onFechar={onFechar} />}
    </BottomSheet>
  )
}

function Formulario({ servico, onFechar }: { servico: Servico; onFechar: () => void }) {
  const { avisar, confirmar } = useFeedback()
  const invalidar = useInvalidar()
  const { data: clientes = [] } = useClientes()
  const nomeAtual = servico.cliente?.nome ?? clientes.find((c) => c.id === servico.cliente_id)?.nome ?? ''
  const [cliente, setCliente] = useState<EscolhaCliente>({ id: servico.cliente_id, nome: nomeAtual })
  const [data, setData] = useState(servico.data)
  const [centavos, setCentavos] = useState<number | null>(servico.valor == null ? null : Math.round(servico.valor * 100))
  const [pago, setPago] = useState(servico.pago)
  const [observacao, setObservacao] = useState(servico.observacao ?? '')
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    setSalvando(true)
    try {
      const clienteId = await obterOuCriarCliente(cliente, clientes)
      await atualizarServico(servico.id, {
        cliente_id: clienteId,
        data,
        valor: centavos == null ? null : centavos / 100,
        pago,
        observacao: vazioParaNull(observacao),
      })
      await invalidar()
      avisar('Serviço atualizado')
      onFechar()
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async () => {
    const ok = await confirmar({
      titulo: 'Excluir serviço?',
      mensagem: 'Tem certeza? Essa ação não pode ser desfeita.',
      confirmar: 'Excluir',
      perigo: true,
    })
    if (!ok) return
    try {
      await excluirServico(servico.id)
      await invalidar()
      avisar('Serviço excluído')
      onFechar()
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <span className={labelCls}>Cliente</span>
        <ClienteAutocomplete valor={cliente} onChange={setCliente} />
      </div>
      <Campo label="Data">
        <input type="date" className={inputCls} value={data} onChange={(e) => e.target.value && setData(e.target.value)} />
      </Campo>
      <Campo label="Valor">
        <CampoValor centavos={centavos} onChange={setCentavos} />
      </Campo>
      <div>
        <span className={labelCls}>Status</span>
        <StatusPagamento pago={pago} onChange={setPago} />
      </div>
      <Campo label="Observação">
        <textarea className={`${inputCls} min-h-24 resize-none`} rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="O que foi feito" />
      </Campo>
      <Botao onClick={salvar} carregando={salvando} disabled={!cliente.nome.trim()}>
        Salvar alterações
      </Botao>
      <Botao variante="perigoSuave" onClick={excluir}>
        <Trash2 className="size-5" /> Excluir serviço
      </Botao>
    </div>
  )
}
