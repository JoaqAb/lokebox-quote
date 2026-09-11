// Unica pantalla con texto fijo en el codigo (docs/DECISIONES.md, 11/09/2026).
// Aparece justamente cuando no hay JSON de cliente valido del que sacar texto,
// asi que no puede leer sus textos de texts. En ingles, corta y sin marca.
// Tampoco usa las variables del tema: sin cliente valido no hay tema que aplicar.

type ErrorScreenProps = {
  detail?: string
}

export function ErrorScreen({ detail }: ErrorScreenProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-neutral-950 px-6 py-10 text-center text-neutral-100">
      <h1 className="text-2xl font-semibold tracking-tight">This quote is not available</h1>
      <p className="max-w-md text-sm text-neutral-400">
        Check the link or ask the business for a new one.
      </p>
      {detail === undefined ? null : (
        <p className="max-w-md font-mono text-xs break-words text-neutral-500">{detail}</p>
      )}
    </main>
  )
}
