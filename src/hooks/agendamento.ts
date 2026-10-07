import { mudarStatusAgendamento } from '../api/agendamentos'
import { mensagemErro, useFeedback } from '../components/Feedback'
import type { Agendamento } from '../types'
import { useInvalidar } from './dados'

/** Confirma e cancela um agendamento. Devolve true se cancelou. */
export function useCancelarAgendamento() {
  const { avisar, confirmar } = useFeedback()
  const invalidar = useInvalidar()
  return async (a: Agendamento): Promise<boolean> => {
    const ok = await confirmar({
      titulo: 'Cancelar agendamento?',
      mensagem: `${a.cliente?.nome ?? 'Cliente'} — ${a.descricao}`,
      confirmar: 'Cancelar agendamento',
      cancelar: 'Manter',
      perigo: true,
    })
    if (!ok) return false
    try {
      await mudarStatusAgendamento(a.id, 'cancelado')
      await invalidar()
      avisar('Agendamento cancelado')
      return true
    } catch (e) {
      avisar(mensagemErro(e), 'erro')
      return false
    }
  }
}
