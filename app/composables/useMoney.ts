/**
 * Central money formatting for the neutral Ultra scaffold.
 * - Currency display is an explicit placeholder ("XXX") until the real store
 *   currency is configured. Do not assume a market or currency here.
 * - Digits: Latin (0-9) everywhere.
 */
export function useMoney() {
  const currency = 'XXX'

  function format(amount: number | string | null | undefined, decimals = 2): string {
    const n = Number(amount) || 0
    const str = n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    return `${str} ${currency}`
  }

  const currencyLabel = computed(() => currency)

  return { money: format, currencyLabel }
}
