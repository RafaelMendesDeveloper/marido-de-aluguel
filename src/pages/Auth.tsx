import { ChevronLeft, MailCheck } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Botao, Campo, inputCls } from '../components/ui'

const RECURSOS = [
  { icone: '🗓️', titulo: 'Controle sua agenda', texto: 'De maneira rápida, organize seus serviços' },
  { icone: '📊', titulo: 'Controle financeiro', texto: 'Acompanhe suas finanças de forma prática e eficiente' },
  { icone: '⏰', titulo: 'Economia de tempo', texto: 'Realize suas tarefas de forma mais rápida e eficiente' },
]

function Tela({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-white px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      {children}
    </main>
  )
}

export function Landing() {
  const navigate = useNavigate()
  return (
    <Tela>
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">Orça! 💸</h1>
        <p className="mt-2 text-lg text-gray-500">Tempo é dinheiro, economize com Orça!</p>

        <ul className="mt-10 space-y-4">
          {RECURSOS.map((r) => (
            <li key={r.titulo} className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-2xl">{r.icone}</span>
              <span>
                <span className="block text-[17px] font-bold text-gray-900">{r.titulo}</span>
                <span className="block text-sm text-gray-500">{r.texto}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="my-10 flex items-center gap-3 text-xs font-bold tracking-widest text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          COMECE AGORA
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="space-y-3">
          <Botao onClick={() => navigate('/cadastro')}>Criar conta grátis</Botao>
          <Botao variante="secundario" onClick={() => navigate('/entrar')}>
            Já tenho conta — Entrar
          </Botao>
        </div>
      </div>
    </Tela>
  )
}

function Voltar() {
  return (
    <Link to="/bem-vindo" className="-ml-2 flex min-h-11 w-fit items-center gap-1 pr-3 font-semibold text-green-600">
      <ChevronLeft className="size-5" /> Voltar
    </Link>
  )
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
    <Tela>
      <Voltar />
      <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Entrar</h1>
      <p className="mt-1 text-gray-500">Acesse sua conta Orça!</p>
      <form onSubmit={enviar} className="mt-8 space-y-4" noValidate>
        <Campo label="E-mail">
          <input className={inputCls} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
        </Campo>
        <Campo label="Senha">
          <input className={inputCls} type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Sua senha" />
        </Campo>
        {erro && <p className="text-sm font-semibold text-red-600" role="alert">{erro}</p>}
        <Botao type="submit" carregando={enviando}>
          Entrar
        </Botao>
      </form>
      <p className="mt-6 text-center text-gray-500">
        Não tem conta?{' '}
        <Link to="/cadastro" className="font-bold text-green-600">
          Criar conta grátis
        </Link>
      </p>
    </Tela>
  )
}

export function Cadastro() {
  const { cadastrar } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmarEmail, setConfirmarEmail] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!nome.trim()) return setErro('Informe seu nome.')
    if (!email.trim()) return setErro('Informe seu e-mail.')
    if (senha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres.')
    if (senha !== confirmacao) return setErro('As senhas não coincidem.')
    setEnviando(true)
    const r = await cadastrar(nome, email, senha)
    setEnviando(false)
    if (!r.ok) setErro(r.erro)
    else if (r.aguardandoConfirmacao) setConfirmarEmail(true)
  }

  if (confirmarEmail) {
    return (
      <Tela>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-green-100 text-green-600">
            <MailCheck className="size-10" />
          </span>
          <h1 className="mt-6 text-2xl font-extrabold text-gray-900">Confirme seu e-mail</h1>
          <p className="mt-2 text-gray-500">
            Enviamos um link para <strong className="text-gray-900">{email.trim().toLowerCase()}</strong>. Abra-o para ativar a conta e depois entre.
          </p>
          <Botao className="mt-8" onClick={() => navigate('/entrar')}>
            Ir para o login
          </Botao>
        </div>
      </Tela>
    )
  }

  return (
    <Tela>
      <Voltar />
      <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Criar conta</h1>
      <p className="mt-1 text-gray-500">Comece a usar o Orça! gratuitamente</p>
      <form onSubmit={enviar} className="mt-8 space-y-4" noValidate>
        <Campo label="Nome">
          <input className={inputCls} autoComplete="name" autoCapitalize="words" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
        </Campo>
        <Campo label="E-mail">
          <input className={inputCls} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
        </Campo>
        <Campo label="Senha">
          <input className={inputCls} type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
        </Campo>
        <Campo label="Confirmar senha">
          <input className={inputCls} type="password" autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} placeholder="Repita a senha" />
        </Campo>
        {erro && <p className="text-sm font-semibold text-red-600" role="alert">{erro}</p>}
        <Botao type="submit" carregando={enviando}>
          Criar conta
        </Botao>
      </form>
      <p className="mt-6 text-center text-gray-500">
        Já tem conta?{' '}
        <Link to="/entrar" className="font-bold text-green-600">
          Entrar
        </Link>
      </p>
    </Tela>
  )
}
