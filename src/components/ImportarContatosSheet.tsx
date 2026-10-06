import { Contact, FileUp } from 'lucide-react'
import { useRef, useState } from 'react'
import { inserirClientes, type DadosCliente } from '../api/clientes'
import { useClientes, useInvalidar } from '../hooks/dados'
import { soDigitos } from '../lib/telefone'
import { normalizar } from '../lib/texto'
import { lerVcf, type ContatoImportado } from '../lib/vcard'
import { BottomSheet } from './BottomSheet'
import { mensagemErro, useFeedback } from './Feedback'
import { Botao } from './ui'

type ContactsManager = {
  select(props: string[], opcoes?: { multiple?: boolean }): Promise<{ name?: string[]; tel?: string[] }[]>
}

function seletorDeContatos(): ContactsManager | null {
  const nav = navigator as Navigator & { contacts?: ContactsManager }
  return nav.contacts && 'ContactsManager' in window ? nav.contacts : null
}

export function ImportarContatosSheet({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { data: clientes = [] } = useClientes()
  const invalidar = useInvalidar()
  const { avisar } = useFeedback()
  const arquivo = useRef<HTMLInputElement>(null)
  const [processando, setProcessando] = useState(false)
  const [resultado, setResultado] = useState<{ importados: number; existentes: number } | null>(null)
  const seletor = seletorDeContatos()

  const importar = async (contatos: ContatoImportado[]) => {
    // Dedup por telefone (só dígitos) e, para contatos sem telefone, por nome.
    const telefones = new Set(clientes.map((c) => c.telefone).filter(Boolean) as string[])
    const nomes = new Set(clientes.map((c) => normalizar(c.nome)))
    const novos: DadosCliente[] = []
    let existentes = 0
    for (const contato of contatos) {
      const nome = contato.nome.trim()
      if (!nome) continue
      const tel = contato.telefone ? soDigitos(contato.telefone) || null : null
      const repetido = tel ? telefones.has(tel) : nomes.has(normalizar(nome))
      if (repetido) {
        existentes++
        continue
      }
      if (tel) telefones.add(tel)
      nomes.add(normalizar(nome))
      novos.push({ nome, telefone: tel, endereco: null })
    }
    await inserirClientes(novos)
    await invalidar()
    setResultado({ importados: novos.length, existentes })
  }

  const executar = async (obter: () => Promise<ContatoImportado[]>) => {
    setProcessando(true)
    setResultado(null)
    try {
      const contatos = await obter()
      if (contatos.length) await importar(contatos)
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
    } finally {
      setProcessando(false)
    }
  }

  const daAgenda = () =>
    executar(async () => {
      const escolhidos = await seletor!.select(['name', 'tel'], { multiple: true })
      return escolhidos.map((c) => ({ nome: c.name?.[0] ?? '', telefone: c.tel?.[0] ?? null }))
    })

  const doArquivo = (file: File) =>
    executar(async () => {
      const contatos = lerVcf(await file.text())
      if (!contatos.length) throw new Error('Nenhum contato encontrado nesse arquivo.')
      return contatos
    })

  const fechar = () => {
    setResultado(null)
    onFechar()
  }

  return (
    <BottomSheet aberto={aberto} onFechar={fechar} titulo="Importar contatos">
      <div className="space-y-4">
        {resultado ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
            <p className="text-3xl font-extrabold text-green-700">{resultado.importados}</p>
            <p className="font-semibold text-green-800">contatos importados</p>
            {resultado.existentes > 0 && <p className="mt-1 text-sm text-gray-600">{resultado.existentes} já existiam</p>}
          </div>
        ) : (
          <p className="text-[15px] text-gray-600">
            Os contatos viram clientes com nome e o primeiro telefone. Quem já está cadastrado com o mesmo telefone (ou mesmo
            nome, se não tiver telefone) é ignorado.
          </p>
        )}

        {seletor && (
          <Botao onClick={daAgenda} carregando={processando}>
            <Contact className="size-5" /> Escolher da agenda
          </Botao>
        )}
        <Botao variante={seletor ? 'secundario' : 'primario'} onClick={() => arquivo.current?.click()} carregando={processando && !seletor}>
          <FileUp className="size-5" /> Importar arquivo .vcf
        </Botao>
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
        <details className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
          <summary className="cursor-pointer font-semibold text-gray-700">Como exportar o .vcf?</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>iPhone:</strong> app Contatos → Listas → toque e segure "Todos os contatos" → Exportar.
            </li>
            <li>
              <strong>Android:</strong> app Contatos → Corrigir e gerenciar (ou Configurações) → Exportar para arquivo.
            </li>
            <li>
              <strong>Google Contatos</strong> (contacts.google.com): Exportar → vCard.
            </li>
          </ul>
        </details>
      </div>
    </BottomSheet>
  )
}
