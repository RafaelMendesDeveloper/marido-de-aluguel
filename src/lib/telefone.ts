export function soDigitos(s: string): string {
  return s.replace(/\D/g, '')
}

/** Números brasileiros sem DDI (10–11 dígitos) ganham o 55 exigido pelo wa.me. */
export function linkWhatsApp(telefone: string, mensagem?: string): string {
  let d = soDigitos(telefone).replace(/^0+/, '')
  if (d.length === 10 || d.length === 11) d = `55${d}`
  return `https://wa.me/${d}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''}`
}

export function linkMaps(endereco: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`
}

export function formatarTelefone(telefone: string): string {
  const d = soDigitos(telefone)
  const local = d.length === 13 && d.startsWith('55') ? d.slice(2) : d
  const prefixo = local !== d ? '+55 ' : ''
  if (local.length === 11) return `${prefixo}(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  if (local.length === 10) return `${prefixo}(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  return telefone
}
