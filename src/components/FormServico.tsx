import { QrCode, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { obterOuCriarCliente } from '../api/clientes'
import { atualizarServico, criarServico, excluirServico } from '../api/servicos'
import { useClientes, useInvalidar } from '../hooks/dados'
import { dataPorExtensoComAno, hojeISO } from '../lib/datas'
import { vazioParaNull } from '../lib/texto'
import type { Agendamento, Servico } from '../types'
import { useAcoes } from './Acoes'
import { DatasRapidas, TextosRapidos, ValoresRapidos } from './Atalhos'
import { CampoValor } from './CampoValor'
import { ClienteAutocomplete, type EscolhaCliente } from './ClienteAutocomplete'
import { mensagemErro, useFeedback } from './Feedback'
import { Modal } from './Modal'
import { StatusPagamento } from './StatusPagamento'
import { Botao, inputCls, labelCls } from './ui'

export type AberturaServico =
  | { modo: 'novo'; clienteId?: string; agendamento?: Agendamento }
  | { modo: 'editar'; servico: Servico }

export function ModalServico({ abertura, onFechar }: { abertura: AberturaServico | null; onFechar: () => void }) {
  const chave = abertura ? (abertura.modo === 'editar' ? abertura.servico.id : `novo-${abertura.agendamento?.id ?? abertura.clienteId ?? ''}`) : ''
  return abertura ? <Formulario key={chave} abertura={abertura} onFechar={onFechar} /> : null
}

function Formulario({ abertura, onFechar }: { abertura: AberturaServico; onFechar: () => void }) {
  const { avisar, confirmar } = useFeedback()
  const acoes = useAcoes()
  const invalidar = useInvalidar()
  const { data: clientes = [] } = useClientes()
  const editando = abertura.modo === 'editar' ? abertura.servico : null
  const agendamento = abertura.modo === 'novo' ? abertura.agendamento : undefined
  const clienteInicial = editando?.cliente_id ?? agendamento?.cliente_id ?? (abertura.modo === 'novo' ? abertura.clienteId : undefined)
  const nomeInicial =
    editando?.cliente?.nome ?? agendamento?.cliente?.nome ?? clientes.find((c) => c.id === clienteInicial)?.nome ?? ''

  const [escolha, setCliente] = useState<EscolhaCliente>({ id: clienteInicial ?? null, nome: nomeInicial })
  // nome pode chegar depois (lista de clientes ainda carregando)
  const cliente = escolha.id && !escolha.nome ? { id: escolha.id, nome: clientes.find((c) => c.id === escolha.id)?.nome ?? '' } : escolha
  const [data, setData] = useState(editando?.data ?? hojeISO())
  const [centavos, setCentavos] = useState<number | null>(editando?.valor == null ? null : Math.round(editando.valor * 100))
  const [pago, setPago] = useState(editando?.pago ?? false)
  const [observacao, setObservacao] = useState(editando?.observacao ?? agendamento?.descricao ?? '')
  const [salvando, setSalvando] = useState(false)

  const travado = Boolean(agendamento) || (abertura.modo === 'novo' && Boolean(abertura.clienteId))
  const valido = cliente.nome.trim() && (editando ? true : (centavos ?? 0) > 0)

  const salvar = async () => {
    if (!valido) return
    setSalvando(true)
    try {
      const clienteId = await obterOuCriarCliente(cliente, clientes)
      const dados = { cliente_id: clienteId, data, valor: centavos == null ? null : centavos / 100, pago, observacao: vazioParaNull(observacao) }
      if (editando) await atualizarServico(editando.id, dados)
      else await criarServico({ ...dados, agendamento_id: agendamento?.id ?? null })
      await invalidar()
      avisar(editando ? 'Serviço atualizado' : pago ? 'Serviço registrado como pago' : 'Serviço registrado')
      onFechar()
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
      setSalvando(false)
    }
  }

  const excluir = async () => {
    if (!editando) return
    const ok = await confirmar({ titulo: 'Excluir serviço?', mensagem: 'Essa ação não pode ser desfeita.', confirmar: 'Excluir', perigo: true })
    if (!ok) return
    try {
      await excluirServico(editando.id)
      await invalidar()
      avisar('Serviço excluído')
      onFechar()
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
    }
  }

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={editando ? 'Editar serviço' : agendamento ? 'Concluir atendimento' : 'Registrar serviço'}
      subtitulo={dataPorExtensoComAno(data)}
      rodape={
        <div className="flex gap-3">
          {editando && (
            <Botao variante="perigoSuave" tamanho="lg" onClick={excluir} aria-label="Excluir serviço" className="px-4">
              <Trash2 className="size-5" />
            </Botao>
          )}
          {editando && !editando.pago && (editando.valor ?? 0) > 0 && (
            <Botao variante="suave" tamanho="lg" onClick={() => acoes.cobrar({ clienteId: editando.cliente_id, servicoIds: [editando.id] })}>
              <QrCode className="size-5" /> Cobrar
            </Botao>
          )}
          <Botao tamanho="lg" largo onClick={salvar} disabled={!valido} carregando={salvando}>
            {editando ? 'Salvar alterações' : 'Salvar serviço'}
          </Botao>
        </div>
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
          <ClienteAutocomplete valor={cliente} onChange={setCliente} travado={travado} autoFocus={!travado && !editando} />
        </div>

        <div>
          <span className={labelCls}>Valor</span>
          <CampoValor centavos={centavos} onChange={setCentavos} autoFocus={travado} grande />
          <ValoresRapidos centavos={centavos} onEscolher={setCentavos} />
        </div>

        <div>
          <span className={labelCls}>Pagamento</span>
          <StatusPagamento pago={pago} onChange={setPago} />
        </div>

        <div>
          <span className={labelCls}>O que foi feito</span>
          <TextosRapidos texto={observacao} onChange={setObservacao} />
          <textarea
            className={`${inputCls} min-h-20 resize-none`}
            rows={2}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Opcional — ex.: trocou a resistência do chuveiro"
          />
        </div>

        <div>
          <span className={labelCls}>Data</span>
          <DatasRapidas valor={data} onEscolher={setData} sentido="passado" />
          <input type="date" aria-label="Data" className={inputCls} value={data} max={editando ? undefined : hojeISO()} onChange={(e) => e.target.value && setData(e.target.value)} />
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
