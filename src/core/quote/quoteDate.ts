// Fecha de la hoja de cotizacion. Pura, sin React.
// Formatea en el dia calendario de quien mira, no en UTC: la hoja dice "hoy" para el
// visitante, y pinchar la zona horaria haria que una cotizacion hecha de noche saliera
// con la fecha del dia siguiente (docs/DECISIONES.md, 11/09/2026).

export function formatQuoteDate(date: Date, locale: string): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return formatter.format(date)
}
