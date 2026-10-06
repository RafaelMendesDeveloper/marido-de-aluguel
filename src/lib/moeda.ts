const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brlInteiro = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function fmtBRL(v: number | null | undefined): string {
  return brl.format(v ?? 0)
}

/** Sem centavos: "R$ 1.250" */
export function fmtBRLInteiro(v: number | null | undefined): string {
  return brlInteiro.format(v ?? 0)
}

/** Rótulo curto para barras: "R$850" ou "1,2k" */
export function fmtCompacto(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace('.', ',').replace(',0', '')}k`
  return `R$${Math.round(v)}`
}

/** Soma tratando valor nulo como 0. */
export function somar<T extends { valor: number | null }>(itens: T[]): number {
  return itens.reduce((t, s) => t + (s.valor ?? 0), 0)
}
