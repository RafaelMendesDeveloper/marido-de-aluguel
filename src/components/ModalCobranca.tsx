import { Check, CheckCheck, Copy, Download, ImageIcon, Loader2, MessageCircle, Pencil, Share2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { marcarComoPagos } from '../api/servicos'
import { useAuth } from '../auth/AuthContext'
import { useCliente, useInvalidar, useServicosDoCliente } from '../hooks/dados'
import { gerarImagemCobranca, textoCobranca, totalCobranca, type DadosCobranca } from '../lib/cobranca'
import { dataCurta, hojeISO } from '../lib/datas'
import { fmtBRL } from '../lib/moeda'
import { formatarChave, gerarPayloadPix, pixCompleto, rotuloTipo } from '../lib/pix'
import { profissaoPorId } from '../lib/profissoes'
import { linkWhatsApp } from '../lib/telefone'
import { normalizar } from '../lib/texto'
import { mensagemErro, useFeedback } from './Feedback'
import { FormPix } from './FormPix'
import { Modal } from './Modal'
import { Botao, Carregando, cx } from './ui'

export type AberturaCobranca = { clienteId: string; servicoIds?: string[] }

export function ModalCobranca({ abertura, onFechar }: { abertura: AberturaCobranca | null; onFechar: () => void }) {
  return abertura ? <Conteudo key={`${abertura.clienteId}-${abertura.servicoIds?.join(',') ?? ''}`} abertura={abertura} onFechar={onFechar} /> : null
}

function Conteudo({ abertura, onFechar }: { abertura: AberturaCobranca; onFechar: () => void }) {
  const { perfil, preferencias, salvarPreferencias } = useAuth()
  const { avisar, confirmar } = useFeedback()
  const invalidar = useInvalidar()
  const cliente = useCliente(abertura.clienteId)
  const servicos = useServicosDoCliente(abertura.clienteId)
  const [editandoPix, setEditandoPix] = useState(false)
  const [escolhidos, setEscolhidos] = useState<Set<string> | null>(null)

  const pendentes = useMemo(() => (servicos.data ?? []).filter((s) => !s.pago && (s.valor ?? 0) > 0), [servicos.data])
  const selecionados = escolhidos ?? new Set(abertura.servicoIds?.length ? abertura.servicoIds : pendentes.map((s) => s.id))
  const itens = pendentes.filter((s) => selecionados.has(s.id))
  const pix = preferencias.pix
  const nome = cliente.data?.nome ?? ''

  const alternar = (id: string) => {
    const novo = new Set(selecionados)
    if (novo.has(id)) novo.delete(id)
    else novo.add(id)
    setEscolhidos(novo)
  }

  const titulo = nome ? `Cobrar ${nome}` : 'Cobrar'
  const carregando = cliente.isPending || servicos.isPending

  if (carregando) {
    return (
      <Modal aberto onFechar={onFechar} titulo={titulo}>
        <Carregando />
      </Modal>
    )
  }

  if (!pixCompleto(pix) || editandoPix) {
    return (
      <Modal aberto onFechar={onFechar} titulo={pixCompleto(pix) ? 'Sua chave Pix' : 'Cadastre sua chave Pix'} subtitulo="Ela vai no QR Code da cobrança, já com o valor.">
        <FormPix
          inicial={pix}
          nomePadrao={perfil?.nome ?? ''}
          comTeste
          rotuloSalvar="Salvar e gerar cobrança"
          onSalvar={async (p) => {
            try {
              await salvarPreferencias({ pix: p })
              setEditandoPix(false)
            } catch (e) {
              avisar(mensagemErro(e), 'erro')
            }
          }}
        />
      </Modal>
    )
  }

  const dados: DadosCobranca = {
    profissional: perfil?.nome ?? pix.nome,
    profissao: profissaoPorId(preferencias.profissao)?.nome,
    cliente: nome,
    itens: itens.map((s) => ({ data: s.data, descricao: s.observacao || 'Serviço', valor: s.valor ?? 0 })),
    pix,
  }

  const receber = async () => {
    const ok = await confirmar({
      titulo: 'Recebeu o pagamento?',
      mensagem: `${itens.length} serviço(s) somando ${fmtBRL(totalCobranca(dados.itens))} passam para "Pago".`,
      confirmar: 'Sim, recebi',
    })
    if (!ok) return
    try {
      await marcarComoPagos(itens.map((s) => s.id))
      await invalidar()
      avisar('Pagamento registrado')
      onFechar()
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
    }
  }

  return (
    <Modal
      aberto
      onFechar={onFechar}
      titulo={titulo}
      subtitulo={itens.length ? `${itens.length} serviço${itens.length === 1 ? '' : 's'} · ${fmtBRL(totalCobranca(dados.itens))}` : 'Nada em aberto'}
      largura="xl"
    >
      {pendentes.length === 0 ? (
        <div className="py-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Check className="size-6" strokeWidth={3} />
          </span>
          <p className="mt-3 font-bold text-ink-900">{nome} não tem nada a pagar</p>
          <p className="mt-1 text-sm text-ink-500">Serviços marcados como "A receber" aparecem aqui para cobrar.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-ink-700">O que entra na cobrança</p>
              <ul className="divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-200">
                {pendentes.map((s) => {
                  const marcado = selecionados.has(s.id)
                  return (
                    <li key={s.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-ink-50">
                        <input type="checkbox" checked={marcado} onChange={() => alternar(s.id)} className="size-5 accent-brand-600" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold text-ink-900">{s.observacao || 'Serviço'}</span>
                          <span className="block text-xs text-ink-500">{dataCurta(s.data)}</span>
                        </span>
                        <span className={cx('tabular shrink-0 font-bold', marcado ? 'text-ink-900' : 'text-ink-400')}>{fmtBRL(s.valor)}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl bg-ink-50 px-4 py-3 text-sm">
              <span className="min-w-0 text-ink-600">
                Pix ({rotuloTipo(pix.tipo)}): <strong className="text-ink-900">{formatarChave(pix)}</strong>
              </span>
              <button type="button" onClick={() => setEditandoPix(true)} className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand-700 hover:underline">
                <Pencil className="size-3.5" /> Alterar
              </button>
            </div>

            {itens.length > 0 && (
              <Botao variante="secundario" largo onClick={receber}>
                <CheckCheck className="size-4" /> Já recebi — marcar como pago
              </Botao>
            )}
          </div>

          {itens.length > 0 ? (
            <Envio dados={dados} telefone={cliente.data?.telefone ?? null} />
          ) : (
            <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 p-8 text-center text-sm text-ink-500">
              Marque ao menos um serviço para gerar a cobrança.
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

/** Prévia da imagem e botões de envio. */
function Envio({ dados, telefone }: { dados: DadosCobranca; telefone: string | null }) {
  const { avisar } = useFeedback()
  const total = totalCobranca(dados.itens)
  const payload = useMemo(() => gerarPayloadPix(dados.pix, total), [dados.pix, total])
  const texto = textoCobranca(dados, payload)
  const chave = JSON.stringify([dados.itens, dados.pix, dados.cliente, dados.profissional, dados.profissao])
  const [imagem, setImagem] = useState<{ chave: string; blob: Blob; url: string } | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    let url: string | null = null
    gerarImagemCobranca(dados, payload)
      .then((blob) => {
        if (!ativo) return
        url = URL.createObjectURL(blob)
        setImagem({ chave, blob, url })
      })
      .catch((e) => ativo && setErro(mensagemErro(e)))
    return () => {
      ativo = false
      if (url) URL.revokeObjectURL(url)
    }
    // `chave` resume tudo o que muda a imagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, payload])

  const pronta = imagem?.chave === chave ? imagem : null
  const nomeArquivo = `cobranca-${normalizar(dados.cliente).replace(/[^a-z0-9]+/g, '-')}-${hojeISO()}.png`
  const arquivo = pronta ? new File([pronta.blob], nomeArquivo, { type: 'image/png' }) : null
  // Compartilhar arquivo só faz sentido no celular; no computador o caminho é WhatsApp Web + colar imagem.
  const toque = window.matchMedia('(pointer: coarse)').matches
  const podeCompartilhar = toque && Boolean(arquivo && navigator.canShare?.({ files: [arquivo] }))
  const linkTexto = telefone ? linkWhatsApp(telefone, texto) : `https://wa.me/?text=${encodeURIComponent(texto)}`

  const compartilhar = async () => {
    if (!arquivo) return
    try {
      await navigator.share({ files: [arquivo], text: texto })
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) avisar(mensagemErro(e), 'erro')
    }
  }

  const baixar = () => {
    if (!pronta) return
    const a = document.createElement('a')
    a.href = pronta.url
    a.download = nomeArquivo
    a.click()
  }

  const copiarImagem = async () => {
    if (!pronta) return
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pronta.blob })])
      avisar('Imagem copiada — cole no WhatsApp (Ctrl+V)')
    } catch {
      baixar()
      avisar('Seu navegador não copia imagens; baixamos o arquivo.')
    }
  }

  const copiarPix = async () => {
    try {
      await navigator.clipboard.writeText(payload)
      avisar('Pix copia e cola copiado')
    } catch {
      avisar('Não foi possível copiar', 'erro')
    }
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-ink-50">
        {pronta ? (
          <img src={pronta.url} alt="Prévia da cobrança" className="mx-auto max-h-[46dvh] w-auto object-contain lg:max-h-[52dvh]" />
        ) : erro ? (
          <p className="p-6 text-sm text-red-600">{erro}</p>
        ) : (
          <div className="flex h-64 items-center justify-center gap-2 text-sm text-ink-500">
            <Loader2 className="size-4 animate-spin" /> Gerando imagem…
          </div>
        )}
      </div>

      {podeCompartilhar ? (
        <>
          <Botao tamanho="lg" largo onClick={compartilhar} disabled={!pronta}>
            <Share2 className="size-5" /> Enviar imagem da cobrança
          </Botao>
          <a href={linkTexto} target="_blank" rel="noopener noreferrer" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] px-4 text-[15px] font-bold text-white hover:brightness-95">
            <MessageCircle className="size-4" /> Enviar mensagem com Pix copia e cola
          </a>
        </>
      ) : (
        <>
          <a href={linkTexto} target="_blank" rel="noopener noreferrer" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-4 text-base font-bold text-white hover:brightness-95">
            <MessageCircle className="size-5" /> Abrir WhatsApp com a mensagem
          </a>
          <div className="grid grid-cols-2 gap-2">
            <Botao variante="secundario" onClick={copiarImagem} disabled={!pronta}>
              <ImageIcon className="size-4" /> Copiar imagem
            </Botao>
            <Botao variante="secundario" onClick={baixar} disabled={!pronta}>
              <Download className="size-4" /> Baixar
            </Botao>
          </div>
          <p className="text-xs text-ink-500">No WhatsApp Web, depois de abrir a conversa, cole a imagem com Ctrl+V (⌘+V no Mac).</p>
        </>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Botao variante="fantasma" onClick={copiarPix}>
          <Copy className="size-4" /> Copiar Pix
        </Botao>
        {podeCompartilhar && (
          <Botao variante="fantasma" onClick={baixar} disabled={!pronta}>
            <Download className="size-4" /> Baixar imagem
          </Botao>
        )}
      </div>
    </div>
  )
}
