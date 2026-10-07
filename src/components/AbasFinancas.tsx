import { NavLink } from 'react-router-dom'
import { cx } from './ui'

/** No celular, Financeiro e Histórico dividem a mesma aba ("Finanças"). */
export function AbasFinancas() {
  const aba = ({ isActive }: { isActive: boolean }) =>
    cx('flex min-h-9 flex-1 items-center justify-center rounded-lg text-sm font-bold transition', isActive ? 'bg-white text-ink-900 shadow-card' : 'text-ink-500')
  return (
    <div className="mt-4 flex rounded-xl bg-ink-100 p-1 lg:hidden">
      <NavLink to="/financeiro" className={aba}>
        Resumo
      </NavLink>
      <NavLink to="/historico" className={aba}>
        Histórico
      </NavLink>
    </div>
  )
}
