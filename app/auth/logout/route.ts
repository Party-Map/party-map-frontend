import {NextRequest, NextResponse} from 'next/server'
import {COOKIE_NAME_ACCESS_TOKEN, COOKIE_NAME_REFRESH_TOKEN,} from '@/lib/auth/constants'
import {NextURL} from 'next/dist/server/web/next-url'

/**
 * Logout the user by calling the Keycloak logout endpoint and deleting the cookies
 * @param req
 */
async function logout(req: NextRequest) {
    const accessToken = req.cookies.get(COOKIE_NAME_ACCESS_TOKEN)?.value
    const refreshToken = req.cookies.get(COOKIE_NAME_REFRESH_TOKEN)?.value

    if (accessToken && refreshToken) {
        await fetch(
            `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/logout`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: new URLSearchParams({
                    client_id: process.env.AUTH_KEYCLOAK_ID!,
                    client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
                    refresh_token: refreshToken,
                }),
            }
        )
    }

    const response = NextResponse.redirect(
        new NextURL('/auth/logout/success/', process.env.NEXT_PUBLIC_URL_BASE!)
    )

    // Delete cookies

    // Set access token
    response.cookies.set({
        name: COOKIE_NAME_ACCESS_TOKEN,
        value: '',
        path: '/',
        maxAge: 0,
    })

    // Set refresh token
    response.cookies.set({
        name: COOKIE_NAME_REFRESH_TOKEN,
        value: '',
        httpOnly: true,
        path: '/',
        maxAge: 0,
    })

    return response
}

export async function GET(req: NextRequest) {
    return await logout(req)
}

export async function POST(req: NextRequest) {
    return await logout(req)
}
