'use client'

import {JwtSession} from '@/lib/auth/jwt-session'
import {decodeJwt, JWTPayload} from 'jose'

/**
 * This function is used to get the JWT session from the client side.
 */
export async function getJwtSession(): Promise<JwtSession> {
    const jwt = extractAccessTokenFromCookie()

    // If the access token is not there, probably expired
    if (!jwt) {
        console.warn('Access token not found')
        const response = await fetch('/auth/refresh_token')
        if (!response.ok) {
            throw new Error(
                `Could not get access token from server ${response.status}`
            )
        }
    } else {
        const payload = decodeJwt<JWTPayload>(jwt)
        const currentTime = Math.floor(Date.now() / 1000)

        // Check if the token is expired and refresh if needed
        if (!payload.exp || payload.exp < currentTime + 60) {
            const response = await fetch('/auth/refresh_token')
            if (!response.ok) {
                throw new Error(
                    `Could not get access token from server ${response.status}`
                )
            }
        }
    }

    return getStaticJwtSession()
}

/**
 * This function is used to get the JWT session from the client side. Only use this function where there are no operations made with it.
 */
export function getStaticJwtSession(): JwtSession {
    return new JwtSession(extractAccessTokenFromCookie()!)
}

function extractAccessTokenFromCookie(): string | undefined {
    return document?.cookie
        ?.split('; ')
        ?.find((row) => row?.startsWith('access_token='))
        ?.split('=')[1]
}
