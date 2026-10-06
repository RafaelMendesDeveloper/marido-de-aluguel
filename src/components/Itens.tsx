import { ChevronRight } from 'lucide-react'
import { fmtBRL } from '../lib/moeda'
import { horaCurta } from '../lib/datas'
import type { Agendamento, Servico } from '../types'
import { Avatar, BadgePago } from './ui'

/** Linha de serviço: avatar, cliente, detalhe, valor e status. */
export function ItemServico({ servico, detalhe, onClick }: { servico: Servico; detalhe?: string | null; onClick: () => void }) {
  const nome = servico.cliente?.nome ?? 'Cliente'
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-gray-50">
      <Avatar nome={nome} forma="quadrado" tom={servico.pago ? 'verde' : 'vermelho'} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold text-gray-900">{nome}</p>
        {detalhe && <p className="truncate text-sm text-gray-500">{detalhe}</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={servico.pago ? 'font-bold text-green-800' : 'font-bold text-red-600'}>
          {servico.valor == null ? '—' : fmtBRL(servico.valor)}
        </span>
        <BadgePago pago={servico.pago} />
      </div>
    </button>
  )
}

/** Linha de agendamento com pílula de hora. */
export function ItemAgendamento({ agendamento, onClick, atrasado }: { agendamento: Agendamento; onClick: () => void; atrasado?: boolean }) {
  const [h, m] = horaCurta(agendamento.hora).split(':')
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-gray-50">
      <div className={`flex w-14 shrink-0 flex-col items-center rounded-xl py-1.5 ${atrasado ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
        <span className="text-xl leading-none font-extrabold">{h}</span>
        <span className="text-xs font-semibold">:{m}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold text-gray-900">{agendamento.cliente?.nome ?? 'Cliente'}</p>
        <p className="truncate text-sm text-gray-500">{agendamento.descricao}</p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-gray-300" />
    </button>
  )
}
