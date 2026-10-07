import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { AcoesProvider } from './components/Acoes'
import { AppShell } from './components/AppShell'
import { LogoMarca } from './components/ui'
import { supabaseConfigurado } from './lib/supabase'
import { Agenda } from './pages/Agenda'
import { Cadastro, Login } from './pages/Auth'
import { ClientePerfil } from './pages/ClientePerfil'
import { ClienteNenhumSelecionado, ClientesLayout } from './pages/Clientes'
import { ConfiguracaoPendente } from './pages/ConfiguracaoPendente'
import { Conta } from './pages/Conta'
import { Financeiro } from './pages/Financeiro'
import { Historico } from './pages/Historico'
import { Inicio } from './pages/Inicio'
import { Landing } from './pages/Landing'
import { Onboarding } from './pages/Onboarding'

function Abertura() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Carregando">
      <LogoMarca className="size-14 animate-pulse" />
    </div>
  )
}

/** Logado: ações globais + rotas internas. Visitante: landing na raiz, login no resto. */
function Protegido() {
  const { session, carregando } = useAuth()
  const { pathname } = useLocation()
  if (carregando) return <Abertura />
  if (!session) return pathname === '/' ? <Landing /> : <Navigate to="/entrar" replace />
  return (
    <AcoesProvider>
      <Outlet />
    </AcoesProvider>
  )
}

/** Primeiro acesso passa pelas boas-vindas. */
function ExigeOnboarding() {
  const { preferencias } = useAuth()
  return preferencias.onboardingConcluido ? <AppShell /> : <Navigate to="/boas-vindas" replace />
}

function SoVisitante() {
  const { session, carregando } = useAuth()
  if (carregando) return <Abertura />
  return session ? <Navigate to="/" replace /> : <Outlet />
}

export default function App() {
  if (!supabaseConfigurado) return <ConfiguracaoPendente />
  return (
    <Routes>
      <Route element={<SoVisitante />}>
        <Route path="/entrar" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
      </Route>
      <Route element={<Protegido />}>
        <Route path="/boas-vindas" element={<Onboarding />} />
        <Route element={<ExigeOnboarding />}>
          <Route index element={<Inicio />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/clientes" element={<ClientesLayout />}>
            <Route index element={<ClienteNenhumSelecionado />} />
            <Route path=":id" element={<ClientePerfil />} />
          </Route>
          <Route path="/historico" element={<Historico />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/conta" element={<Conta />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
