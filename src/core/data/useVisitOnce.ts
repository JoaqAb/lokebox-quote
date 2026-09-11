import { useEffect } from 'react'
import { buildVisitRow, visitKey } from '../lead/visit'
import { insertRow } from './insertRow'

// Una visita por sesion y por slug. sessionStorage va adentro de un try: en modo
// privado de algunos navegadores lanza, y en ese caso se inserta igual y se sigue.

export function useVisitOnce(slug: string): void {
  useEffect(() => {
    const key = visitKey(slug)
    let alreadyVisited = false
    try {
      alreadyVisited = window.sessionStorage.getItem(key) !== null
      if (!alreadyVisited) {
        window.sessionStorage.setItem(key, '1')
      }
    } catch {
      alreadyVisited = false
    }
    if (alreadyVisited) {
      return
    }
    void insertRow('visits', buildVisitRow(slug, navigator.userAgent, document.referrer))
  }, [slug])
}
