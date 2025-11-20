import { decodeJwt, JWTPayload } from 'jose'
import { Roles } from '@/lib/auth/roles'

export type KeycloakJWTPayload = JWTPayload & {
    realm_access?: {
        roles?: string[]
    }
    email?: string
    name?: string
    family_name?: string
    given_name?: string
}

export class JwtSession {
    public readonly accessToken: string

    constructor(accessToken: string) {
        this.accessToken = accessToken
    }

    public getJwtClaims(): KeycloakJWTPayload | null {
        return decodeJwt(this.accessToken)
    }

    public hasRole(role: Roles): boolean {
        return !!this.getJwtClaims()?.realm_access?.roles?.includes(role)
    }

    public authorizationHeader(): { Authorization: string } {
        return { Authorization: `Bearer ${this.accessToken}` }
    }
}
