import {decodeJwt, JWTPayload} from 'jose'
import {ADMIN_ROLES, Role} from '@/lib/auth/role'

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

    public hasRole(role: Role): boolean {
        return this.getRoles().includes(role)
    }

    public getRoles(): Role[] {
        let rawRoles = this.getJwtClaims()?.roles as string[] | undefined

        // If there are no roles return an empty array
        if (!rawRoles?.length) return []

        return rawRoles.filter((r): r is Role => Object.values(Role).includes(r as Role));
    }

    public isAdmin(): boolean {
        return this.getRoles().some(role => ADMIN_ROLES.includes(role))
    }

    public authorizationHeader(): { Authorization: string } {
        return {Authorization: `Bearer ${this.accessToken}`}
    }
}
