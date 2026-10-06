import { CheckCircle2, Clock } from 'lucide-react'
import { cx } from './ui'

export function StatusPagamento({ pago, onChange }: { pago: boolean; onChange: (pago: boolean) => void }) {
  const base = 'flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 text-[16px] font-bold transition-colors'
  return (
    <div className="flex gap-3" role="radiogroup" aria-label="Status do pagamento">
      <button
        type="button"
        role="radio"
        aria-checked={!pago}
        onClick={() => onChange(false)}
        className={cx(base, !pago ? 'border-red-600 bg-red-50 text-red-600' : 'border-gray-200 bg-white text-gray-400')}
      >
        <Clock className="size-5" /> Pendente
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={pago}
        onClick={() => onChange(true)}
        className={cx(base, pago ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-400')}
      >
        <CheckCircle2 className="size-5" /> Pago
      </button>
    </div>
  )
}
