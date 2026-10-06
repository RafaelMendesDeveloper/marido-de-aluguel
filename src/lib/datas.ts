import { addDays, addMonths, format, parseISO, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Todas as datas "do dia" usam o fuso LOCAL do aparelho (o app antigo usava UTC
// e virava o dia às 21h no Brasil).

export function paraISO(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** 'yyyy-MM-dd' → Date à meia-noite local. */
export function deISO(iso: string): Date {
  return parseISO(iso)
}

export function hojeISO(): string {
  return paraISO(new Date())
}

export function amanhaISO(): string {
  return paraISO(addDays(new Date(), 1))
}

/** Semana começa na segunda-feira (Histórico e calendário). */
export function inicioSemanaISO(): string {
  return paraISO(startOfWeek(new Date(), { weekStartsOn: 1 }))
}

/** mes: 1–12. fim é exclusivo. */
export function intervaloMes(ano: number, mes: number) {
  const inicio = new Date(ano, mes - 1, 1)
  return { inicio: paraISO(inicio), fim: paraISO(addMonths(inicio, 1)) }
}

export function intervaloAno(ano: number) {
  return { inicio: `${ano}-01-01`, fim: `${ano + 1}-01-01` }
}

export function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "Terça-feira, 6 de outubro" */
export function dataPorExtenso(d: Date | string): string {
  const data = typeof d === 'string' ? deISO(d) : d
  return capitalizar(format(data, "EEEE, d 'de' MMMM", { locale: ptBR }))
}

/** "Terça-feira, 6 de outubro de 2026" */
export function dataPorExtensoComAno(d: Date | string): string {
  const data = typeof d === 'string' ? deISO(d) : d
  return capitalizar(format(data, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }))
}

/** "05/10/2026" */
export function dataCurta(iso: string): string {
  return format(deISO(iso), 'dd/MM/yyyy')
}

/** "Seg, 05 out 2026" */
export function dataGrupo(iso: string): string {
  return capitalizar(format(deISO(iso), 'EEE, dd MMM yyyy', { locale: ptBR }))
}

/** "5 out" */
export function dataDiaMes(iso: string): string {
  return format(deISO(iso), 'd MMM', { locale: ptBR })
}

/** "Outubro 2026" */
export function mesAno(ano: number, mes: number): string {
  return capitalizar(format(new Date(ano, mes - 1, 1), 'MMMM yyyy', { locale: ptBR }))
}

/** "Out 2026" */
export function mesAnoCurto(ano: number, mes: number): string {
  return capitalizar(format(new Date(ano, mes - 1, 1), 'MMM yyyy', { locale: ptBR }))
}

/** Hora local de um timestamp ISO, ou null se for de outro dia que não `dataISO`. */
export function horaDoRegistro(criadoEm: string | null, dataISO: string): string | null {
  if (!criadoEm) return null
  const d = new Date(criadoEm)
  if (Number.isNaN(d.getTime()) || paraISO(d) !== dataISO) return null
  return format(d, 'HH:mm')
}

/** "09:00:00" → "09:00" */
export function horaCurta(hora: string): string {
  return hora.slice(0, 5)
}
