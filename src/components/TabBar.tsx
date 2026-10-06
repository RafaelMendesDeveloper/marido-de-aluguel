import { Banknote, CalendarDays, History, Home, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cx } from './ui'

const ABAS = [
  { para: '/', rotulo: 'Início', Icone: Home },
  { para: '/agenda', rotulo: 'Agenda', Icone: CalendarDays },
  { para: '/clientes', rotulo: 'Clientes', Icone: Users },
  { para: '/historico', rotulo: 'Histórico', Icone: History },
  { para: '/financeiro', rotulo: 'Financeiro', Icone: Banknote },
]

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex h-16 max-w-md">
        {ABAS.map(({ para, rotulo, Icone }) => (
          <li key={para} className="flex-1">
            <NavLink
              to={para}
              end={para === '/'}
              className={({ isActive }) =>
                cx('flex h-full flex-col items-center justify-center gap-1 text-[10px] font-semibold', isActive ? 'text-green-600' : 'text-gray-400')
              }
            >
              {({ isActive }) => (
                <>
                  <Icone className="size-6" strokeWidth={isActive ? 2.4 : 1.8} />
                  {rotulo}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
