"use client";

import React, {useContext, useEffect} from 'react'
import Link from 'next/link'
import {Ticket, User} from 'lucide-react'
import {SessionContext} from "@/lib/auth/session-provider";

export default function NavActions({variant = 'desktop'}: { variant?: 'desktop' | 'mobile' }) {

    const session = useContext(SessionContext)

    // TODO delete
    useEffect(() => {
        console.log(session.accessToken)
        fetch('http://localhost:8080/jwt-test', {
            headers: {
                'Authorization': 'Bearer ' + session.accessToken,
            }
        }).then(value => {
            value.json().then(jsonValue => {
                console.log(jsonValue)
            })
        })
    }, []);

    const items = [
        {key: 'tickets', href: '/404', label: 'Tickets', Icon: Ticket},
        // { key: 'profile', href: '/404', label: 'Profile', Icon: User },
        {key: 'login', href: '/404', label: 'Login', Icon: User},
    ]

    if (variant === 'mobile') {
        return (
            <div className="grid w-full grid-cols-2">
                {items.map(({key, href, label, Icon}) => (
                    <Link
                        key={key}
                        href={href}
                        className="flex flex-col items-center justify-center gap-1 text-xs opacity-95"
                    >
                        <Icon className="h-5 w-5"/>
                        <span>{label}</span>
                    </Link>
                ))}
            </div>
        )
    }

    // desktop
    return (
        <nav className="flex items-center gap-1">
            {items.map(({key, href, label, Icon}) => (
                <Link
                    key={key}
                    href={href}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm
                     text-white/95 hover:text-white hover:bg-white/10 transition"
                >
                    <Icon className="h-4 w-4"/>
                    <span>{label}</span>
                </Link>
            ))}
        </nav>
    )
}
