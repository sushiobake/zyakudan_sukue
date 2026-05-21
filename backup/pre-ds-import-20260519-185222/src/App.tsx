import { useEffect, useState } from 'react'
import AdminApp from './admin/AdminApp'
import GameApp from './game/GameApp'

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

  if (route.startsWith('#/admin')) {
    return <AdminApp />
  }

  return <GameApp />
}
