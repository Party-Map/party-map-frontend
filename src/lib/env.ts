export type AppEnv = {
  apiBaseUrl: string
  keycloakUrl: string
  keycloakRealm: string
  keycloakClientId: string
}

function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`)
  }
  return value.replace(/\/+$/, '')
}

/** Read the public runtime configuration. Values are baked in at build time by Vite. */
export function getEnv(): AppEnv {
  return {
    apiBaseUrl: required('VITE_API_BASE_URL'),
    keycloakUrl: required('VITE_KEYCLOAK_URL'),
    keycloakRealm: required('VITE_KEYCLOAK_REALM'),
    keycloakClientId: required('VITE_KEYCLOAK_CLIENT_ID'),
  }
}
