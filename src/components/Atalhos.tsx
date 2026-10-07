import { addDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '../auth/AuthContext'
import { capitalizar, paraISO } from '../lib/datas'
import { profissaoPorId } from '../lib/profissoes'
import { Chip, cx } from './ui'

/** Linha de chips com rolagem horizontal no celular. */
export function LinhaChips({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('sem-barra -mx-5 flex gap-2 overflow-x-auto px-5 pb-0.5 sm:-mx-7 sm:flex-wrap sm:px-7', className)}>{children}</div>
}

const VALORES = [50, 80, 100, 150, 200, 300]

export function ValoresRapidos({ centavos, onEscolher }: { centavos: number | null; onEscolher: (c: number) => void }) {
  return (
    <LinhaChips className="mt-2">
      {VALORES.map((v) => (
        <Chip key={v} ativo={centavos === v * 100} onClick={() => onEscolher(v * 100)}>
          R$ {v}
        </Chip>
      ))}
    </LinhaChips>
  )
}

/** Hoje, Amanhã e os próximos dias (agendamento) ou Hoje/Ontem (serviço). */
export function DatasRapidas({ valor, onEscolher, sentido }: { valor: string; onEscolher: (iso: string) => void; sentido: 'futuro' | 'passado' }) {
  const hoje = new Date()
  const opcoes =
    sentido === 'passado'
      ? [
          { iso: paraISO(hoje), rotulo: 'Hoje' },
          { iso: paraISO(addDays(hoje, -1)), rotulo: 'Ontem' },
          { iso: paraISO(addDays(hoje, -2)), rotulo: capitalizar(format(addDays(hoje, -2), 'EEE d', { locale: ptBR })) },
        ]
      : [0, 1, 2, 3, 4, 5, 6].map((n) => {
          const d = addDays(hoje, n)
          return { iso: paraISO(d), rotulo: n === 0 ? 'Hoje' : n === 1 ? 'Amanhã' : capitalizar(format(d, 'EEE d', { locale: ptBR })) }
        })
  return (
    <LinhaChips className="mb-2">
      {opcoes.map((o) => (
        <Chip key={o.iso} ativo={valor === o.iso} onClick={() => onEscolher(o.iso)}>
          {o.rotulo}
        </Chip>
      ))}
    </LinhaChips>
  )
}

const HORAS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']

export function HorasRapidas({ valor, onEscolher }: { valor: string; onEscolher: (h: string) => void }) {
  return (
    <LinhaChips className="mb-2">
      {HORAS.map((h) => (
        <Chip key={h} ativo={valor === h} onClick={() => onEscolher(h)}>
          {h}
        </Chip>
      ))}
    </LinhaChips>
  )
}

/** Serviços frequentes do usuário (do onboarding) como atalho de texto. */
export function useServicosFrequentes(): string[] {
  const { preferencias } = useAuth()
  if (preferencias.servicosFrequentes.length) return preferencias.servicosFrequentes
  return profissaoPorId(preferencias.profissao)?.servicos ?? profissaoPorId('marido-de-aluguel')!.servicos
}

export function TextosRapidos({ texto, onChange }: { texto: string; onChange: (t: string) => void }) {
  const frequentes = useServicosFrequentes()
  if (!frequentes.length) return null
  const partes = texto
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean)
  return (
    <LinhaChips className="mb-2">
      {frequentes.map((f) => {
        const ativo = partes.includes(f.toLowerCase())
        return (
          <Chip
            key={f}
            ativo={ativo}
            onClick={() => {
              if (ativo) onChange(texto.split(',').map((p) => p.trim()).filter((p) => p && p.toLowerCase() !== f.toLowerCase()).join(', '))
              else onChange(texto.trim() ? `${texto.trim().replace(/,$/, '')}, ${f}` : f)
            }}
          >
            {f}
          </Chip>
        )
      })}
    </LinhaChips>
  )
}
