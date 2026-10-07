import { Banknote, CalendarDays, CalendarPlus, History, Home, Plus, Receipt, Users } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ATALHOS, useAcoes } from './Acoes'
import { Avatar, Logo, cx } from './ui'

const NAV = [
  { para: '/', rotulo: 'Início', Icone: Home },
  { para: '/agenda', rotulo: 'Agenda', Icone: CalendarDays },
  { para: '/clientes', rotulo: 'Clientes', Icone: Users },
  { para: '/historico', rotulo: 'Histórico', Icone: History },
  { para: '/financeiro', rotulo: 'Financeiro', Icone: Banknote },
]

function Tecla({ children }: { children: string }) {
  return <kbd className="ml-auto rounded-md border border-current/20 px-1.5 py-0.5 font-sans text-[11px] font-semibold opacity-70">{children}</kbd>
}

function BarraLateral() {
  const { perfil, session } = useAuth()
  const acoes = useAcoes()
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-ink-200/80 bg-white lg:flex">
      <Link to="/" className="px-6 pt-6 pb-5">
        <Logo />
      </Link>
      <div className="space-y-2 px-4">
        <button
          type="button"
          onClick={() => acoes.novoServico()}
          className="flex min-h-11 w-full items-center gap-2.5 rounded-xl bg-brand-600 px-4 text-[15px] font-bold text-white shadow-marca hover:bg-brand-700"
        >
          <Receipt className="size-[18px]" /> Registrar serviço <Tecla>{ATALHOS.servico}</Tecla>
        </button>
        <button
          type="button"
          onClick={() => acoes.novoAgendamento()}
          className="flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-4 text-[15px] font-bold text-ink-800 hover:bg-ink-50"
        >
          <CalendarPlus className="size-[18px]" /> Agendar visita <Tecla>{ATALHOS.agendamento}</Tecla>
        </button>
      </div>
      <nav className="mt-6 flex-1 px-3">
        <p className="px-3 pb-2 text-[11px] font-bold tracking-wider text-ink-400 uppercase">Menu</p>
        <ul className="space-y-0.5">
          {NAV.map(({ para, rotulo, Icone }) => (
            <li key={para}>
              <NavLink
                to={para}
                end={para === '/'}
                className={({ isActive }) =>
                  cx(
                    'flex min-h-10 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition-colors',
                    isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icone className={cx('size-[18px]', isActive ? 'text-brand-600' : 'text-ink-400')} />
                    {rotulo}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <NavLink
        to="/conta"
        className={({ isActive }) => cx('m-3 flex items-center gap-3 rounded-2xl p-3 transition-colors', isActive ? 'bg-ink-100' : 'hover:bg-ink-50')}
      >
        <Avatar nome={perfil?.nome ?? '?'} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-ink-900">{perfil?.nome}</span>
          <span className="block truncate text-xs text-ink-500">{session?.user.email}</span>
        </span>
      </NavLink>
    </aside>
  )
}

function BarraSuperiorMovel() {
  const { perfil } = useAuth()
  return (
    <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-lg lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link to="/" aria-label="Início">
          <Logo />
        </Link>
        <Link to="/conta" aria-label="Minha conta" className="rounded-full active:opacity-70">
          <Avatar nome={perfil?.nome ?? '?'} tamanho="sm" />
        </Link>
      </div>
    </header>
  )
}

const NAV_MOVEL = [
  { para: '/', rotulo: 'Início', Icone: Home, ativoEm: ['/'] },
  { para: '/agenda', rotulo: 'Agenda', Icone: CalendarDays, ativoEm: ['/agenda'] },
  null,
  { para: '/clientes', rotulo: 'Clientes', Icone: Users, ativoEm: ['/clientes'] },
  { para: '/financeiro', rotulo: 'Finanças', Icone: Banknote, ativoEm: ['/financeiro', '/historico'] },
]

function NavegacaoMovel() {
  const { pathname } = useLocation()
  const acoes = useAcoes()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {NAV_MOVEL.map((item) =>
          item ? (
            <li key={item.para}>
              {(() => {
                const ativo = item.ativoEm.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)))
                return (
                  <Link
                    to={item.para}
                    aria-current={ativo ? 'page' : undefined}
                    className={cx('flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold', ativo ? 'text-brand-700' : 'text-ink-400')}
                  >
                    <item.Icone className="size-[22px]" strokeWidth={ativo ? 2.4 : 1.9} />
                    {item.rotulo}
                  </Link>
                )
              })()}
            </li>
          ) : (
            <li key="novo" className="flex items-center justify-center">
              <button
                type="button"
                aria-label="Novo"
                onClick={acoes.abrirMenuNovo}
                className="-mt-6 flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-marca ring-4 ring-white active:scale-95"
              >
                <Plus className="size-7" strokeWidth={2.6} />
              </button>
            </li>
          ),
        )}
      </ul>
    </nav>
  )
}

export function AppShell() {
  return (
    <div className="min-h-dvh">
      <BarraLateral />
      <BarraSuperiorMovel />
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] sm:px-6 lg:px-10 lg:pb-14">
          <Outlet />
        </div>
      </main>
      <NavegacaoMovel />
    </div>
  )
}
