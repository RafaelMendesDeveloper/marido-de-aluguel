import { AlertTriangle, CheckCircle2, HelpCircle, XCircle } from 'lucide-react'
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-5" role="alertdialog" aria-modal="true" aria-label={dialogo.titulo}>
            <div className="absolute inset-0 animate-aparecer bg-ink-950/45 backdrop-blur-[2px]" onClick={() => responder(false)} />
            <div className="relative w-full max-w-sm animate-surgir rounded-3xl bg-white p-6 shadow-2xl">
              <div className={`mb-4 flex size-11 items-center justify-center rounded-2xl ${dialogo.perigo ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
                {dialogo.perigo ? <AlertTriangle className="size-5" /> : <HelpCircle className="size-5" />}
              </div>
              <h2 className="text-lg font-extrabold tracking-tight text-ink-900">{dialogo.titulo}</h2>
              {dialogo.mensagem && <div className="mt-1.5 text-[15px] text-ink-600">{dialogo.mensagem}</div>}
              {dialogo.digitar && (
                <div className="mt-4">
                  <p className="mb-1.5 text-sm text-ink-600">
                    Digite <strong className="text-ink-900">{dialogo.digitar}</strong> para confirmar:
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
              <div className="mt-6 grid grid-cols-2 gap-3">
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
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[70] flex flex-col items-center gap-2 px-4 lg:inset-x-auto lg:right-6 lg:bottom-6 lg:items-end">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className="flex animate-surgir items-center gap-2.5 rounded-2xl bg-ink-900 py-3 pr-5 pl-4 text-sm font-semibold text-white shadow-elevado"
            >
              {t.tipo === 'ok' ? <CheckCircle2 className="size-5 text-brand-400" /> : <XCircle className="size-5 text-red-400" />}
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
