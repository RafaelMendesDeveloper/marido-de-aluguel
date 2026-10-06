import { useState } from 'react'
import { atualizarCliente, criarCliente } from '../api/clientes'
import { useClientes, useInvalidar } from '../hooks/dados'
import { soDigitos } from '../lib/telefone'
import { normalizar, vazioParaNull } from '../lib/texto'
import type { Cliente } from '../types'
import { BottomSheet } from './BottomSheet'
import { mensagemErro, useFeedback } from './Feedback'
import { Botao, Campo, inputCls } from './ui'

type Props = {
  aberto: boolean
  onFechar: () => void
  /** Presente = edição. */
  cliente?: Cliente | null
  onSalvo?: (cliente: Cliente) => void
}

export function ClienteFormSheet({ aberto, onFechar, cliente, onSalvo }: Props) {
  return (
    <BottomSheet aberto={aberto} onFechar={onFechar} titulo={cliente ? 'Editar cliente' : 'Novo cliente'}>
      {aberto && <Formulario cliente={cliente} onFechar={onFechar} onSalvo={onSalvo} />}
    </BottomSheet>
  )
}

function Formulario({ cliente, onFechar, onSalvo }: Omit<Props, 'aberto'>) {
  const { avisar, confirmar } = useFeedback()
  const invalidar = useInvalidar()
  const { data: clientes = [] } = useClientes()
  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [telefone, setTelefone] = useState(cliente?.telefone ?? '')
  const [endereco, setEndereco] = useState(cliente?.endereco ?? '')
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    const dados = {
      nome: nome.trim(),
      telefone: vazioParaNull(soDigitos(telefone)),
      endereco: vazioParaNull(endereco),
    }
    const duplicado = clientes.find((c) => c.id !== cliente?.id && normalizar(c.nome) === normalizar(dados.nome))
    if (
      duplicado &&
      !(await confirmar({
        titulo: 'Nome repetido',
        mensagem: `Já existe um cliente chamado "${duplicado.nome}". Salvar mesmo assim?`,
        confirmar: 'Salvar',
      }))
    )
      return
    setSalvando(true)
    try {
      if (cliente) {
        await atualizarCliente(cliente.id, dados)
        onSalvo?.({ ...cliente, ...dados })
      } else {
        onSalvo?.(await criarCliente(dados))
      }
      await invalidar()
      avisar(cliente ? 'Cliente atualizado' : 'Cliente cadastrado')
      onFechar()
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (nome.trim()) void salvar()
      }}
    >
      <Campo label="Nome *">
        <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus={!cliente} autoCapitalize="words" placeholder="Nome do cliente" />
      </Campo>
      <Campo label="Telefone">
        <input className={inputCls} type="tel" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
      </Campo>
      <Campo label="Endereço">
        <textarea className={`${inputCls} min-h-24 resize-none`} value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade" rows={3} />
      </Campo>
      <Botao type="submit" disabled={!nome.trim()} carregando={salvando}>
        Salvar
      </Botao>
    </form>
  )
}
