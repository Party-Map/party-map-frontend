import 'server-only'
import {NextURL} from 'next/dist/server/web/next-url'
import {jwtVerify} from 'jose'
import {NextRequest, NextResponse} from 'next/server'
import {COOKIE_NAME_ACCESS_TOKEN, COOKIE_NAME_REFRESH_TOKEN, JWKS} from '@/lib/auth/constants'

/**
 * https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationEndpoint
 * 3.1.3.3.  Successful Token Response
 */
export type TokenResponse = {
    access_token: string
    expires_in: number
    refresh_token: string
    refresh_expires_in: number
    error?: string
}

/**
 * Custom cookie type to store csrf token and the redirect_url
 */
export type StateCookie = {
    csrf: string
    redirect_path: string
}

/**
 * Initiate the login using standard flow
 * 3.1.2.1.  Authentication Request
 * @param req
 * @param redirect_path redirect to a url if defined, otherwise redirect to the current path
 */
export function login(req: NextRequest, redirect_path?: NextURL) {
    // Create the stateParam which consists of a csrf token and the redirect url (current url)
    const csrf = crypto.randomUUID()
    const state = encodeURI(
        JSON.stringify({
            csrf: csrf,
            redirect_path: redirect_path ? redirect_path.toString() : req.nextUrl.pathname,
        } as StateCookie)
    )

    const url = new NextURL(
        `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/auth`
    )
    url.searchParams.set('client_id', process.env.AUTH_KEYCLOAK_ID!)
    url.searchParams.set(
        'redirect_uri',
        new NextURL(
            '/auth/callback',
            process.env.NEXT_PUBLIC_URL_BASE
        ).toString()
    )
    url.searchParams.set('state', state)
    url.searchParams.set('scope', 'openid')
    url.searchParams.set('response_type', 'code')

    const response = NextResponse.redirect(url)
    response.cookies.set({
        name: 'state',
        value: state,
        httpOnly: true,
        secure: true,
        path: '/',
        maxAge: 300, // 5 minutes max
    })

    return response
}

/**
 * Check if the access token is valid, if not, then return false
 * @param req
 */
export async function checkAccessTokenNeedsRefresh(
    req: NextRequest | NextResponse
): Promise<boolean> {
    const accessToken = req.cookies.get(COOKIE_NAME_ACCESS_TOKEN)?.value

    if (!accessToken) {
        return false
    }

    try {
        const {payload} = await jwtVerify(accessToken, JWKS)

        // Get the current time in seconds
        const currentTimeSeconds = Math.floor(Date.now() / 1000)

        // Check expiry plus 60 seconds
        return !!payload.exp && payload.exp > currentTimeSeconds + 60
    } catch (error) {
        return false
    }
}

/**
 * Refreshes the token if the token expired or will expire soon
 */
export async function refreshToken(req: NextRequest): Promise<TokenResponse> {
    const refreshToken = req.cookies.get(COOKIE_NAME_REFRESH_TOKEN)?.value

    if (!refreshToken) {
        // There is no refresh token for this session
        throw new Error('Missing refresh token')
    }

    // Try to refresh the token
    const fetchToken = await fetch(
        `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
        {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({
                client_id: process.env.AUTH_KEYCLOAK_ID!,
                client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
        }
    )

    const tokenResponse = (await fetchToken.json()) as TokenResponse

    await jwtVerify(tokenResponse.access_token, JWKS)

    if (!fetchToken.ok) {
        throw new Error(
            `Could not retrieve tokens with error: ${tokenResponse.error}`
        )
    }

    return tokenResponse
}

export function setCookieUsingTokenResponse(
    resp: NextResponse<any>,
    tokenResponse: TokenResponse
) {
    // Set access token
    resp.cookies.set({
        name: COOKIE_NAME_ACCESS_TOKEN,
        value: tokenResponse.access_token,
        secure: true,
        path: '/',
        maxAge: tokenResponse.expires_in,
    })

    // Set refresh token (http only)
    resp.cookies.set({
        name: COOKIE_NAME_REFRESH_TOKEN,
        value: tokenResponse.refresh_token,
        httpOnly: true,
        secure: true,
        path: '/',
        maxAge: tokenResponse.refresh_expires_in,
    })
}
