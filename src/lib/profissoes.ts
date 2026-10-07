export type Profissao = { id: string; nome: string; emoji: string; servicos: string[] }

export const PROFISSOES: Profissao[] = [
  {
    id: 'marido-de-aluguel',
    nome: 'Marido de aluguel',
    emoji: '🧰',
    servicos: ['Trocar chuveiro', 'Instalar luminária', 'Montar móvel', 'Trocar torneira', 'Instalar prateleira', 'Trocar tomada', 'Desentupir pia', 'Pequenos reparos'],
  },
  {
    id: 'eletricista',
    nome: 'Eletricista',
    emoji: '⚡',
    servicos: ['Trocar tomada', 'Instalar chuveiro', 'Instalar luminária', 'Ventilador de teto', 'Quadro de disjuntores', 'Revisão elétrica'],
  },
  {
    id: 'encanador',
    nome: 'Encanador',
    emoji: '🚰',
    servicos: ['Trocar torneira', 'Desentupir pia', 'Consertar vazamento', 'Trocar registro', 'Trocar sifão', 'Caixa d’água'],
  },
  {
    id: 'pintor',
    nome: 'Pintor',
    emoji: '🎨',
    servicos: ['Pintura de parede', 'Pintura de porta', 'Massa corrida', 'Textura', 'Pintura externa', 'Retoque'],
  },
  {
    id: 'montador',
    nome: 'Montador de móveis',
    emoji: '🪛',
    servicos: ['Montar guarda-roupa', 'Montar cama', 'Montar rack', 'Desmontar móvel', 'Instalar cortina', 'Fixar TV na parede'],
  },
  { id: 'outro', nome: 'Outro', emoji: '✨', servicos: [] },
]

export function profissaoPorId(id: string | null | undefined): Profissao | undefined {
  return PROFISSOES.find((p) => p.id === id)
}
