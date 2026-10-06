import { LogOut, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apagarTodosOsDados, atualizarNome } from '../api/conta'
import { useAuth } from '../auth/AuthContext'
import { BottomSheet } from '../components/BottomSheet'
import { mensagemErro, useFeedback } from '../components/Feedback'
import { Avatar, BarraTopo, Botao, Campo, Cartao, inputCls } from '../components/ui'
import { useInvalidar } from '../hooks/dados'

export function Conta() {
  const { session, perfil, sair, recarregarPerfil } = useAuth()
  const { avisar, confirmar } = useFeedback()
  const invalidar = useInvalidar()
  const navigate = useNavigate()
  const [editandoNome, setEditandoNome] = useState(false)
  const [nome, setNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const uid = session?.user.id

  const salvarNome = async () => {
    if (!uid) return
    setSalvando(true)
    try {
      await atualizarNome(uid, nome.trim())
      await recarregarPerfil()
      avisar('Nome atualizado')
      setEditandoNome(false)
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
    } finally {
      setSalvando(false)
    }
  }

  const apagarTudo = async () => {
    if (!uid) return
    const ok = await confirmar({
      titulo: 'Apagar tudo?',
      mensagem: 'Remove todos os seus clientes, serviços e agendamentos. Sem volta.',
      confirmar: 'Apagar tudo',
      perigo: true,
      digitar: 'APAGAR',
    })
    if (!ok) return
    try {
      await apagarTodosOsDados(uid)
      await invalidar()
      avisar('Todos os dados foram apagados')
      navigate('/')
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
    }
  }

  const sairDaConta = async () => {
    if (await confirmar({ titulo: 'Sair da conta?', confirmar: 'Sair' })) await sair()
  }

  return (
    <div className="pb-24">
      <BarraTopo titulo="Minha conta" />
      <div className="space-y-4 p-4">
        <Cartao className="flex items-center gap-4 p-4">
          <Avatar nome={perfil?.nome ?? '?'} tamanho="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-extrabold text-gray-900">{perfil?.nome}</p>
            <p className="truncate text-sm text-gray-500">{session?.user.email}</p>
          </div>
          <button
            type="button"
            aria-label="Editar nome"
            onClick={() => {
              setNome(perfil?.nome ?? '')
              setEditandoNome(true)
            }}
            className="flex size-11 items-center justify-center rounded-full text-gray-500 active:bg-gray-100"
          >
            <Pencil className="size-5" />
          </button>
        </Cartao>

        <Botao variante="secundario" onClick={sairDaConta}>
          <LogOut className="size-5" /> Sair da conta
        </Botao>

        <section className="rounded-2xl border border-red-200 bg-white p-4">
          <h2 className="text-xs font-bold tracking-wider text-red-600 uppercase">Zona de perigo</h2>
          <p className="mt-1 mb-3 text-sm text-gray-600">Apaga definitivamente todos os clientes, serviços e agendamentos da sua conta.</p>
          <Botao variante="perigoSuave" onClick={apagarTudo}>
            <Trash2 className="size-5" /> Apagar todos os dados
          </Botao>
        </section>

        <p className="pt-2 text-center text-xs text-gray-400">Orça! · versão {__APP_VERSION__}</p>
      </div>

      <BottomSheet aberto={editandoNome} onFechar={() => setEditandoNome(false)} titulo="Seu nome">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (nome.trim()) void salvarNome()
          }}
        >
          <Campo label="Nome">
            <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus autoCapitalize="words" />
          </Campo>
          <Botao type="submit" disabled={!nome.trim()} carregando={salvando}>
            Salvar
          </Botao>
        </form>
      </BottomSheet>
    </div>
  )
}
