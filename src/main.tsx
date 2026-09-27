import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import '@/styles/global.css'
import { App } from '@/app/App'
import { createKeycloakClient } from '@/lib/auth/keycloak'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root not found')

createRoot(container).render(
  <StrictMode>
    <App authClient={createKeycloakClient()} />
  </StrictMode>,
)
