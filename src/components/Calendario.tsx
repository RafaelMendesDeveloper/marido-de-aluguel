import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getDaysInMonth } from 'date-fns'
import { mesAno, paraISO } from '../lib/datas'
import { cx } from './ui'

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

type Props = {
  ano: number
  mes: number // 1–12
  selecionado: string
  hoje: string
  marcados: Set<string>
  onSelecionar: (iso: string) => void
  onMudarMes: (delta: number) => void
}

export function Calendario({ ano, mes, selecionado, hoje, marcados, onSelecionar, onMudarMes }: Props) {
  const primeiro = new Date(ano, mes - 1, 1)
  const vazios = (primeiro.getDay() + 6) % 7 // semana começa na segunda
  const dias = getDaysInMonth(primeiro)

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" aria-label="Mês anterior" onClick={() => onMudarMes(-1)} className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 active:bg-gray-200">
          <ChevronLeft className="size-5" />
        </button>
        <span className="text-[17px] font-bold text-gray-900">{mesAno(ano, mes)}</span>
        <button type="button" aria-label="Próximo mês" onClick={() => onMudarMes(1)} className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 active:bg-gray-200">
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: vazios }, (_, i) => (
          <div key={`v${i}`} />
        ))}
        {Array.from({ length: dias }, (_, i) => {
          const iso = paraISO(new Date(ano, mes - 1, i + 1))
          const ehSelecionado = iso === selecionado
          const ehHoje = iso === hoje
          const passado = iso < hoje
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelecionar(iso)}
              aria-label={iso}
              aria-pressed={ehSelecionado}
              className="flex h-11 flex-col items-center justify-center"
            >
              <span
                className={cx(
                  'flex size-9 flex-col items-center justify-center rounded-full text-[15px]',
                  ehSelecionado
                    ? 'bg-green-600 font-bold text-white'
                    : ehHoje
                      ? 'bg-green-100 font-bold text-green-700'
                      : passado
                        ? 'text-gray-400'
                        : 'text-gray-900',
                )}
              >
                {i + 1}
                {marcados.has(iso) && (
                  <span className={cx('mt-0.5 size-1 rounded-full', ehSelecionado ? 'bg-white' : passado ? 'bg-amber-500' : 'bg-green-600')} />
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
