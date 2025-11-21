'use client'

import {JwtSession} from '@/lib/auth/jwt-session'
import React, {createContext, useEffect, useState} from 'react'
import {getJwtSession} from '@/lib/auth/client-session'

// @ts-ignore
export const SessionContext = createContext<JwtSession>()

export default function SessionProvider({
                                            children,
                                            jwtAccessToken,
                                        }: Readonly<{
    children: React.ReactNode
    jwtAccessToken: string
}>) {
    const [session, setSession] = useState<JwtSession>(
        new JwtSession(jwtAccessToken)
    )
    const [runs, setRuns] = useState(0)

    useEffect(() => {
        const refreshTokenInterval = setTimeout(() => {
            getJwtSession()
                .then((newSession) => {
                    // Only update session if it has changed
                    if (newSession.accessToken != session.accessToken) {
                        setSession(() => newSession)
                    }
                    setRuns(runs + 1)
                })
                .catch((reason) => {
                    clearTimeout(refreshTokenInterval)
                })
        }, 5000)

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runs])

    return (
        <SessionContext.Provider value={session}>
            {children}
        </SessionContext.Provider>
    )
}
