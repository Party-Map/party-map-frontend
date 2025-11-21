import {NextRequest, NextResponse} from "next/server";
import {
    checkAccessTokenNeedsRefresh,
    login,
    refreshToken,
    setCookieUsingTokenResponse
} from "@/lib/auth/server-jwt-utils";
import {NextURL} from "next/dist/server/web/next-url";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const callback = searchParams.get("callback") || "/";

    let redirectUrl = new NextURL(callback, process.env.NEXT_PUBLIC_URL_BASE);
    // Check if access token is valid
    if (!(await checkAccessTokenNeedsRefresh(request))) {
        // Refresh the token and continue
        try {
            const tokenResponse = await refreshToken(request)
            const resp = NextResponse.redirect(redirectUrl)
            setCookieUsingTokenResponse(resp, tokenResponse)
            return resp
        } catch (error) {
            return login(request, redirectUrl)
        }
    } else {
        // If the token is valid
        return NextResponse.redirect(redirectUrl)
    }
}