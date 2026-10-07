import { fmtBRL, fmtCompacto } from '../lib/moeda'
import { cx } from './ui'

const ALTURA = 160

export function GraficoBarras({ itens }: { itens: { rotulo: string; valor: number }[] }) {
  const maior = Math.max(0, ...itens.map((i) => i.valor))
  return (
    <div className="flex items-end gap-1.5 sm:gap-3" style={{ height: ALTURA + 44 }} role="img" aria-label="Gráfico de receita">
      {itens.map((i) => {
        const h = i.valor > 0 ? Math.max(6, (i.valor / maior) * ALTURA) : 3
        return (
          <div key={i.rotulo} className="group relative flex min-w-0 flex-1 flex-col items-center justify-end" title={`${i.rotulo}: ${fmtBRL(i.valor)}`}>
            <span className="tabular mb-1.5 truncate text-[10px] font-semibold text-ink-500 sm:text-[11px]">{i.valor > 0 ? fmtCompacto(i.valor) : ''}</span>
            <div
              className={cx('w-full max-w-12 rounded-md transition-colors', i.valor > 0 ? 'bg-brand-500 group-hover:bg-brand-600' : 'bg-ink-100')}
              style={{ height: h }}
            />
            <span className="mt-2 text-[11px] font-semibold text-ink-500">{i.rotulo}</span>
          </div>
        )
      })}
    </div>
  )
}
