import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from './ui'

type Props = {
  aberto: boolean
  titulo: string
  subtitulo?: ReactNode
  onFechar: () => void
  children: ReactNode
  /** Ações fixas no rodapé (sempre visíveis acima do teclado/rolagem). */
  rodape?: ReactNode
  largura?: 'md' | 'lg' | 'xl'
}

/** Gaveta inferior no celular; janela centralizada a partir de `sm`. */
export function Modal({ aberto, titulo, subtitulo, onFechar, children, rodape, largura = 'md' }: Props) {
  const fechar = useRef(onFechar)
  useEffect(() => {
    fechar.current = onFechar
  })

  useEffect(() => {
    if (!aberto) return
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && fechar.current()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', tecla)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', tecla)
    }
  }, [aberto])

  if (!aberto) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="absolute inset-0 animate-aparecer bg-ink-950/45 backdrop-blur-[2px]" onClick={onFechar} />
      <div
        className={cx(
          'relative flex max-h-[94dvh] w-full animate-subir flex-col rounded-t-3xl bg-white shadow-2xl sm:max-h-[88dvh] sm:animate-surgir sm:rounded-3xl',
          largura === 'xl' ? 'sm:max-w-4xl' : largura === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-ink-200 sm:hidden" />
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-3 pb-2 sm:px-7 sm:pt-6">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold tracking-tight text-ink-900">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-sm text-ink-500">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 active:bg-ink-200"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className={cx('overflow-y-auto overscroll-contain px-5 pt-3 sm:px-7', rodape ? 'pb-4' : 'pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:pb-7')}>
          {children}
        </div>
        {rodape && (
          <div className="shrink-0 border-t border-ink-100 bg-white px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:rounded-b-3xl sm:px-7 sm:pb-6">
            {rodape}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
