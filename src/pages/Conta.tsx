import { LogOut, Plus, Sparkles, Trash2, Upload } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { apagarTodosOsDados, atualizarNome } from '../api/conta'
import { useAuth } from '../auth/AuthContext'
import { useAcoes } from '../components/Acoes'
import { useServicosFrequentes } from '../components/Atalhos'
import { mensagemErro, useFeedback } from '../components/Feedback'
import { Avatar, Botao, CabecalhoPagina, Cartao, Chip, inputCls } from '../components/ui'
import { useInvalidar } from '../hooks/dados'
import { PROFISSOES, profissaoPorId } from '../lib/profissoes'

function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <Cartao className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[260px_1fr] lg:gap-8">
      <div>
        <h2 className="font-bold text-ink-900">{titulo}</h2>
        {descricao && <p className="mt-1 text-sm text-ink-500">{descricao}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </Cartao>
  )
}

/** Remonta quando o perfil chega/muda, para o campo de nome começar preenchido. */
export function Conta() {
  const { perfil } = useAuth()
  return <ContaConteudo key={perfil?.nome ?? ''} />
}

function ContaConteudo() {
  const { session, perfil, sair, recarregarPerfil, preferencias, salvarPreferencias } = useAuth()
  const acoes = useAcoes()
  const { avisar, confirmar } = useFeedback()
  const invalidar = useInvalidar()
  const navigate = useNavigate()
  const frequentesAtuais = useServicosFrequentes()
  const [nome, setNome] = useState(perfil?.nome ?? '')
  const [salvandoNome, setSalvandoNome] = useState(false)
  const [novoServico, setNovoServico] = useState('')
  const uid = session?.user.id

  const salvarNome = async () => {
    if (!uid || !nome.trim()) return
    setSalvandoNome(true)
    try {
      await atualizarNome(uid, nome.trim())
      await recarregarPerfil()
      avisar('Nome atualizado')
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
    } finally {
      setSalvandoNome(false)
    }
  }

  const salvarServicos = async (lista: string[]) => {
    try {
      await salvarPreferencias({ servicosFrequentes: lista })
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
    }
  }

  const escolherProfissao = async (id: string) => {
    try {
      await salvarPreferencias({ profissao: id, servicosFrequentes: profissaoPorId(id)?.servicos ?? [] })
      avisar('Serviços frequentes atualizados')
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
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

  return (
    <>
      <CabecalhoPagina titulo="Minha conta" subtitulo={session?.user.email} />
      <div className="space-y-4">
        <Secao titulo="Perfil" descricao="Como o Orça! te chama.">
          <div className="flex items-center gap-4">
            <Avatar nome={nome || '?'} tamanho="lg" />
            <form
              className="flex min-w-0 flex-1 gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void salvarNome()
              }}
            >
              <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} aria-label="Seu nome" autoCapitalize="words" />
              <Botao type="submit" variante="secundario" disabled={!nome.trim() || nome.trim() === perfil?.nome} carregando={salvandoNome}>
                Salvar
              </Botao>
            </form>
          </div>
        </Secao>

        <Secao titulo="Seu trabalho" descricao="Os serviços frequentes viram atalhos na hora de agendar e registrar.">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PROFISSOES.map((p) => (
                <Chip key={p.id} ativo={preferencias.profissao === p.id} onClick={() => void escolherProfissao(p.id)}>
                  {p.emoji} {p.nome}
                </Chip>
              ))}
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-ink-700">Serviços frequentes</p>
              <div className="flex flex-wrap gap-2">
                {frequentesAtuais.map((s) => (
                  <span key={s} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-brand-50 pr-1 pl-3.5 text-sm font-semibold text-brand-800">
                    {s}
                    <button
                      type="button"
                      aria-label={`Remover ${s}`}
                      onClick={() => void salvarServicos(frequentesAtuais.filter((x) => x !== s))}
                      className="flex size-7 items-center justify-center rounded-full hover:bg-brand-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  const t = novoServico.trim()
                  if (t && !frequentesAtuais.includes(t)) void salvarServicos([...frequentesAtuais, t])
                  setNovoServico('')
                }}
              >
                <input className={inputCls} value={novoServico} onChange={(e) => setNovoServico(e.target.value)} placeholder="Adicionar serviço (ex.: Instalar suporte de TV)" />
                <Botao type="submit" variante="secundario" disabled={!novoServico.trim()} aria-label="Adicionar">
                  <Plus className="size-4" />
                </Botao>
              </form>
            </div>
          </div>
        </Secao>

        <Secao titulo="Clientes" descricao="Traga contatos da agenda do celular ou de um arquivo .vcf.">
          <div className="flex flex-wrap gap-2">
            <Botao variante="secundario" onClick={acoes.importarContatos}>
              <Upload className="size-4" /> Importar contatos
            </Botao>
            <Botao variante="fantasma" onClick={() => navigate('/boas-vindas')}>
              <Sparkles className="size-4" /> Rever boas-vindas
            </Botao>
          </div>
        </Secao>

        <Secao titulo="Sessão">
          <Botao variante="secundario" onClick={async () => (await confirmar({ titulo: 'Sair da conta?', confirmar: 'Sair' })) && (await sair())}>
            <LogOut className="size-4" /> Sair da conta
          </Botao>
        </Secao>

        <Secao titulo="Zona de perigo" descricao="Apaga definitivamente todos os clientes, serviços e agendamentos.">
          <Botao variante="perigoSuave" onClick={apagarTudo}>
            <Trash2 className="size-4" /> Apagar todos os dados
          </Botao>
        </Secao>

        <p className="pt-2 text-center text-xs text-ink-400">Orça! · versão {__APP_VERSION__}</p>
      </div>
    </>
  )
}
