import { fmtBRL } from '../lib/moeda'
import { cx, inputCls } from './ui'

type Props = {
  /** Valor em centavos; null = não informado. */
  centavos: number | null
  onChange: (centavos: number | null) => void
  autoFocus?: boolean
  grande?: boolean
}

/**
 * Máscara "caixa registradora": cada dígito entra pela direita como centavo
 * (1, 5, 0, 0, 0 → R$ 150,00).
 */
export function CampoValor({ centavos, onChange, autoFocus, grande }: Props) {
  return (
    <input
      className={cx(inputCls, grande && 'py-4 text-2xl font-bold tracking-tight')}
      inputMode="numeric"
      autoComplete="off"
      autoFocus={autoFocus}
      placeholder="R$ 0,00"
      value={centavos == null ? '' : fmtBRL(centavos / 100)}
      onChange={(e) => {
        const digitos = e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10)
        onChange(digitos ? Number(digitos) : null)
      }}
    />
  )
}
