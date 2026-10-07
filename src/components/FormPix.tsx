import { QrCode } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { gerarPayloadPix, TIPOS_CHAVE, validarChave, type DadosPix, type TipoChave } from '../lib/pix'
import { Botao, Campo, Chip, cx, inputCls, labelCls } from './ui'

type Props = {
  inicial: DadosPix | null
  nomePadrao: string
  onSalvar: (pix: DadosPix) => Promise<void>
  rotuloSalvar?: string
  /** Botões extras ao lado do salvar (ex.: "Pular"). */
  extra?: ReactNode
  /** Mostra um QR de teste para conferir a chave no app do banco. */
  comTeste?: boolean
}

export function FormPix({ inicial, nomePadrao, onSalvar, rotuloSalvar = 'Salvar chave Pix', extra, comTeste }: Props) {
  const [tipo, setTipo] = useState<TipoChave>(inicial?.tipo ?? 'celular')
  const [chave, setChave] = useState(inicial?.chave ?? '')
  const [nome, setNome] = useState(inicial?.nome ?? nomePadrao)
  const [cidade, setCidade] = useState(inicial?.cidade ?? '')
  const [tocado, setTocado] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const erroChave = validarChave(tipo, chave)
  const valido = !erroChave && nome.trim() && cidade.trim()
  const placeholder = TIPOS_CHAVE.find((t) => t.id === tipo)!.placeholder
  const dados: DadosPix = { tipo, chave: chave.trim(), nome: nome.trim(), cidade: cidade.trim() }

  const salvar = async () => {
    setTocado(true)
    if (!valido) return
    setSalvando(true)
    try {
      await onSalvar(dados)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        void salvar()
      }}
    >
      <div>
        <span className={labelCls}>Tipo de chave</span>
        <div className="flex flex-wrap gap-2">
          {TIPOS_CHAVE.map((t) => (
            <Chip
              key={t.id}
              ativo={tipo === t.id}
              onClick={() => {
                setTipo(t.id)
                setTocado(false)
              }}
            >
              {t.rotulo}
            </Chip>
          ))}
        </div>
      </div>
      <Campo label="Chave Pix" dica={tocado && erroChave ? <Erro texto={erroChave} /> : undefined}>
        <input
          className={cx(inputCls, tocado && erroChave && 'border-red-400')}
          value={chave}
          onChange={(e) => setChave(e.target.value)}
          onBlur={() => chave && setTocado(true)}
          placeholder={placeholder}
          inputMode={tipo === 'email' ? 'email' : tipo === 'aleatoria' ? 'text' : 'numeric'}
          autoCapitalize="none"
          autoComplete="off"
        />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nome de quem recebe" dica={tocado && !nome.trim() ? <Erro texto="Informe o nome." /> : 'Aparece para o cliente na hora de pagar.'}>
          <input className={cx(inputCls, tocado && !nome.trim() && 'border-red-400')} value={nome} onChange={(e) => setNome(e.target.value)} autoCapitalize="words" maxLength={60} />
        </Campo>
        <Campo label="Cidade" dica={tocado && !cidade.trim() ? <Erro texto="Informe a cidade." /> : 'Exigida pelo QR Code do Pix.'}>
          <input className={cx(inputCls, tocado && !cidade.trim() && 'border-red-400')} value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex.: Florianópolis" autoCapitalize="words" maxLength={40} />
        </Campo>
      </div>

      {comTeste && valido && <QrTeste payload={gerarPayloadPix(dados)} />}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Botao type="submit" carregando={salvando}>
          {rotuloSalvar}
        </Botao>
        {extra}
      </div>
    </form>
  )
}

/** QR sem valor para o profissional conferir a chave no próprio banco. */
function QrTeste({ payload }: { payload: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [aberto, setAberto] = useState(false)
  useEffect(() => {
    if (!aberto) return
    let ativo = true
    void import('qrcode').then((QR) => QR.toDataURL(payload, { margin: 1, width: 360 })).then((u) => ativo && setUrl(u))
    return () => {
      ativo = false
    }
  }, [aberto, payload])

  if (!aberto) {
    return (
      <button type="button" onClick={() => setAberto(true)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline">
        <QrCode className="size-4" /> Testar no app do meu banco
      </button>
    )
  }
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-ink-200 bg-ink-50 p-4">
      {url ? <img src={url} alt="QR Code Pix de teste" className="size-32 rounded-lg bg-white p-1" /> : <div className="size-32 animate-pulse rounded-lg bg-ink-200" />}
      <p className="text-sm text-ink-600">
        Abra o app do seu banco em <strong>Pix → Ler QR code</strong> e confira se aparecem seu nome e sua chave. Não precisa concluir o pagamento.
      </p>
    </div>
  )
}

function Erro({ texto }: { texto: string }) {
  return <span className="font-semibold text-red-600">{texto}</span>
}
