import { ArrowLeft, ArrowRight, CalendarPlus, Check, LayoutDashboard, Plus, Receipt } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useAcoes } from '../components/Acoes'
import { mensagemErro, useFeedback } from '../components/Feedback'
import { PainelImportacao } from '../components/ImportarContatos'
import { Botao, Logo, cx, inputCls } from '../components/ui'
import { useClientes } from '../hooks/dados'
import { PROFISSOES, profissaoPorId } from '../lib/profissoes'
import { primeiroNome } from '../lib/texto'

const PASSOS = ['Seu trabalho', 'Seus serviços', 'Seus clientes'] as const

export function Onboarding() {
  const { perfil, preferencias, salvarPreferencias } = useAuth()
  const acoes = useAcoes()
  const navigate = useNavigate()
  const { avisar } = useFeedback()
  const clientes = useClientes()

  const [passo, setPasso] = useState(0)
  const [profissao, setProfissao] = useState<string | null>(preferencias.profissao)
  const [servicos, setServicos] = useState<string[]>(preferencias.servicosFrequentes)
  const [novo, setNovo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const escolherProfissao = (id: string) => {
    setProfissao(id)
    // sugere os serviços típicos da profissão (o usuário ajusta no próximo passo)
    setServicos(profissaoPorId(id)?.servicos ?? [])
  }

  const alternar = (s: string) => setServicos((lista) => (lista.includes(s) ? lista.filter((x) => x !== s) : [...lista, s]))

  const adicionar = () => {
    const t = novo.trim()
    if (t && !servicos.some((s) => s.toLowerCase() === t.toLowerCase())) setServicos((l) => [...l, t])
    setNovo('')
  }

  const concluir = async (depois?: () => void) => {
    setSalvando(true)
    try {
      await salvarPreferencias({ profissao, servicosFrequentes: servicos, onboardingConcluido: true })
      navigate('/', { replace: true })
      depois?.()
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
      setSalvando(false)
    }
  }

  const sugestoes = [...new Set([...(profissaoPorId(profissao)?.servicos ?? []), ...servicos])]
  const final = passo === PASSOS.length

  return (
    <div className="flex min-h-dvh flex-col bg-ink-50">
      <header className="border-b border-ink-200/70 bg-white pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo />
          {!final && (
            <button type="button" onClick={() => void concluir()} className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-500 hover:bg-ink-100 hover:text-ink-800">
              Pular
            </button>
          )}
        </div>
        {!final && (
          <div className="mx-auto max-w-3xl px-4 pb-4 sm:px-6">
            <div className="flex gap-2">
              {PASSOS.map((p, i) => (
                <div key={p} className="flex-1">
                  <div className={cx('h-1.5 rounded-full transition-colors', i <= passo ? 'bg-brand-600' : 'bg-ink-200')} />
                  <p className={cx('mt-1.5 hidden text-xs font-semibold sm:block', i <= passo ? 'text-brand-700' : 'text-ink-400')}>
                    {i + 1}. {p}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {passo === 0 && (
          <Etapa
            titulo={`Prazer, ${primeiroNome(perfil?.nome ?? '') || 'profissional'}! O que você faz?`}
            texto="Vamos deixar o Orça! com a sua cara. Leva menos de um minuto."
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {PROFISSOES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => escolherProfissao(p.id)}
                  aria-pressed={profissao === p.id}
                  className={cx(
                    'relative flex flex-col items-start gap-3 rounded-2xl border-2 bg-white p-4 text-left transition',
                    profissao === p.id ? 'border-brand-600 shadow-marca' : 'border-transparent shadow-card hover:border-ink-200',
                  )}
                >
                  <span className="text-3xl">{p.emoji}</span>
                  <span className="font-bold text-ink-900">{p.nome}</span>
                  {profissao === p.id && (
                    <span className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-brand-600 text-white">
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Etapa>
        )}

        {passo === 1 && (
          <Etapa titulo="Quais serviços você mais faz?" texto="Eles viram atalhos: na hora de agendar ou registrar, é só tocar em vez de digitar.">
            <div className="rounded-2xl bg-white p-4 shadow-card sm:p-5">
              <div className="flex flex-wrap gap-2">
                {sugestoes.map((s) => {
                  const ativo = servicos.includes(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => alternar(s)}
                      aria-pressed={ativo}
                      className={cx(
                        'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition',
                        ativo ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                      )}
                    >
                      {ativo && <Check className="size-4" strokeWidth={3} />} {s}
                    </button>
                  )
                })}
                {sugestoes.length === 0 && <p className="text-sm text-ink-500">Adicione abaixo os serviços que você costuma fazer.</p>}
              </div>
              <form
                className="mt-4 flex gap-2 border-t border-ink-100 pt-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  adicionar()
                }}
              >
                <input className={inputCls} value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Outro serviço (ex.: Instalar ar-condicionado)" />
                <Botao type="submit" variante="secundario" disabled={!novo.trim()} aria-label="Adicionar serviço">
                  <Plus className="size-5" />
                </Botao>
              </form>
            </div>
            <p className="mt-3 text-sm text-ink-500">{servicos.length} selecionado{servicos.length === 1 ? '' : 's'} · dá para mudar depois em Minha conta.</p>
          </Etapa>
        )}

        {passo === 2 && (
          <Etapa titulo="Traga seus clientes" texto="Com os clientes no Orça!, agendar e registrar vira questão de dois toques. Você também pode pular e cadastrar aos poucos.">
            <PainelImportacao />
            {(clientes.data?.length ?? 0) > 0 && (
              <p className="mt-4 text-sm font-semibold text-brand-700">
                Você tem {clientes.data!.length} cliente{clientes.data!.length === 1 ? '' : 's'} cadastrado{clientes.data!.length === 1 ? '' : 's'}.
              </p>
            )}
          </Etapa>
        )}

        {final && (
          <div className="mx-auto max-w-xl text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-600 text-3xl text-white shadow-marca">🎉</span>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">Tudo pronto!</h1>
            <p className="mt-3 text-lg text-ink-600">Por onde você quer começar?</p>
            <div className="mt-8 grid gap-3 text-left">
              <Final
                destaque
                icone={<CalendarPlus className="size-6" />}
                titulo="Agendar uma visita"
                texto="Marque dia, horário e o serviço."
                onClick={() => void concluir(() => acoes.novoAgendamento())}
                desabilitado={salvando}
              />
              <Final
                icone={<Receipt className="size-6" />}
                titulo="Registrar um serviço feito"
                texto="Anote o valor e se já recebeu."
                onClick={() => void concluir(() => acoes.novoServico())}
                desabilitado={salvando}
              />
              <Final icone={<LayoutDashboard className="size-6" />} titulo="Ir para o painel" texto="Ver sua agenda e seus números." onClick={() => void concluir()} desabilitado={salvando} />
            </div>
          </div>
        )}
      </main>

      {!final && (
        <footer className="sticky bottom-0 border-t border-ink-200/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
            {passo > 0 && (
              <Botao variante="fantasma" tamanho="lg" onClick={() => setPasso((p) => p - 1)}>
                <ArrowLeft className="size-5" /> <span className="hidden sm:inline">Voltar</span>
              </Botao>
            )}
            <Botao tamanho="lg" className="ml-auto min-w-40 flex-1 sm:flex-none" disabled={passo === 0 && !profissao} onClick={() => setPasso((p) => p + 1)}>
              {passo === 2 ? ((clientes.data?.length ?? 0) > 0 ? 'Continuar' : 'Pular por enquanto') : 'Continuar'} <ArrowRight className="size-5" />
            </Botao>
          </div>
        </footer>
      )}
    </div>
  )
}

function Etapa({ titulo, texto, children }: { titulo: string; texto: string; children: ReactNode }) {
  return (
    <div className="animate-surgir">
      <h1 className="text-[28px] leading-tight font-extrabold tracking-tight text-ink-950 sm:text-4xl">{titulo}</h1>
      <p className="mt-2 mb-8 text-[17px] text-ink-600">{texto}</p>
      {children}
    </div>
  )
}

function Final({ icone, titulo, texto, onClick, destaque, desabilitado }: {
  icone: ReactNode
  titulo: string
  texto: string
  onClick: () => void
  destaque?: boolean
  desabilitado?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      className={cx(
        'flex items-center gap-4 rounded-2xl border p-5 transition hover:-translate-y-0.5 disabled:opacity-60',
        destaque ? 'border-brand-600/30 bg-white shadow-marca' : 'border-ink-200 bg-white shadow-card hover:shadow-elevado',
      )}
    >
      <span className={cx('flex size-12 shrink-0 items-center justify-center rounded-xl', destaque ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700')}>{icone}</span>
      <span className="flex-1">
        <span className="block text-lg font-bold text-ink-900">{titulo}</span>
        <span className="block text-sm text-ink-500">{texto}</span>
      </span>
      <ArrowRight className="size-5 text-ink-300" />
    </button>
  )
}
