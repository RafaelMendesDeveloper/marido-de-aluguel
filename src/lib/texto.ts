/** Minúsculas, sem acento e sem espaços nas pontas — para busca e comparação. */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ')
}

export function inicial(nome: string): string {
  return (nome.trim().charAt(0) || '?').toUpperCase()
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? ''
}

export function vazioParaNull(s: string | null | undefined): string | null {
  const t = (s ?? '').trim()
  return t ? t : null
}
