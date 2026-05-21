import { lazy, Suspense, useEffect, useState } from 'react'
import { ADMIN_ENABLED } from './config/features'
import GameApp from './game/GameApp'

const AdminApp = lazy(() => import('./admin/AdminApp'))

function useHashRoute(): string {
  const [route, setRoute] = useState(() => window.location.hash || '#/')

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return route
}

export default function App() {
  const route = useHashRoute()

  useEffect(() => {
    if (!ADMIN_ENABLED && route.startsWith('#/admin')) {
      window.location.hash = '#/'
    }
  }, [route])

  if (ADMIN_ENABLED && route.startsWith('#/admin')) {
    return (
      <Suspense
        fallback={
          <div className="vn-root vn-root--loading">
            <p className="vn-loading-text">読み込み中…</p>
          </div>
        }
      >
        <AdminApp />
      </Suspense>
    )
  }

  return <GameApp />
}
