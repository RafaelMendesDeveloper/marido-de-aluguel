import { dataCurta, dataPorExtensoComAno, hojeISO } from './datas'
import { fmtBRL } from './moeda'
import { formatarChave, rotuloTipo, type DadosPix } from './pix'
import { vocativo } from './texto'

export type ItemCobranca = { data: string; descricao: string; valor: number }

export type DadosCobranca = {
  profissional: string
  profissao?: string
  cliente: string
  itens: ItemCobranca[]
  pix: DadosPix
}

export function totalCobranca(itens: ItemCobranca[]): number {
  return itens.reduce((t, i) => t + i.valor, 0)
}

/** Mensagem que acompanha a imagem no WhatsApp, com o Pix copia e cola no fim. */
export function textoCobranca(d: DadosCobranca, payload: string): string {
  const primeiro = vocativo(d.cliente)
  const linhas = d.itens.map((i) => `• ${dataCurta(i.data).slice(0, 5)} — ${i.descricao}: ${fmtBRL(i.valor)}`)
  return [
    `Olá, ${primeiro}! Tudo bem?`,
    d.itens.length === 1 ? 'Segue o resumo do serviço:' : 'Segue o resumo dos serviços:',
    '',
    ...linhas,
    '',
    `*Total: ${fmtBRL(totalCobranca(d.itens))}*`,
    '',
    `Para pagar, use o Pix copia e cola abaixo (o valor já vem preenchido) ou a chave ${rotuloTipo(d.pix.tipo)}: ${formatarChave(d.pix)}`,
    '',
    payload,
    '',
    'Obrigado!',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Imagem (canvas)
// ---------------------------------------------------------------------------

const FONTE = '"Plus Jakarta Sans Variable", system-ui, -apple-system, "Segoe UI", sans-serif'
const COR = {
  tinta: '#161b18',
  texto: '#3b423d',
  suave: '#6b736d',
  linha: '#eceeec',
  fundo: '#f6f7f6',
  marca: '#16a34a',
  marcaEscura: '#15803d',
  marcaClara: '#effdf4',
  marcaBorda: '#bbf7d0',
}

const L = 1080
const M = 72
const MAX_LINHAS = 8

function fonte(ctx: CanvasRenderingContext2D, peso: number, tamanho: number) {
  ctx.font = `${peso} ${tamanho}px ${FONTE}`
}

/** Corta o texto com "…" para caber na largura. */
function caber(ctx: CanvasRenderingContext2D, texto: string, largura: number): string {
  if (ctx.measureText(texto).width <= largura) return texto
  let t = texto
  while (t.length > 1 && ctx.measureText(`${t}…`).width > largura) t = t.slice(0, -1)
  return `${t.trimEnd()}…`
}

function retangulo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

async function carregarFontes() {
  if (!('fonts' in document)) return
  await Promise.all([400, 600, 700, 800].map((p) => document.fonts.load(`${p} 32px ${FONTE}`).catch(() => undefined)))
}

/** Gera a imagem PNG da cobrança: serviços, total e QR Code Pix com o valor. */
export async function gerarImagemCobranca(d: DadosCobranca, payload: string): Promise<Blob> {
  const [QR] = await Promise.all([import('qrcode'), carregarFontes()])
  const qr = document.createElement('canvas')
  await QR.toCanvas(qr, payload, { width: 420, margin: 1, errorCorrectionLevel: 'M', color: { dark: COR.tinta, light: '#ffffff' } })

  const visiveis = d.itens.slice(0, MAX_LINHAS)
  const ocultos = d.itens.slice(MAX_LINHAS)
  const linhasTabela = visiveis.length + (ocultos.length ? 1 : 0)
  const total = totalCobranca(d.itens)

  const H_TOPO = 280
  const H_LINHA = 84
  const altura = H_TOPO + 64 + 150 + 64 + linhasTabela * H_LINHA + 40 + 132 + 72 + 140 + 420 + 40 + 170 + 96

  const canvas = document.createElement('canvas')
  canvas.width = L
  canvas.height = altura
  const ctx = canvas.getContext('2d')!
  ctx.textBaseline = 'alphabetic'

  // Fundo
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, L, altura)

  // Topo verde
  const grad = ctx.createLinearGradient(0, 0, L, H_TOPO)
  grad.addColorStop(0, '#15803d')
  grad.addColorStop(0.6, '#16a34a')
  grad.addColorStop(1, '#10b981')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, L, H_TOPO)
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  ctx.beginPath()
  ctx.arc(L - 60, 20, 220, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  fonte(ctx, 800, 24)
  ctx.fillText('COBRANÇA', M, 92)
  ctx.textAlign = 'right'
  fonte(ctx, 600, 26)
  ctx.fillText(dataCurta(hojeISO()), L - M, 92)
  ctx.textAlign = 'left'

  ctx.fillStyle = '#ffffff'
  fonte(ctx, 800, 56)
  ctx.fillText(caber(ctx, d.profissional, L - 2 * M), M, 170)
  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  fonte(ctx, 500, 30)
  ctx.fillText(caber(ctx, d.profissao || 'Prestação de serviços', L - 2 * M), M, 222)

  // Cliente
  let y = H_TOPO + 64
  ctx.fillStyle = COR.suave
  fonte(ctx, 600, 26)
  ctx.fillText('Para', M, y + 26)
  ctx.fillStyle = COR.tinta
  fonte(ctx, 800, 46)
  ctx.fillText(caber(ctx, d.cliente, L - 2 * M), M, y + 84)
  ctx.fillStyle = COR.suave
  fonte(ctx, 500, 26)
  ctx.fillText(`Emitida em ${dataPorExtensoComAno(hojeISO()).replace(/^[^,]+, /, '')}`, M, y + 128)
  y += 150 + 24

  // Tabela
  const xDesc = M + 150
  const larguraDesc = L - M - xDesc - 230
  ctx.fillStyle = COR.suave
  fonte(ctx, 700, 22)
  ctx.fillText('DATA', M, y + 24)
  ctx.fillText('SERVIÇO', xDesc, y + 24)
  ctx.textAlign = 'right'
  ctx.fillText('VALOR', L - M, y + 24)
  ctx.textAlign = 'left'
  y += 40
  ctx.fillStyle = COR.linha
  ctx.fillRect(M, y, L - 2 * M, 2)

  const linha = (data: string, descricao: string, valor: number, apagado = false) => {
    ctx.fillStyle = COR.texto
    fonte(ctx, 600, 28)
    ctx.fillText(data, M, y + 54)
    ctx.fillStyle = apagado ? COR.suave : COR.tinta
    fonte(ctx, 600, 30)
    ctx.fillText(caber(ctx, descricao, larguraDesc), xDesc, y + 54)
    ctx.textAlign = 'right'
    fonte(ctx, 800, 30)
    ctx.fillStyle = COR.tinta
    ctx.fillText(fmtBRL(valor), L - M, y + 54)
    ctx.textAlign = 'left'
    y += H_LINHA
    ctx.fillStyle = COR.linha
    ctx.fillRect(M, y - 2, L - 2 * M, 2)
  }
  for (const i of visiveis) linha(dataCurta(i.data).slice(0, 5), i.descricao || 'Serviço', i.valor)
  if (ocultos.length) linha('', `+ ${ocultos.length} outro${ocultos.length > 1 ? 's' : ''} serviço${ocultos.length > 1 ? 's' : ''}`, totalCobranca(ocultos), true)

  // Total
  y += 40
  ctx.fillStyle = COR.marcaClara
  retangulo(ctx, M, y, L - 2 * M, 132, 28)
  ctx.fill()
  ctx.strokeStyle = COR.marcaBorda
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = COR.marcaEscura
  fonte(ctx, 700, 30)
  ctx.fillText('Total a pagar', M + 40, y + 78)
  ctx.textAlign = 'right'
  fonte(ctx, 800, 58)
  ctx.fillText(fmtBRL(total), L - M - 40, y + 86)
  ctx.textAlign = 'left'
  y += 132 + 72

  // Pix
  ctx.textAlign = 'center'
  ctx.fillStyle = COR.tinta
  fonte(ctx, 800, 42)
  ctx.fillText('Pague com Pix', L / 2, y + 40)
  ctx.fillStyle = COR.suave
  fonte(ctx, 500, 26)
  ctx.fillText('Abra o app do banco  ›  Pix  ›  Ler QR code', L / 2, y + 84)
  y += 140

  const xQr = (L - 420) / 2
  ctx.fillStyle = '#ffffff'
  retangulo(ctx, xQr - 24, y - 24, 468, 468, 32)
  ctx.fill()
  ctx.strokeStyle = COR.linha
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.drawImage(qr, xQr, y, 420, 420)
  y += 420 + 40

  ctx.fillStyle = COR.marca
  fonte(ctx, 700, 24)
  ctx.fillText(`Valor de ${fmtBRL(total)} já incluso no QR Code`, L / 2, y + 28)
  ctx.fillStyle = COR.suave
  fonte(ctx, 600, 24)
  ctx.fillText(`Chave Pix (${rotuloTipo(d.pix.tipo)})`, L / 2, y + 76)
  ctx.fillStyle = COR.tinta
  fonte(ctx, 700, 34)
  ctx.fillText(caber(ctx, formatarChave(d.pix), L - 2 * M), L / 2, y + 120)
  ctx.fillStyle = COR.suave
  fonte(ctx, 500, 24)
  ctx.fillText(caber(ctx, `Recebedor: ${d.pix.nome}`, L - 2 * M), L / 2, y + 158)
  y += 170

  // Rodapé
  ctx.fillStyle = COR.fundo
  ctx.fillRect(0, altura - 96, L, 96)
  ctx.fillStyle = COR.suave
  fonte(ctx, 600, 22)
  ctx.fillText('Gerado com Orça! — agenda e cobrança para profissionais de reparos', L / 2, altura - 40)
  ctx.textAlign = 'left'

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Não foi possível gerar a imagem.'))), 'image/png'))
}
