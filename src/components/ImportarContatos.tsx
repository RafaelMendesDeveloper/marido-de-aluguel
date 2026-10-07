import { CheckCircle2, ChevronDown, Contact, FileUp, Keyboard, Loader2 } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { useImportarContatos } from '../hooks/importarContatos'
import { Modal } from './Modal'
import { Botao, cx, inputCls } from './ui'

function Opcao({ icone, titulo, texto, onClick, destaque, desabilitado }: {
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
        'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition disabled:opacity-60',
        destaque ? 'border-brand-600/30 bg-brand-50 hover:bg-brand-100' : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50',
      )}
    >
      <span className={cx('flex size-11 shrink-0 items-center justify-center rounded-xl', destaque ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600')}>
        {icone}
      </span>
      <span className="min-w-0">
        <span className="block font-bold text-ink-900">{titulo}</span>
        <span className="block text-sm text-ink-500">{texto}</span>
      </span>
    </button>
  )
}

/** Opções de importação. Usado no modal e no onboarding. */
export function PainelImportacao() {
  const { processando, resultado, suportaAgenda, daAgenda, doArquivo, deNomes } = useImportarContatos()
  const arquivo = useRef<HTMLInputElement>(null)
  const [digitando, setDigitando] = useState(false)
  const [nomes, setNomes] = useState('')

  return (
    <div className="space-y-3">
      {resultado && (
        <div className="flex items-center gap-3 rounded-2xl bg-brand-600 p-4 text-white">
          <CheckCircle2 className="size-6 shrink-0" />
          <p className="text-sm">
            <strong className="text-base">{resultado.importados} clientes adicionados</strong>
            {resultado.existentes > 0 && <span className="block text-brand-100">{resultado.existentes} já estavam cadastrados</span>}
          </p>
        </div>
      )}
      {processando && (
        <p className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="size-4 animate-spin" /> Importando…
        </p>
      )}

      {suportaAgenda && (
        <Opcao destaque icone={<Contact className="size-5" />} titulo="Escolher da agenda do celular" texto="Selecione os contatos — leva segundos." onClick={() => void daAgenda()} desabilitado={processando} />
      )}
      <Opcao
        destaque={!suportaAgenda}
        icone={<FileUp className="size-5" />}
        titulo="Importar arquivo de contatos (.vcf)"
        texto="Exportado do iPhone, Android ou Google Contatos."
        onClick={() => arquivo.current?.click()}
        desabilitado={processando}
      />
      <Opcao icone={<Keyboard className="size-5" />} titulo="Digitar uma lista" texto="Um cliente por linha, com telefone se quiser." onClick={() => setDigitando((d) => !d)} />

      {digitando && (
        <div className="rounded-2xl border border-ink-200 bg-ink-50 p-3">
          <textarea
            className={`${inputCls} min-h-32 resize-y`}
            value={nomes}
            onChange={(e) => setNomes(e.target.value)}
            placeholder={'Dona Maria 11 99999-1234\nSeu João\nPadaria Central 11 3333-4444'}
            autoFocus
          />
          <Botao
            className="mt-2"
            largo
            disabled={!nomes.trim()}
            carregando={processando}
            onClick={async () => {
              if (await deNomes(nomes)) {
                setNomes('')
                setDigitando(false)
              }
            }}
          >
            Adicionar {nomes.split('\n').filter((l) => l.trim()).length || ''} clientes
          </Botao>
        </div>
      )}

      <input
        ref={arquivo}
        type="file"
        accept=".vcf,text/vcard,text/x-vcard"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) void doArquivo(f)
        }}
      />

      <details className="group rounded-xl px-1 text-sm text-ink-600">
        <summary className="flex cursor-pointer list-none items-center gap-1 font-semibold text-ink-700">
          Como gerar o arquivo .vcf? <ChevronDown className="size-4 transition group-open:rotate-180" />
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>iPhone:</strong> Contatos → Listas → toque e segure "Todos os contatos" → Exportar.
          </li>
          <li>
            <strong>Android:</strong> Contatos → Corrigir e gerenciar → Exportar para arquivo.
          </li>
          <li>
            <strong>Google Contatos</strong> (contacts.google.com): Exportar → vCard.
          </li>
        </ul>
      </details>
    </div>
  )
}

export function ModalImportarContatos({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Importar clientes" subtitulo="Quem já está cadastrado é ignorado.">
      {aberto && <PainelImportacao />}
    </Modal>
  )
}
