export type Cliente = {
  id: string
  nome: string
  telefone: string | null
  endereco: string | null
  criado_em: string
}

export type ClienteResumo = Pick<Cliente, 'id' | 'nome' | 'telefone' | 'endereco'>

export type Servico = {
  id: string
  cliente_id: string
  agendamento_id: string | null
  data: string // yyyy-MM-dd
  valor: number | null
  pago: boolean
  observacao: string | null
  criado_em: string
  cliente?: ClienteResumo | null
}

export type StatusAgendamento = 'agendado' | 'concluido' | 'cancelado'

export type Agendamento = {
  id: string
  cliente_id: string
  data: string // yyyy-MM-dd
  hora: string // HH:mm:ss
  descricao: string
  status: StatusAgendamento
  criado_em: string
  cliente?: ClienteResumo | null
}

export type Perfil = { id: string; nome: string }
