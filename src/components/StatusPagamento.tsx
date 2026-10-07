import { CheckCircle2, Clock } from 'lucide-react'
import { cx } from './ui'

export function StatusPagamento({ pago, onChange }: { pago: boolean; onChange: (pago: boolean) => void }) {
  const base = 'flex min-h-12 flex-1 hover:border-ink-300 items-center justify-center gap-2 rounded-xl border-2 text-[16px] font-bold transition-colors'
  return (
    <div className="flex gap-3" role="radiogroup" aria-label="Status do pagamento">
      <button
        type="button"
        role="radio"
        aria-checked={!pago}
        onClick={() => onChange(false)}
        className={cx(base, !pago ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-ink-200 bg-white text-ink-400')}
      >
        <Clock className="size-5" /> A receber
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={pago}
        onClick={() => onChange(true)}
        className={cx(base, pago ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-400')}
      >
        <CheckCircle2 className="size-5" /> Pago
      </button>
    </div>
  )
}
