import { Link } from 'react-router-dom'
import { listClientSlugs } from '../clients'

// Indice temporal para verificar el deploy. La landing real es TAREA_008.
// Sin textos de UI: solo la ruta de cada cliente del registro.

export function IndexPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-neutral-950 px-6 py-10 text-neutral-100">
      <ul className="flex w-full max-w-xs flex-col gap-3">
        {listClientSlugs().map((slug) => (
          <li key={slug}>
            <Link
              to={`/d/${slug}`}
              className="flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 font-mono text-sm transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              /d/{slug}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
