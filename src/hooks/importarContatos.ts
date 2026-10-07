import { useState } from 'react'
import { inserirClientes, listarClientes, type DadosCliente } from '../api/clientes'
import { mensagemErro, useFeedback } from '../components/Feedback'
import { soDigitos } from '../lib/telefone'
import { normalizar } from '../lib/texto'
import { lerVcf, type ContatoImportado } from '../lib/vcard'
import { useInvalidar } from './dados'

type ContactsManager = {
  select(props: string[], opcoes?: { multiple?: boolean }): Promise<{ name?: string[]; tel?: string[] }[]>
}

function seletorDeContatos(): ContactsManager | null {
  const nav = navigator as Navigator & { contacts?: ContactsManager }
  return nav.contacts && 'ContactsManager' in window ? nav.contacts : null
}

export type ResultadoImportacao = { importados: number; existentes: number }

/**
 * Importa contatos como clientes: da agenda do celular (Contact Picker,
 * Chrome/Android), de um arquivo .vcf ou de nomes digitados (um por linha).
 * Ignora quem já existe pelo telefone — ou pelo nome, se não houver telefone.
 */
export function useImportarContatos() {
  const invalidar = useInvalidar()
  const { avisar } = useFeedback()
  const [processando, setProcessando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)
  const seletor = seletorDeContatos()

  const importar = async (contatos: ContatoImportado[]): Promise<ResultadoImportacao> => {
    const clientes = await listarClientes()
    const telefones = new Set(clientes.map((c) => c.telefone).filter(Boolean) as string[])
    const nomes = new Set(clientes.map((c) => normalizar(c.nome)))
    const novos: DadosCliente[] = []
    let existentes = 0
    for (const contato of contatos) {
      const nome = contato.nome.trim()
      if (!nome) continue
      const tel = contato.telefone ? soDigitos(contato.telefone) || null : null
      if (tel ? telefones.has(tel) : nomes.has(normalizar(nome))) {
        existentes++
        continue
      }
      if (tel) telefones.add(tel)
      nomes.add(normalizar(nome))
      novos.push({ nome, telefone: tel, endereco: null })
    }
    await inserirClientes(novos)
    await invalidar()
    return { importados: novos.length, existentes }
  }

  const executar = async (obter: () => Promise<ContatoImportado[]>) => {
    setProcessando(true)
    try {
      const contatos = await obter()
      if (!contatos.length) return null
      const r = await importar(contatos)
      setResultado((anterior) => ({
        importados: (anterior?.importados ?? 0) + r.importados,
        existentes: (anterior?.existentes ?? 0) + r.existentes,
      }))
      return r
    } catch (e) {
      // usuário fechou o seletor de contatos: não é erro
      if (!(e instanceof DOMException && e.name === 'AbortError')) avisar(mensagemErro(e), 'erro')
      return null
    } finally {
      setProcessando(false)
    }
  }

  return {
    processando,
    resultado,
    suportaAgenda: Boolean(seletor),
    daAgenda: () =>
      executar(async () => {
        const escolhidos = await seletor!.select(['name', 'tel'], { multiple: true })
        return escolhidos.map((c) => ({ nome: c.name?.[0] ?? '', telefone: c.tel?.[0] ?? null }))
      }),
    doArquivo: (file: File) =>
      executar(async () => {
        const contatos = lerVcf(await file.text())
        if (!contatos.length) throw new Error('Nenhum contato encontrado nesse arquivo.')
        return contatos
      }),
    deNomes: (texto: string) =>
      executar(async () =>
        texto
          .split(/\r?\n/)
          .map((linha) => linha.trim())
          .filter(Boolean)
          .map((linha) => {
            // "Maria 11 99999-9999" → nome + telefone
            const m = linha.match(/^(.*?)[\s,;-]*(\+?[\d\s().-]{8,})$/)
            return m && m[1].trim() ? { nome: m[1].trim(), telefone: m[2] } : { nome: linha, telefone: null }
          }),
      ),
  }
}
