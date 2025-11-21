import 'server-only'
import {createRemoteJWKSet} from 'jose'

export const COOKIE_NAME_REFRESH_TOKEN: string = 'refresh_token'
export const COOKIE_NAME_ACCESS_TOKEN: string = 'access_token'
export const COOKIE_NAME_STATE: string = 'state'
export const JWKS = createRemoteJWKSet(
    new URL(`${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/certs`)
)
