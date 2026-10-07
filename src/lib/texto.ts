/** Minúsculas, sem acento e sem espaços nas pontas — para busca e comparação. */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ')
}

export function inicial(nome: string): string {
  return (nome.trim().charAt(0) || '?').toUpperCase()
}

const TRATAMENTOS = new Set(['dona', 'seu', 'sr', 'sr.', 'sra', 'sra.', 'dr', 'dr.', 'dra', 'dra.', 'tia', 'tio', 'vó', 'vô'])

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? ''
}

/** Como chamar o cliente: "Dona Cida Ferreira" → "Dona Cida"; "Marcos Lima" → "Marcos". */
export function vocativo(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  return TRATAMENTOS.has(partes[0]?.toLowerCase() ?? '') && partes[1] ? `${partes[0]} ${partes[1]}` : (partes[0] ?? '')
}

export function vazioParaNull(s: string | null | undefined): string | null {
  const t = (s ?? '').trim()
  return t ? t : null
}
