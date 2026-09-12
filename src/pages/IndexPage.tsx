import { Link } from 'react-router-dom'
import { listClientSlugs } from '../clients'

// Indice temporal para verificar el deploy. La landing real es TAREA_011.
// Sin textos de UI: solo la ruta de cada cliente del registro.
// No usa los tokens de control: fuera de una ruta de cliente no hay tema aplicado y
// --q-surface no resuelve. Se sostiene solo, en claro, hasta que la landing lo reemplace.

export function IndexPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-neutral-100 px-6 py-10 text-neutral-900">
      <ul className="flex w-full max-w-xs flex-col gap-3">
        {listClientSlugs().map((slug) => (
          <li key={slug}>
            <Link
              to={`/d/${slug}`}
              className="flex min-h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 font-mono text-sm transition-colors hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              /d/{slug}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
