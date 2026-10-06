import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Perfil } from '../types'

type Resultado = { ok: true; aguardandoConfirmacao?: boolean } | { ok: false; erro: string }

type AuthContextType = {
  session: Session | null
  perfil: Perfil | null
  carregando: boolean
  entrar(email: string, senha: string): Promise<Resultado>
  cadastrar(nome: string, email: string, senha: string): Promise<Resultado>
  sair(): Promise<void>
  recarregarPerfil(): Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function traduzirErro(mensagem: string): string {
  const m = mensagem.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos'
  if (m.includes('already registered') || m.includes('already been registered')) return 'E-mail já cadastrado'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'
  if (m.includes('invalid') && m.includes('email')) return 'E-mail inválido.'
  if (m.includes('password')) return 'Senha inválida. Use pelo menos 6 caracteres.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Aguarde um pouco e tente de novo.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Sem conexão com o servidor. Verifique sua internet.'
  return mensagem
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregando, setCarregando] = useState(true)
  const queryClient = useQueryClient()
  const usuarioAtual = useRef<string | null>(null)

  // Troca de usuário (login, logout): descarta o cache de dados da conta anterior.
  useEffect(() => {
    const id = session?.user.id ?? null
    if (id !== usuarioAtual.current) {
      usuarioAtual.current = id
      queryClient.clear()
    }
  }, [session, queryClient])

  const carregarPerfil = useCallback(async (s: Session | null) => {
    if (!s) {
      setPerfil(null)
      return
    }
    const { data } = await supabase.from('profiles').select('id, nome').eq('id', s.user.id).maybeSingle()
    const nomeMeta = (s.user.user_metadata?.nome as string | undefined) ?? s.user.email?.split('@')[0] ?? ''
    setPerfil(data ?? { id: s.user.id, nome: nomeMeta })
  }, [])

  useEffect(() => {
    let ativo = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo) return
      setSession(data.session)
      await carregarPerfil(data.session)
      if (ativo) setCarregando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSession(s)
      // fora do callback para não travar o cliente do Supabase
      setTimeout(() => void carregarPerfil(s), 0)
    })
    return () => {
      ativo = false
      sub.subscription.unsubscribe()
    }
  }, [carregarPerfil])

  const entrar = useCallback(async (email: string, senha: string): Promise<Resultado> => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha })
    return error ? { ok: false, erro: traduzirErro(error.message) } : { ok: true }
  }, [])

  const cadastrar = useCallback(async (nome: string, email: string, senha: string): Promise<Resultado> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: senha,
      options: {
        data: { nome: nome.trim() },
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    })
    if (error) return { ok: false, erro: traduzirErro(error.message) }
    // Com "Confirm email" ligado o Supabase não devolve sessão; se o e-mail já
    // existe, devolve um usuário sem identidades.
    if (data.user && data.user.identities?.length === 0) return { ok: false, erro: 'E-mail já cadastrado' }
    return { ok: true, aguardandoConfirmacao: !data.session }
  }, [])

  const sair = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const recarregarPerfil = useCallback(() => carregarPerfil(session), [carregarPerfil, session])

  const valor = useMemo(
    () => ({ session, perfil, carregando, entrar, cadastrar, sair, recarregarPerfil }),
    [session, perfil, carregando, entrar, cadastrar, sair, recarregarPerfil],
  )
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
