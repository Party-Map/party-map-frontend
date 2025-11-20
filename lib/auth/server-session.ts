import 'server-only'
import { cookies } from 'next/headers'
import { COOKIE_NAME_ACCESS_TOKEN } from '@/lib/auth/constants'
import { JwtSession } from '@/lib/auth/jwt-session'

export async function getJwtSession(): Promise<JwtSession | null> {
    const accessToken = (await cookies()).get(COOKIE_NAME_ACCESS_TOKEN)?.value
    if (!accessToken) {
        return null
    }
    return new JwtSession(accessToken)
}
