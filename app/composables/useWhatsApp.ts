/**
 * Normalize a phone number for a wa.me link.
 * Store contact numbers should be entered in international format
 * (country code + number, no plus). No market-specific prefix is assumed.
 */
export function toWhatsAppIntl(raw: string | null | undefined): string {
  return String(raw || '').replace(/[^0-9]/g, '')
}

export function whatsappLink(raw: string | null | undefined): string {
  return `https://wa.me/${toWhatsAppIntl(raw)}`
}
