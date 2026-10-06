export type ContatoImportado = { nome: string; telefone: string | null }

/**
 * Lê um arquivo .vcf (exportado da agenda do iPhone/Android/Google) e devolve
 * nome + primeiro telefone de cada contato. Suporta vCard 2.1/3.0/4.0,
 * linhas dobradas e QUOTED-PRINTABLE.
 */
export function lerVcf(texto: string): ContatoImportado[] {
  const linhas = desdobrar(texto)
  const contatos: ContatoImportado[] = []
  let fn: string | null = null
  let n: string | null = null
  let tels: string[] = []
  let dentro = false

  for (const linha of linhas) {
    const maiuscula = linha.toUpperCase()
    if (maiuscula.startsWith('BEGIN:VCARD')) {
      dentro = true
      fn = n = null
      tels = []
      continue
    }
    if (maiuscula.startsWith('END:VCARD')) {
      const nome = (fn || n || '').trim()
      if (dentro && nome) contatos.push({ nome, telefone: tels[0] ?? null })
      dentro = false
      continue
    }
    if (!dentro) continue

    const sep = linha.indexOf(':')
    if (sep < 0) continue
    const cabecalho = linha.slice(0, sep)
    const partes = cabecalho.split(';')
    const chave = (partes[0].split('.').pop() ?? '').toUpperCase()
    const params = partes.slice(1).map((p) => p.toUpperCase())
    let valor = linha.slice(sep + 1)
    if (params.some((p) => p.includes('QUOTED-PRINTABLE'))) valor = decodificarQP(valor)

    if (chave === 'FN') {
      fn = desescapar(valor)
    } else if (chave === 'N') {
      const [sobrenome = '', nome = '', meio = ''] = valor.split(';').map(desescapar)
      n = [nome, meio, sobrenome].filter(Boolean).join(' ')
    } else if (chave === 'TEL') {
      const t = valor.replace(/^tel:/i, '').trim()
      if (t) tels.push(t)
    }
  }
  return contatos
}

function desdobrar(texto: string): string[] {
  const brutas = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const linhas: string[] = []
  for (const linha of brutas) {
    const anterior = linhas.length - 1
    if ((linha.startsWith(' ') || linha.startsWith('\t')) && anterior >= 0) {
      linhas[anterior] += linha.slice(1)
    } else if (anterior >= 0 && /QUOTED-PRINTABLE/i.test(linhas[anterior]) && linhas[anterior].endsWith('=')) {
      // quebra "suave" do quoted-printable
      linhas[anterior] = linhas[anterior].slice(0, -1) + linha
    } else {
      linhas.push(linha)
    }
  }
  return linhas
}

function decodificarQP(valor: string): string {
  const bytes: number[] = []
  for (let i = 0; i < valor.length; i++) {
    if (valor[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(valor.slice(i + 1, i + 3))) {
      bytes.push(parseInt(valor.slice(i + 1, i + 3), 16))
      i += 2
    } else {
      bytes.push(valor.charCodeAt(i))
    }
  }
  return new TextDecoder('utf-8').decode(new Uint8Array(bytes))
}

function desescapar(s: string): string {
  return s.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim()
}
