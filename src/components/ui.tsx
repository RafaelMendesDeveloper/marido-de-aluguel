import { ChevronLeft, Loader2, Plus, X } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { inicial } from '../lib/texto'

export const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-[17px] text-gray-900 outline-none ' +
  'placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-600/20 ' +
  'disabled:bg-gray-50 disabled:text-gray-500'

export const labelCls = 'mb-1.5 block text-sm font-semibold text-gray-700'

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function Campo({ label, children, dica }: { label: string; children: ReactNode; dica?: ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-gray-500">{dica}</span>}
    </label>
  )
}

type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primario' | 'secundario' | 'perigo' | 'perigoSuave'
  carregando?: boolean
}

export function Botao({ variante = 'primario', carregando, className, children, disabled, ...resto }: BotaoProps) {
  const estilos = {
    primario: 'bg-green-600 text-white active:bg-green-700 disabled:bg-gray-300',
    secundario: 'border border-gray-200 bg-white text-gray-900 active:bg-gray-50 disabled:text-gray-400',
    perigo: 'bg-red-600 text-white active:bg-red-700 disabled:bg-gray-300',
    perigoSuave: 'bg-red-50 text-red-600 active:bg-red-100 disabled:text-red-300',
  }[variante]
  return (
    <button
      type="button"
      disabled={disabled || carregando}
      className={cx(
        'flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[17px] font-bold transition-colors',
        estilos,
        className,
      )}
      {...resto}
    >
      {carregando && <Loader2 className="size-5 animate-spin" />}
      {children}
    </button>
  )
}

export function Avatar({ nome, tamanho = 'md', forma = 'circulo', tom = 'verde' }: {
  nome: string
  tamanho?: 'sm' | 'md' | 'lg'
  forma?: 'circulo' | 'quadrado'
  tom?: 'verde' | 'vermelho' | 'cinza'
}) {
  const t = { sm: 'size-9 text-sm', md: 'size-11 text-base', lg: 'size-20 text-3xl' }[tamanho]
  const c = {
    verde: 'bg-green-100 text-green-700',
    vermelho: 'bg-red-100 text-red-600',
    cinza: 'bg-gray-100 text-gray-600',
  }[tom]
  return (
    <div className={cx('flex shrink-0 items-center justify-center font-bold', t, c, forma === 'circulo' ? 'rounded-full' : 'rounded-xl')}>
      {inicial(nome)}
    </div>
  )
}

export function BadgePago({ pago, curto }: { pago: boolean; curto?: boolean }) {
  return (
    <span
      className={cx(
        'inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold',
        pago ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600',
      )}
    >
      {pago ? 'Pago' : curto ? 'Pend.' : 'Pendente'}
    </span>
  )
}

export function Fab({ onClick, rotulo, acima = 0 }: { onClick: () => void; rotulo: string; acima?: number }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 z-30 mx-auto max-w-md" style={{ bottom: `calc(5.25rem + env(safe-area-inset-bottom) + ${acima}px)` }}>
      <button
        type="button"
        aria-label={rotulo}
        onClick={onClick}
        className="pointer-events-auto absolute right-5 bottom-0 flex size-14 items-center justify-center rounded-full bg-green-600 text-white shadow-[0_4px_14px_rgba(22,163,74,0.4)] active:scale-95 active:bg-green-700"
      >
        <Plus className="size-7" strokeWidth={2.5} />
      </button>
    </div>
  )
}

export function Cartao({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-2xl border border-gray-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]', className)}>
      {children}
    </section>
  )
}

export function TituloSecao({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <h2 className="text-xs font-bold tracking-wider text-gray-500 uppercase">{children}</h2>
      {acao}
    </div>
  )
}

export function Vazio({ icone, titulo, texto }: { icone?: ReactNode; titulo: string; texto?: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {icone && <div className="mb-3 text-gray-300">{icone}</div>}
      <p className="font-semibold text-gray-500">{titulo}</p>
      {texto && <p className="mt-1 text-sm text-gray-400">{texto}</p>}
    </div>
  )
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-gray-400" role="status">
      <Loader2 className="size-5 animate-spin" />
      <span className="text-sm">{texto}</span>
    </div>
  )
}

export function Esqueleto({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="space-y-3 p-4" aria-hidden>
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="size-10 animate-pulse rounded-xl bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ErroCarregar({ erro, tentar }: { erro: unknown; tentar?: () => void }) {
  return (
    <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p className="font-semibold">Não foi possível carregar.</p>
      <p className="mt-1 break-words text-red-600">{erro instanceof Error ? erro.message : String(erro)}</p>
      {tentar && (
        <button type="button" onClick={tentar} className="mt-2 font-bold text-red-700 underline">
          Tentar de novo
        </button>
      )}
    </div>
  )
}

/** Cabeçalho branco das abas principais. */
export function CabecalhoPagina({ titulo, direita, children }: { titulo: string; direita?: ReactNode; children?: ReactNode }) {
  return (
    <header className="bg-white px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900">{titulo}</h1>
        {direita}
      </div>
      {children}
    </header>
  )
}

/** Barra de topo das telas internas (voltar / fechar). */
export function BarraTopo({ titulo, tipo = 'voltar', direita }: { titulo: string; tipo?: 'voltar' | 'fechar'; direita?: ReactNode }) {
  const navigate = useNavigate()
  const voltar = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-2">
        <button
          type="button"
          onClick={voltar}
          aria-label={tipo === 'voltar' ? 'Voltar' : 'Fechar'}
          className="flex size-11 items-center justify-center rounded-full text-green-600 active:bg-gray-100"
        >
          {tipo === 'voltar' ? <ChevronLeft className="size-7" /> : <X className="size-6" />}
        </button>
        <h1 className="flex-1 truncate text-[17px] font-bold text-gray-900">{titulo}</h1>
        <div className="flex min-w-11 justify-end">{direita}</div>
      </div>
    </header>
  )
}
