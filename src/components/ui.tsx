import { ChevronLeft, Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { inicial } from '../lib/texto'

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export const inputCls =
  'w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-base text-ink-900 shadow-[inset_0_1px_1px_rgb(0_0_0/0.02)] outline-none transition ' +
  'placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 ' +
  'disabled:bg-ink-50 disabled:text-ink-500'

export const labelCls = 'mb-1.5 block text-sm font-semibold text-ink-700'

export function Campo({ label, children, dica, className }: { label: string; children: ReactNode; dica?: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className={labelCls}>{label}</span>
      {children}
      {dica && <span className="mt-1.5 block text-xs text-ink-500">{dica}</span>}
    </label>
  )
}

type Variante = 'primario' | 'secundario' | 'suave' | 'fantasma' | 'perigo' | 'perigoSuave' | 'escuro'
type Tamanho = 'sm' | 'md' | 'lg'

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-brand-600 text-white shadow-marca hover:bg-brand-700 active:bg-brand-800 disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none',
  secundario: 'border border-ink-200 bg-white text-ink-800 shadow-card hover:bg-ink-50 active:bg-ink-100 disabled:text-ink-400',
  suave: 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 disabled:text-brand-300',
  fantasma: 'text-ink-600 hover:bg-ink-100 active:bg-ink-200 disabled:text-ink-300',
  perigo: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-ink-200',
  perigoSuave: 'bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 disabled:text-red-300',
  escuro: 'bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950',
}

const TAMANHOS: Record<Tamanho, string> = {
  sm: 'min-h-9 rounded-lg px-3 text-sm gap-1.5',
  md: 'min-h-11 rounded-xl px-4 text-[15px] gap-2',
  lg: 'min-h-13 rounded-2xl px-6 text-base gap-2',
}

export function classesBotao(variante: Variante = 'primario', tamanho: Tamanho = 'md', largo?: boolean) {
  return cx(
    'inline-flex items-center justify-center font-bold transition-colors select-none disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
    VARIANTES[variante],
    TAMANHOS[tamanho],
    largo && 'w-full',
  )
}

type BotaoProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante
  tamanho?: Tamanho
  largo?: boolean
  carregando?: boolean
}

export function Botao({ variante, tamanho, largo, carregando, className, children, disabled, ...resto }: BotaoProps) {
  return (
    <button type="button" disabled={disabled || carregando} className={cx(classesBotao(variante, tamanho, largo), className)} {...resto}>
      {carregando && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

export function BotaoLink({ to, variante, tamanho, largo, className, children }: {
  to: string
  variante?: Variante
  tamanho?: Tamanho
  largo?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={cx(classesBotao(variante, tamanho, largo), className)}>
      {children}
    </Link>
  )
}

const TONS_AVATAR = [
  'bg-brand-100 text-brand-800',
  'bg-sky-100 text-sky-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-violet-100 text-violet-800',
  'bg-teal-100 text-teal-800',
  'bg-orange-100 text-orange-800',
]

function tomDoNome(nome: string): string {
  let h = 0
  for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return TONS_AVATAR[h % TONS_AVATAR.length]
}

export function Avatar({ nome, tamanho = 'md', className }: { nome: string; tamanho?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const t = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-xl', xl: 'size-20 text-3xl' }[tamanho]
  return (
    <span className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-bold', t, tomDoNome(nome), className)} aria-hidden>
      {inicial(nome)}
    </span>
  )
}

export function BadgePago({ pago }: { pago: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
        pago ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-600/15' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
      )}
    >
      <span className={cx('size-1.5 rounded-full', pago ? 'bg-brand-500' : 'bg-amber-500')} />
      {pago ? 'Pago' : 'A receber'}
    </span>
  )
}

export function Cartao({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx('rounded-2xl border border-ink-200/80 bg-white shadow-card', className)}>{children}</section>
}

export function CabecalhoCartao({ titulo, acao, icone }: { titulo: ReactNode; acao?: ReactNode; icone?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
      <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink-900">
        {icone && <span className="text-ink-400">{icone}</span>}
        {titulo}
      </h2>
      {acao}
    </div>
  )
}

export function LinkCartao({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50">
      {children}
    </Link>
  )
}

type Tom = 'verde' | 'ambar' | 'azul' | 'neutro'

const TONS_INDICADOR: Record<Tom, { icone: string; valor: string }> = {
  verde: { icone: 'bg-brand-50 text-brand-600', valor: 'text-ink-900' },
  ambar: { icone: 'bg-amber-50 text-amber-600', valor: 'text-ink-900' },
  azul: { icone: 'bg-sky-50 text-sky-600', valor: 'text-ink-900' },
  neutro: { icone: 'bg-ink-100 text-ink-600', valor: 'text-ink-900' },
}

/** Cartão de número (KPI). */
export function Indicador({ rotulo, valor, icone, tom = 'neutro', detalhe, carregando, to }: {
  rotulo: string
  valor: ReactNode
  icone: ReactNode
  tom?: Tom
  detalhe?: ReactNode
  carregando?: boolean
  to?: string
}) {
  const t = TONS_INDICADOR[tom]
  const corpo = (
    <>
      <div className="flex items-center gap-2.5">
        <span className={cx('flex size-8 items-center justify-center rounded-lg [&_svg]:size-4', t.icone)}>{icone}</span>
        <span className="text-[13px] font-semibold text-ink-500">{rotulo}</span>
      </div>
      <div className={cx('tabular mt-3 text-2xl font-extrabold tracking-tight', t.valor)}>
        {carregando ? <span className="inline-block h-7 w-24 animate-pulse rounded-md bg-ink-100" /> : valor}
      </div>
      {detalhe && <div className="mt-1 text-xs text-ink-500">{detalhe}</div>}
    </>
  )
  const base = 'block rounded-2xl border border-ink-200/80 bg-white p-4 shadow-card'
  return to ? (
    <Link to={to} className={cx(base, 'transition hover:border-ink-300 hover:shadow-elevado')}>
      {corpo}
    </Link>
  ) : (
    <div className={base}>{corpo}</div>
  )
}

export function Chip({ ativo, onClick, children, className }: { ativo?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cx(
        'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors',
        ativo ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Segmentado<T extends string>({ opcoes, valor, onChange, className }: {
  opcoes: { id: T; rotulo: ReactNode }[]
  valor: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cx('inline-flex rounded-xl bg-ink-100 p-1', className)} role="tablist">
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={valor === o.id}
          onClick={() => onChange(o.id)}
          className={cx(
            'min-h-9 flex-1 rounded-lg px-3.5 text-sm font-bold whitespace-nowrap transition',
            valor === o.id ? 'bg-white text-ink-900 shadow-card' : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  )
}

export function Vazio({ icone, titulo, texto, acao }: { icone?: ReactNode; titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {icone && <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 [&_svg]:size-6">{icone}</div>}
      <p className="font-semibold text-ink-700">{titulo}</p>
      {texto && <p className="mt-1 max-w-xs text-sm text-ink-500">{texto}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  )
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ink-400" role="status">
      <Loader2 className="size-5 animate-spin" />
      <span className="text-sm">{texto}</span>
    </div>
  )
}

export function Esqueleto({ linhas = 3 }: { linhas?: number }) {
  return (
    <div className="space-y-4 px-5 py-4" aria-hidden>
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="size-10 animate-pulse rounded-full bg-ink-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-ink-100" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-ink-100" />
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

/** Título de página com ações à direita. */
export function CabecalhoPagina({ titulo, subtitulo, acoes, children }: {
  titulo: ReactNode
  subtitulo?: ReactNode
  acoes?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="pt-5 pb-5 lg:pt-10 lg:pb-7">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-ink-900 lg:text-[32px]">{titulo}</h1>
          {subtitulo && <p className="mt-1 text-[15px] text-ink-500">{subtitulo}</p>}
        </div>
        {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
      </div>
      {children}
    </header>
  )
}

/** Voltar (telas internas). */
export function Voltar({ para, rotulo = 'Voltar' }: { para?: string; rotulo?: string }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => (para ? navigate(para) : window.history.length > 1 ? navigate(-1) : navigate('/'))}
      className="-ml-2 inline-flex min-h-10 items-center gap-1 rounded-lg pr-3 pl-1 text-sm font-semibold text-ink-600 hover:bg-ink-100"
    >
      <ChevronLeft className="size-5" /> {rotulo}
    </button>
  )
}

export function Logo({ claro, className }: { claro?: boolean; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <LogoMarca className="size-8" />
      <span className={cx('text-xl font-extrabold tracking-tight', claro ? 'text-white' : 'text-ink-900')}>Orça!</span>
    </span>
  )
}

export function LogoMarca({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <rect width="512" height="512" rx="128" fill="#16a34a" />
      <circle cx="214" cy="262" r="118" fill="none" stroke="#fff" strokeWidth="52" />
      <rect x="366" y="132" width="52" height="176" rx="26" fill="#fff" />
      <circle cx="392" cy="366" r="30" fill="#fff" />
    </svg>
  )
}
