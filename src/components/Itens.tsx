import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { horaCurta } from '../lib/datas'
import { fmtBRL } from '../lib/moeda'
import type { Agendamento, Servico } from '../types'
import { Avatar, BadgePago, cx } from './ui'

/** Linha de serviço: cliente, detalhe, valor e status. */
export function ItemServico({ servico, detalhe, extra, onClick }: { servico: Servico; detalhe?: ReactNode; extra?: ReactNode; onClick: () => void }) {
  const nome = servico.cliente?.nome ?? 'Cliente'
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-50 active:bg-ink-100">
      <Avatar nome={nome} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink-900">{nome}</p>
        {detalhe && <p className="truncate text-sm text-ink-500">{detalhe}</p>}
      </div>
      {extra && <div className="hidden shrink-0 text-sm text-ink-500 md:block">{extra}</div>}
      <div className="flex w-28 shrink-0 flex-col items-end gap-1">
        <span className={cx('tabular text-[15px] font-bold', servico.pago ? 'text-ink-900' : 'text-amber-700')}>
          {servico.valor == null ? '—' : fmtBRL(servico.valor)}
        </span>
        <BadgePago pago={servico.pago} />
      </div>
    </button>
  )
}

/** Linha de agendamento com bloco de hora. */
export function ItemAgendamento({ agendamento, onClick, atrasado, direita }: { agendamento: Agendamento; onClick: () => void; atrasado?: boolean; direita?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-ink-50">
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span
          className={cx(
            'tabular flex h-11 w-14 shrink-0 items-center justify-center rounded-xl text-[15px] font-extrabold',
            atrasado ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700',
          )}
        >
          {horaCurta(agendamento.hora)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ink-900">{agendamento.cliente?.nome ?? 'Cliente'}</span>
          <span className="block truncate text-sm text-ink-500">{agendamento.descricao}</span>
        </span>
        {!direita && <ChevronRight className="size-5 shrink-0 text-ink-300" />}
      </button>
      {direita}
    </div>
  )
}
