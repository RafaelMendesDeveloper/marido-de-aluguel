import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { obterOuCriarCliente } from '../api/clientes'
import { criarServico } from '../api/servicos'
import { ClienteAutocomplete, type EscolhaCliente } from '../components/ClienteAutocomplete'
import { CampoValor } from '../components/CampoValor'
import { mensagemErro, useFeedback } from '../components/Feedback'
import { StatusPagamento } from '../components/StatusPagamento'
import { BarraTopo, Botao, Campo, inputCls, labelCls } from '../components/ui'
import { useAgendamento, useClientes, useInvalidar } from '../hooks/dados'
import { dataPorExtensoComAno, hojeISO } from '../lib/datas'
import { vazioParaNull } from '../lib/texto'

export function NovoServico() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const clienteId = params.get('clienteId')
  const agendamentoId = params.get('agendamentoId')
  const { avisar } = useFeedback()
  const invalidar = useInvalidar()
  const { data: clientes = [] } = useClientes()
  const agendamento = useAgendamento(agendamentoId)

  const [escolha, setCliente] = useState<EscolhaCliente>({ id: clienteId, nome: '' })
  const [data, setData] = useState(hojeISO())
  const [centavos, setCentavos] = useState<number | null>(null)
  const [pago, setPago] = useState(false)
  const [observacaoDigitada, setObservacao] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Cliente e observação pré-preenchidos quando vêm do agendamento/perfil.
  const nomeCliente = clientes.find((c) => c.id === clienteId)?.nome ?? agendamento.data?.cliente?.nome ?? ''
  const cliente = clienteId && escolha.id === clienteId && !escolha.nome ? { id: clienteId, nome: nomeCliente } : escolha
  const observacao = observacaoDigitada ?? agendamento.data?.descricao ?? ''

  const travado = Boolean(clienteId)
  const valido = cliente.nome.trim() && (centavos ?? 0) > 0

  const salvar = async () => {
    if (!valido) return
    setSalvando(true)
    try {
      const id = await obterOuCriarCliente(cliente, clientes)
      await criarServico({
        cliente_id: id,
        data,
        valor: centavos! / 100,
        pago,
        observacao: vazioParaNull(observacao),
        agendamento_id: agendamentoId,
      })
      await invalidar()
      avisar('Serviço registrado')
      navigate(-1)
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-dvh bg-white">
      <BarraTopo titulo="Novo Serviço" tipo="fechar" />
      <form
        className="space-y-5 p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
        onSubmit={(e) => {
          e.preventDefault()
          void salvar()
        }}
      >
        <p className="text-sm font-semibold text-gray-500">{dataPorExtensoComAno(data)}</p>
        <div>
          <span className={labelCls}>Cliente</span>
          <ClienteAutocomplete valor={cliente} onChange={setCliente} travado={travado} autoFocus={!travado} />
        </div>
        <Campo label="Valor">
          <CampoValor centavos={centavos} onChange={setCentavos} autoFocus={travado} grande />
        </Campo>
        <div>
          <span className={labelCls}>Status</span>
          <StatusPagamento pago={pago} onChange={setPago} />
        </div>
        <Campo label="Data do serviço">
          <input type="date" className={inputCls} value={data} max={hojeISO()} onChange={(e) => e.target.value && setData(e.target.value)} />
        </Campo>
        <Campo label="Observação (opcional)">
          <textarea className={`${inputCls} min-h-24 resize-none`} rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="O que foi feito" />
        </Campo>
        <Botao type="submit" disabled={!valido} carregando={salvando}>
          Salvar serviço
        </Botao>
      </form>
    </div>
  )
}
