import {NextRequest, NextResponse} from "next/server";
import {
    checkAccessTokenNeedsRefresh,
    login,
    refreshToken,
    setCookieUsingTokenResponse
} from "@/lib/auth/server-jwt-utils";
import {NextURL} from "next/dist/server/web/next-url";

export async function GET(request: NextRequest) {
    // TODO put path into param and use it
    const url = new NextURL(
        '/',
        process.env.NEXT_PUBLIC_URL_BASE
    )
    // Check if access token is valid
    if (!(await checkAccessTokenNeedsRefresh(request))) {
        // Refresh the token and continue
        try {
            const tokenResponse = await refreshToken(request)
            const resp = NextResponse.redirect(url)
            setCookieUsingTokenResponse(resp, tokenResponse)
            return resp
        } catch (error) {
            return login(request, url)
        }
    } else {
        // If the token is valid
        return NextResponse.redirect(url)
    }
}