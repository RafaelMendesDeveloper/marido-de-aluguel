import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  aberto: boolean
  titulo: string
  onFechar: () => void
  children: ReactNode
}

export function BottomSheet({ aberto, titulo, onFechar, children }: Props) {
  useEffect(() => {
    if (!aberto) return
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', tecla)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', tecla)
    }
  }, [aberto, onFechar])

  if (!aberto) return null
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="absolute inset-0 animate-aparecer bg-black/40" onClick={onFechar} />
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] max-w-md animate-subir flex-col rounded-t-3xl bg-white shadow-2xl">
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-gray-300" />
        <div className="flex shrink-0 items-center justify-between px-5 pt-2 pb-1">
          <h2 className="text-xl font-bold text-gray-900">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
