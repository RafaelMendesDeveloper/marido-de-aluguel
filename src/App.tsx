import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { TabBar } from './components/TabBar'
import { Carregando } from './components/ui'
import { supabaseConfigurado } from './lib/supabase'
import { Agenda } from './pages/Agenda'
import { Cadastro, Landing, Login } from './pages/Auth'
import { ClientePerfil } from './pages/ClientePerfil'
import { Clientes } from './pages/Clientes'
import { ConfiguracaoPendente } from './pages/ConfiguracaoPendente'
import { Conta } from './pages/Conta'
import { Financeiro } from './pages/Financeiro'
import { Historico } from './pages/Historico'
import { Inicio } from './pages/Inicio'
import { NovoAgendamento } from './pages/NovoAgendamento'
import { NovoServico } from './pages/NovoServico'

/** Rotas que exigem login; quem não está logado vai para a landing. */
function Protegido() {
  const { session, carregando } = useAuth()
  if (carregando) return <Carregando />
  return session ? <Outlet /> : <Navigate to="/bem-vindo" replace />
}

/** Landing/login/cadastro: quem já está logado vai para o Início. */
function SoVisitante() {
  const { session, carregando } = useAuth()
  if (carregando) return <Carregando />
  return session ? <Navigate to="/" replace /> : <Outlet />
}

function ComAbas() {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-gray-50 pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <Outlet />
      <TabBar />
    </div>
  )
}

function SemAbas() {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-white">
      <Outlet />
    </div>
  )
}

export default function App() {
  if (!supabaseConfigurado) return <ConfiguracaoPendente />
  return (
    <Routes>
      <Route element={<SoVisitante />}>
        <Route path="/bem-vindo" element={<Landing />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
      </Route>
      <Route element={<Protegido />}>
        <Route element={<ComAbas />}>
          <Route index element={<Inicio />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClientePerfil />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/conta" element={<Conta />} />
        </Route>
        <Route element={<SemAbas />}>
          <Route path="/servicos/novo" element={<NovoServico />} />
          <Route path="/agendamentos/novo" element={<NovoAgendamento />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
