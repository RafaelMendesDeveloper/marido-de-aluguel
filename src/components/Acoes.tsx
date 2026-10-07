import { CalendarPlus, Receipt, UserPlus } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Agendamento, Cliente, Servico } from '../types'
import { ModalCliente, type AberturaCliente } from './ClienteForm'
import { ModalAgendamento, type AberturaAgendamento } from './FormAgendamento'
import { ModalServico, type AberturaServico } from './FormServico'
import { ModalImportarContatos } from './ImportarContatos'
import { Modal } from './Modal'

type AcoesContextType = {
  novoServico(opts?: { clienteId?: string }): void
  iniciarAgendamento(a: Agendamento): void
  editarServico(s: Servico): void
  novoAgendamento(opts?: { clienteId?: string; data?: string }): void
  editarAgendamento(a: Agendamento): void
  novoCliente(onSalvo?: (c: Cliente) => void): void
  editarCliente(c: Cliente): void
  importarContatos(): void
  abrirMenuNovo(): void
}

const AcoesContext = createContext<AcoesContextType | null>(null)

export const ATALHOS = { servico: 'S', agendamento: 'A', cliente: 'C' } as const

export function AcoesProvider({ children }: { children: ReactNode }) {
  const [servico, setServico] = useState<AberturaServico | null>(null)
  const [agendamento, setAgendamento] = useState<AberturaAgendamento | null>(null)
  const [cliente, setCliente] = useState<AberturaCliente | null>(null)
  const [importando, setImportando] = useState(false)
  const [menu, setMenu] = useState(false)

  const acoes = useMemo<AcoesContextType>(
    () => ({
      novoServico: (o) => setServico({ modo: 'novo', clienteId: o?.clienteId }),
      iniciarAgendamento: (a) => {
        setAgendamento(null)
        setServico({ modo: 'novo', agendamento: a })
      },
      editarServico: (s) => setServico({ modo: 'editar', servico: s }),
      novoAgendamento: (o) => setAgendamento({ modo: 'novo', clienteId: o?.clienteId, data: o?.data }),
      editarAgendamento: (a) => setAgendamento({ modo: 'editar', agendamento: a }),
      novoCliente: (onSalvo) => setCliente({ onSalvo }),
      editarCliente: (c) => setCliente({ cliente: c }),
      importarContatos: () => setImportando(true),
      abrirMenuNovo: () => setMenu(true),
    }),
    [],
  )

  // Atalhos de teclado (desktop): S = serviço, A = agendar, C = cliente
  const algumAberto = Boolean(servico || agendamento || cliente || importando || menu)
  const teclado = useCallback(
    (e: KeyboardEvent) => {
      if (algumAberto || e.metaKey || e.ctrlKey || e.altKey) return
      const alvo = e.target as HTMLElement
      if (alvo.closest('input, textarea, select, [contenteditable], [role=dialog], [role=alertdialog]')) return
      const k = e.key.toUpperCase()
      if (k === ATALHOS.servico) acoes.novoServico()
      else if (k === ATALHOS.agendamento) acoes.novoAgendamento()
      else if (k === ATALHOS.cliente) acoes.novoCliente()
      else return
      e.preventDefault()
    },
    [algumAberto, acoes],
  )
  useEffect(() => {
    window.addEventListener('keydown', teclado)
    return () => window.removeEventListener('keydown', teclado)
  }, [teclado])

  const escolher = (f: () => void) => () => {
    setMenu(false)
    f()
  }

  return (
    <AcoesContext.Provider value={acoes}>
      {children}
      <ModalServico abertura={servico} onFechar={() => setServico(null)} />
      <ModalAgendamento abertura={agendamento} onFechar={() => setAgendamento(null)} onIniciar={acoes.iniciarAgendamento} />
      <ModalCliente abertura={cliente} onFechar={() => setCliente(null)} />
      <ModalImportarContatos aberto={importando} onFechar={() => setImportando(false)} />
      <Modal aberto={menu} onFechar={() => setMenu(false)} titulo="O que você quer fazer?">
        <div className="grid gap-3">
          <ItemMenu icone={<Receipt className="size-6" />} titulo="Registrar serviço" texto="Anote o que fez e quanto cobrou" onClick={escolher(acoes.novoServico)} destaque />
          <ItemMenu icone={<CalendarPlus className="size-6" />} titulo="Agendar visita" texto="Marque dia, hora e o serviço" onClick={escolher(acoes.novoAgendamento)} />
          <ItemMenu icone={<UserPlus className="size-6" />} titulo="Novo cliente" texto="Nome, WhatsApp e endereço" onClick={escolher(() => acoes.novoCliente())} />
        </div>
      </Modal>
    </AcoesContext.Provider>
  )
}

function ItemMenu({ icone, titulo, texto, onClick, destaque }: { icone: ReactNode; titulo: string; texto: string; onClick: () => void; destaque?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition active:scale-[0.99] ${destaque ? 'border-brand-600/25 bg-brand-50' : 'border-ink-200 bg-white'}`}
    >
      <span className={`flex size-12 items-center justify-center rounded-xl ${destaque ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700'}`}>{icone}</span>
      <span>
        <span className="block text-[17px] font-bold text-ink-900">{titulo}</span>
        <span className="block text-sm text-ink-500">{texto}</span>
      </span>
    </button>
  )
}

export function useAcoes(): AcoesContextType {
  const ctx = useContext(AcoesContext)
  if (!ctx) throw new Error('useAcoes fora do AcoesProvider')
  return ctx
}
