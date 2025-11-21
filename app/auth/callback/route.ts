import {NextRequest, NextResponse} from 'next/server'
import {COOKIE_NAME_STATE, JWKS} from '@/lib/auth/constants'
import {NextURL} from 'next/dist/server/web/next-url'
import {jwtVerify} from 'jose'
import {setCookieUsingTokenResponse, StateCookie, TokenResponse,} from '@/lib/auth/server-jwt-utils'

/**
 * Handle authorization code callback
 * https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationEndpoint
 * @param req
 */
export async function GET(req: NextRequest) {
    // (3.1.2.6.) Check for errors
    const error = req.nextUrl.searchParams.get('error')
    if (error) {
        throw new Error(
            `Got error from callback: ${error} ${req.nextUrl.searchParams.get('error_description')}`
        )
    }

    // Validate state
    const stateCookieRaw = req.cookies.get(COOKIE_NAME_STATE)?.value
    const stateParam = req.nextUrl.searchParams.get('state')
    if (!stateCookieRaw || stateParam !== stateCookieRaw) {
        throw new Error('State param is not valid')
    }

    // 3.1.3.1.  Token Request
    const code = req.nextUrl.searchParams.get('code')!

    const fetchTokenResponseRaw = await fetch(
        `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
        {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: new URLSearchParams({
                client_id: process.env.AUTH_KEYCLOAK_ID!,
                client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: new NextURL(
                    '/auth/callback',
                    process.env.NEXT_PUBLIC_URL_BASE
                ).toString(),
            }),
        }
    )

    const fetchTokenResponse =
        (await fetchTokenResponseRaw.json()) as TokenResponse

    // 3.1.3.4.  Token Error Response
    if (!fetchTokenResponseRaw.ok) {
        throw Error(
            `Could not retrieve tokens with error: ${fetchTokenResponse.error}`
        )
    }

    // 3.1.3.5.  Token Response Validation
    await jwtVerify(fetchTokenResponse.access_token, JWKS)

    // Get the redirect url
    const state = JSON.parse(decodeURI(stateCookieRaw)) as StateCookie

    // Build the response
    const response = NextResponse.redirect(
        new NextURL(state.redirect_path, process.env.NEXT_PUBLIC_URL_BASE)
    )
    setCookieUsingTokenResponse(response, fetchTokenResponse)

    // Remove the state cookie
    response.cookies.set({
        name: COOKIE_NAME_STATE,
        value: '',
        httpOnly: true,
        path: '/',
        maxAge: 0,
    })

    // Update user in the database
    try {
        await updateUser(fetchTokenResponse.access_token)
    } catch (error) {
        /* empty */
    }

    return response
}

/**
 * Update the user in the database
 * @param accessToken
 */
async function updateUser(accessToken: string) {
    // Update user
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL_POSTGREST}/rpc/update_user`,
        {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
        }
    )

    if (response.status != 204) {
        throw new Error(
            `Unable to update user with access token ${accessToken}, got ${response.status}`
        )
    }
}
