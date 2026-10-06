import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { criarAgendamento } from '../api/agendamentos'
import { obterOuCriarCliente } from '../api/clientes'
import { ClienteAutocomplete, type EscolhaCliente } from '../components/ClienteAutocomplete'
import { mensagemErro, useFeedback } from '../components/Feedback'
import { BarraTopo, Botao, Campo, inputCls, labelCls } from '../components/ui'
import { useClientes, useInvalidar } from '../hooks/dados'
import { amanhaISO, dataPorExtensoComAno, hojeISO } from '../lib/datas'

export function NovoAgendamento() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const clienteId = params.get('clienteId')
  const { avisar } = useFeedback()
  const invalidar = useInvalidar()
  const { data: clientes = [] } = useClientes()

  const [escolha, setCliente] = useState<EscolhaCliente>({ id: clienteId, nome: '' })
  const [data, setData] = useState(() => {
    const d = params.get('data')
    return d && d >= hojeISO() ? d : amanhaISO()
  })
  const [hora, setHora] = useState('09:00')
  const [descricao, setDescricao] = useState('')
  const [salvando, setSalvando] = useState(false)

  const nomeCliente = clientes.find((c) => c.id === clienteId)?.nome ?? ''
  const cliente = clienteId && escolha.id === clienteId && !escolha.nome ? { id: clienteId, nome: nomeCliente } : escolha

  const valido = cliente.nome.trim() && descricao.trim()

  const salvar = async () => {
    if (!valido) return
    setSalvando(true)
    try {
      const id = await obterOuCriarCliente(cliente, clientes)
      await criarAgendamento({ cliente_id: id, data, hora, descricao: descricao.trim() })
      await invalidar()
      avisar('Agendamento criado')
      navigate(-1)
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-dvh bg-white">
      <BarraTopo titulo="Novo Agendamento" tipo="fechar" />
      <form
        className="space-y-5 p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
        onSubmit={(e) => {
          e.preventDefault()
          void salvar()
        }}
      >
        <div>
          <span className={labelCls}>Cliente</span>
          <ClienteAutocomplete valor={cliente} onChange={setCliente} autoFocus={!clienteId} />
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Campo label="Data" dica={dataPorExtensoComAno(data)}>
            <input type="date" className={inputCls} value={data} min={hojeISO()} onChange={(e) => e.target.value && setData(e.target.value)} />
          </Campo>
          <Campo label="Hora">
            <input type="time" step={300} className={`${inputCls} w-32`} value={hora} onChange={(e) => e.target.value && setHora(e.target.value)} />
          </Campo>
        </div>
        <Campo label="Serviço">
          <textarea
            className={`${inputCls} min-h-24 resize-none`}
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Trocar registro, instalar chuveiro..."
          />
        </Campo>
        <Botao type="submit" disabled={!valido} carregando={salvando}>
          Agendar
        </Botao>
      </form>
    </div>
  )
}
