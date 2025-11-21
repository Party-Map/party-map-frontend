import {NextRequest, NextResponse} from 'next/server'
import {checkAccessTokenNeedsRefresh, refreshToken, setCookieUsingTokenResponse,} from '@/lib/auth/server-jwt-utils'

export async function GET(request: NextRequest) {
    // Check if access token is valid
    if (!(await checkAccessTokenNeedsRefresh(request))) {
        // Refresh the token and continue
        try {
            const tokenResponse = await refreshToken(request)
            const resp = NextResponse.json({})
            setCookieUsingTokenResponse(resp, tokenResponse)
            return resp
        } catch (error) {
            return NextResponse.json(
                {
                    error: error,
                },
                {
                    status: 401,
                }
            )
        }
    }
}
