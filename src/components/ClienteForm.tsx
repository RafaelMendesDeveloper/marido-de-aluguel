import { useState } from 'react'
import { atualizarCliente, criarCliente } from '../api/clientes'
import { useClientes, useInvalidar } from '../hooks/dados'
import { soDigitos } from '../lib/telefone'
import { normalizar, vazioParaNull } from '../lib/texto'
import type { Cliente } from '../types'
import { mensagemErro, useFeedback } from './Feedback'
import { Modal } from './Modal'
import { Botao, Campo, inputCls } from './ui'

export type AberturaCliente = { cliente?: Cliente; onSalvo?: (c: Cliente) => void }

export function ModalCliente({ abertura, onFechar }: { abertura: AberturaCliente | null; onFechar: () => void }) {
  return abertura ? <Formulario key={abertura.cliente?.id ?? 'novo'} {...abertura} onFechar={onFechar} /> : null
}

function Formulario({ cliente, onSalvo, onFechar }: AberturaCliente & { onFechar: () => void }) {
  const { avisar, confirmar } = useFeedback()
  const invalidar = useInvalidar()
  const { data: clientes = [] } = useClientes()
  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [telefone, setTelefone] = useState(cliente?.telefone ?? '')
  const [endereco, setEndereco] = useState(cliente?.endereco ?? '')
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    if (!nome.trim()) return
    const dados = { nome: nome.trim(), telefone: vazioParaNull(soDigitos(telefone)), endereco: vazioParaNull(endereco) }
    const duplicado = clientes.find((c) => c.id !== cliente?.id && normalizar(c.nome) === normalizar(dados.nome))
    if (
      duplicado &&
      !(await confirmar({ titulo: 'Nome repetido', mensagem: `Já existe um cliente chamado "${duplicado.nome}". Salvar mesmo assim?`, confirmar: 'Salvar' }))
    )
      return
    setSalvando(true)
    try {
      const salvo = cliente ? { ...cliente, ...dados } : await criarCliente(dados)
      if (cliente) await atualizarCliente(cliente.id, dados)
      await invalidar()
      avisar(cliente ? 'Cliente atualizado' : 'Cliente cadastrado')
      onSalvo?.(salvo)
      onFechar()
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
      setSalvando(false)
    }
  }

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={cliente ? 'Editar cliente' : 'Novo cliente'}
      rodape={
        <Botao tamanho="lg" largo onClick={salvar} disabled={!nome.trim()} carregando={salvando}>
          Salvar cliente
        </Botao>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void salvar()
        }}
      >
        <Campo label="Nome">
          <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus={!cliente} autoCapitalize="words" placeholder="Ex.: Dona Maria" />
        </Campo>
        <Campo label="WhatsApp / telefone" dica="Com DDD. Usado para chamar no WhatsApp com 1 toque.">
          <input className={inputCls} type="tel" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
        </Campo>
        <Campo label="Endereço" dica="Abre a rota no Google Maps.">
          <textarea className={`${inputCls} min-h-20 resize-none`} value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade" rows={2} />
        </Campo>
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
