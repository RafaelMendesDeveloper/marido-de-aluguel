import { CheckCircle2, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Botao, inputCls } from './ui'

type OpcoesConfirmar = {
  titulo: string
  mensagem?: ReactNode
  confirmar?: string
  cancelar?: string
  perigo?: boolean
  /** Exige digitar este texto para liberar o botão (ações irreversíveis). */
  digitar?: string
}

type Toast = { id: number; texto: string; tipo: 'ok' | 'erro' }

type FeedbackContextType = {
  confirmar(opcoes: OpcoesConfirmar): Promise<boolean>
  avisar(texto: string, tipo?: 'ok' | 'erro'): void
}

const FeedbackContext = createContext<FeedbackContextType | null>(null)

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [dialogo, setDialogo] = useState<OpcoesConfirmar | null>(null)
  const [digitado, setDigitado] = useState('')
  const resolver = useRef<(v: boolean) => void>(() => {})
  const [toasts, setToasts] = useState<Toast[]>([])

  const confirmar = useCallback((opcoes: OpcoesConfirmar) => {
    setDigitado('')
    setDialogo(opcoes)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const responder = (v: boolean) => {
    resolver.current(v)
    setDialogo(null)
  }

  const avisar = useCallback((texto: string, tipo: 'ok' | 'erro' = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t.slice(-1), { id, texto, tipo }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tipo === 'erro' ? 5000 : 2200)
  }, [])

  const liberado = !dialogo?.digitar || digitado.trim().toUpperCase() === dialogo.digitar.toUpperCase()

  return (
    <FeedbackContext.Provider value={{ confirmar, avisar }}>
      {children}
      {dialogo &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" role="alertdialog" aria-modal="true">
            <div className="absolute inset-0 animate-aparecer bg-black/40" onClick={() => responder(false)} />
            <div className="relative w-full max-w-sm animate-surgir rounded-3xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-bold text-gray-900">{dialogo.titulo}</h2>
              {dialogo.mensagem && <div className="mt-2 text-[15px] text-gray-600">{dialogo.mensagem}</div>}
              {dialogo.digitar && (
                <div className="mt-4">
                  <p className="mb-1.5 text-sm text-gray-600">
                    Digite <strong className="text-gray-900">{dialogo.digitar}</strong> para confirmar:
                  </p>
                  <input
                    className={inputCls}
                    value={digitado}
                    onChange={(e) => setDigitado(e.target.value)}
                    autoFocus
                    autoCapitalize="characters"
                    autoComplete="off"
                  />
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <Botao variante="secundario" onClick={() => responder(false)}>
                  {dialogo.cancelar ?? 'Voltar'}
                </Botao>
                <Botao variante={dialogo.perigo ? 'perigo' : 'primario'} disabled={!liberado} onClick={() => responder(true)}>
                  {dialogo.confirmar ?? 'Confirmar'}
                </Botao>
              </div>
            </div>
          </div>,
          document.body,
        )}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[70] mx-auto flex max-w-md flex-col items-center gap-2 px-4">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className="flex animate-surgir items-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-lg"
            >
              {t.tipo === 'ok' ? <CheckCircle2 className="size-5 text-green-400" /> : <XCircle className="size-5 text-red-400" />}
              <span>{t.texto}</span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </FeedbackContext.Provider>
  )
}

export function useFeedback(): FeedbackContextType {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('useFeedback fora do FeedbackProvider')
  return ctx
}

export function mensagemErro(e: unknown): string {
  return e instanceof Error ? e.message : 'Algo deu errado. Tente de novo.'
}
