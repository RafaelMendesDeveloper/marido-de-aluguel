import { Check, Eye, EyeOff, MailCheck } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Botao, Campo, Logo, cx, inputCls } from '../components/ui'

function LayoutAuth({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-2">
      <main className="flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:px-10">
        <Link to="/" className="w-fit">
          <Logo />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </main>
      <aside className="relative hidden overflow-hidden bg-ink-950 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_70%_20%,rgb(34_197_94/0.35),transparent_70%),radial-gradient(50%_50%_at_10%_90%,rgb(16_185_129/0.25),transparent_70%)]" />
        <div className="relative flex h-full flex-col justify-center px-14 xl:px-20">
          <p className="text-sm font-bold tracking-wide text-brand-400">Orça!</p>
          <h2 className="mt-3 max-w-md text-4xl leading-tight font-extrabold tracking-tight text-white">Tempo é dinheiro. Economize os dois.</h2>
          <ul className="mt-10 space-y-5">
            {[
              ['Agenda do dia', 'Visitas com horário, endereço e rota no Maps.'],
              ['Registro em segundos', 'Cliente, valor, pago ou a receber. Pronto.'],
              ['Cobrança sem constrangimento', 'Mensagem pronta no WhatsApp com o valor certo.'],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
                  <Check className="size-4" strokeWidth={3} />
                </span>
                <span>
                  <span className="block font-bold text-white">{t}</span>
                  <span className="block text-ink-300">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}

function CampoSenha({ valor, onChange, novo }: { valor: string; onChange: (v: string) => void; novo?: boolean }) {
  const [visivel, setVisivel] = useState(false)
  return (
    <div className="relative">
      <input
        className={cx(inputCls, 'pr-12')}
        type={visivel ? 'text' : 'password'}
        autoComplete={novo ? 'new-password' : 'current-password'}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={novo ? 'Mínimo 6 caracteres' : 'Sua senha'}
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? 'Esconder senha' : 'Mostrar senha'}
        className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
      >
        {visivel ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  )
}

function Erro({ texto }: { texto: string }) {
  return texto ? (
    <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
      {texto}
    </p>
  ) : null
}

export function Login() {
  const { entrar } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!email.trim() || !senha) return setErro('Preencha e-mail e senha.')
    setEnviando(true)
    const r = await entrar(email, senha)
    setEnviando(false)
    if (!r.ok) setErro(r.erro)
  }

  return (
    <LayoutAuth>
      <h1 className="text-3xl font-extrabold tracking-tight text-ink-950">Bem-vindo de volta</h1>
      <p className="mt-2 text-ink-500">Entre para ver sua agenda e seus números.</p>
      <form onSubmit={enviar} className="mt-8 space-y-4" noValidate>
        <Campo label="E-mail">
          <input className={inputCls} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" autoFocus />
        </Campo>
        <Campo label="Senha">
          <CampoSenha valor={senha} onChange={setSenha} />
        </Campo>
        <Erro texto={erro} />
        <Botao type="submit" tamanho="lg" largo carregando={enviando}>
          Entrar
        </Botao>
      </form>
      <p className="mt-8 text-center text-ink-500">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="font-bold text-brand-700 hover:underline">
          Criar conta grátis
        </Link>
      </p>
    </LayoutAuth>
  )
}

export function Cadastro() {
  const { cadastrar } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmarEmail, setConfirmarEmail] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) return setErro('Informe seu nome.')
    if (!email.trim()) return setErro('Informe seu e-mail.')
    if (senha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres.')
    setEnviando(true)
    const r = await cadastrar(nome, email, senha)
    setEnviando(false)
    if (!r.ok) setErro(r.erro)
    else if (r.aguardandoConfirmacao) setConfirmarEmail(true)
  }

  if (confirmarEmail) {
    return (
      <LayoutAuth>
        <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <MailCheck className="size-8" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink-950">Confirme seu e-mail</h1>
        <p className="mt-2 text-ink-500">
          Enviamos um link para <strong className="text-ink-900">{email.trim().toLowerCase()}</strong>. Abra-o para ativar a conta e depois entre.
        </p>
        <Botao className="mt-8" tamanho="lg" largo onClick={() => navigate('/entrar')}>
          Ir para o login
        </Botao>
      </LayoutAuth>
    )
  }

  return (
    <LayoutAuth>
      <h1 className="text-3xl font-extrabold tracking-tight text-ink-950">Crie sua conta grátis</h1>
      <p className="mt-2 text-ink-500">Leva menos de um minuto. Sem cartão.</p>
      <form onSubmit={enviar} className="mt-8 space-y-4" noValidate>
        <Campo label="Seu nome">
          <input className={inputCls} autoComplete="name" autoCapitalize="words" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como quer ser chamado" autoFocus />
        </Campo>
        <Campo label="E-mail">
          <input className={inputCls} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
        </Campo>
        <Campo label="Senha">
          <CampoSenha valor={senha} onChange={setSenha} novo />
        </Campo>
        <Erro texto={erro} />
        <Botao type="submit" tamanho="lg" largo carregando={enviando}>
          Criar conta
        </Botao>
      </form>
      <p className="mt-8 text-center text-ink-500">
        Já tem conta?{' '}
        <Link to="/entrar" className="font-bold text-brand-700 hover:underline">
          Entrar
        </Link>
      </p>
    </LayoutAuth>
  )
}
