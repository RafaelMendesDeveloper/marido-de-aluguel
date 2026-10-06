import { fmtCompacto } from '../lib/moeda'
import { cx } from './ui'

const ALTURA = 110

export function GraficoBarras({ itens }: { itens: { rotulo: string; valor: number }[] }) {
  const maior = Math.max(0, ...itens.map((i) => i.valor))
  return (
    <div className="flex items-end gap-1.5 px-1" style={{ height: ALTURA + 40 }}>
      {itens.map((i) => {
        const h = i.valor > 0 ? Math.max(4, (i.valor / maior) * ALTURA) : 2
        return (
          <div key={i.rotulo} className="flex min-w-0 flex-1 flex-col items-center justify-end">
            <span className="mb-1 truncate text-[10px] font-semibold text-gray-500">{i.valor > 0 ? fmtCompacto(i.valor) : ''}</span>
            <div className={cx('w-full max-w-10 rounded-t-md', i.valor > 0 ? 'bg-green-600' : 'bg-gray-100')} style={{ height: h }} />
            <span className="mt-1.5 text-[11px] font-semibold text-gray-500">{i.rotulo}</span>
          </div>
        )
      })}
    </div>
  )
}
