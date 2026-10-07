import { soDigitos } from './telefone'

export type TipoChave = 'celular' | 'cpf' | 'cnpj' | 'email' | 'aleatoria'

export type DadosPix = {
  tipo: TipoChave
  chave: string
  nome: string
  cidade: string
}

export const TIPOS_CHAVE: { id: TipoChave; rotulo: string; placeholder: string }[] = [
  { id: 'celular', rotulo: 'Celular', placeholder: '(11) 98765-4321' },
  { id: 'cpf', rotulo: 'CPF', placeholder: '000.000.000-00' },
  { id: 'cnpj', rotulo: 'CNPJ', placeholder: '00.000.000/0000-00' },
  { id: 'email', rotulo: 'E-mail', placeholder: 'voce@email.com' },
  { id: 'aleatoria', rotulo: 'Aleatória', placeholder: '123e4567-e89b-12d3-a456-426614174000' },
]

function cpfValido(d: string): boolean {
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  const dv = (base: string, peso: number) => {
    const soma = [...base].reduce((t, n, i) => t + Number(n) * (peso - i), 0)
    const r = (soma * 10) % 11
    return r === 10 ? 0 : r
  }
  return dv(d.slice(0, 9), 10) === Number(d[9]) && dv(d.slice(0, 10), 11) === Number(d[10])
}

function cnpjValido(d: string): boolean {
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false
  const dv = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const r = [...base].reduce((t, n, i) => t + Number(n) * pesos[i], 0) % 11
    return r < 2 ? 0 : 11 - r
  }
  return dv(d.slice(0, 12)) === Number(d[12]) && dv(d.slice(0, 13)) === Number(d[13])
}

/** Chave no formato exigido pelo Pix (celular com +55, documentos só dígitos…). */
export function normalizarChave(tipo: TipoChave, chave: string): string {
  const t = chave.trim()
  switch (tipo) {
    case 'celular': {
      let d = soDigitos(t)
      if (d.startsWith('55') && d.length >= 12) d = d.slice(2)
      return `+55${d}`
    }
    case 'cpf':
    case 'cnpj':
      return soDigitos(t)
    case 'email':
      return t.toLowerCase()
    case 'aleatoria':
      return t.toLowerCase()
  }
}

/** Mensagem de erro, ou null se a chave é válida. */
export function validarChave(tipo: TipoChave, chave: string): string | null {
  const t = chave.trim()
  if (!t) return 'Informe a chave Pix.'
  switch (tipo) {
    case 'celular': {
      const d = normalizarChave('celular', t).slice(3)
      return d.length === 11 || d.length === 10 ? null : 'Celular com DDD, ex.: (11) 98765-4321.'
    }
    case 'cpf':
      return cpfValido(soDigitos(t)) ? null : 'CPF inválido.'
    case 'cnpj':
      return cnpjValido(soDigitos(t)) ? null : 'CNPJ inválido.'
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) && t.length <= 77 ? null : 'E-mail inválido.'
    case 'aleatoria':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t) ? null : 'Chave aleatória inválida (formato 8-4-4-4-12).'
  }
}

/** Chave para exibir (com máscara de CPF/CNPJ/celular). */
export function formatarChave(pix: Pick<DadosPix, 'tipo' | 'chave'>): string {
  const c = normalizarChave(pix.tipo, pix.chave)
  if (pix.tipo === 'cpf') return c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
  if (pix.tipo === 'cnpj') return c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  if (pix.tipo === 'celular') {
    const d = c.slice(3)
    return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  }
  return c
}

export function rotuloTipo(tipo: TipoChave): string {
  return TIPOS_CHAVE.find((t) => t.id === tipo)?.rotulo ?? tipo
}

/** Texto ASCII simples (o BR Code não aceita acentos de forma confiável). */
function ascii(s: string, max: number): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
    .slice(0, max)
}

function campo(id: string, valor: string): string {
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`
}

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), como pede o BR Code. */
function crc16(texto: string): string {
  let crc = 0xffff
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * "Pix copia e cola" estático (BR Code / EMV-QRCPS) com valor.
 * É o mesmo texto que vai dentro do QR Code.
 */
export function gerarPayloadPix(pix: DadosPix, valor?: number, txid = '***'): string {
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', normalizarChave(pix.tipo, pix.chave))
  const partes = [
    campo('00', '01'),
    campo('26', conta),
    campo('52', '0000'),
    campo('53', '986'),
    valor && valor > 0 ? campo('54', valor.toFixed(2)) : '',
    campo('58', 'BR'),
    campo('59', ascii(pix.nome, 25) || 'RECEBEDOR'),
    campo('60', ascii(pix.cidade, 15) || 'BRASIL'),
    campo('62', campo('05', txid)),
  ].join('')
  const semCrc = `${partes}6304`
  return semCrc + crc16(semCrc)
}

export function pixCompleto(p: Partial<DadosPix> | null | undefined): p is DadosPix {
  return Boolean(p?.tipo && p.chave && p.nome && p.cidade && !validarChave(p.tipo, p.chave))
}
